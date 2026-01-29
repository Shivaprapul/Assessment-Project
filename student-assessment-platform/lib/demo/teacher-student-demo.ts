/**
 * Teacher Student Drilldown Demo Data
 * 
 * Generates realistic dummy data for teacher student drilldown view.
 * 
 * @module lib/demo/teacher-student-demo
 */

import { generateDemoStudents } from './teacher-demo-data';

const SKILL_NAMES = [
  'Cognitive Reasoning',
  'Creativity',
  'Language',
  'Memory',
  'Attention',
  'Planning',
  'Social & Emotional',
  'Metacognition',
  'Character & Values',
];

const QUEST_TYPES = ['mini_game', 'reflection', 'choice_scenario'];

/**
 * Generate demo student drilldown data
 */
export function generateDemoStudentDrilldown(studentId: string, grade: number = 9) {
  // Extract student index from ID (e.g., "demo-student-5" -> 4)
  const studentIndex = studentId.startsWith('demo-student-')
    ? parseInt(studentId.replace('demo-student-', '')) - 1
    : 0;
  
  const demoStudents = generateDemoStudents(grade, 24);
  const student = demoStudents[studentIndex] || demoStudents[0];
  
  // Generate "This Week in Brief" insights
  const strengths = SKILL_NAMES.sort(() => Math.random() - 0.5).slice(0, 3);
  const strengtheningAreas = SKILL_NAMES.sort(() => Math.random() - 0.5).slice(0, 2);
  
  const thisWeekInsights = {
    strength: {
      skill: strengths[0].toLowerCase(),
      message: `Shows consistent strength in ${strengths[0].toLowerCase()}`,
    },
    strengthening: {
      skill: strengtheningAreas[0].toLowerCase(),
      message: `${strengtheningAreas[0]} is becoming more consistent with practice`,
    },
    engagement: student.weeklyCompletedCount > 3
      ? 'Maintaining steady engagement this week'
      : student.weeklyCompletedCount > 0
      ? 'Engagement is building'
      : 'Could benefit from a gentle nudge to re-engage',
  };
  
  // Generate skill highlights with trends
  // Ensure exactly 3 top strengths
  const topStrengths = strengths.slice(0, 3).map((skill, idx) => ({
    skill: skill.toLowerCase(),
    score: 75 + Math.floor(Math.random() * 20), // 75-95
    level: idx === 0 ? 'proficient' : 'developing',
    trend7d: idx === 0 ? 'improving' : 'stable',
    trend30d: 'improving',
  }));
  
  // Ensure exactly 2 strengthening areas (areas that need work - lower scores)
  const topStrengthening = strengtheningAreas.slice(0, 2).map((skill) => ({
    skill: skill.toLowerCase(),
    score: 35 + Math.floor(Math.random() * 25), // 35-60 (lower scores = needs work)
    trend7d: 'needs_attention',
    trend30d: 'stable',
  }));
  
  // Generate recent activity (5 attempts)
  const activityCount = 5;
  const recentActivity = Array.from({ length: activityCount }, (_, idx) => {
    const daysAgo = idx;
    const completedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const questType = QUEST_TYPES[Math.floor(Math.random() * QUEST_TYPES.length)];
    const skillTags = SKILL_NAMES.sort(() => Math.random() - 0.5).slice(0, 2);
    const xpEarned = 50 + Math.floor(Math.random() * 100);
    const timeTaken = 120 + Math.floor(Math.random() * 300); // 2-7 minutes
    
    return {
      id: `demo-activity-${studentIndex}-${idx}`,
      title: `${questType.replace(/_/g, ' ')} quest`,
      type: questType,
      completedAt: completedAt.toISOString(),
      completedAtFormatted: completedAt.toLocaleDateString(),
      status: 'COMPLETED',
      xpEarned,
      timeTaken,
      skillTags: skillTags.map(s => s.toLowerCase().replace(/\s+/g, ' ')),
    };
  });
  
  // Generate recommended actions
  const recommendedActions = [
    `Use 2-minute planning prompt before tasks to support ${topStrengthening[0].skill}`,
    `Pair with structured teammate for collaborative activities`,
    `Give timed focus sprints (5-10 min) to build attention`,
    `Leverage strength in ${topStrengths[0].skill} in group activities`,
  ].slice(0, 3 + Math.floor(Math.random() * 2)); // 3-4 actions
  
  // Calculate streak (consecutive days with activity)
  const streak = student.weeklyCompletedCount > 0 ? Math.min(student.weeklyCompletedCount, 7) : 0;
  
  return {
    id: student.id,
    name: student.name,
    initials: student.initials,
    currentGrade: grade,
    section: student.section || 'A',
    lastActive: student.lastActive,
    lastActiveTimestamp: student.lastActiveAt,
    weeklyActivity: {
      questsCompleted: student.weeklyCompletedCount,
      streak,
      avgAccuracy: Math.min(100, 70 + Math.floor(Math.random() * 25)), // 70-95%, capped at 100
    },
    status: student.status,
    thisWeekInsights,
    skillHighlights: {
      topStrengths,
      topStrengthening,
    },
    recentActivity,
    recommendedActions,
    teacherNotes: [], // Empty by default, can be added via API
  };
}

