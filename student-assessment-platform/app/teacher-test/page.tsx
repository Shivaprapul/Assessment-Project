/**
 * Simple Test Page for Teacher Route
 * 
 * This is a minimal test to verify routing works
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/session';

export default function TeacherTestPage() {
  const router = useRouter();

  useEffect(() => {
    console.log('[TeacherTestPage] Component mounted');
    const session = getSession();
    console.log('[TeacherTestPage] Session:', session);
    
    if (session?.user?.role === 'TEACHER' || session?.user?.role === 'SCHOOL_ADMIN') {
      console.log('[TeacherTestPage] Teacher detected, redirecting to /teacher');
      router.replace('/teacher');
    } else {
      console.log('[TeacherTestPage] Not a teacher, redirecting to login');
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Testing teacher route...</p>
        <p className="text-sm text-gray-400 mt-2">Check console for logs</p>
      </div>
    </div>
  );
}

