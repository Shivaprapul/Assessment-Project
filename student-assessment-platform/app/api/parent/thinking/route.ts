/**
 * Parent Thinking API
 * 
 * Returns thinking style insights for parent portal.
 * 
 * @module app/api/parent/thinking
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isParent } from '@/lib/role-utils';
import { ParentThinkingDTO } from '@/lib/parent-dtos';
import { gateTalentSignals } from '@/lib/parent-evidence-gating';
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
              thinkingStyleMap: {
                dimensions: [
                  { name: 'Analytical', value: 75, description: 'Strong analytical thinking patterns' },
                  { name: 'Creative', value: 65, description: 'Creative problem-solving approach' },
                  { name: 'Systematic', value: 70, description: 'Methodical and organized thinking' },
                ],
              },
              talentSignals: [],
            },
          });
        }

        // Get skill scores and attempts for thinking style analysis
        const skillScores = await db.skillScore.findMany({
          where: { studentId: student.id, tenantId },
        });

        const [assessmentCount, questCount, activityCount] = await Promise.all([
          db.assessmentAttempt.count({ where: { studentId: student.id, tenantId, status: 'COMPLETED' } }),
          db.questAttempt.count({ where: { studentId: student.id, tenantId, status: 'COMPLETED' } }),
          db.activityAttempt.count({ where: { studentId: student.id, tenantId, status: 'COMPLETED' } }),
        ]);

        const totalActivities = assessmentCount + questCount + activityCount;
        const signals = generateTalentSignals(
          student.id,
          tenantId,
          assessmentCount,
          questCount,
          activityCount,
          skillScores.map(s => ({ category: s.category }))
        );
        const { unlocked } = gateTalentSignals(signals, totalActivities);

        const thinkingData: ParentThinkingDTO = {
          thinkingStyleMap: {
            dimensions: [
              {
                name: 'Analytical',
                value: Math.round((skillScores.find(s => s.category === 'COGNITIVE_REASONING')?.score || 50)),
                description: 'Analytical thinking patterns observed',
              },
              {
                name: 'Creative',
                value: Math.round((skillScores.find(s => s.category === 'CREATIVITY')?.score || 50)),
                description: 'Creative problem-solving approach',
              },
              {
                name: 'Systematic',
                value: Math.round((skillScores.find(s => s.category === 'PLANNING')?.score || 50)),
                description: 'Methodical and organized thinking',
              },
            ],
          },
          talentSignals: unlocked.map(signal => ({
            signal,
            whatWeObserved: `Observed ${signal.name.toLowerCase()} across ${signal.observedCount} activities`,
            whatItMayIndicate: `This may indicate a natural strength in ${signal.name.toLowerCase()}`,
            whatItMeansAtHome: `At home, you might notice this when ${signal.name.toLowerCase()} comes naturally`,
          })),
        };

        return NextResponse.json({ success: true, data: thinkingData });
      } catch (error: any) {
        console.error('Error fetching thinking data:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch thinking data' },
          { status: 500 }
        );
      }
    })
  )(req);
}

