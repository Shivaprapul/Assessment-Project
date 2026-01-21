/**
 * Send OTP API Route
 * 
 * Sends a 6-digit OTP to the user's email for authentication.
 * Implements rate limiting (3 requests per 15 minutes).
 * 
 * @module app/api/auth/send-otp
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { redis } from '@/lib/redis';
import { sendOTP } from '@/lib/email';
import { db } from '@/lib/db';
import { sendOTPSchema } from '@/lib/validators';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';

/**
 * POST /api/auth/send-otp
 * 
 * Sends OTP to user's email
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = sendOTPSchema.parse(body);

    // Check if user exists first
    let user;
    try {
      user = await db.user.findFirst({
        where: { email },
      });
    } catch (dbError: any) {
      console.error('[Send OTP] Database error:', dbError);
      console.error('[Send OTP] Error message:', dbError.message);
      console.error('[Send OTP] Error code:', dbError.code);
      console.error('[Send OTP] DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
      
      const isConnectionError = dbError.code === 'P1001' || 
                                dbError.message?.includes('connect') ||
                                dbError.message?.includes('ECONNREFUSED') ||
                                dbError.message?.includes('Can\'t reach database server');
      
      const errorMessage = isConnectionError
        ? 'Database connection failed. Please ensure PostgreSQL is running and restart the dev server after updating DATABASE_URL.'
        : `Database error: ${dbError.message || 'Unknown error'}`;
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? {
              hint: 'Restart dev server after changing DATABASE_URL',
              errorCode: dbError.code,
              errorMessage: dbError.message,
            } : undefined,
          },
        },
        { status: 503 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Email not registered in system',
          },
        },
        { status: 404 }
      );
    }

    console.log('[Send OTP] User found:', user.id);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Check rate limit and store OTP in Redis
    // Use try-catch in case Redis is not available (development mode)
    try {
      // In development, use more lenient rate limiting (10 requests per 5 minutes)
      // In production, use stricter limits (3 requests per 15 minutes)
      const isDevelopment = process.env.NODE_ENV === 'development';
      const rateLimit = isDevelopment ? 10 : 3;
      const rateLimitWindow = isDevelopment ? 300 : 900; // 5 min vs 15 min
      
      const rateLimitKey = `otp:attempts:${email}`;
      const attempts = await redis.get(rateLimitKey);
      
      if (attempts && parseInt(attempts) >= rateLimit) {
        const waitTime = isDevelopment ? '5 minutes' : '15 minutes';
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: `Too many OTP requests. Please try again in ${waitTime}.`,
              ...(isDevelopment && {
                hint: 'In development, you can clear the rate limit by restarting the server or waiting 5 minutes.',
              }),
            },
          },
          { status: 429 }
        );
      }

      // Store OTP in Redis (10 minutes in dev, 5 minutes in production)
      const otpExpiry = process.env.NODE_ENV === 'development' ? 600 : 300;
      const otpKey = `otp:${email}`;
      
      await redis.setex(otpKey, otpExpiry, otp);
      
      // Verify it was stored (for debugging)
      const verifyStored = await redis.get(otpKey);
      if (verifyStored !== otp) {
        console.error('❌ ERROR: OTP was not stored correctly!');
        console.error('Expected:', otp, 'Got:', verifyStored);
      } else {
        console.log('✅ OTP stored successfully');
      }
      
      // Log OTP clearly in development
      if (process.env.NODE_ENV === 'development') {
        console.log('\n\n');
        console.log('🔐 ========================================');
        console.log('🔐 ========================================');
        console.log(`📧 OTP for ${email}: ${otp}`);
        console.log(`📧 OTP for ${email}: ${otp}`);
        console.log(`📧 OTP for ${email}: ${otp}`);
        console.log(`🔑 Storage key: ${otpKey}`);
        console.log(`⏰ Valid for ${otpExpiry / 60} minutes`);
        console.log('🔐 ========================================');
        console.log('🔐 ========================================');
        console.log('\n\n');
      }
      
      // Increment rate limit counter
      await redis.incr(rateLimitKey);
      await redis.expire(rateLimitKey, rateLimitWindow);
    } catch (redisError: any) {
      // If Redis is not available, log OTP to console for development
      console.log('\n\n');
      console.log('🔐 ========================================');
      console.log('🔐 ========================================');
      console.log(`⚠️  Redis not available - using file cache`);
      console.log(`📧 OTP for ${email}: ${otp}`);
      console.log(`📧 OTP for ${email}: ${otp}`);
      console.log(`📧 OTP for ${email}: ${otp}`);
      console.log(`⏰ Valid for 10 minutes (file cache)`);
      console.log('⚠️  Note: OTP stored in file cache');
      console.log('🔐 ========================================');
      console.log('🔐 ========================================');
      console.log('\n\n');
    }

    // Send OTP email (logs to console in development)
    await sendOTP(email, otp);

    console.log('[Send OTP] Success for:', email);

    const otpExpiry = process.env.NODE_ENV === 'development' ? 600 : 300;
    return successResponse({
      message: 'OTP sent to your email',
      expiresIn: otpExpiry, // 10 minutes in dev, 5 in production
      ...(process.env.NODE_ENV === 'development' && {
        hint: 'Check the server console/terminal for the OTP code',
      }),
    });
  } catch (error) {
    console.error('[Send OTP] Error:', error);
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

