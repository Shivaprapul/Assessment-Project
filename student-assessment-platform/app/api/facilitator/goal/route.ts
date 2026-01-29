/**
 * Facilitator Goal API Route
 * 
 * Set or update student's facilitator goal.
 * 
 * @module app/api/facilitator/goal
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { calculateGoalReadiness } from '@/lib/facilitator-goal-readiness';

/**
 * GET /api/facilitator/goal
 * 
 * Get current facilitator goal
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
                success: true,
                data: null,
              },
              { status: 200 }
            );
          }

          return NextResponse.json(
            {
              success: true,
              data: goal,
            },
            { status: 200 }
          );
        } catch (error: any) {
          console.error('Error in facilitator goal GET:', error);
          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to get goal',
            },
            { status: 500 }
          );
        }
      })
    )(req);
  } catch (error: any) {
    console.error('Error in facilitator goal GET wrapper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/facilitator/goal
 * 
 * Set or update facilitator goal
 */
export async function POST(req: NextRequest) {
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
                error: 'Only students can set facilitator goals',
              },
              { status: 403 }
            );
          }

          const body = await req.json();
          const { goalTitle, goalType, careerId, timeAvailability, focusAreas } = body;

          if (!goalTitle) {
            return NextResponse.json(
              {
                success: false,
                error: 'goalTitle is required',
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

          // Get current skill scores for goal readiness calculation
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

          const goalReadiness = calculateGoalReadiness(goalTitle, skillScoreMap);

          // Verify Prisma client has facilitatorGoal model
          if (!db.facilitatorGoal) {
            console.error('Prisma client missing facilitatorGoal model. Available models:', Object.keys(db).filter(k => !k.startsWith('$') && !k.startsWith('_')));
            return NextResponse.json(
              {
                success: false,
                error: 'Database client not properly initialized. Please restart the server.',
              },
              { status: 500 }
            );
          }

          // Upsert goal
          const goal = await db.facilitatorGoal.upsert({
            where: {
              studentId: student.id,
            },
            create: {
              studentId: student.id,
              tenantId,
              goalTitle,
              goalType: goalType || 'CURATED',
              careerId: careerId || null,
              timeAvailability: timeAvailability || 20,
              focusAreas: focusAreas || [],
              goalReadiness,
              lastReadinessCalc: new Date(),
            },
            update: {
              goalTitle,
              goalType: goalType || 'CURATED',
              careerId: careerId || null,
              timeAvailability: timeAvailability || 20,
              focusAreas: focusAreas || [],
              goalReadiness,
              lastReadinessCalc: new Date(),
            },
          });

          return NextResponse.json(
            {
              success: true,
              data: goal,
            },
            { status: 200 }
          );
        } catch (error: any) {
          console.error('Error in facilitator goal POST:', error);
          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to set goal',
            },
            { status: 500 }
          );
        }
      })
    )(req);
  } catch (error: any) {
    console.error('Error in facilitator goal POST wrapper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

