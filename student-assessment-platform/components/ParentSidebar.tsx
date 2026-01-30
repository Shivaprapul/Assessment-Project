/**
 * Parent Sidebar Navigation Component
 * 
 * Left sidebar navigation for parent portal.
 * 
 * @module components/ParentSidebar
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Brain, Sparkles, Compass, Activity, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParentSidebarProps {
  currentPath: string;
}

const navItems = [
  { path: '/parent', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/parent/thinking', label: 'Thinking', icon: Brain },
  { path: '/parent/talents', label: 'Talents', icon: Sparkles },
  { path: '/parent/fields', label: 'Fields', icon: Compass },
  { path: '/parent/activity', label: 'Activity', icon: Activity },
];

export function ParentSidebar({ currentPath }: ParentSidebarProps) {
  const router = useRouter();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4">
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || 
            (item.path === '/parent' && currentPath === '/parent');
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                isActive
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive ? 'text-purple-600' : 'text-gray-500')} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

