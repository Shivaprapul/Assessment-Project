/**
 * Teacher Class Signals API
 * 
 * Returns deterministic class insights for the teacher dashboard.
 * 
 * @module app/api/teacher/class-signals
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/role-utils';
import { generateDemoClassSignals } from '@/lib/demo/teacher-demo-data';

/**
 * GET /api/teacher/class-signals
 * 
 * Get class signals (insights) for the teacher dashboard
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

        // Check for demo mode
        const isDemoMode = process.env.DEMO_TEACHER === 'true';
        
        if (isDemoMode) {
          const demoSignals = generateDemoClassSignals();
          return NextResponse.json({
            success: true,
            data: demoSignals,
          });
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
            skillScores: true,
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
        });

        if (students.length === 0) {
          return NextResponse.json({
            success: true,
            data: [
              {
                type: 'anomaly',
                message: 'No students found in your class yet.',
                trend: 'stable' as const,
              },
            ],
          });
        }

        // Generate deterministic class signals
        const signals = [];

        // 1. Engagement trend
        const totalQuests = students.reduce((sum, s) => sum + s.questAttempts.length, 0);
        const avgQuestsPerStudent = totalQuests / students.length;
        if (avgQuestsPerStudent >= 3) {
          signals.push({
            type: 'engagement',
            message: `This week, many students are actively practicing with ${Math.round(avgQuestsPerStudent)} quests per student on average.`,
            trend: 'up' as const,
          });
        } else if (avgQuestsPerStudent >= 1) {
          signals.push({
            type: 'engagement',
            message: `This week, students are practicing with ${Math.round(avgQuestsPerStudent)} quest per student on average.`,
            trend: 'stable' as const,
          });
        } else {
          signals.push({
            type: 'engagement',
            message: 'This week, engagement is lower than usual. Consider assigning activities to re-engage participation.',
            trend: 'down' as const,
          });
        }

        // 2. Common strengthening area
        const skillCounts: Record<string, number> = {};
        students.forEach((student) => {
          student.skillScores.forEach((score) => {
            if (score.trend === 'IMPROVING') {
              const skillName = score.category.replace(/_/g, ' ').toLowerCase();
              skillCounts[skillName] = (skillCounts[skillName] || 0) + 1;
            }
          });
        });

        const topStrengthening = Object.entries(skillCounts)
          .sort(([, a], [, b]) => b - a)[0];

        if (topStrengthening && topStrengthening[1] >= 2) {
          signals.push({
            type: 'strengthening',
            message: `Many students are strengthening ${topStrengthening[0]}. This is a good time to build on this momentum.`,
            trend: 'up' as const,
          });
        }

        // 3. Common strength
        const strengthCounts: Record<string, number> = {};
        students.forEach((student) => {
          student.skillScores.forEach((score) => {
            if (score.level === 'ADVANCED' || score.level === 'PROFICIENT') {
              const skillName = score.category.replace(/_/g, ' ').toLowerCase();
              strengthCounts[skillName] = (strengthCounts[skillName] || 0) + 1;
            }
          });
        });

        const topStrength = Object.entries(strengthCounts)
          .sort(([, a], [, b]) => b - a)[0];

        if (topStrength && topStrength[1] >= students.length * 0.3) {
          signals.push({
            type: 'strength',
            message: `Many students show strength in ${topStrength[0]}. Consider using this in group activities.`,
            trend: 'stable' as const,
          });
        }

        // 4. Activity anomalies (students with no activity in last 7 days)
        const inactiveStudents = students.filter((s) => s.questAttempts.length === 0);
        if (inactiveStudents.length > 0 && inactiveStudents.length <= students.length * 0.2) {
          signals.push({
            type: 'anomaly',
            message: `${inactiveStudents.length} student${inactiveStudents.length > 1 ? 's' : ''} haven't completed any quests this week. Consider reaching out.`,
            trend: 'down' as const,
          });
        }

        return NextResponse.json({
          success: true,
          data: signals.slice(0, 6), // Max 6 signals
        });
      } catch (error: any) {
        console.error('Error fetching class signals:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch class signals' },
          { status: 500 }
        );
      }
    })
  )(req);
}

