/**
 * Teacher Tracker Dashboard
 * 
 * Helps teachers understand class patterns, track progress, and take classroom actions.
 * Focuses on support and growth, not surveillance.
 * 
 * Features:
 * - Class Snapshot (active students, completion %, strengths, needs support)
 * - Student List Table with filters
 * - Improvements Over Time (trend visualization)
 * - Strengthening Areas (gentle phrasing + classroom actions)
 * - Skill Heatmap (class distribution)
 * - Grouping Suggestions (auto-cluster)
 * - Classroom Actions Toolkit (5-10 min activities)
 * - Assign Activity (modal with due date)
 * 
 * @module app/(student)/teacher-tracker
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  CheckCircle2,
  Clock,
  Target,
  Brain,
  GraduationCap,
  Sparkles,
  Lightbulb,
  BookOpen,
  Calendar,
  Filter,
  X,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Activity,
  UserCheck,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserMenu } from '@/components/UserMenu';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Mock data interfaces
interface ClassSnapshot {
  className: string;
  grade: number;
  section: string;
  totalStudents: number;
  activeThisWeek: number;
  completionRate: number;
  topStrengths: string[];
  topStrengtheningAreas: string[];
  needsSupportCount: number;
}

interface Student {
  id: string;
  name: string;
  grade: number;
  section: string;
  lastActive: string;
  completion: 'complete' | 'in_progress' | 'not_started';
  trend: 'improving' | 'stable' | 'developing';
  strengtheningArea: string;
  status: 'active' | 'inactive';
}

interface ImprovementTrend {
  category: string;
  studentsImproving: number;
  studentsStable: number;
  studentsDeveloping: number;
  period: string;
}

interface StrengtheningArea {
  category: string;
  studentCount: number;
  description: string;
  recommendedActions: string[];
}

interface SkillDistribution {
  category: string;
  strong: number; // students with strong skills
  developing: number; // students developing
  emerging: number; // students emerging
}

interface GroupingSuggestion {
  id: string;
  name: string;
  students: string[];
  rationale: string;
  suggestedActivity: string;
}

interface ClassroomAction {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g., "5-10 min"
  category: string;
  difficulty: 'easy' | 'medium' | 'advanced';
}

export default function TeacherTrackerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ClassroomAction | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<string>('all');
  const [strengtheningAreaFilter, setStrengtheningAreaFilter] = useState<string>('all');
  const [lastActiveFilter, setLastActiveFilter] = useState<string>('all');

  // Mock data
  const [classSnapshot] = useState<ClassSnapshot>({
    className: 'Grade 9 - Section A',
    grade: 9,
    section: 'A',
    totalStudents: 35,
    activeThisWeek: 28,
    completionRate: 85,
    topStrengths: ['Logical Reasoning', 'Planning Skills', 'Creative Thinking'],
    topStrengtheningAreas: ['Social Awareness', 'Verbal Logic', 'Metacognition'],
    needsSupportCount: 5,
  });

  const [students] = useState<Student[]>([
    { id: '1', name: 'Narasimha', grade: 9, section: 'A', lastActive: '2026-01-21', completion: 'complete', trend: 'improving', strengtheningArea: 'Creative Thinking', status: 'active' },
    { id: '2', name: 'Priya Sharma', grade: 9, section: 'A', lastActive: '2026-01-20', completion: 'complete', trend: 'improving', strengtheningArea: 'Logical Reasoning', status: 'active' },
    { id: '3', name: 'Arjun Patel', grade: 9, section: 'A', lastActive: '2026-01-19', completion: 'in_progress', trend: 'stable', strengtheningArea: 'Social Awareness', status: 'active' },
    { id: '4', name: 'Sneha Reddy', grade: 9, section: 'A', lastActive: '2026-01-18', completion: 'complete', trend: 'improving', strengtheningArea: 'Planning Skills', status: 'active' },
    { id: '5', name: 'Rohan Kumar', grade: 9, section: 'A', lastActive: '2026-01-15', completion: 'not_started', trend: 'developing', strengtheningArea: 'Verbal Logic', status: 'inactive' },
    { id: '6', name: 'Ananya Singh', grade: 9, section: 'A', lastActive: '2026-01-21', completion: 'complete', trend: 'improving', strengtheningArea: 'Metacognition', status: 'active' },
    { id: '7', name: 'Vikram Mehta', grade: 9, section: 'A', lastActive: '2026-01-17', completion: 'in_progress', trend: 'stable', strengtheningArea: 'Social Awareness', status: 'active' },
    { id: '8', name: 'Isha Gupta', grade: 9, section: 'A', lastActive: '2026-01-20', completion: 'complete', trend: 'improving', strengtheningArea: 'Creative Thinking', status: 'active' },
  ]);

  const [improvementTrends] = useState<ImprovementTrend[]>([
    { category: 'Logical Reasoning', studentsImproving: 12, studentsStable: 8, studentsDeveloping: 2, period: 'Last month' },
    { category: 'Creative Thinking', studentsImproving: 10, studentsStable: 10, studentsDeveloping: 3, period: 'Last month' },
    { category: 'Planning Skills', studentsImproving: 8, studentsStable: 12, studentsDeveloping: 2, period: 'Last month' },
    { category: 'Social Awareness', studentsImproving: 6, studentsStable: 8, studentsDeveloping: 8, period: 'Last month' },
  ]);

  const [strengtheningAreas] = useState<StrengtheningArea[]>([
    {
      category: 'Social Awareness',
      studentCount: 8,
      description: 'Students are developing their ability to understand social dynamics and collaborate effectively',
      recommendedActions: [
        'Pair students for collaborative problem-solving',
        'Use group discussions to explore different perspectives',
        'Encourage peer teaching moments',
      ],
    },
    {
      category: 'Verbal Logic',
      studentCount: 6,
      description: 'Students are building their skills in expressing logical arguments clearly',
      recommendedActions: [
        'Incorporate structured debates on curriculum topics',
        'Use "explain your thinking" prompts in assignments',
        'Practice structured writing exercises',
      ],
    },
    {
      category: 'Metacognition',
      studentCount: 5,
      description: 'Students are learning to reflect on their own learning processes',
      recommendedActions: [
        'Add reflection questions to assignments',
        'Use "think-aloud" protocols during problem-solving',
        'Encourage students to track their own progress',
      ],
    },
  ]);

  const [skillDistribution] = useState<SkillDistribution[]>([
    { category: 'Logical Reasoning', strong: 15, developing: 12, emerging: 8 },
    { category: 'Creative Thinking', strong: 12, developing: 15, emerging: 8 },
    { category: 'Planning Skills', strong: 14, developing: 13, emerging: 8 },
    { category: 'Social Awareness', strong: 8, developing: 12, emerging: 15 },
    { category: 'Verbal Logic', strong: 10, developing: 14, emerging: 11 },
    { category: 'Metacognition', strong: 9, developing: 13, emerging: 13 },
  ]);

  const [groupingSuggestions] = useState<GroupingSuggestion[]>([
    {
      id: '1',
      name: 'Creative Collaborators',
      students: ['Narasimha', 'Priya Sharma', 'Isha Gupta'],
      rationale: 'These students share strengths in creative thinking and could benefit from collaborative creative projects',
      suggestedActivity: 'Group storytelling challenge',
    },
    {
      id: '2',
      name: 'Social Skills Builders',
      students: ['Arjun Patel', 'Vikram Mehta', 'Rohan Kumar'],
      rationale: 'Students developing social awareness skills can support each other through peer interactions',
      suggestedActivity: 'Peer teaching session',
    },
    {
      id: '3',
      name: 'Logical Thinkers',
      students: ['Sneha Reddy', 'Ananya Singh'],
      rationale: 'Students with strong logical reasoning can challenge each other with complex problems',
      suggestedActivity: 'Problem-solving pairs',
    },
  ]);

  const [classroomActions] = useState<ClassroomAction[]>([
    {
      id: '1',
      title: 'Think-Pair-Share: Problem Analysis',
      description: 'Students analyze a problem individually, discuss with a partner, then share insights with the class',
      duration: '10 min',
      category: 'Logical Reasoning',
      difficulty: 'easy',
    },
    {
      id: '2',
      title: 'Creative Brainstorming Session',
      description: 'Open-ended creative challenge where students generate multiple solutions to a real-world problem',
      duration: '8 min',
      category: 'Creative Thinking',
      difficulty: 'easy',
    },
    {
      id: '3',
      title: 'Collaborative Planning Exercise',
      description: 'Small groups plan a project together, practicing planning and coordination skills',
      duration: '10 min',
      category: 'Planning Skills',
      difficulty: 'medium',
    },
    {
      id: '4',
      title: 'Perspective-Taking Discussion',
      description: 'Students discuss a scenario from multiple viewpoints to build social awareness',
      duration: '7 min',
      category: 'Social Awareness',
      difficulty: 'easy',
    },
    {
      id: '5',
      title: 'Structured Argument Practice',
      description: 'Students practice building logical arguments with clear evidence and reasoning',
      duration: '9 min',
      category: 'Verbal Logic',
      difficulty: 'medium',
    },
    {
      id: '6',
      title: 'Reflection Journal Prompt',
      description: 'Students reflect on their learning process and identify what strategies worked best',
      duration: '5 min',
      category: 'Metacognition',
      difficulty: 'easy',
    },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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

  const getCompletionBadge = (completion: string) => {
    switch (completion) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Complete</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      case 'not_started':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Not Started</Badge>;
      default:
        return null;
    }
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredStudents = students.filter((student) => {
    if (statusFilter !== 'all' && student.status !== statusFilter) return false;
    if (completionFilter !== 'all' && student.completion !== completionFilter) return false;
    if (strengtheningAreaFilter !== 'all' && student.strengtheningArea !== strengtheningAreaFilter) return false;
    if (lastActiveFilter === 'recent' && formatLastActive(student.lastActive).includes('days ago') && parseInt(formatLastActive(student.lastActive)) > 3) return false;
    if (lastActiveFilter === 'inactive' && !formatLastActive(student.lastActive).includes('Today') && !formatLastActive(student.lastActive).includes('Yesterday')) return false;
    return true;
  });

  const uniqueStrengtheningAreas = Array.from(new Set(students.map(s => s.strengtheningArea)));

  const handleAssignActivity = (action: ClassroomAction) => {
    setSelectedActivity(action);
    setIsAssignModalOpen(true);
  };

  const handleSubmitAssignment = () => {
    // TODO: API call to assign activity
    console.log('Assigning activity:', selectedActivity, 'Due:', dueDate, dueTime);
    setIsAssignModalOpen(false);
    setSelectedActivity(null);
    setDueDate('');
    setDueTime('');
  };

  // Prepare heatmap data
  const heatmapData = skillDistribution.map((skill) => ({
    category: skill.category,
    Strong: skill.strong,
    Developing: skill.developing,
    Emerging: skill.emerging,
  }));

  const COLORS = {
    Strong: '#10b981', // green
    Developing: '#3b82f6', // blue
    Emerging: '#f59e0b', // orange
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
                name: 'Teacher User',
                email: 'teacher@test-school.com',
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
              Teacher Tracker
            </h1>
            <p className="text-gray-600">
              {classSnapshot.className} • {classSnapshot.totalStudents} students
            </p>
          </div>

          {/* Class Snapshot */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Class Snapshot
              </CardTitle>
              <CardDescription>Overview of class engagement and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Active This Week</p>
                  <p className="text-2xl font-bold text-blue-600">{classSnapshot.activeThisWeek}</p>
                  <p className="text-xs text-gray-500">of {classSnapshot.totalStudents} students</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-2xl font-bold text-green-600">{classSnapshot.completionRate}%</p>
                  <p className="text-xs text-gray-500">assessments complete</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Top Strengths</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {classSnapshot.topStrengths.slice(0, 2).map((strength, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-600 mb-1">Needs Support</p>
                  <p className="text-2xl font-bold text-orange-600">{classSnapshot.needsSupportCount}</p>
                  <p className="text-xs text-gray-500">students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student List Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Student List
                  </CardTitle>
                  <CardDescription>Track individual student progress</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={completionFilter} onValueChange={setCompletionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Completion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Completion</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={strengtheningAreaFilter} onValueChange={setStrengtheningAreaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Strengthening Area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    {uniqueStrengtheningAreas.map((area) => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={lastActiveFilter} onValueChange={setLastActiveFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Last Active" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="recent">Recent (3 days)</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Grade/Section</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead>Strengthening Area</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.grade}-{student.section}</TableCell>
                        <TableCell>{formatLastActive(student.lastActive)}</TableCell>
                        <TableCell>{getCompletionBadge(student.completion)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(student.trend)}
                            <span className="text-xs text-gray-600 capitalize">{student.trend}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {student.strengtheningArea}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Improvements Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Improvements Over Time
                  </CardTitle>
                  <CardDescription>Class-wide progress trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {improvementTrends.map((trend, idx) => (
                      <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm">{trend.category}</h4>
                          <span className="text-xs text-gray-500">{trend.period}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-green-50 rounded">
                            <p className="text-lg font-bold text-green-700">{trend.studentsImproving}</p>
                            <p className="text-xs text-gray-600">Improving</p>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <p className="text-lg font-bold text-blue-700">{trend.studentsStable}</p>
                            <p className="text-xs text-gray-600">Stable</p>
                          </div>
                          <div className="text-center p-2 bg-orange-50 rounded">
                            <p className="text-lg font-bold text-orange-700">{trend.studentsDeveloping}</p>
                            <p className="text-xs text-gray-600">Developing</p>
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <CardDescription>Areas where students are growing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {strengtheningAreas.map((area, idx) => (
                      <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm text-blue-900">{area.category}</h4>
                          <Badge variant="outline" className="bg-white">
                            {area.studentCount} students
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{area.description}</p>
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">Recommended Actions:</p>
                          <ul className="space-y-1">
                            {area.recommendedActions.map((action, actionIdx) => (
                              <li key={actionIdx} className="flex items-start gap-2 text-xs text-gray-600">
                                <Lightbulb className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Grouping Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Grouping Suggestions
                  </CardTitle>
                  <CardDescription>Recommended student groupings for activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {groupingSuggestions.map((group) => (
                      <div key={group.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <h4 className="font-semibold text-sm mb-2">{group.name}</h4>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {group.students.map((student, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {student}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{group.rationale}</p>
                        <p className="text-xs text-blue-600">
                          <strong>Suggested:</strong> {group.suggestedActivity}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Skill Heatmap */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Skill Distribution
                  </CardTitle>
                  <CardDescription>Class distribution across skill categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={heatmapData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#6b7280" fontSize={12} />
                        <YAxis dataKey="category" type="category" stroke="#6b7280" fontSize={12} width={120} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Strong" stackId="a" fill={COLORS.Strong} />
                        <Bar dataKey="Developing" stackId="a" fill={COLORS.Developing} />
                        <Bar dataKey="Emerging" stackId="a" fill={COLORS.Emerging} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-500"></div>
                      <span className="text-xs text-gray-600">Strong</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-500"></div>
                      <span className="text-xs text-gray-600">Developing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-orange-500"></div>
                      <span className="text-xs text-gray-600">Emerging</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Classroom Actions Toolkit */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Classroom Actions Toolkit
                  </CardTitle>
                  <CardDescription>Quick activities for skill development</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {classroomActions.map((action) => (
                      <div
                        key={action.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-gray-900 mb-1">{action.title}</h4>
                            <p className="text-xs text-gray-600 mb-2">{action.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {action.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {action.duration}
                              </Badge>
                              <Badge variant="outline" className="text-xs capitalize">
                                {action.difficulty}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => handleAssignActivity(action)}
                        >
                          <Calendar className="h-3 w-3 mr-2" />
                          Assign to Class
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Assign Activity Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Activity to Class</DialogTitle>
            <DialogDescription>
              {selectedActivity?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dueTime">Due Time (optional)</Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="mt-1"
              />
            </div>
            {selectedActivity && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Duration:</strong> {selectedActivity.duration}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Category:</strong> {selectedActivity.category}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAssignment} disabled={!dueDate}>
              Assign Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

