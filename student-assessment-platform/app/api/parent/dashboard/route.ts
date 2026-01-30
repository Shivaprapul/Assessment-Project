/**
 * Parent Dashboard API
 * 
 * Returns parent-safe dashboard data with evidence gating.
 * 
 * @module app/api/parent/dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isParent } from '@/lib/role-utils';
import {
  checkGlobalGate,
  checkDiversityGate,
  gateTalentSignals,
  canShowGentleObservations,
  canShowProgressNarrative,
  TalentSignal,
} from '@/lib/parent-evidence-gating';
import {
  generateTalentSignals,
  generateGentleObservations,
  generateProgressNarrative,
  generateSupportActions,
  calculateStreak,
} from '@/lib/parent-talent-signals';
import { ParentDashboardDTO } from '@/lib/parent-dtos';

/**
 * GET /api/parent/dashboard
 * 
 * Get parent dashboard data with evidence gating
 */
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

        // Find student(s) linked to this parent
        // MVP: Get first student (can extend to multiple later)
        const student = await db.studentProfile.findFirst({
          where: {
            tenantId,
            parentIds: {
              has: user.id,
            },
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

        // DEMO_PARENT mode: return deterministic dummy data
        if (process.env.DEMO_PARENT === 'true' || !student) {
          return NextResponse.json({
            success: true,
            data: {
              atAGlance: {
                weeklyEngagement: 12,
                streak: 5,
                completionCount: 15,
              },
              confidentInsights: {
                signals: [
                  {
                    id: 'signal-1',
                    name: 'Pattern Recognition',
                    confidence: 'MODERATE',
                    explanation: 'Shows strong ability to identify patterns and sequences',
                    evidenceSummary: 'observed across 12 activities in 4 different contexts',
                    minObs: 5,
                    minContexts: 2,
                    stability: 0.6,
                    observedCount: 12,
                    contextsCount: 4,
                    stabilityScore: 0.75,
                    supportActions: [
                      'Encourage puzzle games and pattern-based activities at home',
                      'Notice when they naturally spot patterns in daily life',
                    ],
                  },
                  {
                    id: 'signal-2',
                    name: 'Creative Problem-Solving',
                    confidence: 'EMERGING',
                    explanation: 'Demonstrates creative approaches to challenges',
                    evidenceSummary: 'observed across 8 activities in 3 different contexts',
                    minObs: 5,
                    minContexts: 2,
                    stability: 0.6,
                    observedCount: 8,
                    contextsCount: 3,
                    stabilityScore: 0.65,
                    supportActions: [
                      'Provide open-ended challenges that allow multiple solutions',
                      'Celebrate creative approaches, not just correct answers',
                    ],
                  },
                ],
                globalGateMet: true,
                remainingActivities: 0,
              },
              gentleObservations: {
                unlocked: true,
                observations: [
                  'We\'re noticing a preference for visual-spatial tasks over text-heavy activities',
                  'Across several activities, there\'s a pattern of persistence when the challenge feels personally meaningful',
                ],
              },
              progressNarrative: {
                unlocked: true,
                narrative: {
                  then: 'Early activities showed curiosity and willingness to try new things',
                  now: 'Current patterns indicate growing confidence in pattern recognition and creative problem-solving',
                  next: 'The system is focusing on building consistency in planning and metacognitive reflection',
                },
              },
              supportActions: [
                {
                  action: 'Try pattern-based games together this week',
                  mappedToSignal: 'signal-1',
                  lowEffort: true,
                },
                {
                  action: 'Ask open-ended questions about their problem-solving process',
                  mappedToSignal: 'signal-2',
                  lowEffort: true,
                },
              ],
            },
          });
        }

        // Calculate completed activities
        const [assessmentAttempts, questAttempts, activityAttempts] = await Promise.all([
          db.assessmentAttempt.findMany({
            where: {
              studentId: student.id,
              tenantId,
              status: 'COMPLETED',
            },
            select: {
              gameId: true,
              completedAt: true,
            },
          }),
          db.questAttempt.findMany({
            where: {
              studentId: student.id,
              tenantId,
              status: 'COMPLETED',
            },
            select: {
              questType: true,
              completedAt: true,
            },
          }),
          db.activityAttempt.findMany({
            where: {
              studentId: student.id,
              tenantId,
              status: 'COMPLETED',
            },
            select: {
              activityId: true,
              completedAt: true,
            },
          }),
        ]);

        const totalCompletedActivities = 
          assessmentAttempts.length + questAttempts.length + activityAttempts.length;

        // Calculate activity types (unique gameIds, questTypes, activityIds)
        const activityTypes = new Set([
          ...assessmentAttempts.map(a => `assessment_${a.gameId}`),
          ...questAttempts.map(q => `quest_${q.questType}`),
          ...activityAttempts.map(a => `activity_${a.activityId}`),
        ]).size;

        // Calculate skill branches (from skill scores)
        const skillScores = await db.skillScore.findMany({
          where: {
            studentId: student.id,
            tenantId,
          },
          select: {
            category: true,
          },
        });
        const skillBranches = new Set(skillScores.map(s => s.category)).size;

        // Check gates
        const globalGateMet = checkGlobalGate(totalCompletedActivities);
        const diversityGateMet = checkDiversityGate(activityTypes, skillBranches);

        // Generate talent signals (simplified MVP - in production, this would be ML-based)
        const talentSignals: TalentSignal[] = generateTalentSignals(
          student.id,
          tenantId,
          assessmentAttempts.length,
          questAttempts.length,
          activityAttempts.length,
          skillScores.map(s => ({ category: s.category }))
        );

        // Gate signals
        const { unlocked, locked } = gateTalentSignals(talentSignals, totalCompletedActivities);

        // Generate gentle observations
        const gentleObservationsUnlocked = canShowGentleObservations(globalGateMet, unlocked);
        const observations = gentleObservationsUnlocked
          ? generateGentleObservations(unlocked)
          : [];

        // Generate progress narrative
        const progressNarrativeUnlocked = canShowProgressNarrative(globalGateMet, unlocked);
        const narrative = progressNarrativeUnlocked
          ? generateProgressNarrative(unlocked, totalCompletedActivities)
          : null;

        // Generate support actions
        const supportActions = generateSupportActions(unlocked);

        // Calculate weekly engagement and streak
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyActivities = [
          ...assessmentAttempts.filter(a => a.completedAt && a.completedAt >= oneWeekAgo),
          ...questAttempts.filter(q => q.completedAt && q.completedAt >= oneWeekAgo),
          ...activityAttempts.filter(a => a.completedAt && a.completedAt >= oneWeekAgo),
        ].length;

        // Calculate streak (simplified: consecutive days with at least one activity)
        const streak = calculateStreak([
          ...assessmentAttempts.filter(a => a.completedAt).map(a => a.completedAt!),
          ...questAttempts.filter(q => q.completedAt).map(q => q.completedAt!),
          ...activityAttempts.filter(a => a.completedAt).map(a => a.completedAt!),
        ]);

        const dashboardData: ParentDashboardDTO = {
          atAGlance: {
            weeklyEngagement: weeklyActivities,
            streak,
            completionCount: totalCompletedActivities,
          },
          confidentInsights: {
            signals: unlocked,
            globalGateMet,
            remainingActivities: globalGateMet ? 0 : Math.max(0, 10 - totalCompletedActivities),
          },
          gentleObservations: {
            unlocked: gentleObservationsUnlocked,
            observations,
          },
          progressNarrative: {
            unlocked: progressNarrativeUnlocked,
            narrative,
          },
          supportActions,
        };

        return NextResponse.json({
          success: true,
          data: dashboardData,
        });
      } catch (error: any) {
        console.error('Error fetching parent dashboard:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch dashboard data' },
          { status: 500 }
        );
      }
    })
  )(req);
}


