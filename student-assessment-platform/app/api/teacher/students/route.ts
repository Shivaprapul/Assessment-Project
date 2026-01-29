/**
 * Teacher Students API
 * 
 * Returns list of students for the teacher dashboard.
 * 
 * @module app/api/teacher/students
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/role-utils';
import { generateDemoStudents } from '@/lib/demo/teacher-demo-data';

/**
 * GET /api/teacher/students
 * 
 * Get list of students for teacher dashboard
 */
export async function GET(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isTeacher(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only teachers can access this endpoint' },
            { status: 403 }
          );
        }

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

        // Get students in teacher's ClassSection, filtered by grade
        const students = await db.studentProfile.findMany({
          where: {
            tenantId,
            ...(classSection ? {
              classSectionId: classSection.id,
              currentGrade: classSection.grade, // Only current grade students
            } : {}),
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            skillScores: {
              orderBy: {
                score: 'desc',
              },
              take: 3,
            },
            questAttempts: {
              where: {
                status: 'COMPLETED',
                completedAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
                // Filter by grade at time of attempt (grade-aware)
                ...(classSection ? {
                  gradeAtTimeOfAttempt: classSection.grade,
                } : {}),
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        });

        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

        const studentSummaries = students.map((student) => {
          // Determine status
          let status: 'active' | 'needs_nudge' | 'new_joiner' = 'active';
          const daysSinceCreated = Math.floor(
            (Date.now() - student.createdAt.getTime()) / (24 * 60 * 60 * 1000)
          );
          if (daysSinceCreated <= 7) {
            status = 'new_joiner';
          } else if (student.questAttempts.length === 0) {
            status = 'needs_nudge';
          }

          // Get last active date
          const lastAttempt = student.questAttempts[0];
          const lastActive = lastAttempt?.completedAt
            ? new Date(lastAttempt.completedAt).toLocaleDateString()
            : null;

          // Get skill highlights
          const skillHighlights = student.skillScores
            .slice(0, 3)
            .map((score) => score.category.replace(/_/g, ' ').toLowerCase());

          return {
            id: student.id,
            name: student.user.name,
            lastActive,
            questsCompleted: student.questAttempts.length,
            skillHighlights,
            status,
            currentGrade: student.currentGrade,
          };
        });

        // Check for demo mode or if we have very few real students
        const isDemoMode = process.env.DEMO_TEACHER === 'true';
        const shouldUseDemoData = isDemoMode || studentSummaries.length < 5;
        
        if (shouldUseDemoData) {
          const grade = classSection?.grade || 9;
          const demoStudents = generateDemoStudents(grade, 20);
          
          // Merge real students with demo students (real students first)
          const allStudents = [...studentSummaries, ...demoStudents];
          
          return NextResponse.json({
            success: true,
            data: allStudents,
          });
        }

        return NextResponse.json({
          success: true,
          data: studentSummaries,
        });
      } catch (error: any) {
        console.error('Error fetching students:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch students' },
          { status: 500 }
        );
      }
    })
  )(req);
}

