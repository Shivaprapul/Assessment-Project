/**
 * Facilitator Weekly Plan API Route
 * 
 * Get or generate weekly plan for facilitator mode.
 * 
 * @module app/api/facilitator/week
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { generateWeeklyPlan, getCurrentWeekStart } from '@/lib/facilitator-weekly-plan';

/**
 * GET /api/facilitator/week
 * 
 * Get current week's plan
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

          // Get current week start
          const weekStart = getCurrentWeekStart();
          const weekStartStr = weekStart.toISOString().split('T')[0];

          // Check if weekly plan exists
          let weeklyPlan = await db.weeklyPlan.findUnique({
            where: {
              studentId_weekStartDate: {
                studentId: student.id,
                weekStartDate: new Date(weekStartStr),
              },
            },
          });

          // If no plan exists, generate one
          if (!weeklyPlan) {
            // Get current skill scores
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

            // Generate weekly plan (grade-aware)
            const studentGrade = student.currentGrade || 8; // Default to 8 if not set
            const generatedPlan = generateWeeklyPlan(
              student.id,
              goal.goalTitle,
              goal.timeAvailability,
              skillScoreMap,
              weekStart,
              studentGrade
            );

            // Save to database
            weeklyPlan = await db.weeklyPlan.create({
              data: {
                studentId: student.id,
                tenantId,
                weekStartDate: new Date(generatedPlan.weekStartDate),
                weekEndDate: new Date(generatedPlan.weekEndDate),
                focusSkills: generatedPlan.focusSkills,
                dailyTimeBudget: generatedPlan.dailyTimeBudget,
                dailyPlan: generatedPlan.dailyPlan as any,
                goalReadinessDelta: generatedPlan.goalReadinessDelta,
              },
            });
          }

          return NextResponse.json(
            {
              success: true,
              data: {
                weekStartDate: weeklyPlan.weekStartDate.toISOString().split('T')[0],
                weekEndDate: weeklyPlan.weekEndDate.toISOString().split('T')[0],
                focusSkills: weeklyPlan.focusSkills,
                dailyTimeBudget: weeklyPlan.dailyTimeBudget,
                dailyPlan: weeklyPlan.dailyPlan,
                goalReadinessDelta: weeklyPlan.goalReadinessDelta,
              },
            },
            { status: 200 }
          );
        } catch (error: any) {
          console.error('Error in facilitator week GET:', error);
          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to get weekly plan',
            },
            { status: 500 }
          );
        }
      })
    )(req);
  } catch (error: any) {
    console.error('Error in facilitator week GET wrapper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

