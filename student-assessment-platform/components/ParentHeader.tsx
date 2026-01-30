/**
 * Parent Header Component
 * 
 * Header for parent portal with avatar dropdown menu.
 * 
 * @module components/ParentHeader
 */

'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, User } from 'lucide-react';

interface ParentHeaderProps {
  className?: string;
}

export function ParentHeader({ className = '' }: ParentHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = async () => {
    try {
      // Use NextAuth signout endpoint
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Error signing out:', err);
    }
    // Clear localStorage session if exists
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      localStorage.removeItem('session_token');
    }
    // Redirect to login
    router.push('/login');
  };

  const parentName = session?.user?.name || 'Parent';
  const parentEmail = session?.user?.email || '';
  const parentAvatar = (session?.user as any)?.avatar || null;

  const initials = parentName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200 ${className}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">Parent Portal</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Parent Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full hover:bg-gray-100 p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarImage src={parentAvatar || undefined} alt={parentName} />
                  <AvatarFallback className="bg-purple-600 text-white text-sm font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {parentName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{parentName}</p>
                  <p className="text-xs leading-none text-gray-500">{parentEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/parent/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/parent/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

