/**
 * Grade Utilities
 * 
 * Helper functions for grade-based progression and content filtering.
 * 
 * @module lib/grade-utils
 */

export type Grade = 8 | 9 | 10;

export const VALID_GRADES: Grade[] = [8, 9, 10];

/**
 * Check if a grade is valid
 */
export function isValidGrade(grade: number): grade is Grade {
  return VALID_GRADES.includes(grade as Grade);
}

/**
 * Get next grade
 */
export function getNextGrade(currentGrade: Grade): Grade | null {
  if (currentGrade === 8) return 9;
  if (currentGrade === 9) return 10;
  return null; // 10 is the highest
}

/**
 * Get grade-specific curriculum focus
 */
export function getGradeFocus(grade: Grade): {
  focus: string;
  description: string;
  skillEmphasis: string[];
} {
  switch (grade) {
    case 8:
      return {
        focus: 'Foundation & Exploration',
        description: 'Building foundational reasoning, curiosity, and exploration skills',
        skillEmphasis: [
          'COGNITIVE_REASONING',
          'CREATIVITY',
          'CURIOSITY',
          'EXPLORATION',
        ],
      };
    case 9:
      return {
        focus: 'Application & Planning',
        description: 'Applying knowledge, structured thinking, and planning skills',
        skillEmphasis: [
          'PLANNING',
          'COGNITIVE_REASONING',
          'ATTENTION',
          'METACOGNITION',
        ],
      };
    case 10:
      return {
        focus: 'Exam Readiness & Career Alignment',
        description: 'Exam preparation, decision-making, and career alignment',
        skillEmphasis: [
          'PLANNING',
          'COGNITIVE_REASONING',
          'DECISION_MAKING',
          'CAREER_READINESS',
        ],
      };
    default:
      return {
        focus: 'General Development',
        description: 'General skill development',
        skillEmphasis: [],
      };
  }
}

/**
 * Get grade-specific messaging for career discovery
 */
export function getCareerMessaging(grade: Grade): {
  explorer: string;
  facilitator: string;
} {
  switch (grade) {
    case 8:
      return {
        explorer: 'Explore different careers and discover what interests you',
        facilitator: 'Build foundational skills for future career paths',
      };
    case 9:
      return {
        explorer: 'Discover careers that align with your interests and skills',
        facilitator: 'Develop skills aligned with your career interests',
      };
    case 10:
      return {
        explorer: 'Prepare for careers and understand readiness requirements',
        facilitator: 'Strengthen skills for your chosen career path',
      };
    default:
      return {
        explorer: 'Explore career options',
        facilitator: 'Develop career-relevant skills',
      };
  }
}

/**
 * Filter content by grade applicability
 */
export function isContentApplicableToGrade(
  contentGradeApplicability: number[] | number | undefined,
  studentGrade: Grade
): boolean {
  if (!contentGradeApplicability) {
    // If no grade specified, assume applicable to all
    return true;
  }
  
  if (typeof contentGradeApplicability === 'number') {
    return contentGradeApplicability === studentGrade;
  }
  
  if (Array.isArray(contentGradeApplicability)) {
    return contentGradeApplicability.includes(studentGrade);
  }
  
  return true;
}

/**
 * Adjust difficulty/expectations based on grade
 */
export function getGradeAdjustedDifficulty(
  baseDifficulty: number,
  grade: Grade
): number {
  // Grade 8: slightly easier, Grade 9: base, Grade 10: slightly harder
  const multipliers = {
    8: 0.9,
    9: 1.0,
    10: 1.1,
  };
  
  return Math.min(100, Math.max(0, baseDifficulty * multipliers[grade]));
}

