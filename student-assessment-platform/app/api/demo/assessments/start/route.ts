/**
 * Demo Assessment Start API Route
 * 
 * Simplified demo endpoint for starting assessments.
 * Always returns JSON, never HTML.
 * 
 * @module app/api/demo/assessments/start
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { getGameConfig } from '@/lib/games';
import { generateDemoQuestions } from '@/lib/demo-questions';

/**
 * POST /api/demo/assessments/start
 * 
 * Start a demo assessment attempt
 */
export async function POST(req: NextRequest) {
  try {
    // Check if demo mode is enabled
    if (process.env.DEMO_ASSESSMENTS !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: 'Demo mode is not enabled. Set DEMO_ASSESSMENTS=true in .env',
        },
        { status: 400 }
      );
    }

    return requireAuth(
      withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
        try {
          // Only students can start assessments
          if (user.role !== 'STUDENT') {
            return NextResponse.json(
              {
                success: false,
                error: 'Only students can start assessments',
              },
              { status: 403 }
            );
          }

          // Parse request body
          const body = await req.json().catch(() => ({}));
          const { gameId } = body;

          if (!gameId) {
            return NextResponse.json(
              {
                success: false,
                error: 'gameId is required',
              },
              { status: 400 }
            );
          }

          // Validate game ID
          const gameConfig = getGameConfig(gameId);
          if (!gameConfig) {
            return NextResponse.json(
              {
                success: false,
                error: `Game not found: ${gameId}`,
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
                error: 'Student profile not found',
              },
              { status: 404 }
            );
          }

          // Create new assessment attempt
          const attempt = await db.assessmentAttempt.create({
            data: {
              studentId: student.id,
              tenantId,
              gameId,
              attemptNumber: 1,
              status: 'IN_PROGRESS',
              telemetry: {},
              rawScores: {},
              normalizedScores: {},
              metadata: {
                demoMode: true,
                gameConfig: {
                  name: gameConfig.name,
                  estimatedTime: gameConfig.estimatedTime,
                  difficulty: gameConfig.difficulty,
                },
              },
            },
          });

          // Generate demo questions with deterministic seed
          const seed = `${user.id}-${attempt.id}`;
          const demoQuestions = generateDemoQuestions(gameId, seed, 12);

          return NextResponse.json(
            {
              success: true,
              data: {
                attemptId: attempt.id,
                gameId: attempt.gameId,
                questions: demoQuestions.map(q => ({
                  id: q.id,
                  question: q.question,
                  type: q.type,
                  options: q.options,
                })),
              },
            },
            { status: 200 }
          );
        } catch (error: any) {
          console.error('Error in demo start:', error);
          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to start assessment',
            },
            { status: 500 }
          );
        }
      })
    )(req);
  } catch (error: any) {
    console.error('Error in demo start wrapper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

