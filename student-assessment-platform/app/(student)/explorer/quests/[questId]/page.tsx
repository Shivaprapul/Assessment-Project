/**
 * Quest Runner Page
 * 
 * Runs a quest (mini_game, reflection, or choice_scenario).
 * Reuses assessment runner patterns for mini games.
 * 
 * @module app/(student)/explorer/quests/[questId]
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  Loader2, 
  AlertCircle, 
  Clock,
  CheckCircle2,
  Gamepad2,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question: string;
  type: string;
  options?: string[];
}

interface QuestData {
  attemptId: string;
  questId: string;
  questType: 'mini_game' | 'reflection' | 'choice_scenario';
  questions?: Question[];
  content?: any;
}

export default function QuestRunnerPage({ params }: { params: Promise<{ questId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questId, setQuestId] = useState<string | null>(null);
  const [questData, setQuestData] = useState<QuestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For mini_game quests
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [startTime] = useState(Date.now());

  // For reflection quests
  const [reflectionResponse, setReflectionResponse] = useState('');

  // For choice_scenario quests
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setQuestId(resolvedParams.questId);
      const attemptId = searchParams.get('attemptId');
      if (attemptId) {
        fetchQuestData(resolvedParams.questId, attemptId);
      } else {
        startQuest(resolvedParams.questId);
      }
    };
    loadParams();
  }, []);

  const startQuest = async (qId: string) => {
    try {
      const response = await fetch(`/api/explorer/quests/${qId}/start`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start quest');
      }

      const data = await response.json();
      if (data?.success) {
        setQuestData(data.data);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error starting quest:', err);
      setError(err.message || 'Failed to start quest');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestData = async (qId: string, attemptId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/explorer/quests/${qId}/start`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load quest');
      }

      const data = await response.json();
      if (data?.success) {
        setQuestData(data.data);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error fetching quest:', err);
      setError(err.message || 'Failed to load quest');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (questionIndex: number, answerIndex: number) => {
    setAnswers({ ...answers, [questionIndex]: answerIndex });
  };

  const handleSubmit = async () => {
    if (!questData) return;

    setIsSubmitting(true);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      let submissionData: any = {
        attemptId: questData.attemptId,
        telemetrySummary: {
          timeSpent,
          hintsUsed: 0,
        },
      };

      if (questData.questType === 'mini_game' && questData.questions) {
        submissionData.answers = Object.keys(answers).map((key) => answers[parseInt(key)]);
      } else if (questData.questType === 'reflection') {
        submissionData.response = reflectionResponse;
      } else if (questData.questType === 'choice_scenario') {
        submissionData.choice = selectedChoice;
      }

      const response = await fetch(`/api/explorer/quests/${questId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submissionData),
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit quest');
      }

      const data = await response.json();
      if (data?.success) {
        // Map API response to UI format
        const apiInsight = data.data?.aiInsight || {};
        const mappedInsight = {
          strength: apiInsight.strengthObserved || apiInsight.strength || 'You completed the quest!',
          growth: apiInsight.growthSuggestion || apiInsight.growth || 'Keep exploring to discover more',
          evidence: Array.isArray(apiInsight.evidence) ? apiInsight.evidence : [],
          skillTags: Array.isArray(apiInsight.skillSignals) ? apiInsight.skillSignals : 
                    Array.isArray(apiInsight.skillTags) ? apiInsight.skillTags : [],
        };
        
        // Ensure all data is properly structured before encoding
        const resultsData = {
          attemptId: questData.attemptId,
          scoreSummary: data.data?.scoreSummary || {},
          aiInsight: mappedInsight,
          unlocks: Array.isArray(data.data?.unlocks) ? data.data.unlocks : [],
        };
        
        // Navigate to results page with results data in URL state
        const encodedData = encodeURIComponent(JSON.stringify(resultsData));
        router.push(`/explorer/quests/${questId}/results?data=${encodedData}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error submitting quest:', err);
      alert(err.message || 'Failed to submit quest');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = () => {
    if (!questData) return false;

    if (questData.questType === 'mini_game') {
      const totalQuestions = questData.questions?.length || 0;
      return Object.keys(answers).length === totalQuestions;
    } else if (questData.questType === 'reflection') {
      return reflectionResponse.trim().length > 0;
    } else if (questData.questType === 'choice_scenario') {
      return selectedChoice !== null;
    }

    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quest...</p>
        </div>
      </div>
    );
  }

  if (error || !questData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Failed to load quest'}</p>
            <Button onClick={() => router.push('/explorer')}>
              Back to Explorer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalQuestions = questData.questions?.length || 0;
  const progress = totalQuestions > 0 
    ? ((currentQuestion + 1) / totalQuestions) * 100 
    : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/explorer')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {questData.questType === 'mini_game' && (
              <>
                <Gamepad2 className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Mini Game</span>
              </>
            )}
            {questData.questType === 'reflection' && (
              <>
                <BookOpen className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Reflection</span>
              </>
            )}
            {questData.questType === 'choice_scenario' && (
              <>
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold">Scenario</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar (for mini_game) */}
          {questData.questType === 'mini_game' && totalQuestions > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Question {currentQuestion + 1} of {totalQuestions}
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Mini Game Quest */}
          {questData.questType === 'mini_game' && questData.questions && (
            <Card className="mb-6">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {questData.questions[currentQuestion]?.question}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {questData.questions[currentQuestion]?.options?.map((option, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className={cn(
                        "h-20 text-lg font-semibold bg-white hover:bg-blue-50",
                        answers[currentQuestion] === idx && "bg-blue-500 text-white hover:bg-blue-600"
                      )}
                      onClick={() => handleAnswer(currentQuestion, idx)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>
                  {currentQuestion < totalQuestions - 1 ? (
                    <Button
                      onClick={() => setCurrentQuestion(Math.min(totalQuestions - 1, currentQuestion + 1))}
                      disabled={answers[currentQuestion] === undefined}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!canSubmit() || isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Submit
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reflection Quest */}
          {questData.questType === 'reflection' && questData.content && (
            <Card className="mb-6">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {questData.content.prompt || 'Reflection Prompt'}
                  </h2>
                  <p className="text-gray-600">
                    Take your time to think and write your response.
                  </p>
                </div>
                <Textarea
                  value={reflectionResponse}
                  onChange={(e) => setReflectionResponse(e.target.value)}
                  placeholder="Write your reflection here..."
                  className="min-h-[300px] text-lg"
                />
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit() || isSubmitting}
                    className="bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Submit Reflection
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Choice Scenario Quest */}
          {questData.questType === 'choice_scenario' && questData.content && (
            <Card className="mb-6">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {questData.content.scenario || 'Scenario'}
                  </h2>
                  <p className="text-gray-600">
                    Consider the situation and choose the option that best reflects your approach.
                  </p>
                </div>
                <div className="space-y-4">
                  {questData.content.choices?.map((choice: string, idx: number) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className={cn(
                        "w-full h-auto p-4 text-left justify-start text-lg font-semibold bg-white hover:bg-yellow-50",
                        selectedChoice === idx && "bg-yellow-500 text-white hover:bg-yellow-600"
                      )}
                      onClick={() => setSelectedChoice(idx)}
                    >
                      {choice}
                    </Button>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit() || isSubmitting}
                    className="bg-yellow-600 hover:bg-yellow-700"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Submit Choice
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

