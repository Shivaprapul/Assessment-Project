/**
 * Community Section
 * 
 * Encourages collaboration, healthy competition, and peer learning.
 * Focuses on friendly engagement, not social media.
 * 
 * Features:
 * - Learning Circles (small groups with themes)
 * - Cooperative Quests (team-based challenges)
 * - Friendly Challenges (opt-in, rank bands)
 * - Team vs Team Challenges (class/circle competition)
 * - Community Activity Feed (curated system events)
 * - Recognition & Badges (behavior-based achievements)
 * 
 * @module app/(student)/community
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  Target,
  Trophy,
  Award,
  Sparkles,
  Heart,
  Brain,
  Compass,
  Clock,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  Calendar,
  Star,
  Zap,
  BookOpen,
  Lightbulb,
  Shield,
  Gift,
  Flame,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserMenu } from '@/components/UserMenu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Mock data interfaces
interface LearningCircle {
  id: string;
  name: string;
  theme: string;
  memberCount: number;
  maxMembers: number;
  weeklyGoal: string;
  progress: number; // 0-100
  isMember: boolean;
  description: string;
}

interface CooperativeQuest {
  id: string;
  title: string;
  description: string;
  teamProgress: number; // 0-100
  teamSize: number;
  duration: string; // e.g., "7 days remaining"
  category: string;
  isParticipating: boolean;
}

interface FriendlyChallenge {
  id: string;
  title: string;
  description: string;
  category: string;
  rankBand: 'top' | 'middle' | 'developing'; // Not numeric rank
  timeRemaining: string;
  isOptedIn: boolean;
  participantCount: number;
}

interface TeamVsTeamChallenge {
  id: string;
  title: string;
  description: string;
  team1Name: string;
  team2Name: string;
  team1Progress: number;
  team2Progress: number;
  timeRemaining: string;
  category: string;
  isParticipating: boolean;
}

interface ActivityEvent {
  id: string;
  type: 'achievement' | 'quest_complete' | 'challenge_start' | 'circle_join' | 'badge_earned';
  studentName: string;
  description: string;
  timestamp: string;
  icon: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'persistence' | 'creativity' | 'teamwork' | 'growth';
  earnedBy: string[]; // Student names who earned it
  rarity: 'common' | 'rare' | 'epic';
}

export default function CommunityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCircle, setSelectedCircle] = useState<LearningCircle | null>(null);
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false);

  // Mock data
  const [learningCircles] = useState<LearningCircle[]>([
    {
      id: '1',
      name: 'Creative Problem Solvers',
      theme: 'Creative Thinking',
      memberCount: 8,
      maxMembers: 12,
      weeklyGoal: 'Complete 3 creative challenges together',
      progress: 65,
      isMember: true,
      description: 'A group focused on exploring creative solutions to problems',
    },
    {
      id: '2',
      name: 'Logical Thinkers',
      theme: 'Logical Reasoning',
      memberCount: 10,
      maxMembers: 12,
      weeklyGoal: 'Solve 5 logic puzzles as a team',
      progress: 80,
      isMember: false,
      description: 'Students who enjoy logical reasoning and pattern recognition',
    },
    {
      id: '3',
      name: 'Social Builders',
      theme: 'Social Awareness',
      memberCount: 6,
      maxMembers: 10,
      weeklyGoal: 'Complete 2 collaborative activities',
      progress: 40,
      isMember: true,
      description: 'Building social skills through teamwork and collaboration',
    },
  ]);

  const [cooperativeQuests] = useState<CooperativeQuest[]>([
    {
      id: '1',
      title: 'Pattern Discovery Quest',
      description: 'Work together to identify patterns in nature, art, and mathematics',
      teamProgress: 72,
      teamSize: 15,
      duration: '5 days remaining',
      category: 'Logical Reasoning',
      isParticipating: true,
    },
    {
      id: '2',
      title: 'Creative Storytelling Quest',
      description: 'Collaborate to create an interactive story with multiple perspectives',
      teamProgress: 45,
      teamSize: 12,
      duration: '8 days remaining',
      category: 'Creative Thinking',
      isParticipating: true,
    },
    {
      id: '3',
      title: 'Planning Mastery Quest',
      description: 'Team up to plan and execute a complex multi-step project',
      teamProgress: 30,
      teamSize: 18,
      duration: '10 days remaining',
      category: 'Planning Skills',
      isParticipating: false,
    },
  ]);

  const [friendlyChallenges] = useState<FriendlyChallenge[]>([
    {
      id: '1',
      title: 'Weekly Creative Challenge',
      description: 'Complete creative activities and share your unique approach',
      category: 'Creative Thinking',
      rankBand: 'top',
      timeRemaining: '3 days left',
      isOptedIn: true,
      participantCount: 24,
    },
    {
      id: '2',
      title: 'Logic Puzzle Sprint',
      description: 'Solve logic puzzles and improve your reasoning skills',
      category: 'Logical Reasoning',
      rankBand: 'middle',
      timeRemaining: '5 days left',
      isOptedIn: false,
      participantCount: 18,
    },
    {
      id: '3',
      title: 'Planning Power Hour',
      description: 'Practice planning skills through structured activities',
      category: 'Planning Skills',
      rankBand: 'developing',
      timeRemaining: '2 days left',
      isOptedIn: true,
      participantCount: 15,
    },
  ]);

  const [teamVsTeamChallenges] = useState<TeamVsTeamChallenge[]>([
    {
      id: '1',
      title: 'Class A vs Class B',
      description: 'Friendly competition between classes to complete assessment activities',
      team1Name: 'Class 9-A',
      team2Name: 'Class 9-B',
      team1Progress: 68,
      team2Progress: 72,
      timeRemaining: '6 days left',
      category: 'General',
      isParticipating: true,
    },
    {
      id: '2',
      title: 'Creative Circles Battle',
      description: 'Learning circles compete in creative problem-solving challenges',
      team1Name: 'Creative Problem Solvers',
      team2Name: 'Logical Thinkers',
      team1Progress: 55,
      team2Progress: 60,
      timeRemaining: '4 days left',
      category: 'Creative Thinking',
      isParticipating: false,
    },
  ]);

  const [activityFeed] = useState<ActivityEvent[]>([
    {
      id: '1',
      type: 'badge_earned',
      studentName: 'Priya',
      description: 'earned the Persistence Badge',
      timestamp: '2 hours ago',
      icon: '🏆',
    },
    {
      id: '2',
      type: 'quest_complete',
      studentName: 'Arjun',
      description: 'completed the Pattern Discovery Quest',
      timestamp: '5 hours ago',
      icon: '✨',
    },
    {
      id: '3',
      type: 'circle_join',
      studentName: 'Sneha',
      description: 'joined the Creative Problem Solvers circle',
      timestamp: '1 day ago',
      icon: '👥',
    },
    {
      id: '4',
      type: 'achievement',
      studentName: 'Rohan',
      description: 'reached a new milestone in Logical Reasoning',
      timestamp: '2 days ago',
      icon: '🎯',
    },
    {
      id: '5',
      type: 'challenge_start',
      studentName: 'Ananya',
      description: 'started the Weekly Creative Challenge',
      timestamp: '3 days ago',
      icon: '🚀',
    },
  ]);

  const [badges] = useState<Badge[]>([
    {
      id: '1',
      name: 'Persistence Badge',
      description: 'Completed 10 activities in a row',
      icon: '🔥',
      category: 'persistence',
      earnedBy: ['Priya', 'Arjun', 'Narasimha'],
      rarity: 'common',
    },
    {
      id: '2',
      name: 'Creative Spark',
      description: 'Explored 5 different creative activities',
      icon: '✨',
      category: 'creativity',
      earnedBy: ['Sneha', 'Isha'],
      rarity: 'rare',
    },
    {
      id: '3',
      name: 'Team Player',
      description: 'Contributed to 3 cooperative quests',
      icon: '🤝',
      category: 'teamwork',
      earnedBy: ['Vikram', 'Ananya'],
      rarity: 'common',
    },
    {
      id: '4',
      name: 'Growth Mindset',
      description: 'Improved in 3 different skill areas',
      icon: '📈',
      category: 'growth',
      earnedBy: ['Rohan'],
      rarity: 'epic',
    },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getRankBandColor = (band: string) => {
    switch (band) {
      case 'top':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'middle':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'developing':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRankBandLabel = (band: string) => {
    switch (band) {
      case 'top':
        return 'Top Performers';
      case 'middle':
        return 'Strong Progress';
      case 'developing':
        return 'Growing';
      default:
        return band;
    }
  };

  const getBadgeRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'epic':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'rare':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'common':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'persistence':
        return <Flame className="h-4 w-4" />;
      case 'creativity':
        return <Sparkles className="h-4 w-4" />;
      case 'teamwork':
        return <Users className="h-4 w-4" />;
      case 'growth':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  const handleJoinCircle = (circle: LearningCircle) => {
    setSelectedCircle(circle);
    setIsCircleModalOpen(true);
  };

  const handleOptInChallenge = (challengeId: string) => {
    // TODO: API call to opt in
    console.log('Opting in to challenge:', challengeId);
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
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Error Loading Data</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                name: 'Student User',
                email: 'student@test-school.com',
              }}
              onLogout={() => router.push('/login')}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Community
            </h1>
            <p className="text-gray-600">
              Collaborate, learn together, and celebrate achievements
            </p>
          </div>

          {/* Tabs for different sections */}
          <Tabs defaultValue="circles" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="circles">Circles</TabsTrigger>
              <TabsTrigger value="quests">Quests</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="teams">Team vs Team</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
            </TabsList>

            {/* Learning Circles Tab */}
            <TabsContent value="circles" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Learning Circles
                  </CardTitle>
                  <CardDescription>
                    Join small groups focused on specific learning themes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {learningCircles.map((circle) => (
                      <Card key={circle.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between mb-2">
                            <CardTitle className="text-lg">{circle.name}</CardTitle>
                            {circle.isMember && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Member
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{circle.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">Theme</span>
                              <Badge variant="outline">{circle.theme}</Badge>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">Members</span>
                              <span className="text-sm font-medium">
                                {circle.memberCount}/{circle.maxMembers}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Weekly Goal</span>
                            </div>
                            <p className="text-xs text-gray-700 mt-1">{circle.weeklyGoal}</p>
                          </div>
                          {circle.isMember && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-600">Progress</span>
                                <span className="text-sm font-medium">{circle.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${circle.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          <Button
                            variant={circle.isMember ? 'outline' : 'default'}
                            className="w-full"
                            size="sm"
                            onClick={() => handleJoinCircle(circle)}
                          >
                            {circle.isMember ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                View Circle
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Join Circle
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cooperative Quests Tab */}
            <TabsContent value="quests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Cooperative Quests
                  </CardTitle>
                  <CardDescription>
                    Team-based challenges with shared progress (no individual ranking)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cooperativeQuests.map((quest) => (
                      <Card key={quest.id} className="border-2">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{quest.title}</CardTitle>
                              <CardDescription className="mt-1">{quest.description}</CardDescription>
                            </div>
                            {quest.isParticipating && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                Participating
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Team Progress</span>
                              <span className="text-sm font-bold text-blue-600">{quest.teamProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-blue-600 h-3 rounded-full transition-all"
                                style={{ width: `${quest.teamProgress}%` }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Team Size:</span>
                              <span className="ml-2 font-medium">{quest.teamSize} students</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Duration:</span>
                              <span className="ml-2 font-medium">{quest.duration}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Category:</span>
                              <Badge variant="outline" className="ml-2">{quest.category}</Badge>
                            </div>
                          </div>
                          {!quest.isParticipating && (
                            <Button className="w-full" size="sm">
                              <UserPlus className="h-4 w-4 mr-2" />
                              Join Quest
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Friendly Challenges Tab */}
            <TabsContent value="challenges" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Friendly Challenges
                  </CardTitle>
                  <CardDescription>
                    Opt-in, time-bound challenges using rank bands (not numeric leaderboards)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {friendlyChallenges.map((challenge) => (
                      <Card key={challenge.id} className="border-2">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{challenge.title}</CardTitle>
                              <CardDescription className="mt-1">{challenge.description}</CardDescription>
                            </div>
                            <Badge className={getRankBandColor(challenge.rankBand)}>
                              {getRankBandLabel(challenge.rankBand)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{challenge.timeRemaining}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{challenge.participantCount} participants</span>
                            </div>
                            <Badge variant="outline">{challenge.category}</Badge>
                          </div>
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-800">
                              <Shield className="h-3 w-3 inline mr-1" />
                              <strong>Friendly Competition:</strong> This challenge uses rank bands, not numeric rankings. 
                              All participants are celebrated for their effort!
                            </p>
                          </div>
                          {challenge.isOptedIn ? (
                            <Button variant="outline" className="w-full" size="sm">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              You're In!
                            </Button>
                          ) : (
                            <Button
                              className="w-full"
                              size="sm"
                              onClick={() => handleOptInChallenge(challenge.id)}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Opt In (Friendly)
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team vs Team Challenges Tab */}
            <TabsContent value="teams" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team vs Team Challenges
                  </CardTitle>
                  <CardDescription>
                    Class or circle-based friendly competition
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamVsTeamChallenges.map((challenge) => (
                      <Card key={challenge.id} className="border-2">
                        <CardHeader>
                          <CardTitle className="text-lg">{challenge.title}</CardTitle>
                          <CardDescription>{challenge.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm font-semibold text-blue-900 mb-2">{challenge.team1Name}</p>
                              <div className="w-full bg-blue-200 rounded-full h-3 mb-1">
                                <div
                                  className="bg-blue-600 h-3 rounded-full transition-all"
                                  style={{ width: `${challenge.team1Progress}%` }}
                                />
                              </div>
                              <p className="text-sm font-bold text-blue-700">{challenge.team1Progress}%</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-sm font-semibold text-green-900 mb-2">{challenge.team2Name}</p>
                              <div className="w-full bg-green-200 rounded-full h-3 mb-1">
                                <div
                                  className="bg-green-600 h-3 rounded-full transition-all"
                                  style={{ width: `${challenge.team2Progress}%` }}
                                />
                              </div>
                              <p className="text-sm font-bold text-green-700">{challenge.team2Progress}%</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{challenge.timeRemaining}</span>
                            </div>
                            <Badge variant="outline">{challenge.category}</Badge>
                          </div>
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-800">
                              <Shield className="h-3 w-3 inline mr-1" />
                              <strong>Friendly Competition:</strong> This is a team effort focused on collaboration and fun!
                            </p>
                          </div>
                          {challenge.isParticipating ? (
                            <Badge className="w-full justify-center bg-green-100 text-green-800 border-green-200">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Your team is participating
                            </Badge>
                          ) : (
                            <Button className="w-full" size="sm">
                              <UserPlus className="h-4 w-4 mr-2" />
                              Join Team Challenge
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Feed Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Community Activity Feed
                  </CardTitle>
                  <CardDescription>
                    Curated system events only (no free posting)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityFeed.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-2xl">{event.icon}</div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold text-gray-900">{event.studentName}</span>
                            <span className="text-gray-600"> {event.description}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{event.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recognition & Badges Tab */}
            <TabsContent value="badges" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Recognition & Badges
                  </CardTitle>
                  <CardDescription>
                    Behavior-based achievements (persistence, creativity, teamwork)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {badges.map((badge) => (
                      <Card key={badge.id} className="border-2">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-4xl">{badge.icon}</div>
                              <div>
                                <CardTitle className="text-lg">{badge.name}</CardTitle>
                                <CardDescription>{badge.description}</CardDescription>
                              </div>
                            </div>
                            <Badge className={getBadgeRarityColor(badge.rarity)}>
                              {badge.rarity}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 mb-3">
                            {getCategoryIcon(badge.category)}
                            <span className="text-sm text-gray-600 capitalize">{badge.category}</span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-2">Earned by:</p>
                            <div className="flex flex-wrap gap-1">
                              {badge.earnedBy.map((name, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Join Circle Modal */}
      <Dialog open={isCircleModalOpen} onOpenChange={setIsCircleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Learning Circle</DialogTitle>
            <DialogDescription>
              {selectedCircle?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedCircle && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">{selectedCircle.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Theme:</span>
                    <Badge variant="outline">{selectedCircle.theme}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Members:</span>
                    <span className="text-sm font-medium">
                      {selectedCircle.memberCount}/{selectedCircle.maxMembers}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Weekly Goal:</span>
                    <p className="text-sm font-medium mt-1">{selectedCircle.weeklyGoal}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCircleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // TODO: API call to join circle
              console.log('Joining circle:', selectedCircle?.id);
              setIsCircleModalOpen(false);
            }}>
              Join Circle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

