/**
 * Grade Upgrade Celebration Page
 * 
 * Shows a celebratory screen when a student upgrades to a new grade.
 * 
 * @module app/(student)/profile/grade-upgrade
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowRight, Sparkles, Trophy, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';

const Confetti = dynamic(() => import('canvas-confetti'), { ssr: false });

function GradeUpgradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fromGrade, setFromGrade] = useState<number | null>(null);
  const [toGrade, setToGrade] = useState<number | null>(null);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  useEffect(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    if (from) setFromGrade(parseInt(from));
    if (to) setToGrade(parseInt(to));

    // Trigger confetti animation
    if (!hasTriggeredConfetti && from && to) {
      const triggerConfetti = async () => {
        const confetti = (await import('canvas-confetti')).default;
        
        // Multiple bursts for celebration
        const duration = 3000;
        const end = Date.now() + duration;

        const interval = setInterval(() => {
          if (Date.now() > end) {
            clearInterval(interval);
            return;
          }

          confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'],
          });
          confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'],
          });
        }, 25);

        setHasTriggeredConfetti(true);
      };

      triggerConfetti();
    }
  }, [searchParams, hasTriggeredConfetti]);

  if (!fromGrade || !toGrade) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Loading celebration...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Header */}
        <Card className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <div className="mb-6">
              <div className="relative inline-block">
                <GraduationCap className="h-24 w-24 mx-auto mb-4 animate-bounce" />
                <Sparkles className="h-8 w-8 absolute -top-2 -right-2 text-yellow-300 animate-pulse" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4">Grade Up! 🎉</h1>
            <p className="text-xl text-blue-100 mb-6">
              Congratulations on advancing to Grade {toGrade}!
            </p>
            <div className="flex items-center justify-center gap-4 text-3xl font-bold">
              <span className="bg-white/20 px-6 py-3 rounded-lg">Grade {fromGrade}</span>
              <ArrowRight className="h-8 w-8" />
              <span className="bg-white/30 px-6 py-3 rounded-lg border-2 border-white">
                Grade {toGrade}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Achievement Stats */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <Trophy className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                <p className="text-2xl font-bold text-gray-900">All Preserved</p>
                <p className="text-sm text-gray-600 mt-1">Your skills & achievements</p>
              </div>
              <div>
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="text-2xl font-bold text-gray-900">New Journey</p>
                <p className="text-sm text-gray-600 mt-1">Grade {toGrade} adventure begins</p>
              </div>
              <div>
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-purple-500" />
                <p className="text-2xl font-bold text-gray-900">Keep Growing</p>
                <p className="text-sm text-gray-600 mt-1">Continue building skills</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <p className="text-center text-gray-700 leading-relaxed">
              Your journey from Grade {fromGrade} to Grade {toGrade} is now complete! 
              All your hard work, skills, and achievements have been preserved. 
              You're ready to take on new challenges and continue growing. 
              <span className="font-semibold text-blue-700"> Keep up the amazing work! 🌟</span>
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => router.push('/profile')}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            View My Profile
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex-1"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function GradeUpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Loading celebration...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <GradeUpgradeContent />
    </Suspense>
  );
}
