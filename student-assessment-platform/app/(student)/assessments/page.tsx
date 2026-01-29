/**
 * Assessments List Page
 * 
 * Displays all 8 assessment games with completion status.
 * Students can start unlocked games from here.
 * 
 * @module app/(student)/assessments
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
  Lock, 
  CheckCircle2, 
  Play,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserMenu } from '@/components/UserMenu';
import { cn } from '@/lib/utils';

interface AssessmentGame {
  id: string;
  name: string;
  description: string;
  estimatedTime: number;
  difficulty: number;
  orderIndex: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  inProgressAttemptId?: string | null;
  thumbnail?: string;
}

interface UserData {
  name: string;
  email: string;
  avatar?: string;
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [games, setGames] = useState<AssessmentGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingGame, setStartingGame] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchAssessments();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/students/me', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.success && data.data?.user) {
          setUser({
            name: data.data.user.name,
            email: data.data.user.email,
            avatar: data.data.user.avatar,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_ASSESSMENTS === 'true';

  const fetchAssessments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In demo mode, get all games and unlock them all
      if (isDemoMode) {
        const response = await fetch('/api/assessments', {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: 'Failed to fetch assessments' } }));
          throw new Error(errorData.error?.message || 'Failed to fetch assessments');
        }

        const data = await response.json();
        if (data?.success) {
          // Unlock all games in demo mode
          const unlockedGames = data.data.map((game: any) => ({
            ...game,
            isUnlocked: true, // Force unlock all games in demo mode
          }));
          setGames(unlockedGames);
        } else {
          throw new Error(data.error || 'Invalid response from server');
        }
      } else {
        // Regular mode - use existing logic
        const response = await fetch('/api/assessments', {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: 'Failed to fetch assessments' } }));
          throw new Error(errorData.error?.message || 'Failed to fetch assessments');
        }

        const data = await response.json();
        if (data?.success) {
          setGames(data.data);
        } else {
          throw new Error(data.error || 'Invalid response from server');
        }
      }
    } catch (err: any) {
      console.error('Error fetching assessments:', err);
      setError(err.message || 'Failed to load assessments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async (gameId: string, attemptId?: string) => {
    setStartingGame(gameId);

    try {
      // Use demo endpoint in demo mode
      const endpoint = isDemoMode 
        ? '/api/demo/assessments/start'
        : `/api/assessments/${gameId}/start`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ gameId }),
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to start assessment' }));
        throw new Error(errorData.error || 'Failed to start assessment');
      }

      const data = await response.json();
      if (data?.success) {
        // Navigate to game page with attempt ID
        router.push(`/assessments/${gameId}?attemptId=${data.data.attemptId}`);
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error starting assessment:', err);
      alert(err.message || 'Failed to start assessment. Please try again.');
    } finally {
      setStartingGame(null);
    }
  };

  const handleAbandonAttempt = async (gameId: string, attemptId: string) => {
    if (!confirm('Are you sure you want to abandon this attempt? You can start a new one after abandoning.')) {
      return;
    }

    try {
      const response = await fetch(`/api/assessments/attempts/${attemptId}/abandon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to abandon attempt');
      }

      // Refresh the assessments list
      fetchAssessments();
    } catch (err: any) {
      console.error('Error abandoning attempt:', err);
      alert(err.message || 'Failed to abandon attempt. Please try again.');
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

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Logo />
            <Skeleton className="h-10 w-20" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error && games.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Error Loading Assessments</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchAssessments} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedCount = games.filter(g => g.isCompleted).length;
  const totalGames = games.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            {user && (
              <UserMenu 
                user={user}
                onLogout={handleLogout}
              />
            )}
            {!user && (
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Assessment Games
            </h1>
            <p className="text-gray-600">
              Complete all 8 games to discover your strengths and growth areas
            </p>
            {totalGames > 0 && (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{completedCount} of {totalGames} completed</span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div className="text-sm text-gray-600">
                  {Math.round((completedCount / totalGames) * 100)}% complete
                </div>
              </div>
            )}
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <Card
                key={game.id}
                className={cn(
                  "relative overflow-hidden transition-all duration-300",
                  game.isUnlocked
                    ? "hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                    : "opacity-60",
                  game.isCompleted && "border-green-200 bg-green-50/30"
                )}
              >
                {/* Completion Badge */}
                {game.isCompleted && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                )}

                {/* Lock Overlay */}
                {!game.isUnlocked && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="text-center">
                      <Lock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-600">
                        Complete previous games to unlock
                      </p>
                    </div>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{game.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          #{game.orderIndex}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {game.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Game Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{game.estimatedTime} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>Difficulty: {game.difficulty}/5</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {game.inProgressAttemptId ? (
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={() => handleStartGame(game.id, game.inProgressAttemptId || undefined)}
                        disabled={startingGame === game.id}
                        variant="default"
                      >
                        {startingGame === game.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Resuming...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Resume Game
                          </>
                        )}
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleAbandonAttempt(game.id, game.inProgressAttemptId!)}
                        disabled={startingGame === game.id}
                      >
                        Abandon
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleStartGame(game.id)}
                      disabled={!game.isUnlocked || startingGame === game.id}
                      variant={game.isCompleted ? 'outline' : 'default'}
                    >
                      {startingGame === game.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : game.isCompleted ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Play Again
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Game
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress Summary */}
          {completedCount === totalGames && totalGames > 0 && (
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">
                      🎉 All Assessments Complete!
                    </h3>
                    <p className="text-green-50">
                      Great work! Your results are being processed. Check your dashboard for insights.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

