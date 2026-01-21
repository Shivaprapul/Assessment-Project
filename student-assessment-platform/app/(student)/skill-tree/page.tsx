/**
 * Full Skill Tree Page
 * 
 * Displays the complete interactive skill tree visualization.
 * 
 * @module app/(student)/skill-tree
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SkillTree } from '@/components/skill-tree/SkillTree';
import { getSession } from '@/lib/session';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SkillTreeData {
  studentId: string;
  lastUpdated: string;
  categories: Array<{
    category: string;
    name: string;
    score: number;
    level: string;
    icon: string;
    trend: string;
    evidence?: string[];
    history?: Array<{ date: string; score: number }>;
  }>;
}

export default function SkillTreePage() {
  const router = useRouter();
  const [skillTree, setSkillTree] = useState<SkillTreeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session.user || !session.tenant) {
      router.push('/login');
      return;
    }

    const tenantId = session.tenant.id;

    const fetchSkillTree = async () => {
      try {
        const response = await fetch('/api/students/me/skill-tree', {
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId,
          },
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to fetch skill tree');
        }

        if (data.success && data.data) {
          setSkillTree(data.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load skill tree');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkillTree();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your skill tree...</p>
        </div>
      </div>
    );
  }

  if (error || !skillTree) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Skill tree not available'}</p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>
        <SkillTree data={skillTree} />
      </div>
    </div>
  );
}

