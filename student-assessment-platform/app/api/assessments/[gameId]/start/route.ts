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
import { generateDemoQuestions } from '@/lib/demo-questions';

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

        // If there's an in-progress attempt, resume it instead of creating a new one
        if (inProgressAttempt) {
          // Generate demo questions if DEMO_ASSESSMENTS is enabled
          const isDemoMode = process.env.DEMO_ASSESSMENTS === 'true';
          let demoQuestions = null;
          
          if (isDemoMode) {
            // Use userId as seed for deterministic questions (same as original)
            const seed = `${user.id}-${inProgressAttempt.id}`;
            demoQuestions = generateDemoQuestions(gameId, seed, 12);
          }

          return NextResponse.json(
            successResponse({
              attemptId: inProgressAttempt.id,
              gameId: inProgressAttempt.gameId,
              attemptNumber: inProgressAttempt.attemptNumber,
              startedAt: inProgressAttempt.startedAt,
              status: inProgressAttempt.status,
              resumed: true, // Indicate this is a resumed attempt
              config: {
                totalQuestions: isDemoMode ? (demoQuestions?.length || 12) : 10,
                timeLimit: gameConfig.estimatedTime * 60,
                allowPause: true,
                showTimer: true,
              },
              ...(isDemoMode && demoQuestions && {
                questions: demoQuestions.map(q => ({
                  id: q.id,
                  question: q.question,
                  type: q.type,
                  options: q.options,
                })),
              }),
            }),
            { status: 200 }
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

        // Create new assessment attempt (grade-aware)
        const studentGrade = student.currentGrade || 8; // Default to 8 if not set
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
            gradeAtTimeOfAttempt: studentGrade,
            metadata: {
              gameConfig: {
                name: gameConfig.name,
                estimatedTime: gameConfig.estimatedTime,
                difficulty: gameConfig.difficulty,
              },
            },
          },
        });

        // Generate demo questions if DEMO_ASSESSMENTS is enabled
        const isDemoMode = process.env.DEMO_ASSESSMENTS === 'true';
        let demoQuestions = null;
        
        if (isDemoMode) {
          // Use userId as seed for deterministic questions
          const seed = `${user.id}-${attempt.id}`;
          demoQuestions = generateDemoQuestions(gameId, seed, 12);
        }

        return NextResponse.json(
          successResponse({
            attemptId: attempt.id,
            gameId: attempt.gameId,
            attemptNumber: attempt.attemptNumber,
            startedAt: attempt.startedAt,
            status: attempt.status,
            config: {
              totalQuestions: isDemoMode ? (demoQuestions?.length || 12) : 10,
              timeLimit: gameConfig.estimatedTime * 60, // Convert minutes to seconds
              allowPause: true,
              showTimer: true,
            },
            ...(isDemoMode && demoQuestions && {
              questions: demoQuestions.map(q => ({
                id: q.id,
                question: q.question,
                type: q.type,
                options: q.options,
                // Don't send correctAnswer to client
              })),
            }),
          }),
          { status: 201 }
        );
      } catch (error) {
        return handleAPIError(error);
      }
    })
  )(req);
}

