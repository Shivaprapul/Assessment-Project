/**
 * Teacher Settings Page
 * 
 * Comprehensive settings hub for teachers with 7 tabs:
 * Profile, Class Focus, Assignment Defaults, Notifications, Reports, Privacy, Support
 * 
 * @module app/(teacher)/teacher/settings
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  Target, 
  FileText, 
  Bell, 
  BarChart3, 
  Shield, 
  HelpCircle,
  RotateCcw,
  LogOut,
  Bug,
  MessageSquare,
  BookOpen,
  Info
} from 'lucide-react';
import { TeacherHeader } from '@/components/TeacherHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession, signOut } from 'next-auth/react';

const SKILL_CATEGORIES = [
  { key: 'COGNITIVE_REASONING', label: 'Cognitive Reasoning' },
  { key: 'CREATIVITY', label: 'Creativity' },
  { key: 'LANGUAGE', label: 'Language' },
  { key: 'MEMORY', label: 'Memory' },
  { key: 'ATTENTION', label: 'Attention' },
  { key: 'PLANNING', label: 'Planning' },
  { key: 'SOCIAL_EMOTIONAL', label: 'Social & Emotional' },
  { key: 'METACOGNITION', label: 'Metacognition' },
  { key: 'CHARACTER_VALUES', label: 'Character & Values' },
];

const PRESETS = {
  exam_focus: {
    name: 'Exam Focus',
    boosts: {
      PLANNING: 0.15,
      ATTENTION: 0.15,
      COGNITIVE_REASONING: 0.10,
    },
  },
  project_mode: {
    name: 'Project Mode',
    boosts: {
      CREATIVITY: 0.15,
      LANGUAGE: 0.10,
      PLANNING: 0.10,
    },
  },
  values_focus: {
    name: 'Values Focus',
    boosts: {
      CHARACTER_VALUES: 0.20,
      SOCIAL_EMOTIONAL: 0.15,
    },
  },
};

interface TeacherSettingsData {
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
    phone: string | null;
    subjectsTaught: string[];
    roleLabel: string | null;
  };
  settings: {
    assignmentDefaults: {
      defaultDueDays: number;
      defaultQuestCount: number;
      defaultQuestTypes: string[];
      defaultIntent: string | null;
    };
    notificationPrefs: {
      emailEnabled: boolean;
      inAppEnabled: boolean;
      alertInactiveDays: number | null;
      alertOverdueAssignments: boolean;
      alertEngagementDrop: boolean;
      alertGroupGrowthThreshold: number | null;
    };
    reportPrefs: {
      defaultTimeRange: '7d' | '30d';
      weeklySummaryEmail: boolean;
      defaultLanding: 'overview' | 'signals';
    };
    privacyPrefs: {
      hideCharacterValuesInsights: boolean;
      showOnlyBriefSummaries: boolean;
      disableSensitiveNarratives: boolean;
    };
  };
  user: {
    name: string;
    email: string;
    avatar: string | null;
  };
}

export default function TeacherSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from URL query param if present
    const tabParam = searchParams?.get('tab');
    return tabParam || 'profile';
  });

  // Profile state
  const [profile, setProfile] = useState<TeacherSettingsData['profile']>({
    displayName: null,
    avatarUrl: null,
    phone: null,
    subjectsTaught: [],
    roleLabel: null,
  });
  const [newSubject, setNewSubject] = useState('');

  // Class Focus state
  const [focusWindow, setFocusWindow] = useState<'week' | 'month' | 'custom'>('week');
  const [priorityBoosts, setPriorityBoosts] = useState<Record<string, number>>({});
  const [grade, setGrade] = useState<number | null>(null);
  const [gradeSelectValue, setGradeSelectValue] = useState<string>('all');

  // Assignment Defaults state
  const [assignmentDefaults, setAssignmentDefaults] = useState({
    defaultDueDays: 7,
    defaultQuestCount: 4,
    defaultQuestTypes: ['mini_game', 'reflection', 'choice_scenario'],
    defaultIntent: null as string | null,
  });

  // Notifications state
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailEnabled: true,
    inAppEnabled: true,
    alertInactiveDays: 7,
    alertOverdueAssignments: true,
    alertEngagementDrop: true,
    alertGroupGrowthThreshold: 5,
  });

  // Reports state
  const [reportPrefs, setReportPrefs] = useState({
    defaultTimeRange: '7d' as '7d' | '30d',
    weeklySummaryEmail: false,
    defaultLanding: 'overview' as 'overview' | 'signals',
  });

  // Privacy state
  const [privacyPrefs, setPrivacyPrefs] = useState({
    hideCharacterValuesInsights: false,
    showOnlyBriefSummaries: true,
    disableSensitiveNarratives: true,
  });

  // Support state
  const [feedbackText, setFeedbackText] = useState('');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchClassFocus();
  }, []);

  useEffect(() => {
    // Update active tab from URL query param
    const tabParam = searchParams?.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/teacher/settings', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setProfile(data.data.profile);
          setAssignmentDefaults(data.data.settings.assignmentDefaults);
          setNotificationPrefs(data.data.settings.notificationPrefs);
          setReportPrefs(data.data.settings.reportPrefs);
          setPrivacyPrefs(data.data.settings.privacyPrefs);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClassFocus = async () => {
    try {
      const response = await fetch('/api/teacher/class-focus', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setFocusWindow(data.data.focusWindow?.type || 'week');
          setPriorityBoosts(data.data.priorityBoosts || {});
          const fetchedGrade = data.data.grade || null;
          setGrade(fetchedGrade);
          setGradeSelectValue(fetchedGrade ? fetchedGrade.toString() : 'all');
        }
      }
    } catch (error) {
      console.error('Error fetching class focus:', error);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/teacher/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          profile,
        }),
      });

      if (response.ok) {
        showMessage('success', 'Profile saved successfully');
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showMessage('error', 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClassFocus = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/teacher/class-focus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          grade,
          focusWindow: {
            type: focusWindow,
            startDate: new Date().toISOString(),
            endDate:
              focusWindow === 'week'
                ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                : focusWindow === 'month'
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                : null,
          },
          priorityBoosts,
        }),
      });

      if (response.ok) {
        showMessage('success', 'Class focus saved successfully');
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Failed to save class focus');
      }
    } catch (error) {
      console.error('Error saving class focus:', error);
      showMessage('error', 'Failed to save class focus');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async (section: 'assignment' | 'notification' | 'report' | 'privacy') => {
    try {
      setIsSaving(true);
      const payload: any = {};
      
      if (section === 'assignment') {
        payload.assignmentDefaults = assignmentDefaults;
      } else if (section === 'notification') {
        payload.notificationPrefs = notificationPrefs;
      } else if (section === 'report') {
        payload.reportPrefs = reportPrefs;
      } else if (section === 'privacy') {
        payload.privacyPrefs = privacyPrefs;
      }

      const response = await fetch('/api/teacher/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showMessage('success', 'Settings saved successfully');
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBoostChange = (skill: string, value: number[]) => {
    setPriorityBoosts((prev) => ({
      ...prev,
      [skill]: value[0] / 100, // Convert 0-20 to 0-0.2
    }));
  };

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setPriorityBoosts(preset.boosts);
  };

  const resetToDefault = () => {
    setPriorityBoosts({});
  };

  const addSubject = () => {
    if (newSubject.trim() && !profile.subjectsTaught.includes(newSubject.trim())) {
      setProfile({
        ...profile,
        subjectsTaught: [...profile.subjectsTaught, newSubject.trim()],
      });
      setNewSubject('');
    }
  };

  const removeSubject = (subject: string) => {
    setProfile({
      ...profile,
      subjectsTaught: profile.subjectsTaught.filter((s) => s !== subject),
    });
  };

  const handleQuestTypeToggle = (type: string) => {
    setAssignmentDefaults((prev) => ({
      ...prev,
      defaultQuestTypes: prev.defaultQuestTypes.includes(type)
        ? prev.defaultQuestTypes.filter((t) => t !== type)
        : [...prev.defaultQuestTypes, type],
    }));
  };

  const handleSubmitFeedback = async () => {
    try {
      // MVP: Just log for now, can add API later
      console.log('Teacher feedback:', feedbackText);
      showMessage('success', 'Thank you for your feedback!');
      setFeedbackText('');
      setIsFeedbackModalOpen(false);
    } catch (error) {
      showMessage('error', 'Failed to submit feedback');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');
        localStorage.removeItem('session_token');
      }
      router.push('/login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <TeacherHeader />
      <div className="container mx-auto px-4 pt-4">
        <Button variant="ghost" onClick={() => router.push('/teacher')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your profile, preferences, and class settings</p>
          </div>

          {saveMessage && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                saveMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {saveMessage.text}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="class-focus">
                <Target className="h-4 w-4 mr-2" />
                Class Focus
              </TabsTrigger>
              <TabsTrigger value="assignments">
                <FileText className="h-4 w-4 mr-2" />
                Assignments
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="reports">
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="privacy">
                <Shield className="h-4 w-4 mr-2" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="support">
                <HelpCircle className="h-4 w-4 mr-2" />
                Support
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.avatarUrl || session?.user?.image || undefined} />
                      <AvatarFallback className="bg-blue-600 text-white text-xl">
                        {profile.displayName?.slice(0, 2).toUpperCase() || session?.user?.name?.slice(0, 2).toUpperCase() || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{session?.user?.name || 'Teacher'}</p>
                      <p className="text-sm text-gray-500">{session?.user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={profile.displayName || ''}
                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                        placeholder="Enter display name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+91 1234567890"
                      />
                    </div>

                    <div>
                      <Label htmlFor="roleLabel">Role Label</Label>
                      <Input
                        id="roleLabel"
                        value={profile.roleLabel || ''}
                        onChange={(e) => setProfile({ ...profile, roleLabel: e.target.value })}
                        placeholder="e.g., Class Teacher, Subject Teacher"
                      />
                    </div>

                    <div>
                      <Label>Subjects Taught</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          placeholder="Add subject"
                          onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                        />
                        <Button type="button" onClick={addSubject} variant="outline">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.subjectsTaught.map((subject) => (
                          <div
                            key={subject}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {subject}
                            <button
                              onClick={() => removeSubject(subject)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => fetchSettings()}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Class Focus Tab */}
            <TabsContent value="class-focus">
              <Card>
                <CardHeader>
                  <CardTitle>Adjust Skill Priorities</CardTitle>
                  <CardDescription>
                    Temporarily boost skill priorities for your class. Changes affect quest selection and assignments.
                    Maximum boost: +20% per skill.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Focus Window</Label>
                    <Select value={focusWindow} onValueChange={(v: any) => setFocusWindow(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="custom">Custom Dates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Grade Scope (Optional)</Label>
                    <Select
                      value={gradeSelectValue}
                      onValueChange={(v) => {
                        setGradeSelectValue(v);
                        setGrade(v === 'all' ? null : parseInt(v));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All grades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All grades</SelectItem>
                        <SelectItem value="8">Grade 8</SelectItem>
                        <SelectItem value="9">Grade 9</SelectItem>
                        <SelectItem value="10">Grade 10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Quick Presets</Label>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => applyPreset('exam_focus')}>
                        Exam Focus
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => applyPreset('project_mode')}>
                        Project Mode
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => applyPreset('values_focus')}>
                        Values Focus
                      </Button>
                      <Button variant="outline" size="sm" onClick={resetToDefault}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Skill Priority Boosts (0-20%)</Label>
                    {SKILL_CATEGORIES.map((skill) => {
                      const currentValue = (priorityBoosts[skill.key] || 0) * 100;
                      return (
                        <div key={skill.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">{skill.label}</Label>
                            <span className="text-sm text-gray-600">{Math.round(currentValue)}%</span>
                          </div>
                          <Slider
                            value={[currentValue]}
                            onValueChange={(v) => handleBoostChange(skill.key, v)}
                            max={20}
                            min={0}
                            step={1}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => fetchClassFocus()}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveClassFocus} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Class Focus
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignment Defaults Tab */}
            <TabsContent value="assignments">
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Defaults</CardTitle>
                  <CardDescription>Set default values for new assignments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Default Due Days</Label>
                    <Select
                      value={assignmentDefaults.defaultDueDays.toString()}
                      onValueChange={(v) =>
                        setAssignmentDefaults({ ...assignmentDefaults, defaultDueDays: parseInt(v) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="5">5 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Default Quest Count</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Slider
                        value={[assignmentDefaults.defaultQuestCount]}
                        onValueChange={(v) =>
                          setAssignmentDefaults({ ...assignmentDefaults, defaultQuestCount: v[0] })
                        }
                        min={1}
                        max={10}
                        step={1}
                      />
                      <span className="text-sm font-medium w-12 text-center">
                        {assignmentDefaults.defaultQuestCount}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label>Default Quest Types</Label>
                    <div className="space-y-2 mt-2">
                      {['mini_game', 'reflection', 'choice_scenario'].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={assignmentDefaults.defaultQuestTypes.includes(type)}
                            onCheckedChange={() => handleQuestTypeToggle(type)}
                          />
                          <Label htmlFor={type} className="font-normal cursor-pointer capitalize">
                            {type.replace(/_/g, ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Default Intent</Label>
                    <Select
                      value={assignmentDefaults.defaultIntent || 'none'}
                      onValueChange={(v) =>
                        setAssignmentDefaults({ ...assignmentDefaults, defaultIntent: v === 'none' ? null : v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No default intent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No default</SelectItem>
                        <SelectItem value="IMPROVE_FOCUS">Improve Focus</SelectItem>
                        <SelectItem value="STRENGTHEN_PLANNING">Strengthen Planning</SelectItem>
                        <SelectItem value="ENCOURAGE_COMMUNICATION">Encourage Communication</SelectItem>
                        <SelectItem value="BUILD_CONSISTENCY">Build Consistency</SelectItem>
                        <SelectItem value="PREPARE_FOR_EXAMS">Prepare for Exams</SelectItem>
                        <SelectItem value="REENGAGE_PARTICIPATION">Re-engage Participation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => fetchSettings()}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleSaveSettings('assignment')} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Defaults
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Configure how and when you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.emailEnabled}
                        onCheckedChange={(checked) =>
                          setNotificationPrefs({ ...notificationPrefs, emailEnabled: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>In-App Notifications</Label>
                        <p className="text-sm text-gray-500">Show notifications in the app</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.inAppEnabled}
                        onCheckedChange={(checked) =>
                          setNotificationPrefs({ ...notificationPrefs, inAppEnabled: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div>
                      <Label>Alert if student inactive for (days)</Label>
                      <Select
                        value={notificationPrefs.alertInactiveDays?.toString() || '7'}
                        onValueChange={(v) =>
                          setNotificationPrefs({ ...notificationPrefs, alertInactiveDays: parseInt(v) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="5">5 days</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Alert on Overdue Assignments</Label>
                        <p className="text-sm text-gray-500">Get notified when assignments are overdue</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.alertOverdueAssignments}
                        onCheckedChange={(checked) =>
                          setNotificationPrefs({ ...notificationPrefs, alertOverdueAssignments: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Alert on Engagement Drop</Label>
                        <p className="text-sm text-gray-500">Weekly alerts for engagement changes</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.alertEngagementDrop}
                        onCheckedChange={(checked) =>
                          setNotificationPrefs({ ...notificationPrefs, alertEngagementDrop: checked })
                        }
                      />
                    </div>

                    <div>
                      <Label>Alert if "Needs Attention" group exceeds (students)</Label>
                      <Select
                        value={notificationPrefs.alertGroupGrowthThreshold?.toString() || '5'}
                        onValueChange={(v) =>
                          setNotificationPrefs({ ...notificationPrefs, alertGroupGrowthThreshold: parseInt(v) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 students</SelectItem>
                          <SelectItem value="5">5 students</SelectItem>
                          <SelectItem value="10">10 students</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => fetchSettings()}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleSaveSettings('notification')} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Report Preferences</CardTitle>
                  <CardDescription>Configure default report settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Default Time Range</Label>
                    <Select
                      value={reportPrefs.defaultTimeRange}
                      onValueChange={(v: '7d' | '30d') =>
                        setReportPrefs({ ...reportPrefs, defaultTimeRange: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weekly Summary Email</Label>
                      <p className="text-sm text-gray-500">Receive weekly summary reports via email</p>
                    </div>
                    <Switch
                      checked={reportPrefs.weeklySummaryEmail}
                      onCheckedChange={(checked) =>
                        setReportPrefs({ ...reportPrefs, weeklySummaryEmail: checked })
                      }
                    />
                  </div>

                  <div>
                    <Label>Dashboard Default Landing</Label>
                    <Select
                      value={reportPrefs.defaultLanding}
                      onValueChange={(v: 'overview' | 'signals') =>
                        setReportPrefs({ ...reportPrefs, defaultLanding: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">Overview</SelectItem>
                        <SelectItem value="signals">Class Signals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div>
                    <Label>Export Reports</Label>
                    <p className="text-sm text-gray-500 mb-4">Export functionality coming soon</p>
                    <div className="flex gap-2">
                      <Button variant="outline" disabled>
                        Export CSV
                      </Button>
                      <Button variant="outline" disabled>
                        Export PDF
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => fetchSettings()}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleSaveSettings('report')} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Display Preferences</CardTitle>
                  <CardDescription>
                    Control what information is shown in your teacher dashboard. These settings help reduce
                    overwhelm and maintain student safety.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Only Brief Summaries</Label>
                      <p className="text-sm text-gray-500">
                        Display concise summaries instead of detailed reports (default: ON)
                      </p>
                    </div>
                    <Switch
                      checked={privacyPrefs.showOnlyBriefSummaries}
                      onCheckedChange={(checked) =>
                        setPrivacyPrefs({ ...privacyPrefs, showOnlyBriefSummaries: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Hide Character & Values Insights</Label>
                      <p className="text-sm text-gray-500">
                        Hide character and values-related insights from student reports
                      </p>
                    </div>
                    <Switch
                      checked={privacyPrefs.hideCharacterValuesInsights}
                      onCheckedChange={(checked) =>
                        setPrivacyPrefs({ ...privacyPrefs, hideCharacterValuesInsights: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Disable Sensitive Narratives</Label>
                      <p className="text-sm text-gray-500">
                        Remove sensitive or counseling-like narratives from reports (default: ON, may be locked
                        by policy)
                      </p>
                    </div>
                    <Switch
                      checked={privacyPrefs.disableSensitiveNarratives}
                      onCheckedChange={(checked) =>
                        setPrivacyPrefs({ ...privacyPrefs, disableSensitiveNarratives: checked })
                      }
                      disabled={true} // Locked ON as per policy
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-2">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Privacy Note</p>
                        <p className="text-sm text-blue-700 mt-1">
                          These preferences only affect what you see in the teacher UI. They do not change
                          backend scoring or student data. Sensitive narratives are disabled by default to
                          maintain student safety and privacy.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => fetchSettings()}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleSaveSettings('privacy')} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support">
              <Card>
                <CardHeader>
                  <CardTitle>Help & Support</CardTitle>
                  <CardDescription>Get help, report issues, or provide feedback</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setIsFeedbackModalOpen(true)}
                    >
                      <Bug className="h-4 w-4 mr-2" />
                      Report a Bug
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setIsFeedbackModalOpen(true)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Feedback
                    </Button>

                    <Button variant="outline" className="w-full justify-start" disabled>
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Help Docs
                      <span className="ml-auto text-xs text-gray-500">Coming soon</span>
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <Label>App Information</Label>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>Version: 0.1.0</p>
                      <p>Build: Development</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Button variant="destructive" className="w-full" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Send Feedback</CardTitle>
              <CardDescription>Share your thoughts or report an issue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe the issue or share your feedback..."
                rows={5}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsFeedbackModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitFeedback} disabled={!feedbackText.trim()}>
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
