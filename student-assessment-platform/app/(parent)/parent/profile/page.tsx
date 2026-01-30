/**
 * Parent Profile Page
 * 
 * Complete parent profile management page.
 * 
 * @module app/(parent)/parent/profile
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Mail, Phone, Globe, Edit, Users, Settings, Save, CheckCircle2 } from 'lucide-react';
import { ParentProfileDTO } from '@/lib/parent-dtos';
// Toast will be handled with state for now

export default function ParentProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [data, setData] = useState<ParentProfileDTO | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/parent/profile', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        // Initialize form state
        setDisplayName(result.data.profile.displayName || result.data.user.name);
        setPhone(result.data.user.phone || '');
        setTimezone(result.data.profile.timezone || 'Asia/Kolkata');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/parent/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          displayName: displayName || undefined,
          phone: phone || undefined,
          timezone,
        }),
      });

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Profile updated successfully' });
        setEditMode(false);
        await fetchProfile(); // Refresh data
      } else {
        const result = await response.json();
        setSaveMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your profile information and preferences</p>
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

      {/* Hero/Header Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={data.user.avatar || undefined} alt={data.user.name} />
              <AvatarFallback className="bg-purple-600 text-white text-2xl font-semibold">
                {getInitials(data.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{data.user.name}</h2>
                {data.profile.displayName && data.profile.displayName !== data.user.name && (
                  <p className="text-sm text-gray-500">Display Name: {data.profile.displayName}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{data.user.email}</span>
                </div>
                {data.user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{data.user.phone}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editMode ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/parent/settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Children
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={data.user.name}
                disabled
                className="mt-2 bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Name cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={!editMode}
                className="mt-2"
                placeholder="Enter display name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={data.user.email}
                disabled
                className="mt-2 bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!editMode}
                className="mt-2"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={timezone}
                onValueChange={setTimezone}
                disabled={!editMode}
              >
                <SelectTrigger id="timezone" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {editMode && (
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
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Student / Child Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Linked Student
          </CardTitle>
          <CardDescription>Your child's information</CardDescription>
        </CardHeader>
        <CardContent>
          {data.linkedStudent ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Name</Label>
                  <p className="text-lg font-semibold text-gray-900">{data.linkedStudent.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Grade</Label>
                  <p className="text-lg font-semibold text-gray-900">Grade {data.linkedStudent.grade}</p>
                </div>
                {data.linkedStudent.section && (
                  <div>
                    <Label className="text-sm text-gray-600">Section</Label>
                    <p className="text-lg font-semibold text-gray-900">{data.linkedStudent.section}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-gray-600">School</Label>
                  <p className="text-lg font-semibold text-gray-900">{data.linkedStudent.tenantName}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button variant="outline" size="sm" disabled>
                  Switch Child (Coming Soon)
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No student linked to your account</p>
              <Button variant="outline" disabled>
                Link Your Child (Coming Soon)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Communication Preferences Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Communication Preferences
          </CardTitle>
          <CardDescription>Summary of your notification settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Email Notifications</span>
              </div>
              <Badge variant={data.communicationSummary.emailEnabled ? 'default' : 'secondary'}>
                {data.communicationSummary.emailEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">In-App Notifications</span>
              </div>
              <Badge variant={data.communicationSummary.inAppEnabled ? 'default' : 'secondary'}>
                {data.communicationSummary.inAppEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/parent/settings?tab=notifications')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Notification Preferences
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

