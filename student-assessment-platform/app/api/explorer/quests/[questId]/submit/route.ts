/**
 * Submit Quest API Route
 * 
 * Submits a completed quest attempt, generates AI insight, and evaluates career unlocks.
 * 
 * @module app/api/explorer/quests/[questId]/submit
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { generateQuestInsight } from '@/lib/explorer-insights';
import { evaluateCareerUnlocks } from '@/lib/explorer-unlocks';
import { getCareerById } from '@/lib/career-catalog';
import { calculateDemoScore } from '@/lib/demo-questions';
import { generateQuestQuestions } from '@/lib/explorer-quests';

/**
 * POST /api/explorer/quests/:questId/submit
 * 
 * Submit a quest attempt
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ questId: string }> }
) {
  try {
    if (process.env.EXPLORER_MODE !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: 'Explorer mode is not enabled',
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
                error: 'Only students can submit quests',
              },
              { status: 403 }
            );
          }

          const { questId } = params;

          // Parse request body
          const body = await req.json().catch(() => ({}));
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

          // Calculate score summary based on quest type
          let scoreSummary: any = {};
          const timeSpent = telemetrySummary?.timeSpent || 0;

          if (quest.type === 'mini_game' && answers && Array.isArray(answers)) {
            // Generate questions and calculate score
            const seed = `${user.id}-${attempt.id}`;
            const questions = generateQuestQuestions(quest, seed);
            const hintsUsed = telemetrySummary?.hintsUsed || 0;
            const scoreResult = calculateDemoScore(questions, answers, timeSpent, hintsUsed);

            scoreSummary = {
              accuracy: scoreResult.accuracy,
              avgTimePerQuestion: scoreResult.avgTimePerQuestion,
              normalizedScore: scoreResult.normalizedScore,
            };
          } else if (quest.type === 'reflection' && response) {
            scoreSummary = {
              responseLength: response.length,
              responseQuality: response.length > 100 ? 100 : response.length,
            };
          } else if (quest.type === 'choice_scenario' && choice !== undefined) {
            scoreSummary = {
              choiceIndex: choice,
              choiceMade: true,
            };
          }

          // Generate AI insight
          const aiInsight = generateQuestInsight(
            quest.type,
            scoreSummary,
            { ...telemetrySummary, timeSpent }
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
              aiInsight: aiInsight as any,
              telemetry: {
                ...(attempt.telemetry as object || {}),
                ...telemetrySummary,
                answers: quest.type === 'mini_game' ? answers : undefined,
                response: quest.type === 'reflection' ? response : undefined,
                choice: quest.type === 'choice_scenario' ? choice : undefined,
              },
            },
          });

          // Evaluate career unlocks
          const performance = {
            accuracy: scoreSummary.accuracy,
            timeSpent,
            responseQuality: scoreSummary.responseQuality || scoreSummary.responseLength,
          };

          // Get already unlocked careers
          const existingUnlocks = await db.careerUnlock.findMany({
            where: {
              studentId: student.id,
              tenantId,
            },
            select: {
              careerId: true,
            },
          });

          const alreadyUnlocked = existingUnlocks.map(u => u.careerId);
          const unlockCandidates = evaluateCareerUnlocks(
            quest.skillSignals,
            performance,
            alreadyUnlocked
          );

          // Create career unlocks
          const newUnlocks = [];
          for (const candidate of unlockCandidates) {
            try {
              const unlock = await db.careerUnlock.create({
                data: {
                  studentId: student.id,
                  tenantId,
                  careerId: candidate.career.id,
                  reasonEvidence: {
                    reason: candidate.reason,
                    evidence: candidate.evidence,
                    confidence: candidate.confidence,
                  } as any,
                  linkedSkills: candidate.career.skillSignals,
                },
              });
              newUnlocks.push({
                careerId: candidate.career.id,
                careerTitle: candidate.career.title,
                careerIcon: candidate.career.icon,
                reason: candidate.reason,
              });
            } catch (err: any) {
              // Ignore duplicate unlock errors
              if (!err.message?.includes('Unique constraint')) {
                console.error('Error creating career unlock:', err);
              }
            }
          }

          return NextResponse.json(
            {
              success: true,
              data: {
                attemptId: completedAttempt.id,
                scoreSummary,
                aiInsight,
                unlocks: newUnlocks,
              },
            },
            { status: 200 }
          );
        } catch (error: any) {
          console.error('Error in quest submit:', error);
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
    console.error('Error in quest submit wrapper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

