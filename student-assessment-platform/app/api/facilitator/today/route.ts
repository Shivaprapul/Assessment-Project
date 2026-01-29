/**
 * Facilitator Today's Quests API Route
 * 
 * Get today's quests for facilitator mode.
 * 
 * @module app/api/facilitator/today
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { generateDailyQuests } from '@/lib/explorer-quests';

/**
 * GET /api/facilitator/today
 * 
 * Get today's quests
 */
export async function GET(req: NextRequest) {
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

    return requireAuth(
      withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
        try {
          if (user.role !== 'STUDENT') {
            return NextResponse.json(
              {
                success: false,
                error: 'Only students can access facilitator mode',
              },
              { status: 403 }
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
                error: 'No facilitator goal set. Please set a goal first.',
              },
              { status: 400 }
            );
          }

          // Get today's date
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];

          // Check if quest set exists for today
          let questSet = await db.dailyQuestSet.findUnique({
            where: {
              studentId_date_mode: {
                studentId: student.id,
                date: new Date(todayStr),
                mode: 'FACILITATOR',
              },
            },
          });

          // If no quest set exists, generate one from weekly plan or create new
          if (!questSet) {
            // Try to get weekly plan for current week
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
            weekStart.setHours(0, 0, 0, 0);

            const weeklyPlan = await db.weeklyPlan.findUnique({
              where: {
                studentId_weekStartDate: {
                  studentId: student.id,
                  weekStartDate: weekStart,
                },
              },
            });

            let quests: any[] = [];

            if (weeklyPlan && weeklyPlan.dailyPlan) {
              // Get today's plan from weekly plan
              const dailyPlans = weeklyPlan.dailyPlan as any[];
              const dayIndex = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
              const todayPlan = dailyPlans[dayIndex];

              if (todayPlan && todayPlan.quests) {
                quests = todayPlan.quests;
              }
            }

            // If no weekly plan quests, generate default quests (grade-aware)
            if (quests.length === 0) {
              const studentGrade = student.currentGrade || 8; // Default to 8 if not set
              quests = generateDailyQuests(student.id, today, 4, studentGrade);
            }

            // Create quest set
            const studentGrade = student.currentGrade || 8;
            questSet = await db.dailyQuestSet.create({
              data: {
                studentId: student.id,
                tenantId,
                date: new Date(todayStr),
                mode: 'FACILITATOR',
                quests: quests as any,
                gradeAtCreation: studentGrade,
              },
            });
          }

          // Get all quest attempts for today
          const questIds = (questSet.quests as any[]).map((q: any) => q.id);
          const attempts = await db.questAttempt.findMany({
            where: {
              studentId: student.id,
              tenantId,
              questId: { in: questIds },
            },
            select: {
              questId: true,
              status: true,
              completedAt: true,
            },
          });

          // Map attempts to quests
          const attemptMap = new Map(attempts.map(a => [a.questId, a]));
          const questsWithStatus = (questSet.quests as any[]).map((quest: any) => {
            const attempt = attemptMap.get(quest.id);
            return {
              ...quest,
              status: attempt?.status || 'NOT_STARTED',
              completedAt: attempt?.completedAt || null,
              attemptId: attempt ? attempt.questId : null,
            };
          });

          // Calculate completion stats
          const completedCount = questsWithStatus.filter(q => q.status === 'COMPLETED').length;
          const totalQuests = questsWithStatus.length;

          return NextResponse.json(
            {
              success: true,
              data: {
                date: todayStr,
                quests: questsWithStatus,
                progress: {
                  completed: completedCount,
                  total: totalQuests,
                  percentage: totalQuests > 0 ? Math.round((completedCount / totalQuests) * 100) : 0,
                },
              },
            },
            { status: 200 }
          );
        } catch (error: any) {
          console.error('Error in facilitator today GET:', error);
          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to load today\'s quests',
            },
            { status: 500 }
          );
        }
      })
    )(req);
  } catch (error: any) {
    console.error('Error in facilitator today GET wrapper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

