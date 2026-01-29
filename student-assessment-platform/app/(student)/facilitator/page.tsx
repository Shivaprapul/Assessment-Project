/**
 * Facilitator Mode Hub
 * 
 * Main hub for Facilitator Mode showing goal, weekly plan, today's quests, and progress.
 * 
 * @module app/(student)/facilitator
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
  Target,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Play,
  ArrowRight,
  Edit,
  Trophy
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserMenu } from '@/components/UserMenu';

interface Goal {
  id: string;
  goalTitle: string;
  goalType: string;
  timeAvailability: number;
  goalReadiness: number;
}

interface WeeklyPlan {
  weekStartDate: string;
  weekEndDate: string;
  focusSkills: string[];
  dailyTimeBudget: number;
  dailyPlan: any[];
}

interface Quest {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
}

interface ProgressData {
  goalReadiness: number;
  goalReadinessLastUpdated: string | null;
  skillScores: Array<{
    category: string;
    currentScore: number;
    trend: string;
  }>;
  mostImprovedSkill: string | null;
  streak: number;
  totalQuestsCompleted: number;
}

export default function FacilitatorPage() {
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [todayQuests, setTodayQuests] = useState<Quest[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
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
      // Fetch goal
      const goalResponse = await fetch('/api/facilitator/goal', {
        credentials: 'include',
      });

      if (goalResponse.status === 401 || goalResponse.status === 403) {
        router.push('/login');
        return;
      }

      if (goalResponse.ok) {
        const goalData = await goalResponse.json();
        if (goalData?.success && goalData.data) {
          // Goal exists - fetch all related data
          setGoal(goalData.data);
          
          // Fetch weekly plan
          const weekResponse = await fetch('/api/facilitator/week', {
            credentials: 'include',
          });
          if (weekResponse.ok) {
            const weekData = await weekResponse.json();
            if (weekData?.success) {
              setWeeklyPlan(weekData.data);
            }
          }

          // Fetch today's quests
          const todayResponse = await fetch('/api/facilitator/today', {
            credentials: 'include',
          });
          if (todayResponse.ok) {
            const todayData = await todayResponse.json();
            if (todayData?.success) {
              setTodayQuests(todayData.data.quests || []);
            }
          }

          // Fetch progress
          const progressResponse = await fetch('/api/facilitator/progress', {
            credentials: 'include',
          });
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            if (progressData?.success) {
              setProgress(progressData.data);
            }
          }
        } else if (goalData?.success && !goalData.data) {
          // No goal set - explicitly set to null to show setup card
          setGoal(null);
          setWeeklyPlan(null);
          setTodayQuests([]);
          setProgress(null);
        }
      } else {
        // Error fetching goal - might be no goal
        try {
          const goalData = await goalResponse.json();
          if (goalData?.error?.includes('No facilitator goal') || goalResponse.status === 400) {
            // No goal set - explicitly set to null
            setGoal(null);
            setWeeklyPlan(null);
            setTodayQuests([]);
            setProgress(null);
          }
        } catch {
          // If JSON parse fails, assume no goal
          setGoal(null);
          setWeeklyPlan(null);
          setTodayQuests([]);
          setProgress(null);
        }
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
      setError(err.message || 'Failed to load facilitator data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuest = async (questId: string) => {
    try {
      const response = await fetch(`/api/facilitator/quests/${questId}/start`, {
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
        router.push(`/facilitator/quests/${questId}?attemptId=${data.data.attemptId}`);
      }
    } catch (err: any) {
      console.error('Error starting quest:', err);
      alert(err.message || 'Failed to start quest');
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
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error && !goal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
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
                  <CardTitle>Error Loading Facilitator</CardTitle>
                </div>
                <CardDescription>{error}</CardDescription>
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

  const completedQuests = todayQuests.filter(q => q.status === 'COMPLETED').length;
  const totalQuests = todayQuests.length;
  const questProgress = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
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
        <div className="max-w-6xl mx-auto space-y-6">
          {/* No Goal - Setup Card */}
          {!goal && !isLoading && (
            <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0">
              <CardContent className="p-8 text-center">
                <Target className="h-16 w-16 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-4">Welcome to Facilitator Mode!</h1>
                <p className="text-purple-100 mb-6 text-lg">
                  Set a goal to get started with personalized training
                </p>
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-purple-50"
                  onClick={() => router.push('/facilitator/goal-setup')}
                >
                  <Target className="h-5 w-5 mr-2" />
                  Set Your Goal
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Goal Card */}
          {goal && (
            <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-6 w-6" />
                      <h1 className="text-2xl font-bold">Facilitator Mode</h1>
                    </div>
                    <p className="text-purple-100 mb-2">
                      Goal: <span className="font-semibold">{goal.goalTitle}</span>
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>Daily time: {goal.timeAvailability} min</span>
                      <span>•</span>
                      <span>Goal Readiness: {Math.round(goal.goalReadiness)}%</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-white text-purple-600 hover:bg-purple-50"
                    onClick={() => router.push('/facilitator/goal-setup')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Goal
                  </Button>
                </div>
                <div className="mt-4">
                  <Progress value={goal.goalReadiness} className="h-2 bg-white/20" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly Plan Card */}
          {weeklyPlan && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Plan for the Week
                    </CardTitle>
                    <CardDescription>
                      {new Date(weeklyPlan.weekStartDate).toLocaleDateString()} - {new Date(weeklyPlan.weekEndDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/facilitator/week')}
                  >
                    View Full Plan
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Focus Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {weeklyPlan.focusSkills.map((skill, idx) => (
                      <Badge key={idx} variant="outline">
                        {skill.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Daily time: {weeklyPlan.dailyTimeBudget} min</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <div
                        key={day}
                        className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs"
                      >
                        {day + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Plan */}
          {goal && (
            <Card>
              <CardHeader>
                <CardTitle>Today's Training</CardTitle>
                <CardDescription>
                  {completedQuests} of {totalQuests} quests completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayQuests.length > 0 ? (
                <div className="space-y-3">
                  {todayQuests.map((quest) => (
                    <div
                      key={quest.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{quest.title}</h3>
                          {quest.status === 'COMPLETED' && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{quest.description}</p>
                      </div>
                      <div className="ml-4">
                        {quest.status === 'COMPLETED' ? (
                          <Button variant="outline" disabled>
                            Completed
                          </Button>
                        ) : quest.status === 'IN_PROGRESS' ? (
                          <Button onClick={() => handleStartQuest(quest.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </Button>
                        ) : (
                          <Button onClick={() => handleStartQuest(quest.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                  <p className="text-center text-gray-500 py-8">No quests available for today</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Progress Summary */}
          {progress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Streak</p>
                    <p className="text-2xl font-bold">{progress.streak} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Most Improved</p>
                    <p className="text-lg font-semibold">
                      {progress.mostImprovedSkill
                        ? progress.mostImprovedSkill.replace(/_/g, ' ')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Quests Completed</p>
                    <p className="text-2xl font-bold">{progress.totalQuestsCompleted}</p>
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

