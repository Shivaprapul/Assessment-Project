/**
 * Demo Questions Generator
 * 
 * Generates deterministic demo questions for all 8 assessment games.
 * Uses stable seeds (userId or attemptId) to ensure consistent results.
 * 
 * @module lib/demo-questions
 */

import { getGameConfig } from './games';

export interface DemoQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'text' | 'sequence' | 'visual';
  options?: string[];
  correctAnswer?: number | string;
  category: string;
}

/**
 * Simple deterministic hash function
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate deterministic random number from seed
 */
function seededRandom(seed: number, min: number = 0, max: number = 1): number {
  const x = Math.sin(seed) * 10000;
  return min + (x - Math.floor(x)) * (max - min);
}

/**
 * Generate demo questions for a game based on seed
 */
export function generateDemoQuestions(gameId: string, seed: string, count: number = 12): DemoQuestion[] {
  const baseSeed = hashString(`${gameId}-${seed}`);
  const gameConfig = getGameConfig(gameId);
  const questions: DemoQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const questionSeed = baseSeed + i;
    const question = generateQuestionForGame(gameId, questionSeed, i, gameConfig?.targetCategories[0] || 'COGNITIVE_REASONING');
    questions.push(question);
  }

  return questions;
}

function generateQuestionForGame(
  gameId: string,
  seed: number,
  index: number,
  category: string
): DemoQuestion {
  const random = (min: number, max: number) => seededRandom(seed + index, min, max);
  const randomInt = (min: number, max: number) => Math.floor(random(min, max + 1));

  switch (gameId) {
    case 'pattern_forge':
      return {
        id: `q-${seed}-${index}`,
        question: `What comes next in this pattern: 2, 4, 8, 16, ?`,
        type: 'multiple_choice',
        options: ['24', '32', '28', '20'],
        correctAnswer: 1, // 32
        category: 'COGNITIVE_REASONING',
      };

    case 'many_ways_builder':
      return {
        id: `q-${seed}-${index}`,
        question: `How many different ways can you arrange these blocks to build a tower?`,
        type: 'multiple_choice',
        options: ['3 ways', '6 ways', '9 ways', '12 ways'],
        correctAnswer: randomInt(0, 3),
        category: 'CREATIVITY',
      };

    case 'story_lens':
      return {
        id: `q-${seed}-${index}`,
        question: `Complete this story: "Once upon a time, a curious explorer discovered..."`,
        type: 'text',
        category: 'LANGUAGE',
      };

    case 'visual_vault':
      return {
        id: `q-${seed}-${index}`,
        question: `Remember the sequence of shapes you just saw. Which order is correct?`,
        type: 'sequence',
        options: ['Circle, Square, Triangle', 'Square, Circle, Triangle', 'Triangle, Circle, Square', 'Circle, Triangle, Square'],
        correctAnswer: randomInt(0, 3),
        category: 'MEMORY',
      };

    case 'focus_sprint':
      return {
        id: `q-${seed}-${index}`,
        question: `Count how many times the letter 'A' appears in this text: "An amazing adventure awaits all adventurers."`,
        type: 'multiple_choice',
        options: ['6', '7', '8', '9'],
        correctAnswer: 2, // 8
        category: 'ATTENTION',
      };

    case 'mission_planner':
      return {
        id: `q-${seed}-${index}`,
        question: `Plan the steps to organize a school event. What should come first?`,
        type: 'multiple_choice',
        options: ['Set a date', 'Choose a venue', 'Create a budget', 'Form a committee'],
        correctAnswer: randomInt(0, 3),
        category: 'PLANNING',
      };

    case 'dilemma_compass':
      return {
        id: `q-${seed}-${index}`,
        question: `You find a lost wallet with money. What would you do?`,
        type: 'multiple_choice',
        options: ['Keep it', 'Return it to the owner', 'Donate the money', 'Ask an adult for help'],
        correctAnswer: randomInt(1, 3), // Always ethical options
        category: 'SOCIAL_EMOTIONAL',
      };

    case 'replay_reflect':
      return {
        id: `q-${seed}-${index}`,
        question: `Reflect on your learning journey. What strategy helped you most?`,
        type: 'text',
        category: 'METACOGNITION',
      };

    default:
      return {
        id: `q-${seed}-${index}`,
        question: `Demo question ${index + 1}`,
        type: 'multiple_choice',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        category: 'COGNITIVE_REASONING',
      };
  }
}

/**
 * Calculate deterministic score based on answers, time, and hints
 */
export function calculateDemoScore(
  questions: DemoQuestion[],
  answers: (number | string | null)[],
  timeSpent: number, // seconds
  hintsUsed: number
): {
  accuracy: number;
  avgTimePerQuestion: number;
  normalizedScore: number;
  strengths: string[];
  growthAreas: string[];
} {
  const totalQuestions = questions.length;
  let correctCount = 0;

  // Check answers (for demo, we'll use deterministic scoring)
  answers.forEach((answer, index) => {
    const question = questions[index];
    if (question.correctAnswer !== undefined) {
      if (typeof question.correctAnswer === 'number' && answer === question.correctAnswer) {
        correctCount++;
      } else if (typeof question.correctAnswer === 'string' && answer === question.correctAnswer) {
        correctCount++;
      } else if (question.type === 'text' && answer && String(answer).length > 10) {
        // For text questions, any substantial answer counts
        correctCount++;
      }
    } else if (answer !== null && answer !== undefined) {
      // If no correct answer defined, count any answer
      correctCount++;
    }
  });

  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const avgTimePerQuestion = totalQuestions > 0 ? Math.round(timeSpent / totalQuestions) : 0;

  // Normalized score: accuracy (70%) + time efficiency (20%) + no hints bonus (10%)
  const timeEfficiency = Math.max(0, 100 - (avgTimePerQuestion * 2)); // Penalize slow answers
  const hintsPenalty = hintsUsed * 5; // 5 points per hint
  const normalizedScore = Math.min(100, Math.max(0, 
    (accuracy * 0.7) + 
    (timeEfficiency * 0.2) + 
    ((100 - hintsPenalty) * 0.1)
  ));

  // Generate strengths and growth areas based on score
  const strengths: string[] = [];
  const growthAreas: string[] = [];

  if (accuracy >= 80) {
    strengths.push('Strong problem-solving accuracy');
  } else if (accuracy < 60) {
    growthAreas.push('Improving answer accuracy');
  }

  if (avgTimePerQuestion < 30) {
    strengths.push('Quick decision-making');
  } else if (avgTimePerQuestion > 60) {
    growthAreas.push('Building confidence in responses');
  }

  if (hintsUsed === 0) {
    strengths.push('Independent problem-solving');
  } else if (hintsUsed > 3) {
    growthAreas.push('Developing self-reliance');
  }

  if (strengths.length === 0) {
    strengths.push('Consistent effort');
  }
  if (growthAreas.length === 0) {
    growthAreas.push('Continued practice');
  }

  return {
    accuracy,
    avgTimePerQuestion,
    normalizedScore: Math.round(normalizedScore),
    strengths: strengths.slice(0, 2),
    growthAreas: growthAreas.slice(0, 2),
  };
}

