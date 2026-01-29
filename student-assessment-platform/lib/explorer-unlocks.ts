/**
 * Explorer Mode Career Unlock Logic
 * 
 * Determines which careers to unlock based on quest performance and skill signals.
 * 
 * @module lib/explorer-unlocks
 */

import { getCareersBySkillSignals, CareerData } from './career-catalog';

export interface UnlockCandidate {
  career: CareerData;
  reason: string;
  evidence: string[];
  confidence: number; // 0-100
}

/**
 * Evaluate which careers should be unlocked based on quest attempt
 */
export function evaluateCareerUnlocks(
  questSkillSignals: string[],
  questPerformance: {
    accuracy?: number;
    timeSpent?: number;
    responseQuality?: number;
  },
  alreadyUnlocked: string[]
): UnlockCandidate[] {
  const candidates: UnlockCandidate[] = [];

  // Get careers that match the skill signals
  const matchingCareers = getCareersBySkillSignals(questSkillSignals);

  for (const career of matchingCareers) {
    // Skip if already unlocked
    if (alreadyUnlocked.includes(career.id)) {
      continue;
    }

    // Calculate confidence based on performance
    let confidence = 50; // Base confidence

    // Boost confidence based on performance
    if (questPerformance.accuracy !== undefined) {
      if (questPerformance.accuracy >= 80) {
        confidence += 20;
      } else if (questPerformance.accuracy >= 60) {
        confidence += 10;
      }
    }

    if (questPerformance.responseQuality !== undefined && questPerformance.responseQuality > 100) {
      confidence += 15;
    }

    // Rarity affects unlock probability
    const rarityBonus: Record<string, number> = {
      COMMON: 0,
      EMERGING: -10,
      ADVANCED: -20,
      FRONTIER: -30,
    };
    confidence += rarityBonus[career.rarityTier] || 0;

    // Only suggest if confidence is above threshold
    if (confidence >= 40) {
      const reason = `Your performance in ${questSkillSignals.join(' and ').toLowerCase()} suggests this career might interest you`;
      const evidence: string[] = [];

      if (questPerformance.accuracy !== undefined) {
        evidence.push(`Strong performance (${questPerformance.accuracy}% accuracy)`);
      }
      if (questSkillSignals.length > 0) {
        evidence.push(`Demonstrated ${questSkillSignals.join(', ').toLowerCase()} skills`);
      }

      candidates.push({
        career,
        reason,
        evidence,
        confidence: Math.min(100, confidence),
      });
    }
  }

  // Sort by confidence and return top 2
  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2);
}

