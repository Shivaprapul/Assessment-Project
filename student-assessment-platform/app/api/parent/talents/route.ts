/**
 * Parent Talents API
 * 
 * Returns hidden and emerging talents insights.
 * 
 * @module app/api/parent/talents
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isParent } from '@/lib/role-utils';
import { ParentTalentsDTO } from '@/lib/parent-dtos';
import { gateTalentSignals, checkGlobalGate } from '@/lib/parent-evidence-gating';
import { generateTalentSignals } from '@/lib/parent-talent-signals';

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
              title: 'Strengths You May Not Notice in Exams',
              signals: [
                {
                  signal: {
                    id: 'creative-problem-solving',
                    name: 'Creative Problem-Solving',
                    confidence: 'MODERATE',
                    explanation: 'Demonstrates creative approaches to challenges',
                    evidenceSummary: 'observed across 8 activities in 3 different contexts',
                    minObs: 5,
                    minContexts: 2,
                    stability: 0.6,
                    observedCount: 8,
                    contextsCount: 3,
                    stabilityScore: 0.65,
                    supportActions: [],
                  },
                  whyHiddenInSchool: 'This strength may not show up in traditional exams that focus on single correct answers',
                  realWorldExamples: [
                    'Finding multiple ways to solve a problem',
                    'Connecting ideas from different subjects',
                    'Thinking outside the box when stuck',
                  ],
                  supportTip: 'Encourage creative projects and open-ended questions at home',
                },
              ],
              lockedPlaceholders: [],
            },
          });
        }

        // Calculate activities and gates
        const [assessmentCount, questCount, activityCount] = await Promise.all([
          db.assessmentAttempt.count({ where: { studentId: student.id, tenantId, status: 'COMPLETED' } }),
          db.questAttempt.count({ where: { studentId: student.id, tenantId, status: 'COMPLETED' } }),
          db.activityAttempt.count({ where: { studentId: student.id, tenantId, status: 'COMPLETED' } }),
        ]);

        const totalActivities = assessmentCount + questCount + activityCount;
        const globalGateMet = checkGlobalGate(totalActivities);

        const skillScores = await db.skillScore.findMany({
          where: { studentId: student.id, tenantId },
        });

        const signals = generateTalentSignals(
          student.id,
          tenantId,
          assessmentCount,
          questCount,
          activityCount,
          skillScores.map(s => ({ category: s.category }))
        );
        const { unlocked } = gateTalentSignals(signals, totalActivities);

        const talentsData: ParentTalentsDTO = {
          title: 'Strengths You May Not Notice in Exams',
          signals: unlocked.map(signal => ({
            signal,
            whyHiddenInSchool: `This strength may not show up in traditional exams that focus on single correct answers`,
            realWorldExamples: [
              'Finding multiple ways to solve a problem',
              'Connecting ideas from different subjects',
              'Thinking outside the box when stuck',
            ],
            supportTip: `Encourage ${signal.name.toLowerCase()} through open-ended activities at home`,
          })),
          lockedPlaceholders: globalGateMet ? [] : [
            {
              message: 'Complete more activities to unlock talent insights',
              activitiesNeeded: Math.max(0, 10 - totalActivities),
            },
          ],
        };

        return NextResponse.json({ success: true, data: talentsData });
      } catch (error: any) {
        console.error('Error fetching talents data:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch talents data' },
          { status: 500 }
        );
      }
    })
  )(req);
}

