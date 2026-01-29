/**
 * Game Completion Screen Component
 * 
 * Lightweight, game-first completion screen for students.
 * Shows XP, badges, level progress, and minimal feedback.
 * 
 * @module components/GameCompletionScreen
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Trophy,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Eye,
  X,
} from 'lucide-react';
import { getXPProgress, checkLevelUp } from '@/lib/student-levels';
import { QuickReviewModal } from './QuickReviewModal';

interface GameCompletionScreenProps {
  gameName: string;
  xpGained: number;
  accuracy?: number;
  timeSpent?: number; // in seconds
  currentTotalXP: number;
  badges?: string[];
  onNext?: () => void;
  onBack?: () => void;
  backLabel?: string;
  nextLabel?: string;
  attemptData?: any; // For quick review
  mode?: 'explorer' | 'facilitator' | 'assessment'; // Mode for mode-specific messaging
}

export function GameCompletionScreen({
  gameName,
  xpGained,
  accuracy,
  timeSpent,
  currentTotalXP,
  badges = [],
  onNext,
  onBack,
  backLabel = 'Back to Quests',
  nextLabel = 'Next Challenge',
  attemptData,
  mode,
}: GameCompletionScreenProps) {
  const router = useRouter();
  const [showQuickReview, setShowQuickReview] = useState(false);
  const [leveledUp, setLeveledUp] = useState(false);
  
  const oldXP = currentTotalXP - xpGained;
  const progress = getXPProgress(currentTotalXP);
  const oldProgress = getXPProgress(oldXP);
  const didLevelUp = checkLevelUp(oldXP, currentTotalXP);
  
  useEffect(() => {
    const triggerConfetti = async () => {
      const confetti = (await import('canvas-confetti')).default;
      
      if (didLevelUp) {
        setLeveledUp(true);
        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        // Small celebration for completion
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    };
    
    triggerConfetti();
  }, [didLevelUp]);
  
  const handleNext = () => {
    if (onNext) {
      onNext();
    }
  };
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };
  
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-6">
          {/* Success Header */}
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              {leveledUp ? (
                <>
                  <Trophy className="h-20 w-20 mx-auto mb-4 animate-bounce" />
                  <h1 className="text-4xl font-bold mb-2">Level Up! 🎉</h1>
                  <p className="text-green-100 text-lg">
                    You've reached {progress.currentLevel.name}!
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-20 w-20 mx-auto mb-4" />
                  <h1 className="text-4xl font-bold mb-2">Challenge Complete! 🎉</h1>
                  <p className="text-green-100 text-lg">
                    Great job completing {gameName}!
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* XP & Stats */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    +{xpGained}
                  </div>
                  <div className="text-sm text-gray-600">XP Gained</div>
                </div>
                {accuracy !== undefined && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {Math.min(100, Math.max(0, Math.round((typeof accuracy === 'number' && accuracy <= 1 ? accuracy : accuracy / 100) * 100)))}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </div>
                )}
                {timeSpent !== undefined && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {Math.floor(timeSpent / 60)}m
                    </div>
                    <div className="text-sm text-gray-600">Time</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {progress.currentLevel.level}
                  </div>
                  <div className="text-sm text-gray-600">Level</div>
                </div>
              </div>
              
              {/* Level Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {progress.currentLevel.name}
                  </span>
                  <span className="text-sm text-gray-600">
                    {progress.xpInCurrentLevel} / {progress.xpNeededForNext} XP
                  </span>
                </div>
                <Progress value={progress.progressPercent} className="h-3" />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {progress.xpNeededForNext - progress.xpInCurrentLevel} XP to next level
                </p>
                {/* Facilitator-specific messaging */}
                {mode === 'facilitator' && (
                  <p className="text-xs text-purple-600 font-medium mt-2 text-center">
                    +1 step toward your goal
                  </p>
                )}
              </div>
              
              {/* Badges */}
              {badges.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Badges Unlocked</p>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge, idx) => (
                      <Badge key={idx} variant="outline" className="text-sm">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {onBack && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleBack}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {backLabel}
              </Button>
            )}
            {attemptData && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowQuickReview(true)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Quick Review
              </Button>
            )}
            {onNext && (
              <Button
                size="lg"
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {nextLabel}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Review Modal */}
      {showQuickReview && attemptData && (
        <QuickReviewModal
          attemptData={attemptData}
          onClose={() => setShowQuickReview(false)}
        />
      )}
    </>
  );
}

