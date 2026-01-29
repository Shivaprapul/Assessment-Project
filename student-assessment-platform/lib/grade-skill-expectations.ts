/**
 * Grade Skill Expectations
 * 
 * Defines expected skill maturity bands per grade per skill.
 * These are COMMONLY OBSERVED expectations, NOT requirements.
 * 
 * Key Principles:
 * - Academic grade ≠ skill maturity
 * - Skills are individual, evidence-based, and non-linear
 * - Grades define context and expectations, not assumptions
 * - Supports students joining directly in Grade 9 or 10
 * 
 * @module lib/grade-skill-expectations
 */

import { SkillMaturityBand } from './skill-maturity-bands';
import type { Grade } from './grade-utils';
import { SkillCategory } from '@prisma/client';

export interface GradeSkillExpectation {
  skill: SkillCategory;
  expectedBand: SkillMaturityBand;
  emphasisWeight: number; // 0-1, how important this skill is at this grade
  gradeNarrativeStudent: string; // 1-2 lines, encouraging, age-appropriate
  gradeNarrativeParentTeacher: string; // 2-3 lines, interpretive and calming
}

export interface GradeExpectations {
  grade: Grade;
  expectations: GradeSkillExpectation[];
}

/**
 * Grade 8 Skill Expectations (Exploratory Academic Context)
 * 
 * Emphasis: curiosity, experimentation, learning how to learn
 */
const GRADE_8_EXPECTATIONS: GradeSkillExpectation[] = [
  {
    skill: 'COGNITIVE_REASONING',
    expectedBand: SkillMaturityBand.PRACTICING,
    emphasisWeight: 0.20,
    gradeNarrativeStudent: 'You\'re practicing thinking through problems step by step. Keep exploring different ways to solve challenges!',
    gradeNarrativeParentTeacher: 'At Grade 8, students are practicing foundational reasoning skills. They\'re learning to break down problems and try different approaches. This exploration phase is natural and important for building confidence.',
  },
  {
    skill: 'CREATIVITY',
    expectedBand: SkillMaturityBand.PRACTICING,
    emphasisWeight: 0.15,
    gradeNarrativeStudent: 'You\'re practicing creative thinking! Try new ways to express yourself and solve problems.',
    gradeNarrativeParentTeacher: 'Grade 8 students are practicing creative expression. They\'re exploring different ways to approach tasks and express ideas. This experimentation is important for building creative confidence.',
  },
  {
    skill: 'ATTENTION',
    expectedBand: SkillMaturityBand.DISCOVERING,
    emphasisWeight: 0.15,
    gradeNarrativeStudent: 'You\'re discovering how to focus! Learning to pay attention takes practice, and you\'re doing great.',
    gradeNarrativeParentTeacher: 'Attention skills are in the discovering phase at Grade 8. Students are learning to notice what\'s important and maintain focus. This is a gradual process that improves with practice and maturity.',
  },
  {
    skill: 'PLANNING',
    expectedBand: SkillMaturityBand.DISCOVERING,
    emphasisWeight: 0.15,
    gradeNarrativeStudent: 'You\'re discovering how to plan ahead! Try thinking about steps before you begin - it gets easier with practice.',
    gradeNarrativeParentTeacher: 'Planning skills are in the discovering phase at Grade 8. Students are beginning to think ahead and organize their approach to tasks. This foundational stage sets the groundwork for more structured thinking later.',
  },
  {
    skill: 'MEMORY',
    expectedBand: SkillMaturityBand.PRACTICING,
    emphasisWeight: 0.10,
    gradeNarrativeStudent: 'You\'re practicing ways to remember things! Keep trying different strategies to find what works for you.',
    gradeNarrativeParentTeacher: 'Memory skills are in the practicing phase at Grade 8. Students are developing strategies for retention and recall. This is a natural progression that continues to develop with practice.',
  },
  {
    skill: 'SOCIAL_EMOTIONAL',
    expectedBand: SkillMaturityBand.PRACTICING,
    emphasisWeight: 0.10,
    gradeNarrativeStudent: 'You\'re practicing understanding feelings and working with others. This takes time, and you\'re making progress!',
    gradeNarrativeParentTeacher: 'Social-emotional skills are in the practicing phase at Grade 8. Students are learning to recognize and manage emotions, and work collaboratively. This is an important period for building these foundational skills.',
  },
  {
    skill: 'METACOGNITION',
    expectedBand: SkillMaturityBand.DISCOVERING,
    emphasisWeight: 0.10,
    gradeNarrativeStudent: 'You\'re discovering how you think and learn! Notice what helps you understand things better.',
    gradeNarrativeParentTeacher: 'Metacognitive awareness is in the discovering phase at Grade 8. Students are beginning to reflect on their own thinking and learning processes. This is an early stage that develops gradually over time.',
  },
  {
    skill: 'LANGUAGE',
    expectedBand: SkillMaturityBand.PRACTICING,
    emphasisWeight: 0.05,
    gradeNarrativeStudent: 'You\'re practicing language skills! Keep reading, writing, and expressing your ideas.',
    gradeNarrativeParentTeacher: 'Language skills are in the practicing phase at Grade 8. Students are building vocabulary, comprehension, and expression. This is a steady progression that supports all learning.',
  },
  {
    skill: 'CHARACTER_VALUES',
    expectedBand: SkillMaturityBand.PRACTICING,
    emphasisWeight: 0.10,
    gradeNarrativeStudent: 'You\'re practicing what matters to you! Keep reflecting on your values and how to act on them.',
    gradeNarrativeParentTeacher: 'Character and values are in the practicing phase at Grade 8. Students are developing their sense of what\'s important and how to act accordingly. This exploration is a natural part of identity development.',
  },
];

/**
 * Grade 9 Skill Expectations (Structured Academic Context)
 * 
 * Emphasis: building structure, consistency, and awareness
 */
const GRADE_9_EXPECTATIONS: GradeSkillExpectation[] = [
  {
    skill: 'COGNITIVE_REASONING',
    expectedBand: SkillMaturityBand.CONSISTENT,
    emphasisWeight: 0.20,
    gradeNarrativeStudent: 'Your reasoning is becoming more consistent! You\'re getting better at thinking through problems systematically.',
    gradeNarrativeParentTeacher: 'At Grade 9, reasoning skills are typically consistent. Students can apply logical thinking reliably in familiar situations. This is a natural progression from the practicing phase.',
  },
  {
    skill: 'CREATIVITY',
    expectedBand: SkillMaturityBand.CONSISTENT,
    emphasisWeight: 0.15,
    gradeNarrativeStudent: 'Your creative thinking is becoming more consistent! You\'re finding your own style and ways to express ideas.',
    gradeNarrativeParentTeacher: 'Grade 9 students typically show consistent creative expression. They can generate ideas and approaches reliably in familiar contexts. This balance is healthy and expected.',
  },
  {
    skill: 'ATTENTION',
    expectedBand: SkillMaturityBand.PRACTICING,
    emphasisWeight: 0.15,
    gradeNarrativeStudent: 'You\'re practicing focusing! Keep working on staying present with tasks that matter to you.',
    gradeNarrativeParentTeacher: 'Attention skills are typically in the practicing phase at Grade 9. Students are developing better focus and can sustain attention for longer periods. This improvement is gradual and varies by individual and context.',
  },
  {
    skill: 'PLANNING',
    expectedBand: SkillMaturityBand.PRACTICING,
    emphasisWeight: 0.15,
    gradeNarrativeStudent: 'You\'re practicing planning ahead! You\'re learning to think ahead and organize your approach.',
    gradeNarrativeParentTeacher: 'Planning skills are typically in the practicing phase at Grade 9. Students are developing the ability to think ahead and organize their work. This is a skill that continues to develop with practice and maturity.',
  },
  {
    skill: 'MEMORY',
    expectedBand: SkillMaturityBand.CONSISTENT,
    emphasisWeight: 0.10,
    gradeNarrativeStudent: 'Your memory strategies are working more consistently! You\'re finding what helps you remember and use information.',
    gradeNarrativeParentTeacher: 'Memory skills are typically consistent at Grade 9. Students can use effective strategies for retention and recall reliably. This is a natural progression that supports academic learning.',
  },
  {
    skill: 'SOCIAL_EMOTIONAL',
    expectedBand: SkillMaturityBand.CONSISTENT,
    emphasisWeight: 0.10,
    gradeNarrativeStudent: 'You\'re showing more consistent social and emotional skills! You understand yourself and others better.',
    gradeNarrativeParentTeacher: 'Social-emotional skills are typically consistent at Grade 9. Students can recognize and manage emotions, and work collaboratively more reliably. This development supports both academic and personal growth.',
  },
  {
    skill: 'METACOGNITION',
    expectedBand: SkillMaturityBand.PRACTICING,
    emphasisWeight: 0.10,
    gradeNarrativeStudent: 'You\'re practicing noticing how you learn best! This awareness helps you grow.',
    gradeNarrativeParentTeacher: 'Metacognitive awareness is typically in the practicing phase at Grade 9. Students are developing better understanding of their own thinking and learning processes. This self-awareness supports continued growth.',
  },
  {
    skill: 'LANGUAGE',
    expectedBand: SkillMaturityBand.CONSISTENT,
    emphasisWeight: 0.05,
    gradeNarrativeStudent: 'Your language skills are becoming more consistent! Keep reading and expressing your ideas.',
    gradeNarrativeParentTeacher: 'Language skills are typically consistent at Grade 9. Students can use reading, writing, and communication skills reliably. This supports all areas of learning.',
  },
  {
    skill: 'CHARACTER_VALUES',
    expectedBand: SkillMaturityBand.CONSISTENT,
    emphasisWeight: 0.10,
    gradeNarrativeStudent: 'You\'re developing a more consistent sense of your values! Keep reflecting on what matters to you.',
    gradeNarrativeParentTeacher: 'Character and values are typically consistent at Grade 9. Students have a clearer understanding of their values and can act on them more reliably. This is part of healthy identity development.',
  },
];

/**
 * Grade 10 Skill Expectations (Application-Oriented Academic Context)
 * 
 * Emphasis: applying skills deliberately and confidently
 */
const GRADE_10_EXPECTATIONS: GradeSkillExpectation[] = [
  {
    skill: 'COGNITIVE_REASONING',
    expectedBand: SkillMaturityBand.INDEPENDENT,
    emphasisWeight: 0.20,
    gradeNarrativeStudent: 'You\'re using reasoning skills independently! You can think through complex problems on your own.',
    gradeNarrativeParentTeacher: 'At Grade 10, reasoning skills are typically independent. Students can use logical thinking confidently without guidance in familiar contexts. This readiness supports academic success and decision-making.',
  },
  {
    skill: 'CREATIVITY',
    expectedBand: SkillMaturityBand.INDEPENDENT,
    emphasisWeight: 0.15,
    gradeNarrativeStudent: 'You\'re using your creativity independently! You can generate ideas and solutions confidently.',
    gradeNarrativeParentTeacher: 'Grade 10 students typically use creative thinking independently. They can generate ideas and solutions confidently without guidance. This readiness supports both academic and personal expression.',
  },
  {
    skill: 'ATTENTION',
    expectedBand: SkillMaturityBand.CONSISTENT,
    emphasisWeight: 0.15,
    gradeNarrativeStudent: 'Your focus is becoming more consistent! You can maintain attention when it matters.',
    gradeNarrativeParentTeacher: 'Attention skills are typically consistent at Grade 10. Students can maintain focus for extended periods reliably when needed. This consistency supports academic engagement and learning.',
  },
  {
    skill: 'PLANNING',
    expectedBand: SkillMaturityBand.CONSISTENT,
    emphasisWeight: 0.15,
    gradeNarrativeStudent: 'You\'re getting better at planning ahead! You can organize your approach to tasks more consistently.',
    gradeNarrativeParentTeacher: 'Planning skills are typically consistent at Grade 10. Students can think ahead and organize their work reliably. This readiness supports academic organization and time management.',
  },
  {
    skill: 'MEMORY',
    expectedBand: SkillMaturityBand.INDEPENDENT,
    emphasisWeight: 0.10,
    gradeNarrativeStudent: 'You\'re using memory strategies independently! You can recall and apply information confidently.',
    gradeNarrativeParentTeacher: 'Memory skills are typically independent at Grade 10. Students can use effective strategies for retention and recall confidently without guidance. This readiness supports academic learning and application.',
  },
  {
    skill: 'SOCIAL_EMOTIONAL',
    expectedBand: SkillMaturityBand.CONSISTENT,
    emphasisWeight: 0.10,
    gradeNarrativeStudent: 'You\'re showing consistent social and emotional skills! You understand yourself and others well.',
    gradeNarrativeParentTeacher: 'Social-emotional skills are typically consistent at Grade 10. Students can recognize and manage emotions, and work collaboratively reliably. This development supports both academic collaboration and personal well-being.',
  },
  {
    skill: 'METACOGNITION',
    expectedBand: SkillMaturityBand.CONSISTENT,
    emphasisWeight: 0.10,
    gradeNarrativeStudent: 'You understand how you learn! This awareness helps you approach new challenges effectively.',
    gradeNarrativeParentTeacher: 'Metacognitive awareness is typically consistent at Grade 10. Students understand their own thinking and learning processes reliably. This self-awareness supports continued growth and academic success.',
  },
  {
    skill: 'LANGUAGE',
    expectedBand: SkillMaturityBand.INDEPENDENT,
    emphasisWeight: 0.05,
    gradeNarrativeStudent: 'You\'re using language skills independently! You can read, write, and communicate confidently.',
    gradeNarrativeParentTeacher: 'Language skills are typically independent at Grade 10. Students can use reading, writing, and communication skills confidently without guidance. This readiness supports all areas of academic learning.',
  },
  {
    skill: 'CHARACTER_VALUES',
    expectedBand: SkillMaturityBand.CONSISTENT,
    emphasisWeight: 0.10,
    gradeNarrativeStudent: 'You have a consistent sense of your values! You can act on what matters to you.',
    gradeNarrativeParentTeacher: 'Character and values are typically consistent at Grade 10. Students have a reliable understanding of their values and can act on them. This is part of healthy identity development and decision-making.',
  },
];

/**
 * Get expected skill maturity band for a grade and skill
 */
export function getExpectedBandForGradeSkill(
  grade: Grade,
  skill: SkillCategory
): SkillMaturityBand | null {
  const expectations = getGradeExpectations(grade);
  const expectation = expectations.find((exp) => exp.skill === skill);
  return expectation?.expectedBand || null;
}

/**
 * Get full grade expectations
 */
export function getGradeExpectations(grade: Grade): GradeSkillExpectation[] {
  switch (grade) {
    case 8:
      return GRADE_8_EXPECTATIONS;
    case 9:
      return GRADE_9_EXPECTATIONS;
    case 10:
      return GRADE_10_EXPECTATIONS;
    default:
      return [];
  }
}

/**
 * Get emphasis weight for a skill at a grade
 */
export function getEmphasisWeightForGradeSkill(
  grade: Grade,
  skill: SkillCategory
): number {
  const expectations = getGradeExpectations(grade);
  const expectation = expectations.find((exp) => exp.skill === skill);
  return expectation?.emphasisWeight || 0;
}

/**
 * Get student narrative for a skill at a grade
 */
export function getStudentNarrativeForGradeSkill(
  grade: Grade,
  skill: SkillCategory
): string | null {
  const expectations = getGradeExpectations(grade);
  const expectation = expectations.find((exp) => exp.skill === skill);
  return expectation?.gradeNarrativeStudent || null;
}

/**
 * Get parent/teacher narrative for a skill at a grade
 */
export function getParentTeacherNarrativeForGradeSkill(
  grade: Grade,
  skill: SkillCategory
): string | null {
  const expectations = getGradeExpectations(grade);
  const expectation = expectations.find((exp) => exp.skill === skill);
  return expectation?.gradeNarrativeParentTeacher || null;
}
