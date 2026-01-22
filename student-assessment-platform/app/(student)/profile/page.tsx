/**
 * Student Profile Page
 * 
 * Displays comprehensive student profile with:
 * - Hero header (avatar, name, quick stats)
 * - About Me card (name/email/phone/class/age/aim/interests)
 * - Learning Identity card (mode + highlights)
 * - Skill Highlights (top categories)
 * - Recent Activity preview
 * - Privacy card (collapsible)
 * 
 * @module app/(student)/profile
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Target,
  Compass,
  TrendingUp,
  Award,
  Clock,
  Shield,
  Eye,
  EyeOff,
  User,
  GraduationCap,
  Heart,
  Brain,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
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

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function getModeIcon(mode: string | null) {
  switch (mode) {
    case 'explorer':
      return <Compass className="h-5 w-5" />;
    case 'facilitator':
      return <Target className="h-5 w-5" />;
    default:
      return <Brain className="h-5 w-5" />;
  }
}

function getModeLabel(mode: string | null) {
  switch (mode) {
    case 'explorer':
      return 'Explorer Mode';
    case 'facilitator':
      return 'Facilitator Mode';
    default:
      return 'Not Set';
  }
}

function getLevelColor(level: string) {
  switch (level.toLowerCase()) {
    case 'advanced':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'proficient':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'developing':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'emerging':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getTrendIcon(trend: string) {
  switch (trend.toLowerCase()) {
    case 'improving':
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'stable':
      return <Clock className="h-4 w-4 text-blue-600" />;
    case 'needs_attention':
      return <AlertCircle className="h-4 w-4 text-orange-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [skillTree, setSkillTree] = useState<SkillTreeData | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

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

      // Fetch all data in parallel
      const [profileResponse, skillTreeResponse, timelineResponse] = await Promise.all([
        fetch('/api/students/me', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        fetch('/api/students/me/skill-tree', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        fetch(`/api/students/me/timeline?startDate=${startDateStr}&endDate=${endDateStr}`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
      ]);

      if (profileResponse.status === 401 || profileResponse.status === 403) {
        router.push('/login');
        return;
      }

      if (!profileResponse.ok || !skillTreeResponse.ok || !timelineResponse.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const profileData = await profileResponse.json();
      const skillTreeData = await skillTreeResponse.json();
      const timelineData = await timelineResponse.json();

      if (profileData?.success) {
        setStudentProfile(profileData.data);
      }
      if (skillTreeData?.success) {
        setSkillTree(skillTreeData.data);
      }
      if (timelineData?.success) {
        setTimeline(timelineData.data);
      }
    } catch (err: any) {
      console.error('Error fetching profile data:', err);
      setError(err.message || 'Failed to load profile');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Logo />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-48 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !studentProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Error Loading Profile</CardTitle>
            </div>
            <CardDescription>{error || 'Profile not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={fetchData} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1">
                Back to Dashboard
              </Button>
            </div>
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

  const age = calculateAge(studentProfile.dateOfBirth);
  const topSkills = skillTree?.categories
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) || [];
  const recentEvents = timeline?.events.slice(0, 5) || [];
  const completedAssessments = studentProfile.assessmentComplete ? 8 : 0;
  const totalGoals = studentProfile.goals?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
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
          {/* Hero Header */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={studentProfile.user.avatar} alt={studentProfile.user.name} />
                  <AvatarFallback className="text-4xl bg-white text-blue-600 font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-bold mb-2">{studentProfile.user.name}</h1>
                  <p className="text-blue-100 text-lg mb-4">
                    Grade {studentProfile.grade} • Section {studentProfile.section}
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                      <Award className="h-5 w-5" />
                      <span className="font-semibold">{completedAssessments}/8</span>
                      <span className="text-sm">Assessments</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                      <Target className="h-5 w-5" />
                      <span className="font-semibold">{totalGoals}</span>
                      <span className="text-sm">Goals</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                      <TrendingUp className="h-5 w-5" />
                      <span className="font-semibold">{topSkills.length}</span>
                      <span className="text-sm">Top Skills</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* About Me Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    About Me
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{studentProfile.user.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{studentProfile.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-400">Not provided</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Class</p>
                        <p className="font-medium">
                          Grade {studentProfile.grade} - Section {studentProfile.section}
                        </p>
                      </div>
                    </div>
                    {age !== null && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Age</p>
                          <p className="font-medium">{age} years old</p>
                        </div>
                      </div>
                    )}
                    {studentProfile.goals && studentProfile.goals.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Target className="h-4 w-4 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-2">Goals & Aims</p>
                          <div className="flex flex-wrap gap-2">
                            {studentProfile.goals.map((goal, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {goal}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Learning Identity Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Learning Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Preferred Learning Mode</p>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      {getModeIcon(studentProfile.preferredMode)}
                      <span className="font-semibold text-blue-900">
                        {getModeLabel(studentProfile.preferredMode)}
                      </span>
                    </div>
                  </div>
                  {studentProfile.preferredMode && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Highlights</p>
                      <div className="space-y-2">
                        {studentProfile.preferredMode === 'explorer' ? (
                          <>
                            <div className="flex items-center gap-2 text-sm">
                              <Compass className="h-4 w-4 text-blue-600" />
                              <span>Discover new interests and passions</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Heart className="h-4 w-4 text-blue-600" />
                              <span>Explore diverse learning paths</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-sm">
                              <Target className="h-4 w-4 text-blue-600" />
                              <span>Master specific skills</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                              <span>Focused skill development</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Skill Highlights Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Skill Highlights
                  </CardTitle>
                  <CardDescription>Your top performing skill categories</CardDescription>
                </CardHeader>
                <CardContent>
                  {topSkills.length > 0 ? (
                    <div className="space-y-4">
                      {topSkills.map((skill, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              {getTrendIcon(skill.trend)}
                              <div>
                                <p className="font-semibold text-sm">{skill.name}</p>
                                <p className="text-xs text-gray-500">Score: {skill.score.toFixed(1)}</p>
                              </div>
                            </div>
                          </div>
                          <Badge className={getLevelColor(skill.level)}>
                            {skill.level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Complete assessments to see your skill highlights</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity Preview Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Your latest behavioral events</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentEvents.length > 0 ? (
                    <div className="space-y-3">
                      {recentEvents.map((event) => {
                        const eventDate = new Date(event.timestamp);
                        const formattedDate = eventDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        });
                        const formattedTime = eventDate.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={event.id}
                            className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex-shrink-0 w-16 text-right">
                              <div className="text-xs text-gray-500">{formattedDate}</div>
                              <div className="text-xs text-gray-400">{formattedTime}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {event.eventType.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                {event.context || event.studentChoice}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                  {recentEvents.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => router.push('/dashboard')}
                    >
                      View Full Timeline →
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Privacy Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy & Visibility
                  </CardTitle>
                  <CardDescription>Control who can see your information</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="privacy">
                      <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>Privacy Settings</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">Profile Visibility</p>
                              <p className="text-xs text-gray-500">Who can see your profile</p>
                            </div>
                            <Badge variant="outline">Private</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">Activity Sharing</p>
                              <p className="text-xs text-gray-500">Share activity with parents</p>
                            </div>
                            <Badge variant="outline">Enabled</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">Data Export</p>
                              <p className="text-xs text-gray-500">Request your data</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Export
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

