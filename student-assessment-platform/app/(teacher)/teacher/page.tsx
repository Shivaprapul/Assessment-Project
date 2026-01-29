/**
 * Teacher Dashboard
 * 
 * Main dashboard for teachers showing class signals, student overview, and quick actions.
 * 
 * @module app/(teacher)/page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BookOpen,
  Target,
  Settings,
  Plus,
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { TeacherHeader } from '@/components/TeacherHeader';

interface ClassSignal {
  type: 'engagement' | 'strength' | 'strengthening' | 'anomaly';
  message: string;
  trend?: 'up' | 'down' | 'stable';
}

interface StudentSummary {
  id: string;
  name: string;
  lastActive: string;
  questsCompleted: number;
  skillHighlights: string[];
  status: 'active' | 'needs_nudge' | 'new_joiner';
  currentGrade: number;
  initials?: string; // For demo students
}

export default function TeacherDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [classSignals, setClassSignals] = useState<ClassSignal[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Debug log to verify page component is mounting
  console.log('[TeacherDashboard] Component mounted');

  useEffect(() => {
    console.log('[TeacherDashboard] useEffect - Component mounted');
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch class signals and student list
      const [signalsRes, studentsRes] = await Promise.all([
        fetch('/api/teacher/class-signals', { credentials: 'include' }),
        fetch('/api/teacher/students', { credentials: 'include' }),
      ]);

      if (signalsRes.ok) {
        const signalsData = await signalsRes.json();
        setClassSignals(signalsData.data || []);
      }

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'needs_nudge':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Needs nudge</Badge>;
      case 'new_joiner':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">New joiner</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <TeacherHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Class Signals Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Class Signals
              </CardTitle>
              <CardDescription>
                Insights about your class this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : classSignals.length > 0 ? (
                <ul className="space-y-2">
                  {classSignals.map((signal, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {getTrendIcon(signal.trend)}
                      <span className="text-sm text-gray-700 flex-1">{signal.message}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No signals available yet</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              asChild
              className="h-auto p-6 flex flex-col items-start gap-2"
              variant="outline"
            >
              <Link href="/teacher/assign">
                <Plus className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Assign Activity</div>
                  <div className="text-sm text-gray-600 font-normal">
                    Create assignments for students
                  </div>
                </div>
              </Link>
            </Button>
            <Button
              asChild
              className="h-auto p-6 flex flex-col items-start gap-2"
              variant="outline"
            >
              <Link href="/teacher/groups">
                <Users className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">View Groups</div>
                  <div className="text-sm text-gray-600 font-normal">
                    Manage student groups
                  </div>
                </div>
              </Link>
            </Button>
            <Button
              asChild
              className="h-auto p-6 flex flex-col items-start gap-2"
              variant="outline"
            >
              <Link href="/teacher/settings">
                <Settings className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Adjust Class Focus</div>
                  <div className="text-sm text-gray-600 font-normal">
                    Set skill priorities
                  </div>
                </div>
              </Link>
            </Button>
          </div>

          {/* Class Overview Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Class Overview
                  </CardTitle>
                  <CardDescription>
                    {students.length} students in your class
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Student</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Active</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quests (Week)</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Skills</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{student.name}</div>
                            <div className="text-xs text-gray-500">Grade {student.currentGrade}</div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {student.lastActive || 'Never'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{student.questsCompleted}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {student.skillHighlights.slice(0, 2).map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {student.skillHighlights.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{student.skillHighlights.length - 2}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(student.status)}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/teacher/students/${student.id}`)}
                            >
                              View
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No students found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

