/**
 * Parent Evidence Gating
 * 
 * Implements evidence-based gating rules for parent portal insights.
 * Ensures insights are only shown when sufficient evidence exists.
 * 
 * @module lib/parent-evidence-gating
 */

export type ConfidenceBand = 'EMERGING' | 'MODERATE' | 'STRONG';

export interface TalentSignal {
  id: string;
  name: string;
  confidence: ConfidenceBand;
  explanation: string;
  evidenceSummary: string; // "observed across X activities"
  minObs: number; // Minimum observations required
  minContexts: number; // Minimum contexts/activity types required
  stability: number; // Stability threshold (0-1)
  observedCount: number; // Actual observations
  contextsCount: number; // Actual contexts
  stabilityScore: number; // Actual stability
  supportActions: string[]; // Parent-safe support actions
}

export interface EvidenceGateResult {
  globalGateMet: boolean;
  diversityGateMet: boolean;
  totalCompletedActivities: number;
  activityTypes: number;
  skillBranches: number;
  unlockedSignals: TalentSignal[];
  lockedSignals: TalentSignal[];
}

/**
 * Check if global gate is met
 * Global gate: totalCompletedActivities >= 10
 */
export function checkGlobalGate(totalCompletedActivities: number): boolean {
  return totalCompletedActivities >= 10;
}

/**
 * Check if diversity gate is met
 * Diversity gate: >= 3 activity types OR >= 4 skill branches
 */
export function checkDiversityGate(activityTypes: number, skillBranches: number): boolean {
  return activityTypes >= 3 || skillBranches >= 4;
}

/**
 * Check if a talent signal meets its thresholds
 */
export function signalMeetsThresholds(signal: TalentSignal): boolean {
  return (
    signal.observedCount >= signal.minObs &&
    signal.contextsCount >= signal.minContexts &&
    signal.stabilityScore >= signal.stability
  );
}

/**
 * Determine confidence band for a signal
 * - EMERGING: minObs met, but not all thresholds
 * - MODERATE: all thresholds met, but < 20 total activities
 * - STRONG: all thresholds met AND >= 20 total activities
 */
export function calculateConfidenceBand(
  signal: TalentSignal,
  totalCompletedActivities: number
): ConfidenceBand {
  if (!signalMeetsThresholds(signal)) {
    return 'EMERGING';
  }
  
  if (totalCompletedActivities >= 20) {
    return 'STRONG';
  }
  
  return 'MODERATE';
}

/**
 * Filter and gate talent signals
 * Rules:
 * - Max 5 signals shown at a time
 * - Only show signals that meet thresholds
 * - Sort by confidence (STRONG > MODERATE > EMERGING)
 * - Strengths-first framing
 */
export function gateTalentSignals(
  signals: TalentSignal[],
  totalCompletedActivities: number
): {
  unlocked: TalentSignal[];
  locked: TalentSignal[];
} {
  // Calculate confidence for each signal
  const signalsWithConfidence = signals.map(signal => ({
    ...signal,
    confidence: calculateConfidenceBand(signal, totalCompletedActivities),
  }));

  // Filter: only show signals that meet thresholds
  const unlocked = signalsWithConfidence
    .filter(signal => signalMeetsThresholds(signal))
    .sort((a, b) => {
      // Sort by confidence: STRONG > MODERATE > EMERGING
      const confidenceOrder = { STRONG: 3, MODERATE: 2, EMERGING: 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    })
    .slice(0, 5); // Max 5 signals

  const locked = signalsWithConfidence.filter(signal => !signalMeetsThresholds(signal));

  return { unlocked, locked };
}

/**
 * Check if Gentle Observations should be unlocked
 * Unlock conditions:
 * - Global gate satisfied
 * - At least 1 Talent Signal at Moderate confidence or higher
 */
export function canShowGentleObservations(
  globalGateMet: boolean,
  unlockedSignals: TalentSignal[]
): boolean {
  if (!globalGateMet) return false;
  
  const moderateOrStrong = unlockedSignals.filter(
    s => s.confidence === 'MODERATE' || s.confidence === 'STRONG'
  );
  
  return moderateOrStrong.length >= 1;
}

/**
 * Check if Progress Narrative should be unlocked
 * Unlock conditions:
 * - Global gate satisfied
 * - At least 3 Talent Signals at Moderate confidence or higher
 */
export function canShowProgressNarrative(
  globalGateMet: boolean,
  unlockedSignals: TalentSignal[]
): boolean {
  if (!globalGateMet) return false;
  
  const moderateOrStrong = unlockedSignals.filter(
    s => s.confidence === 'MODERATE' || s.confidence === 'STRONG'
  );
  
  return moderateOrStrong.length >= 3;
}

/**
 * Generate evidence summary text
 */
export function generateEvidenceSummary(
  observedCount: number,
  contextsCount: number
): string {
  if (contextsCount >= 3) {
    return `observed across ${observedCount} activities in ${contextsCount} different contexts`;
  }
  return `observed across ${observedCount} activities`;
}

