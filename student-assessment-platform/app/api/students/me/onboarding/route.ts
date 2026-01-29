/**
 * Student Onboarding API Route
 * 
 * Handles initial student profile setup:
 * - Grade selection (8/9/10)
 * - Section/class
 * - Date of birth
 * - Marks onboarding as complete
 * 
 * @module app/api/students/me/onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isValidGrade, type Grade } from '@/lib/grade-utils';
import { z } from 'zod';

const onboardingSchema = z.object({
  currentGrade: z.number().refine((val) => isValidGrade(val), {
    message: 'Grade must be 8, 9, or 10',
  }),
  section: z.string().max(10).nullable().optional(),
  dateOfBirth: z.string().datetime(),
  onboardingComplete: z.boolean(),
});

/**
 * POST /api/students/me/onboarding
 * 
 * Complete student onboarding
 */
export async function POST(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: any) => {
      try {
        if (user.role !== 'STUDENT') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Only students can complete onboarding',
              },
            },
            { status: 403 }
          );
        }

        const body = await req.json();
        const validated = onboardingSchema.parse(body);

        // Get existing student profile
        const existingProfile = await db.studentProfile.findUnique({
          where: {
            userId: user.id,
            tenantId,
          },
        });

        if (!existingProfile) {
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

        const currentGrade = validated.currentGrade as Grade;
        const dateOfBirth = new Date(validated.dateOfBirth);

        // Update student profile
        const updatedProfile = await db.studentProfile.update({
          where: {
            userId: user.id,
            tenantId,
          },
          data: {
            currentGrade,
            grade: currentGrade, // Also update legacy field
            section: validated.section || null,
            dateOfBirth,
            onboardingComplete: validated.onboardingComplete,
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

        // Create initial GradeJourney if it doesn't exist
        const existingJourney = await db.gradeJourney.findFirst({
          where: {
            studentId: updatedProfile.id,
            tenantId,
            grade: currentGrade,
            completionStatus: 'IN_PROGRESS',
          },
        });

        if (!existingJourney) {
          await db.gradeJourney.create({
            data: {
              studentId: updatedProfile.id,
              tenantId,
              grade: currentGrade,
              startDate: updatedProfile.createdAt,
              completionStatus: 'IN_PROGRESS',
              summarySnapshot: {},
            },
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            id: updatedProfile.id,
            userId: updatedProfile.userId,
            tenantId: updatedProfile.tenantId,
            currentGrade: updatedProfile.currentGrade,
            section: updatedProfile.section,
            dateOfBirth: updatedProfile.dateOfBirth,
            onboardingComplete: updatedProfile.onboardingComplete,
            user: updatedProfile.user,
          },
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

        console.error('Error completing onboarding:', error);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: error instanceof Error ? error.message : 'Failed to complete onboarding',
            },
          },
          { status: 500 }
        );
      }
    })
  )(req);
}

