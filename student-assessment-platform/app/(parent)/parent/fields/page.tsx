/**
 * Parent Fields Page
 * 
 * Shows fields where child may flourish.
 * 
 * @module app/(parent)/parent/fields
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass, AlertCircle, Loader2 } from 'lucide-react';
import { ParentFieldsDTO } from '@/lib/parent-dtos';

export default function ParentFieldsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ParentFieldsDTO | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/parent/fields', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching fields data:', error);
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
        <p className="text-gray-600">Unable to load fields data</p>
      </div>
    );
  }

  // Group fields by category
  const fieldsByCategory = data.fields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, typeof data.fields>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fields Where Your Child May Flourish</h1>
        <p className="text-gray-600">Exploration areas aligned with observed strengths</p>
      </div>

      {data.fields.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>No field insights available yet. Complete more activities to unlock insights.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(fieldsByCategory).map(([category, fields]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
            {fields.map((field, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-blue-600" />
                    <CardTitle>{field.name}</CardTitle>
                  </div>
                  <CardDescription>Why this field aligns with your child's strengths</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">Why it aligns</p>
                    <p className="text-sm text-gray-700">{field.whyItAligns}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Suggested exploration activities</p>
                    <ul className="space-y-2">
                      {field.suggestedExploration.map((activity, actIdx) => (
                        <li key={actIdx} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600">{field.disclaimer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

