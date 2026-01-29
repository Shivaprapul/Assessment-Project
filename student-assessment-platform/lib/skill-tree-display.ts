/**
 * Skill Tree Display Utilities
 * 
 * Maps skill maturity bands to game-like levels and provides role-based display props.
 * Students never see maturity band labels - only fun level titles and XP.
 * 
 * @module lib/skill-tree-display
 */

import { SkillMaturityBand, getBandOrder } from './skill-maturity-bands';
import type { Grade } from './grade-utils';
import { SkillCategory } from '@prisma/client';

/**
 * Map maturity band to numeric level (1-10)
 * Internal mapping only - students see levels, not bands
 */
export function mapMaturityBandToLevel(band: SkillMaturityBand, score?: number): number {
  // Use score to determine exact level within band range
  const scoreNormalized = score ? Math.min(100, Math.max(0, score)) / 100 : 0.5;
  
  switch (band) {
    case SkillMaturityBand.DISCOVERING:
      return Math.floor(scoreNormalized * 2) + 1; // Level 1-2
    case SkillMaturityBand.PRACTICING:
      return Math.floor(scoreNormalized * 2) + 3; // Level 3-4
    case SkillMaturityBand.CONSISTENT:
      return Math.floor(scoreNormalized * 2) + 5; // Level 5-6
    case SkillMaturityBand.INDEPENDENT:
      return Math.floor(scoreNormalized * 2) + 7; // Level 7-8
    case SkillMaturityBand.ADAPTIVE:
      return Math.floor(scoreNormalized * 2) + 9; // Level 9-10
    case SkillMaturityBand.UNCLASSIFIED:
      return 1; // Starting level
    default:
      return 1;
  }
}

/**
 * Get fun level title for students (never shows maturity band)
 */
export function getFunLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: 'Seedling',
    2: 'Sprout',
    3: 'Budding',
    4: 'Growing',
    5: 'Flourishing',
    6: 'Thriving',
    7: 'Mastering',
    8: 'Expert',
    9: 'Legendary',
    10: 'Transcendent',
  };
  
  // For levels between defined ones, interpolate
  if (level <= 1) return titles[1];
  if (level >= 10) return titles[10];
  
  const lower = Math.floor(level);
  const upper = Math.ceil(level);
  return titles[lower] || titles[upper] || 'Growing';
}

/**
 * Calculate XP from maturity band and score
 */
export function calculateSkillXP(band: SkillMaturityBand, score: number): number {
  const baseXP = {
    [SkillMaturityBand.UNCLASSIFIED]: 0,
    [SkillMaturityBand.DISCOVERING]: 100,
    [SkillMaturityBand.PRACTICING]: 300,
    [SkillMaturityBand.CONSISTENT]: 600,
    [SkillMaturityBand.INDEPENDENT]: 1000,
    [SkillMaturityBand.ADAPTIVE]: 1500,
  };
  
  const bandXP = baseXP[band] || 0;
  const scoreBonus = Math.floor(score * 0.5); // Score contributes to XP
  return bandXP + scoreBonus;
}

/**
 * Get visual progression cues based on maturity band
 * These drive the visual language, not text
 */
export function getVisualProgressionCues(band: SkillMaturityBand): {
  glow: 'soft' | 'solid' | 'steady' | 'highlight' | 'aura';
  progressStyle: 'dotted' | 'solid' | 'animated' | 'badge' | 'star';
  animation?: 'pulse' | 'steady' | 'glow' | 'sparkle';
} {
  switch (band) {
    case SkillMaturityBand.DISCOVERING:
      return {
        glow: 'soft',
        progressStyle: 'dotted',
        animation: 'pulse',
      };
    case SkillMaturityBand.PRACTICING:
      return {
        glow: 'solid',
        progressStyle: 'solid',
        animation: 'steady',
      };
    case SkillMaturityBand.CONSISTENT:
      return {
        glow: 'steady',
        progressStyle: 'animated',
        animation: 'glow',
      };
    case SkillMaturityBand.INDEPENDENT:
      return {
        glow: 'highlight',
        progressStyle: 'badge',
        animation: 'sparkle',
      };
    case SkillMaturityBand.ADAPTIVE:
      return {
        glow: 'aura',
        progressStyle: 'star',
        animation: 'sparkle',
      };
    case SkillMaturityBand.UNCLASSIFIED:
      return {
        glow: 'soft',
        progressStyle: 'dotted',
      };
    default:
      return {
        glow: 'soft',
        progressStyle: 'solid',
      };
  }
}

/**
 * Get student-friendly copy based on maturity band
 * Never mentions maturity bands explicitly
 */
export function getStudentFriendlyCopy(band: SkillMaturityBand, trend: 'up' | 'stable' | 'down'): string {
  if (trend === 'up') {
    switch (band) {
      case SkillMaturityBand.DISCOVERING:
        return 'You\'re getting faster at this!';
      case SkillMaturityBand.PRACTICING:
        return 'Level Up! 🎉';
      case SkillMaturityBand.CONSISTENT:
        return 'Nice consistency streak!';
      case SkillMaturityBand.INDEPENDENT:
        return 'New ability unlocked!';
      case SkillMaturityBand.ADAPTIVE:
        return 'Mastery achieved! 🌟';
      default:
        return 'Keep growing!';
    }
  }
  
  if (trend === 'stable') {
    return 'Steady progress!';
  }
  
  return 'Keep practicing!';
}

/**
 * Get parent-friendly context (includes grade expectation, soft language)
 */
export function getParentContext(
  currentBand: SkillMaturityBand,
  expectedBand: SkillMaturityBand | null,
  grade: Grade,
  skillName: string
): {
  message: string;
  indicators: string[];
} {
  const skillNameLower = skillName.toLowerCase();
  
  if (!expectedBand) {
    return {
      message: `Currently showing ${currentBand.toLowerCase()} use.`,
      indicators: ['✓'],
    };
  }
  
  const comparison = getBandOrder(currentBand) - getBandOrder(expectedBand);
  
  if (comparison < -1) {
    return {
      message: `At Grade ${grade} level, this skill is commonly ${expectedBand.toLowerCase()}. Currently showing ${currentBand.toLowerCase()} use. This is common and typically becomes consistent with practice.`,
      indicators: ['✓', '➝'],
    };
  } else if (comparison > 1) {
    return {
      message: `At Grade ${grade} level, this skill is commonly ${expectedBand.toLowerCase()}. Currently showing ${currentBand.toLowerCase()} use. This shows signs of independent use for this grade context.`,
      indicators: ['✓', '✨'],
    };
  } else {
    return {
      message: `At Grade ${grade} level, this skill is commonly ${expectedBand.toLowerCase()}. Currently showing ${currentBand.toLowerCase()} use. This is developing as expected.`,
      indicators: ['✓'],
    };
  }
}

/**
 * Get teacher-friendly actionable insights
 */
export function getTeacherInsights(
  currentBand: SkillMaturityBand,
  skill: SkillCategory
): {
  maturityBand: SkillMaturityBand;
  suggestedActions: string[];
} {
  const actions: Record<SkillCategory, Record<SkillMaturityBand, string[]>> = {
    COGNITIVE_REASONING: {
      [SkillMaturityBand.DISCOVERING]: [
        'Use 2-minute planning prompt before task',
        'Break complex problems into smaller steps',
        'Encourage "think aloud" strategies',
      ],
      [SkillMaturityBand.PRACTICING]: [
        'Provide guided practice with examples',
        'Use scaffolded problem-solving prompts',
        'Celebrate logical thinking attempts',
      ],
      [SkillMaturityBand.CONSISTENT]: [
        'Introduce more complex problem types',
        'Encourage independent reasoning',
        'Connect reasoning to real-world applications',
      ],
      [SkillMaturityBand.INDEPENDENT]: [
        'Provide challenging, open-ended problems',
        'Encourage peer teaching opportunities',
        'Support creative problem-solving approaches',
      ],
      [SkillMaturityBand.ADAPTIVE]: [
        'Offer advanced problem-solving challenges',
        'Encourage leadership in group problem-solving',
        'Support exploration of novel approaches',
      ],
      [SkillMaturityBand.UNCLASSIFIED]: [
        'Observe and gather baseline evidence',
        'Provide varied problem-solving opportunities',
      ],
    },
    PLANNING: {
      [SkillMaturityBand.DISCOVERING]: [
        'Use 2-minute planning prompt before task',
        'Model planning with think-aloud',
        'Provide planning templates or checklists',
      ],
      [SkillMaturityBand.PRACTICING]: [
        'Encourage daily planning routines',
        'Use visual planning tools',
        'Celebrate planning attempts',
      ],
      [SkillMaturityBand.CONSISTENT]: [
        'Support independent planning strategies',
        'Introduce longer-term planning projects',
        'Connect planning to goal achievement',
      ],
      [SkillMaturityBand.INDEPENDENT]: [
        'Provide complex planning challenges',
        'Encourage planning for multiple goals',
        'Support strategic planning approaches',
      ],
      [SkillMaturityBand.ADAPTIVE]: [
        'Offer advanced planning opportunities',
        'Encourage planning for others',
        'Support innovative planning approaches',
      ],
      [SkillMaturityBand.UNCLASSIFIED]: [
        'Observe planning behaviors',
        'Provide planning opportunities',
      ],
    },
    // Add more skills as needed - using PLANNING as template for others
    CREATIVITY: {
      [SkillMaturityBand.DISCOVERING]: ['Encourage creative exploration', 'Provide open-ended prompts'],
      [SkillMaturityBand.PRACTICING]: ['Support creative practice', 'Celebrate creative attempts'],
      [SkillMaturityBand.CONSISTENT]: ['Introduce creative challenges', 'Support creative expression'],
      [SkillMaturityBand.INDEPENDENT]: ['Provide advanced creative projects', 'Encourage creative leadership'],
      [SkillMaturityBand.ADAPTIVE]: ['Offer innovative challenges', 'Support creative innovation'],
      [SkillMaturityBand.UNCLASSIFIED]: ['Observe creative behaviors', 'Provide creative opportunities'],
    },
    ATTENTION: {
      [SkillMaturityBand.DISCOVERING]: ['Use attention-building activities', 'Provide focus breaks'],
      [SkillMaturityBand.PRACTICING]: ['Support focus practice', 'Use attention strategies'],
      [SkillMaturityBand.CONSISTENT]: ['Encourage sustained focus', 'Support attention management'],
      [SkillMaturityBand.INDEPENDENT]: ['Provide focus challenges', 'Support independent focus'],
      [SkillMaturityBand.ADAPTIVE]: ['Offer advanced focus opportunities', 'Support flexible attention'],
      [SkillMaturityBand.UNCLASSIFIED]: ['Observe attention patterns', 'Provide focus opportunities'],
    },
    MEMORY: {
      [SkillMaturityBand.DISCOVERING]: ['Teach memory strategies', 'Use mnemonic devices'],
      [SkillMaturityBand.PRACTICING]: ['Support memory practice', 'Celebrate memory successes'],
      [SkillMaturityBand.CONSISTENT]: ['Encourage memory application', 'Support memory strategies'],
      [SkillMaturityBand.INDEPENDENT]: ['Provide memory challenges', 'Support advanced memory'],
      [SkillMaturityBand.ADAPTIVE]: ['Offer complex memory tasks', 'Support memory innovation'],
      [SkillMaturityBand.UNCLASSIFIED]: ['Observe memory patterns', 'Provide memory opportunities'],
    },
    SOCIAL_EMOTIONAL: {
      [SkillMaturityBand.DISCOVERING]: ['Teach emotional awareness', 'Model social skills'],
      [SkillMaturityBand.PRACTICING]: ['Support social practice', 'Celebrate emotional growth'],
      [SkillMaturityBand.CONSISTENT]: ['Encourage social leadership', 'Support emotional regulation'],
      [SkillMaturityBand.INDEPENDENT]: ['Provide social challenges', 'Support peer support'],
      [SkillMaturityBand.ADAPTIVE]: ['Offer advanced social opportunities', 'Support social innovation'],
      [SkillMaturityBand.UNCLASSIFIED]: ['Observe social patterns', 'Provide social opportunities'],
    },
    METACOGNITION: {
      [SkillMaturityBand.DISCOVERING]: ['Encourage self-reflection', 'Model thinking about thinking'],
      [SkillMaturityBand.PRACTICING]: ['Support metacognitive practice', 'Celebrate self-awareness'],
      [SkillMaturityBand.CONSISTENT]: ['Encourage metacognitive application', 'Support learning strategies'],
      [SkillMaturityBand.INDEPENDENT]: ['Provide metacognitive challenges', 'Support advanced reflection'],
      [SkillMaturityBand.ADAPTIVE]: ['Offer complex metacognitive tasks', 'Support metacognitive innovation'],
      [SkillMaturityBand.UNCLASSIFIED]: ['Observe metacognitive patterns', 'Provide reflection opportunities'],
    },
    LANGUAGE: {
      [SkillMaturityBand.DISCOVERING]: ['Encourage language exploration', 'Provide language-rich activities'],
      [SkillMaturityBand.PRACTICING]: ['Support language practice', 'Celebrate communication'],
      [SkillMaturityBand.CONSISTENT]: ['Encourage language application', 'Support communication skills'],
      [SkillMaturityBand.INDEPENDENT]: ['Provide language challenges', 'Support advanced communication'],
      [SkillMaturityBand.ADAPTIVE]: ['Offer complex language tasks', 'Support language innovation'],
      [SkillMaturityBand.UNCLASSIFIED]: ['Observe language patterns', 'Provide language opportunities'],
    },
    CHARACTER_VALUES: {
      [SkillMaturityBand.DISCOVERING]: ['Encourage value exploration', 'Model character traits'],
      [SkillMaturityBand.PRACTICING]: ['Support value practice', 'Celebrate character growth'],
      [SkillMaturityBand.CONSISTENT]: ['Encourage value application', 'Support character development'],
      [SkillMaturityBand.INDEPENDENT]: ['Provide character challenges', 'Support value leadership'],
      [SkillMaturityBand.ADAPTIVE]: ['Offer advanced character opportunities', 'Support character innovation'],
      [SkillMaturityBand.UNCLASSIFIED]: ['Observe character patterns', 'Provide character opportunities'],
    },
  };
  
  return {
    maturityBand: currentBand,
    suggestedActions: actions[skill]?.[currentBand] || ['Observe and provide opportunities'],
  };
}


/**
 * Get skill tree display props based on role
 */
export interface SkillTreeDisplayProps {
  // Student view (game-like)
  level: number;
  levelTitle: string;
  xp: number;
  xpProgress: number; // 0-100
  studentCopy: string;
  visualCues: ReturnType<typeof getVisualProgressionCues>;
  
  // Parent view (adds context)
  parentContext?: {
    message: string;
    indicators: string[];
    trend7d?: 'up' | 'stable' | 'down';
    trend30d?: 'up' | 'stable' | 'down';
  };
  
  // Teacher view (adds insights)
  teacherInsights?: {
    maturityBand: SkillMaturityBand;
    suggestedActions: string[];
  };
}

export function getSkillTreeDisplayProps(
  role: 'student' | 'parent' | 'teacher',
  currentBand: SkillMaturityBand,
  score: number,
  trend: 'up' | 'stable' | 'down',
  skill: SkillCategory,
  skillName: string,
  grade?: Grade,
  expectedBand?: SkillMaturityBand | null
): SkillTreeDisplayProps {
  const level = mapMaturityBandToLevel(currentBand, score);
  const levelTitle = getFunLevelTitle(level);
  const xp = calculateSkillXP(currentBand, score);
  const xpProgress = Math.min(100, (xp % 1000) / 10); // Progress within current level (0-100)
  const studentCopy = getStudentFriendlyCopy(currentBand, trend);
  const visualCues = getVisualProgressionCues(currentBand);
  
  const props: SkillTreeDisplayProps = {
    level,
    levelTitle,
    xp,
    xpProgress,
    studentCopy,
    visualCues,
  };
  
  // Add parent context if parent role
  if (role === 'parent' && grade && expectedBand !== undefined) {
    props.parentContext = getParentContext(currentBand, expectedBand, grade, skillName);
  }
  
  // Add teacher insights if teacher role
  if (role === 'teacher') {
    props.teacherInsights = getTeacherInsights(currentBand, skill);
  }
  
  return props;
}

