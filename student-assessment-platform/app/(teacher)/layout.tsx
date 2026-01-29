/**
 * Teacher Portal Layout
 * 
 * Provides role-based layout for teacher users with navigation and route guards.
 * 
 * @module app/(teacher)/layout
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { isTeacher } from '@/lib/role-utils';
import { getSession } from '@/lib/session';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Immediate console log - runs on every render
  console.log('[TeacherLayout] RENDER - Component is executing');
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    // Wait for NextAuth to finish loading
    if (status === 'loading') {
      console.log('[TeacherLayout] NextAuth still loading...');
      return;
    }

    console.log('[TeacherLayout] Checking authorization...');
    console.log('[TeacherLayout] NextAuth session:', session?.user ? 'exists' : 'none');
    console.log('[TeacherLayout] NextAuth status:', status);

    // Check both NextAuth session and localStorage session
    let userRole: string | null = null;

    // First check NextAuth session
    if (session?.user) {
      userRole = (session.user as any).role;
      console.log('[TeacherLayout] NextAuth role:', userRole);
    } else {
      // Fallback to localStorage session (for OTP login)
      const localSession = getSession();
      console.log('[TeacherLayout] LocalStorage session:', localSession?.user ? 'exists' : 'none');
      if (localSession?.user) {
        userRole = localSession.user.role;
        console.log('[TeacherLayout] LocalStorage role:', userRole);
      }
    }

    // Check if user is a teacher
    const debugMsg = `Status: ${status}\nNextAuth: ${session?.user ? 'Yes' : 'No'}\nLocalStorage: ${getSession()?.user ? 'Yes' : 'No'}\nRole: ${userRole || 'None'}\nIsTeacher: ${userRole ? isTeacher(userRole) : 'N/A'}`;
    setDebugInfo(debugMsg);

    if (userRole && isTeacher(userRole)) {
      console.log('[TeacherLayout] ✅ Authorized as teacher');
      setIsAuthorized(true);
    } else if (userRole) {
      // User exists but is not a teacher - redirect
      console.log('[TeacherLayout] ❌ User is not a teacher, redirecting to dashboard');
      setTimeout(() => router.push('/dashboard'), 2000); // Delay to show debug info
      setIsAuthorized(false);
    } else {
      // No session found - redirect to login
      console.log('[TeacherLayout] ❌ No session found, redirecting to login');
      setTimeout(() => router.push('/login'), 2000); // Delay to show debug info
      setIsAuthorized(false);
    }
  }, [session, status, router]);

  // Show loading while checking
  if (status === 'loading' || isAuthorized === null) {
    console.log('[TeacherLayout] Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          {debugInfo && <p className="text-xs text-gray-400 mt-2">{debugInfo}</p>}
          <p className="text-xs text-gray-400 mt-4">If this doesn't change, check console for errors</p>
        </div>
      </div>
    );
  }

  // Only render if authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <p className="text-gray-600 mb-4">Unauthorized access. Redirecting...</p>
          <p className="text-sm text-gray-400 mb-4">If you're a teacher, please log in again.</p>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
              <p className="font-semibold mb-2">Debug Info:</p>
              <pre className="whitespace-pre-wrap">{debugInfo}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

