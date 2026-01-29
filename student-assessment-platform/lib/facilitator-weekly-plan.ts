/**
 * Facilitator Weekly Plan Generator
 * 
 * Generates a 7-day personalized training plan based on goal and current skill levels.
 * 
 * @module lib/facilitator-weekly-plan
 */

import { getGoalSkillMap } from './goal-skill-map';
import { generateDailyQuests } from './explorer-quests';
import { selectGradeAwareContent } from './grade-aware-content';
import { getEmphasisWeightForGradeSkill } from './grade-skill-expectations';
import type { Grade } from './grade-utils';
import { SkillCategory } from '@prisma/client';

export interface DailyPlanItem {
  dayIndex: number;
  date: string; // YYYY-MM-DD
  quests: Array<{
    id: string;
    type: 'mini_game' | 'reflection' | 'choice_scenario';
    title: string;
    description: string;
    estimatedTime: number;
    skillFocus: string[]; // Skill categories this quest targets
  }>;
  goalReadinessDelta?: number; // Expected improvement
}

export interface WeeklyPlan {
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string; // YYYY-MM-DD
  focusSkills: string[]; // Top 3 skills for the week
  dailyTimeBudget: number; // minutes per day
  dailyPlan: DailyPlanItem[];
  goalReadinessDelta?: number; // Expected improvement for the week
}

/**
 * Generate weekly plan for a student (grade-aware)
 */
export function generateWeeklyPlan(
  studentId: string,
  goalTitle: string,
  timeAvailability: number,
  currentSkillScores: Record<string, number>, // Skill category -> score (0-100)
  weekStartDate: Date,
  studentGrade?: number // 8, 9, or 10
): WeeklyPlan {
  const skillMap = getGoalSkillMap(goalTitle);
  if (!skillMap) {
    throw new Error(`No skill map found for goal: ${goalTitle}`);
  }

  // Calculate focus skills: high goal weight + low current score + grade emphasis
  const grade = (studentGrade || 8) as Grade;
  const skillPriorities = Object.entries(skillMap.skillWeights)
    .map(([skill, weight]) => {
      const gradeEmphasis = getEmphasisWeightForGradeSkill(grade, skill as any);
      const currentScore = currentSkillScores[skill] || 50; // Default to 50 if unknown
      // Priority = goal weight * grade emphasis * (100 - current score)
      // This prioritizes skills that are important for both goal AND grade, and where student is weaker
      const priority = weight * (1 + gradeEmphasis) * (100 - currentScore);
      return {
        skill,
        weight,
        gradeEmphasis,
        currentScore,
        priority,
      };
    })
    .sort((a, b) => b.priority - a.priority);

  const focusSkills = skillPriorities.slice(0, 3).map(s => s.skill);

  // Generate 7 daily plans
  const dailyPlan: DailyPlanItem[] = [];
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(currentDate.getDate() + dayIndex);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Generate quests for this day based on quest mix and focus skills (grade-aware)
    const quests = generateDailyFacilitatorQuests(
      studentId,
      currentDate,
      skillMap,
      focusSkills,
      timeAvailability,
      studentGrade
    );

    dailyPlan.push({
      dayIndex,
      date: dateStr,
      quests,
    });
  }

  // Estimate goal readiness delta (rough calculation)
  const avgPriority = skillPriorities.slice(0, 3).reduce((sum, s) => sum + s.priority, 0) / 3;
  const goalReadinessDelta = Math.min(5, avgPriority / 20); // Cap at 5 points per week

  return {
    weekStartDate: weekStartDate.toISOString().split('T')[0],
    weekEndDate: weekEndDate.toISOString().split('T')[0],
    focusSkills,
    dailyTimeBudget: timeAvailability,
    dailyPlan,
    goalReadinessDelta,
  };
}

/**
 * Generate daily quests for facilitator mode (grade-aware)
 */
function generateDailyFacilitatorQuests(
  studentId: string,
  date: Date,
  skillMap: any,
  focusSkills: string[],
  timeBudget: number,
  studentGrade?: number // 8, 9, or 10
): DailyPlanItem['quests'] {
  const quests: DailyPlanItem['quests'] = [];
  const questCount = Math.floor(timeBudget / 5); // ~5 min per quest, default to 4 if time allows

  // Determine quest types based on grade-specific quest mix
  // Grade 8: mini_game 40%, scenario 30%, reflection 30%
  // Grade 9: mini_game 50%, scenario 25%, reflection 25%
  // Grade 10: mini_game 60%, scenario 25%, reflection 15%
  const questMix = studentGrade === 8 
    ? { mini_game: 0.40, choice_scenario: 0.30, reflection: 0.30 }
    : studentGrade === 9
    ? { mini_game: 0.50, choice_scenario: 0.25, reflection: 0.25 }
    : { mini_game: 0.60, choice_scenario: 0.25, reflection: 0.15 };
  
  const questTypes: Array<'mini_game' | 'reflection' | 'choice_scenario'> = [];
  const miniGameCount = Math.round(questMix.mini_game * questCount);
  const scenarioCount = Math.round(questMix.choice_scenario * questCount);
  const reflectionCount = questCount - miniGameCount - scenarioCount; // Remainder goes to reflection

  for (let i = 0; i < miniGameCount; i++) questTypes.push('mini_game');
  for (let i = 0; i < reflectionCount; i++) questTypes.push('reflection');
  for (let i = 0; i < scenarioCount; i++) questTypes.push('choice_scenario');

  // Shuffle to mix quest types
  for (let i = questTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questTypes[i], questTypes[j]] = [questTypes[j], questTypes[i]];
  }

  // Generate quest templates (will be filtered and prioritized by grade)
  // Note: These match the Quest interface from explorer-quests.ts which extends GradeApplicability
  const questTemplates: Array<{
    id: string;
    type: 'mini_game' | 'reflection' | 'choice_scenario';
    title: string;
    description: string;
    estimatedTime: number;
    skillFocus: string[];
    gradeApplicability: number[]; // Required for GradeApplicability
    primarySkills: string[]; // Required for GradeApplicability
    secondarySkills?: string[];
    difficultyByGrade?: Record<number, 'easy' | 'medium' | 'hard'>;
    constraints?: string[]; // Grade-specific constraints (stored in metadata, not returned in DailyPlanItem)
    content?: any; // Quest content (gameId, prompt, scenario, choices)
  }> = [];
  
  questTypes.forEach((type, idx) => {
    const skillFocus = [focusSkills[idx % focusSkills.length]];
    
    let title = '';
    let description = '';
    let estimatedTime = 5;
    let constraints: string[] = []; // Grade-specific constraints

    // Adjust difficulty, time, and constraints based on grade
    if (studentGrade === 8) {
      // Grade 8: minimal timers, simpler multi-step tasks
      estimatedTime = type === 'mini_game' ? 5 : type === 'reflection' ? 3 : 4;
      constraints = ['no_timer', 'simple_steps']; // Minimal timers, simpler tasks
    } else if (studentGrade === 9) {
      // Grade 9: occasional timers, moderate multi-step reasoning, stronger planning prompts
      estimatedTime = type === 'mini_game' ? 6 : type === 'reflection' ? 4 : 5;
      constraints = ['occasional_timer', 'moderate_steps', 'planning_prompts'];
    } else {
      // Grade 10: more frequent timers, mixed-skill sets, endurance sets
      estimatedTime = type === 'mini_game' ? 7 : type === 'reflection' ? 4 : 6;
      constraints = ['frequent_timer', 'mixed_skills', 'endurance_sets'];
    }

    // Prepare content based on quest type
    let questContent: any = {};
    
    switch (type) {
      case 'mini_game':
        title = `Skill Builder: ${skillFocus[0].replace(/_/g, ' ')}`;
        description = `Practice ${skillFocus[0].replace(/_/g, ' ')} through a quick challenge`;
        questContent = {
          gameId: 'pattern_forge', // Default game for facilitator mini_game quests
          questionCount: studentGrade === 8 ? 6 : studentGrade === 9 ? 7 : 8,
        };
        break;
      case 'reflection':
        title = `Reflect: ${skillFocus[0].replace(/_/g, ' ')}`;
        description = `Think about how you've been developing ${skillFocus[0].replace(/_/g, ' ')}`;
        // Grade-specific reflection prompts
        const reflectionPrompts = {
          8: `What did you learn today about ${skillFocus[0].replace(/_/g, ' ')}? How might you use this in the future?`,
          9: `Reflect on a challenge you faced today related to ${skillFocus[0].replace(/_/g, ' ')}. What strategies did you use?`,
          10: `Think about your learning process today with ${skillFocus[0].replace(/_/g, ' ')}. How did you approach it, and what patterns did you notice?`,
        };
        questContent = {
          prompt: reflectionPrompts[studentGrade as keyof typeof reflectionPrompts] || reflectionPrompts[8],
        };
        break;
      case 'choice_scenario':
        title = `Scenario: ${skillFocus[0].replace(/_/g, ' ')}`;
        description = `Explore a situation that tests your ${skillFocus[0].replace(/_/g, ' ')}`;
        // Grade-specific scenarios
        const scenarios = {
          8: {
            scenario: `You're working on a group project and notice a teammate struggling with ${skillFocus[0].replace(/_/g, ' ')}. What do you do?`,
            choices: [
              'Offer to help them understand the concept',
              'Focus on your own work and let them figure it out',
              'Suggest they ask the teacher for help',
              'Work together to find a solution that helps everyone',
            ],
          },
          9: {
            scenario: `You notice a classmate being excluded from a group activity related to ${skillFocus[0].replace(/_/g, ' ')}. How do you respond?`,
            choices: [
              'Invite them to join your group',
              'Talk to a teacher about the situation',
              'Observe and see if the situation resolves itself',
              'Address the group directly about inclusion',
            ],
          },
          10: {
            scenario: `You discover that a friend has been copying your work related to ${skillFocus[0].replace(/_/g, ' ')}. How do you handle this?`,
            choices: [
              'Confront them directly about academic integrity',
              'Offer to help them understand the material instead',
              'Report it to the teacher',
              'Have a private conversation about the importance of learning',
            ],
          },
        };
        const scenario = scenarios[studentGrade as keyof typeof scenarios] || scenarios[8];
        questContent = {
          scenario: scenario.scenario,
          choices: scenario.choices,
        };
        break;
    }

    questTemplates.push({
      id: `facilitator-quest-${studentId}-${date.toISOString().split('T')[0]}-${idx}`,
      type,
      title,
      description,
      estimatedTime,
      skillFocus,
      gradeApplicability: [8, 9, 10], // Universal by default
      primarySkills: skillFocus as SkillCategory[], // Cast to SkillCategory[] for type compatibility
      secondarySkills: [],
      constraints, // Grade-specific constraints stored in quest metadata
      content: questContent, // Add content structure for each quest type
    });
  });

  // Filter and prioritize by grade (if grade is provided)
  if (studentGrade) {
    // Filter by grade applicability
    let filtered = questTemplates.filter(q => 
      q.gradeApplicability.includes(studentGrade) || 
      (q.gradeApplicability.length === 3 && q.gradeApplicability.includes(8) && q.gradeApplicability.includes(9) && q.gradeApplicability.includes(10))
    );
    
    // Prioritize by grade emphasis (simplified - just use the quests as-is since they're already prioritized by focus skills)
    // Take the requested count
    filtered = filtered.slice(0, questCount);
    
    return filtered.map(q => ({
      id: q.id,
      type: q.type,
      title: q.title,
      description: q.description,
      estimatedTime: q.estimatedTime,
      skillFocus: q.skillFocus,
    }));
  }

  return questTemplates.map(q => ({
    id: q.id,
    type: q.type,
    title: q.title,
    description: q.description,
    estimatedTime: q.estimatedTime,
    skillFocus: q.skillFocus,
  }));
}

/**
 * Get current week start date (Monday, Asia/Kolkata)
 */
export function getCurrentWeekStart(): Date {
  const now = new Date();
  // Convert to Asia/Kolkata timezone (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  
  // Get Monday of current week
  const day = istDate.getUTCDay();
  const diff = istDate.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(istDate.setUTCDate(diff));
  monday.setUTCHours(0, 0, 0, 0);
  
  // Convert back to UTC
  return new Date(monday.getTime() - istOffset);
}

