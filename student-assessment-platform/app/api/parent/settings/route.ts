/**
 * Parent Settings API
 * 
 * Manage parent settings and preferences.
 * 
 * @module app/api/parent/settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isParent } from '@/lib/role-utils';
import { ParentSettingsDTO } from '@/lib/parent-dtos';
import { z } from 'zod';

const SettingsSchema = z.object({
  notificationPrefs: z
    .object({
      emailEnabled: z.boolean().optional(),
      inAppEnabled: z.boolean().optional(),
      reportFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
      alertInactiveDays: z.number().optional(),
      alertWeeklyPlanMissed: z.boolean().optional(),
      alertTeacherAssignments: z.boolean().optional(),
    })
    .optional(),
  reportPrefs: z
    .object({
      digestFrequency: z.enum(['weekly', 'monthly']).optional(),
      defaultTimeRange: z.enum(['7d', '30d', '90d']).optional(),
      includeSupportActions: z.boolean().optional(),
      includeProgressNarrative: z.boolean().optional(),
    })
    .optional(),
  personalizationPrefs: z
    .object({
      language: z.string().optional(),
      tonePreference: z.enum(['concise', 'detailed']).optional(),
      focusAreas: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * GET /api/parent/settings
 */
export async function GET(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isParent(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only parents can access this endpoint' },
            { status: 403 }
          );
        }

        // Get settings from user metadata (MVP: store in User.metadata)
        const dbUser = await db.user.findUnique({
          where: { id: user.id, tenantId },
          select: { metadata: true },
        });

        const metadata = (dbUser?.metadata as any) || {};
        const storedSettings = metadata.parentSettings || {};

        const settings: ParentSettingsDTO = {
          notificationPrefs: {
            emailEnabled: storedSettings.notificationPrefs?.emailEnabled !== false,
            inAppEnabled: storedSettings.notificationPrefs?.inAppEnabled !== false,
            reportFrequency: storedSettings.notificationPrefs?.reportFrequency || 'weekly',
            alertInactiveDays: storedSettings.notificationPrefs?.alertInactiveDays || 7,
            alertWeeklyPlanMissed: storedSettings.notificationPrefs?.alertWeeklyPlanMissed || false,
            alertTeacherAssignments: storedSettings.notificationPrefs?.alertTeacherAssignments || false,
          },
          reportPrefs: {
            digestFrequency: storedSettings.reportPrefs?.digestFrequency || 'weekly',
            defaultTimeRange: storedSettings.reportPrefs?.defaultTimeRange || '30d',
            includeSupportActions: storedSettings.reportPrefs?.includeSupportActions !== false,
            includeProgressNarrative: storedSettings.reportPrefs?.includeProgressNarrative !== false,
          },
          privacyConsent: {
            dataSharing: true,
            aiAnalysis: true,
            lastUpdated: new Date().toISOString(),
          },
          personalizationPrefs: {
            language: storedSettings.personalizationPrefs?.language || 'en',
            tonePreference: storedSettings.personalizationPrefs?.tonePreference || 'concise',
            focusAreas: storedSettings.personalizationPrefs?.focusAreas || [],
          },
        };

        return NextResponse.json({ success: true, data: settings });
      } catch (error: any) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch settings' },
          { status: 500 }
        );
      }
    })
  )(req);
}

/**
 * PUT /api/parent/settings
 */
export async function PUT(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isParent(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only parents can access this endpoint' },
            { status: 403 }
          );
        }

        const body = await req.json();
        const validated = SettingsSchema.parse(body);

        // Get current user metadata
        const dbUser = await db.user.findUnique({
          where: { id: user.id, tenantId },
          select: { metadata: true },
        });

        const metadata = (dbUser?.metadata as any) || {};
        const currentSettings = metadata.parentSettings || {};

        // Merge validated settings
        if (validated.notificationPrefs) {
          currentSettings.notificationPrefs = {
            ...currentSettings.notificationPrefs,
            ...validated.notificationPrefs,
          };
        }
        if (validated.reportPrefs) {
          currentSettings.reportPrefs = {
            ...currentSettings.reportPrefs,
            ...validated.reportPrefs,
          };
        }
        if (validated.personalizationPrefs) {
          currentSettings.personalizationPrefs = {
            ...currentSettings.personalizationPrefs,
            ...validated.personalizationPrefs,
          };
        }

        // Save to user metadata
        await db.user.update({
          where: { id: user.id, tenantId },
          data: {
            metadata: {
              ...metadata,
              parentSettings: currentSettings,
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            message: 'Settings saved successfully',
          },
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { success: false, error: 'Invalid input', details: error.issues },
            { status: 400 }
          );
        }
        console.error('Error saving settings:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to save settings' },
          { status: 500 }
        );
      }
    })
  )(req);
}

