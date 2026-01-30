/**
 * Parent Thinking Page
 * 
 * Shows how the child thinks - thinking style map and talent signals.
 * 
 * @module app/(parent)/parent/thinking
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Eye, Home, Loader2 } from 'lucide-react';
import { ParentThinkingDTO } from '@/lib/parent-dtos';
import { ConfidenceBand } from '@/lib/parent-evidence-gating';

export default function ParentThinkingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ParentThinkingDTO | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/parent/thinking', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching thinking data:', error);
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
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load thinking data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">How Your Child Thinks</h1>
        <p className="text-gray-600">Understanding your child's thinking style and patterns</p>
      </div>

      {/* Thinking Style Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Thinking Style Map
          </CardTitle>
          <CardDescription>Visual representation of thinking dimensions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.thinkingStyleMap.dimensions.map((dimension, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{dimension.name}</span>
                  <span className="text-sm text-gray-600">{dimension.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${dimension.value}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{dimension.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Talent Signals */}
      <Card>
        <CardHeader>
          <CardTitle>Talent Signals</CardTitle>
          <CardDescription>Evidence-based observations about thinking patterns</CardDescription>
        </CardHeader>
        <CardContent>
          {data.talentSignals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No talent signals available yet. Complete more activities to unlock insights.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.talentSignals.map((item, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">{item.signal.name}</h3>
                    </div>
                    {getConfidenceBadge(item.signal.confidence)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Eye className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-700">What we observed</p>
                        <p className="text-sm text-gray-600">{item.whatWeObserved}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Brain className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-700">What it may indicate</p>
                        <p className="text-sm text-gray-600">{item.whatItMayIndicate}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Home className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-700">What it means at home</p>
                        <p className="text-sm text-gray-600">{item.whatItMeansAtHome}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Confidence:</span> {item.signal.confidence} • {item.signal.evidenceSummary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

