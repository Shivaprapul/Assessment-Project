/**
 * Parent Talents Page
 * 
 * Shows hidden and emerging talents.
 * 
 * @module app/(parent)/parent/talents
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Lock, Lightbulb, Loader2 } from 'lucide-react';
import { ParentTalentsDTO } from '@/lib/parent-dtos';
import { ConfidenceBand } from '@/lib/parent-evidence-gating';

export default function ParentTalentsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ParentTalentsDTO | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/parent/talents', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching talents data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceBadge = (confidence: ConfidenceBand) => {
    switch (confidence) {
      case 'STRONG':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Strong</Badge>;
      case 'MODERATE':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Moderate</Badge>;
      case 'EMERGING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Emerging</Badge>;
      default:
        return null;
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
        <p className="text-gray-600">Unable to load talents data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.title}</h1>
        <p className="text-gray-600">Discover strengths that may not be visible in traditional academic settings</p>
      </div>

      {data.signals.length === 0 && data.lockedPlaceholders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>No talent insights available yet. Complete more activities to unlock insights.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {data.signals.map((item, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <CardTitle>{item.signal.name}</CardTitle>
                  </div>
                  {getConfidenceBadge(item.signal.confidence)}
                </div>
                <CardDescription>{item.signal.explanation}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">Why this may be hidden in school</p>
                  <p className="text-sm text-gray-700">{item.whyHiddenInSchool}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Real-world examples</p>
                  <ul className="space-y-2">
                    {item.realWorldExamples.map((example, exIdx) => (
                      <li key={exIdx} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Support Tip</p>
                      <p className="text-sm text-gray-700">{item.supportTip}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Evidence:</span> {item.signal.evidenceSummary}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {data.lockedPlaceholders.map((placeholder, idx) => (
            <Card key={idx} className="bg-gray-50 border-gray-200">
              <CardContent className="py-12 text-center">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">{placeholder.message}</p>
                <p className="text-sm text-gray-600">
                  {placeholder.activitiesNeeded} more {placeholder.activitiesNeeded === 1 ? 'activity' : 'activities'} needed
                </p>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

