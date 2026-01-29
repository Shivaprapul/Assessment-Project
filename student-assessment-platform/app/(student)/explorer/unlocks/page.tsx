/**
 * Career Unlocks Gallery
 * 
 * Displays all unlocked careers in a gallery view.
 * 
 * @module app/(student)/explorer/unlocks
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Trophy,
  ArrowRight,
  Compass,
  Sparkles
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserMenu } from '@/components/UserMenu';

interface CareerUnlock {
  id: string;
  careerId: string;
  unlockedAt: string;
  reasonEvidence: any;
  linkedSkills: string[];
  career: {
    id: string;
    title: string;
    shortPitch: string;
    icon: string;
    rarityTier: string;
  } | null;
}

interface UnlocksData {
  unlocks: CareerUnlock[];
  total: number;
}

interface UserData {
  name: string;
  email: string;
  avatar?: string;
}

export default function UnlocksPage() {
  const router = useRouter();
  const [unlocksData, setUnlocksData] = useState<UnlocksData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch unlocks
      const unlocksResponse = await fetch('/api/explorer/unlocks', {
        credentials: 'include',
      });

      if (unlocksResponse.status === 401 || unlocksResponse.status === 403) {
        router.push('/login');
        return;
      }

      if (!unlocksResponse.ok) {
        const errorData = await unlocksResponse.json();
        throw new Error(errorData.error || 'Failed to load unlocks');
      }

      const unlocksDataResponse = await unlocksResponse.json();
      if (unlocksDataResponse?.success) {
        setUnlocksData(unlocksDataResponse.data);
      } else {
        throw new Error('Invalid response from server');
      }

      // Fetch user data
      const userResponse = await fetch('/api/students/me', {
        credentials: 'include',
      });

      if (userResponse.ok) {
        const userDataResponse = await userResponse.json();
        if (userDataResponse?.success && userDataResponse?.data?.user) {
          setUserData({
            name: userDataResponse.data.user.name,
            email: userDataResponse.data.user.email,
            avatar: userDataResponse.data.user.avatar,
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load unlocks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Error signing out:', err);
    }
    router.push('/login');
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMMON':
        return 'bg-gray-100 text-gray-700';
      case 'EMERGING':
        return 'bg-blue-100 text-blue-700';
      case 'ADVANCED':
        return 'bg-purple-100 text-purple-700';
      case 'FRONTIER':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Logo />
            <Skeleton className="h-10 w-20" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !unlocksData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Logo />
            <Button variant="ghost" onClick={() => router.push('/explorer')}>
              Back to Explorer
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <CardTitle>Error Loading Unlocks</CardTitle>
                </div>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={fetchData} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const unlocks = unlocksData?.unlocks || [];
  const total = unlocksData?.total || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/explorer')}>
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Explorer
            </Button>
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            {userData && (
              <UserMenu 
                user={userData}
                onLogout={handleLogout}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Card */}
          <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-6 w-6" />
                    <h1 className="text-2xl font-bold">Career Unlocks</h1>
                  </div>
                  <p className="text-purple-100">
                    {total === 0 
                      ? 'Complete quests to unlock careers aligned with your skills'
                      : `You've unlocked ${total} career${total !== 1 ? 's' : ''} so far!`
                    }
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{total}</div>
                  <div className="text-sm text-purple-100">Unlocked</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unlocks Grid */}
          {unlocks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unlocks.map((unlock) => {
                if (!unlock.career) return null;

                return (
                  <Card 
                    key={unlock.id}
                    className="hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => router.push(`/explorer/careers/${unlock.careerId}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{unlock.career.icon}</span>
                          <div>
                            <CardTitle className="text-lg">{unlock.career.title}</CardTitle>
                            <Badge className={`mt-2 ${getRarityColor(unlock.career.rarityTier)}`}>
                              {unlock.career.rarityTier}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">
                        {unlock.career.shortPitch}
                      </CardDescription>
                      {unlock.reasonEvidence?.reason && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Why unlocked:</span>{' '}
                            {unlock.reasonEvidence.reason}
                          </p>
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/explorer/careers/${unlock.careerId}`);
                        }}
                      >
                        Explore Career
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Careers Unlocked Yet</h3>
                <p className="text-gray-600 mb-6">
                  Complete quests in Explorer Mode to unlock careers aligned with your skills and interests.
                </p>
                <Button onClick={() => router.push('/explorer')}>
                  <Compass className="h-4 w-4 mr-2" />
                  Go to Explorer
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

