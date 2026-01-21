/**
 * Update Assessment Progress API Route
 * 
 * Handles updating assessment progress (saving state and telemetry).
 * 
 * Multi-tenancy: All routes automatically filter by tenant_id from JWT token
 * Authorization: Students can only update their own attempts
 * 
 * @module app/api/assessments/attempts/[attemptId]/update
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { updateAssessmentProgressSchema } from '@/lib/validators';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';

/**
 * PUT /api/assessments/attempts/:attemptId/update
 * 
 * Update assessment progress
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  const params = await context.params;
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        // Only students can update their attempts
        if (user.role !== 'STUDENT') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Only students can update assessment progress',
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
                message: 'Cannot update a completed or abandoned attempt',
              },
            },
            { status: 400 }
          );
        }

        // Parse and validate request body
        const body = await req.json();
        const validated = updateAssessmentProgressSchema.parse(body);

        // Update attempt with new state and telemetry
        const updatedAttempt = await db.assessmentAttempt.update({
          where: {
            id: attemptId,
          },
          data: {
            telemetry: {
              ...(attempt.telemetry as object || {}),
              ...validated.telemetry,
            },
            metadata: {
              ...(attempt.metadata as object || {}),
              state: validated.state,
              lastSaved: new Date().toISOString(),
            },
          },
        });

        return successResponse({
          attemptId: updatedAttempt.id,
          status: updatedAttempt.status,
          lastSaved: new Date().toISOString(),
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                details: error.issues,
              },
            },
            { status: 400 }
          );
        }
        return handleAPIError(error);
      }
    })
  )(req);
}

