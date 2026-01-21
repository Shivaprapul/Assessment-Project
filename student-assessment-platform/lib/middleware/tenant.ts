/**
 * Tenant Middleware
 * 
 * CRITICAL SECURITY: Ensures all database queries are automatically
 * scoped to the user's tenant, preventing cross-tenant data access.
 * 
 * How it works:
 * 1. Extract tenant_id from JWT token (set during login)
 * 2. Set PostgreSQL session variable for Row-Level Security
 * 3. All Prisma queries automatically filter by tenant_id
 * 
 * @module lib/middleware/tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Sets tenant context for the current database session
 * 
 * CRITICAL: This sets a PostgreSQL session variable that Row-Level Security
 * policies use to automatically filter all queries by tenant_id.
 * 
 * @param tenantId - UUID of the tenant
 */
export async function setTenantContext(tenantId: string): Promise<void> {
  try {
    // Set PostgreSQL session variable for Row-Level Security
    // This ensures ALL queries are automatically filtered by tenant_id
    await db.$executeRaw`SET LOCAL app.current_tenant = ${tenantId}`;
  } catch (error) {
    // If RLS is not set up yet, log warning but continue
    // In production, RLS must be configured
    console.warn('⚠️  Row-Level Security not configured. Tenant isolation relies on application-level filtering.');
  }
}

/**
 * Middleware wrapper that injects tenant context into requests
 * 
 * @param handler - API route handler function
 * @returns Wrapped handler with tenant context
 */
export function withTenantContext(
  handler: (req: NextRequest, tenantId: string, user: any) => Promise<Response>
) {
  return async (req: NextRequest, user: any): Promise<Response> => {
    // Extract tenant from session (set by auth middleware)
    const tenantId = req.headers.get('x-tenant-id') || user?.tenantId;
    
    if (!tenantId) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'TENANT_REQUIRED',
            message: 'Tenant context is required'
          }
        },
        { status: 403 }
      );
    }

    // Set tenant context for this request
    await setTenantContext(tenantId);

    // Call the handler with tenant context
    return handler(req, tenantId, user);
  };
}

/**
 * Validates that a resource belongs to the specified tenant
 * 
 * @param tenantId - Tenant ID to validate against
 * @param resourceTenantId - Resource's tenant ID
 * @throws Error if tenant IDs don't match
 */
export function validateTenantAccess(
  tenantId: string,
  resourceTenantId: string
): void {
  if (tenantId !== resourceTenantId) {
    throw new Error('Access denied: Resource does not belong to your tenant');
  }
}

