/**
 * Role-Based Report Views
 * 
 * Provides different views of the same underlying attempt data
 * based on user role (student, parent, teacher).
 * 
 * @module lib/report-views
 */

/**
 * Student completion summary (game-like, minimal)
 */
export interface StudentCompletionSummary {
  xpGained: number;
  badges: string[];
  level: number;
  levelTitle: string;
  timeTaken: number; // seconds
  accuracy?: number; // 0-100
}

/**
 * Student quick review (brief insight)
 */
export interface StudentQuickReview {
  strength: string;
  improvementTip: string;
  skillTags: string[]; // 2-3 tags
}

/**
 * Parent full report (comprehensive)
 */
export interface ParentFullReport {
  attemptId: string;
  scoreSummary: any;
  aiInsight: {
    strength: string;
    growth: string;
    evidence: string[];
    skillTags: string[];
  };
  gradeContext?: string;
  recommendations: string[];
}

/**
 * Teacher brief report (actionable)
 */
export interface TeacherBriefReport {
  studentId: string;
  attemptId: string;
  overview: {
    lastActive: string;
    completionStatus: string;
    streak: number;
  };
  topStrengths: string[]; // 3
  strengtheningAreas: string[]; // 3
  trendHighlights: Array<{
    skill: string;
    trend: 'improving' | 'stable' | 'developing';
  }>;
  recommendedActions: string[]; // 2-4
  recentActivity: Array<{
    timestamp: string;
    eventType: string;
    skillTags: string[];
  }>;
}

/**
 * Get student completion summary from attempt data
 */
export function getStudentCompletionSummary(attemptData: any): StudentCompletionSummary {
  // Calculate XP (simplified - can be enhanced)
  const baseXP = 50;
  const accuracy = attemptData.scoreSummary?.accuracy || attemptData.rawScores?.accuracy || 0;
  const accuracyMultiplier = typeof accuracy === 'number' && accuracy <= 1 ? accuracy : accuracy / 100;
  const xpGained = Math.round(baseXP * (0.5 + accuracyMultiplier * 0.5));
  
  // Get badges (if any)
  const badges: string[] = [];
  if (accuracyMultiplier >= 0.9) {
    badges.push('Accuracy Master');
  }
  if (attemptData.timeSpent && attemptData.timeSpent < 300) {
    badges.push('Speed Demon');
  }
  
  // Calculate level (simplified - should use actual student level system)
  const currentTotalXP = attemptData.currentTotalXP || 0;
  const newTotalXP = currentTotalXP + xpGained;
  const level = Math.floor(newTotalXP / 100) + 1;
  const levelTitles = [
    'Seedling', 'Sprout', 'Bud', 'Branch', 'Tree',
    'Oak', 'Redwood', 'Sequoia', 'Ancient', 'Legendary'
  ];
  const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)] || 'Explorer';
  
  return {
    xpGained,
    badges,
    level,
    levelTitle,
    timeTaken: attemptData.timeSpent || 0,
    accuracy: typeof accuracy === 'number' && accuracy <= 1 ? accuracy * 100 : accuracy,
  };
}

/**
 * Get student quick review from attempt data
 */
export function getStudentQuickReview(attemptData: any): StudentQuickReview {
  const aiInsight = attemptData.aiInsight || attemptData.coachingInsight || {};
  
  return {
    strength: aiInsight.strength || aiInsight.strengthObserved || 'You completed the challenge!',
    improvementTip: aiInsight.growth || aiInsight.growthSuggestion || aiInsight.improvementTip || 'Keep practicing to improve',
    skillTags: (aiInsight.skillTags || aiInsight.skillSignals || []).slice(0, 3).map((tag: string) => 
      String(tag).replace(/_/g, ' ')
    ),
  };
}

/**
 * Get parent full report from attempt data
 */
export function getParentFullReport(attemptData: any): ParentFullReport {
  const aiInsight = attemptData.aiInsight || attemptData.coachingInsight || {};
  
  return {
    attemptId: attemptData.attemptId || attemptData.id,
    scoreSummary: attemptData.scoreSummary || {},
    aiInsight: {
      strength: aiInsight.strength || aiInsight.strengthObserved || 'Your child completed the activity',
      growth: aiInsight.growth || aiInsight.growthSuggestion || 'Continued practice will support growth',
      evidence: Array.isArray(aiInsight.evidence) ? aiInsight.evidence : [],
      skillTags: aiInsight.skillTags || aiInsight.skillSignals || [],
    },
    gradeContext: attemptData.gradeContext || undefined,
    recommendations: generateParentRecommendations(attemptData),
  };
}

/**
 * Get teacher brief report from attempt data
 */
export function getTeacherBriefReport(
  studentId: string,
  attemptData: any,
  studentProfile?: any
): TeacherBriefReport {
  const aiInsight = attemptData.aiInsight || attemptData.coachingInsight || {};
  const skillTags = aiInsight.skillTags || aiInsight.skillSignals || [];
  
  return {
    studentId,
    attemptId: attemptData.attemptId || attemptData.id,
    overview: {
      lastActive: attemptData.completedAt || new Date().toISOString(),
      completionStatus: attemptData.status || 'COMPLETED',
      streak: studentProfile?.streak || 0,
    },
    topStrengths: skillTags.slice(0, 3),
    strengtheningAreas: skillTags.slice(3, 6),
    trendHighlights: skillTags.slice(0, 3).map((tag: string) => ({
      skill: String(tag).replace(/_/g, ' '),
      trend: 'improving' as const,
    })),
    recommendedActions: generateTeacherActions(attemptData),
    recentActivity: [{
      timestamp: attemptData.completedAt || new Date().toISOString(),
      eventType: attemptData.questType || attemptData.gameId || 'Activity',
      skillTags: skillTags.slice(0, 3),
    }],
  };
}

/**
 * Generate parent recommendations
 */
function generateParentRecommendations(attemptData: any): string[] {
  const recommendations: string[] = [];
  const aiInsight = attemptData.aiInsight || attemptData.coachingInsight || {};
  
  if (aiInsight.growth || aiInsight.growthSuggestion) {
    recommendations.push('Continue supporting practice in this area');
  }
  
  if (attemptData.scoreSummary?.accuracy && attemptData.scoreSummary.accuracy < 0.7) {
    recommendations.push('Consider breaking down tasks into smaller steps');
  }
  
  recommendations.push('Celebrate progress and effort, not just outcomes');
  
  return recommendations;
}

/**
 * Generate teacher actions
 */
function generateTeacherActions(attemptData: any): string[] {
  const actions: string[] = [];
  const aiInsight = attemptData.aiInsight || attemptData.coachingInsight || {};
  const skillTags = aiInsight.skillTags || aiInsight.skillSignals || [];
  
  if (skillTags.length > 0) {
    actions.push(`Provide opportunities to practice ${skillTags[0]?.replace(/_/g, ' ')}`);
  }
  
  if (aiInsight.growth || aiInsight.growthSuggestion) {
    actions.push('Use scaffolding techniques to support skill development');
  }
  
  actions.push('Monitor progress and adjust instruction as needed');
  
  return actions;
}

/**
 * Get result view based on role
 */
export function getResultViewForRole(params: {
  role: 'student' | 'parent' | 'teacher';
  mode: 'explorer' | 'facilitator' | 'assessment';
  attempt: any;
  studentProfile?: any;
}): StudentCompletionSummary | ParentFullReport | TeacherBriefReport {
  const { role, mode, attempt, studentProfile } = params;
  
  if (role === 'student') {
    return getStudentCompletionSummary(attempt);
  } else if (role === 'parent') {
    return getParentFullReport(attempt);
  } else {
    return getTeacherBriefReport(
      studentProfile?.id || attempt.studentId,
      attempt,
      studentProfile
    );
  }
}

/**
 * Build completion summary for GameCompletionScreen
 */
export function buildCompletionSummary(attemptData: any): {
  xpGained: number;
  badges: string[];
  currentTotalXP: number;
  timeSpent?: number;
  accuracy?: number;
} {
  const summary = getStudentCompletionSummary(attemptData);
  
  return {
    xpGained: summary.xpGained,
    badges: summary.badges,
    currentTotalXP: (attemptData.currentTotalXP || 0) + summary.xpGained,
    timeSpent: summary.timeTaken,
    accuracy: summary.accuracy,
  };
}

/**
 * Build quick review from attempt data
 * Returns 2 lines + skill chips
 */
export function buildQuickReview(attemptData: any): {
  strength: string;
  improvementTip: string;
  skillTags: string[];
} {
  return getStudentQuickReview(attemptData);
}

/**
 * Render role-based results component
 * Chooses GameCompletionScreen vs adult report components based on role
 */
export function renderRoleBasedResults(params: {
  role: 'student' | 'parent' | 'teacher';
  mode: 'explorer' | 'facilitator' | 'assessment';
  attempt: any;
  studentProfile?: any;
}): 'GameCompletionScreen' | 'ParentReport' | 'TeacherReport' {
  const { role } = params;
  
  if (role === 'student') {
    return 'GameCompletionScreen';
  } else if (role === 'parent') {
    return 'ParentReport';
  } else {
    return 'TeacherReport';
  }
}
