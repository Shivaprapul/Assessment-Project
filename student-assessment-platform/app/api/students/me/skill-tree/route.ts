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
import { getCurrentSkillBand } from '@/lib/skill-expectation-helpers';
import { SkillMaturityBand } from '@/lib/skill-maturity-bands';
import { mapMaturityBandToLevel, getFunLevelTitle, calculateSkillXP } from '@/lib/skill-tree-display';
import { SkillCategory } from '@prisma/client';

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

      // Map to API response format with maturity band conversion
      const categories = await Promise.all(
        skillScores.map(async (score) => {
          // Get current maturity band from skill score
          const maturityBand = await getCurrentSkillBand(student.id, score.category);
          
          // Map maturity band to game-like level (1-10) for students
          const skillLevel = mapMaturityBandToLevel(maturityBand, score.score);
          const levelTitle = getFunLevelTitle(skillLevel);
          const skillXP = calculateSkillXP(maturityBand, score.score);
          
          // Get icon based on maturity band (for visual consistency)
          const icon = getMaturityBandIcon(maturityBand);
          
          return {
            category: score.category,
            name: getCategoryName(score.category),
            score: score.score,
            // Legacy field (kept for backward compatibility, but not displayed to students)
            level: score.level,
            // New fields for student game-like display
            skillLevel, // 1-10
            levelTitle, // "Seedling", "Sprout", etc.
            skillXP, // XP value
            currentMaturityBand: maturityBand, // Internal only
            icon,
            trend: score.trend,
            evidence: score.evidence,
            history: score.history as Array<{ date: string; score: number }>,
          };
        })
      );

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

// Get icon based on maturity band (for visual consistency)
function getMaturityBandIcon(band: SkillMaturityBand): string {
  const icons: Record<SkillMaturityBand, string> = {
    [SkillMaturityBand.UNCLASSIFIED]: '🌱',
    [SkillMaturityBand.DISCOVERING]: '🌱',
    [SkillMaturityBand.PRACTICING]: '🌿',
    [SkillMaturityBand.CONSISTENT]: '🌳',
    [SkillMaturityBand.INDEPENDENT]: '⭐',
    [SkillMaturityBand.ADAPTIVE]: '🏆',
  };
  return icons[band] || '🌱';
}

// Legacy function (kept for backward compatibility)
function getLevelIcon(level: string): string {
  const icons: Record<string, string> = {
    EMERGING: '🌱',
    DEVELOPING: '🌿',
    PROFICIENT: '🌳',
    ADVANCED: '🏆',
  };
  return icons[level] || '🌱';
}

