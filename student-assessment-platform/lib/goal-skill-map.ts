/**
 * Goal Skill Map Configuration
 * 
 * Defines skill weights and quest mix for each goal.
 * Used to generate personalized training plans in Facilitator Mode.
 * 
 * @module lib/goal-skill-map
 */

export interface GoalSkillMap {
  goalTitle: string;
  skillWeights: Record<string, number>; // Skill category -> weight (sums to 1.0)
  questMix: {
    mini_game: number; // Percentage (0-100)
    reflection: number;
    choice_scenario: number;
  };
}

/**
 * Curated goal skill maps for predefined goals
 */
export const GOAL_SKILL_MAPS: Record<string, GoalSkillMap> = {
  'IAS': {
    goalTitle: 'IAS (Civil Services)',
    skillWeights: {
      'COGNITIVE_REASONING': 0.20,
      'LANGUAGE': 0.20, // communication
      'PLANNING': 0.15,
      'CHARACTER_VALUES': 0.15, // ethics
      'MEMORY': 0.10,
      'ATTENTION': 0.10, // focus
      'SOCIAL_EMOTIONAL': 0.10,
    },
    questMix: {
      mini_game: 40,
      reflection: 30,
      choice_scenario: 30,
    },
  },
  'Doctor': {
    goalTitle: 'Doctor',
    skillWeights: {
      'MEMORY': 0.20,
      'ATTENTION': 0.15, // focus
      'COGNITIVE_REASONING': 0.15,
      'METACOGNITION': 0.15, // discipline_self_regulation
      'LANGUAGE': 0.10, // communication
      'CHARACTER_VALUES': 0.10, // ethics
      'PLANNING': 0.10,
      'SOCIAL_EMOTIONAL': 0.05,
    },
    questMix: {
      mini_game: 50,
      reflection: 20,
      choice_scenario: 30,
    },
  },
  'Software Engineer': {
    goalTitle: 'Software Engineer',
    skillWeights: {
      'COGNITIVE_REASONING': 0.25,
      'PLANNING': 0.20,
      'ATTENTION': 0.15, // focus
      'CREATIVITY': 0.15,
      'LANGUAGE': 0.10, // communication
      'METACOGNITION': 0.10, // technical_proficiency approximated
      'CHARACTER_VALUES': 0.05, // discipline_self_regulation
    },
    questMix: {
      mini_game: 60,
      reflection: 15,
      choice_scenario: 25,
    },
  },
  'Entrepreneur': {
    goalTitle: 'Entrepreneur',
    skillWeights: {
      'CREATIVITY': 0.20,
      'LANGUAGE': 0.20, // communication
      'PLANNING': 0.15,
      'SOCIAL_EMOTIONAL': 0.15,
      'CHARACTER_VALUES': 0.10, // ethics
      'COGNITIVE_REASONING': 0.10,
      'METACOGNITION': 0.10, // discipline_self_regulation
    },
    questMix: {
      mini_game: 30,
      reflection: 30,
      choice_scenario: 40,
    },
  },
  'CA': {
    goalTitle: 'CA (Chartered Accountant)',
    skillWeights: {
      'COGNITIVE_REASONING': 0.25,
      'ATTENTION': 0.20, // focus
      'PLANNING': 0.15,
      'MEMORY': 0.15,
      'METACOGNITION': 0.15, // discipline_self_regulation
      'CHARACTER_VALUES': 0.10, // ethics
    },
    questMix: {
      mini_game: 55,
      reflection: 20,
      choice_scenario: 25,
    },
  },
};

/**
 * Get skill map for a goal
 */
export function getGoalSkillMap(goalTitle: string): GoalSkillMap | null {
  // Check exact match first
  if (GOAL_SKILL_MAPS[goalTitle]) {
    return GOAL_SKILL_MAPS[goalTitle];
  }

  // Try case-insensitive match
  const upperGoal = goalTitle.toUpperCase();
  for (const [key, map] of Object.entries(GOAL_SKILL_MAPS)) {
    if (key.toUpperCase() === upperGoal) {
      return map;
    }
  }

  // Try keyword matching for custom goals
  return getDefaultSkillMap(goalTitle);
}

/**
 * Get default skill map for custom goals using keyword matching
 */
function getDefaultSkillMap(goalTitle: string): GoalSkillMap {
  const lowerGoal = goalTitle.toLowerCase();
  
  // Keyword-based mapping
  if (lowerGoal.includes('engineer') || lowerGoal.includes('programming') || lowerGoal.includes('developer')) {
    return GOAL_SKILL_MAPS['Software Engineer'];
  }
  if (lowerGoal.includes('doctor') || lowerGoal.includes('medical') || lowerGoal.includes('physician')) {
    return GOAL_SKILL_MAPS['Doctor'];
  }
  if (lowerGoal.includes('entrepreneur') || lowerGoal.includes('business') || lowerGoal.includes('startup')) {
    return GOAL_SKILL_MAPS['Entrepreneur'];
  }
  if (lowerGoal.includes('accountant') || lowerGoal.includes('ca ') || lowerGoal.includes('chartered')) {
    return GOAL_SKILL_MAPS['CA'];
  }
  if (lowerGoal.includes('ias') || lowerGoal.includes('civil service') || lowerGoal.includes('administrative')) {
    return GOAL_SKILL_MAPS['IAS'];
  }

  // Default balanced map for unknown goals
  return {
    goalTitle,
    skillWeights: {
      'COGNITIVE_REASONING': 0.20,
      'PLANNING': 0.15,
      'LANGUAGE': 0.15,
      'CREATIVITY': 0.15,
      'ATTENTION': 0.10,
      'MEMORY': 0.10,
      'SOCIAL_EMOTIONAL': 0.10,
      'METACOGNITION': 0.05,
    },
    questMix: {
      mini_game: 40,
      reflection: 30,
      choice_scenario: 30,
    },
  };
}

/**
 * Get curated goal list for the wizard
 */
export function getCuratedGoals(): Array<{ id: string; title: string }> {
  return [
    { id: 'IAS', title: 'IAS (Civil Services)' },
    { id: 'Doctor', title: 'Doctor' },
    { id: 'Software Engineer', title: 'Software Engineer' },
    { id: 'Entrepreneur', title: 'Entrepreneur' },
    { id: 'CA', title: 'CA (Chartered Accountant)' },
  ];
}

