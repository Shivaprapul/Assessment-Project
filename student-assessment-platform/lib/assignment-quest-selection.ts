/**
 * Assignment Quest Selection
 * 
 * Selects quests for teacher assignments with Class Focus integration.
 * 
 * @module lib/assignment-quest-selection
 */

import { db } from '@/lib/db';
import { SkillCategory } from '@prisma/client';
import { getEmphasisWeightForGradeSkill } from './grade-skill-expectations';
import { 
  getActiveClassFocus, 
  applyClassFocusBoost, 
  calculatePriorityBreakdown,
  debugClassFocusPrioritization,
  PriorityBreakdown 
} from './class-focus-prioritization';
import { selectGradeAwareContent, GradeApplicability } from './grade-aware-content';
import { generateDailyQuests } from './explorer-quests';

export interface QuestSelectionOptions {
  tenantId: string;
  teacherId: string;
  studentId: string;
  studentGrade: number;
  questCount: number;
  questTypes: string[];
  gradeScope?: number;
  intent?: string;
  skillScoreMap?: Record<string, number>;
}

export interface SelectedQuest {
  id: string;
  title: string;
  type: string;
  priority: number;
  breakdown?: PriorityBreakdown;
}

/**
 * Select quests for a teacher assignment with Class Focus integration
 */
export async function selectQuestsForAssignment(
  options: QuestSelectionOptions
): Promise<SelectedQuest[]> {
  const {
    tenantId,
    teacherId,
    studentId,
    studentGrade,
    questCount,
    questTypes,
    gradeScope,
    skillScoreMap = {},
  } = options;

  // Get student's current skill scores if not provided
  let studentSkillScores = skillScoreMap;
  if (Object.keys(studentSkillScores).length === 0) {
    const skillScores = await db.skillScore.findMany({
      where: {
        studentId,
        tenantId,
      },
    });
    studentSkillScores = {};
    skillScores.forEach((ss) => {
      studentSkillScores[ss.category] = ss.score;
    });
  }

  // Get active Class Focus profile for this teacher and grade
  const classFocus = await getActiveClassFocus(
    tenantId,
    teacherId,
    gradeScope || studentGrade
  );
  const classFocusBoosts = classFocus?.priorityBoosts || {};

  // Generate quest pool (grade-aware)
  const questPool = generateDailyQuests(
    studentId,
    new Date(),
    20, // Generate more than needed for selection
    gradeScope || studentGrade
  );

  // Filter by quest types if specified
  let filteredQuests = questPool;
  if (questTypes && questTypes.length > 0) {
    filteredQuests = questPool.filter((q) => questTypes.includes(q.type));
  }

  // Filter by grade applicability (always applied first - guardrail)
  const gradeToUse = gradeScope || studentGrade;
  filteredQuests = filteredQuests.filter((q) => {
    const gradeApplicability = q.gradeApplicability || [8, 9, 10];
    return gradeApplicability.includes(gradeToUse) || 
           (gradeApplicability.length === 3 && 
            gradeApplicability.includes(8) && 
            gradeApplicability.includes(9) && 
            gradeApplicability.includes(10));
  });

  // Calculate priority for each quest with Class Focus integration
  const prioritizedQuests = filteredQuests.map((quest) => {
    let basePriority = 0;
    let primarySkill: SkillCategory | string | null = null;

    // Base priority: grade emphasis + student skill scores
    if (quest.primarySkills && quest.primarySkills.length > 0) {
      for (const skill of quest.primarySkills) {
        primarySkill = skill;
        const emphasisWeight = getEmphasisWeightForGradeSkill(
          gradeToUse as any,
          skill as any
        );
        const studentScore = studentSkillScores[skill] || 50;
        // Higher emphasis + lower score = higher priority
        basePriority += emphasisWeight * (100 - studentScore);
      }
    }

    // Apply Class Focus boost (additive, capped at +20% per skill)
    // Formula: FinalPriority = BasePriority * (1 + ClassFocusBoost)
    // Guardrails: Boost capped at 0.20, never overrides grade filtering
    let finalPriority = basePriority;
    let breakdown: PriorityBreakdown | undefined;
    
    if (primarySkill && Object.keys(classFocusBoosts).length > 0) {
      finalPriority = applyClassFocusBoost(
        basePriority,
        primarySkill,
        classFocusBoosts
      );
      
      // Calculate breakdown for debugging (always calculate, only log if flag set)
      breakdown = calculatePriorityBreakdown(
        basePriority,
        primarySkill,
        classFocusBoosts
      );
    }

    return {
      id: quest.id,
      title: quest.title,
      type: quest.type,
      priority: finalPriority,
      breakdown,
    };
  });

  // Sort by final priority (highest first)
  prioritizedQuests.sort((a, b) => b.priority - a.priority);

  // Select top N quests
  const selected = prioritizedQuests.slice(0, questCount);

  // Debug logging if enabled
  if (process.env.DEBUG_CLASS_FOCUS === 'true') {
    debugClassFocusPrioritization(selected);
  }

  return selected;
}

