/**
 * Teacher Class Focus API
 * 
 * Get and update class focus priorities.
 * 
 * @module app/api/teacher/class-focus
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/role-utils';

/**
 * GET /api/teacher/class-focus
 * 
 * Get current class focus profile
 */
export async function GET(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isTeacher(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only teachers can access class focus' },
            { status: 403 }
          );
        }

        // Get active class focus profile
        const focusProfile = await db.classFocusProfile.findFirst({
          where: {
            tenantId,
            teacherId: user.id,
            isActive: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        });

        return NextResponse.json({
          success: true,
          data: focusProfile || null,
        });
      } catch (error: any) {
        console.error('Error fetching class focus:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch class focus' },
          { status: 500 }
        );
      }
    })
  )(req);
}

/**
 * POST /api/teacher/class-focus
 * 
 * Create or update class focus profile
 */
export async function POST(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isTeacher(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only teachers can update class focus' },
            { status: 403 }
          );
        }

        const body = await req.json();
        const { grade, focusWindow, priorityBoosts, notes } = body;

        // Validate priority boosts (max 0.2 per skill)
        const validatedBoosts: Record<string, number> = {};
        for (const [skill, boost] of Object.entries(priorityBoosts || {})) {
          validatedBoosts[skill] = Math.min(0.2, Math.max(0, boost as number));
        }

        // Deactivate existing active profiles
        await db.classFocusProfile.updateMany({
          where: {
            tenantId,
            teacherId: user.id,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });

        // Create new focus profile
        const focusProfile = await db.classFocusProfile.create({
          data: {
            tenantId,
            teacherId: user.id,
            grade: grade || null,
            focusWindow: focusWindow || {},
            priorityBoosts: validatedBoosts,
            notes: notes || null,
            isActive: true,
          },
        });

        return NextResponse.json({
          success: true,
          data: focusProfile,
        });
      } catch (error: any) {
        console.error('Error saving class focus:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to save class focus' },
          { status: 500 }
        );
      }
    })
  )(req);
}

