/**
 * Get Career Unlocks API Route
 * 
 * Returns all unlocked careers for the current student.
 * 
 * @module app/api/explorer/unlocks
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { getCareerById } from '@/lib/career-catalog';

/**
 * GET /api/explorer/unlocks
 * 
 * Get unlocked careers
 */
export async function GET(req: NextRequest) {
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

    return requireAuth(
      withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
        try {
          if (user.role !== 'STUDENT') {
            return NextResponse.json(
              {
                success: false,
                error: 'Only students can view unlocks',
              },
              { status: 403 }
            );
          }

          // Get student profile
          const student = await db.studentProfile.findUnique({
            where: {
              userId: user.id,
              tenantId,
            },
          });

          if (!student) {
            return NextResponse.json(
              {
                success: false,
                error: 'Student profile not found',
              },
              { status: 404 }
            );
          }

          // Get all unlocks
          const unlocks = await db.careerUnlock.findMany({
            where: {
              studentId: student.id,
              tenantId,
            },
            orderBy: {
              unlockedAt: 'desc',
            },
          });

          // Enrich with career data
          const enrichedUnlocks = unlocks.map(unlock => {
            const career = getCareerById(unlock.careerId);
            return {
              id: unlock.id,
              careerId: unlock.careerId,
              unlockedAt: unlock.unlockedAt,
              reasonEvidence: unlock.reasonEvidence,
              linkedSkills: unlock.linkedSkills,
              career: career ? {
                id: career.id,
                title: career.title,
                shortPitch: career.shortPitch,
                icon: career.icon,
                rarityTier: career.rarityTier,
              } : null,
            };
          });

          return NextResponse.json(
            {
              success: true,
              data: {
                unlocks: enrichedUnlocks,
                total: enrichedUnlocks.length,
              },
            },
            { status: 200 }
          );
        } catch (error: any) {
          console.error('Error in unlocks:', error);
          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to load unlocks',
            },
            { status: 500 }
          );
        }
      })
    )(req);
  } catch (error: any) {
    console.error('Error in unlocks wrapper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

