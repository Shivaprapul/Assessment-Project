/**
 * Settings Page
 * 
 * Comprehensive settings section with categorized layout.
 * Includes account, preferences, notifications, privacy, role-specific,
 * safety, help, and legal sections.
 * 
 * Responsive: Sidebar on desktop, accordion on mobile.
 * 
 * @module app/(student)/settings
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  User,
  Mail,
  Phone,
  Lock,
  Monitor,
  Moon,
  Sun,
  Bell,
  BellOff,
  Shield,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Compass,
  Target,
  Users,
  GraduationCap,
  Clock,
  Heart,
  HelpCircle,
  MessageCircle,
  FileText,
  Info,
  LogOut,
  Settings as SettingsIcon,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserMenu } from '@/components/UserMenu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserRole = 'student' | 'parent' | 'teacher';

interface UserData {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
}

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('account');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Mock user data
  const [userData] = useState<UserData>({
    name: 'Narasimha',
    email: 'student@test-school.com',
    phone: '',
    role: 'student',
  });

  // Account Settings
  const [phone, setPhone] = useState('');
  const [activeSessions] = useState<ActiveSession[]>([
    { id: '1', device: 'Chrome on Mac', location: 'San Francisco, CA', lastActive: 'Just now', current: true },
    { id: '2', device: 'Safari on iPhone', location: 'San Francisco, CA', lastActive: '2 hours ago', current: false },
  ]);

  // Preferences
  const [preferredMode, setPreferredMode] = useState<'explorer' | 'facilitator' | null>('explorer');
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Notifications
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklySummaries, setWeeklySummaries] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');

  // Privacy
  const [dataUsageConsent, setDataUsageConsent] = useState(true);
  const [visibilityRules, setVisibilityRules] = useState({
    profile: 'private',
    achievements: 'friends',
    activity: 'private',
  });

  // Student-specific
  const [achievementVisibility, setAchievementVisibility] = useState('friends');
  const [communityParticipation, setCommunityParticipation] = useState(true);

  // Parent-specific
  const [childVisibility, setChildVisibility] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState('weekly');

  // Teacher-specific
  const [classDefaults, setClassDefaults] = useState({
    summaryFrequency: 'weekly',
    exportFormat: 'pdf',
  });

  // Safety
  const [timeLimitsEnabled, setTimeLimitsEnabled] = useState(false);
  const [dailyTimeLimit, setDailyTimeLimit] = useState('120'); // minutes
  const [breakReminders, setBreakReminders] = useState(true);
  const [breakInterval, setBreakInterval] = useState('45'); // minutes

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    // TODO: API call to save settings
    setTimeout(() => {
      setSaving(false);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleDeleteAccount = async () => {
    // TODO: API call to request account deletion
    console.log('Requesting account deletion');
    setIsDeleteModalOpen(false);
    // Show confirmation message
  };

  const settingsSections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
    ...(userData.role === 'student' ? [{ id: 'student', label: 'Student Settings', icon: GraduationCap }] : []),
    ...(userData.role === 'parent' ? [{ id: 'parent', label: 'Parent Settings', icon: Users }] : []),
    ...(userData.role === 'teacher' ? [{ id: 'teacher', label: 'Teacher Settings', icon: GraduationCap }] : []),
    { id: 'safety', label: 'Safety & Wellbeing', icon: Heart },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'legal', label: 'Legal & About', icon: FileText },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Account Settings</h2>
              <p className="text-gray-600">Manage your account information and security</p>
            </div>

            {/* Profile Shortcut */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>View and edit your profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={userData.avatar} />
                    <AvatarFallback>{userData.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{userData.name}</p>
                    <p className="text-sm text-gray-600">{userData.email}</p>
                  </div>
                  <Button variant="outline" onClick={() => router.push('/profile')}>
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email */}
            <Card>
              <CardHeader>
                <CardTitle>Email Address</CardTitle>
                <CardDescription>Your email address (read-only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <Input value={userData.email} disabled className="flex-1" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Contact support to change your email address
                </p>
              </CardContent>
            </Card>

            {/* Phone */}
            <Card>
              <CardHeader>
                <CardTitle>Phone Number</CardTitle>
                <CardDescription>Add or update your phone number</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Phone Number'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Password */}
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Manage your active login sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{session.device}</p>
                        <p className="text-sm text-gray-600">{session.location}</p>
                        <p className="text-xs text-gray-500">Last active: {session.lastActive}</p>
                      </div>
                      {session.current ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Current
                        </Badge>
                      ) : (
                        <Button variant="outline" size="sm">
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card>
              <CardHeader>
                <CardTitle>Sign Out</CardTitle>
                <CardDescription>Sign out of your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => setIsLogoutModalOpen(true)}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Preferences & Personalization</h2>
              <p className="text-gray-600">Customize your experience</p>
            </div>

            {/* Preferred Mode */}
            <Card>
              <CardHeader>
                <CardTitle>Preferred Learning Mode</CardTitle>
                <CardDescription>Choose your default learning path</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={preferredMode || ''} onValueChange={(v) => setPreferredMode(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="explorer">
                      <div className="flex items-center gap-2">
                        <Compass className="h-4 w-4" />
                        Explorer Mode
                      </div>
                    </SelectItem>
                    <SelectItem value="facilitator">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Facilitator Mode
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Preference'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Language */}
            <Card>
              <CardHeader>
                <CardTitle>Language</CardTitle>
                <CardDescription>Select your preferred language</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Theme */}
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Choose your preferred theme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Avatar */}
            <Card>
              <CardHeader>
                <CardTitle>Avatar</CardTitle>
                <CardDescription>Update your profile picture</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={avatarUrl || userData.avatar} />
                    <AvatarFallback>{userData.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      type="url"
                      placeholder="Avatar URL"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Update Avatar'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Notifications</h2>
              <p className="text-gray-600">Manage how you receive notifications</p>
            </div>

            {/* In-App Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>In-App Notifications</CardTitle>
                <CardDescription>Receive notifications within the app</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-gray-400" />
                    <span>Enable in-app notifications</span>
                  </div>
                  <Switch
                    checked={inAppNotifications}
                    onCheckedChange={setInAppNotifications}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Receive notifications via email</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>Enable email notifications</span>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Weekly Summaries */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Summaries</CardTitle>
                <CardDescription>Receive weekly progress summaries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>Enable weekly summaries</span>
                  </div>
                  <Switch
                    checked={weeklySummaries}
                    onCheckedChange={setWeeklySummaries}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quiet Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Quiet Hours</CardTitle>
                <CardDescription>Pause notifications during specific hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Enable quiet hours</span>
                  <Switch
                    checked={quietHoursEnabled}
                    onCheckedChange={setQuietHoursEnabled}
                  />
                </div>
                {quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={quietHoursStart}
                        onChange={(e) => setQuietHoursStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={quietHoursEnd}
                        onChange={(e) => setQuietHoursEnd(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Privacy & Data Control</h2>
              <p className="text-gray-600">Manage your privacy and data</p>
            </div>

            {/* Data Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Data Usage</CardTitle>
                <CardDescription>How we use your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  We use your data to provide personalized learning experiences, track progress,
                  and generate insights. All data is encrypted and stored securely. We never share
                  your data with third parties without your explicit consent.
                </p>
                <div className="flex items-center justify-between">
                  <span>Consent to data usage</span>
                  <Switch
                    checked={dataUsageConsent}
                    onCheckedChange={setDataUsageConsent}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Visibility Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Visibility Rules</CardTitle>
                <CardDescription>Control who can see your information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Visibility</Label>
                  <Select value={visibilityRules.profile} onValueChange={(v) => setVisibilityRules({...visibilityRules, profile: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Achievement Visibility</Label>
                  <Select value={visibilityRules.achievements} onValueChange={(v) => setVisibilityRules({...visibilityRules, achievements: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Activity Visibility</Label>
                  <Select value={visibilityRules.activity} onValueChange={(v) => setVisibilityRules({...visibilityRules, activity: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Data Export */}
            <Card>
              <CardHeader>
                <CardTitle>Data Export</CardTitle>
                <CardDescription>Download your data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export My Data
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  You can download all your data in JSON format
                </p>
              </CardContent>
            </Card>

            {/* Account Deletion */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Delete Account</CardTitle>
                <CardDescription>Permanently delete your account and all data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Request Account Deletion
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 'student':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Student Settings</h2>
              <p className="text-gray-600">Student-specific preferences</p>
            </div>

            {/* Achievement Visibility */}
            <Card>
              <CardHeader>
                <CardTitle>Achievement Visibility</CardTitle>
                <CardDescription>Control who can see your achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={achievementVisibility} onValueChange={setAchievementVisibility}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Community Participation */}
            <Card>
              <CardHeader>
                <CardTitle>Community Participation</CardTitle>
                <CardDescription>Opt in to community features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Enable community participation</span>
                  <Switch
                    checked={communityParticipation}
                    onCheckedChange={setCommunityParticipation}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'parent':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Parent Settings</h2>
              <p className="text-gray-600">Parent-specific preferences</p>
            </div>

            {/* Child Visibility */}
            <Card>
              <CardHeader>
                <CardTitle>Child Visibility</CardTitle>
                <CardDescription>View your child's progress and data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Enable child visibility</span>
                  <Switch
                    checked={childVisibility}
                    onCheckedChange={setChildVisibility}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Frequency */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Frequency</CardTitle>
                <CardDescription>How often to receive updates</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={notificationFrequency} onValueChange={setNotificationFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        );

      case 'teacher':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Teacher Settings</h2>
              <p className="text-gray-600">Teacher-specific preferences</p>
            </div>

            {/* Class Defaults */}
            <Card>
              <CardHeader>
                <CardTitle>Class Defaults</CardTitle>
                <CardDescription>Default settings for your classes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Summary Frequency</Label>
                  <Select value={classDefaults.summaryFrequency} onValueChange={(v) => setClassDefaults({...classDefaults, summaryFrequency: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select value={classDefaults.exportFormat} onValueChange={(v) => setClassDefaults({...classDefaults, exportFormat: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'safety':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Safety & Wellbeing</h2>
              <p className="text-gray-600">Manage your safety and wellbeing settings</p>
            </div>

            {/* Time Limits */}
            <Card>
              <CardHeader>
                <CardTitle>Time Limits</CardTitle>
                <CardDescription>Set daily time limits for platform usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Enable time limits</span>
                  <Switch
                    checked={timeLimitsEnabled}
                    onCheckedChange={setTimeLimitsEnabled}
                  />
                </div>
                {timeLimitsEnabled && (
                  <div className="space-y-2">
                    <Label>Daily Time Limit (minutes)</Label>
                    <Input
                      type="number"
                      value={dailyTimeLimit}
                      onChange={(e) => setDailyTimeLimit(e.target.value)}
                      placeholder="120"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Break Reminders */}
            <Card>
              <CardHeader>
                <CardTitle>Break Reminders</CardTitle>
                <CardDescription>Get reminders to take breaks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Enable break reminders</span>
                  <Switch
                    checked={breakReminders}
                    onCheckedChange={setBreakReminders}
                  />
                </div>
                {breakReminders && (
                  <div className="space-y-2">
                    <Label>Break Interval (minutes)</Label>
                    <Input
                      type="number"
                      value={breakInterval}
                      onChange={(e) => setBreakInterval(e.target.value)}
                      placeholder="45"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report Concern */}
            <Card>
              <CardHeader>
                <CardTitle>Report a Concern</CardTitle>
                <CardDescription>Report safety or wellbeing concerns</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Report Concern
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'help':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Help & Support</h2>
              <p className="text-gray-600">Get help and support</p>
            </div>

            {/* FAQs */}
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Common questions and answers</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  View FAQs
                </Button>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>Get in touch with our support team</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>

            {/* Feedback */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
                <CardDescription>Share your feedback with us</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Submit Feedback
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'legal':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Legal & About</h2>
              <p className="text-gray-600">Legal information and app details</p>
            </div>

            {/* Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Terms of Service</CardTitle>
                <CardDescription>Read our terms of service</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Terms
                </Button>
              </CardContent>
            </Card>

            {/* Privacy Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Privacy Policy</CardTitle>
                <CardDescription>Read our privacy policy</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  View Privacy Policy
                </Button>
              </CardContent>
            </Card>

            {/* App Version */}
            <Card>
              <CardHeader>
                <CardTitle>App Version</CardTitle>
                <CardDescription>Current version information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Version:</strong> 1.0.0
                  </p>
                  <p className="text-sm">
                    <strong>Build:</strong> 2026.01.21
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Logo />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Error Loading Settings</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                name: userData.name,
                email: userData.email,
                avatar: userData.avatar,
              }}
              onLogout={() => setIsLogoutModalOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">{saveMessage}</span>
            </div>
          )}

          {/* Desktop: Sidebar Layout */}
          <div className="hidden lg:flex gap-6">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0">
              <Card>
                <CardContent className="p-4">
                  <nav className="space-y-1">
                    {settingsSections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            activeSection === section.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{section.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <Card>
                <CardContent className="p-6">
                  {renderSection()}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mobile: Accordion Layout */}
          <div className="lg:hidden">
            <Accordion type="single" value={activeSection} onValueChange={setActiveSection} className="w-full">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const prevActiveSection = activeSection;
                return (
                  <AccordionItem key={section.id} value={section.id}>
                    <AccordionTrigger 
                      className="flex items-center gap-3"
                      onClick={() => {
                        if (activeSection !== section.id) {
                          setActiveSection(section.id);
                        }
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{section.label}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4">
                        {activeSection === section.id && renderSection()}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogoutModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogout}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
              All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

