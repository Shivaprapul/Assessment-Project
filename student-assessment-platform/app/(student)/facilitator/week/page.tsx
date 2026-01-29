/**
 * Facilitator Weekly Plan View
 * 
 * Shows the full 7-day weekly plan with daily quests.
 * 
 * @module app/(student)/facilitator/week
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
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Target
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserMenu } from '@/components/UserMenu';

interface DailyPlanItem {
  dayIndex: number;
  date: string;
  quests: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    estimatedTime: number;
    skillFocus: string[];
  }>;
}

interface WeeklyPlan {
  weekStartDate: string;
  weekEndDate: string;
  focusSkills: string[];
  dailyTimeBudget: number;
  dailyPlan: DailyPlanItem[];
  goalReadinessDelta?: number;
}

export default function WeeklyPlanPage() {
  const router = useRouter();
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch weekly plan
      const weekResponse = await fetch('/api/facilitator/week', {
        credentials: 'include',
      });

      if (weekResponse.status === 401 || weekResponse.status === 403) {
        router.push('/login');
        return;
      }

      if (!weekResponse.ok) {
        const errorData = await weekResponse.json();
        throw new Error(errorData.error || 'Failed to load weekly plan');
      }

      const weekData = await weekResponse.json();
      if (weekData?.success) {
        setWeeklyPlan(weekData.data);
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
      setError(err.message || 'Failed to load weekly plan');
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

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getQuestTypeIcon = (type: string) => {
    switch (type) {
      case 'mini_game':
        return '🎮';
      case 'reflection':
        return '📝';
      case 'choice_scenario':
        return '💡';
      default:
        return '📋';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Logo />
            <Skeleton className="h-10 w-20" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !weeklyPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Logo />
            <Button variant="ghost" onClick={() => router.push('/facilitator')}>
              Back to Facilitator
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <CardTitle>Error Loading Weekly Plan</CardTitle>
                </div>
                <CardDescription>{error || 'Failed to load weekly plan'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={fetchData} className="w-full">
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/facilitator')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
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
          <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-6 w-6" />
                    <h1 className="text-2xl font-bold">Weekly Plan</h1>
                  </div>
                  <p className="text-purple-100">
                    {new Date(weeklyPlan.weekStartDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                    })} - {new Date(weeklyPlan.weekEndDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-purple-100 mb-1">Daily Time</div>
                  <div className="text-2xl font-bold">{weeklyPlan.dailyTimeBudget} min</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Focus Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Focus Skills This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {weeklyPlan.focusSkills.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm">
                    {skill.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
              {weeklyPlan.goalReadinessDelta && (
                <p className="text-sm text-gray-600 mt-3">
                  Expected goal readiness improvement: +{weeklyPlan.goalReadinessDelta.toFixed(1)}%
                </p>
              )}
            </CardContent>
          </Card>

          {/* Daily Plans */}
          <div className="space-y-4">
            {weeklyPlan.dailyPlan.map((dayPlan) => (
              <Card key={dayPlan.dayIndex}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {getDayName(dayPlan.date)} - {new Date(dayPlan.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </CardTitle>
                      <CardDescription>
                        {dayPlan.quests.length} quest{dayPlan.quests.length !== 1 ? 's' : ''} • ~{dayPlan.quests.reduce((sum, q) => sum + q.estimatedTime, 0)} min
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dayPlan.quests.map((quest, idx) => (
                      <div
                        key={quest.id}
                        className="flex items-start gap-3 p-3 border rounded-lg"
                      >
                        <span className="text-2xl">{getQuestTypeIcon(quest.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{quest.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {quest.type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {quest.estimatedTime} min
                            </div>
                            {quest.skillFocus && quest.skillFocus.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {quest.skillFocus[0]?.replace(/_/g, ' ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

