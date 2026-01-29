/**
 * Student Levels System
 * 
 * XP-based leveling system with fun level names.
 * 
 * @module lib/student-levels
 */

export interface StudentLevel {
  level: number;
  name: string;
  xpRequired: number;
  nextLevelXp: number;
}

/**
 * Level definitions (8-12 fun level names)
 */
export const LEVELS: StudentLevel[] = [
  { level: 1, name: 'Curious Rookie', xpRequired: 0, nextLevelXp: 100 },
  { level: 2, name: 'Pattern Hunter', xpRequired: 100, nextLevelXp: 250 },
  { level: 3, name: 'Logic Explorer', xpRequired: 250, nextLevelXp: 500 },
  { level: 4, name: 'Strategy Crafter', xpRequired: 500, nextLevelXp: 1000 },
  { level: 5, name: 'Mind Athlete', xpRequired: 1000, nextLevelXp: 2000 },
  { level: 6, name: 'Insight Captain', xpRequired: 2000, nextLevelXp: 3500 },
  { level: 7, name: 'Wisdom Seeker', xpRequired: 3500, nextLevelXp: 5500 },
  { level: 8, name: 'Master Thinker', xpRequired: 5500, nextLevelXp: 8000 },
  { level: 9, name: 'Genius Navigator', xpRequired: 8000, nextLevelXp: 12000 },
  { level: 10, name: 'Legendary Scholar', xpRequired: 12000, nextLevelXp: 18000 },
  { level: 11, name: 'Supreme Mind', xpRequired: 18000, nextLevelXp: 25000 },
  { level: 12, name: 'Transcendent Master', xpRequired: 25000, nextLevelXp: Infinity },
];

/**
 * Calculate XP gained from an attempt
 */
export function calculateXP(attempt: {
  accuracy?: number;
  timeSpent?: number;
  questionsAnswered?: number;
  hintsUsed?: number;
}): number {
  let xp = 0;
  
  // Base XP for completion
  xp += 50;
  
  // Accuracy bonus (0-50 XP)
  if (attempt.accuracy !== undefined) {
    xp += Math.floor(attempt.accuracy * 0.5);
  }
  
  // Speed bonus (0-30 XP) - faster is better
  if (attempt.timeSpent && attempt.questionsAnswered) {
    const avgTimePerQuestion = attempt.timeSpent / attempt.questionsAnswered;
    if (avgTimePerQuestion < 30) {
      xp += 30;
    } else if (avgTimePerQuestion < 60) {
      xp += 20;
    } else if (avgTimePerQuestion < 90) {
      xp += 10;
    }
  }
  
  // Hint penalty
  if (attempt.hintsUsed) {
    xp -= attempt.hintsUsed * 5;
  }
  
  // Minimum XP
  return Math.max(10, xp);
}

/**
 * Get current level from total XP
 */
export function getCurrentLevel(totalXP: number): StudentLevel {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xpRequired) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

/**
 * Get XP progress to next level
 */
export function getXPProgress(totalXP: number): {
  currentLevel: StudentLevel;
  xpInCurrentLevel: number;
  xpNeededForNext: number;
  progressPercent: number;
} {
  const currentLevel = getCurrentLevel(totalXP);
  const xpInCurrentLevel = totalXP - currentLevel.xpRequired;
  const xpNeededForNext = currentLevel.nextLevelXp - currentLevel.xpRequired;
  const progressPercent = Math.min(100, (xpInCurrentLevel / xpNeededForNext) * 100);
  
  return {
    currentLevel,
    xpInCurrentLevel,
    xpNeededForNext,
    progressPercent,
  };
}

/**
 * Check if level up occurred
 */
export function checkLevelUp(oldXP: number, newXP: number): boolean {
  const oldLevel = getCurrentLevel(oldXP);
  const newLevel = getCurrentLevel(newXP);
  return newLevel.level > oldLevel.level;
}

