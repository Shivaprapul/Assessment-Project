/**
 * Parent-Safe DTOs
 * 
 * Data Transfer Objects for parent portal that ensure:
 * - No rankings or peer comparisons
 * - No diagnostic language
 * - No deterministic career claims
 * - Evidence-based insights only
 * 
 * @module lib/parent-dtos
 */

import { TalentSignal, ConfidenceBand } from './parent-evidence-gating';

export interface ParentDashboardDTO {
  atAGlance: {
    weeklyEngagement: number;
    streak: number;
    completionCount: number;
  };
  confidentInsights: {
    signals: TalentSignal[];
    globalGateMet: boolean;
    remainingActivities: number; // Activities needed to unlock
  };
  gentleObservations: {
    unlocked: boolean;
    observations: string[]; // Descriptive observations only
  };
  progressNarrative: {
    unlocked: boolean;
    narrative: {
      then: string; // Early observed phase
      now: string; // Current strengths and behaviors
      next: string; // What system is focusing on
    } | null;
  };
  supportActions: Array<{
    action: string;
    mappedToSignal: string; // Signal ID
    lowEffort: boolean;
  }>;
}

export interface ParentThinkingDTO {
  thinkingStyleMap: {
    dimensions: Array<{
      name: string;
      value: number; // 0-100
      description: string;
    }>;
  };
  talentSignals: Array<{
    signal: TalentSignal;
    whatWeObserved: string;
    whatItMayIndicate: string; // Safe phrasing
    whatItMeansAtHome: string;
  }>;
}

export interface ParentTalentsDTO {
  title: string; // "Strengths You May Not Notice in Exams"
  signals: Array<{
    signal: TalentSignal;
    whyHiddenInSchool: string;
    realWorldExamples: string[];
    supportTip: string;
  }>;
  lockedPlaceholders: Array<{
    message: string;
    activitiesNeeded: number;
  }>;
}

export interface ParentFieldsDTO {
  fields: Array<{
    category: string; // "Analytical & Research", "Creative & Expressive", etc.
    name: string;
    whyItAligns: string; // Signals + environments
    suggestedExploration: string[];
    disclaimer: string; // "This doesn't limit future options."
  }>;
}

export interface ParentActivityDTO {
  activities: Array<{
    id: string;
    title: string;
    type: string;
    completedAt: string;
    isTeacherAssigned: boolean;
    performanceSummary: {
      completionRate: number;
      timeTaken: number;
      skillTags: string[];
    };
    whatItIndicates: string; // Observational only
    supportSuggestions: string[];
  }>;
}

export interface ParentSettingsDTO {
  notificationPrefs: {
    emailEnabled: boolean;
    inAppEnabled: boolean;
    reportFrequency: 'daily' | 'weekly' | 'monthly';
    alertInactiveDays?: number; // 3/5/7/14
    alertWeeklyPlanMissed?: boolean;
    alertTeacherAssignments?: boolean;
  };
  reportPrefs: {
    digestFrequency: 'weekly' | 'monthly';
    defaultTimeRange: '7d' | '30d' | '90d';
    includeSupportActions: boolean;
    includeProgressNarrative: boolean;
  };
  privacyConsent: {
    dataSharing: boolean;
    aiAnalysis: boolean;
    lastUpdated: string;
  };
  personalizationPrefs: {
    language: string; // Placeholder
    tonePreference: 'concise' | 'detailed';
    focusAreas: string[]; // Confidence building, Consistency, Planning, etc.
  };
}

export interface ParentProfileDTO {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  profile: {
    displayName?: string;
    timezone?: string;
  };
  linkedStudent: {
    id: string;
    name: string;
    grade: number;
    section?: string;
    tenantName: string;
  } | null;
  communicationSummary: {
    emailEnabled: boolean;
    inAppEnabled: boolean;
  };
}

