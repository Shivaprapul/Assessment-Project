/**
 * Class Focus Prioritization
 * 
 * Integrates teacher's Class Focus priority boosts into quest selection.
 * 
 * @module lib/class-focus-prioritization
 */

import { db } from '@/lib/db';
import { SkillCategory } from '@prisma/client';

export interface PriorityBreakdown {
  basePriority: number;
  classFocusBoost: number;
  finalPriority: number;
  skill: string;
}

/**
 * Get active Class Focus profile for a teacher
 */
export async function getActiveClassFocus(
  tenantId: string,
  teacherId: string,
  grade?: number
): Promise<{ priorityBoosts: Record<string, number> } | null> {
  try {
    const focusProfile = await db.classFocusProfile.findFirst({
      where: {
        tenantId,
        teacherId,
        isActive: true,
        ...(grade ? { grade } : {}),
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!focusProfile) {
      return null;
    }

    // Check if focus window is still valid
    const focusWindow = focusProfile.focusWindow as any;
    if (focusWindow?.endDate) {
      const endDate = new Date(focusWindow.endDate);
      if (endDate < new Date()) {
        // Focus window expired
        return null;
      }
    }

    return {
      priorityBoosts: (focusProfile.priorityBoosts as Record<string, number>) || {},
    };
  } catch (error) {
    console.error('Error fetching class focus:', error);
    return null;
  }
}

/**
 * Apply Class Focus priority boosts to quest priority calculation
 * 
 * Formula:
 * FinalPriority = BasePriority + ClassFocusBoost
 * 
 * Where:
 * - BasePriority = (GradeSkillExpectations emphasisWeight + goal needs + student weak signals)
 * - ClassFocusBoost = priorityBoosts[skill] (capped at 0.20 per skill)
 * 
 * Guardrails:
 * - Boosts are additive and capped (max +0.20 per skill)
 * - Boosts do NOT override gradeApplicability filtering
 * - Boosts do NOT override hard constraints
 */
export function applyClassFocusBoost(
  basePriority: number,
  skillCategory: SkillCategory | string,
  classFocusBoosts: Record<string, number>
): number {
  const skillKey = typeof skillCategory === 'string' 
    ? skillCategory.toUpperCase() 
    : skillCategory;
  
  const boost = classFocusBoosts[skillKey] || 0;
  
  // Cap boost at 0.20 (20%)
  const cappedBoost = Math.min(0.20, Math.max(0, boost));
  
  // Apply boost additively (multiply base priority by (1 + boost))
  // This ensures boosts scale with the base priority
  return basePriority * (1 + cappedBoost);
}

/**
 * Calculate priority breakdown for debugging
 */
export function calculatePriorityBreakdown(
  basePriority: number,
  skillCategory: SkillCategory | string,
  classFocusBoosts: Record<string, number>
): PriorityBreakdown {
  const skillKey = typeof skillCategory === 'string' 
    ? skillCategory.toUpperCase() 
    : skillCategory;
  
  const boost = classFocusBoosts[skillKey] || 0;
  const cappedBoost = Math.min(0.20, Math.max(0, boost));
  const finalPriority = basePriority * (1 + cappedBoost);
  
  return {
    basePriority,
    classFocusBoost: cappedBoost,
    finalPriority,
    skill: skillKey,
  };
}

/**
 * Debug logging for Class Focus prioritization
 * Only logs if DEBUG_CLASS_FOCUS=true
 */
export function debugClassFocusPrioritization(
  quests: Array<{ id: string; title: string; priority: number; breakdown?: PriorityBreakdown }>
): void {
  if (process.env.DEBUG_CLASS_FOCUS !== 'true') {
    return;
  }

  console.log('\n=== Class Focus Prioritization Debug ===');
  console.log(`Top ${Math.min(5, quests.length)} quests after Class Focus boost:\n`);
  
  quests.slice(0, 5).forEach((quest, idx) => {
    console.log(`${idx + 1}. ${quest.title}`);
    console.log(`   Final Priority: ${quest.priority.toFixed(2)}`);
    if (quest.breakdown) {
      console.log(`   Base Priority: ${quest.breakdown.basePriority.toFixed(2)}`);
      console.log(`   Class Focus Boost: +${(quest.breakdown.classFocusBoost * 100).toFixed(1)}%`);
      console.log(`   Skill: ${quest.breakdown.skill}`);
    }
    console.log('');
  });
  
  console.log('==========================================\n');
}

