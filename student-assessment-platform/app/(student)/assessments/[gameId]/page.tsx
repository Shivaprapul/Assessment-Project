/**
 * Assessment Game Page
 * 
 * Fullscreen game interface for playing assessment games.
 * Supports all 8 assessment games with a generic game engine.
 * 
 * @module app/(student)/assessments/[gameId]
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  Loader2, 
  AlertCircle, 
  Clock,
  Pause,
  Play,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameConfig {
  totalQuestions: number;
  timeLimit: number;
  allowPause: boolean;
  showTimer: boolean;
}

interface AttemptData {
  attemptId: string;
  gameId: string;
  attemptNumber: number;
  startedAt: string;
  status: string;
  config: GameConfig;
  questions?: Array<{
    id: string;
    question: string;
    type: string;
    options?: string[];
  }>;
}

interface DemoQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'text' | 'sequence' | 'visual';
  options?: string[];
}

export default function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [gameId, setGameId] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | string | null)[]>([]);
  const [questions, setQuestions] = useState<DemoQuestion[]>([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const paramsResolved = useRef(false);
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_ASSESSMENTS === 'true';

  useEffect(() => {
    const loadParams = async () => {
      if (paramsResolved.current) return;
      paramsResolved.current = true;
      
      const resolvedParams = await params;
      setGameId(resolvedParams.gameId);
      
      // Get attempt ID from query params or start new attempt
      const attemptIdParam = searchParams.get('attemptId');
      if (attemptIdParam) {
        // If attemptId is provided, we still need to get questions
        // In demo mode, call start endpoint to get questions (it will return existing attempt)
        // In regular mode, we'd load attempt data - but for demo, just call start
        setAttemptId(attemptIdParam);
        startNewAttempt(resolvedParams.gameId);
      } else {
        // Start new attempt
        startNewAttempt(resolvedParams.gameId);
      }
    };
    
    loadParams();
  }, []);

  useEffect(() => {
    if (attempt && !isPaused && !isSubmitting) {
      timerRef.current = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [attempt, isPaused, isSubmitting]);

  const startNewAttempt = async (gameId: string) => {
    try {
      // Use demo endpoint in demo mode
      const endpoint = isDemoMode 
        ? '/api/demo/assessments/start'
        : `/api/assessments/${gameId}/start`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ gameId }),
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to start assessment' }));
        throw new Error(errorData.error || 'Failed to start assessment');
      }

      const data = await response.json();
      console.log('Demo start response:', data); // Debug log
      
      if (data?.success) {
        // Demo mode returns questions directly
        if (isDemoMode) {
          if (data.data.questions && Array.isArray(data.data.questions) && data.data.questions.length > 0) {
            console.log('Setting questions:', data.data.questions.length); // Debug log
            setQuestions(data.data.questions);
            setAttempt({
              attemptId: data.data.attemptId,
              gameId: data.data.gameId,
              attemptNumber: 1,
              startedAt: new Date().toISOString(),
              status: 'IN_PROGRESS',
              config: {
                totalQuestions: data.data.questions.length,
                timeLimit: 0,
                allowPause: true,
                showTimer: true,
              },
            });
            setAttemptId(data.data.attemptId);
            startTimeRef.current = Date.now();
            setAnswers(new Array(data.data.questions.length).fill(null));
          } else {
            console.error('No questions in response:', data.data);
            throw new Error('No questions received from server');
          }
        } else {
          // Regular mode
          setAttempt(data.data);
          setAttemptId(data.data.attemptId);
          startTimeRef.current = Date.now();
          const questionCount = data.data.config?.totalQuestions || 0;
          setAnswers(new Array(questionCount).fill(null));
          if (data.data.questions) {
            setQuestions(data.data.questions);
          }
        }
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error starting assessment:', err);
      setError(err.message || 'Failed to start assessment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer: number | string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
    
    // Auto-save progress
    saveProgress(newAnswers);
  };

  const saveProgress = async (currentAnswers: (number | string | null)[]) => {
    if (!attemptId) return;

    try {
      await fetch(`/api/assessments/attempts/${attemptId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          state: {
            currentQuestionIndex: currentQuestion,
            answers: currentAnswers,
            timeSpent: timeSpent,
          },
          telemetry: {
            actions: [
              {
                timestamp: Math.floor(Date.now() / 1000),
                action: 'answer',
                data: { questionId: `q${currentQuestion + 1}`, answer: currentAnswers[currentQuestion] },
              },
            ],
          },
        }),
      });
    } catch (err) {
      console.error('Error saving progress:', err);
      // Don't show error to user - progress saving is best effort
    }
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      // Pause timer
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimeSpent(elapsed);
    } else {
      // Resume timer
      startTimeRef.current = Date.now() - timeSpent * 1000;
    }
  };

  const handleSubmit = async () => {
    if (!attemptId || !gameId) return;

    setIsSubmitting(true);

    try {
      // Use demo endpoint in demo mode
      const endpoint = isDemoMode
        ? '/api/demo/assessments/submit'
        : `/api/assessments/attempts/${attemptId}/submit`;
      
      const body = isDemoMode
        ? {
            attemptId,
            gameId,
            answers,
            telemetrySummary: {
              timeSpent,
              hintsUsed: 0,
            },
          }
        : {
            answers: answers,
            telemetry: {
              timeSpent: timeSpent,
              actions: [],
              errors: 0,
              hintsUsed: 0,
              revisions: 0,
            },
            reflectionText: '',
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit assessment' }));
        throw new Error(errorData.error || 'Failed to submit assessment');
      }

      const data = await response.json();
      if (data?.success) {
        // Redirect to results page
        if (isDemoMode) {
          // In demo mode, always go to results (report is generated separately)
          router.push(`/assessments/results/${attemptId}`);
        } else if (data.data.allGamesCompleted) {
          // All games complete - redirect to report
          router.push('/reports/latest');
        } else {
          // Show results for this game
          router.push(`/assessments/results/${attemptId}`);
        }
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      alert(err.message || 'Failed to submit assessment. Please try again.');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalQuestions = isDemoMode 
    ? questions.length 
    : (attempt?.config.totalQuestions || 0);
  
  const progress = totalQuestions > 0
    ? ((currentQuestion + 1) / totalQuestions) * 100 
    : 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-white mb-4" />
          <p className="text-white">Loading game...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button onClick={() => router.push('/assessments')}>
            Back to Assessments
          </Button>
        </div>
      </div>
    );
  }

  // In demo mode, we need questions to render, not just attempt
  if (isDemoMode && questions.length === 0 && !isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-white mb-4" />
          <p className="text-white">Loading questions...</p>
          <p className="text-gray-400 mt-2 text-sm">If this persists, try refreshing the page</p>
        </div>
      </div>
    );
  }

  if (!attempt && !isDemoMode) {
    return null;
  }

  // Get current question
  const currentQuestionData = questions[currentQuestion] || null;
  
  // Render question based on type
  const renderQuestion = () => {
    if (!currentQuestionData) {
      return (
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-gray-300">Loading question...</p>
        </div>
      );
    }

    switch (currentQuestionData.type) {
      case 'multiple_choice':
        return (
          <div className="w-full">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                {currentQuestionData.question}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestionData.options?.map((option, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className={cn(
                    "h-20 text-lg font-semibold bg-white hover:bg-blue-50",
                    answers[currentQuestion] === idx && "bg-blue-500 text-white hover:bg-blue-600"
                  )}
                  onClick={() => handleAnswer(idx)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="w-full">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                {currentQuestionData.question}
              </h2>
            </div>
            <div className="bg-white rounded-xl p-6">
              <textarea
                className="w-full min-h-[200px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your answer here..."
                value={answers[currentQuestion] as string || ''}
                onChange={(e) => handleAnswer(e.target.value)}
              />
            </div>
          </div>
        );

      case 'sequence':
        return (
          <div className="w-full">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                {currentQuestionData.question}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestionData.options?.map((option, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className={cn(
                    "h-20 text-lg font-semibold bg-white hover:bg-blue-50",
                    answers[currentQuestion] === idx && "bg-blue-500 text-white hover:bg-blue-600"
                  )}
                  onClick={() => handleAnswer(idx)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <p className="text-white text-lg">{currentQuestionData.question}</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50">
      {/* Game Header */}
      <div className="absolute top-0 left-0 right-0 bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm('Are you sure you want to leave? Your progress will be saved.')) {
                router.push('/assessments');
              }
            }}
            className="text-white hover:bg-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-white font-semibold text-lg">
            {(attempt?.gameId || gameId || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-white text-sm">
            Question {currentQuestion + 1}/{totalQuestions}
          </div>
          {(attempt?.config?.showTimer || isDemoMode) && (
            <div className="flex items-center gap-2 text-white text-sm">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeSpent)}</span>
            </div>
          )}
          {(attempt?.config.allowPause || isDemoMode) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePause}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Game Canvas */}
      <div className="absolute inset-0 top-16 bottom-20 flex items-center justify-center overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto p-8">
          {isPaused ? (
            <div className="text-center">
              <Pause className="h-16 w-16 text-white/50 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Game Paused</h2>
              <p className="text-gray-400 mb-6">Take your time. Click Resume when ready.</p>
              <Button onClick={handlePause} size="lg">
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            </div>
          ) : (
            renderQuestion()
          )}
        </div>
      </div>

      {/* Game Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-800 p-4 border-t border-gray-700">
        <Progress value={progress} className="mb-4 h-2" />
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0 || isSubmitting}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="text-white text-sm">
            {currentQuestion + 1} of {totalQuestions} questions
          </div>
          <Button
            onClick={currentQuestion === totalQuestions - 1 ? handleSubmit : handleNext}
            disabled={isSubmitting || (currentQuestionData?.type !== 'text' && (answers[currentQuestion] === null || answers[currentQuestion] === undefined))}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : currentQuestion === totalQuestions - 1 && totalQuestions > 0 ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit
              </>
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

