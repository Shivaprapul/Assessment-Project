/**
 * Start Assessment API Route
 * 
 * Handles starting a new assessment attempt.
 * 
 * Multi-tenancy: All routes automatically filter by tenant_id from JWT token
 * Authorization: Students can only start their own assessments
 * Consent: Requires parental consent for assessment purpose
 * 
 * @module app/api/assessments/[gameId]/start
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { getGameConfig } from '@/lib/games';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';

/**
 * POST /api/assessments/:gameId/start
 * 
 * Start a new assessment attempt
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  const params = await context.params;
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        // Only students can start assessments
        if (user.role !== 'STUDENT') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Only students can start assessments',
              },
            },
            { status: 403 }
          );
        }

        const { gameId } = params;

        // Validate game ID
        const gameConfig = getGameConfig(gameId);
        if (!gameConfig) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Game not found',
              },
            },
            { status: 404 }
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
              error: {
                code: 'NOT_FOUND',
                message: 'Student profile not found',
              },
            },
            { status: 404 }
          );
        }

        // Check for parental consent (for minors)
        // For now, we'll assume consent is granted if student profile exists
        // TODO: Implement proper consent checking
        const hasConsent = true; // Placeholder - implement consent check

        if (!hasConsent) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'CONSENT_REQUIRED',
                message: 'Parental consent required for assessments',
              },
            },
            { status: 403 }
          );
        }

        // Check if there's an in-progress attempt for this game
        const inProgressAttempt = await db.assessmentAttempt.findFirst({
          where: {
            studentId: student.id,
            tenantId,
            gameId,
            status: 'IN_PROGRESS',
          },
        });

        if (inProgressAttempt) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'ATTEMPT_IN_PROGRESS',
                message: 'You have an assessment in progress. Please complete or abandon it first.',
              },
            },
            { status: 409 }
          );
        }

        // Get the next attempt number
        const previousAttempts = await db.assessmentAttempt.findMany({
          where: {
            studentId: student.id,
            tenantId,
            gameId,
          },
          orderBy: {
            attemptNumber: 'desc',
          },
          take: 1,
        });

        const attemptNumber = previousAttempts.length > 0 
          ? previousAttempts[0].attemptNumber + 1 
          : 1;

        // Create new assessment attempt
        const attempt = await db.assessmentAttempt.create({
          data: {
            studentId: student.id,
            tenantId,
            gameId,
            attemptNumber,
            status: 'IN_PROGRESS',
            telemetry: {},
            rawScores: {},
            normalizedScores: {},
            metadata: {
              gameConfig: {
                name: gameConfig.name,
                estimatedTime: gameConfig.estimatedTime,
                difficulty: gameConfig.difficulty,
              },
            },
          },
        });

        return NextResponse.json(
          successResponse({
            attemptId: attempt.id,
            gameId: attempt.gameId,
            attemptNumber: attempt.attemptNumber,
            startedAt: attempt.startedAt,
            status: attempt.status,
            config: {
              totalQuestions: 10, // Default - can be customized per game
              timeLimit: gameConfig.estimatedTime * 60, // Convert minutes to seconds
              allowPause: true,
              showTimer: true,
            },
          }),
          { status: 201 }
        );
      } catch (error) {
        return handleAPIError(error);
      }
    })
  )(req);
}

