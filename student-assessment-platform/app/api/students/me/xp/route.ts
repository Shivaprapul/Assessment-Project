/**
 * Student XP API Route
 * 
 * Get student's total XP and level information.
 * 
 * @module app/api/students/me/xp
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { calculateXP, getXPProgress } from '@/lib/student-levels';

export async function GET(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: any) => {
      try {
        if (user.role !== 'STUDENT') {
          return NextResponse.json(
            {
              success: false,
              error: 'Only students can access XP information',
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
              error: 'Student profile not found',
            },
            { status: 404 }
          );
        }

        // Calculate total XP from all attempts
        const assessmentAttempts = await db.assessmentAttempt.findMany({
          where: {
            studentId: student.id,
            tenantId,
            status: 'COMPLETED',
          },
          select: {
            rawScores: true,
            metadata: true,
          },
        });

        const questAttempts = await db.questAttempt.findMany({
          where: {
            studentId: student.id,
            tenantId,
            status: 'COMPLETED',
          },
          select: {
            scoreSummary: true,
            telemetry: true,
          },
        });

        let totalXP = 0;

        // Calculate XP from assessment attempts
        assessmentAttempts.forEach(attempt => {
          const rawScores = attempt.rawScores as any;
          const metadata = attempt.metadata as any;
          totalXP += calculateXP({
            accuracy: rawScores?.accuracy,
            timeSpent: metadata?.timeSpent,
            questionsAnswered: rawScores?.totalQuestions,
            hintsUsed: metadata?.hintsUsed,
          });
        });

        // Calculate XP from quest attempts
        questAttempts.forEach(attempt => {
          const scoreSummary = attempt.scoreSummary as any;
          const telemetry = attempt.telemetry as any;
          totalXP += calculateXP({
            accuracy: scoreSummary?.accuracy,
            timeSpent: telemetry?.timeSpent,
            questionsAnswered: scoreSummary?.totalQuestions,
            hintsUsed: telemetry?.hintsUsed,
          });
        });

        const progress = getXPProgress(totalXP);

        return NextResponse.json({
          success: true,
          data: {
            totalXP,
            currentLevel: progress.currentLevel,
            xpProgress: progress,
          },
        });
      } catch (error: any) {
        console.error('Error fetching student XP:', error);
        return NextResponse.json(
          {
            success: false,
            error: error.message || 'Failed to fetch XP',
          },
          { status: 500 }
        );
      }
    })
  )(req);
}

