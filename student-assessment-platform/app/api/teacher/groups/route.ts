/**
 * Teacher Groups API
 * 
 * Get and manage student groups.
 * 
 * @module app/api/teacher/groups
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/role-utils';
import { generateDemoGroups } from '@/lib/demo/teacher-demo-data';

/**
 * GET /api/teacher/groups
 * 
 * Get list of groups (manual + smart)
 */
export async function GET(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isTeacher(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only teachers can access groups' },
            { status: 403 }
          );
        }

        // Get manual groups
        const manualGroups = await db.studentGroup.findMany({
          where: {
            tenantId,
            teacherId: user.id,
            type: 'MANUAL',
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Get teacher's active ClassSection (MVP: one section per teacher)
        const classSection = await db.classSection.findFirst({
          where: {
            tenantId,
            teacherId: user.id,
            isActive: true,
          },
          orderBy: {
            academicYearStart: 'desc',
          },
        });

        // Generate smart groups (MVP: deterministic rules)
        // Only from teacher's ClassSection, filtered by grade
        const students = await db.studentProfile.findMany({
          where: {
            tenantId,
            ...(classSection ? {
              classSectionId: classSection.id,
              currentGrade: classSection.grade,
            } : {}),
          },
          include: {
            questAttempts: {
              where: {
                status: 'COMPLETED',
                completedAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
                // Filter by grade at time of attempt (grade-aware)
                ...(classSection ? {
                  gradeAtTimeOfAttempt: classSection.grade,
                } : {}),
              },
            },
            skillScores: true,
          },
        });

        const smartGroups: any[] = [];

        // Low engagement group
        const lowEngagement = students.filter((s) => s.questAttempts.length === 0);
        if (lowEngagement.length > 0) {
          smartGroups.push({
            id: `smart-low-engagement`,
            name: 'Low Engagement This Week',
            type: 'SMART',
            studentCount: lowEngagement.length,
            studentIds: lowEngagement.map((s) => s.id),
          });
        }

        // Needs Planning support
        const needsPlanning = students.filter((s) => {
          const planning = s.skillScores.find(
            (sc) => sc.category === 'PLANNING' && sc.trend === 'NEEDS_ATTENTION'
          );
          return planning !== undefined;
        });
        if (needsPlanning.length > 0) {
          smartGroups.push({
            id: `smart-needs-planning`,
            name: 'Needs Planning Support',
            type: 'SMART',
            studentCount: needsPlanning.length,
            studentIds: needsPlanning.map((s) => s.id),
          });
        }

        // Strong creativity cluster
        const strongCreativity = students.filter((s) => {
          const creativity = s.skillScores.find(
            (sc) => sc.category === 'CREATIVITY' && (sc.level === 'ADVANCED' || sc.level === 'PROFICIENT')
          );
          return creativity !== undefined;
        });
        if (strongCreativity.length >= 3) {
          smartGroups.push({
            id: `smart-strong-creativity`,
            name: 'Strong Creativity Cluster',
            type: 'SMART',
            studentCount: strongCreativity.length,
            studentIds: strongCreativity.map((s) => s.id),
          });
        }

        const allGroups = [
          ...manualGroups.map((g) => ({
            id: g.id,
            name: g.name,
            type: g.type,
            studentCount: g.studentIds.length,
          })),
          ...smartGroups,
        ];

        return NextResponse.json({
          success: true,
          data: allGroups,
        });
      } catch (error: any) {
        console.error('Error fetching groups:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch groups' },
          { status: 500 }
        );
      }
    })
  )(req);
}

