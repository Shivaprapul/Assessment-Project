/**
 * Abandon Assessment Attempt API Route
 * 
 * Marks an in-progress assessment attempt as abandoned.
 * 
 * Multi-tenancy: All routes automatically filter by tenant_id from JWT token
 * Authorization: Students can only abandon their own attempts
 * 
 * @module app/api/assessments/attempts/[attemptId]/abandon
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';

/**
 * POST /api/assessments/attempts/:attemptId/abandon
 * 
 * Abandon an in-progress assessment attempt
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  const params = await context.params;
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        // Only students can abandon their attempts
        if (user.role !== 'STUDENT') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Only students can abandon assessments',
              },
            },
            { status: 403 }
          );
        }

        const { attemptId } = params;

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
              error: {
                code: 'NOT_FOUND',
                message: 'Student profile not found',
              },
            },
            { status: 404 }
          );
        }

        // Find the attempt
        const attempt = await db.assessmentAttempt.findFirst({
          where: {
            id: attemptId,
            studentId: student.id,
            tenantId,
          },
        });

        if (!attempt) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Assessment attempt not found',
              },
            },
            { status: 404 }
          );
        }

        if (attempt.status !== 'IN_PROGRESS') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Can only abandon in-progress attempts',
              },
            },
            { status: 400 }
          );
        }

        // Mark as abandoned
        const abandonedAttempt = await db.assessmentAttempt.update({
          where: {
            id: attemptId,
          },
          data: {
            status: 'ABANDONED',
          },
        });

        return successResponse({
          attemptId: abandonedAttempt.id,
          status: abandonedAttempt.status,
          message: 'Assessment attempt abandoned successfully',
        });
      } catch (error) {
        return handleAPIError(error);
      }
    })
  )(req);
}

