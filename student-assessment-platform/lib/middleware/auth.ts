/**
 * Authentication Middleware
 * 
 * Handles JWT token validation and user session management.
 * Extracts user information and tenant context from tokens.
 * 
 * @module lib/middleware/auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  name: string;
}

/**
 * Gets the authenticated user from the request
 * 
 * @param req - Next.js request object
 * @returns Authenticated user or null
 */
export async function getAuthenticatedUser(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    // Debug: Check what cookies are present
    const cookies = req.cookies.getAll();
    const sessionCookie = cookies.find(c => 
      c.name === 'next-auth.session-token' || 
      c.name === '__Secure-next-auth.session-token'
    );
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth] Checking authentication...');
      console.log('[Auth] Cookies found:', cookies.map(c => c.name));
      console.log('[Auth] Session cookie found:', sessionCookie ? 'Yes' : 'No');
      if (sessionCookie) {
        console.log('[Auth] Session cookie value length:', sessionCookie.value.length);
      }
    }

    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET || 'fallback-secret',
    });

    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] ❌ No token found in request');
        console.log('[Auth] NEXTAUTH_SECRET set:', !!process.env.NEXTAUTH_SECRET);
      }
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth] ✅ Token found, sub:', token.sub);
    }

    // Fetch user from database to get latest data
    const user = await db.user.findUnique({
      where: { id: token.sub },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        name: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      name: user.name,
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Middleware that requires authentication
 * 
 * @param handler - API route handler function
 * @returns Wrapped handler that requires authentication
 */
export function requireAuth(
  handler: (req: NextRequest, user: AuthenticatedUser) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
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

    // Set tenant ID in headers for tenant middleware
    req.headers.set('x-tenant-id', user.tenantId);

    return handler(req, user);
  };
}

/**
 * Middleware that requires specific role(s)
 * 
 * @param allowedRoles - Array of allowed roles
 * @param handler - API route handler function
 * @returns Wrapped handler that requires specific role
 */
export function requireRole(
  allowedRoles: string[],
  handler: (req: NextRequest, user: AuthenticatedUser) => Promise<Response>
) {
  return requireAuth(async (req, user) => {
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions'
          }
        },
        { status: 403 }
      );
    }

    return handler(req, user);
  });
}

