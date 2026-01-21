/**
 * Verify OTP API Route
 * 
 * Verifies the OTP code and creates a session for the user.
 * 
 * @module app/api/auth/verify-otp
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { redis } from '@/lib/redis';
import { db } from '@/lib/db';
import { verifyOTPSchema } from '@/lib/validators';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { encode } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/auth/verify-otp
 * 
 * Verifies OTP and creates session
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = verifyOTPSchema.parse(body);

    // Get stored OTP from Redis
    // Use try-catch in case Redis is not available (development mode)
    const otpKey = `otp:${email}`;
    let storedOTP: string | null = null;
    
    console.log(`[Verify OTP] Looking for OTP with key: ${otpKey}`);
    console.log(`[Verify OTP] Received OTP: ${otp}`);
    
    try {
      storedOTP = await redis.get(otpKey);
      console.log(`[Verify OTP] Retrieved from store: ${storedOTP ? 'Found' : 'Not found'}`);
      if (storedOTP) {
        console.log(`[Verify OTP] Stored OTP value: ${storedOTP}`);
      }
    } catch (redisError: any) {
      // In development without Redis, we can't verify OTP
      // This is a limitation - Redis is required for OTP verification
      console.error('Redis error during OTP verification:', redisError.message);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REDIS_UNAVAILABLE',
            message: 'OTP verification service temporarily unavailable. Please try again.',
          },
        },
        { status: 503 }
      );
    }

    if (!storedOTP) {
      console.error(`[Verify OTP] ❌ OTP not found in store for key: ${otpKey}`);
      console.error(`[Verify OTP] This could mean:`);
      console.error(`  - OTP was never stored`);
      console.error(`  - OTP expired`);
      console.error(`  - OTP was already used and deleted`);
      console.error(`  - In-memory store was cleared (server restart or different instance)`);
      
      // In development, provide more helpful error message
      const helpfulMessage = process.env.NODE_ENV === 'development'
        ? 'OTP not found. This might be because: (1) OTP expired, (2) OTP was already used, (3) Server restarted (in-memory store cleared). Please request a NEW OTP.'
        : 'OTP has expired. Please request a new one.';
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OTP_EXPIRED',
            message: helpfulMessage,
          },
        },
        { status: 401 }
      );
    }

    // Verify OTP
    console.log(`[Verify OTP] Comparing: stored="${storedOTP}" vs received="${otp}"`);
    if (storedOTP !== otp) {
      console.error(`[Verify OTP] ❌ OTP mismatch!`);
      console.error(`  Stored: ${storedOTP}`);
      console.error(`  Received: ${otp}`);
      // Increment failed attempts
      try {
        const failedAttempts = await redis.incr(`otp:failed:${email}`);
        await redis.expire(`otp:failed:${email}`, 900); // 15 minutes

        if (failedAttempts >= 5) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'TOO_MANY_ATTEMPTS',
                message: 'Too many failed attempts. Please request a new OTP.',
              },
            },
            { status: 429 }
          );
        }
      } catch (redisError) {
        // Continue even if Redis fails for failed attempts tracking
        console.warn('Redis error tracking failed attempts:', redisError);
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_OTP',
            message: 'Invalid OTP code',
          },
        },
        { status: 401 }
      );
    }

    // OTP is valid - find user
    const user = await db.user.findFirst({
      where: { email },
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

    // Delete OTP from Redis
    try {
      await redis.del(`otp:${email}`);
      await redis.del(`otp:failed:${email}`);
    } catch (redisError) {
      // Continue even if Redis cleanup fails
      console.warn('Redis error during cleanup:', redisError);
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create NextAuth JWT token
    // NextAuth expects: sub (user id), email, name, and custom fields
    const token = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
        id: user.id,
        role: user.role,
        tenantId: user.tenantId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      },
      secret: process.env.NEXTAUTH_SECRET || 'fallback-secret',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Create response data
    const responseData = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          avatar: user.avatar,
        },
        tenant: user.tenant,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    // Create response with user data
    const response = NextResponse.json(responseData, { status: 200 });

    // Set NextAuth session cookie
    // The cookie name follows NextAuth's convention: next-auth.session-token
    const cookieName = 
      process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token';

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    console.log('✅ OTP verified, session cookie set for:', user.email);
    console.log('✅ Cookie name:', cookieName);
    console.log('✅ Cookie set with secret:', !!process.env.NEXTAUTH_SECRET);
    console.log('✅ Token length:', token.length);

    return response;
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

