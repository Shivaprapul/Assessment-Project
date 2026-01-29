/**
 * Start Facilitator Quest API Route
 * 
 * Creates a new quest attempt for Facilitator Mode.
 * Reuses Explorer quest start logic but with facilitator context.
 * 
 * @module app/api/facilitator/quests/[questId]/start
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { generateQuestQuestions } from '@/lib/explorer-quests';

/**
 * POST /api/facilitator/quests/:questId/start
 * 
 * Start a facilitator quest attempt
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
                error: 'Only students can start facilitator quests',
              },
              { status: 403 }
            );
          }

          const { questId } = params;

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

          // Get today's quest set
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          const questSet = await db.dailyQuestSet.findUnique({
            where: {
              studentId_date_mode: {
                studentId: student.id,
                date: new Date(todayStr),
                mode: 'FACILITATOR',
              },
            },
          });

          if (!questSet) {
            return NextResponse.json(
              {
                success: false,
                error: 'Quest set not found for today',
              },
              { status: 404 }
            );
          }

          // Find the quest in the quest set
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

          // Check if there's an in-progress attempt
          const inProgressAttempt = await db.questAttempt.findFirst({
            where: {
              studentId: student.id,
              tenantId,
              questId,
              status: 'IN_PROGRESS',
            },
          });

          if (inProgressAttempt) {
            // Return existing attempt
            const seed = `${user.id}-${inProgressAttempt.id}`;
            let questions: any[] = [];

            // Handle facilitator quests: they may not have content.gameId, use skillFocus to determine game
            if (quest.type === 'mini_game') {
              // For facilitator quests, use a default gameId based on skillFocus or use pattern_forge
              const gameId = quest.content?.gameId || 'pattern_forge';
              const questWithGameId = {
                ...quest,
                content: {
                  ...quest.content,
                  gameId,
                  questionCount: quest.content?.questionCount || 6,
                },
              };
              questions = generateQuestQuestions(questWithGameId, seed);
            }

            return NextResponse.json(
              {
                success: true,
                data: {
                  attemptId: inProgressAttempt.id,
                  questId,
                  questType: quest.type,
                  questions: questions.map(q => ({
                    id: q.id,
                    question: q.question,
                    type: q.type,
                    options: q.options,
                  })),
                  content: quest.content || {
                    prompt: quest.description, // For reflection
                    scenario: quest.description, // For scenario
                    choices: [], // Will be populated if needed
                  },
                },
              },
              { status: 200 }
            );
          }

          // Create new attempt (grade-aware)
          const studentGrade = student.currentGrade || 8; // Default to 8 if not set
          const attempt = await db.questAttempt.create({
            data: {
              studentId: student.id,
              tenantId,
              questId,
              questSetId: questSet.id,
              questType: quest.type === 'mini_game' ? 'MINI_GAME' : 
                        quest.type === 'reflection' ? 'REFLECTION' : 
                        'CHOICE_SCENARIO' as any,
              status: 'IN_PROGRESS',
              telemetry: {},
              scoreSummary: {},
              gradeAtTimeOfAttempt: studentGrade,
            },
          });

          // Generate questions for mini_game quests
          const seed = `${user.id}-${attempt.id}`;
          let questions: any[] = [];

          // Handle facilitator quests: they may not have content.gameId, use skillFocus to determine game
          if (quest.type === 'mini_game') {
            // For facilitator quests, use a default gameId based on skillFocus or use pattern_forge
            const gameId = quest.content?.gameId || 'pattern_forge';
            const questWithGameId = {
              ...quest,
              content: {
                ...quest.content,
                gameId,
                questionCount: quest.content?.questionCount || 6,
              },
            };
            questions = generateQuestQuestions(questWithGameId, seed);
          }

          // Prepare content for reflection and scenario quests
          let questContent: any = quest.content;
          if (!questContent) {
            if (quest.type === 'reflection') {
              questContent = {
                prompt: quest.description || 'Reflect on your learning',
              };
            } else if (quest.type === 'choice_scenario') {
              questContent = {
                scenario: quest.description || 'Consider this scenario',
                choices: quest.content?.choices || [
                  'Option 1',
                  'Option 2',
                  'Option 3',
                  'Option 4',
                ],
              };
            }
          }

          return NextResponse.json(
            {
              success: true,
              data: {
                attemptId: attempt.id,
                questId,
                questType: quest.type,
                questions: questions.map(q => ({
                  id: q.id,
                  question: q.question,
                  type: q.type,
                  options: q.options,
                })),
                content: questContent,
              },
            },
            { status: 200 }
          );
        } catch (error: any) {
          console.error('Error in facilitator quest start:', error);
          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to start quest',
            },
            { status: 500 }
          );
        }
      })
    )(req);
  } catch (error: any) {
    console.error('Error in facilitator quest start wrapper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

