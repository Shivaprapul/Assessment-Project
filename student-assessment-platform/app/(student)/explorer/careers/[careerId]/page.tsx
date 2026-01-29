/**
 * Career Detail Page
 * 
 * Shows detailed information about a specific career.
 * 
 * @module app/(student)/explorer/careers/[careerId]
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
  ArrowLeft,
  Sparkles,
  BookOpen,
  GraduationCap,
  Target,
  CheckCircle2
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserMenu } from '@/components/UserMenu';

interface CareerDetail {
  id: string;
  title: string;
  shortPitch: string;
  dayInLife: string;
  skillSignals: string[];
  recommendedSubjects: string[];
  starterPathSteps: string[];
  icon: string;
  rarityTier: string;
  isUnlocked: boolean;
  unlockReason?: string;
}

interface UserData {
  name: string;
  email: string;
  avatar?: string;
}

export default function CareerDetailPage({ params }: { params: Promise<{ careerId: string }> }) {
  const router = useRouter();
  const [careerId, setCareerId] = useState<string | null>(null);
  const [career, setCareer] = useState<CareerDetail | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setCareerId(resolvedParams.careerId);
      fetchCareerData(resolvedParams.careerId);
    };
    loadParams();
  }, []);

  const fetchCareerData = async (cId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch career details
      const careerResponse = await fetch(`/api/explorer/careers/${cId}`, {
        credentials: 'include',
      });

      if (careerResponse.status === 401 || careerResponse.status === 403) {
        router.push('/login');
        return;
      }

      if (!careerResponse.ok) {
        const errorData = await careerResponse.json();
        throw new Error(errorData.error || 'Failed to load career details');
      }

      const careerDataResponse = await careerResponse.json();
      if (careerDataResponse?.success) {
        setCareer(careerDataResponse.data);
      } else {
        throw new Error('Invalid response from server');
      }

      // Fetch user data
      const userResponse = await fetch('/api/students/me', {
        credentials: 'include',
      });

      if (userResponse.ok) {
        const userDataResponse = await userResponse.json();
        if (userDataResponse?.success && userDataResponse?.data?.user) {
          setUserData({
            name: userDataResponse.data.user.name,
            email: userDataResponse.data.user.email,
            avatar: userDataResponse.data.user.avatar,
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching career:', err);
      setError(err.message || 'Failed to load career details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Error signing out:', err);
    }
    router.push('/login');
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMMON':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'EMERGING':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'ADVANCED':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'FRONTIER':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Logo />
            <Skeleton className="h-10 w-20" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !career) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Logo />
            <Button variant="ghost" onClick={() => router.push('/explorer/unlocks')}>
              Back to Unlocks
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <CardTitle>Error Loading Career</CardTitle>
                </div>
                <CardDescription>{error || 'Failed to load career details'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push('/explorer/unlocks')}>
                  Back to Unlocks
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/explorer/unlocks')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            {userData && (
              <UserMenu 
                user={userData}
                onLogout={handleLogout}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Career Header */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className="text-6xl">{career.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl font-bold">{career.title}</h1>
                    <Badge className={getRarityColor(career.rarityTier)}>
                      {career.rarityTier}
                    </Badge>
                    {career.isUnlocked && (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Unlocked
                      </Badge>
                    )}
                  </div>
                  <p className="text-blue-100 text-lg">{career.shortPitch}</p>
                  {career.isUnlocked && career.unlockReason && (
                    <div className="mt-4 p-3 bg-white/20 rounded-lg">
                      <p className="text-sm">
                        <span className="font-semibold">Why this career showed up:</span>{' '}
                        {career.unlockReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Day in Life */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <CardTitle>A Day in the Life</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{career.dayInLife}</p>
              </div>
            </CardContent>
          </Card>

          {/* Skill Signals */}
          {career.skillSignals && career.skillSignals.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <CardTitle>Skill Signals</CardTitle>
                </div>
                <CardDescription>
                  Skills and behaviors that align with this career
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {career.skillSignals.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-sm">
                      {skill.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Subjects */}
          {career.recommendedSubjects && career.recommendedSubjects.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <CardTitle>Recommended Subjects</CardTitle>
                </div>
                <CardDescription>
                  Subjects that can help you explore this career path
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {career.recommendedSubjects.map((subject, idx) => (
                    <Badge key={idx} variant="outline" className="text-sm bg-green-50">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Starter Path Steps */}
          {career.starterPathSteps && career.starterPathSteps.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-yellow-600" />
                  <CardTitle>Getting Started</CardTitle>
                </div>
                <CardDescription>
                  Learning suggestions to explore this career (not prescriptions)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {career.starterPathSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-semibold">
                        {idx + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/explorer/unlocks')}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Unlocks
            </Button>
            <Button
              onClick={() => router.push('/explorer')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Continue Exploring
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

