/**
 * Parent Profile API
 * 
 * Manage parent profile information.
 * 
 * @module app/api/parent/profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isParent } from '@/lib/role-utils';
import { ParentProfileDTO } from '@/lib/parent-dtos';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  timezone: z.string().max(50).optional(),
});

/**
 * GET /api/parent/profile
 * 
 * Get parent profile information
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

        // DEMO_PARENT mode: return deterministic dummy data
        if (process.env.DEMO_PARENT === 'true') {
          return NextResponse.json({
            success: true,
            data: {
              user: {
                id: user.id,
                name: 'Demo Parent',
                email: user.email || 'parent@example.com',
                phone: '+91 98765 43210',
                avatar: null,
              },
              profile: {
                displayName: 'Demo Parent',
                timezone: 'Asia/Kolkata',
              },
              linkedStudent: {
                id: 'demo-student-1',
                name: 'Demo Student',
                grade: 9,
                section: 'A',
                tenantName: 'Demo School',
              },
              communicationSummary: {
                emailEnabled: true,
                inAppEnabled: true,
              },
            },
          });
        }

        // Get user with tenant
        const parentUser = await db.user.findUnique({
          where: {
            id: user.id,
            tenantId,
          },
          include: {
            tenant: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!parentUser) {
          return NextResponse.json(
            { success: false, error: 'User not found' },
            { status: 404 }
          );
        }

        // Find linked student
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
              },
            },
            tenant: {
              select: {
                name: true,
              },
            },
          },
        });

        // Get communication preferences from settings (or defaults)
        const settings = await db.user.findUnique({
          where: { id: user.id, tenantId },
          select: { metadata: true },
        });

        const metadata = (settings?.metadata as any) || {};
        const notificationPrefs = metadata.parentSettings?.notificationPrefs || {};

        const profileData: ParentProfileDTO = {
          user: {
            id: parentUser.id,
            name: parentUser.name,
            email: parentUser.email,
            phone: parentUser.phone || undefined,
            avatar: parentUser.avatar || undefined,
          },
          profile: {
            displayName: metadata.displayName || undefined,
            timezone: metadata.timezone || 'Asia/Kolkata',
          },
          linkedStudent: student
            ? {
                id: student.id,
                name: student.user.name,
                grade: student.currentGrade,
                section: student.section || undefined,
                tenantName: student.tenant.name,
              }
            : null,
          communicationSummary: {
            emailEnabled: notificationPrefs.emailEnabled !== false,
            inAppEnabled: notificationPrefs.inAppEnabled !== false,
          },
        };

        return NextResponse.json({
          success: true,
          data: profileData,
        });
      } catch (error: any) {
        console.error('Error fetching parent profile:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch profile' },
          { status: 500 }
        );
      }
    })
  )(req);
}

/**
 * PUT /api/parent/profile
 * 
 * Update parent profile information
 */
export async function PUT(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isParent(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only parents can access this endpoint' },
            { status: 403 }
          );
        }

        const body = await req.json();
        const validated = UpdateProfileSchema.parse(body);

        // Get current user metadata
        const currentUser = await db.user.findUnique({
          where: {
            id: user.id,
            tenantId,
          },
          select: {
            metadata: true,
            phone: true,
          },
        });

        const metadata = (currentUser?.metadata as any) || {};

        // Update metadata with profile fields
        if (validated.displayName !== undefined) {
          metadata.displayName = validated.displayName;
        }
        if (validated.timezone !== undefined) {
          metadata.timezone = validated.timezone;
        }

        // Update user phone if provided
        const updateData: any = {
          metadata,
        };
        if (validated.phone !== undefined) {
          updateData.phone = validated.phone || null;
        }

        await db.user.update({
          where: {
            id: user.id,
            tenantId,
          },
          data: updateData,
        });

        return NextResponse.json({
          success: true,
          data: {
            message: 'Profile updated successfully',
          },
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { success: false, error: 'Invalid input', details: error.issues },
            { status: 400 }
          );
        }
        console.error('Error updating parent profile:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to update profile' },
          { status: 500 }
        );
      }
    })
  )(req);
}

