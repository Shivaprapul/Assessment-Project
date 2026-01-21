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

        // Calculate raw scores (simplified - in production, this would validate answers server-side)
        const totalQuestions = validated.answers.length;
        const correctAnswers = validated.answers.filter((a: any) => a !== null && a !== undefined).length;
        const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        const timeSpent = validated.telemetry.timeSpent || 0;
        const avgTimePerQuestion = totalQuestions > 0 ? Math.round(timeSpent / totalQuestions) : 0;

        const rawScores = {
          correctAnswers,
          totalQuestions,
          accuracy,
          avgTimePerQuestion,
        };

        // Get game config for skill mapping
        const gameConfig = getGameConfig(attempt.gameId);
        const targetCategories = gameConfig?.targetCategories || [];

        // Calculate normalized scores (simplified - in production, use proper normalization)
        const normalizedScores: Record<string, number> = {};
        targetCategories.forEach((category) => {
          // Simple normalization: accuracy percentage as base score
          normalizedScores[category.toLowerCase()] = accuracy;
        });

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

          // TODO: Enqueue AI report generation job
        }

        // Find next game
        const currentGameIndex = allGames.findIndex(g => g.id === attempt.gameId);
        const nextGame = currentGameIndex < allGames.length - 1 
          ? allGames[currentGameIndex + 1]
          : null;

        return successResponse({
          attemptId: completedAttempt.id,
          status: completedAttempt.status,
          completedAt: completedAttempt.completedAt,
          rawScores,
          message: 'Great work! Your results are being processed.',
          ...(nextGame && {
            nextGame: {
              id: nextGame.id,
              name: nextGame.name,
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

