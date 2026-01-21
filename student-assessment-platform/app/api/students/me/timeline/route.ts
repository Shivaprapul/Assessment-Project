/**
 * Student Timeline API Route
 * 
 * Retrieves behavioral timeline events for the current student.
 * Respects visibility rules (STUDENT_ONLY, STUDENT_AND_PARENT, ALL).
 * 
 * Multi-tenancy: Automatically scoped to student's tenant
 * Authorization: Student or parent (with consent)
 * 
 * @module app/api/students/me/timeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';

/**
 * GET /api/students/me/timeline
 * 
 * Get behavioral timeline events
 * Query Params: startDate, endDate (ISO date strings)
 */
export const GET = requireAuth(
  withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
    try {
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

      // Parse query parameters
      const { searchParams } = new URL(req.url);
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');

      // Default to last 30 days if not provided
      const endDate = endDateStr ? new Date(endDateStr) : new Date();
      const startDate = startDateStr
        ? new Date(startDateStr)
        : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      // Get behavioral events for this student
      const events = await db.behavioralEvent.findMany({
        where: {
          studentId: student.id,
          tenantId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
          // Filter by visibility: students see STUDENT_ONLY, STUDENT_AND_PARENT, and ALL
          // Parents would see STUDENT_AND_PARENT and ALL (handled by role check if needed)
          // Note: Prisma enum values match the Visibility enum in schema
          visibility: {
            in: ['STUDENT_ONLY', 'STUDENT_AND_PARENT', 'ALL'],
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 50, // Limit to 50 most recent events
      });

      // Format events for response
      const formattedEvents = events.map((event) => {
        const aiAnalysis = event.aiAnalysis as any;
        return {
          id: event.id,
          timestamp: event.timestamp,
          eventType: event.eventType,
          context: event.context,
          studentChoice: event.studentChoice,
          aiAnalysis: {
            valuesReflected: aiAnalysis?.valuesReflected || [],
            behavioralPattern: aiAnalysis?.behavioralPattern || '',
            growthIndicator: aiAnalysis?.growthIndicator || '',
          },
          visibility: event.visibility,
        };
      });

      // Get behavioral patterns (simplified - could be enhanced with aggregation)
      const patterns = {
        dominant: [] as string[],
        emerging: [] as string[],
        needsSupport: [] as string[],
      };

      // Simple pattern extraction from events
      const patternCounts: Record<string, number> = {};
      events.forEach((event) => {
        const aiAnalysis = event.aiAnalysis as any;
        const pattern = aiAnalysis?.behavioralPattern;
        if (pattern) {
          patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
        }
      });

      // Extract dominant patterns (appearing 3+ times)
      Object.entries(patternCounts).forEach(([pattern, count]) => {
        if (count >= 3) {
          patterns.dominant.push(pattern);
        } else if (count === 1) {
          patterns.emerging.push(pattern);
        }
      });

      return successResponse({
        studentId: student.id,
        events: formattedEvents,
        patterns,
      });
    } catch (error) {
      return handleAPIError(error);
    }
  })
);

