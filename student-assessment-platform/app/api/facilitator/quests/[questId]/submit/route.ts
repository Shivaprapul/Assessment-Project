/**
 * Submit Facilitator Quest API Route
 * 
 * Submits a completed facilitator quest, generates coaching insight, and updates goal readiness.
 * 
 * @module app/api/facilitator/quests/[questId]/submit
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { generateCoachingInsight } from '@/lib/facilitator-coaching';
import { calculateGoalReadiness } from '@/lib/facilitator-goal-readiness';
import { calculateDemoScore } from '@/lib/demo-questions';
import { generateQuestQuestions } from '@/lib/explorer-quests';

/**
 * POST /api/facilitator/quests/:questId/submit
 * 
 * Submit a facilitator quest attempt
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ questId: string }> }
) {
  try {
    if (process.env.FACILITATOR_MODE !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: 'Facilitator mode is not enabled',
        },
        { status: 400 }
      );
    }

    const params = await context.params;
    return requireAuth(
      withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
        try {
          if (user.role !== 'STUDENT') {
            return NextResponse.json(
              {
                success: false,
                error: 'Only students can submit facilitator quests',
              },
              { status: 403 }
            );
          }

          const { questId } = params;
          const body = await req.json();
          const { attemptId, answers, response, choice, telemetrySummary } = body;

          if (!attemptId) {
            return NextResponse.json(
              {
                success: false,
                error: 'attemptId is required',
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

          // Get facilitator goal
          const goal = await db.facilitatorGoal.findUnique({
            where: {
              studentId: student.id,
            },
          });

          if (!goal) {
            return NextResponse.json(
              {
                success: false,
                error: 'No facilitator goal set',
              },
              { status: 400 }
            );
          }

          // Find the attempt
          const attempt = await db.questAttempt.findFirst({
            where: {
              id: attemptId,
              studentId: student.id,
              tenantId,
              questId,
            },
          });

          if (!attempt) {
            return NextResponse.json(
              {
                success: false,
                error: 'Quest attempt not found',
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

          // Get the quest from quest set
          const questSet = attempt.questSetId
            ? await db.dailyQuestSet.findUnique({
                where: { id: attempt.questSetId },
              })
            : null;

          if (!questSet) {
            return NextResponse.json(
              {
                success: false,
                error: 'Quest set not found',
              },
              { status: 404 }
            );
          }

          const quests = questSet.quests as any[];
          const quest = quests.find((q: any) => q.id === questId);

          if (!quest) {
            return NextResponse.json(
              {
                success: false,
                error: 'Quest not found',
              },
              { status: 404 }
            );
          }

          // Calculate score summary
          let scoreSummary: any = {};
          const timeSpent = telemetrySummary?.timeSpent || 0;

          if (quest.type === 'mini_game' && answers && Array.isArray(answers)) {
            // For facilitator quests, ensure we have a gameId
            const gameId = quest.content?.gameId || 'pattern_forge';
            const questWithGameId = {
              ...quest,
              content: {
                ...quest.content,
                gameId,
                questionCount: quest.content?.questionCount || 6,
              },
            };
            const seed = `${user.id}-${attempt.id}`;
            const questions = generateQuestQuestions(questWithGameId, seed);
            const hintsUsed = telemetrySummary?.hintsUsed || 0;
            const scoreResult = calculateDemoScore(questions, answers, timeSpent, hintsUsed);

            scoreSummary = {
              accuracy: scoreResult.accuracy,
              avgTimePerQuestion: scoreResult.avgTimePerQuestion,
              normalizedScore: scoreResult.normalizedScore,
              skillSignals: quest.skillFocus || [],
            };
          } else if (quest.type === 'reflection' && response) {
            scoreSummary = {
              responseLength: response.length,
              responseQuality: response.length > 100 ? 100 : response.length,
              skillSignals: quest.skillFocus || [],
            };
          } else if (quest.type === 'choice_scenario' && choice !== undefined) {
            scoreSummary = {
              choiceIndex: choice,
              choiceMade: true,
              skillSignals: quest.skillFocus || [],
            };
          }

          // Generate coaching insight
          const coachingInsight = generateCoachingInsight(
            quest.type,
            scoreSummary,
            { ...telemetrySummary, timeSpent },
            goal.goalTitle,
            quest.skillFocus || []
          );

          // Update attempt
          const completedAttempt = await db.questAttempt.update({
            where: {
              id: attemptId,
            },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              scoreSummary,
              aiInsight: coachingInsight as any,
              telemetry: {
                ...(attempt.telemetry as object || {}),
                ...telemetrySummary,
                answers: quest.type === 'mini_game' ? answers : undefined,
                response: quest.type === 'reflection' ? response : undefined,
                choice: quest.type === 'choice_scenario' ? choice : undefined,
              },
            },
          });

          // Update skill scores based on quest performance
          const skillFocus = quest.skillFocus || [];
          const accuracy = scoreSummary.accuracy || (scoreSummary.responseQuality ? scoreSummary.responseQuality / 100 : 0.5);
          const normalizedAccuracy = typeof accuracy === 'number' && accuracy <= 1 ? accuracy : accuracy / 100;
          
          // Calculate skill score improvement (0-100 scale)
          const skillScoreDelta = Math.round(normalizedAccuracy * 20); // Up to 20 points per quest
          
          // Update skill scores for each skill in skillFocus
          for (const skillStr of skillFocus) {
            try {
              const skillCategory = skillStr.toUpperCase() as any;
              
              // Get existing skill score
              const existingScore = await db.skillScore.findUnique({
                where: {
                  studentId_category: {
                    studentId: student.id,
                    category: skillCategory,
                  },
                },
              });

              const newScore = Math.min(100, (existingScore?.score || 50) + skillScoreDelta);
              const newEvidence = `Facilitator Quest: ${quest.title || questId}`;
              const newHistoryEntry = { date: new Date().toISOString(), score: newScore };

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
                    score: newScore,
                    level: newScore >= 80 ? 'ADVANCED' : newScore >= 60 ? 'PROFICIENT' : newScore >= 40 ? 'DEVELOPING' : 'EMERGING',
                    lastUpdatedAt: new Date(),
                    evidence: [...existingEvidence, newEvidence],
                    history: [...existingHistory, newHistoryEntry] as any,
                    trend: newScore > existingScore.score ? 'IMPROVING' : newScore < existingScore.score ? 'NEEDS_ATTENTION' : 'STABLE',
                  },
                });
              } else {
                // Create new skill score
                await db.skillScore.create({
                  data: {
                    studentId: student.id,
                    tenantId,
                    category: skillCategory,
                    score: newScore,
                    level: newScore >= 80 ? 'ADVANCED' : newScore >= 60 ? 'PROFICIENT' : newScore >= 40 ? 'DEVELOPING' : 'EMERGING',
                    trend: 'IMPROVING',
                    evidence: [newEvidence],
                    history: [newHistoryEntry] as any,
                  },
                });
              }
            } catch (err: any) {
              // Log error but don't fail the submission
              console.error(`Error updating skill score for ${skillStr}:`, err);
            }
          }

          // Get updated skill scores for goal readiness calculation
          const skillScores = await db.skillScore.findMany({
            where: {
              studentId: student.id,
              tenantId,
            },
          });

          const skillScoreMap: Record<string, number> = {};
          skillScores.forEach(ss => {
            skillScoreMap[ss.category] = ss.score;
          });

          // Update goal readiness
          const newGoalReadiness = calculateGoalReadiness(goal.goalTitle, skillScoreMap);
          await db.facilitatorGoal.update({
            where: {
              id: goal.id,
            },
            data: {
              goalReadiness: newGoalReadiness,
              lastReadinessCalc: new Date(),
            },
          });

          return NextResponse.json(
            {
              success: true,
              data: {
                attemptId: completedAttempt.id,
                scoreSummary: {
                  ...scoreSummary,
                  timeSpent,
                },
                coachingInsight,
                goalReadiness: newGoalReadiness,
                timeSpent,
              },
            },
            { status: 200 }
          );
        } catch (error: any) {
          console.error('Error in facilitator quest submit:', error);
          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to submit quest',
            },
            { status: 500 }
          );
        }
      })
    )(req);
  } catch (error: any) {
    console.error('Error in facilitator quest submit wrapper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

