/**
 * Latest Report Page
 * 
 * Displays the comprehensive AI-generated report after completing all 8 games.
 * Shows student insights, parent guidance, and recommendations.
 * 
 * @module app/(student)/reports/latest
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  Sparkles,
  Heart,
  TrendingUp,
  Target,
  CheckCircle2,
  Download,
  Share2,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserMenu } from '@/components/UserMenu';

interface ReportData {
  id: string;
  reportType: string;
  generatedAt: string;
  studentInsights: {
    strengths: string;
    growthAreas: string;
    recommendations: string[];
    celebratoryMessage: string;
  };
  parentGuidance: {
    overview: string;
    supportTips: string[];
    redFlags?: string[];
  };
  metadata: {
    demoGenerated?: boolean;
    generationTime?: number;
  };
}

export default function LatestReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_ASSESSMENTS === 'true';

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use demo endpoint in demo mode
      const endpoint = isDemoMode
        ? '/api/demo/reports/latest'
        : '/api/reports/latest';
      
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load report' }));
        throw new Error(errorData.error || 'Failed to load report');
      }

      const data = await response.json();
      if (data?.success) {
        // Demo endpoint returns { report, skillTree }, regular returns just report
        if (isDemoMode && data.data.report) {
          setReport(data.data.report);
        } else {
          setReport(data.data);
        }
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error fetching report:', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setIsLoading(false);
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
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-64 w-full mb-6" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Error Loading Report</CardTitle>
            </div>
            <CardDescription>{error || 'Report not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={fetchReport} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1">
                Back to Dashboard
              </Button>
            </div>
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
                name: 'Student User',
                email: 'student@test-school.com',
              }}
              onLogout={() => router.push('/login')}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Report Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Assessment Report</h1>
              <p className="text-gray-600">
                Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Demo Badge */}
          {report.metadata.demoGenerated && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-800">
                  <strong>Demo Report:</strong> This is a demonstration report generated from your assessment results.
                  In production, this would be generated using AI analysis.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Celebratory Message */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <Sparkles className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Congratulations! 🎉</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {report.studentInsights.celebratoryMessage}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Your Learning Profile
              </CardTitle>
              <CardDescription>Insights based on your assessment performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Strengths */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Strengths
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {report.studentInsights.strengths}
                </p>
              </div>

              {/* Growth Areas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Growth Opportunities
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {report.studentInsights.growthAreas}
                </p>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {report.studentInsights.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Parent Guidance */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="parent-guidance">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-600" />
                  <span className="font-semibold">Parent & Guardian Guidance</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="p-6 space-y-6">
                    {/* Overview */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Overview</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {report.parentGuidance.overview}
                      </p>
                    </div>

                    {/* Support Tips */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Support Your Child</h3>
                      <ul className="space-y-2">
                        {report.parentGuidance.supportTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-pink-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Red Flags (if any) */}
                    {report.parentGuidance.redFlags && report.parentGuidance.redFlags.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-yellow-900 mb-3">Gentle Observations</h3>
                        <ul className="space-y-2">
                          {report.parentGuidance.redFlags.map((flag, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <span className="text-yellow-800">{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push('/skill-tree')}>
              View Skill Tree
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

