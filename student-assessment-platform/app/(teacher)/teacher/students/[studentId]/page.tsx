/**
 * Teacher Student Drilldown
 * 
 * Brief actionable report for a specific student.
 * 
 * TEACHER-SAFE VIEW ONLY:
 * - Brief insights (not full AI narratives)
 * - Skill highlights with neutral wording
 * - Recent activity summaries
 * - Recommended classroom actions
 * - Teacher notes (private)
 * 
 * @module app/(teacher)/students/[studentId]
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Lightbulb,
  Clock,
  CheckCircle2,
  Plus,
  Flame,
  Target,
  BookOpen,
  Save,
  Loader2
} from 'lucide-react';
import { TeacherHeader } from '@/components/TeacherHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StudentReport {
  id: string;
  name: string;
  initials?: string;
  currentGrade: number;
  section: string;
  lastActive: string | null;
  lastActiveTimestamp: string | null;
  weeklyActivity: {
    questsCompleted: number;
    streak: number;
    avgAccuracy: number;
  };
  status: 'active' | 'needs_nudge' | 'new_joiner';
  thisWeekInsights: {
    strength: { skill: string; message: string } | null;
    strengthening: { skill: string; message: string } | null;
    engagement: string;
  };
  skillHighlights: {
    topStrengths: Array<{
      skill: string;
      score: number;
      level: string;
      trend7d: string;
      trend30d: string;
    }>;
    topStrengthening: Array<{
      skill: string;
      score: number;
      trend7d: string;
      trend30d: string;
    }>;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    type: string;
    completedAt: string | null;
    completedAtFormatted: string;
    status: string;
    xpEarned: number;
    timeTaken: number;
    skillTags: string[];
  }>;
  recommendedActions: string[];
  teacherNotes: Array<{
    id: string;
    note: string;
    createdAt: string;
    teacherId: string;
  }>;
}

export default function StudentDrilldownPage({ params }: { params: Promise<{ studentId: string }> }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [report, setReport] = useState<StudentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setStudentId(resolvedParams.studentId);
      fetchStudentReport(resolvedParams.studentId);
    };
    loadParams();
  }, []);

  const fetchStudentReport = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/teacher/students/${id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data.data);
      } else if (response.status === 403) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching student report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !studentId) return;

    try {
      setIsSavingNote(true);
      const response = await fetch(`/api/teacher/students/${studentId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ note: newNote }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add note to local state
        if (report) {
          setReport({
            ...report,
            teacherNotes: [...report.teacherNotes, data.data],
          });
        }
        setNewNote('');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'needs_attention':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'needs_nudge':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Needs Nudge</Badge>;
      case 'new_joiner':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">New Joiner</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <TeacherHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Student not found</p>
            <Button onClick={() => router.push('/teacher')} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <TeacherHeader />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => router.push('/teacher')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Header: Student Snapshot */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={undefined} alt={report.name} />
                    <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
                      {report.initials || report.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{report.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">Grade {report.currentGrade}</Badge>
                      {report.section && <Badge variant="outline">Section {report.section}</Badge>}
                      {getStatusBadge(report.status)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/teacher/assign?studentId=${report.id}`)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Activity
                  </Button>
                </div>
              </div>

              {/* Weekly Engagement Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Last Active</p>
                  <p className="font-semibold">{report.lastActive || 'Never'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Quests This Week</p>
                  <p className="font-semibold">{report.weeklyActivity.questsCompleted}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Streak</p>
                  <div className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <p className="font-semibold">{report.weeklyActivity.streak} days</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Accuracy</p>
                  <p className="font-semibold">{Math.round(report.weeklyActivity.avgAccuracy)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Week in Brief */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                This Week in Brief
              </CardTitle>
              <CardDescription>Quick insights for this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {report.thisWeekInsights.strength && (
                  <li className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">Strength</p>
                      <p className="text-sm text-gray-600">{report.thisWeekInsights.strength.message}</p>
                    </div>
                  </li>
                )}
                {report.thisWeekInsights.strengthening && (
                  <li className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">Strengthening</p>
                      <p className="text-sm text-gray-600">{report.thisWeekInsights.strengthening.message}</p>
                    </div>
                  </li>
                )}
                <li className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">Engagement</p>
                    <p className="text-sm text-gray-600">{report.thisWeekInsights.engagement}</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Skill Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Strengths</CardTitle>
                <CardDescription>Skills showing consistent performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.skillHighlights.topStrengths.length > 0 ? (
                    report.skillHighlights.topStrengths.map((strength, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{strength.skill}</p>
                            {getTrendIcon(strength.trend7d)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Badge variant="secondary" className="text-xs">
                              {strength.level}
                            </Badge>
                            <span>Score: {Math.round(strength.score)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No strengths data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Strengthening Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Strengthening Areas</CardTitle>
                <CardDescription>Areas where the student needs to work on</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.skillHighlights.topStrengthening.length > 0 ? (
                    report.skillHighlights.topStrengthening.map((area, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{area.skill}</p>
                            {getTrendIcon(area.trend7d)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Score: {Math.round(area.score)}</span>
                            <Badge variant="outline" className="text-xs">
                              {area.trend7d === 'improving' ? 'Improving' : 'Needs attention'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No strengthening areas identified</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Classroom Actions */}
          {report.recommendedActions.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  Recommended Classroom Actions
                </CardTitle>
                <CardDescription>Actionable suggestions based on student patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.recommendedActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Last 5 quest attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.recentActivity.length > 0 ? (
                  report.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-sm capitalize">{activity.title}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 ml-6">
                          <span>{activity.completedAtFormatted}</span>
                          {activity.xpEarned > 0 && <span>+{activity.xpEarned} XP</span>}
                          {activity.timeTaken > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(activity.timeTaken)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {activity.skillTags.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Teacher Notes (Private) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Teacher Notes</CardTitle>
              <CardDescription>Private notes (not visible to student)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Note */}
              <div className="space-y-2">
                <Label htmlFor="note">Add Note</Label>
                <Textarea
                  id="note"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a private note about this student..."
                  rows={3}
                />
                <Button onClick={handleAddNote} disabled={!newNote.trim() || isSavingNote} size="sm">
                  {isSavingNote ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Note
                    </>
                  )}
                </Button>
              </div>

              {/* Existing Notes */}
              {report.teacherNotes.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  {report.teacherNotes.map((note) => (
                    <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{note.note}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
