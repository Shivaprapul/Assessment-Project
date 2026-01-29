/**
 * Assessment Results Page
 * 
 * Displays per-game results after completing an assessment.
 * Shows accuracy, time, strengths, growth areas, and "Next Game" CTA.
 * 
 * @module app/(student)/assessments/results/[attemptId]
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  ArrowRight,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserMenu } from '@/components/UserMenu';
import { getAllGames } from '@/lib/games';
import { GameCompletionScreen } from '@/components/GameCompletionScreen';
import { useUserRole } from '@/hooks/useUserRole';
import { getStudentCompletionSummary, getStudentQuickReview } from '@/lib/report-views';
import { calculateXP } from '@/lib/student-levels';

interface AttemptResults {
  attemptId: string;
  gameId: string;
  gameName: string;
  status: string;
  startedAt: string;
  completedAt: string;
  rawScores: {
    accuracy: number;
    avgTimePerQuestion: number;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent?: number;
    hintsUsed?: number;
  };
  normalizedScores: Record<string, number>;
  strengths?: string[];
  growthAreas?: string[];
}

export default function ResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const router = useRouter();
  const { role, loading: roleLoading } = useUserRole();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [results, setResults] = useState<AttemptResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextGame, setNextGame] = useState<{ id: string; name: string } | null>(null);
  const [totalXP, setTotalXP] = useState<number>(0);
  const [xpLoading, setXpLoading] = useState(true);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setAttemptId(resolvedParams.attemptId);
      fetchResults(resolvedParams.attemptId);
    };
    loadParams();
  }, []);

  useEffect(() => {
    // Fetch student total XP
    if (role === 'STUDENT') {
      fetchTotalXP();
    } else {
      setXpLoading(false);
    }
  }, [role]);

  const fetchResults = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assessments/attempts/${id}`, {
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
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to load results');
      }

      const data = await response.json();
      if (data?.success) {
        setResults(data.data);
        
        // Find next game
        const allGames = getAllGames();
        const currentGameIndex = allGames.findIndex(g => g.id === data.data.gameId);
        if (currentGameIndex < allGames.length - 1) {
          setNextGame({
            id: allGames[currentGameIndex + 1].id,
            name: allGames[currentGameIndex + 1].name,
          });
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error fetching results:', err);
      setError(err.message || 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTotalXP = async () => {
    setXpLoading(true);
    try {
      const response = await fetch('/api/students/me/xp', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success) {
          setTotalXP(data.data.totalXP);
        }
      }
    } catch (err) {
      console.error('Error fetching XP:', err);
    } finally {
      setXpLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading || roleLoading || xpLoading) {
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
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Error Loading Results</CardTitle>
            </div>
            <CardDescription>{error || 'Results not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={() => fetchResults(attemptId!)} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button variant="outline" onClick={() => router.push('/assessments')} className="flex-1">
                Back to Assessments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For students, show game completion screen
  if (role === 'STUDENT') {
    // Normalize accuracy to 0-1 range for XP calculation
    const accuracyValue = typeof results.rawScores.accuracy === 'number'
      ? (results.rawScores.accuracy > 1 ? results.rawScores.accuracy / 100 : results.rawScores.accuracy)
      : 0;
    
    const xpGained = calculateXP({
      accuracy: accuracyValue,
      timeSpent: results.rawScores.timeSpent,
      questionsAnswered: results.rawScores.totalQuestions,
      hintsUsed: results.rawScores.hintsUsed,
    });

    // Normalize accuracy for display (ensure 0-1 range)
    const displayAccuracy = typeof results.rawScores.accuracy === 'number'
      ? (results.rawScores.accuracy > 1 ? results.rawScores.accuracy / 100 : results.rawScores.accuracy)
      : 0;

    const attemptData = {
      attemptId: results.attemptId,
      gameId: results.gameId,
      gameName: results.gameName,
      rawScores: results.rawScores,
      strengths: results.strengths,
      growthAreas: results.growthAreas,
    };

    return (
      <GameCompletionScreen
        gameName={results.gameName}
        xpGained={xpGained}
        accuracy={displayAccuracy}
        timeSpent={results.rawScores.timeSpent}
        currentTotalXP={totalXP}
        badges={[]}
        onNext={nextGame ? () => router.push(`/assessments/${nextGame.id}`) : undefined}
        onBack={() => router.push('/assessments')}
        backLabel="Back to Assessments"
        nextLabel={nextGame ? `Start ${nextGame.name}` : undefined}
        attemptData={attemptData}
      />
    );
  }

  // For non-students (shouldn't happen in student route, but fallback to old UI)
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
          {/* Success Header */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-8 text-center">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Great Work! 🎉
              </h1>
              <p className="text-lg text-gray-600">
                You've completed {results.gameName}
              </p>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {results.rawScores.accuracy}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {results.rawScores.correctAnswers} of {results.rawScores.totalQuestions} correct
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Average Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {results.rawScores.avgTimePerQuestion}s
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  per question
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Total Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {formatTime(results.rawScores.timeSpent || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  total duration
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Strengths */}
          {results.strengths && results.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Your Strengths
                </CardTitle>
                <CardDescription>Areas where you showed strong performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.strengths.map((strength, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{strength}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Growth Areas */}
          {results.growthAreas && results.growthAreas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Growth Opportunities
                </CardTitle>
                <CardDescription>Areas for continued development</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.growthAreas.map((area, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{area}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Demo Mode: Always show "Play another game" and "View Report" */}
          {process.env.NEXT_PUBLIC_DEMO_ASSESSMENTS === 'true' ? (
            <div className="space-y-4">
              <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                <CardContent className="p-8 text-center">
                  <h2 className="text-2xl font-bold mb-2">Great Work! 🎉</h2>
                  <p className="text-blue-100 mb-6">
                    You've completed {results.gameName}. Ready for another challenge?
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-blue-50"
                      onClick={() => router.push('/assessments')}
                    >
                      Play Another Game
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-transparent border-white text-white hover:bg-white/10"
                      onClick={() => router.push('/reports/latest')}
                    >
                      View My Report
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Regular Mode: Show next game or completion message */}
              {nextGame ? (
                <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                  <CardContent className="p-8 text-center">
                    <h2 className="text-2xl font-bold mb-2">Ready for the Next Challenge?</h2>
                    <p className="text-blue-100 mb-6">
                      Continue your assessment journey with {nextGame.name}
                    </p>
                    <Button
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-blue-50"
                      onClick={() => router.push(`/assessments/${nextGame.id}`)}
                    >
                      Start {nextGame.name}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white border-0">
                  <CardContent className="p-8 text-center">
                    <h2 className="text-2xl font-bold mb-2">Congratulations! 🎊</h2>
                    <p className="text-green-100 mb-6">
                      You've completed all 8 assessment games! Your comprehensive report is ready.
                    </p>
                    <Button
                      size="lg"
                      className="bg-white text-green-600 hover:bg-green-50"
                      onClick={() => router.push('/reports/latest')}
                    >
                      View Your Report
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Back to Assessments */}
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/assessments')}
                >
                  Back to Assessments
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

