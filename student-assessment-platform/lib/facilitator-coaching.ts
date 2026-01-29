/**
 * Facilitator Mode Coaching Insight Generator
 * 
 * Generates goal-aligned coaching feedback after quest completion.
 * 
 * @module lib/facilitator-coaching
 */

import { getGoalSkillMap } from './goal-skill-map';

export interface CoachingInsight {
  strengthObserved: string; // Behavioral strength
  improvementTip: string; // Goal-relevant improvement suggestion
  evidence: string[]; // Evidence bullets
  skillSignals: string[]; // Skills updated
  goalAlignment: string; // How this helps with the goal
}

/**
 * Generate coaching insight for a quest attempt
 */
export function generateCoachingInsight(
  questType: string,
  scoreSummary: any,
  telemetry: any,
  goalTitle: string,
  skillFocus: string[]
): CoachingInsight {
  const skillMap = getGoalSkillMap(goalTitle);
  const accuracy = scoreSummary?.accuracy || 0;
  const timeSpent = telemetry?.timeSpent || 0;
  const hintsUsed = telemetry?.hintsUsed || 0;
  const responseLength = scoreSummary?.responseLength || 0;

  let strengthObserved = '';
  let improvementTip = '';
  const evidence: string[] = [];
  const skillSignals: string[] = [...skillFocus];

  // Determine strength based on quest type and performance
  switch (questType) {
    case 'mini_game':
      if (accuracy >= 80) {
        strengthObserved = 'Strong analytical thinking';
        evidence.push(`Achieved ${accuracy}% accuracy`);
      } else if (accuracy >= 60) {
        strengthObserved = 'Solid problem-solving approach';
        evidence.push(`Completed with ${accuracy}% accuracy`);
      } else {
        strengthObserved = 'Persistent effort in challenges';
        evidence.push('Completed the challenge');
      }

      if (timeSpent < 180) {
        evidence.push(`Quick decision-making (${Math.round(timeSpent)}s)`);
      }

      if (hintsUsed === 0) {
        evidence.push('Worked independently');
      }

      // Goal-aligned improvement tip
      if (skillMap) {
        const topSkill = Object.entries(skillMap.skillWeights)
          .sort(([, a], [, b]) => b - a)[0]?.[0];
        improvementTip = `To move closer to ${goalTitle}, continue practicing ${topSkill?.replace(/_/g, ' ')} challenges.`;
      } else {
        improvementTip = `Keep practicing to build skills aligned with your ${goalTitle} goal.`;
      }
      break;

    case 'reflection':
      if (responseLength > 100) {
        strengthObserved = 'Thoughtful self-reflection';
        evidence.push('Provided detailed reflection');
      } else {
        strengthObserved = 'Willingness to reflect';
        evidence.push('Engaged with reflection prompt');
      }

      if (skillMap) {
        improvementTip = `Reflecting on your ${skillFocus[0]?.replace(/_/g, ' ') || 'learning'} helps build self-awareness needed for ${goalTitle}.`;
      } else {
        improvementTip = 'Continue reflecting to build self-awareness for your goal.';
      }
      break;

    case 'choice_scenario':
      strengthObserved = 'Considered multiple perspectives';
      evidence.push('Engaged with ethical scenario');

      if (skillMap) {
        improvementTip = `Exploring scenarios helps develop decision-making skills important for ${goalTitle}.`;
      } else {
        improvementTip = 'Keep exploring scenarios to build decision-making skills.';
      }
      break;

    default:
      strengthObserved = 'Active engagement with learning';
      evidence.push('Completed the quest');
      improvementTip = `Continue practicing to build skills for ${goalTitle}.`;
  }

  // Ensure we have at least one evidence point
  if (evidence.length === 0) {
    evidence.push('Completed the quest');
  }

  // Goal alignment message
  const goalAlignment = skillMap
    ? `This practice strengthens ${skillFocus[0]?.replace(/_/g, ' ') || 'key skills'} important for ${goalTitle}.`
    : `This practice helps you move closer to your ${goalTitle} goal.`;

  return {
    strengthObserved,
    improvementTip,
    evidence,
    skillSignals: [...new Set(skillSignals)], // Remove duplicates
    goalAlignment,
  };
}

