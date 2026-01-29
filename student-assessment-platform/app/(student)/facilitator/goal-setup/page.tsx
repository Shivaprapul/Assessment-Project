/**
 * Facilitator Goal Setup Wizard
 * 
 * Allows students to set or update their facilitator goal.
 * 
 * @module app/(student)/facilitator/goal-setup
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Target,
  CheckCircle2
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { getCuratedGoals } from '@/lib/goal-skill-map';

type GoalSelectionType = 'curated' | 'career_catalog' | 'custom' | null;

export default function GoalSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Goal selection
  const [selectionType, setSelectionType] = useState<GoalSelectionType>(null);
  const [selectedCuratedGoal, setSelectedCuratedGoal] = useState<string>('');
  const [selectedCareerId, setSelectedCareerId] = useState<string>('');
  const [customGoalText, setCustomGoalText] = useState('');
  
  // Time availability
  const [timeAvailability, setTimeAvailability] = useState<number>(20);
  
  // Focus areas (optional)
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  
  // Career catalog
  const [careers, setCareers] = useState<Array<{ id: string; title: string; icon: string }>>([]);
  const [isLoadingCareers, setIsLoadingCareers] = useState(false);

  const skillCategories = [
    'COGNITIVE_REASONING',
    'CREATIVITY',
    'LANGUAGE',
    'MEMORY',
    'ATTENTION',
    'PLANNING',
    'SOCIAL_EMOTIONAL',
    'METACOGNITION',
    'CHARACTER_VALUES',
  ];

  const curatedGoals = getCuratedGoals();

  useEffect(() => {
    // Load existing goal if any
    fetchExistingGoal();
  }, []);

  useEffect(() => {
    // Load careers when career_catalog is selected
    if (selectionType === 'career_catalog' && careers.length === 0) {
      fetchCareers();
    }
  }, [selectionType]);

  const fetchExistingGoal = async () => {
    try {
      const response = await fetch('/api/facilitator/goal', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.success && data.data) {
          const goal = data.data;
          setTimeAvailability(goal.timeAvailability);
          setFocusAreas(goal.focusAreas || []);
          
          if (goal.goalType === 'CURATED') {
            setSelectionType('curated');
            setSelectedCuratedGoal(goal.goalTitle);
          } else if (goal.goalType === 'CAREER_CATALOG') {
            setSelectionType('career_catalog');
            setSelectedCareerId(goal.careerId || '');
          } else {
            setSelectionType('custom');
            setCustomGoalText(goal.goalTitle);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching existing goal:', err);
    }
  };

  const fetchCareers = async () => {
    setIsLoadingCareers(true);
    try {
      const response = await fetch('/api/explorer/unlocks', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.success && data.data?.unlocks) {
          const careerList = data.data.unlocks
            .filter((unlock: any) => unlock.career)
            .map((unlock: any) => ({
              id: unlock.careerId,
              title: unlock.career.title,
              icon: unlock.career.icon || '🎯',
            }));
          setCareers(careerList);
        }
      }
    } catch (err) {
      console.error('Error fetching careers:', err);
    } finally {
      setIsLoadingCareers(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectionType) {
      setError('Please select a goal type');
      return;
    }

    let goalTitle = '';
    let goalType = 'CURATED';
    let careerId: string | null = null;

    if (selectionType === 'curated') {
      if (!selectedCuratedGoal) {
        setError('Please select a goal');
        return;
      }
      goalTitle = selectedCuratedGoal;
      goalType = 'CURATED';
    } else if (selectionType === 'career_catalog') {
      if (!selectedCareerId) {
        setError('Please select a career');
        return;
      }
      // Find career title from the list
      const selectedCareer = careers.find(c => c.id === selectedCareerId);
      goalTitle = selectedCareer?.title || 'Career Goal';
      goalType = 'CAREER_CATALOG';
      careerId = selectedCareerId;
    } else if (selectionType === 'custom') {
      if (!customGoalText.trim()) {
        setError('Please enter a custom goal');
        return;
      }
      goalTitle = customGoalText.trim();
      goalType = 'CUSTOM';
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/facilitator/goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          goalTitle,
          goalType,
          careerId,
          timeAvailability,
          focusAreas,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save goal');
      }

      const data = await response.json();
      if (data?.success) {
        // Navigate to facilitator hub
        router.push('/facilitator');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error saving goal:', err);
      setError(err.message || 'Failed to save goal');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedToStep2 = () => {
    if (!selectionType) return false;
    if (selectionType === 'curated' && !selectedCuratedGoal) return false;
    if (selectionType === 'career_catalog' && !selectedCareerId) return false;
    if (selectionType === 'custom' && !customGoalText.trim()) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/facilitator')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Logo />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-6 w-6 text-purple-600" />
                <CardTitle className="text-2xl">Set Your Goal</CardTitle>
              </div>
              <CardDescription>
                Choose a goal to personalize your training plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Goal Selection */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-4 block">
                      Choose your goal type
                    </Label>
                    <RadioGroup
                      value={selectionType || ''}
                      onValueChange={(value) => setSelectionType(value as GoalSelectionType)}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="curated" id="curated" className="mt-1" />
                          <Label htmlFor="curated" className="flex-1 cursor-pointer">
                            <div className="font-semibold">Curated Goals</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Choose from our pre-configured goals
                            </div>
                          </Label>
                        </div>

                        {selectionType === 'curated' && (
                          <div className="ml-8 space-y-2">
                            {curatedGoals.map((goal) => (
                              <div
                                key={goal.id}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedCuratedGoal === goal.id
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'hover:bg-gray-50'
                                }`}
                                onClick={() => setSelectedCuratedGoal(goal.id)}
                              >
                                <div className="flex items-center gap-2">
                                  {selectedCuratedGoal === goal.id && (
                                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                                  )}
                                  <span className="font-medium">{goal.title}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="career_catalog" id="career_catalog" className="mt-1" />
                          <Label htmlFor="career_catalog" className="flex-1 cursor-pointer">
                            <div className="font-semibold">From Career Catalog</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Select from unlocked careers
                            </div>
                          </Label>
                        </div>

                        {selectionType === 'career_catalog' && (
                          <div className="ml-8">
                            {isLoadingCareers ? (
                              <Skeleton className="h-32 w-full" />
                            ) : careers.length > 0 ? (
                              <div className="space-y-2">
                                {careers.map((career) => (
                                  <div
                                    key={career.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                      selectedCareerId === career.id
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'hover:bg-gray-50'
                                    }`}
                                    onClick={() => setSelectedCareerId(career.id)}
                                  >
                                    <div className="flex items-center gap-2">
                                      {selectedCareerId === career.id && (
                                        <CheckCircle2 className="h-4 w-4 text-purple-600" />
                                      )}
                                      <span className="text-2xl">{career.icon}</span>
                                      <span className="font-medium">{career.title}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 p-4">
                                No careers unlocked yet. Complete Explorer Mode quests to unlock careers, or choose a curated goal.
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="custom" id="custom" className="mt-1" />
                          <Label htmlFor="custom" className="flex-1 cursor-pointer">
                            <div className="font-semibold">Custom Goal</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Enter your own goal
                            </div>
                          </Label>
                        </div>

                        {selectionType === 'custom' && (
                          <div className="ml-8">
                            <Input
                              placeholder="e.g., Become a Data Scientist"
                              value={customGoalText}
                              onChange={(e) => setCustomGoalText(e.target.value)}
                              className="max-w-md"
                            />
                          </div>
                        )}
                      </div>
                    </RadioGroup>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!canProceedToStep2()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Next: Time & Focus
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Time & Focus */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-4 block">
                      Daily Time Availability
                    </Label>
                    <RadioGroup
                      value={timeAvailability.toString()}
                      onValueChange={(value) => setTimeAvailability(parseInt(value))}
                    >
                      <div className="space-y-2">
                        {[10, 20, 30].map((minutes) => (
                          <div
                            key={minutes}
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <RadioGroupItem value={minutes.toString()} id={`time-${minutes}`} />
                            <Label htmlFor={`time-${minutes}`} className="flex-1 cursor-pointer">
                              {minutes} minutes per day
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-4 block">
                      Preferred Focus Areas (Optional)
                    </Label>
                    <p className="text-sm text-gray-600 mb-3">
                      Select skills you'd like to focus on. Leave empty to let the system decide.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {skillCategories.map((category) => (
                        <div
                          key={category}
                          className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50"
                        >
                          <Checkbox
                            id={`focus-${category}`}
                            checked={focusAreas.includes(category)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFocusAreas([...focusAreas, category]);
                              } else {
                                setFocusAreas(focusAreas.filter(a => a !== category));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`focus-${category}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {category.replace(/_/g, ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Save Goal
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

