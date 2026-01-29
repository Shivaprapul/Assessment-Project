/**
 * Assignment Quest Recommendations API
 * 
 * Returns recommended quests for an assignment with Class Focus integration.
 * Includes debug logging when DEBUG_CLASS_FOCUS=true.
 * 
 * @module app/api/teacher/assignments/[assignmentId]/recommend-quests
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/role-utils';
import { selectQuestsForAssignment } from '@/lib/assignment-quest-selection';

/**
 * GET /api/teacher/assignments/:assignmentId/recommend-quests?studentId=xxx
 * 
 * Get recommended quests for a student in an assignment (with Class Focus)
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) {
  const params = await context.params;
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isTeacher(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only teachers can access this endpoint' },
            { status: 403 }
          );
        }

        const { assignmentId } = params;
        const studentId = req.nextUrl.searchParams.get('studentId');

        if (!studentId) {
          return NextResponse.json(
            { success: false, error: 'studentId query parameter is required' },
            { status: 400 }
          );
        }

        // Get assignment
        const assignment = await db.assignment.findUnique({
          where: {
            id: assignmentId,
            tenantId,
            teacherId: user.id,
          },
        });

        if (!assignment) {
          return NextResponse.json(
            { success: false, error: 'Assignment not found' },
            { status: 404 }
          );
        }

        // Get student
        const student = await db.studentProfile.findUnique({
          where: {
            id: studentId,
            tenantId,
          },
        });

        if (!student) {
          return NextResponse.json(
            { success: false, error: 'Student not found' },
            { status: 404 }
          );
        }

        // Get student skill scores
        const skillScores = await db.skillScore.findMany({
          where: {
            studentId,
            tenantId,
          },
        });

        const skillScoreMap: Record<string, number> = {};
        skillScores.forEach((ss) => {
          skillScoreMap[ss.category] = ss.score;
        });

        // Select quests with Class Focus integration
        const selectedQuests = await selectQuestsForAssignment({
          tenantId,
          teacherId: user.id,
          studentId,
          studentGrade: student.currentGrade,
          questCount: assignment.questCount,
          questTypes: assignment.questTypes,
          gradeScope: assignment.gradeScope || undefined,
          intent: assignment.intent || undefined,
          skillScoreMap,
        });

        return NextResponse.json({
          success: true,
          data: {
            quests: selectedQuests,
            assignmentId: assignment.id,
            studentId,
            // Include breakdown if debug mode is enabled
            ...(process.env.DEBUG_CLASS_FOCUS === 'true' && {
              debug: {
                breakdowns: selectedQuests.map((q) => q.breakdown).filter(Boolean),
              },
            }),
          },
        });
      } catch (error: any) {
        console.error('Error recommending quests:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to recommend quests' },
          { status: 500 }
        );
      }
    })
  )(req);
}

