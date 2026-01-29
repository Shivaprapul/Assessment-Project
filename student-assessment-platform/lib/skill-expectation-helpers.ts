/**
 * Skill Expectation Helper Utilities
 * 
 * Functions for comparing student skill maturity to grade expectations.
 * These comparisons are descriptive only, never judgmental.
 * 
 * @module lib/skill-expectation-helpers
 */

import { SkillMaturityBand, getBandOrder } from './skill-maturity-bands';
import { 
  getExpectedBandForGradeSkill,
  getStudentNarrativeForGradeSkill,
  getParentTeacherNarrativeForGradeSkill,
} from './grade-skill-expectations';
import type { Grade } from './grade-utils';
import { SkillCategory } from '@prisma/client';
import { db } from './db';

export type ExpectationComparison = 'below_expected' | 'within_expected' | 'above_expected';

/**
 * Compare a skill maturity band to the expected band for a grade
 * 
 * Returns descriptive comparison (never judgmental):
 * - below_expected: Skill is at an earlier maturity stage than commonly observed
 * - within_expected: Skill is at or near the expected maturity stage
 * - above_expected: Skill is at a later maturity stage than commonly observed
 */
export function compareSkillToExpectation(
  skillBand: SkillMaturityBand,
  expectedBand: SkillMaturityBand
): ExpectationComparison {
  // Unclassified skills are always considered "within expected" during baseline
  if (skillBand === SkillMaturityBand.UNCLASSIFIED) {
    return 'within_expected';
  }

  const skillOrder = getBandOrder(skillBand);
  const expectedOrder = getBandOrder(expectedBand);

  // Consider "within expected" if within 1 band (allows for natural variation)
  const difference = skillOrder - expectedOrder;

  if (difference < -1) {
    return 'below_expected';
  } else if (difference > 1) {
    return 'above_expected';
  } else {
    return 'within_expected';
  }
}

/**
 * Get current skill maturity band for a student
 * 
 * This should be calculated from evidence (assessments, quests, etc.)
 * For now, returns a placeholder that should be replaced with actual logic.
 * 
 * TODO: Implement actual skill maturity calculation based on:
 * - Assessment performance
 * - Quest attempts
 * - Behavioral patterns
 * - Evidence from multiple sources
 */
export async function getCurrentSkillBand(
  studentId: string,
  skill: SkillCategory
): Promise<SkillMaturityBand> {
  // TODO: Implement actual skill maturity calculation
  // For now, return UNCLASSIFIED to indicate baseline phase
  // This should be replaced with evidence-based calculation
  
  // Placeholder: Check if student has enough evidence
  const skillScore = await db.skillScore.findUnique({
    where: {
      studentId_category: {
        studentId,
        category: skill,
      },
    },
  });

  // If no skill score exists, return UNCLASSIFIED (baseline phase)
  if (!skillScore) {
    return SkillMaturityBand.UNCLASSIFIED;
  }

  // TODO: Map skill score to maturity band based on evidence
  // This is a placeholder - actual implementation should consider:
  // - Score level (EMERGING, DEVELOPING, PROFICIENT, ADVANCENT)
  // - Trend (IMPROVING, STABLE, NEEDS_ATTENTION)
  // - Evidence array
  // - Recent performance patterns
  
  // Placeholder mapping (to be replaced with proper logic)
  if (skillScore.level === 'EMERGING') {
    return SkillMaturityBand.DISCOVERING;
  } else if (skillScore.level === 'DEVELOPING') {
    return SkillMaturityBand.PRACTICING;
  } else if (skillScore.level === 'PROFICIENT') {
    return SkillMaturityBand.CONSISTENT;
  } else if (skillScore.level === 'ADVANCED') {
    return SkillMaturityBand.INDEPENDENT;
  }

  return SkillMaturityBand.UNCLASSIFIED;
}

/**
 * Compare student's current skill to grade expectation
 * 
 * Returns descriptive comparison and context
 */
export async function compareStudentSkillToGradeExpectation(
  studentId: string,
  grade: Grade,
  skill: SkillCategory
): Promise<{
  currentBand: SkillMaturityBand;
  expectedBand: SkillMaturityBand | null;
  comparison: ExpectationComparison | null;
  narrative: {
    student: string | null;
    parentTeacher: string | null;
  };
}> {
  const currentBand = await getCurrentSkillBand(studentId, skill);
  const expectedBand = getExpectedBandForGradeSkill(grade, skill);

  let comparison: ExpectationComparison | null = null;
  if (expectedBand) {
    comparison = compareSkillToExpectation(currentBand, expectedBand);
  }

  // Get narratives from grade expectations
  const studentNarrative = getStudentNarrativeForGradeSkill(grade, skill);
  const parentTeacherNarrative = getParentTeacherNarrativeForGradeSkill(grade, skill);

  return {
    currentBand,
    expectedBand,
    comparison,
    narrative: {
      student: studentNarrative,
      parentTeacher: parentTeacherNarrative,
    },
  };
}

/**
 * Get descriptive text for expectation comparison
 * 
 * Uses supportive, non-judgmental language
 */
export function getComparisonDescription(
  comparison: ExpectationComparison,
  skill: SkillCategory,
  grade: Grade,
  currentBand: SkillMaturityBand
): string {
  const skillName = skill.replace(/_/g, ' ').toLowerCase();
  const bandLabel = currentBand === SkillMaturityBand.DISCOVERING ? 'discovering' :
                    currentBand === SkillMaturityBand.PRACTICING ? 'practicing' :
                    currentBand === SkillMaturityBand.CONSISTENT ? 'consistent' :
                    currentBand === SkillMaturityBand.INDEPENDENT ? 'independent' :
                    currentBand === SkillMaturityBand.ADAPTIVE ? 'adaptive' : 'developing';
  
  switch (comparison) {
    case 'below_expected':
      return `At a Grade ${grade} level, this skill is currently ${bandLabel}. This is common and typically becomes consistent with practice.`;
    case 'within_expected':
      return `At a Grade ${grade} level, this skill is developing as expected. You're making good progress!`;
    case 'above_expected':
      return `At a Grade ${grade} level, this shows signs of independent use for this grade context. Keep building on this foundation!`;
    default:
      return `Your ${skillName} skills are developing.`;
  }
}

