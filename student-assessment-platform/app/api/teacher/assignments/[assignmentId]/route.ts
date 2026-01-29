/**
 * Teacher Assignment Detail API
 * 
 * Get assignment details and student progress.
 * 
 * @module app/api/teacher/assignments/[assignmentId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/role-utils';

/**
 * GET /api/teacher/assignments/:assignmentId
 * 
 * Get assignment details
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) {
  const params = await context.params;
  const { assignmentId } = params;
  
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isTeacher(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only teachers can view assignments' },
            { status: 403 }
          );
        }

        const assignment = await db.assignment.findFirst({
          where: {
            id: assignmentId,
            tenantId,
            teacherId: user.id,
          },
          include: {
            attempts: {
              include: {
                student: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        email: true,
                        avatar: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!assignment) {
          return NextResponse.json(
            { success: false, error: 'Assignment not found' },
            { status: 404 }
          );
        }

        // Get target students
        let targetStudents: any[] = [];
        const classSection = await db.classSection.findFirst({
          where: {
            tenantId,
            teacherId: user.id,
            isActive: true,
          },
        });

        if (assignment.targetType === 'CLASS') {
          const students = await db.studentProfile.findMany({
            where: {
              tenantId,
              ...(classSection ? {
                classSectionId: classSection.id,
                currentGrade: classSection.grade,
              } : {}),
            },
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          });
          targetStudents = students.map((s) => ({
            id: s.id,
            name: s.user.name,
            email: s.user.email,
            avatar: s.user.avatar,
            currentGrade: s.currentGrade,
          }));
        } else if (assignment.targetType === 'GROUP') {
          const groups = await db.studentGroup.findMany({
            where: {
              id: { in: assignment.targetIds },
              tenantId,
            },
          });
          // Get students from group's studentIds array
          const allStudentIds = groups.flatMap((g) => g.studentIds);
          const students = await db.studentProfile.findMany({
            where: {
              id: { in: allStudentIds },
              tenantId,
            },
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          });
          targetStudents = students.map((s) => ({
            id: s.id,
            name: s.user.name,
            email: s.user.email,
            avatar: s.user.avatar,
            currentGrade: s.currentGrade,
          }));
        } else {
          // INDIVIDUAL
          const students = await db.studentProfile.findMany({
            where: {
              id: { in: assignment.targetIds },
              tenantId,
            },
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          });
          targetStudents = students.map((s) => ({
            id: s.id,
            name: s.user.name,
            email: s.user.email,
            avatar: s.user.avatar,
            currentGrade: s.currentGrade,
          }));
        }

        // Calculate progress stats
        const totalStudents = targetStudents.length;
        const completedCount = assignment.attempts.filter((a) => a.status === 'COMPLETED').length;
        const inProgressCount = assignment.attempts.filter((a) => a.status === 'IN_PROGRESS').length;
        const pendingCount = totalStudents - completedCount - inProgressCount;

        return NextResponse.json({
          success: true,
          data: {
            assignment: {
              id: assignment.id,
              title: assignment.title,
              description: assignment.description,
              targetType: assignment.targetType,
              questCount: assignment.questCount,
              questTypes: assignment.questTypes,
              intent: assignment.intent,
              dueDate: assignment.dueDate,
              createdAt: assignment.createdAt,
              isActive: assignment.isActive,
            },
            targetStudents,
            progress: {
              total: totalStudents,
              completed: completedCount,
              inProgress: inProgressCount,
              pending: pendingCount,
            },
            attempts: assignment.attempts.map((attempt) => ({
              id: attempt.id,
              studentId: attempt.studentId,
              studentName: attempt.student.user.name,
              status: attempt.status,
              assignedAt: attempt.assignedAt,
              startedAt: attempt.startedAt,
              completedAt: attempt.completedAt,
            })),
          },
        });
      } catch (error: any) {
        console.error('Error fetching assignment:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch assignment' },
          { status: 500 }
        );
      }
    })
  )(req);
}

