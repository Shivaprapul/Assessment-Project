/**
 * Audit Logging Middleware
 * 
 * Logs all data access and modifications for compliance.
 * Required for DPDP Act 2023 compliance.
 * 
 * @module lib/middleware/audit
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from './auth';

export enum Action {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
}

export enum ResourceType {
  STUDENT = 'STUDENT',
  ASSESSMENT = 'ASSESSMENT',
  REPORT = 'REPORT',
  CONSENT = 'CONSENT',
  ACTIVITY = 'ACTIVITY',
}

/**
 * Logs an audit event
 * 
 * @param userId - User ID performing the action
 * @param tenantId - Tenant ID
 * @param action - Action performed
 * @param resourceType - Type of resource
 * @param resourceId - Resource ID
 * @param req - Request object for IP and user agent
 * @param success - Whether the action was successful
 * @param errorMessage - Error message if failed
 * @param metadata - Additional metadata
 */
export async function logAuditEvent(
  userId: string,
  tenantId: string,
  action: Action,
  resourceType: ResourceType,
  resourceId: string,
  req: NextRequest,
  success: boolean,
  errorMessage?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await db.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        resourceType,
        resourceId,
        ipAddress,
        userAgent,
        success,
        errorMessage,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break the application
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Middleware that automatically logs API requests
 * 
 * @param handler - API route handler function
 * @returns Wrapped handler with audit logging
 */
export function withAuditLogging<T extends any[]>(
  handler: (
    req: NextRequest,
    user: any,
    ...args: T
  ) => Promise<Response>,
  resourceType: ResourceType,
  getResourceId: (req: NextRequest) => string
) {
  return async (req: NextRequest, user: any, ...args: T): Promise<Response> => {
    const startTime = Date.now();
    let success = true;
    let errorMessage: string | undefined;

    try {
      const response = await handler(req, user, ...args);
      success = response.status < 400;

      // Extract action from HTTP method
      const action = getActionFromMethod(req.method);

      // Log the audit event
      await logAuditEvent(
        user.id,
        user.tenantId,
        action,
        resourceType,
        getResourceId(req),
        req,
        success,
        errorMessage,
        {
          method: req.method,
          path: req.nextUrl.pathname,
          responseTime: Date.now() - startTime,
        }
      );

      return response;
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const action = getActionFromMethod(req.method);
      await logAuditEvent(
        user.id,
        user.tenantId,
        action,
        resourceType,
        getResourceId(req),
        req,
        success,
        errorMessage
      );

      throw error;
    }
  };
}

function getActionFromMethod(method: string): Action {
  switch (method) {
    case 'GET':
      return Action.READ;
    case 'POST':
      return Action.CREATE;
    case 'PUT':
    case 'PATCH':
      return Action.UPDATE;
    case 'DELETE':
      return Action.DELETE;
    default:
      return Action.READ;
  }
}

