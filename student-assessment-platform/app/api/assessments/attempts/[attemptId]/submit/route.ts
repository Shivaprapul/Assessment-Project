/**
 * Submit Assessment API Route
 * 
 * Handles submitting a completed assessment.
 * Calculates scores and updates skill tree.
 * 
 * Multi-tenancy: All routes automatically filter by tenant_id from JWT token
 * Authorization: Students can only submit their own attempts
 * 
 * @module app/api/assessments/attempts/[attemptId]/submit
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { submitAssessmentSchema } from '@/lib/validators';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';
import { getGameConfig, getAllGames } from '@/lib/games';
import { generateDemoQuestions, calculateDemoScore } from '@/lib/demo-questions';
import { generateDemoReport } from '@/lib/demo-report-generator';
import { generateGradeContextualSummary } from '@/lib/grade-aware-content';
import { getCurrentSkillBand } from '@/lib/skill-expectation-helpers';
import { SkillCategory } from '@prisma/client';

/**
 * POST /api/assessments/attempts/:attemptId/submit
 * 
 * Submit completed assessment
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  const params = await context.params;
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        // Only students can submit their attempts
        if (user.role !== 'STUDENT') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Only students can submit assessments',
              },
            },
            { status: 403 }
          );
        }

        const { attemptId } = params;

        // Get student profile
        const student = await db.studentProfile.findUnique({
          where: {
            userId: user.id,
            tenantId,
          },
        });

        if (!student) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Student profile not found',
              },
            },
            { status: 404 }
          );
        }

        // Find the attempt
        const attempt = await db.assessmentAttempt.findFirst({
          where: {
            id: attemptId,
            studentId: student.id,
            tenantId,
          },
        });

        if (!attempt) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Assessment attempt not found',
              },
            },
            { status: 404 }
          );
        }

        if (attempt.status !== 'IN_PROGRESS') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Cannot submit a completed or abandoned attempt',
              },
            },
            { status: 400 }
          );
        }

        // Parse and validate request body
        const body = await req.json();
        const validated = submitAssessmentSchema.parse(body);

        // Get game config for skill mapping
        const gameConfig = getGameConfig(attempt.gameId);
        const targetCategories = gameConfig?.targetCategories || [];

        // Use demo scoring if DEMO_ASSESSMENTS is enabled
        const isDemoMode = process.env.DEMO_ASSESSMENTS === 'true';
        let rawScores: any;
        let normalizedScores: Record<string, number> = {};
        let strengths: string[] = [];
        let growthAreas: string[] = [];

        if (isDemoMode) {
          // Generate questions with same seed to calculate deterministic scores
          const seed = `${user.id}-${attempt.id}`;
          const questions = generateDemoQuestions(attempt.gameId, seed, validated.answers.length);
          
          const timeSpent = validated.telemetry.timeSpent || 0;
          const hintsUsed = validated.telemetry.hintsUsed || 0;
          
          const scoreResult = calculateDemoScore(questions, validated.answers, timeSpent, hintsUsed);
          
          rawScores = {
            correctAnswers: Math.round((scoreResult.accuracy / 100) * questions.length),
            totalQuestions: questions.length,
            accuracy: scoreResult.accuracy,
            avgTimePerQuestion: scoreResult.avgTimePerQuestion,
            timeSpent,
            hintsUsed,
          };

          // Map normalized score to target categories
          targetCategories.forEach((category) => {
            normalizedScores[category.toLowerCase()] = scoreResult.normalizedScore;
          });

          strengths = scoreResult.strengths;
          growthAreas = scoreResult.growthAreas;
        } else {
          // Original scoring logic (for future real games)
          const totalQuestions = validated.answers.length;
          const correctAnswers = validated.answers.filter((a: any) => a !== null && a !== undefined).length;
          const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
          const timeSpent = validated.telemetry.timeSpent || 0;
          const avgTimePerQuestion = totalQuestions > 0 ? Math.round(timeSpent / totalQuestions) : 0;

          rawScores = {
            correctAnswers,
            totalQuestions,
            accuracy,
            avgTimePerQuestion,
          };

          targetCategories.forEach((category) => {
            normalizedScores[category.toLowerCase()] = accuracy;
          });
        }

        // Update attempt with completion
        const completedAttempt = await db.assessmentAttempt.update({
          where: {
            id: attemptId,
          },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            rawScores,
            normalizedScores,
            reflectionText: validated.reflectionText,
            telemetry: {
              ...(attempt.telemetry as object || {}),
              ...validated.telemetry,
            },
          },
        });

        // Update skill scores (simplified - in production, use proper aggregation)
        for (const [category, score] of Object.entries(normalizedScores)) {
          const skillCategory = category.toUpperCase() as any;
          
          // Get existing skill score if it exists
          const existingScore = await db.skillScore.findUnique({
            where: {
              studentId_category: {
                studentId: student.id,
                category: skillCategory,
              },
            },
          });

          const newEvidence = `Assessment: ${gameConfig?.name || attempt.gameId}`;
          const newHistoryEntry = { date: new Date().toISOString(), score };

          if (existingScore) {
            // Update existing score
            const existingEvidence = (existingScore.evidence || []) as string[];
            const existingHistory = (existingScore.history || []) as Array<{ date: string; score: number }>;
            
            await db.skillScore.update({
              where: {
                studentId_category: {
                  studentId: student.id,
                  category: skillCategory,
                },
              },
              data: {
                score: score,
                level: score >= 80 ? 'ADVANCED' : score >= 60 ? 'PROFICIENT' : score >= 40 ? 'DEVELOPING' : 'EMERGING',
                lastUpdatedAt: new Date(),
                evidence: [...existingEvidence, newEvidence],
                history: [...existingHistory, newHistoryEntry],
              },
            });
          } else {
            // Create new score
            await db.skillScore.create({
              data: {
                studentId: student.id,
                tenantId,
                category: skillCategory,
                score: score,
                level: score >= 80 ? 'ADVANCED' : score >= 60 ? 'PROFICIENT' : score >= 40 ? 'DEVELOPING' : 'EMERGING',
                trend: 'STABLE',
                evidence: [newEvidence],
                history: [newHistoryEntry],
              },
            });
          }
        }

        // Check if all 8 games are completed
        const allGames = getAllGames();
        const completedAttempts = await db.assessmentAttempt.findMany({
          where: {
            studentId: student.id,
            tenantId,
            status: 'COMPLETED',
          },
          select: {
            gameId: true,
          },
        });

        const completedGameIds = new Set(completedAttempts.map(a => a.gameId));
        const allGamesCompleted = allGames.every(game => completedGameIds.has(game.id));

        // Update student profile if all assessments complete
        if (allGamesCompleted && !student.assessmentComplete) {
          await db.studentProfile.update({
            where: {
              id: student.id,
            },
            data: {
              assessmentComplete: true,
            },
          });

          // Generate demo AI report if in demo mode
          if (isDemoMode) {
            try {
              const allCompletedAttempts = await db.assessmentAttempt.findMany({
                where: {
                  studentId: student.id,
                  tenantId,
                  status: 'COMPLETED',
                },
                select: {
                  gameId: true,
                },
              });
              await generateDemoReport(student.id, tenantId, allCompletedAttempts.map(a => a.gameId));
            } catch (err) {
              console.error('Error generating demo report:', err);
              // Don't fail the submission if report generation fails
            }
          }
        }

        // Find next game
        const currentGameIndex = allGames.findIndex(g => g.id === attempt.gameId);
        const nextGame = currentGameIndex < allGames.length - 1 
          ? allGames[currentGameIndex + 1]
          : null;

        // Get grade-contextual summary if all games completed
        const studentGrade = student.currentGrade || 8;
        let gradeContextualSummary = null;
        
        if (allGamesCompleted) {
          try {
            // Get current skill bands from skill scores
            const allSkillScores = await db.skillScore.findMany({
              where: {
                studentId: student.id,
                tenantId,
              },
            });
            
            const skillBands: Record<SkillCategory, any> = {} as any;
            for (const skillScore of allSkillScores) {
              // Get current skill band (placeholder - will be replaced with actual calculation)
              const band = await getCurrentSkillBand(student.id, skillScore.category);
              skillBands[skillScore.category] = band;
            }
            
            // Generate grade-contextual summary
            gradeContextualSummary = generateGradeContextualSummary(skillBands, studentGrade as 8 | 9 | 10);
          } catch (err) {
            console.error('Error generating grade-contextual summary:', err);
            // Don't fail the submission if summary generation fails
          }
        }

        return successResponse({
          attemptId: completedAttempt.id,
          status: completedAttempt.status,
          completedAt: completedAttempt.completedAt,
          rawScores,
          ...(isDemoMode && {
            strengths,
            growthAreas,
          }),
          message: allGamesCompleted 
            ? 'Congratulations! You\'ve completed all assessments. Your comprehensive report is ready!'
            : 'Great work! Your results are being processed.',
          ...(nextGame && {
            nextGame: {
              id: nextGame.id,
              name: nextGame.name,
            },
          }),
          allGamesCompleted,
          ...(gradeContextualSummary && {
            gradeContextualSummary: {
              overallInsight: gradeContextualSummary.overallInsight,
              // Don't expose full interpretations to student UI (for parent/teacher only)
            },
          }),
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                details: error.issues,
              },
            },
            { status: 400 }
          );
        }
        return handleAPIError(error);
      }
    })
  )(req);
}

