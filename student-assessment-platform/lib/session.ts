/**
 * Simple Session Management
 * 
 * Temporary session management using localStorage.
 * In production, this should use NextAuth sessions.
 * 
 * @module lib/session
 */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  avatar?: string;
}

export interface SessionTenant {
  id: string;
  name: string;
  subdomain: string;
}

/**
 * Store session data in localStorage
 */
export function setSession(user: SessionUser, tenant: SessionTenant) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('tenant', JSON.stringify(tenant));
  localStorage.setItem('session_token', `temp_${user.id}_${Date.now()}`);
}

/**
 * Get session data from localStorage
 */
export function getSession(): { user: SessionUser | null; tenant: SessionTenant | null } {
  if (typeof window === 'undefined') {
    return { user: null, tenant: null };
  }

  const userStr = localStorage.getItem('user');
  const tenantStr = localStorage.getItem('tenant');

  return {
    user: userStr ? JSON.parse(userStr) : null,
    tenant: tenantStr ? JSON.parse(tenantStr) : null,
  };
}

/**
 * Clear session data
 */
export function clearSession() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('user');
  localStorage.removeItem('tenant');
  localStorage.removeItem('session_token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('user');
}

