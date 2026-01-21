/**
 * Tenant Isolation Test Endpoint
 * 
 * CRITICAL SECURITY TEST: Verifies tenant isolation works correctly.
 * 
 * This endpoint should:
 * - Return 403 if user tries to access data from different tenant
 * - Only return data from user's own tenant
 * 
 * @module app/api/test/tenant-isolation
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { setTenantContext } from '@/lib/middleware/tenant';

/**
 * GET /api/test/tenant-isolation
 * 
 * Test endpoint to verify tenant isolation
 * Query params:
 * - ?targetTenantId=uuid (optional) - Try to access this tenant's data
 * 
 * Headers:
 * - x-tenant-id: Tenant ID to test with (required)
 * 
 * Note: This endpoint works without full auth for testing purposes
 */
export async function GET(req: NextRequest) {
  try {
    // Get tenant ID from header (for testing without full auth)
    const userTenantId = req.headers.get('x-tenant-id');
    
    if (!userTenantId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TENANT_REQUIRED',
            message: 'x-tenant-id header is required for testing',
          },
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetTenantId = searchParams.get('targetTenantId');

    // Set tenant context
    await setTenantContext(userTenantId);

    // If targetTenantId is provided and different from user's tenant, should fail
    if (targetTenantId && targetTenantId !== userTenantId) {
      // Try to access data from different tenant (should be blocked)
      const foreignData = await db.user.findFirst({
        where: {
          tenantId: targetTenantId, // Different tenant!
        },
        select: {
          id: true,
          email: true,
          tenantId: true,
        },
      });

      // This should return null due to tenant isolation
      // In production, middleware would prevent this query entirely
      if (foreignData) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TENANT_ISOLATION_VIOLATION',
              message: 'SECURITY ISSUE: Able to access data from different tenant!',
            },
            test: {
              userTenant: userTenantId,
              attemptedTenant: targetTenantId,
              foreignDataFound: true,
            },
          },
          { status: 500 }
        );
      }

      return successResponse({
        message: 'Tenant isolation working correctly',
        test: 'Attempted to access different tenant data',
        result: 'Blocked - returned null',
        userTenant: userTenantId,
        attemptedTenant: targetTenantId,
        isolationStatus: 'PASSED',
      });
    }

    // Get user's own data (should work)
    const ownData = await db.user.findMany({
      where: {
        tenantId: userTenantId, // Own tenant
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
      },
      take: 5,
    });

    return successResponse({
      message: 'Tenant isolation test',
      userTenant: userTenantId,
      ownTenantData: ownData,
      isolationStatus: 'Working correctly',
      test: targetTenantId ? 'Own tenant access' : 'No cross-tenant test',
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
