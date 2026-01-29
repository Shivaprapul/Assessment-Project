/**
 * Demo Latest Report API Route
 * 
 * Simplified demo endpoint for getting the latest report.
 * Always returns JSON, never HTML.
 * Generates report if it doesn't exist (after at least 1 game completed).
 * 
 * @module app/api/demo/reports/latest
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { generateDemoReport } from '@/lib/demo-report-generator';
import { getAllGames } from '@/lib/games';

/**
 * GET /api/demo/reports/latest
 * 
 * Get the latest report (generate if needed)
 */
export async function GET(req: NextRequest) {
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
          // Only students can access reports
          if (user.role !== 'STUDENT') {
            return NextResponse.json(
              {
                success: false,
                error: 'Only students can access reports',
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

          // Get completed attempts
          const completedAttempts = await db.assessmentAttempt.findMany({
            where: {
              studentId: student.id,
              tenantId,
              status: 'COMPLETED',
            },
            select: {
              gameId: true,
            },
          });

          if (completedAttempts.length === 0) {
            return NextResponse.json(
              {
                success: false,
                error: 'No completed assessments found. Complete at least one game first.',
              },
              { status: 404 }
            );
          }

          // Check for existing report
          let report = await db.aIReport.findFirst({
            where: {
              studentId: student.id,
              tenantId,
              reportType: 'INITIAL_ASSESSMENT',
            },
            orderBy: {
              generatedAt: 'desc',
            },
          });

          const completedGameIds = completedAttempts.map(a => a.gameId);
          const allGames = getAllGames();
          const allGamesCompleted = allGames.every(game => completedGameIds.includes(game.id));

          // Generate report if it doesn't exist or if all games are now complete
          if (!report || (allGamesCompleted && !student.assessmentComplete)) {
            try {
              const reportId = await generateDemoReport(student.id, tenantId, completedGameIds);
              report = await db.aIReport.findUnique({
                where: { id: reportId },
              });

              // Update student profile if all complete
              if (allGamesCompleted && !student.assessmentComplete) {
                await db.studentProfile.update({
                  where: { id: student.id },
                  data: { assessmentComplete: true },
                });
              }
            } catch (err: any) {
              console.error('Error generating report:', err);
              return NextResponse.json(
                {
                  success: false,
                  error: `Failed to generate report: ${err.message}`,
                },
                { status: 500 }
              );
            }
          }

          if (!report) {
            return NextResponse.json(
              {
                success: false,
                error: 'Failed to generate report',
              },
              { status: 500 }
            );
          }

          // Get skill tree data
          const skillScores = await db.skillScore.findMany({
            where: {
              studentId: student.id,
              tenantId,
            },
            select: {
              category: true,
              score: true,
              level: true,
              trend: true,
            },
          });

          const skillTree = skillScores.map(score => ({
            category: score.category,
            score: score.score,
            level: score.level,
            trend: score.trend,
          }));

          return NextResponse.json(
            {
              success: true,
              data: {
                report: {
                  id: report.id,
                  reportType: report.reportType,
                  generatedAt: report.generatedAt,
                  studentInsights: report.studentInsights,
                  parentGuidance: report.parentGuidance,
                  metadata: report.metadata,
                },
                skillTree,
              },
            },
            { status: 200 }
          );
        } catch (error: any) {
          console.error('Error in demo report:', error);
          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to load report',
            },
            { status: 500 }
          );
        }
      })
    )(req);
  } catch (error: any) {
    console.error('Error in demo report wrapper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

