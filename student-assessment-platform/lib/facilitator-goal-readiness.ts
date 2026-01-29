/**
 * Facilitator Mode Goal Readiness Calculator
 * 
 * Calculates goal readiness score based on current skill levels and goal skill map.
 * 
 * @module lib/facilitator-goal-readiness
 */

import { getGoalSkillMap } from './goal-skill-map';

/**
 * Calculate goal readiness score (0-100)
 * 
 * Formula: Weighted sum of skill scores using goal skill map weights
 */
export function calculateGoalReadiness(
  goalTitle: string,
  skillScores: Record<string, number> // Skill category -> score (0-100)
): number {
  const skillMap = getGoalSkillMap(goalTitle);
  if (!skillMap) {
    // Default: average of all skills
    const scores = Object.values(skillScores);
    return scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
  }

  // Calculate weighted sum
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [skill, weight] of Object.entries(skillMap.skillWeights)) {
    const score = skillScores[skill] || 50; // Default to 50 if skill not measured
    weightedSum += score * weight;
    totalWeight += weight;
  }

  // Normalize by total weight (should be 1.0, but handle edge cases)
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Get skill improvement suggestions based on goal and current scores
 */
export function getSkillImprovementSuggestions(
  goalTitle: string,
  skillScores: Record<string, number>
): Array<{ skill: string; currentScore: number; targetWeight: number; priority: number }> {
  const skillMap = getGoalSkillMap(goalTitle);
  if (!skillMap) {
    return [];
  }

  // Calculate priority: high weight + low score = high priority
  const suggestions = Object.entries(skillMap.skillWeights)
    .map(([skill, weight]) => ({
      skill,
      currentScore: skillScores[skill] || 50,
      targetWeight: weight,
      priority: weight * (100 - (skillScores[skill] || 50)),
    }))
    .sort((a, b) => b.priority - a.priority);

  return suggestions;
}

