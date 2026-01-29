/**
 * Teacher Assignment View Page
 * 
 * View assignment details and student progress.
 * 
 * @module app/(teacher)/teacher/assignments/[assignmentId]
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Loader2, 
  Users, 
  Calendar, 
  Target, 
  CheckCircle2, 
  Clock, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { TeacherHeader } from '@/components/TeacherHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AssignmentData {
  assignment: {
    id: string;
    title: string;
    description: string | null;
    targetType: string;
    questCount: number;
    questTypes: string[];
    intent: string | null;
    dueDate: string | null;
    createdAt: string;
    isActive: boolean;
  };
  targetStudents: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    currentGrade: number;
  }>;
  progress: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
  attempts: Array<{
    id: string;
    studentId: string;
    studentName: string;
    status: string;
    assignedAt: string;
    startedAt: string | null;
    completedAt: string | null;
  }>;
}

function AssignmentViewContent() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.assignmentId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AssignmentData | null>(null);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/teacher/assignments/${assignmentId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else if (response.status === 404) {
        router.push('/teacher');
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Pending</Badge>;
      case 'OVERDUE':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getIntentLabel = (intent: string | null) => {
    if (!intent) return 'None';
    const intentMap: Record<string, string> = {
      IMPROVE_FOCUS: 'Improve Focus',
      STRENGTHEN_PLANNING: 'Strengthen Planning',
      ENCOURAGE_COMMUNICATION: 'Encourage Communication',
      BUILD_CONSISTENCY: 'Build Consistency',
      PREPARE_FOR_EXAMS: 'Prepare for Exams',
      REENGAGE_PARTICIPATION: 'Re-engage Participation',
    };
    return intentMap[intent] || intent;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <TeacherHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Assignment not found</p>
            <Button onClick={() => router.push('/teacher')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionRate = data.progress.total > 0 
    ? (data.progress.completed / data.progress.total) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <TeacherHeader />
      <div className="container mx-auto px-4 pt-4">
        <Button variant="ghost" onClick={() => router.push('/teacher')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Assignment Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl">{data.assignment.title}</CardTitle>
                  {data.assignment.description && (
                    <CardDescription className="mt-2">{data.assignment.description}</CardDescription>
                  )}
                </div>
                <Badge variant={data.assignment.isActive ? 'default' : 'secondary'}>
                  {data.assignment.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Target</p>
                    <p className="font-medium">
                      {data.assignment.targetType === 'CLASS' 
                        ? 'Entire Class' 
                        : data.assignment.targetType === 'GROUP'
                        ? 'Group(s)'
                        : 'Individual Student(s)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Intent</p>
                    <p className="font-medium">{getIntentLabel(data.assignment.intent)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-medium">
                      {data.assignment.dueDate 
                        ? new Date(data.assignment.dueDate).toLocaleDateString()
                        : 'No due date'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Summary</CardTitle>
              <CardDescription>Overall completion status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="text-sm font-semibold">{Math.round(completionRate)}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{data.progress.total}</p>
                  <p className="text-sm text-gray-600">Total Students</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">{data.progress.completed}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">{data.progress.inProgress}</p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-700">{data.progress.pending}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Student Progress</CardTitle>
              <CardDescription>{data.targetStudents.length} students assigned</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">All ({data.targetStudents.length})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({data.progress.completed})</TabsTrigger>
                  <TabsTrigger value="in-progress">In Progress ({data.progress.inProgress})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({data.progress.pending})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-2">
                  {data.targetStudents.map((student) => {
                    const attempt = data.attempts.find((a) => a.studentId === student.id);
                    return (
                      <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={student.avatar || undefined} />
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {student.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-gray-500">Grade {student.currentGrade}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {attempt ? (
                            <>
                              {getStatusBadge(attempt.status)}
                              {attempt.completedAt && (
                                <span className="text-xs text-gray-500">
                                  {new Date(attempt.completedAt).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              Not Started
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>

                <TabsContent value="completed" className="space-y-2">
                  {data.targetStudents
                    .filter((s) => {
                      const attempt = data.attempts.find((a) => a.studentId === s.id);
                      return attempt?.status === 'COMPLETED';
                    })
                    .map((student) => {
                      const attempt = data.attempts.find((a) => a.studentId === student.id);
                      return (
                        <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={student.avatar || undefined} />
                              <AvatarFallback className="bg-green-100 text-green-700">
                                {student.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-gray-500">Grade {student.currentGrade}</p>
                            </div>
                          </div>
                          {attempt && attempt.completedAt && (
                            <span className="text-xs text-gray-500">
                              Completed {new Date(attempt.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </TabsContent>

                <TabsContent value="in-progress" className="space-y-2">
                  {data.targetStudents
                    .filter((s) => {
                      const attempt = data.attempts.find((a) => a.studentId === s.id);
                      return attempt?.status === 'IN_PROGRESS';
                    })
                    .map((student) => {
                      const attempt = data.attempts.find((a) => a.studentId === student.id);
                      return (
                        <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={student.avatar || undefined} />
                              <AvatarFallback className="bg-blue-100 text-blue-700">
                                {student.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-gray-500">Grade {student.currentGrade}</p>
                            </div>
                          </div>
                          {attempt && attempt.startedAt && (
                            <span className="text-xs text-gray-500">
                              Started {new Date(attempt.startedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </TabsContent>

                <TabsContent value="pending" className="space-y-2">
                  {data.targetStudents
                    .filter((s) => {
                      const attempt = data.attempts.find((a) => a.studentId === s.id);
                      return !attempt || attempt.status === 'PENDING';
                    })
                    .map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={student.avatar || undefined} />
                            <AvatarFallback className="bg-gray-100 text-gray-700">
                              {student.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-gray-500">Grade {student.currentGrade}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Pending
                        </Badge>
                      </div>
                    ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Assignment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Quest Count</p>
                <p className="text-sm text-gray-600">{data.assignment.questCount} quest(s)</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Quest Types</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.assignment.questTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="capitalize">
                      {type.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Created</p>
                <p className="text-sm text-gray-600">
                  {new Date(data.assignment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function AssignmentViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    }>
      <AssignmentViewContent />
    </Suspense>
  );
}

