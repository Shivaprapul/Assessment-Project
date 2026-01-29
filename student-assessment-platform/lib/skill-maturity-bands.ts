/**
 * Global Skill Maturity Bands
 * 
 * These bands describe how a skill is currently expressed, independent of academic grade.
 * Skill maturity is individual, evidence-based, and non-linear.
 * 
 * IMPORTANT: These bands are NOT tied to grade levels. A Grade 10 student
 * might be at "Practicing" for a skill, and a Grade 8 student might be at "Independent".
 * 
 * @module lib/skill-maturity-bands
 */

/**
 * Global Skill Maturity Bands
 * 
 * These describe the current expression of a skill, not how "good" a student is.
 * Bands are fluid and can move forward or backward based on evidence.
 */
export enum SkillMaturityBand {
  DISCOVERING = 'DISCOVERING',   // First encounters, experimenting, learning what the skill feels like
  PRACTICING = 'PRACTICING',      // Using the skill with effort and some support
  CONSISTENT = 'CONSISTENT',      // Showing the skill reliably in familiar situations
  INDEPENDENT = 'INDEPENDENT',    // Applying the skill confidently without guidance
  ADAPTIVE = 'ADAPTIVE',          // Flexibly using the skill across new or complex situations
  UNCLASSIFIED = 'UNCLASSIFIED',  // Not yet observed/assessed (baseline phase)
}

/**
 * Skill maturity band progression order
 * Used for comparison and understanding progression
 */
export const BAND_ORDER: SkillMaturityBand[] = [
  SkillMaturityBand.UNCLASSIFIED,
  SkillMaturityBand.DISCOVERING,
  SkillMaturityBand.PRACTICING,
  SkillMaturityBand.CONSISTENT,
  SkillMaturityBand.INDEPENDENT,
  SkillMaturityBand.ADAPTIVE,
];

/**
 * Get band order index for comparison
 */
export function getBandOrder(band: SkillMaturityBand): number {
  return BAND_ORDER.indexOf(band);
}

/**
 * Check if a band is higher than another
 */
export function isBandHigher(band1: SkillMaturityBand, band2: SkillMaturityBand): boolean {
  return getBandOrder(band1) > getBandOrder(band2);
}

/**
 * Get human-readable description of a skill maturity band
 */
export function getBandDescription(band: SkillMaturityBand): string {
  switch (band) {
    case SkillMaturityBand.DISCOVERING:
      return 'First encounters, experimenting, learning what the skill feels like';
    case SkillMaturityBand.PRACTICING:
      return 'Using the skill with effort and some support';
    case SkillMaturityBand.CONSISTENT:
      return 'Showing the skill reliably in familiar situations';
    case SkillMaturityBand.INDEPENDENT:
      return 'Applying the skill confidently without guidance';
    case SkillMaturityBand.ADAPTIVE:
      return 'Flexibly using the skill across new or complex situations';
    case SkillMaturityBand.UNCLASSIFIED:
      return 'Not yet observed or assessed';
    default:
      return 'Unknown maturity level';
  }
}

/**
 * Get student-friendly label for a band
 */
export function getBandLabel(band: SkillMaturityBand): string {
  switch (band) {
    case SkillMaturityBand.DISCOVERING:
      return 'Discovering';
    case SkillMaturityBand.PRACTICING:
      return 'Practicing';
    case SkillMaturityBand.CONSISTENT:
      return 'Consistent';
    case SkillMaturityBand.INDEPENDENT:
      return 'Independent';
    case SkillMaturityBand.ADAPTIVE:
      return 'Adaptive';
    case SkillMaturityBand.UNCLASSIFIED:
      return 'Getting Started';
    default:
      return 'Unknown';
  }
}
