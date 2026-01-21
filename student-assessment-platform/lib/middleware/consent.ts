/**
 * Consent Management Middleware
 * 
 * Validates parental consent for student actions.
 * Required for DPDP Act 2023 compliance.
 * 
 * @module lib/middleware/consent
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from './auth';

export enum ConsentPurpose {
  ASSESSMENT = 'ASSESSMENT',
  DATA_PROCESSING = 'DATA_PROCESSING',
  AI_ANALYSIS = 'AI_ANALYSIS',
  PARENT_VISIBILITY = 'PARENT_VISIBILITY',
  TEACHER_VISIBILITY = 'TEACHER_VISIBILITY',
  RESEARCH = 'RESEARCH',
}

/**
 * Checks if consent exists for a specific purpose
 * 
 * @param studentId - UUID of the student
 * @param purpose - Consent purpose
 * @param tenantId - Tenant ID for isolation
 * @returns True if valid consent exists
 */
export async function checkConsent(
  studentId: string,
  purpose: ConsentPurpose,
  tenantId: string
): Promise<boolean> {
  const consent = await db.consentRecord.findFirst({
    where: {
      subjectUserId: studentId,
      tenantId,
      purpose,
      granted: true,
      withdrawnAt: null,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  return !!consent;
}

/**
 * Middleware that requires consent for student actions
 * 
 * @param purpose - Required consent purpose
 * @param handler - API route handler function
 * @returns Wrapped handler that requires consent
 */
export function requireConsent<T extends any[]>(
  purpose: ConsentPurpose,
  handler: (req: NextRequest, user: any, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    // Only check consent for students
    if (user.role === 'STUDENT') {
      const hasConsent = await checkConsent(user.id, purpose, user.tenantId);

      if (!hasConsent) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONSENT_REQUIRED',
              message: 'Parental consent is required for this action'
            }
          },
          { status: 403 }
        );
      }
    }

    return handler(req, user, ...args);
  };
}

