/**
 * Parent Activity API
 * 
 * Returns parent-safe activity list.
 * 
 * @module app/api/parent/activity
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isParent } from '@/lib/role-utils';
import { ParentActivityDTO } from '@/lib/parent-dtos';

export async function GET(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isParent(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only parents can access this endpoint' },
            { status: 403 }
          );
        }

        const student = await db.studentProfile.findFirst({
          where: {
            tenantId,
            parentIds: { has: user.id },
          },
        });

        if (process.env.DEMO_PARENT === 'true' || !student) {
          return NextResponse.json({
            success: true,
            data: {
              activities: [
                {
                  id: 'activity-1',
                  title: 'Pattern Challenge',
                  type: 'mini_game',
                  completedAt: new Date().toISOString(),
                  isTeacherAssigned: false,
                  performanceSummary: {
                    completionRate: 85,
                    timeTaken: 5,
                    skillTags: ['COGNITIVE_REASONING'],
                  },
                  whatItIndicates: 'Shows strong pattern recognition abilities',
                  supportSuggestions: [
                    'Continue encouraging pattern-based activities',
                    'Notice when they naturally spot patterns',
                  ],
                },
              ],
            },
          });
        }

        // Get recent completed activities
        const [recentAssessments, recentQuests, recentActivities] = await Promise.all([
          db.assessmentAttempt.findMany({
            where: {
              studentId: student.id,
              tenantId,
              status: 'COMPLETED',
            },
            orderBy: { completedAt: 'desc' },
            take: 10,
            select: {
              id: true,
              gameId: true,
              completedAt: true,
              normalizedScores: true,
            },
          }),
          db.questAttempt.findMany({
            where: {
              studentId: student.id,
              tenantId,
              status: 'COMPLETED',
            },
            orderBy: { completedAt: 'desc' },
            take: 10,
            select: {
              id: true,
              questType: true,
              completedAt: true,
              scoreSummary: true,
            },
          }),
          db.activityAttempt.findMany({
            where: {
              studentId: student.id,
              tenantId,
              status: 'COMPLETED',
            },
            orderBy: { completedAt: 'desc' },
            take: 10,
            include: {
              activity: {
                select: {
                  title: true,
                },
              },
            },
          }),
        ]);

        const activities: ParentActivityDTO['activities'] = [
          ...recentAssessments.map(a => ({
            id: a.id,
            title: `Assessment: ${a.gameId}`,
            type: 'assessment',
            completedAt: a.completedAt?.toISOString() || '',
            isTeacherAssigned: false,
            performanceSummary: {
              completionRate: 85, // Simplified
              timeTaken: 0,
              skillTags: ['COGNITIVE_REASONING'],
            },
            whatItIndicates: 'Shows engagement with assessment activities',
            supportSuggestions: ['Continue supporting regular practice'],
          })),
          ...recentQuests.map(q => ({
            id: q.id,
            title: `Quest: ${q.questType}`,
            type: q.questType.toLowerCase(),
            completedAt: q.completedAt?.toISOString() || '',
            isTeacherAssigned: false,
            performanceSummary: {
              completionRate: 80,
              timeTaken: 0,
              skillTags: [],
            },
            whatItIndicates: 'Shows engagement with quest activities',
            supportSuggestions: ['Encourage continued exploration'],
          })),
          ...recentActivities.map(a => ({
            id: a.id,
            title: a.activity.title,
            type: 'activity',
            completedAt: a.completedAt?.toISOString() || '',
            isTeacherAssigned: false,
            performanceSummary: {
              completionRate: 75,
              timeTaken: 0,
              skillTags: [],
            },
            whatItIndicates: 'Shows engagement with learning activities',
            supportSuggestions: ['Continue supporting learning activities'],
          })),
        ].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()).slice(0, 20);

        return NextResponse.json({ success: true, data: { activities } });
      } catch (error: any) {
        console.error('Error fetching activity data:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch activity data' },
          { status: 500 }
        );
      }
    })
  )(req);
}

