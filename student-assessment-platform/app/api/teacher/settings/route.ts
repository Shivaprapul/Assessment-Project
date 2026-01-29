/**
 * Teacher Settings API
 * 
 * Get and update teacher profile and settings.
 * 
 * @module app/api/teacher/settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/role-utils';
import { z } from 'zod';

// Validation schemas
const TeacherProfileSchema = z.object({
  displayName: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  subjectsTaught: z.array(z.string()).optional(),
  roleLabel: z.string().optional().nullable(),
});

const AssignmentDefaultsSchema = z.object({
  defaultDueDays: z.number().min(1).max(30).optional(),
  defaultQuestCount: z.number().min(1).max(10).optional(),
  defaultQuestTypes: z.array(z.string()).optional(),
  defaultIntent: z.string().optional().nullable(),
});

const NotificationPrefsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  alertInactiveDays: z.number().min(1).max(30).optional().nullable(),
  alertOverdueAssignments: z.boolean().optional(),
  alertEngagementDrop: z.boolean().optional(),
  alertGroupGrowthThreshold: z.number().min(1).optional().nullable(),
});

const ReportPrefsSchema = z.object({
  defaultTimeRange: z.enum(['7d', '30d']).optional(),
  weeklySummaryEmail: z.boolean().optional(),
  defaultLanding: z.enum(['overview', 'signals']).optional(),
});

const PrivacyPrefsSchema = z.object({
  hideCharacterValuesInsights: z.boolean().optional(),
  showOnlyBriefSummaries: z.boolean().optional(),
  disableSensitiveNarratives: z.boolean().optional(),
});

const TeacherSettingsSchema = z.object({
  profile: TeacherProfileSchema.optional(),
  assignmentDefaults: AssignmentDefaultsSchema.optional(),
  notificationPrefs: NotificationPrefsSchema.optional(),
  reportPrefs: ReportPrefsSchema.optional(),
  privacyPrefs: PrivacyPrefsSchema.optional(),
});

/**
 * GET /api/teacher/settings
 * 
 * Get teacher profile and settings
 */
export async function GET(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isTeacher(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only teachers can access settings' },
            { status: 403 }
          );
        }

        // Get teacher profile
        const profile = await db.teacherProfile.findUnique({
          where: {
            teacherId: user.id,
          },
        });

        // Get teacher settings
        const settings = await db.teacherSettings.findUnique({
          where: {
            teacherId: user.id,
          },
        });

        // Get user info
        const userInfo = await db.user.findUnique({
          where: {
            id: user.id,
          },
          select: {
            name: true,
            email: true,
            avatar: true,
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            profile: profile || {
              displayName: userInfo?.name || null,
              avatarUrl: userInfo?.avatar || null,
              phone: null,
              subjectsTaught: [],
              roleLabel: null,
            },
            settings: settings || {
              assignmentDefaults: {
                defaultDueDays: 7,
                defaultQuestCount: 4,
                defaultQuestTypes: ['mini_game', 'reflection', 'choice_scenario'],
                defaultIntent: null,
              },
              notificationPrefs: {
                emailEnabled: true,
                inAppEnabled: true,
                alertInactiveDays: 7,
                alertOverdueAssignments: true,
                alertEngagementDrop: true,
                alertGroupGrowthThreshold: 5,
              },
              reportPrefs: {
                defaultTimeRange: '7d',
                weeklySummaryEmail: false,
                defaultLanding: 'overview',
              },
              privacyPrefs: {
                hideCharacterValuesInsights: false,
                showOnlyBriefSummaries: true,
                disableSensitiveNarratives: true,
              },
            },
            user: userInfo,
          },
        });
      } catch (error: any) {
        console.error('Error fetching teacher settings:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch settings' },
          { status: 500 }
        );
      }
    })
  )(req);
}

/**
 * PUT /api/teacher/settings
 * 
 * Update teacher profile and settings
 */
export async function PUT(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isTeacher(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only teachers can update settings' },
            { status: 403 }
          );
        }

        const body = await req.json();
        const validated = TeacherSettingsSchema.parse(body);

        // Update or create profile
        if (validated.profile) {
          await db.teacherProfile.upsert({
            where: {
              teacherId: user.id,
            },
            create: {
              teacherId: user.id,
              tenantId,
              displayName: validated.profile.displayName || null,
              avatarUrl: validated.profile.avatarUrl || null,
              phone: validated.profile.phone || null,
              subjectsTaught: validated.profile.subjectsTaught || [],
              roleLabel: validated.profile.roleLabel || null,
            },
            update: {
              displayName: validated.profile.displayName,
              avatarUrl: validated.profile.avatarUrl,
              phone: validated.profile.phone,
              subjectsTaught: validated.profile.subjectsTaught,
              roleLabel: validated.profile.roleLabel,
              updatedAt: new Date(),
            },
          });
        }

        // Update or create settings
        const existingSettings = await db.teacherSettings.findUnique({
          where: {
            teacherId: user.id,
          },
        });

        const currentDefaults = existingSettings
          ? (existingSettings.assignmentDefaults as any) || {}
          : { defaultDueDays: 7, defaultQuestCount: 4, defaultQuestTypes: ['mini_game', 'reflection', 'choice_scenario'], defaultIntent: null };

        const currentNotifications = existingSettings
          ? (existingSettings.notificationPrefs as any) || {}
          : { emailEnabled: true, inAppEnabled: true, alertInactiveDays: 7, alertOverdueAssignments: true, alertEngagementDrop: true, alertGroupGrowthThreshold: 5 };

        const currentReports = existingSettings
          ? (existingSettings.reportPrefs as any) || {}
          : { defaultTimeRange: '7d', weeklySummaryEmail: false, defaultLanding: 'overview' };

        const currentPrivacy = existingSettings
          ? (existingSettings.privacyPrefs as any) || {}
          : { hideCharacterValuesInsights: false, showOnlyBriefSummaries: true, disableSensitiveNarratives: true };

        await db.teacherSettings.upsert({
          where: {
            teacherId: user.id,
          },
          create: {
            teacherId: user.id,
            tenantId,
            assignmentDefaults: {
              ...currentDefaults,
              ...validated.assignmentDefaults,
            },
            notificationPrefs: {
              ...currentNotifications,
              ...validated.notificationPrefs,
            },
            reportPrefs: {
              ...currentReports,
              ...validated.reportPrefs,
            },
            privacyPrefs: {
              ...currentPrivacy,
              ...validated.privacyPrefs,
            },
          },
          update: {
            assignmentDefaults: {
              ...currentDefaults,
              ...validated.assignmentDefaults,
            },
            notificationPrefs: {
              ...currentNotifications,
              ...validated.notificationPrefs,
            },
            reportPrefs: {
              ...currentReports,
              ...validated.reportPrefs,
            },
            privacyPrefs: {
              ...currentPrivacy,
              ...validated.privacyPrefs,
            },
            updatedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          data: { message: 'Settings saved successfully' },
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { success: false, error: 'Invalid input', details: error.issues },
            { status: 400 }
          );
        }
        console.error('Error updating teacher settings:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to update settings' },
          { status: 500 }
        );
      }
    })
  )(req);
}

