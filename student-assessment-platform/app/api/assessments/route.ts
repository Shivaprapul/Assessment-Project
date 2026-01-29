/**
 * Assessments API Route
 * 
 * Handles listing available assessment games.
 * 
 * Multi-tenancy: All routes automatically filter by tenant_id from JWT token
 * Authorization: Students can only access their own assessments
 * 
 * @module app/api/assessments
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { getAllGames, getGameConfig } from '@/lib/games';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';

/**
 * GET /api/assessments
 * 
 * List available assessment games with completion status
 */
export const GET = requireAuth(
  withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
    try {
      // Only students can access assessments
      if (user.role !== 'STUDENT') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only students can access assessments',
            },
          },
          { status: 403 }
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

      // Get all attempts for this student
      const allAttempts = await db.assessmentAttempt.findMany({
        where: {
          studentId: student.id,
          tenantId,
        },
        select: {
          gameId: true,
          status: true,
          id: true,
        },
      });

      const completedGameIds = new Set(
        allAttempts.filter(a => a.status === 'COMPLETED').map(a => a.gameId)
      );
      
      // Get in-progress attempts
      const inProgressAttempts = allAttempts
        .filter(a => a.status === 'IN_PROGRESS')
        .reduce((acc, attempt) => {
          acc[attempt.gameId] = attempt.id;
          return acc;
        }, {} as Record<string, string>);

      // Get all games and check completion status
      const allGames = getAllGames();
      const gamesWithStatus = allGames.map((game) => {
        // Game is unlocked if it's the first game, or if previous games are completed
        const previousGames = allGames.filter(g => g.orderIndex < game.orderIndex);
        const isUnlocked = 
          game.orderIndex === 1 || 
          previousGames.every(g => completedGameIds.has(g.id));

        return {
          id: game.id,
          name: game.name,
          description: game.description,
          estimatedTime: game.estimatedTime,
          difficulty: game.difficulty,
          orderIndex: game.orderIndex,
          isUnlocked,
          isCompleted: completedGameIds.has(game.id),
          inProgressAttemptId: inProgressAttempts[game.id] || null,
          thumbnail: game.thumbnail,
        };
      });

      return successResponse(gamesWithStatus);
    } catch (error) {
      return handleAPIError(error);
    }
  })
);

