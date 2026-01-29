/**
 * Student Onboarding Page
 * 
 * First-time setup for new students:
 * - Grade selection (8/9/10)
 * - Basic profile information
 * - Section/class selection
 * 
 * @module app/(student)/onboarding
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, AlertCircle, GraduationCap, User, Calendar } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { isValidGrade, type Grade } from '@/lib/grade-utils';

interface StudentProfile {
  id: string;
  userId: string;
  tenantId: string;
  currentGrade: number;
  section: string | null;
  dateOfBirth: string | null;
  onboardingComplete: boolean;
  user: {
    name: string;
    email: string;
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  
  // Form state
  const [currentGrade, setCurrentGrade] = useState<Grade>(8);
  const [section, setSection] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/students/me', {
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
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if (data?.success && data.data) {
        const profile = data.data;
        setStudentProfile(profile);
        
        // Pre-fill form with existing data
        if (profile.currentGrade && isValidGrade(profile.currentGrade)) {
          setCurrentGrade(profile.currentGrade);
        }
        if (profile.section) {
          setSection(profile.section);
        }
        if (profile.dateOfBirth) {
          // Format date for input (YYYY-MM-DD)
          const date = new Date(profile.dateOfBirth);
          setDateOfBirth(date.toISOString().split('T')[0]);
        }

        // If already completed onboarding, redirect to dashboard
        if (profile.onboardingComplete) {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate grade
      if (!isValidGrade(currentGrade)) {
        throw new Error('Please select a valid grade (8, 9, or 10)');
      }

      // Validate section (optional but recommended)
      if (!section || section.trim() === '') {
        // Allow empty section, but warn
        console.warn('Section not provided');
      }

      // Validate date of birth
      if (!dateOfBirth) {
        throw new Error('Please enter your date of birth');
      }

      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        throw new Error('Please enter a valid date of birth');
      }

      // Submit onboarding data
      const response = await fetch('/api/students/me/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentGrade,
          section: section.trim() || null,
          dateOfBirth: dob.toISOString(),
          onboardingComplete: true,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to complete onboarding');
      }

      const data = await response.json();
      if (data?.success) {
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        throw new Error('Failed to complete onboarding');
      }
    } catch (err: any) {
      console.error('Error submitting onboarding:', err);
      setError(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Welcome! Let's Get Started</CardTitle>
              <CardDescription className="text-base mt-2">
                Help us personalize your learning experience by sharing a few details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Grade Selection */}
                <div className="space-y-3">
                  <Label htmlFor="grade" className="text-base font-semibold flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    Current Grade <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-gray-600">
                    Select your current standard. You can change this later in your profile.
                  </p>
                  <RadioGroup
                    value={currentGrade.toString()}
                    onValueChange={(value) => setCurrentGrade(parseInt(value) as Grade)}
                    className="grid grid-cols-3 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="8" id="grade-8" className="peer sr-only" />
                      <Label
                        htmlFor="grade-8"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 transition-colors"
                      >
                        <span className="text-2xl font-bold text-gray-900">8</span>
                        <span className="text-sm text-gray-600">Grade 8</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="9" id="grade-9" className="peer sr-only" />
                      <Label
                        htmlFor="grade-9"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 transition-colors"
                      >
                        <span className="text-2xl font-bold text-gray-900">9</span>
                        <span className="text-sm text-gray-600">Grade 9</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="10" id="grade-10" className="peer sr-only" />
                      <Label
                        htmlFor="grade-10"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 transition-colors"
                      >
                        <span className="text-2xl font-bold text-gray-900">10</span>
                        <span className="text-sm text-gray-600">Grade 10</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-gray-500">
                    💡 You can directly enroll into any grade. No prerequisites required.
                  </p>
                </div>

                {/* Section */}
                <div className="space-y-2">
                  <Label htmlFor="section" className="text-base font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Section/Class
                  </Label>
                  <Input
                    id="section"
                    type="text"
                    placeholder="e.g., A, B, 1, 2"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    maxLength={10}
                    className="text-base"
                  />
                  <p className="text-xs text-gray-500">Optional: Your class section or division</p>
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split('T')[0]} // Can't be in the future
                    min={new Date(new Date().setFullYear(new Date().getFullYear() - 20)).toISOString().split('T')[0]} // Max 20 years ago
                    className="text-base"
                    required
                  />
                  <p className="text-xs text-gray-500">Required for age-appropriate content</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isValidGrade(currentGrade) || !dateOfBirth}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-base"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Setting up your profile...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <GraduationCap className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Your grade selection helps us personalize your learning experience. 
                You can upgrade to the next grade when the academic year ends. All your progress, skills, 
                and achievements will be preserved across grades.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

