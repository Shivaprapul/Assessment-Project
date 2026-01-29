/**
 * Teacher Student Report API
 * 
 * Returns brief actionable report for a specific student.
 * 
 * TEACHER-SAFE DATA ONLY:
 * - Brief insights (not full AI narratives)
 * - Skill highlights with neutral wording
 * - Recent activity summaries
 * - Recommended classroom actions
 * 
 * TEACHER MUST NOT SEE:
 * - Full AI narrative reports
 * - Career predictions/unlocks
 * - Sensitive trait inference
 * - Parent-only support actions
 * - Peer rankings/percentiles
 * - Medical/health inferences
 * - Diagnosis-like labels
 * 
 * @module app/api/teacher/students/[studentId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/role-utils';
import { generateDemoStudentDrilldown } from '@/lib/demo/teacher-student-demo';

/**
 * GET /api/teacher/students/:studentId
 * 
 * Get brief actionable report for a student (teacher-safe only)
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> }
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

        const { studentId } = params;
        const isDemoMode = process.env.DEMO_TEACHER === 'true';

        // Handle demo students
        if (isDemoMode && studentId.startsWith('demo-student-')) {
          const grade = 9; // Default, could be enhanced to get from ClassSection
          const demoData = generateDemoStudentDrilldown(studentId, grade);
          return NextResponse.json({
            success: true,
            data: demoData,
          });
        }

        // Get teacher's active ClassSection to verify access
        const classSection = await db.classSection.findFirst({
          where: {
            tenantId,
            teacherId: user.id,
            isActive: true,
          },
        });

        // Verify student belongs to teacher's section
        const student = await db.studentProfile.findFirst({
          where: {
            id: studentId,
            tenantId,
            ...(classSection ? {
              classSectionId: classSection.id,
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
            skillScores: {
              orderBy: [
                { score: 'desc' },
                { lastUpdatedAt: 'desc' },
              ],
            },
            questAttempts: {
              where: {
                status: 'COMPLETED',
                completedAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
                // Filter by grade at time of attempt (grade-aware)
                ...(classSection ? {
                  gradeAtTimeOfAttempt: classSection.grade,
                } : {}),
              },
              orderBy: {
                completedAt: 'desc',
              },
              take: 10,
            },
          },
        });

        if (!student) {
          return NextResponse.json(
            { success: false, error: 'Student not found' },
            { status: 404 }
          );
        }

        // Calculate weekly activity
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weeklyQuests = student.questAttempts.filter(
          (q) => q.completedAt && new Date(q.completedAt) >= weekAgo
        );

        // Calculate accuracy (ensure it's 0-100 range)
        const weeklyAccuracy = weeklyQuests.length > 0
          ? Math.min(100, Math.max(0, weeklyQuests.reduce((sum, q) => {
              const scoreSummary = q.scoreSummary as any;
              const accuracy = scoreSummary?.accuracy || 0;
              // If accuracy is already in 0-100 range, use as-is; if 0-1 range, multiply by 100
              const normalizedAccuracy = accuracy > 1 ? accuracy : accuracy * 100;
              return sum + normalizedAccuracy;
            }, 0) / weeklyQuests.length))
          : 0;

        // Calculate streak (consecutive days with activity in last 7 days)
        const activityDays = new Set(
          weeklyQuests
            .map(q => q.completedAt ? new Date(q.completedAt).toDateString() : null)
            .filter(Boolean)
        );
        const streak = activityDays.size;

        // Determine status
        const daysSinceCreated = Math.floor(
          (Date.now() - student.createdAt.getTime()) / (24 * 60 * 60 * 1000)
        );
        let status: 'active' | 'needs_nudge' | 'new_joiner' = 'active';
        if (daysSinceCreated <= 7) {
          status = 'new_joiner';
        } else if (weeklyQuests.length === 0) {
          status = 'needs_nudge';
        }

        // Get initials
        const initials = student.user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        // Get top 3 strengths (highest scores, teacher-safe wording)
        // If less than 3 with ADVANCED/PROFICIENT, fill with top scores by score value
        const allStrengths = student.skillScores
          .filter((s) => s.level === 'ADVANCED' || s.level === 'PROFICIENT')
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
        
        // If we don't have 3, add top scores regardless of level
        if (allStrengths.length < 3) {
          const remaining = student.skillScores
            .filter((s) => !allStrengths.some(as => as.id === s.id))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3 - allStrengths.length);
          allStrengths.push(...remaining);
        }
        
        const strengths = allStrengths.slice(0, 3).map((s) => ({
          skill: s.category.replace(/_/g, ' ').toLowerCase(),
          score: s.score,
          level: s.level.toLowerCase(),
          trend7d: s.trend === 'IMPROVING' ? 'improving' : s.trend === 'STABLE' ? 'stable' : 'needs_attention',
          trend30d: s.trend === 'IMPROVING' ? 'improving' : 'stable',
        }));

        // Get 2 strengthening areas (areas that need work - lower scores or NEEDS_ATTENTION)
        // Prioritize NEEDS_ATTENTION, then lower scores
        const strengtheningAreas = student.skillScores
          .filter((s) => s.trend === 'NEEDS_ATTENTION' || s.score < 60)
          .sort((a, b) => {
            // Prioritize NEEDS_ATTENTION, then by lowest score
            if (a.trend === 'NEEDS_ATTENTION' && b.trend !== 'NEEDS_ATTENTION') return -1;
            if (b.trend === 'NEEDS_ATTENTION' && a.trend !== 'NEEDS_ATTENTION') return 1;
            return a.score - b.score; // Lower scores first
          })
          .slice(0, 2)
          .map((s) => ({
            skill: s.category.replace(/_/g, ' ').toLowerCase(),
            score: s.score,
            trend7d: s.trend === 'IMPROVING' ? 'improving' : 'needs_attention',
            trend30d: s.trend === 'IMPROVING' ? 'improving' : 'stable',
          }));

        // Generate "This Week in Brief" insights (teacher-safe, brief)
        const topStrength = strengths[0];
        const topStrengthening = strengtheningAreas[0];
        
        const thisWeekInsights = {
          strength: topStrength ? {
            skill: topStrength.skill,
            message: `Shows consistent strength in ${topStrength.skill}`,
          } : null,
          strengthening: topStrengthening ? {
            skill: topStrengthening.skill,
            message: `${topStrengthening.skill} is becoming more consistent with practice`,
          } : null,
          engagement: weeklyQuests.length > 3
            ? 'Maintaining steady engagement this week'
            : weeklyQuests.length > 0
            ? 'Engagement is building'
            : 'Could benefit from a gentle nudge to re-engage',
        };

        // Recent activity (teacher-safe: title, type, date, status, brief summary)
        // Limit to 5 activities
        const recentActivity = student.questAttempts.slice(0, 5).map((attempt) => {
          const questType = attempt.questType || 'quest';
          const scoreSummary = attempt.scoreSummary as any;
          const skillTags = (scoreSummary?.skillSignals || []).slice(0, 2).map((s: string) =>
            s.replace(/_/g, ' ').toLowerCase()
          );
          const xpEarned = scoreSummary?.xpEarned || 0;
          const timeTaken = scoreSummary?.timeTaken || 0;

          return {
            id: attempt.id,
            title: `${questType.replace(/_/g, ' ')} quest`,
            type: questType.toLowerCase(),
            completedAt: attempt.completedAt?.toISOString() || null,
            completedAtFormatted: attempt.completedAt
              ? new Date(attempt.completedAt).toLocaleDateString()
              : 'Unknown',
            status: 'COMPLETED',
            xpEarned,
            timeTaken,
            skillTags,
          };
        });

        // Generate recommended actions (brief, actionable, teacher-safe)
        const recommendedActions: string[] = [];

        if (weeklyQuests.length === 0) {
          recommendedActions.push('Assign a quick activity to re-engage participation');
        }

        if (topStrengthening) {
          recommendedActions.push(
            `Use 2-minute planning prompt before tasks to support ${topStrengthening.skill}`
          );
        }

        if (strengtheningAreas.length > 0) {
          recommendedActions.push(
            `Pair with structured teammate for collaborative activities`
          );
        }

        if (topStrength) {
          recommendedActions.push(
            `Leverage strength in ${topStrength.skill} in group activities`
          );
        }

        if (recommendedActions.length < 3) {
          recommendedActions.push('Give timed focus sprints (5-10 min) to build attention');
        }

        const lastAttempt = student.questAttempts[0];
        const lastActive = lastAttempt?.completedAt
          ? new Date(lastAttempt.completedAt).toLocaleDateString()
          : null;
        const lastActiveTimestamp = lastAttempt?.completedAt
          ? lastAttempt.completedAt.toISOString()
          : null;

        // Teacher Notes (empty by default, can be added via POST endpoint)
        const teacherNotes: any[] = [];

        // Return teacher-safe DTO only
        return NextResponse.json({
          success: true,
          data: {
            id: student.id,
            name: student.user.name,
            initials,
            currentGrade: student.currentGrade,
            section: student.section || 'A',
            lastActive,
            lastActiveTimestamp,
            weeklyActivity: {
              questsCompleted: weeklyQuests.length,
              streak,
              avgAccuracy: Math.round(weeklyAccuracy), // Already in 0-100 range
            },
            status,
            thisWeekInsights,
            skillHighlights: {
              topStrengths: strengths,
              topStrengthening: strengtheningAreas,
            },
            recentActivity,
            recommendedActions: recommendedActions.slice(0, 4),
            teacherNotes,
          },
        });
      } catch (error: any) {
        console.error('Error fetching student report:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch student report' },
          { status: 500 }
        );
      }
    })
  )(req);
}

