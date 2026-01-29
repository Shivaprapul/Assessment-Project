/**
 * Get Assessment Attempt Results API Route
 * 
 * Retrieves the results of a completed assessment attempt.
 * 
 * Multi-tenancy: All routes automatically filter by tenant_id from JWT token
 * Authorization: Students can only access their own attempts
 * 
 * @module app/api/assessments/attempts/[attemptId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { getGameConfig } from '@/lib/games';

/**
 * GET /api/assessments/attempts/:attemptId
 * 
 * Get assessment attempt results
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  const params = await context.params;
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        // Only students can access their own attempts
        if (user.role !== 'STUDENT') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Only students can access assessment results',
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

        const gameConfig = getGameConfig(attempt.gameId);

        return successResponse({
          attemptId: attempt.id,
          gameId: attempt.gameId,
          gameName: gameConfig?.name || attempt.gameId,
          status: attempt.status,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt,
          rawScores: attempt.rawScores,
          normalizedScores: attempt.normalizedScores,
          reflectionText: attempt.reflectionText,
          telemetry: attempt.telemetry,
        });
      } catch (error) {
        return handleAPIError(error);
      }
    })
  )(req);
}

