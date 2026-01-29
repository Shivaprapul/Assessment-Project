/**
 * useUserRole Hook
 * 
 * Client-side hook to get current user role from session.
 * 
 * @module hooks/useUserRole
 */

'use client';

import { useState, useEffect } from 'react';

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchRole() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.user?.role) {
            setRole(data.data.user.role);
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRole();
  }, []);
  
  return { role, loading };
}

