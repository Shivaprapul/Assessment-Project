/**
 * Student Skill Tree API Route
 * 
 * Retrieves the student's skill tree with all categories and scores.
 * 
 * Multi-tenancy: Automatically scoped to student's tenant
 * Authorization: Student or parent (with consent)
 * 
 * @module app/api/students/me/skill-tree
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';

/**
 * GET /api/students/me/skill-tree
 * 
 * Get student's skill tree
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

      // Get all skill scores for this student
      const skillScores = await db.skillScore.findMany({
        where: {
          studentId: student.id,
          tenantId,
        },
        orderBy: {
          lastUpdatedAt: 'desc',
        },
      });

      // Map to API response format
      const categories = skillScores.map((score) => ({
        category: score.category,
        name: getCategoryName(score.category),
        score: score.score,
        level: score.level,
        icon: getLevelIcon(score.level),
        trend: score.trend,
        evidence: score.evidence,
        history: score.history as Array<{ date: string; score: number }>,
      }));

      return successResponse({
        studentId: student.id,
        lastUpdated: skillScores[0]?.lastUpdatedAt || new Date(),
        categories,
      });
    } catch (error) {
      return handleAPIError(error);
    }
  })
);

// Helper functions
function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    COGNITIVE_REASONING: 'Cognitive Reasoning & Intelligence',
    CREATIVITY: 'Creativity & Innovation',
    LANGUAGE: 'Language, Communication & Meaning',
    MEMORY: 'Memory & Knowledge Processing',
    ATTENTION: 'Attention, Discipline & Self-Regulation',
    PLANNING: 'Planning, Organization & Execution',
    SOCIAL_EMOTIONAL: 'Social, Emotional & Ethical Intelligence',
    METACOGNITION: 'Metacognition & Growth',
    CHARACTER_VALUES: 'Character, Values & Moral Compass',
  };
  return names[category] || category;
}

function getLevelIcon(level: string): string {
  const icons: Record<string, string> = {
    EMERGING: '🌱',
    DEVELOPING: '🌿',
    PROFICIENT: '🌳',
    ADVANCED: '🏆',
  };
  return icons[level] || '🌱';
}

