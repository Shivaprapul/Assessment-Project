/**
 * Explorer Mode AI Insight Generator
 * 
 * Generates deterministic AI-style insights based on quest performance.
 * Uses templates and quest metrics to create encouraging, growth-oriented insights.
 * 
 * @module lib/explorer-insights
 */

export interface AIInsight {
  strengthObserved: string;
  growthSuggestion: string;
  evidence: string[];
  skillSignals: string[];
}

/**
 * Generate AI insight based on quest attempt
 */
export function generateQuestInsight(
  questType: string,
  scoreSummary: any,
  telemetry: any
): AIInsight {
  const accuracy = scoreSummary?.accuracy || 0;
  const timeSpent = telemetry?.timeSpent || 0;
  const hintsUsed = telemetry?.hintsUsed || 0;

  // Determine strength based on performance
  let strengthObserved = '';
  let growthSuggestion = '';
  const evidence: string[] = [];
  const skillSignals: string[] = [];

  switch (questType) {
    case 'mini_game':
      if (accuracy >= 80) {
        strengthObserved = 'Strong problem-solving skills';
        evidence.push(`Achieved ${accuracy}% accuracy`);
        skillSignals.push('COGNITIVE_REASONING');
      } else if (accuracy >= 60) {
        strengthObserved = 'Solid problem-solving approach';
        evidence.push(`Completed with ${accuracy}% accuracy`);
        skillSignals.push('COGNITIVE_REASONING');
      } else {
        strengthObserved = 'Persistent effort in problem-solving';
        evidence.push('Completed the challenge');
        skillSignals.push('COGNITIVE_REASONING');
      }

      if (timeSpent < 180) {
        evidence.push(`Quick decision-making (${Math.round(timeSpent)}s)`);
        skillSignals.push('ATTENTION');
      }

      if (hintsUsed === 0) {
        evidence.push('Worked independently');
        skillSignals.push('METACOGNITION');
      }

      growthSuggestion = accuracy >= 80
        ? 'Continue exploring more complex challenges'
        : 'Practice with similar challenges to build confidence';

      break;

    case 'reflection':
      const responseLength = scoreSummary?.responseLength || 0;
      if (responseLength > 100) {
        strengthObserved = 'Thoughtful self-reflection';
        evidence.push('Provided detailed reflection');
        skillSignals.push('METACOGNITION');
      } else {
        strengthObserved = 'Willingness to reflect';
        evidence.push('Engaged with reflection prompt');
        skillSignals.push('METACOGNITION');
      }

      growthSuggestion = 'Continue reflecting on your learning journey to build self-awareness';

      break;

    case 'choice_scenario':
      strengthObserved = 'Considered multiple perspectives';
      evidence.push('Engaged with ethical scenario');
      skillSignals.push('SOCIAL_EMOTIONAL', 'CHARACTER_VALUES');

      growthSuggestion = 'Keep exploring how your values guide your decisions';

      break;

    default:
      strengthObserved = 'Active engagement with learning';
      evidence.push('Completed the quest');
      growthSuggestion = 'Continue exploring new challenges';
  }

  // Ensure we have at least one evidence point
  if (evidence.length === 0) {
    evidence.push('Completed the quest');
  }

  return {
    strengthObserved,
    growthSuggestion,
    evidence,
    skillSignals: [...new Set(skillSignals)], // Remove duplicates
  };
}

