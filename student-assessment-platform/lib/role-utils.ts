/**
 * Role Utilities
 * 
 * Helper functions for role-based access control and UI rendering.
 * 
 * @module lib/role-utils
 */

export type UserRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'SCHOOL_ADMIN' | 'PLATFORM_ADMIN';

/**
 * Check if user has student role
 */
export function isStudent(role: string): boolean {
  return role === 'STUDENT';
}

/**
 * Check if user has parent role
 */
export function isParent(role: string): boolean {
  return role === 'PARENT';
}

/**
 * Check if user has teacher role
 */
export function isTeacher(role: string): boolean {
  return role === 'TEACHER' || role === 'SCHOOL_ADMIN';
}

/**
 * Check if user can access student gaming UI
 */
export function canAccessStudentUI(role: string): boolean {
  return isStudent(role);
}

/**
 * Check if user can access parent reports
 */
export function canAccessParentReports(role: string): boolean {
  return isParent(role) || isTeacher(role);
}

/**
 * Check if user can access teacher reports
 */
export function canAccessTeacherReports(role: string): boolean {
  return isTeacher(role);
}

/**
 * Get role-specific navigation items
 */
export function getRoleNavItems(role: string) {
  if (isStudent(role)) {
    return {
      showDashboard: true,
      showAssessments: true,
      showExplorer: true,
      showFacilitator: true,
      showProfile: true,
      showParentTracker: false,
      showTeacherTracker: false,
      showCommunity: true,
      showSettings: true,
    };
  }
  
  if (isParent(role)) {
    return {
      showDashboard: false,
      showAssessments: false,
      showExplorer: false,
      showFacilitator: false,
      showProfile: true,
      showParentTracker: true,
      showTeacherTracker: false,
      showCommunity: false,
      showSettings: true,
    };
  }
  
  if (isTeacher(role)) {
    return {
      showDashboard: false,
      showAssessments: false,
      showExplorer: false,
      showFacilitator: false,
      showProfile: true,
      showParentTracker: false,
      showTeacherTracker: true,
      showCommunity: false,
      showSettings: true,
    };
  }
  
  // Default: admin can see everything
  return {
    showDashboard: true,
    showAssessments: true,
    showExplorer: true,
    showFacilitator: true,
    showProfile: true,
    showParentTracker: true,
    showTeacherTracker: true,
    showCommunity: true,
    showSettings: true,
  };
}

