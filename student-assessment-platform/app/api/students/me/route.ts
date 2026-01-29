/**
 * Student Profile API Routes
 * 
 * Handles student profile operations:
 * - GET: Retrieve current student profile
 * - PUT: Update student profile
 * 
 * Multi-tenancy: All routes automatically filter by tenant_id from JWT token
 * Authorization: Students can only access their own profile
 * 
 * @module app/api/students/me
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { updateStudentProfileSchema } from '@/lib/validators';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';

/**
 * GET /api/students/me
 * 
 * Get current student profile
 */
export const GET = requireAuth(
  withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
    try {
      // Only students can access their own profile
      if (user.role !== 'STUDENT') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only students can access this endpoint',
            },
          },
          { status: 403 }
        );
      }

      const student = await db.studentProfile.findUnique({
        where: {
          userId: user.id,
          tenantId,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              avatar: true,
            },
          },
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

      return successResponse({
        id: student.id,
        userId: student.userId,
        tenantId: student.tenantId,
        grade: student.grade, // Legacy
        currentGrade: student.currentGrade,
        section: student.section,
        dateOfBirth: student.dateOfBirth,
        goals: student.goals,
        preferredMode: student.preferredMode,
        onboardingComplete: student.onboardingComplete,
        assessmentComplete: student.assessmentComplete,
        createdAt: student.createdAt,
        user: student.user,
      });
    } catch (error) {
      return handleAPIError(error);
    }
  })
);

/**
 * PUT /api/students/me
 * 
 * Update current student profile
 */
export const PUT = requireAuth(
  withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
    try {
      // Only students can update their own profile
      if (user.role !== 'STUDENT') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only students can update this endpoint',
            },
          },
          { status: 403 }
        );
      }

      const body = await req.json();
      const validated = updateStudentProfileSchema.parse(body);

      const student = await db.studentProfile.update({
        where: {
          userId: user.id,
          tenantId,
        },
        data: {
          ...(validated.goals && { goals: validated.goals }),
          ...(validated.preferredMode && { preferredMode: validated.preferredMode }),
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      // Update user avatar if provided
      if (validated.avatar) {
        await db.user.update({
          where: { id: user.id },
          data: { avatar: validated.avatar },
        });
      }

      return successResponse({
        id: student.id,
        userId: student.userId,
        tenantId: student.tenantId,
        grade: student.grade,
        section: student.section,
        goals: student.goals,
        preferredMode: student.preferredMode,
        user: student.user,
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
);

