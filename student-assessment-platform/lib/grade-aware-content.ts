/**
 * Grade-Aware Content Selection and Interpretation
 * 
 * Provides utilities for grade-aware quest/assessment selection and performance interpretation.
 * Grade determines content context and difficulty, not skill maturity assumptions.
 * 
 * @module lib/grade-aware-content
 */

import type { Grade } from './grade-utils';
import { SkillCategory } from '@prisma/client';
import { getExpectedBandForGradeSkill, getEmphasisWeightForGradeSkill } from './grade-skill-expectations';
import { SkillMaturityBand } from './skill-maturity-bands';
import { getBandOrder } from './skill-maturity-bands';

/**
 * Grade applicability metadata for quests and assessments
 */
export interface GradeApplicability {
  gradeApplicability: number[]; // e.g. [8], [9,10], [8,9,10]
  primarySkills: SkillCategory[];
  secondarySkills?: SkillCategory[];
  difficultyByGrade?: Record<number, 'easy' | 'medium' | 'hard'>;
}

/**
 * Check if content is applicable for a student's grade
 */
export function isContentApplicableForGrade(
  gradeApplicability: number[],
  studentGrade: Grade
): boolean {
  // Universal content (empty or [8,9,10]) applies to all grades
  if (gradeApplicability.length === 0 || 
      (gradeApplicability.length === 3 && 
       gradeApplicability.includes(8) && 
       gradeApplicability.includes(9) && 
       gradeApplicability.includes(10))) {
    return true;
  }
  
  return gradeApplicability.includes(studentGrade);
}

/**
 * Filter quests/assessments by grade applicability
 */
export function filterByGradeApplicability<T extends GradeApplicability>(
  items: T[],
  studentGrade: Grade
): T[] {
  return items.filter(item => 
    isContentApplicableForGrade(item.gradeApplicability, studentGrade)
  );
}

/**
 * Prioritize content based on grade skill emphasis
 * Returns items sorted by how well they align with grade expectations
 */
export function prioritizeByGradeEmphasis<T extends GradeApplicability>(
  items: T[],
  studentGrade: Grade
): T[] {
  return items.sort((a, b) => {
    // Calculate alignment score for each item
    const scoreA = calculateGradeAlignmentScore(a, studentGrade);
    const scoreB = calculateGradeAlignmentScore(b, studentGrade);
    
    return scoreB - scoreA; // Higher score = better alignment
  });
}

/**
 * Calculate how well content aligns with grade expectations
 */
function calculateGradeAlignmentScore<T extends GradeApplicability>(
  item: T,
  studentGrade: Grade
): number {
  let score = 0;
  
  // Primary skills get full weight
  for (const skill of item.primarySkills) {
    const emphasisWeight = getEmphasisWeightForGradeSkill(studentGrade, skill);
    score += emphasisWeight;
  }
  
  // Secondary skills get half weight
  if (item.secondarySkills) {
    for (const skill of item.secondarySkills) {
      const emphasisWeight = getEmphasisWeightForGradeSkill(studentGrade, skill);
      score += emphasisWeight * 0.5;
    }
  }
  
  return score;
}

/**
 * Grade-aware quest/assessment selection
 * Filters by grade and prioritizes by grade emphasis
 */
export function selectGradeAwareContent<T extends GradeApplicability>(
  items: T[],
  studentGrade: Grade,
  count?: number
): T[] {
  // Filter by grade applicability
  let filtered = filterByGradeApplicability(items, studentGrade);
  
  // If no grade-specific content, fallback to universal content
  if (filtered.length === 0) {
    filtered = items.filter(item => 
      item.gradeApplicability.length === 0 || 
      (item.gradeApplicability.length === 3 && 
       item.gradeApplicability.includes(8) && 
       item.gradeApplicability.includes(9) && 
       item.gradeApplicability.includes(10))
    );
  }
  
  // Prioritize by grade emphasis
  filtered = prioritizeByGradeEmphasis(filtered, studentGrade);
  
  // Return requested count or all
  return count ? filtered.slice(0, count) : filtered;
}

/**
 * Grade-aware performance interpretation
 * Compares actual performance against grade expectations
 */
export interface PerformanceInterpretation {
  skill: SkillCategory;
  currentBand: SkillMaturityBand;
  expectedBand: SkillMaturityBand;
  comparison: 'below_expected' | 'within_expected' | 'above_expected';
  insight: string; // Descriptive, non-judgmental insight
}

/**
 * Interpret performance in grade context
 */
export function interpretPerformanceInGradeContext(
  skill: SkillCategory,
  currentBand: SkillMaturityBand,
  studentGrade: Grade
): PerformanceInterpretation {
  const expectedBand = getExpectedBandForGradeSkill(studentGrade, skill);
  
  if (!expectedBand) {
    return {
      skill,
      currentBand,
      expectedBand: SkillMaturityBand.UNCLASSIFIED,
      comparison: 'within_expected',
      insight: `This skill is developing. Continue practicing to build confidence.`,
    };
  }
  
  const currentOrder = getBandOrder(currentBand);
  const expectedOrder = getBandOrder(expectedBand);
  const diff = currentOrder - expectedOrder;
  
  let comparison: 'below_expected' | 'within_expected' | 'above_expected';
  let insight: string;
  
  if (diff < -1) {
    comparison = 'below_expected';
    insight = `At a Grade ${studentGrade} level, this skill is commonly ${expectedBand.toLowerCase()}. Currently showing ${currentBand.toLowerCase()} use. This is common and typically becomes consistent with practice.`;
  } else if (diff > 1) {
    comparison = 'above_expected';
    insight = `At a Grade ${studentGrade} level, this skill is commonly ${expectedBand.toLowerCase()}. Currently showing ${currentBand.toLowerCase()} use. This shows signs of independent use for this grade context.`;
  } else {
    comparison = 'within_expected';
    insight = `At a Grade ${studentGrade} level, this skill is commonly ${expectedBand.toLowerCase()}. Currently showing ${currentBand.toLowerCase()} use. This is developing as expected.`;
  }
  
  return {
    skill,
    currentBand,
    expectedBand,
    comparison,
    insight,
  };
}

/**
 * Get grade-appropriate difficulty for content
 */
export function getGradeDifficulty(
  difficultyByGrade: Record<number, 'easy' | 'medium' | 'hard'> | undefined,
  studentGrade: Grade,
  defaultDifficulty: 'easy' | 'medium' | 'hard' = 'medium'
): 'easy' | 'medium' | 'hard' {
  if (!difficultyByGrade) {
    return defaultDifficulty;
  }
  
  return difficultyByGrade[studentGrade] || defaultDifficulty;
}

/**
 * Generate grade-contextual summary after assessment
 */
export interface GradeContextualSummary {
  grade: Grade;
  skillInterpretations: PerformanceInterpretation[];
  overallInsight: string;
}

export function generateGradeContextualSummary(
  skillBands: Record<SkillCategory, SkillMaturityBand>,
  studentGrade: Grade
): GradeContextualSummary {
  const interpretations: PerformanceInterpretation[] = [];
  
  for (const [skill, band] of Object.entries(skillBands) as [SkillCategory, SkillMaturityBand][]) {
    interpretations.push(
      interpretPerformanceInGradeContext(skill, band, studentGrade)
    );
  }
  
  // Generate overall insight
  const withinExpected = interpretations.filter(i => i.comparison === 'within_expected').length;
  const aboveExpected = interpretations.filter(i => i.comparison === 'above_expected').length;
  
  let overallInsight = '';
  if (aboveExpected > withinExpected) {
    overallInsight = `At Grade ${studentGrade} level, you're showing strong development across multiple skills. Continue building on this foundation.`;
  } else if (withinExpected >= interpretations.length * 0.6) {
    overallInsight = `At Grade ${studentGrade} level, your skills are developing as expected. Keep practicing to build consistency.`;
  } else {
    overallInsight = `At Grade ${studentGrade} level, you're exploring different skills. This is common and skills typically strengthen with practice.`;
  }
  
  return {
    grade: studentGrade,
    skillInterpretations: interpretations,
    overallInsight,
  };
}

