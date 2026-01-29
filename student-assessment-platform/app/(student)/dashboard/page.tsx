/**
 * Student Dashboard
 * 
 * Matches UI/UX Design Spec exactly:
 * - Welcome banner with gradient (primary-500 to primary-600)
 * - Mode toggle (Explorer/Facilitator) with icons
 * - Skill Tree preview
 * - Recent Activity
 * 
 * Wired to:
 * - GET /api/students/me
 * - GET /api/students/me/skill-tree
 * - GET /api/students/me/timeline
 * - PUT /api/students/me (for mode persistence)
 * 
 * @module app/(student)/dashboard
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass, Target, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { SkillTreePreview } from '@/components/skill-tree/SkillTreePreview';
import { UserMenu } from '@/components/UserMenu';

interface StudentProfile {
  id: string;
  userId: string;
  tenantId: string;
  grade: number;
  section: string;
  dateOfBirth: string | null;
  goals: string[] | null;
  preferredMode: 'explorer' | 'facilitator' | null;
  onboardingComplete: boolean;
  assessmentComplete: boolean;
  createdAt: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

interface SkillTreeCategory {
  category: string;
  name: string;
  score: number;
  level: string;
  icon: string;
  trend: string;
}

interface SkillTreeData {
  categories: SkillTreeCategory[];
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  eventType: string;
  context: string;
  studentChoice: string;
  aiAnalysis: {
    valuesReflected: string[];
    behavioralPattern: string;
    growthIndicator: string;
  };
  visibility: string;
}

interface TimelineData {
  studentId: string;
  events: TimelineEvent[];
  patterns: {
    dominant: string[];
    emerging: string[];
    needsSupport: string[];
  };
}

export default function StudentDashboard() {
  const router = useRouter();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [skillTree, setSkillTree] = useState<SkillTreeData | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Calculate date range (last 30 days to today)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch student profile (authenticated via NextAuth cookies)
      const profileResponse = await fetch('/api/students/me', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (profileResponse.status === 401 || profileResponse.status === 403) {
        router.push('/login');
        return;
      }

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error?.message || 'Failed to fetch student profile');
      }

      const profileData = await profileResponse.json();
      if (profileData?.success) {
        setStudentProfile(profileData.data);
        
        // Redirect to onboarding if not complete
        if (!profileData.data.onboardingComplete) {
          router.push('/onboarding');
          return;
        }
      } else {
        throw new Error('Invalid response from server');
      }

      // Fetch skill tree
      const skillTreeResponse = await fetch('/api/students/me/skill-tree', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (skillTreeResponse.ok) {
        const skillTreeData = await skillTreeResponse.json();
        if (skillTreeData?.success) {
          setSkillTree(skillTreeData.data);
        }
      }

      // Fetch timeline (last 30 days)
      const timelineResponse = await fetch(
        `/api/students/me/timeline?startDate=${startDateStr}&endDate=${endDateStr}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (timelineResponse.ok) {
        const timelineData = await timelineResponse.json();
        if (timelineData?.success) {
          setTimeline(timelineData.data);
        }
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleModeChange = async (newMode: 'explorer' | 'facilitator') => {
    // Convert to uppercase for API
    const modeValue = newMode.toUpperCase() as 'EXPLORER' | 'FACILITATOR';
    if (!studentProfile) return;

    const previousMode = studentProfile.preferredMode;
    setIsUpdatingMode(true);

    try {
      const response = await fetch('/api/students/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ preferredMode: modeValue }),
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update preferred mode');
      }

      // Update local state with response
      if (data.success && data.data) {
        setStudentProfile((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            preferredMode: data.data.preferredMode,
          };
        });

        // Navigate to the appropriate mode page
        if (modeValue === 'EXPLORER') {
          // Navigate to explorer page
          router.push('/explorer');
        } else if (modeValue === 'FACILITATOR') {
          // Navigate to facilitator page
          router.push('/facilitator');
        }
      }
    } catch (err: any) {
      console.error('Failed to update mode:', err);
      // Revert on error
      if (studentProfile) {
        setStudentProfile({
          ...studentProfile,
          preferredMode: previousMode,
        });
      }
      alert('Failed to update mode. Please try again.');
    } finally {
      setIsUpdatingMode(false);
    }
  };

  const handleLogout = async () => {
    try {
      // NextAuth signout endpoint
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Error signing out:', err);
    }
    // Redirect to login regardless of signout result
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
          <div className="max-w-7xl mx-auto space-y-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-64 mb-2 bg-blue-400" />
                <Skeleton className="h-4 w-48 bg-blue-400" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error && !studentProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Error Loading Dashboard</CardTitle>
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
    );
  }

  // No profile found (shouldn't happen if authenticated)
  if (!studentProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>Your student profile could not be loaded.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchData} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = studentProfile.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <UserMenu 
              user={{
                name: studentProfile.user.name,
                email: studentProfile.user.email,
                avatar: studentProfile.user.avatar,
              }}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Welcome Banner */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    Welcome back, {studentProfile.user.name}! 👋
                  </h1>
                  <p className="text-blue-100">
                    Grade {studentProfile.grade} • Section {studentProfile.section}
                    {studentProfile.goals && studentProfile.goals.length > 0 && (
                      <span> • {studentProfile.goals.length} goal{studentProfile.goals.length !== 1 ? 's' : ''}</span>
                    )}
                  </p>
                </div>
                <Avatar className="w-20 h-20 border-4 border-white">
                  <AvatarImage src={studentProfile.user.avatar} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
              </div>
            </CardContent>
          </Card>

          {/* Assessment Status Card */}
          {!studentProfile.assessmentComplete && (
            <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-2">
                      🎮 Complete Your Assessment
                    </h2>
                    <p className="text-purple-50 mb-4">
                      Take 8 fun games to discover your strengths and unlock your personalized learning path
                    </p>
                    <Button
                      size="lg"
                      className="bg-white text-purple-600 hover:bg-purple-50"
                      onClick={() => router.push('/assessments')}
                    >
                      Start Assessment
                    </Button>
                  </div>
                  <div className="hidden md:block ml-6">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-4xl">🎯</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Your Learning Path</CardTitle>
              <CardDescription>
                Choose how you want to learn and grow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={studentProfile.preferredMode === 'explorer' ? 'default' : 'outline'}
                  className="h-24 flex-col"
                  onClick={() => handleModeChange('explorer')}
                  disabled={isUpdatingMode}
                >
                  <Compass className="w-8 h-8 mb-2" />
                  <span className="font-semibold">Explorer Mode</span>
                  <span className="text-xs text-gray-600">Discover new interests</span>
                </Button>
                <Button
                  variant={studentProfile.preferredMode === 'facilitator' ? 'default' : 'outline'}
                  className="h-24 flex-col"
                  onClick={() => handleModeChange('facilitator')}
                  disabled={isUpdatingMode}
                >
                  <Target className="w-8 h-8 mb-2" />
                  <span className="font-semibold">Facilitator Mode</span>
                  <span className="text-xs text-gray-600">Master specific skills</span>
                </Button>
              </div>
              {isUpdatingMode && (
                <p className="text-sm text-gray-500 text-center mt-2">Saving preference...</p>
              )}
            </CardContent>
          </Card>

          {/* Skill Tree Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Skill Tree</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => router.push('/skill-tree')}>
                  View Full Tree →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SkillTreePreview categories={skillTree?.categories || []} />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your behavioral timeline from the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeline && timeline.events.length > 0 ? (
                <div className="space-y-4">
                  {timeline.events.map((event) => {
                    const eventDate = new Date(event.timestamp);
                    const formattedDate = eventDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: eventDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                    });
                    const formattedTime = eventDate.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    });

                    // Format event type for display
                    const eventTypeLabel = event.eventType
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(' ');

                    // Get 1-line insight from AI analysis
                    const insight = event.aiAnalysis?.growthIndicator || 
                                   event.aiAnalysis?.behavioralPattern ||
                                   event.studentChoice;

                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-16 text-right">
                          <div className="text-xs text-gray-500">{formattedDate}</div>
                          <div className="text-xs text-gray-400">{formattedTime}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {eventTypeLabel}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-600 truncate">
                              {event.context}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {insight}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity</p>
                  <p className="text-sm mt-2">Start exploring to see your progress here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
