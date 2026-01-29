/**
 * Student Grade Upgrade API Route
 * 
 * Handles grade progression (8 → 9 → 10).
 * Creates GradeJourney records and preserves all historical data.
 * 
 * @module app/api/students/me/grade
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { getNextGrade, isValidGrade, type Grade } from '@/lib/grade-utils';
import { 
  canUpgradeBySoftCompletion, 
  getAcademicYearContext,
  getAcademicYearConfig 
} from '@/lib/academic-year';

/**
 * GET /api/students/me/grade
 * 
 * Get current grade and grade journey history
 */
export async function GET(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: any) => {
      try {
        if (user.role !== 'STUDENT') {
          return NextResponse.json(
            {
              success: false,
              error: 'Only students can access grade information',
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

        // Determine current grade value - prioritize currentGrade, fallback to grade, default to 8
        let currentGradeValue: number = 8;
        if (student.currentGrade !== null && student.currentGrade !== undefined) {
          currentGradeValue = student.currentGrade;
        } else if (student.grade !== null && student.grade !== undefined) {
          currentGradeValue = student.grade;
        }

        // Validate and fix grade if invalid
        if (!isValidGrade(currentGradeValue)) {
          console.warn(`Invalid grade value ${currentGradeValue} for student ${student.id}, defaulting to 8`);
          currentGradeValue = 8;
          // Update student profile with valid grade
          try {
            await db.studentProfile.update({
              where: { id: student.id },
              data: { currentGrade: 8, grade: 8 },
            });
          } catch (updateError) {
            console.error('Error updating student grade:', updateError);
            // Continue even if update fails
          }
        } else if (!student.currentGrade && student.grade && isValidGrade(student.grade)) {
          // Sync currentGrade from grade if grade is valid and currentGrade is missing
          try {
            await db.studentProfile.update({
              where: { id: student.id },
              data: { currentGrade: student.grade },
            });
            currentGradeValue = student.grade;
          } catch (updateError) {
            console.error('Error syncing currentGrade:', updateError);
            // Continue with grade value
            currentGradeValue = student.grade;
          }
        }

        // Get grade journey history
        let gradeJourneys = await db.gradeJourney.findMany({
          where: {
            studentId: student.id,
            tenantId,
          },
          orderBy: {
            startDate: 'asc',
          },
        });

        // If no grade journey exists, create one for the current grade
        if (gradeJourneys.length === 0) {
          try {
            const initialJourney = await db.gradeJourney.create({
              data: {
                studentId: student.id,
                tenantId,
                grade: currentGradeValue,
                startDate: student.createdAt,
                completionStatus: 'IN_PROGRESS',
                summarySnapshot: {},
              },
            });
            gradeJourneys = [initialJourney];
          } catch (journeyError: any) {
            console.error('Error creating initial grade journey:', journeyError);
            // Continue even if journey creation fails - we'll return empty array
          }
        }
        
        const nextGrade = getNextGrade(currentGradeValue as Grade);
        
        // Check soft completion eligibility (academic year end)
        const softCompletion = await canUpgradeBySoftCompletion(tenantId, student.createdAt);
        const academicYearContext = await getAcademicYearContext(tenantId);
        
        // Can upgrade if: next grade exists AND (soft completion eligible OR manual upgrade allowed)
        // For now, allow upgrade if next grade exists (soft completion is informational)
        const canUpgrade = nextGrade !== null;

        return NextResponse.json({
          success: true,
          data: {
            currentGrade: currentGradeValue,
            nextGrade,
            canUpgrade,
            softCompletionEligible: softCompletion.canUpgrade,
            softCompletionReason: softCompletion.reason,
            academicYear: {
              currentYear: academicYearContext.currentYear,
              startDate: academicYearContext.startDate,
              endDate: academicYearContext.endDate,
              isComplete: academicYearContext.isComplete,
              daysUntilEnd: academicYearContext.daysUntilEnd,
            },
            gradeJourneys: gradeJourneys.map(journey => ({
              id: journey.id,
              grade: journey.grade,
              startDate: journey.startDate,
              endDate: journey.endDate,
              completionStatus: journey.completionStatus,
              completionType: journey.completionType,
              summarySnapshot: journey.summarySnapshot,
            })),
          },
        });
      } catch (error: any) {
        console.error('Error fetching grade information:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
          {
            success: false,
            error: error.message || 'Failed to fetch grade information',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          },
          { status: 500 }
        );
      }
    })
  )(req);
}

/**
 * POST /api/students/me/grade
 * 
 * Upgrade to next grade
 */
export async function POST(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: any) => {
      try {
        if (user.role !== 'STUDENT') {
          return NextResponse.json(
            {
              success: false,
              error: 'Only students can upgrade grades',
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
          include: {
            skillScores: true,
            careerUnlocks: {
              take: 10,
              orderBy: {
                unlockedAt: 'desc',
              },
            },
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

        // Get current grade, with fallback
        let currentGradeValue: number = student.currentGrade ?? student.grade ?? 8;
        
        // Validate grade
        if (!isValidGrade(currentGradeValue)) {
          console.warn(`Invalid grade value ${currentGradeValue}, defaulting to 8`);
          currentGradeValue = 8;
          // Update to valid grade
          await db.studentProfile.update({
            where: { id: student.id },
            data: { currentGrade: 8, grade: 8 },
          });
        }
        
        const currentGrade = currentGradeValue as Grade;
        const nextGrade = getNextGrade(currentGrade);

        if (!nextGrade) {
          return NextResponse.json(
            {
              success: false,
              error: 'Already at highest grade (10th standard)',
            },
            { status: 400 }
          );
        }

        // Check if there's an active grade journey for current grade
        const activeJourney = await db.gradeJourney.findFirst({
          where: {
            studentId: student.id,
            tenantId,
            grade: currentGrade,
            completionStatus: 'IN_PROGRESS',
          },
        });

        // Create summary snapshot for current grade
        const summarySnapshot = {
          skillScores: student.skillScores.map(ss => ({
            category: ss.category,
            score: ss.score,
            level: ss.level,
          })),
          careerUnlocks: student.careerUnlocks.map(cu => ({
            careerId: cu.careerId,
            unlockedAt: cu.unlockedAt,
          })),
          completedAt: new Date().toISOString(),
        };

        // Check if hard completion badge exists (optional, non-blocking)
        const masteryBadge = await db.gradeMasteryBadge.findUnique({
          where: {
            studentId_grade_badgeType: {
              studentId: student.id,
              grade: currentGrade,
              badgeType: 'MASTERY',
            },
          },
        });

        // Determine completion type
        const completionType = masteryBadge ? 'HARD' : 'SOFT';

        // Close current grade journey
        if (activeJourney) {
          await db.gradeJourney.update({
            where: { id: activeJourney.id },
            data: {
              endDate: new Date(),
              completionStatus: 'COMPLETED',
              completionType: completionType,
              summarySnapshot: summarySnapshot as any,
            },
          });
        } else {
          // Create a completed journey for current grade if none exists
          await db.gradeJourney.create({
            data: {
              studentId: student.id,
              tenantId,
              grade: currentGrade,
              startDate: student.createdAt,
              endDate: new Date(),
              completionStatus: 'COMPLETED',
              completionType: completionType,
              summarySnapshot: summarySnapshot as any,
            },
          });
        }

        // Create new grade journey for next grade
        const newJourney = await db.gradeJourney.create({
          data: {
            studentId: student.id,
            tenantId,
            grade: nextGrade,
            startDate: new Date(),
            completionStatus: 'IN_PROGRESS',
            summarySnapshot: {},
          },
        });

        // Update student profile to new grade
        await db.studentProfile.update({
          where: { id: student.id },
          data: {
            currentGrade: nextGrade,
            // Also update legacy grade field for backward compatibility
            grade: nextGrade,
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            previousGrade: currentGrade,
            newGrade: nextGrade,
            gradeJourney: {
              id: newJourney.id,
              grade: newJourney.grade,
              startDate: newJourney.startDate,
            },
            message: `Successfully upgraded to Grade ${nextGrade}!`,
          },
        });
      } catch (error: any) {
        console.error('Error upgrading grade:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
          {
            success: false,
            error: error.message || 'Failed to upgrade grade',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          },
          { status: 500 }
        );
      }
    })
  )(req);
}
