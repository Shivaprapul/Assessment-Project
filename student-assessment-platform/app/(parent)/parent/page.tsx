/**
 * Parent Dashboard Page
 * 
 * Primary parent portal page with evidence-based insights.
 * 
 * @module app/(parent)/parent
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  Flame, 
  CheckCircle2,
  Lock,
  Eye,
  Lightbulb,
  BookOpen,
  Save
} from 'lucide-react';
import { ParentDashboardDTO } from '@/lib/parent-dtos';
import { ConfidenceBand } from '@/lib/parent-evidence-gating';

export default function ParentDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ParentDashboardDTO | null>(null);
  const [journalNote, setJournalNote] = useState('');
  const [isSavingJournal, setIsSavingJournal] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchJournal();
  }, []);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/parent/dashboard', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJournal = async () => {
    try {
      const response = await fetch('/api/parent/reflection-notes', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.latestNote) {
          setJournalNote(result.data.latestNote.content || '');
        }
      }
    } catch (error) {
      console.error('Error fetching journal:', error);
    }
  };

  const handleSaveJournal = async () => {
    try {
      setIsSavingJournal(true);
      const response = await fetch('/api/parent/reflection-notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: journalNote,
        }),
      });

      if (response.ok) {
        // Show success feedback
        const button = document.getElementById('save-journal-btn');
        if (button) {
          button.textContent = 'Saved!';
          setTimeout(() => {
            if (button) button.textContent = 'Save Note';
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error saving journal:', error);
    } finally {
      setIsSavingJournal(false);
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
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* At a Glance */}
      <Card>
        <CardHeader>
          <CardTitle>At a Glance</CardTitle>
          <CardDescription>Quick overview of your child's engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Weekly Engagement</p>
                <p className="text-2xl font-bold text-gray-900">{data.atAGlance.weeklyEngagement}</p>
                <p className="text-xs text-gray-500">activities this week</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
              <Flame className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{data.atAGlance.streak}</p>
                <p className="text-xs text-gray-500">consecutive days</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Completed</p>
                <p className="text-2xl font-bold text-gray-900">{data.atAGlance.completionCount}</p>
                <p className="text-xs text-gray-500">activities completed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confident Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Confident Insights
          </CardTitle>
          <CardDescription>
            Evidence-based observations about your child's strengths
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data.confidentInsights.globalGateMet ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">
                We're still learning your child's patterns
              </p>
              <p className="text-sm text-gray-600">
                Complete {data.confidentInsights.remainingActivities} more {data.confidentInsights.remainingActivities === 1 ? 'activity' : 'activities'} to unlock insights.
              </p>
            </div>
          ) : data.confidentInsights.signals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No insights available yet. Continue activities to generate insights.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.confidentInsights.signals.map((signal) => (
                <div key={signal.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">{signal.name}</h3>
                    </div>
                    {getConfidenceBadge(signal.confidence)}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{signal.explanation}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Eye className="h-3 w-3" />
                    <span>{signal.evidenceSummary}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs font-medium text-gray-700 mb-1">Support Actions:</p>
                    <ul className="space-y-1">
                      {signal.supportActions.slice(0, 2).map((action, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                          <span className="text-purple-600 mt-0.5">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gentle Observations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Gentle Observations
          </CardTitle>
          <CardDescription>Descriptive patterns we're noticing</CardDescription>
        </CardHeader>
        <CardContent>
          {!data.gentleObservations.unlocked ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">
                We're gathering more observations
              </p>
              <p className="text-sm text-gray-600">
                Once we have enough data, you'll see meaningful insights here.
              </p>
            </div>
          ) : data.gentleObservations.observations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No observations available yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.gentleObservations.observations.map((observation, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Eye className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{observation}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Narrative */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Progress Narrative
          </CardTitle>
          <CardDescription>Your child's learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          {!data.progressNarrative.unlocked ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">
                Once we have enough data
              </p>
              <p className="text-sm text-gray-600">
                You'll see a clear progress story here.
              </p>
            </div>
          ) : !data.progressNarrative.narrative ? (
            <div className="text-center py-8 text-gray-500">
              <p>Narrative not available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Then</span>
                </div>
                <p className="text-sm text-gray-600">{data.progressNarrative.narrative.then}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Now</span>
                </div>
                <p className="text-sm text-gray-600">{data.progressNarrative.narrative.now}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Next</span>
                </div>
                <p className="text-sm text-gray-600">{data.progressNarrative.narrative.next}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Actions */}
      {data.supportActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Support Actions for This Week
            </CardTitle>
            <CardDescription>Practical, low-effort ways to support your child</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.supportActions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{action.action}</p>
                    {action.lowEffort && (
                      <Badge variant="outline" className="mt-2 text-xs">Low Effort</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parent Journal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            Parent Journal
          </CardTitle>
          <CardDescription>
            Use this space to note what you're observing at home or questions you'd like to reflect on.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="journal-note">Your Notes</Label>
            <Textarea
              id="journal-note"
              value={journalNote}
              onChange={(e) => setJournalNote(e.target.value)}
              placeholder="Add your observations, questions, or reflections here..."
              rows={6}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              These notes are private and not analyzed by AI. They're for your personal reflection.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              id="save-journal-btn"
              onClick={handleSaveJournal}
              disabled={isSavingJournal}
              size="sm"
            >
              {isSavingJournal ? (
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
        </CardContent>
      </Card>
    </div>
  );
}

