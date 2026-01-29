/**
 * Academic Year Utilities
 * 
 * Handles academic year calculations and grade completion logic.
 * 
 * @module lib/academic-year
 */

import { db } from '@/lib/db';

export interface AcademicYearConfig {
  id: string;
  tenantId: string | null;
  startMonth: number; // 1-12
  startDay: number; // 1-31
  endMonth: number; // 1-12
  endDay: number; // 1-31
  timezone: string;
}

/**
 * Get academic year configuration for a tenant (or global default)
 */
export async function getAcademicYearConfig(tenantId: string): Promise<AcademicYearConfig> {
  // Try to get tenant-specific config
  const tenantConfig = await db.academicYearConfig.findFirst({
    where: { tenantId },
  });

  if (tenantConfig) {
    return {
      id: tenantConfig.id,
      tenantId: tenantConfig.tenantId,
      startMonth: tenantConfig.startMonth,
      startDay: tenantConfig.startDay,
      endMonth: tenantConfig.endMonth,
      endDay: tenantConfig.endDay,
      timezone: tenantConfig.timezone,
    };
  }

  // Get global default (tenantId = null)
  const globalConfig = await db.academicYearConfig.findFirst({
    where: { tenantId: null },
  });

  if (globalConfig) {
    return {
      id: globalConfig.id,
      tenantId: globalConfig.tenantId,
      startMonth: globalConfig.startMonth,
      startDay: globalConfig.startDay,
      endMonth: globalConfig.endMonth,
      endDay: globalConfig.endDay,
      timezone: globalConfig.timezone,
    };
  }

  // Create and return default config if none exists
  const defaultConfig = await db.academicYearConfig.create({
    data: {
      tenantId: null, // Global default
      startMonth: 6, // June
      startDay: 1,
      endMonth: 5, // May
      endDay: 31,
      timezone: 'Asia/Kolkata',
    },
  });

  return {
    id: defaultConfig.id,
    tenantId: defaultConfig.tenantId,
    startMonth: defaultConfig.startMonth,
    startDay: defaultConfig.startDay,
    endMonth: defaultConfig.endMonth,
    endDay: defaultConfig.endDay,
    timezone: defaultConfig.timezone,
  };
}

/**
 * Get current academic year start and end dates
 */
export function getCurrentAcademicYear(config: AcademicYearConfig): {
  startDate: Date;
  endDate: Date;
  yearLabel: string;
} {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Academic year spans from startMonth/startDay of one year to endMonth/endDay of next year
  // Example: June 1, 2024 to May 31, 2025
  let startYear: number;
  let endYear: number;

  if (currentMonth >= config.startMonth) {
    // We're in the academic year that started this calendar year
    startYear = currentYear;
    endYear = currentYear + 1;
  } else {
    // We're in the academic year that started last calendar year
    startYear = currentYear - 1;
    endYear = currentYear;
  }

  const startDate = new Date(startYear, config.startMonth - 1, config.startDay);
  const endDate = new Date(endYear, config.endMonth - 1, config.endDay);
  
  // Set time to end of day for endDate
  endDate.setHours(23, 59, 59, 999);

  const yearLabel = `${startYear}-${endYear}`;

  return { startDate, endDate, yearLabel };
}

/**
 * Check if current date is past academic year end (soft completion eligible)
 */
export function isAcademicYearComplete(config: AcademicYearConfig): boolean {
  const { endDate } = getCurrentAcademicYear(config);
  const now = new Date();
  return now > endDate;
}

/**
 * Get days until academic year end (negative if past)
 */
export function getDaysUntilAcademicYearEnd(config: AcademicYearConfig): number {
  const { endDate } = getCurrentAcademicYear(config);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a student can upgrade based on soft completion (academic year end)
 */
export async function canUpgradeBySoftCompletion(
  tenantId: string,
  studentStartDate: Date
): Promise<{
  canUpgrade: boolean;
  reason: string;
  academicYearEnd?: Date;
  daysUntilEnd?: number;
}> {
  const config = await getAcademicYearConfig(tenantId);
  const isComplete = isAcademicYearComplete(config);
  const { endDate } = getCurrentAcademicYear(config);
  const daysUntilEnd = getDaysUntilAcademicYearEnd(config);

  if (isComplete) {
    return {
      canUpgrade: true,
      reason: 'Academic year has ended. You can upgrade to the next grade.',
      academicYearEnd: endDate,
      daysUntilEnd: daysUntilEnd,
    };
  }

  return {
    canUpgrade: false,
    reason: `Academic year ends on ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Upgrade will be available then.`,
    academicYearEnd: endDate,
    daysUntilEnd: daysUntilEnd,
  };
}

/**
 * Get academic year context for display
 */
export async function getAcademicYearContext(tenantId: string): Promise<{
  currentYear: string;
  startDate: Date;
  endDate: Date;
  isComplete: boolean;
  daysUntilEnd: number;
}> {
  const config = await getAcademicYearConfig(tenantId);
  const { startDate, endDate, yearLabel } = getCurrentAcademicYear(config);
  const isComplete = isAcademicYearComplete(config);
  const daysUntilEnd = getDaysUntilAcademicYearEnd(config);

  return {
    currentYear: yearLabel,
    startDate,
    endDate,
    isComplete,
    daysUntilEnd,
  };
}
