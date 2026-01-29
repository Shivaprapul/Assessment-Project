/**
 * Demo Assessment Submit API Route
 * 
 * Simplified demo endpoint for submitting assessments.
 * Always returns JSON, never HTML.
 * 
 * @module app/api/demo/assessments/submit
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { getGameConfig, getAllGames } from '@/lib/games';
import { generateDemoQuestions, calculateDemoScore } from '@/lib/demo-questions';
import { generateDemoReport } from '@/lib/demo-report-generator';

/**
 * POST /api/demo/assessments/submit
 * 
 * Submit a demo assessment attempt
 */
export async function POST(req: NextRequest) {
  try {
    // Check if demo mode is enabled
    if (process.env.DEMO_ASSESSMENTS !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: 'Demo mode is not enabled. Set DEMO_ASSESSMENTS=true in .env',
        },
        { status: 400 }
      );
    }

    return requireAuth(
      withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
        try {
          // Only students can submit assessments
          if (user.role !== 'STUDENT') {
            return NextResponse.json(
              {
                success: false,
                error: 'Only students can submit assessments',
              },
              { status: 403 }
            );
          }

          // Parse request body
          const body = await req.json().catch(() => ({}));
          const { attemptId, gameId, answers, telemetrySummary } = body;

          if (!attemptId || !gameId || !answers) {
            return NextResponse.json(
              {
                success: false,
                error: 'attemptId, gameId, and answers are required',
              },
              { status: 400 }
            );
          }

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
                error: 'Student profile not found',
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
              gameId,
            },
          });

          if (!attempt) {
            return NextResponse.json(
              {
                success: false,
                error: 'Assessment attempt not found',
              },
              { status: 404 }
            );
          }

          if (attempt.status !== 'IN_PROGRESS') {
            return NextResponse.json(
              {
                success: false,
                error: 'Cannot submit a completed or abandoned attempt',
              },
              { status: 400 }
            );
          }

          // Get game config
          const gameConfig = getGameConfig(gameId);
          const targetCategories = gameConfig?.targetCategories || [];

          // Generate questions with same seed to calculate scores
          const seed = `${user.id}-${attempt.id}`;
          const questions = generateDemoQuestions(gameId, seed, answers.length);

          // Calculate scores
          const timeSpent = telemetrySummary?.timeSpent || 0;
          const hintsUsed = telemetrySummary?.hintsUsed || 0;
          const scoreResult = calculateDemoScore(questions, answers, timeSpent, hintsUsed);

          const rawScores = {
            correctAnswers: Math.round((scoreResult.accuracy / 100) * questions.length),
            totalQuestions: questions.length,
            accuracy: scoreResult.accuracy,
            avgTimePerQuestion: scoreResult.avgTimePerQuestion,
            timeSpent,
            hintsUsed,
          };

          // Map normalized score to target categories
          const normalizedScores: Record<string, number> = {};
          targetCategories.forEach((category) => {
            normalizedScores[category.toLowerCase()] = scoreResult.normalizedScore;
          });

          // Update attempt
          const completedAttempt = await db.assessmentAttempt.update({
            where: {
              id: attemptId,
            },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              rawScores,
              normalizedScores,
              telemetry: {
                ...(attempt.telemetry as object || {}),
                ...telemetrySummary,
              },
            },
          });

          // Update skill scores
          for (const [category, score] of Object.entries(normalizedScores)) {
            const skillCategory = category.toUpperCase() as any;

            const existingScore = await db.skillScore.findUnique({
              where: {
                studentId_category: {
                  studentId: student.id,
                  category: skillCategory,
                },
              },
            });

            const newEvidence = `Assessment: ${gameConfig?.name || gameId}`;
            const newHistoryEntry = { date: new Date().toISOString(), score };

            if (existingScore) {
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

            // Generate demo report
            try {
              await generateDemoReport(student.id, tenantId, Array.from(completedGameIds));
            } catch (err) {
              console.error('Error generating demo report:', err);
              // Don't fail the submission if report generation fails
            }
          }

          return NextResponse.json(
            {
              success: true,
              data: {
                results: {
                  attemptId: completedAttempt.id,
                  accuracy: rawScores.accuracy,
                  avgTimePerQuestion: rawScores.avgTimePerQuestion,
                  strengths: scoreResult.strengths,
                  growthAreas: scoreResult.growthAreas,
                },
                skillScoresUpdated: Object.keys(normalizedScores).length,
                completedGames: completedGameIds.size,
                allGamesCompleted,
              },
            },
            { status: 200 }
          );
        } catch (error: any) {
          console.error('Error in demo submit:', error);
          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to submit assessment',
            },
            { status: 500 }
          );
        }
      })
    )(req);
  } catch (error: any) {
    console.error('Error in demo submit wrapper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

