/**
 * Grade Mastery Badge Logic
 * 
 * Handles hard completion (requirement-based) badges for grade mastery.
 * These are optional, non-blocking recognition badges.
 * 
 * @module lib/grade-mastery
 */

import { db } from '@/lib/db';
import type { Grade } from './grade-utils';

export interface MasteryRequirements {
  minQuestsCompleted?: number;
  minAssessmentsCompleted?: number;
  minSkillScore?: number; // Average skill score threshold
  endYearAssessmentCompleted?: boolean;
  [key: string]: any; // Allow custom requirements
}

/**
 * Check if student meets hard completion requirements for a grade
 */
export async function checkGradeMastery(
  studentId: string,
  tenantId: string,
  grade: Grade,
  requirements: MasteryRequirements
): Promise<{
  eligible: boolean;
  metRequirements: string[];
  unmetRequirements: string[];
}> {
  const student = await db.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      questAttempts: {
        where: {
          status: 'COMPLETED',
          gradeAtTimeOfAttempt: grade,
        },
      },
      assessmentAttempts: {
        where: {
          status: 'COMPLETED',
          gradeAtTimeOfAttempt: grade,
        },
      },
      skillScores: true,
    },
  });

  if (!student) {
    return {
      eligible: false,
      metRequirements: [],
      unmetRequirements: ['Student profile not found'],
    };
  }

  const metRequirements: string[] = [];
  const unmetRequirements: string[] = [];

  // Check quest completion requirement
  if (requirements.minQuestsCompleted !== undefined) {
    const questsCompleted = student.questAttempts.length;
    if (questsCompleted >= requirements.minQuestsCompleted) {
      metRequirements.push(`Completed ${questsCompleted} quests (required: ${requirements.minQuestsCompleted})`);
    } else {
      unmetRequirements.push(`Need ${requirements.minQuestsCompleted - questsCompleted} more quests (completed: ${questsCompleted})`);
    }
  }

  // Check assessment completion requirement
  if (requirements.minAssessmentsCompleted !== undefined) {
    const assessmentsCompleted = student.assessmentAttempts.length;
    if (assessmentsCompleted >= requirements.minAssessmentsCompleted) {
      metRequirements.push(`Completed ${assessmentsCompleted} assessments (required: ${requirements.minAssessmentsCompleted})`);
    } else {
      unmetRequirements.push(`Need ${requirements.minAssessmentsCompleted - assessmentsCompleted} more assessments (completed: ${assessmentsCompleted})`);
    }
  }

  // Check average skill score requirement
  if (requirements.minSkillScore !== undefined && student.skillScores.length > 0) {
    const avgScore = student.skillScores.reduce((sum, ss) => sum + ss.score, 0) / student.skillScores.length;
    if (avgScore >= requirements.minSkillScore) {
      metRequirements.push(`Average skill score: ${avgScore.toFixed(1)} (required: ${requirements.minSkillScore})`);
    } else {
      unmetRequirements.push(`Average skill score: ${avgScore.toFixed(1)} (required: ${requirements.minSkillScore})`);
    }
  }

  // Check end-year assessment requirement
  if (requirements.endYearAssessmentCompleted) {
    const hasEndYearAssessment = student.assessmentAttempts.some(
      attempt => attempt.metadata && typeof attempt.metadata === 'object' && 'isEndYearAssessment' in attempt.metadata && (attempt.metadata as any).isEndYearAssessment === true
    );
    if (hasEndYearAssessment) {
      metRequirements.push('End-year assessment completed');
    } else {
      unmetRequirements.push('End-year assessment not completed');
    }
  }

  const eligible = unmetRequirements.length === 0;

  return {
    eligible,
    metRequirements,
    unmetRequirements,
  };
}

/**
 * Award grade mastery badge if requirements are met
 */
export async function awardGradeMasteryBadge(
  studentId: string,
  tenantId: string,
  grade: Grade,
  gradeJourneyId: string | null,
  requirements: MasteryRequirements
): Promise<{
  awarded: boolean;
  badgeId?: string;
  reason?: string;
}> {
  const check = await checkGradeMastery(studentId, tenantId, grade, requirements);

  if (!check.eligible) {
    return {
      awarded: false,
      reason: `Requirements not met: ${check.unmetRequirements.join(', ')}`,
    };
  }

  // Check if badge already exists
  const existingBadge = await db.gradeMasteryBadge.findUnique({
    where: {
      studentId_grade_badgeType: {
        studentId,
        grade,
        badgeType: 'MASTERY',
      },
    },
  });

  if (existingBadge) {
    return {
      awarded: true,
      badgeId: existingBadge.id,
      reason: 'Badge already awarded',
    };
  }

  // Award badge
  const badge = await db.gradeMasteryBadge.create({
    data: {
      studentId,
      tenantId,
      grade,
      gradeJourneyId,
      badgeType: 'MASTERY',
      requirements: requirements as any,
      metadata: {
        metRequirements: check.metRequirements,
        awardedAt: new Date().toISOString(),
      },
    },
  });

  return {
    awarded: true,
    badgeId: badge.id,
    reason: 'Mastery badge awarded',
  };
}

/**
 * Get default mastery requirements for a grade
 */
export function getDefaultMasteryRequirements(grade: Grade): MasteryRequirements {
  // Default requirements (can be customized per grade)
  const baseRequirements: MasteryRequirements = {
    minQuestsCompleted: 30, // Minimum quests completed in this grade
    minAssessmentsCompleted: 6, // Minimum assessments completed
    minSkillScore: 60, // Average skill score of 60+
  };

  // Grade-specific adjustments
  switch (grade) {
    case 8:
      return {
        ...baseRequirements,
        minQuestsCompleted: 25, // Slightly lower for Grade 8
        minSkillScore: 55,
      };
    case 9:
      return baseRequirements;
    case 10:
      return {
        ...baseRequirements,
        minQuestsCompleted: 35, // Higher for Grade 10
        minSkillScore: 65,
        endYearAssessmentCompleted: true, // Require end-year assessment for Grade 10
      };
    default:
      return baseRequirements;
  }
}

