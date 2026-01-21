/**
 * Get Session API Route
 * 
 * Returns the current user's session information including user details and tenant.
 * 
 * @module app/api/auth/session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';

/**
 * GET /api/auth/session
 * 
 * Get current session
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No active session',
          },
        },
        { status: 401 }
      );
    }

    // Fetch full user data from database
    const user = await db.user.findUnique({
      where: { id: (session.user as any).id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            branding: true,
            features: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        },
        { status: 404 }
      );
    }

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        avatar: user.avatar,
      },
      tenant: user.tenant,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

