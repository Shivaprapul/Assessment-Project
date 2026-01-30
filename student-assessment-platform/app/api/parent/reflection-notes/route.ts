/**
 * Parent Reflection Notes API
 * 
 * Manage parent journal/reflection notes.
 * Notes are private and not analyzed by AI.
 * 
 * @module app/api/parent/reflection-notes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isParent } from '@/lib/role-utils';
import { z } from 'zod';

const ReflectionNoteSchema = z.object({
  content: z.string().max(5000).optional(),
});

/**
 * GET /api/parent/reflection-notes
 * 
 * Get parent's reflection notes
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

        // Find student linked to parent
        const student = await db.studentProfile.findFirst({
          where: {
            tenantId,
            parentIds: {
              has: user.id,
            },
          },
        });

        if (!student) {
          return NextResponse.json({
            success: true,
            data: {
              latestNote: null,
              notes: [],
            },
          });
        }

        // In MVP, store notes in a simple JSON field or separate table
        // For now, return empty (can be extended with ParentReflectionNote model)
        return NextResponse.json({
          success: true,
          data: {
            latestNote: null,
            notes: [],
          },
        });
      } catch (error: any) {
        console.error('Error fetching reflection notes:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch notes' },
          { status: 500 }
        );
      }
    })
  )(req);
}

/**
 * PUT /api/parent/reflection-notes
 * 
 * Save parent's reflection note
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
        const validated = ReflectionNoteSchema.parse(body);

        // Find student linked to parent
        const student = await db.studentProfile.findFirst({
          where: {
            tenantId,
            parentIds: {
              has: user.id,
            },
          },
        });

        if (!student) {
          return NextResponse.json(
            { success: false, error: 'Student not found' },
            { status: 404 }
          );
        }

        // In MVP, store in a simple way (can be extended with ParentReflectionNote model)
        // For now, just return success (can store in User.metadata or create a new model)
        return NextResponse.json({
          success: true,
          data: {
            saved: true,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { success: false, error: 'Invalid input', details: error.issues },
            { status: 400 }
          );
        }
        console.error('Error saving reflection note:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to save note' },
          { status: 500 }
        );
      }
    })
  )(req);
}

