/**
 * Parent Portal Layout
 * 
 * Layout for parent portal with role-based access control and navigation.
 * 
 * @module app/(parent)/layout
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { ParentHeader } from '@/components/ParentHeader';
import { ParentSidebar } from '@/components/ParentSidebar';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check NextAuth session
        let userRole = (session?.user as any)?.role;
        
        // Fallback: Check localStorage (for OTP login)
        if (!userRole && typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser);
              userRole = user.role;
            } catch (e) {
              console.error('Error parsing stored user:', e);
            }
          }
        }

        if (userRole === 'PARENT') {
          setIsAuthorized(true);
        } else if (userRole) {
          // Not a parent, redirect to appropriate page
          router.push('/login');
        } else if (status === 'unauthenticated') {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };

    if (status !== 'loading') {
      checkAuth();
    }
  }, [session, status, router]);

  if (isChecking || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unauthorized. Please log in as a parent.</p>
          <button
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:underline"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <ParentHeader />
      <div className="flex">
        <ParentSidebar currentPath={pathname || ''} />
        <main className="flex-1 p-6">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          }>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

