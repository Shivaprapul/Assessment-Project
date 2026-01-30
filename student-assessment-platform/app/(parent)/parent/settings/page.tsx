/**
 * Parent Settings Page
 * 
 * Comprehensive settings page with tabs for different categories.
 * 
 * @module app/(parent)/parent/settings
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Save,
  Bell,
  Shield,
  Globe,
  FileText,
  Settings,
  HelpCircle,
  AlertCircle,
  Download,
  Trash2,
} from 'lucide-react';
import { ParentSettingsDTO } from '@/lib/parent-dtos';

export default function ParentSettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') || 'notifications';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settings, setSettings] = useState<ParentSettingsDTO | null>(null);
  const [bugReport, setBugReport] = useState('');
  const [showBugModal, setShowBugModal] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/parent/settings', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/parent/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Settings saved successfully' });
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleBugReport = async () => {
    try {
      // In MVP, just log or send to feedback endpoint
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bug', message: bugReport }),
      });
      setSaveMessage({ type: 'success', text: 'Bug report submitted. Thank you!' });
      setBugReport('');
      setShowBugModal(false);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to submit bug report' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load settings</p>
      </div>
    );
  }

  const focusAreas = [
    'Confidence building',
    'Consistency',
    'Planning',
    'Creativity',
    'Communication',
    'Values',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your preferences and privacy settings</p>
      </div>

      {saveMessage && (
        <div
          className={`p-4 rounded-lg ${
            saveMessage.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="personalization">Personalization</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Manage how you receive updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive updates via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.notificationPrefs.emailEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notificationPrefs: { ...settings.notificationPrefs, emailEnabled: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="in-app-notifications">In-App Notifications</Label>
                  <p className="text-sm text-gray-500">Receive updates in the app</p>
                </div>
                <Switch
                  id="in-app-notifications"
                  checked={settings.notificationPrefs.inAppEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notificationPrefs: { ...settings.notificationPrefs, inAppEnabled: checked },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="report-frequency">Frequency</Label>
                <Select
                  value={settings.notificationPrefs.reportFrequency}
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                    setSettings({
                      ...settings,
                      notificationPrefs: { ...settings.notificationPrefs, reportFrequency: value },
                    })
                  }
                >
                  <SelectTrigger id="report-frequency" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-4 border-t space-y-4">
                <Label className="text-base font-semibold">Alert Preferences</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="alert-inactive" className="text-sm">Notify when child is inactive</Label>
                      <p className="text-xs text-gray-500">Get notified if no activity for X days</p>
                    </div>
                    <Select
                      value={String(settings.notificationPrefs.alertInactiveDays || 7)}
                      onValueChange={(value) =>
                        setSettings({
                          ...settings,
                          notificationPrefs: {
                            ...settings.notificationPrefs,
                            alertInactiveDays: parseInt(value),
                          },
                        })
                      }
                    >
                      <SelectTrigger id="alert-inactive" className="w-32">
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
                      <Label htmlFor="alert-weekly-plan" className="text-sm">Weekly plan missed</Label>
                      <p className="text-xs text-gray-500">Notify when weekly plan is not completed</p>
                    </div>
                    <Switch
                      id="alert-weekly-plan"
                      checked={settings.notificationPrefs.alertWeeklyPlanMissed || false}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notificationPrefs: {
                            ...settings.notificationPrefs,
                            alertWeeklyPlanMissed: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="alert-teacher-assignments" className="text-sm">Teacher assignments</Label>
                      <p className="text-xs text-gray-500">Notify when teacher assigns new activities</p>
                    </div>
                    <Switch
                      id="alert-teacher-assignments"
                      checked={settings.notificationPrefs.alertTeacherAssignments || false}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notificationPrefs: {
                            ...settings.notificationPrefs,
                            alertTeacherAssignments: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Report Preferences
              </CardTitle>
              <CardDescription>Customize your report settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="digest-frequency">Report Digest Frequency</Label>
                <Select
                  value={settings.reportPrefs.digestFrequency}
                  onValueChange={(value: 'weekly' | 'monthly') =>
                    setSettings({
                      ...settings,
                      reportPrefs: { ...settings.reportPrefs, digestFrequency: value },
                    })
                  }
                >
                  <SelectTrigger id="digest-frequency" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="default-time-range">Default Time Range for Trends</Label>
                <Select
                  value={settings.reportPrefs.defaultTimeRange}
                  onValueChange={(value: '7d' | '30d' | '90d') =>
                    setSettings({
                      ...settings,
                      reportPrefs: { ...settings.reportPrefs, defaultTimeRange: value },
                    })
                  }
                >
                  <SelectTrigger id="default-time-range" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label htmlFor="include-support-actions">Include Support Actions in Weekly Summary</Label>
                  <p className="text-sm text-gray-500">Show actionable tips in weekly reports</p>
                </div>
                <Switch
                  id="include-support-actions"
                  checked={settings.reportPrefs.includeSupportActions}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      reportPrefs: { ...settings.reportPrefs, includeSupportActions: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label htmlFor="include-progress-narrative">Include Progress Narrative</Label>
                  <p className="text-sm text-gray-500">Show progress narrative when unlocked</p>
                </div>
                <Switch
                  id="include-progress-narrative"
                  checked={settings.reportPrefs.includeProgressNarrative}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      reportPrefs: { ...settings.reportPrefs, includeProgressNarrative: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy & Consent Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Privacy & Consent
              </CardTitle>
              <CardDescription>View your privacy and consent settings (read-only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Data Sharing</span>
                  <Badge variant={settings.privacyConsent.dataSharing ? 'default' : 'secondary'}>
                    {settings.privacyConsent.dataSharing ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(settings.privacyConsent.lastUpdated).toLocaleDateString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">AI Analysis</span>
                  <Badge variant={settings.privacyConsent.aiAnalysis ? 'default' : 'secondary'}>
                    {settings.privacyConsent.aiAnalysis ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(settings.privacyConsent.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                Data Export
              </CardTitle>
              <CardDescription>Manage your data (coming soon)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Download Activity Data</p>
                    <p className="text-xs text-gray-500">Export your child's activity history</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Request Account Deletion</p>
                    <p className="text-xs text-gray-500">Permanently delete your account and data</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personalization Tab */}
        <TabsContent value="personalization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Personalization Preferences
              </CardTitle>
              <CardDescription>Customize how insights are presented</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="language">Language</Label>
                <Select value={settings.personalizationPrefs.language} disabled>
                  <SelectTrigger id="language" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Language selection will be available in a future update.</p>
              </div>
              <div>
                <Label htmlFor="tone-preference">Tone Preference</Label>
                <Select
                  value={settings.personalizationPrefs.tonePreference}
                  onValueChange={(value: 'concise' | 'detailed') =>
                    setSettings({
                      ...settings,
                      personalizationPrefs: {
                        ...settings.personalizationPrefs,
                        tonePreference: value,
                      },
                    })
                  }
                >
                  <SelectTrigger id="tone-preference" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose how detailed you want insights to be (affects UI display only, not scoring)
                </p>
              </div>
              <div>
                <Label className="mb-3 block">Focus Areas (Optional)</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Select areas you'd like to pay attention to. This only affects ordering/highlighting in your UI, not
                  scoring.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {focusAreas.map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`focus-${area}`}
                        checked={settings.personalizationPrefs.focusAreas.includes(area)}
                        onCheckedChange={(checked) => {
                          const current = settings.personalizationPrefs.focusAreas;
                          if (checked) {
                            setSettings({
                              ...settings,
                              personalizationPrefs: {
                                ...settings.personalizationPrefs,
                                focusAreas: [...current, area],
                              },
                            });
                          } else {
                            setSettings({
                              ...settings,
                              personalizationPrefs: {
                                ...settings.personalizationPrefs,
                                focusAreas: current.filter((a) => a !== area),
                              },
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`focus-${area}`} className="text-sm font-normal cursor-pointer">
                        {area}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-orange-600" />
                Support & Feedback
              </CardTitle>
              <CardDescription>Get help and share feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button
                  variant="outline"
                  onClick={() => setShowBugModal(true)}
                  className="w-full justify-start"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Report a Bug
                </Button>
              </div>
              <div>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  Send Feedback
                </Button>
              </div>
              <div>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  View Help Docs
                </Button>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">App Version:</span> 1.0.0
                </p>
                <p className="text-xs text-gray-500 mt-1">Build: dev</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bug Report Modal */}
      {showBugModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>Report a Bug</CardTitle>
              <CardDescription>Describe the issue you encountered</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bug-report">Description</Label>
                <Textarea
                  id="bug-report"
                  value={bugReport}
                  onChange={(e) => setBugReport(e.target.value)}
                  placeholder="Please describe the bug..."
                  rows={5}
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBugModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBugReport} disabled={!bugReport.trim()}>
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
