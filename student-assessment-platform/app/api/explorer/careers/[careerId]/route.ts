/**
 * Get Career Detail API Route
 * 
 * Returns detailed information about a specific career.
 * 
 * @module app/api/explorer/careers/[careerId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { getCareerById } from '@/lib/career-catalog';
import { db } from '@/lib/db';

/**
 * GET /api/explorer/careers/:careerId
 * 
 * Get career details
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ careerId: string }> }
) {
  try {
    if (process.env.EXPLORER_MODE !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: 'Explorer mode is not enabled',
        },
        { status: 400 }
      );
    }

    const params = await context.params;
    return requireAuth(
      withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
        try {
          if (user.role !== 'STUDENT') {
            return NextResponse.json(
              {
                success: false,
                error: 'Only students can view careers',
              },
              { status: 403 }
            );
          }

          const { careerId } = params;

          // Get career from catalog
          const career = getCareerById(careerId);

          if (!career) {
            return NextResponse.json(
              {
                success: false,
                error: 'Career not found',
              },
              { status: 404 }
            );
          }

          // Check if student has unlocked this career
          const student = await db.studentProfile.findUnique({
            where: {
              userId: user.id,
              tenantId,
            },
          });

          let unlockInfo = null;
          if (student) {
            const unlock = await db.careerUnlock.findUnique({
              where: {
                studentId_careerId: {
                  studentId: student.id,
                  careerId,
                },
              },
            });

            if (unlock) {
              unlockInfo = {
                unlockedAt: unlock.unlockedAt,
                reasonEvidence: unlock.reasonEvidence,
                linkedSkills: unlock.linkedSkills,
              };
            }
          }

          return NextResponse.json(
            {
              success: true,
              data: {
                career: {
                  id: career.id,
                  title: career.title,
                  shortPitch: career.shortPitch,
                  dayInLife: career.dayInLife,
                  skillSignals: career.skillSignals,
                  recommendedSubjects: career.recommendedSubjects,
                  starterPathSteps: career.starterPathSteps,
                  icon: career.icon,
                  rarityTier: career.rarityTier,
                },
                unlockInfo,
              },
            },
            { status: 200 }
          );
        } catch (error: any) {
          console.error('Error in career detail:', error);
          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to load career',
            },
            { status: 500 }
          );
        }
      })
    )(req);
  } catch (error: any) {
    console.error('Error in career detail wrapper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

