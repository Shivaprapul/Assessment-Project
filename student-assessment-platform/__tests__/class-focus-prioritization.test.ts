/**
 * Class Focus Prioritization Test
 * 
 * Unit test to verify Class Focus boosts actually change quest selection.
 * 
 * @module __tests__/class-focus-prioritization.test
 */

import { applyClassFocusBoost, calculatePriorityBreakdown } from '../lib/class-focus-prioritization';
import { SkillCategory } from '@prisma/client';

describe('Class Focus Prioritization', () => {
  it('should apply Class Focus boost correctly', () => {
    const basePriority = 100;
    const skillCategory: SkillCategory = 'PLANNING';
    const classFocusBoosts: Record<string, number> = {
      PLANNING: 0.15, // 15% boost
    };

    const finalPriority = applyClassFocusBoost(basePriority, skillCategory, classFocusBoosts);
    
    // Should be: 100 * (1 + 0.15) = 115
    expect(finalPriority).toBe(115);
  });

  it('should cap boost at 0.20 (20%)', () => {
    const basePriority = 100;
    const skillCategory: SkillCategory = 'ATTENTION';
    const classFocusBoosts: Record<string, number> = {
      ATTENTION: 0.30, // Attempted 30% boost, should be capped at 20%
    };

    const finalPriority = applyClassFocusBoost(basePriority, skillCategory, classFocusBoosts);
    
    // Should be: 100 * (1 + 0.20) = 120 (capped at 20%)
    expect(finalPriority).toBe(120);
  });

  it('should not apply boost if skill not in class focus', () => {
    const basePriority = 100;
    const skillCategory: SkillCategory = 'CREATIVITY';
    const classFocusBoosts: Record<string, number> = {
      PLANNING: 0.15, // Different skill
    };

    const finalPriority = applyClassFocusBoost(basePriority, skillCategory, classFocusBoosts);
    
    // Should remain unchanged: 100
    expect(finalPriority).toBe(100);
  });

  it('should calculate priority breakdown correctly', () => {
    const basePriority = 100;
    const skillCategory: SkillCategory = 'PLANNING';
    const classFocusBoosts: Record<string, number> = {
      PLANNING: 0.15,
    };

    const breakdown = calculatePriorityBreakdown(basePriority, skillCategory, classFocusBoosts);
    
    expect(breakdown.basePriority).toBe(100);
    expect(breakdown.classFocusBoost).toBe(0.15);
    expect(breakdown.finalPriority).toBe(115);
    expect(breakdown.skill).toBe('PLANNING');
  });

  it('should handle multiple skill boosts correctly', () => {
    const basePriority1 = 100;
    const basePriority2 = 80;
    const classFocusBoosts: Record<string, number> = {
      PLANNING: 0.15,
      ATTENTION: 0.10,
    };

    const priority1 = applyClassFocusBoost(basePriority1, 'PLANNING' as SkillCategory, classFocusBoosts);
    const priority2 = applyClassFocusBoost(basePriority2, 'ATTENTION' as SkillCategory, classFocusBoosts);
    
    // Quest 1: 100 * 1.15 = 115
    // Quest 2: 80 * 1.10 = 88
    // Quest 1 should rank higher
    expect(priority1).toBeGreaterThan(priority2);
  });
});

