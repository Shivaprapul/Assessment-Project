/**
 * Parent Tracker Dashboard
 * 
 * A supportive, non-judgmental dashboard for parents to understand their child's
 * learning journey. Focuses on clarity, reassurance, and actionable guidance.
 * 
 * Features:
 * - Weekly Progress Summary (narrative style)
 * - Progress Over Time (trend indicators vs past self only)
 * - Behavioral Pattern Timeline (gentle language)
 * - Strengthening Areas (positively worded)
 * - Practical Home Support Actions
 * - Learning Style Snapshot
 * - Progress Narrative
 * - Gentle Observations
 * - Parent Reflection Notes
 * - Privacy & Consent Summary
 * 
 * @module app/(student)/parent-tracker
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Lightbulb,
  BookOpen,
  Users,
  Shield,
  CheckCircle2,
  Clock,
  Sparkles,
  Target,
  Brain,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  X,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserMenu } from '@/components/UserMenu';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Mock data structure (will be replaced with API calls)
interface ChildData {
  id: string;
  name: string;
  grade: number;
  section: string;
  avatar?: string;
  assessmentComplete: boolean;
}

interface WeeklyProgress {
  week: string;
  narrative: string;
  highlights: string[];
  activitiesCompleted: number;
  engagementLevel: 'high' | 'medium' | 'low';
}

interface ProgressTrend {
  category: string;
  trend: 'improving' | 'stable' | 'developing';
  change: number; // percentage change
  period: string;
  historicalData?: Array<{ date: string; score: number }>;
}

interface HistoricalDataPoint {
  date: string;
  score: number;
}

interface BehavioralEvent {
  id: string;
  date: string;
  type: string;
  description: string;
  gentleInsight: string;
}

interface StrengtheningArea {
  category: string;
  description: string;
  currentProgress: string;
  supportiveMessage: string;
}

interface HomeSupportAction {
  title: string;
  description: string;
  category: 'cognitive' | 'creative' | 'social' | 'emotional';
}

interface LearningStyle {
  preferredMode: 'explorer' | 'facilitator';
  characteristics: string[];
  strengths: string[];
  recommendations: string[];
}

interface Observation {
  type: 'positive' | 'gentle_nudge';
  message: string;
  category: string;
}

export default function ParentTrackerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reflectionNotes, setReflectionNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProgressTrend | null>(null);
  const [isChartDialogOpen, setIsChartDialogOpen] = useState(false);

  // Mock data (will be replaced with API calls)
  const [childData] = useState<ChildData>({
    id: 'child-1',
    name: 'Narasimha',
    grade: 9,
    section: 'A',
    assessmentComplete: true,
  });

  const [weeklyProgress] = useState<WeeklyProgress>({
    week: 'January 15-21, 2026',
    narrative: 'This week, your child showed wonderful engagement with pattern recognition activities. They completed 3 assessment games and demonstrated growing confidence in logical reasoning. Their curiosity about creative problem-solving has been particularly noticeable.',
    highlights: [
      'Completed Pattern Forge assessment with enthusiasm',
      'Showed increased focus during planning activities',
      'Engaged actively in creative storytelling exercises',
    ],
    activitiesCompleted: 5,
    engagementLevel: 'high',
  });

  // Generate historical data for each category (mock data - will come from API)
  const generateHistoricalData = (category: string, baseScore: number, trend: string): HistoricalDataPoint[] => {
    const data: HistoricalDataPoint[] = [];
    const today = new Date();
    const months = 6; // 6 months of data
    
    for (let i = months; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      
      // Generate score based on trend
      let score = baseScore;
      if (trend === 'improving') {
        score = baseScore - (i * (baseScore * 0.02)); // Gradually improving
      } else if (trend === 'developing') {
        score = baseScore + (i * (baseScore * 0.01)); // Slight decline
      } else {
        score = baseScore + (Math.random() * 5 - 2.5); // Stable with small variations
      }
      
      // Ensure score is between 0 and 100
      score = Math.max(0, Math.min(100, score));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        score: Math.round(score),
      });
    }
    
    return data;
  };

  const [progressTrends] = useState<ProgressTrend[]>([
    {
      category: 'Logical Reasoning',
      trend: 'improving',
      change: 12,
      period: 'vs last month',
      historicalData: generateHistoricalData('Logical Reasoning', 75, 'improving'),
    },
    {
      category: 'Creative Thinking',
      trend: 'improving',
      change: 8,
      period: 'vs last month',
      historicalData: generateHistoricalData('Creative Thinking', 68, 'improving'),
    },
    {
      category: 'Planning Skills',
      trend: 'stable',
      change: 2,
      period: 'vs last month',
      historicalData: generateHistoricalData('Planning Skills', 72, 'stable'),
    },
    {
      category: 'Social Awareness',
      trend: 'developing',
      change: -3,
      period: 'vs last month',
      historicalData: generateHistoricalData('Social Awareness', 65, 'developing'),
    },
    {
      category: 'Quant and Aptitude',
      trend: 'improving',
      change: 10,
      period: 'vs last month',
      historicalData: generateHistoricalData('Quant and Aptitude', 70, 'improving'),
    },
    {
      category: 'Verbal Logic',
      trend: 'stable',
      change: 3,
      period: 'vs last month',
      historicalData: generateHistoricalData('Verbal Logic', 73, 'stable'),
    },
    {
      category: 'Metacognition',
      trend: 'improving',
      change: 7,
      period: 'vs last month',
      historicalData: generateHistoricalData('Metacognition', 69, 'improving'),
    },
  ]);

  const [behavioralEvents] = useState<BehavioralEvent[]>([
    {
      id: '1',
      date: '2026-01-20',
      type: 'Assessment Choice',
      description: 'Chose to explore creative activities',
      gentleInsight: 'Your child naturally gravitates toward creative expression, which shows their comfort with open-ended exploration.',
    },
    {
      id: '2',
      date: '2026-01-18',
      type: 'Learning Mode',
      description: 'Spent time in Explorer Mode',
      gentleInsight: 'The curiosity-driven approach suggests your child enjoys discovering new interests at their own pace.',
    },
    {
      id: '3',
      date: '2026-01-15',
      type: 'Reflection',
      description: 'Shared thoughtful insights about problem-solving',
      gentleInsight: 'Your child demonstrates self-awareness in their learning process, which is a valuable metacognitive skill.',
    },
  ]);

  const [strengtheningAreas] = useState<StrengtheningArea[]>([
    {
      category: 'Creative Expression',
      description: 'Your child shows natural creativity and enjoys exploring new ideas',
      currentProgress: 'Engaging more with creative activities this month',
      supportiveMessage: 'Continue providing opportunities for creative expression at home through art, music, or storytelling.',
    },
    {
      category: 'Logical Problem-Solving',
      description: 'Strong analytical thinking is developing well',
      currentProgress: 'Showing consistent improvement in pattern recognition',
      supportiveMessage: 'Encourage puzzle-solving and strategy games to further nurture this strength.',
    },
  ]);

  const [homeSupportActions] = useState<HomeSupportAction[]>([
    {
      title: 'Encourage Creative Storytelling',
      description: 'Set aside 15 minutes for your child to create and share stories. This supports their natural creativity and language development.',
      category: 'creative',
    },
    {
      title: 'Practice Pattern Recognition Together',
      description: 'Play pattern-based games or puzzles together. This reinforces their growing logical reasoning skills in a fun, low-pressure way.',
      category: 'cognitive',
    },
    {
      title: 'Discuss Problem-Solving Approaches',
      description: 'When facing challenges, ask "What are some ways we could approach this?" This builds their planning and metacognitive skills.',
      category: 'cognitive',
    },
    {
      title: 'Celebrate Small Wins',
      description: 'Acknowledge effort and progress, not just outcomes. This supports their intrinsic motivation and growth mindset.',
      category: 'emotional',
    },
    {
      title: 'Create a Quiet Learning Space',
      description: 'Ensure there\'s a dedicated, distraction-free area for focused activities. This supports their developing attention skills.',
      category: 'cognitive',
    },
  ]);

  const [learningStyle] = useState<LearningStyle>({
    preferredMode: 'explorer',
    characteristics: [
      'Enjoys discovering new interests independently',
      'Thrives with open-ended exploration',
      'Shows curiosity about diverse topics',
    ],
    strengths: [
      'Self-directed learning',
      'Creative problem-solving',
      'Adaptability to new situations',
    ],
    recommendations: [
      'Provide variety in learning materials',
      'Allow time for unstructured exploration',
      'Support their natural curiosity with resources',
    ],
  });

  const [progressNarrative] = useState<string>(
    'Your child is on a positive learning journey. They show natural strengths in creative thinking and are developing strong logical reasoning skills. Their curiosity-driven approach to learning suggests they enjoy exploring at their own pace. The consistent engagement with assessments and activities indicates a healthy learning mindset.'
  );

  const [observations] = useState<Observation[]>([
    {
      type: 'positive',
      message: 'Your child has been consistently engaged with learning activities this week.',
      category: 'Engagement',
    },
    {
      type: 'gentle_nudge',
      message: 'Consider providing more opportunities for social interaction and collaboration.',
      category: 'Social Development',
    },
    {
      type: 'positive',
      message: 'The creative activities seem to be particularly enjoyable and motivating.',
      category: 'Interest',
    },
  ]);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    // TODO: Call API to save reflection notes
    // await fetch('/api/parents/reflection-notes', { ... });
    setTimeout(() => {
      setSavingNotes(false);
      // Show success message
    }, 500);
  };

  const handleCategoryClick = (category: ProgressTrend) => {
    setSelectedCategory(category);
    setIsChartDialogOpen(true);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-blue-600" />;
      case 'developing':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      default:
        return <ArrowRight className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'stable':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'developing':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cognitive':
        return <Brain className="h-4 w-4" />;
      case 'creative':
        return <Sparkles className="h-4 w-4" />;
      case 'social':
        return <Users className="h-4 w-4" />;
      case 'emotional':
        return <Heart className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
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
            {/* TODO: Get actual user data */}
            <UserMenu 
              user={{
                name: 'Parent User',
                email: 'parent@test-school.com',
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
              Parent Tracker
            </h1>
            <p className="text-gray-600">
              Understanding {childData.name}'s learning journey with clarity and support
            </p>
          </div>

          {/* Weekly Progress Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Weekly Progress Summary
              </CardTitle>
              <CardDescription>{weeklyProgress.week}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">{weeklyProgress.narrative}</p>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">This Week's Highlights:</p>
                <ul className="space-y-1">
                  {weeklyProgress.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <Badge variant="outline" className="bg-white">
                  <Clock className="h-3 w-3 mr-1" />
                  {weeklyProgress.activitiesCompleted} activities completed
                </Badge>
                <Badge variant="outline" className="bg-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {weeklyProgress.engagementLevel} engagement
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Progress Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Progress Over Time
                  </CardTitle>
                  <CardDescription>Growth compared to past self</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {progressTrends.map((trend, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCategoryClick(trend)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer ${getTrendColor(trend.trend)}`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getTrendIcon(trend.trend)}
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{trend.category}</p>
                            <p className="text-xs text-gray-600">{trend.period}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <p className={`font-semibold text-sm ${trend.change > 0 ? 'text-green-700' : trend.change < 0 ? 'text-orange-700' : 'text-blue-700'}`}>
                              {trend.change > 0 ? '+' : ''}{trend.change}%
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Behavioral Pattern Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Behavioral Pattern Timeline
                  </CardTitle>
                  <CardDescription>Recent learning moments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {behavioralEvents.map((event) => {
                      const eventDate = new Date(event.date);
                      const formattedDate = eventDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });

                      return (
                        <div
                          key={event.id}
                          className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-16 text-right">
                              <p className="text-xs text-gray-500">{formattedDate}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 mb-1">
                                {event.type}
                              </p>
                              <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                              <p className="text-xs text-gray-500 italic">
                                💡 {event.gentleInsight}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Strengthening Areas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Strengthening Areas
                  </CardTitle>
                  <CardDescription>Areas of natural strength and growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {strengtheningAreas.map((area, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <h4 className="font-semibold text-sm text-blue-900 mb-2">
                          {area.category}
                        </h4>
                        <p className="text-sm text-gray-700 mb-2">{area.description}</p>
                        <p className="text-xs text-blue-700 mb-2">
                          <strong>Current Progress:</strong> {area.currentProgress}
                        </p>
                        <p className="text-xs text-gray-600 italic">
                          💬 {area.supportiveMessage}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Practical Home Support Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Practical Home Support Actions
                  </CardTitle>
                  <CardDescription>Ways to support learning at home</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {homeSupportActions.map((action, idx) => {
                      const categoryColors = {
                        cognitive: 'bg-blue-100 text-blue-600',
                        creative: 'bg-purple-100 text-purple-600',
                        social: 'bg-green-100 text-green-600',
                        emotional: 'bg-pink-100 text-pink-600',
                      };
                      const colorClass = categoryColors[action.category] || 'bg-gray-100 text-gray-600';
                      
                      return (
                        <div
                          key={idx}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                              {getCategoryIcon(action.category)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-900 mb-1">
                                {action.title}
                              </h4>
                              <p className="text-sm text-gray-600">{action.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Learning Style Snapshot */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Learning Style Snapshot
                  </CardTitle>
                  <CardDescription>How your child learns best</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      {learningStyle.preferredMode === 'explorer' ? (
                        <Compass className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Target className="h-5 w-5 text-purple-600" />
                      )}
                      <span className="font-semibold text-sm">
                        {learningStyle.preferredMode === 'explorer' ? 'Explorer Mode' : 'Facilitator Mode'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Your child naturally prefers {learningStyle.preferredMode === 'explorer' ? 'exploring diverse interests' : 'focused skill development'}.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Characteristics:</p>
                    <ul className="space-y-1">
                      {learningStyle.characteristics.map((char, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                          <span>{char}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Natural Strengths:</p>
                    <div className="flex flex-wrap gap-2">
                      {learningStyle.strengths.map((strength, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Narrative */}
              <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    Progress Narrative
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 leading-relaxed italic">
                    "{progressNarrative}"
                  </p>
                </CardContent>
              </Card>

              {/* Gentle Observations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Gentle Observations
                  </CardTitle>
                  <CardDescription>Supportive insights for your consideration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {observations.map((obs, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          obs.type === 'positive'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {obs.type === 'positive' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-700 mb-1">
                              {obs.category}
                            </p>
                            <p className="text-sm text-gray-600">{obs.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Parent Reflection Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Parent Reflection Notes
                  </CardTitle>
                  <CardDescription>Private notes for your personal use</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Add your thoughts, observations, or questions here..."
                    value={reflectionNotes}
                    onChange={(e) => setReflectionNotes(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                  <Button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="w-full"
                    size="sm"
                  >
                    {savingNotes ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save Notes
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Your notes are private and only visible to you
                  </p>
                </CardContent>
              </Card>

              {/* Privacy & Consent Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy & Consent Summary
                  </CardTitle>
                  <CardDescription>Your data privacy controls</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="privacy">
                      <AccordionTrigger className="text-sm font-medium">
                        View Privacy Settings
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">Assessment Data</p>
                              <p className="text-xs text-gray-500">Consent granted</p>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">AI Analysis</p>
                              <p className="text-xs text-gray-500">Consent granted</p>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">Timeline Visibility</p>
                              <p className="text-xs text-gray-500">Parent can view timeline</p>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-2">
                            Manage Consent Settings
                          </Button>
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

      {/* Progress Chart Dialog */}
      <Dialog open={isChartDialogOpen} onOpenChange={setIsChartDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCategory && (
                <>
                  {getTrendIcon(selectedCategory.trend)}
                  <span>{selectedCategory.category} - Progress Over Time</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Track your child's progress in {selectedCategory?.category.toLowerCase()} over the past 6 months
            </DialogDescription>
          </DialogHeader>
          
          {selectedCategory && selectedCategory.historicalData && (
            <div className="mt-4">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Current Status</p>
                    <p className="text-xs text-gray-500">{selectedCategory.period}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${selectedCategory.change > 0 ? 'text-green-600' : selectedCategory.change < 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                      {selectedCategory.change > 0 ? '+' : ''}{selectedCategory.change}%
                    </p>
                    <p className="text-xs text-gray-500">Change</p>
                  </div>
                </div>
                <div className="mt-2">
                  <Badge className={getTrendColor(selectedCategory.trend)}>
                    {selectedCategory.trend === 'improving' ? 'Improving' : selectedCategory.trend === 'stable' ? 'Stable' : 'Developing'}
                  </Badge>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={selectedCategory.historicalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      fontSize={12}
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#6b7280"
                      fontSize={12}
                      tick={{ fill: '#6b7280' }}
                      label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                      formatter={(value: number | undefined) => {
                        if (value === undefined) return ['N/A', 'Score'];
                        return [`${value}%`, 'Score'];
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke={selectedCategory.trend === 'improving' ? '#10b981' : selectedCategory.trend === 'stable' ? '#3b82f6' : '#f59e0b'}
                      strokeWidth={3}
                      dot={{ fill: selectedCategory.trend === 'improving' ? '#10b981' : selectedCategory.trend === 'stable' ? '#3b82f6' : '#f59e0b', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Progress Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  <strong>Insight:</strong> {selectedCategory.trend === 'improving' 
                    ? `Your child is showing consistent improvement in ${selectedCategory.category.toLowerCase()}. This positive trend indicates growing confidence and skill development.`
                    : selectedCategory.trend === 'stable'
                    ? `Your child's ${selectedCategory.category.toLowerCase()} skills are maintaining a steady level. This stability shows consistent engagement and practice.`
                    : `Your child is developing ${selectedCategory.category.toLowerCase()} skills. With continued support and practice, we expect to see growth in this area.`
                  }
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

