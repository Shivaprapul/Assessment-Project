/**
 * Explorer Mode Quest Generator
 * 
 * Generates daily quests for Explorer Mode.
 * Creates 3 quests per day: mini_game, reflection, choice_scenario
 * 
 * @module lib/explorer-quests
 */

import { generateDemoQuestions } from './demo-questions';

export type QuestType = 'mini_game' | 'reflection' | 'choice_scenario';

export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  estimatedTime: number; // minutes
  content: {
    // For mini_game
    gameId?: string;
    questionCount?: number;
    // For reflection
    prompt?: string;
    // For choice_scenario
    scenario?: string;
    choices?: string[];
  };
  skillSignals: string[];
  // Grade-aware metadata
  gradeApplicability?: number[]; // e.g. [8], [9,10], [8,9,10] - defaults to [8,9,10] if not specified
  primarySkills?: string[]; // Primary skill categories targeted
  secondarySkills?: string[]; // Secondary skill categories
  difficultyByGrade?: Record<number, 'easy' | 'medium' | 'hard'>;
}

/**
 * Generate daily quests for a student (grade-aware)
 */
export function generateDailyQuests(
  studentId: string,
  date: Date,
  count: number = 3,
  studentGrade?: number // 8, 9, or 10
): Quest[] {
  const seed = `${studentId}-${date.toISOString().split('T')[0]}`;
  const grade = studentGrade || 8; // Default to 8 if not specified
  const gradeApplicability = [8, 9, 10]; // Default to universal
  
  // Adjust difficulty and content based on grade
  const questionCount = grade >= 9 ? 8 : 6; // More questions for higher grades
  const reflectionDepth = grade >= 10 ? 'deeper' : 'standard';
  
  const quests: Quest[] = [];

  // Quest 1: Mini Game
  quests.push({
    id: `quest-${seed}-1`,
    type: 'mini_game',
    title: 'Quick Pattern Challenge',
    description: 'Complete a short pattern recognition game',
    estimatedTime: grade >= 9 ? 6 : 5,
    content: {
      gameId: 'pattern_forge',
      questionCount,
    },
    skillSignals: ['COGNITIVE_REASONING'],
    gradeApplicability,
    primarySkills: ['COGNITIVE_REASONING'],
    difficultyByGrade: {
      8: 'easy',
      9: 'medium',
      10: 'medium',
    },
  });

  // Quest 2: Reflection
  const reflectionPrompts = {
    8: 'What did you learn today that surprised you? How might you use this learning in the future?',
    9: 'Reflect on a challenge you faced today. What strategies did you use, and what would you do differently next time?',
    10: 'Think about your learning process today. How did you approach new information, and what patterns did you notice in your thinking?',
  };
  
  quests.push({
    id: `quest-${seed}-2`,
    type: 'reflection',
    title: 'Daily Reflection',
    description: 'Take a moment to reflect on your learning',
    estimatedTime: grade >= 10 ? 4 : 3,
    content: {
      prompt: reflectionPrompts[grade as keyof typeof reflectionPrompts] || reflectionPrompts[8],
    },
    skillSignals: ['METACOGNITION'],
    gradeApplicability,
    primarySkills: ['METACOGNITION'],
    difficultyByGrade: {
      8: 'easy',
      9: 'medium',
      10: 'medium',
    },
  });

  // Quest 3: Choice Scenario
  const scenarios = {
    8: {
      scenario: 'You\'re working on a group project and notice a teammate struggling. What do you do?',
      choices: [
        'Offer to help them understand the concept',
        'Focus on your own work and let them figure it out',
        'Suggest they ask the teacher for help',
        'Work together to find a solution that helps everyone',
      ],
    },
    9: {
      scenario: 'You notice a classmate being excluded from a group activity. How do you respond?',
      choices: [
        'Invite them to join your group',
        'Talk to a teacher about the situation',
        'Observe and see if the situation resolves itself',
        'Address the group directly about inclusion',
      ],
    },
    10: {
      scenario: 'You discover that a friend has been copying your homework. How do you handle this?',
      choices: [
        'Confront them directly about academic integrity',
        'Offer to help them understand the material instead',
        'Report it to the teacher',
        'Have a private conversation about the importance of learning',
      ],
    },
  };
  
  const scenario = scenarios[grade as keyof typeof scenarios] || scenarios[8];
  
  quests.push({
    id: `quest-${seed}-3`,
    type: 'choice_scenario',
    title: 'Decision Scenario',
    description: 'Explore how you approach decisions',
    estimatedTime: grade >= 10 ? 5 : 4,
    content: {
      scenario: scenario.scenario,
      choices: scenario.choices,
    },
    skillSignals: ['SOCIAL_EMOTIONAL', 'CHARACTER_VALUES'],
    gradeApplicability,
    primarySkills: ['SOCIAL_EMOTIONAL', 'CHARACTER_VALUES'],
    difficultyByGrade: {
      8: 'easy',
      9: 'medium',
      10: 'hard',
    },
  });

  return quests.slice(0, count);
}

/**
 * Generate questions for a mini game quest
 */
export function generateQuestQuestions(quest: Quest, seed: string): any[] {
  if (quest.type !== 'mini_game' || !quest.content.gameId) {
    return [];
  }

  const questionCount = quest.content.questionCount || 6;
  return generateDemoQuestions(quest.content.gameId, seed, questionCount);
}

