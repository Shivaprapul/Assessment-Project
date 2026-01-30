/**
 * Parent Talent Signal Generation
 * 
 * Shared utilities for generating talent signals from student data.
 * 
 * @module lib/parent-talent-signals
 */

import { TalentSignal } from './parent-evidence-gating';
import { generateEvidenceSummary } from './parent-evidence-gating';

/**
 * Generate talent signals from student data (MVP: simplified logic)
 * In production, this would use ML models and more sophisticated analysis
 */
export function generateTalentSignals(
  studentId: string,
  tenantId: string,
  assessmentCount: number,
  questCount: number,
  activityCount: number,
  skillScores: Array<{ category: string }>
): TalentSignal[] {
  const signals: TalentSignal[] = [];

  // Pattern Recognition signal (based on cognitive reasoning)
  const cognitiveReasoning = skillScores.find(s => s.category === 'COGNITIVE_REASONING');
  if (cognitiveReasoning) {
    signals.push({
      id: 'pattern-recognition',
      name: 'Pattern Recognition',
      confidence: 'EMERGING', // Will be recalculated
      explanation: 'Shows ability to identify patterns and sequences',
      evidenceSummary: generateEvidenceSummary(assessmentCount + questCount, 2),
      minObs: 5,
      minContexts: 2,
      stability: 0.6,
      observedCount: assessmentCount + questCount,
      contextsCount: 2,
      stabilityScore: 0.7,
      supportActions: [
        'Encourage puzzle games and pattern-based activities',
        'Notice when they naturally spot patterns in daily life',
      ],
    });
  }

  // Creative Problem-Solving signal
  const creativity = skillScores.find(s => s.category === 'CREATIVITY');
  if (creativity) {
    signals.push({
      id: 'creative-problem-solving',
      name: 'Creative Problem-Solving',
      confidence: 'EMERGING',
      explanation: 'Demonstrates creative approaches to challenges',
      evidenceSummary: generateEvidenceSummary(questCount + activityCount, 3),
      minObs: 5,
      minContexts: 2,
      stability: 0.6,
      observedCount: questCount + activityCount,
      contextsCount: 3,
      stabilityScore: 0.65,
      supportActions: [
        'Provide open-ended challenges that allow multiple solutions',
        'Celebrate creative approaches, not just correct answers',
      ],
    });
  }

  // Planning & Organization signal
  const planning = skillScores.find(s => s.category === 'PLANNING');
  if (planning) {
    signals.push({
      id: 'planning-organization',
      name: 'Planning & Organization',
      confidence: 'EMERGING',
      explanation: 'Shows ability to organize thoughts and plan ahead',
      evidenceSummary: generateEvidenceSummary(activityCount, 2),
      minObs: 5,
      minContexts: 2,
      stability: 0.6,
      observedCount: activityCount,
      contextsCount: 2,
      stabilityScore: 0.6,
      supportActions: [
        'Help break down larger tasks into smaller steps',
        'Model planning by talking through your own process',
      ],
    });
  }

  return signals;
}

/**
 * Generate gentle observations (descriptive only, no advice)
 */
export function generateGentleObservations(signals: TalentSignal[]): string[] {
  const observations: string[] = [];

  if (signals.some(s => s.id === 'pattern-recognition')) {
    observations.push(
      'We\'re noticing a preference for visual-spatial tasks over text-heavy activities'
    );
  }

  if (signals.some(s => s.id === 'creative-problem-solving')) {
    observations.push(
      'Across several activities, there\'s a pattern of persistence when the challenge feels personally meaningful'
    );
  }

  if (signals.some(s => s.id === 'planning-organization')) {
    observations.push(
      'We\'re seeing early signs of planning behavior, especially when given clear goals'
    );
  }

  return observations.slice(0, 4); // Max 4 observations
}

/**
 * Generate progress narrative
 */
export function generateProgressNarrative(
  signals: TalentSignal[],
  totalActivities: number
): { then: string; now: string; next: string } {
  const strongSignals = signals.filter(s => s.confidence === 'STRONG' || s.confidence === 'MODERATE');
  
  return {
    then: 'Early activities showed curiosity and willingness to try new things',
    now: `Current patterns indicate growing confidence in ${strongSignals.map(s => s.name.toLowerCase()).join(' and ')}`,
    next: 'The system is focusing on building consistency in planning and metacognitive reflection',
  };
}

/**
 * Generate support actions
 */
export function generateSupportActions(signals: TalentSignal[]): Array<{
  action: string;
  mappedToSignal: string;
  lowEffort: boolean;
}> {
  const actions: Array<{ action: string; mappedToSignal: string; lowEffort: boolean }> = [];

  signals.slice(0, 5).forEach(signal => {
    if (signal.supportActions.length > 0) {
      actions.push({
        action: signal.supportActions[0],
        mappedToSignal: signal.id,
        lowEffort: true,
      });
    }
  });

  return actions.slice(0, 5); // Max 5 actions
}

/**
 * Calculate streak (consecutive days with at least one activity)
 */
export function calculateStreak(completedDates: Date[]): number {
  if (completedDates.length === 0) return 0;

  // Sort dates descending
  const sortedDates = completedDates
    .map(d => new Date(d).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i) // Unique dates
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (sortedDates.length === 0) return 0;

  // Check if today or yesterday has activity
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (sortedDates[0] !== today && sortedDates[0] !== yesterdayStr) {
    return 0; // No recent activity
  }

  // Count consecutive days
  let streak = 1;
  let currentDate = new Date(sortedDates[0]);
  
  for (let i = 1; i < sortedDates.length; i++) {
    const nextDate = new Date(sortedDates[i]);
    const diffDays = Math.floor(
      (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (diffDays === 1) {
      streak++;
      currentDate = nextDate;
    } else {
      break;
    }
  }

  return streak;
}

