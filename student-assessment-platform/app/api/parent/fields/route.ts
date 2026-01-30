/**
 * Parent Fields API
 * 
 * Returns fields where child may flourish.
 * 
 * @module app/api/parent/fields
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isParent } from '@/lib/role-utils';
import { ParentFieldsDTO } from '@/lib/parent-dtos';

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
              fields: [
                {
                  category: 'Analytical & Research',
                  name: 'Data Analysis',
                  whyItAligns: 'Strong pattern recognition and analytical thinking signals suggest alignment with analytical fields',
                  suggestedExploration: [
                    'Try data visualization projects',
                    'Explore scientific research methods',
                    'Practice logical reasoning puzzles',
                  ],
                  disclaimer: 'This doesn\'t limit future options.',
                },
                {
                  category: 'Creative & Expressive',
                  name: 'Creative Expression',
                  whyItAligns: 'Creative problem-solving signals indicate potential in creative fields',
                  suggestedExploration: [
                    'Engage in creative writing or art projects',
                    'Explore music or design',
                    'Try storytelling activities',
                  ],
                  disclaimer: 'This doesn\'t limit future options.',
                },
              ],
            },
          });
        }

        const skillScores = await db.skillScore.findMany({
          where: { studentId: student.id, tenantId },
        });

        const fields: ParentFieldsDTO['fields'] = [];

        // Analytical & Research
        const analyticalScore = skillScores.find(s => s.category === 'COGNITIVE_REASONING')?.score || 0;
        if (analyticalScore > 60) {
          fields.push({
            category: 'Analytical & Research',
            name: 'Data Analysis',
            whyItAligns: 'Strong pattern recognition and analytical thinking signals suggest alignment with analytical fields',
            suggestedExploration: [
              'Try data visualization projects',
              'Explore scientific research methods',
              'Practice logical reasoning puzzles',
            ],
            disclaimer: 'This doesn\'t limit future options.',
          });
        }

        // Creative & Expressive
        const creativeScore = skillScores.find(s => s.category === 'CREATIVITY')?.score || 0;
        if (creativeScore > 60) {
          fields.push({
            category: 'Creative & Expressive',
            name: 'Creative Expression',
            whyItAligns: 'Creative problem-solving signals indicate potential in creative fields',
            suggestedExploration: [
              'Engage in creative writing or art projects',
              'Explore music or design',
              'Try storytelling activities',
            ],
            disclaimer: 'This doesn\'t limit future options.',
          });
        }

        return NextResponse.json({ success: true, data: { fields } });
      } catch (error: any) {
        console.error('Error fetching fields data:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch fields data' },
          { status: 500 }
        );
      }
    })
  )(req);
}

