/**
 * Clear Rate Limit API Route (Development Only)
 * 
 * Clears OTP rate limit for a specific email.
 * Only available in development mode.
 * 
 * @module app/api/auth/clear-rate-limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { redis } from '@/lib/redis';
import { sendOTPSchema } from '@/lib/validators';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';

/**
 * POST /api/auth/clear-rate-limit
 * 
 * Clear rate limit for an email (development only)
 */
export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'This endpoint is only available in development mode',
        },
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { email } = sendOTPSchema.parse(body);

    // Clear rate limit
    await redis.del(`otp:attempts:${email}`);
    await redis.del(`otp:failed:${email}`);

    return successResponse({
      message: 'Rate limit cleared for this email',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }
    return handleAPIError(error);
  }
}

