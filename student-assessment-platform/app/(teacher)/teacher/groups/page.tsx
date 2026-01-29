/**
 * Teacher Groups Page
 * 
 * View and manage student groups (manual + smart).
 * 
 * @module app/(teacher)/groups
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Users, Sparkles, Plus } from 'lucide-react';
import { TeacherHeader } from '@/components/TeacherHeader';

interface Group {
  id: string;
  name: string;
  type: 'MANUAL' | 'SMART';
  studentCount: number;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/teacher/groups', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const manualGroups = groups.filter((g) => g.type === 'MANUAL');
  const smartGroups = groups.filter((g) => g.type === 'SMART');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <TeacherHeader />
      <div className="container mx-auto px-4 pt-4">
        <Button variant="ghost" onClick={() => router.push('/teacher')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Smart Groups */}
          {smartGroups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Smart Groups
                </CardTitle>
                <CardDescription>
                  Auto-generated groups based on student activity and skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {smartGroups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{group.name}</h3>
                            <Badge variant="secondary">Smart</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {group.studentCount} student{group.studentCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/teacher/assign?groupId=${group.id}`)}
                        >
                          Assign Activity
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Manual Groups */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Manual Groups
                  </CardTitle>
                  <CardDescription>
                    Groups created by you
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : manualGroups.length > 0 ? (
                <div className="space-y-3">
                  {manualGroups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{group.name}</h3>
                          <Badge variant="outline">Manual</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {group.studentCount} student{group.studentCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/teacher/assign?groupId=${group.id}`)}
                      >
                        Assign Activity
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No manual groups yet</p>
                  <Button variant="outline" className="mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Group
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

