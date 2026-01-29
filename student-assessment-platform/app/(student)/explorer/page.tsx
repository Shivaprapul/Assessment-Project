/**
 * Explorer Mode Hub
 * 
 * Today's Quests page showing daily quests with completion status.
 * 
 * @module app/(student)/explorer
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Play,
  Clock,
  Compass,
  Sparkles,
  Trophy,
  ArrowRight,
  Gamepad2,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserMenu } from '@/components/UserMenu';
import { cn } from '@/lib/utils';

interface Quest {
  id: string;
  type: 'mini_game' | 'reflection' | 'choice_scenario';
  title: string;
  description: string;
  estimatedTime: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt: string | null;
  attemptId?: string | null;
}

interface TodayQuests {
  date: string;
  quests: Quest[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

interface UserData {
  name: string;
  email: string;
  avatar?: string;
  currentGrade?: number;
}

export default function ExplorerPage() {
  const router = useRouter();
  const [todayQuests, setTodayQuests] = useState<TodayQuests | null>(null);
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
      // Fetch today's quests
      const questsResponse = await fetch('/api/explorer/today', {
        credentials: 'include',
      });

      if (questsResponse.status === 401 || questsResponse.status === 403) {
        router.push('/login');
        return;
      }

      if (!questsResponse.ok) {
        const errorData = await questsResponse.json();
        throw new Error(errorData.error || 'Failed to load today\'s quests');
      }

      const questsData = await questsResponse.json();
      if (questsData?.success) {
        setTodayQuests(questsData.data);
      } else {
        throw new Error('Invalid response from server');
      }

      // Fetch user data
      const userResponse = await fetch('/api/students/me', {
        credentials: 'include',
      });

      if (userResponse.ok) {
        const userDataResponse = await userResponse.json();
        if (userDataResponse?.success && userDataResponse?.data) {
          setUserData({
            name: userDataResponse.data.user.name,
            email: userDataResponse.data.user.email,
            avatar: userDataResponse.data.user.avatar,
            currentGrade: userDataResponse.data.currentGrade || userDataResponse.data.grade,
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load explorer data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuest = async (questId: string) => {
    try {
      const response = await fetch(`/api/explorer/quests/${questId}/start`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start quest');
      }

      const data = await response.json();
      if (data?.success) {
        // Navigate to quest runner
        router.push(`/explorer/quests/${questId}?attemptId=${data.data.attemptId}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error starting quest:', err);
      alert(err.message || 'Failed to start quest');
    }
  };

  const getQuestIcon = (type: string) => {
    switch (type) {
      case 'mini_game':
        return <Gamepad2 className="h-5 w-5" />;
      case 'reflection':
        return <BookOpen className="h-5 w-5" />;
      case 'choice_scenario':
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <Compass className="h-5 w-5" />;
    }
  };

  const getQuestTypeLabel = (type: string) => {
    switch (type) {
      case 'mini_game':
        return 'Mini Game';
      case 'reflection':
        return 'Reflection';
      case 'choice_scenario':
        return 'Scenario';
      default:
        return type;
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

  // Loading state
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
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error && !todayQuests) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Logo />
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <CardTitle>Error Loading Explorer</CardTitle>
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

  const completedCount = todayQuests?.progress.completed || 0;
  const totalQuests = todayQuests?.progress.total || 0;
  const progressPercentage = todayQuests?.progress.percentage || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Dashboard
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Card */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Compass className="h-6 w-6" />
                    <h1 className="text-2xl font-bold">Explorer Mode</h1>
                  </div>
                  <p className="text-blue-100">
                    {todayQuests?.date 
                      ? new Date(todayQuests.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'Today\'s Quests'}
                  </p>
                  {/* Grade-context messaging (subtle) */}
                  {userData?.currentGrade && (
                    <p className="text-blue-50 text-sm mt-1">
                      {userData.currentGrade === 8 && 'Explore & discover new interests'}
                      {userData.currentGrade === 9 && 'Build consistency & structure in your learning'}
                      {userData.currentGrade === 10 && 'Sharpen & apply your skills'}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{completedCount}/{totalQuests}</div>
                  <div className="text-sm text-blue-100">Completed</div>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={progressPercentage} className="h-2 bg-white/20" />
              </div>
            </CardContent>
          </Card>

          {/* Quests List */}
          {todayQuests && todayQuests.quests.length > 0 ? (
            <div className="space-y-4">
              {todayQuests.quests.map((quest) => (
                <Card 
                  key={quest.id}
                  className={cn(
                    "transition-all hover:shadow-lg",
                    quest.status === 'COMPLETED' && "bg-green-50 border-green-200"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={cn(
                            "p-2 rounded-lg",
                            quest.status === 'COMPLETED' 
                              ? "bg-green-100 text-green-700" 
                              : "bg-blue-100 text-blue-700"
                          )}>
                            {getQuestIcon(quest.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">{quest.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {getQuestTypeLabel(quest.type)}
                              </Badge>
                              {quest.status === 'COMPLETED' && (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {quest.estimatedTime} min
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {quest.status === 'COMPLETED' ? (
                          <Button variant="outline" disabled>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Completed
                          </Button>
                        ) : quest.status === 'IN_PROGRESS' ? (
                          <Button 
                            onClick={() => handleStartQuest(quest.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleStartQuest(quest.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Compass className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Quests Available</h3>
                <p className="text-gray-600">Check back tomorrow for new quests!</p>
              </CardContent>
            </Card>
          )}

          {/* Unlocks CTA */}
          {completedCount > 0 && (
            <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5" />
                      <h2 className="text-xl font-bold">Discover Your Careers</h2>
                    </div>
                    <p className="text-purple-50">
                      Complete quests to unlock new career paths aligned with your skills
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-purple-50"
                    onClick={() => router.push('/explorer/unlocks')}
                  >
                    View Unlocks
                    <Trophy className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

