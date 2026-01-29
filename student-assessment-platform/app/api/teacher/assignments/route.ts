/**
 * Teacher Assignments API
 * 
 * Create and manage assignments.
 * 
 * @module app/api/teacher/assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/role-utils';

/**
 * POST /api/teacher/assignments
 * 
 * Create a new assignment
 */
export async function POST(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isTeacher(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only teachers can create assignments' },
            { status: 403 }
          );
        }

        const body = await req.json();
        const {
          title,
          description,
          targetType,
          targetIds,
          questCount,
          questTypes,
          gradeScope,
          intent,
          dueDate,
        } = body;

        if (!title || !targetType || !questCount || !questTypes || questTypes.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          );
        }

        if (targetType === 'GROUP' && (!targetIds || targetIds.length === 0)) {
          return NextResponse.json(
            { success: false, error: 'Please select at least one group' },
            { status: 400 }
          );
        }

        if (targetType === 'INDIVIDUAL' && (!targetIds || targetIds.length === 0)) {
          return NextResponse.json(
            { success: false, error: 'Please select at least one student' },
            { status: 400 }
          );
        }

        // Create assignment
        const assignment = await db.assignment.create({
          data: {
            tenantId,
            teacherId: user.id,
            title,
            description: description || null,
            targetType,
            targetIds: targetIds || [],
            questCount,
            questTypes,
            gradeScope: gradeScope || null,
            intent: intent || null,
            dueDate: dueDate ? new Date(dueDate) : null,
            isActive: true,
          },
        });

        // Create assignment attempts for each target student
        let studentIds: string[] = [];

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

        if (targetType === 'CLASS') {
          // Get students in teacher's ClassSection, filtered by grade
          const students = await db.studentProfile.findMany({
            where: {
              tenantId,
              ...(classSection ? {
                classSectionId: classSection.id,
                currentGrade: classSection.grade,
              } : {}),
            },
            select: { id: true },
          });
          studentIds = students.map((s) => s.id);
        } else if (targetType === 'GROUP') {
          // Get students from selected groups
          const groups = await db.studentGroup.findMany({
            where: {
              id: { in: targetIds },
              tenantId,
            },
            select: { studentIds: true },
          });
          studentIds = groups.flatMap((g) => g.studentIds);
        } else {
          // Individual students
          studentIds = targetIds;
        }

        // For MVP, we'll create assignment attempts when students start
        // In production, you might want to pre-create them or generate quests
        // Note: Quest selection with Class Focus happens when students start the assignment
        // See selectQuestsForAssignment in lib/assignment-quest-selection.ts

        return NextResponse.json({
          success: true,
          data: {
            assignmentId: assignment.id,
            studentCount: studentIds.length,
          },
        });
      } catch (error: any) {
        console.error('Error creating assignment:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to create assignment' },
          { status: 500 }
        );
      }
    })
  )(req);
}

