/**
 * Parent Activity Page
 * 
 * Shows parent-safe activity list.
 * 
 * @module app/(parent)/parent/activity
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Clock, Loader2, FileText, Sparkles, Eye } from 'lucide-react';
import { ParentActivityDTO } from '@/lib/parent-dtos';

export default function ParentActivityPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ParentActivityDTO | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/parent/activity', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load activity data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity History</h1>
        <p className="text-gray-600">Overview of your child's learning activities</p>
      </div>

      {data.activities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>No activities completed yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.activities.map((activity) => (
            <Card key={activity.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-lg">{activity.title}</CardTitle>
                  </div>
                  {activity.isTeacherAssigned && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Teacher Assigned
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Completed {new Date(activity.completedAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Completion Rate</p>
                    <p className="text-sm font-semibold">{activity.performanceSummary.completionRate}%</p>
                  </div>
                  {activity.performanceSummary.timeTaken > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Time Taken</p>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <p className="text-sm font-semibold">{activity.performanceSummary.timeTaken} min</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Type</p>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {activity.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>

                {activity.performanceSummary.skillTags.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Skills Practiced</p>
                    <div className="flex flex-wrap gap-2">
                      {activity.performanceSummary.skillTags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag.replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Eye className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-900 mb-1">What it indicates</p>
                      <p className="text-sm text-gray-700">{activity.whatItIndicates}</p>
                    </div>
                  </div>
                </div>

                {activity.supportSuggestions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-900 mb-2">Support Suggestions</p>
                    <ul className="space-y-1">
                      {activity.supportSuggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <Sparkles className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

