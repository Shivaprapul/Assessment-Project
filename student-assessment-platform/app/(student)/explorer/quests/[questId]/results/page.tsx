/**
 * Quest Results Page (Student Gaming UI)
 * 
 * Shows game-like completion screen for students after completing a quest.
 * Uses GameCompletionScreen component for lightweight, game-first experience.
 * 
 * @module app/(student)/explorer/quests/[questId]/results
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameCompletionScreen } from '@/components/GameCompletionScreen';
import { buildCompletionSummary, getStudentQuickReview } from '@/lib/report-views';

interface QuestResults {
  attemptId: string;
  scoreSummary: any;
  aiInsight: any;
  unlocks: any[];
  timeSpent?: number;
}

export default function QuestResultsPage({ params }: { params: Promise<{ questId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questId, setQuestId] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [results, setResults] = useState<QuestResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionSummary, setCompletionSummary] = useState<any>(null);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setQuestId(resolvedParams.questId);
      
      // Try to get results from URL params first (from submit response)
      const dataParam = searchParams.get('data');
      if (dataParam) {
        try {
          const resultsData = JSON.parse(decodeURIComponent(dataParam));
          setAttemptId(resultsData.attemptId);
          
          // Prepare attempt data for GameCompletionScreen
          const attemptData = {
            attemptId: resultsData.attemptId,
            scoreSummary: resultsData.scoreSummary || {},
            aiInsight: resultsData.aiInsight || {},
            timeSpent: resultsData.timeSpent || resultsData.scoreSummary?.timeSpent || 0,
            currentTotalXP: 0, // Will be fetched or calculated
          };
          
          // Build completion summary
          const summary = buildCompletionSummary(attemptData);
          setCompletionSummary(summary);
          
          setResults({
            attemptId: resultsData.attemptId,
            scoreSummary: resultsData.scoreSummary || {},
            aiInsight: resultsData.aiInsight || {},
            unlocks: Array.isArray(resultsData.unlocks) ? resultsData.unlocks : [],
            timeSpent: resultsData.timeSpent || resultsData.scoreSummary?.timeSpent || 0,
          });
          setIsLoading(false);
          return;
        } catch (err) {
          console.error('Error parsing results data:', err);
        }
      }

      // Fallback: try to get attemptId and fetch results
      const attemptIdParam = searchParams.get('attemptId');
      if (attemptIdParam) {
        setAttemptId(attemptIdParam);
        // Create basic attempt data
        const attemptData = {
          attemptId: attemptIdParam,
          scoreSummary: {},
          aiInsight: {},
          timeSpent: 0,
          currentTotalXP: 0,
        };
        const summary = buildCompletionSummary(attemptData);
        setCompletionSummary(summary);
        
        setResults({
          attemptId: attemptIdParam,
          scoreSummary: {},
          aiInsight: {},
          unlocks: [],
          timeSpent: 0,
        });
        setIsLoading(false);
      } else {
        setError('Missing results data');
        setIsLoading(false);
      }
    };
    loadParams();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !results || !completionSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Failed to load results'}</p>
            <Button onClick={() => router.push('/explorer')}>
              Back to Explorer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare attempt data for Quick Review
  const attemptData = {
    attemptId: results.attemptId,
    scoreSummary: results.scoreSummary,
    aiInsight: results.aiInsight,
    timeSpent: results.timeSpent,
    currentTotalXP: completionSummary.currentTotalXP,
  };

  return (
    <GameCompletionScreen
      gameName="Quest"
      xpGained={completionSummary.xpGained}
      accuracy={completionSummary.accuracy}
      timeSpent={completionSummary.timeSpent}
      currentTotalXP={completionSummary.currentTotalXP}
      badges={completionSummary.badges}
      onNext={() => {
        // If there are unlocks, show them, otherwise go back to explorer
        if (results.unlocks && results.unlocks.length > 0) {
          router.push('/explorer/unlocks');
        } else {
          router.push('/explorer');
        }
      }}
      onBack={() => router.push('/explorer')}
      backLabel="Back to Quests"
      nextLabel={results.unlocks && results.unlocks.length > 0 ? "View Unlocks" : "Next Challenge"}
      attemptData={attemptData}
      mode="explorer"
    />
  );
}

