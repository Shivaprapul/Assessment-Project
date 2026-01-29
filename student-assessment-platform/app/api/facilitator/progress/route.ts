/**
 * Facilitator Progress API Route
 * 
 * Get student's facilitator mode progress including skill deltas, goal readiness, and streak.
 * 
 * @module app/api/facilitator/progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';

/**
 * GET /api/facilitator/progress
 * 
 * Get facilitator progress
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
                error: 'No facilitator goal set',
              },
              { status: 400 }
            );
          }

          // Get skill scores
          const skillScores = await db.skillScore.findMany({
            where: {
              studentId: student.id,
              tenantId,
            },
          });

          // Calculate skill deltas (last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const recentAttempts = await db.questAttempt.findMany({
            where: {
              studentId: student.id,
              tenantId,
              status: 'COMPLETED',
              completedAt: {
                gte: sevenDaysAgo,
              },
            },
            orderBy: {
              completedAt: 'desc',
            },
          });

          // Calculate streak (consecutive days with completed quests)
          let streak = 0;
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const checkDateStr = checkDate.toISOString().split('T')[0];

            const dayAttempts = recentAttempts.filter(a => {
              if (!a.completedAt) return false;
              const attemptDate = new Date(a.completedAt);
              return attemptDate.toISOString().split('T')[0] === checkDateStr;
            });

            if (dayAttempts.length > 0) {
              streak++;
            } else if (i > 0) {
              // Break streak if not today
              break;
            }
          }

          // Get most improved skill (simplified - compare current scores)
          const skillDeltas = skillScores.map(ss => ({
            category: ss.category,
            currentScore: ss.score,
            trend: ss.trend,
          }));

          const mostImproved = skillDeltas
            .filter(s => s.trend === 'IMPROVING')
            .sort((a, b) => b.currentScore - a.currentScore)[0];

          return NextResponse.json(
            {
              success: true,
              data: {
                goalReadiness: goal.goalReadiness,
                goalReadinessLastUpdated: goal.lastReadinessCalc,
                skillScores: skillDeltas,
                mostImprovedSkill: mostImproved?.category || null,
                streak,
                totalQuestsCompleted: recentAttempts.length,
              },
            },
            { status: 200 }
          );
        } catch (error: any) {
          console.error('Error in facilitator progress GET:', error);
          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to get progress',
            },
            { status: 500 }
          );
        }
      })
    )(req);
  } catch (error: any) {
    console.error('Error in facilitator progress GET wrapper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

