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
  const [timeSpent, setTimeSpent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const paramsResolved = useRef(false);

  useEffect(() => {
    const loadParams = async () => {
      if (paramsResolved.current) return;
      paramsResolved.current = true;
      
      const resolvedParams = await params;
      setGameId(resolvedParams.gameId);
      
      // Get attempt ID from query params or start new attempt
      const attemptIdParam = searchParams.get('attemptId');
      if (attemptIdParam) {
        setAttemptId(attemptIdParam);
        // TODO: Load existing attempt data
        setIsLoading(false);
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
      const response = await fetch(`/api/assessments/${gameId}/start`, {
        method: 'POST',
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
        throw new Error(errorData.error?.message || 'Failed to start assessment');
      }

      const data = await response.json();
      if (data?.success) {
        setAttempt(data.data);
        setAttemptId(data.data.attemptId);
        startTimeRef.current = Date.now();
        setAnswers(new Array(data.data.config.totalQuestions).fill(null));
      } else {
        throw new Error('Invalid response from server');
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
    if (currentQuestion < (attempt?.config.totalQuestions || 0) - 1) {
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
    if (!attemptId) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/assessments/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          answers: answers,
          telemetry: {
            timeSpent: timeSpent,
            actions: [],
            errors: 0,
            hintsUsed: 0,
            revisions: 0,
          },
          reflectionText: '',
        }),
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to submit assessment');
      }

      const data = await response.json();
      if (data?.success) {
        // Redirect to results or next game
        if (data.data.nextGame) {
          router.push(`/assessments?completed=${attempt?.gameId}`);
        } else {
          router.push('/assessments?completed=all');
        }
      } else {
        throw new Error('Invalid response from server');
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

  const progress = attempt 
    ? ((currentQuestion + 1) / attempt.config.totalQuestions) * 100 
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

  if (!attempt) {
    return null;
  }

  // Mock game content - Pattern Forge example
  const pattern = [2, 4, 6, 8, '?'];
  const options = [10, 12, 14, 16];

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
            {attempt.gameId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-white text-sm">
            Question {currentQuestion + 1}/{attempt.config.totalQuestions}
          </div>
          {attempt.config.showTimer && (
            <div className="flex items-center gap-2 text-white text-sm">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeSpent)}</span>
            </div>
          )}
          {attempt.config.allowPause && (
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
            <div className="w-full">
              {/* Question Header */}
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Complete the Pattern
                </h2>
                <p className="text-gray-300">
                  Choose the next number in the sequence
                </p>
              </div>

              {/* Pattern Display */}
              <div className="bg-white rounded-xl p-8 mb-6">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {pattern.map((item, index) => (
                    <div
                      key={index}
                      className="w-20 h-20 flex items-center justify-center bg-blue-100 rounded-lg text-2xl font-bold text-blue-700"
                    >
                      {item === '?' ? (
                        <span className="text-4xl">?</span>
                      ) : (
                        item
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Answer Options */}
              <div className="grid grid-cols-2 gap-4">
                {options.map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    className={cn(
                      "h-20 text-xl font-semibold bg-white hover:bg-blue-50",
                      answers[currentQuestion] === option && "bg-blue-500 text-white hover:bg-blue-600"
                    )}
                    onClick={() => handleAnswer(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
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
            {currentQuestion + 1} of {attempt.config.totalQuestions} questions
          </div>
          <Button
            onClick={currentQuestion === attempt.config.totalQuestions - 1 ? handleSubmit : handleNext}
            disabled={isSubmitting || !answers[currentQuestion]}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : currentQuestion === attempt.config.totalQuestions - 1 ? (
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

