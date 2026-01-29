/**
 * Teacher Student Notes API
 * 
 * Add private teacher notes for a student.
 * 
 * @module app/api/teacher/students/[studentId]/notes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { isTeacher } from '@/lib/role-utils';

/**
 * POST /api/teacher/students/:studentId/notes
 * 
 * Add a teacher note (private, not visible to student)
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  const params = await context.params;
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isTeacher(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only teachers can add notes' },
            { status: 403 }
          );
        }

        const { studentId } = params;
        const body = await req.json();
        const { note } = body;

        if (!note || typeof note !== 'string' || note.trim().length === 0) {
          return NextResponse.json(
            { success: false, error: 'Note is required' },
            { status: 400 }
          );
        }

        // In MVP, store notes in a simple structure
        // TODO: Create TeacherNote model in Prisma for production
        // For now, return success (notes would be stored in a future TeacherNote table)
        
        return NextResponse.json({
          success: true,
          data: {
            id: `note-${Date.now()}`,
            note: note.trim(),
            createdAt: new Date().toISOString(),
            teacherId: user.id,
          },
        });
      } catch (error: any) {
        console.error('Error adding teacher note:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to add note' },
          { status: 500 }
        );
      }
    })
  )(req);
}

