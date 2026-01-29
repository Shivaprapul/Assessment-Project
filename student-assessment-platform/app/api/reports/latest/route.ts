/**
 * Get Latest Report API Route
 * 
 * Retrieves the most recent AI report for the current student.
 * 
 * Multi-tenancy: All routes automatically filter by tenant_id from JWT token
 * Authorization: Students can only access their own reports
 * 
 * @module app/api/reports/latest
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';

/**
 * GET /api/reports/latest
 * 
 * Get the latest report for the current student
 */
export async function GET(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        // Only students can access their own reports
        if (user.role !== 'STUDENT') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Only students can access reports',
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

        // Find the latest report
        const report = await db.aIReport.findFirst({
          where: {
            studentId: student.id,
            tenantId,
            reportType: 'INITIAL_ASSESSMENT',
          },
          orderBy: {
            generatedAt: 'desc',
          },
        });

        if (!report) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'No report found. Please complete all assessments first.',
              },
            },
            { status: 404 }
          );
        }

        return successResponse({
          id: report.id,
          reportType: report.reportType,
          generatedAt: report.generatedAt,
          studentInsights: report.studentInsights,
          parentGuidance: report.parentGuidance,
          metadata: report.metadata,
        });
      } catch (error) {
        return handleAPIError(error);
      }
    })
  )(req);
}

