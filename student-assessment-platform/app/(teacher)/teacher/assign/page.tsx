/**
 * Teacher Assignment Builder
 * 
 * Comprehensive assignment creation flow with 5 sections:
 * Target, Purpose, Content (Recommended/Library), Schedule, Review
 * 
 * @module app/(teacher)/teacher/assign
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Users, 
  Target, 
  FileText, 
  Calendar,
  CheckCircle2,
  X,
  RefreshCw,
  Search,
  Clock,
  Sparkles
} from 'lucide-react';
import { TeacherHeader } from '@/components/TeacherHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Student {
  id: string;
  name: string;
  currentGrade: number;
  avatarUrl?: string;
  initials?: string;
}

interface Group {
  id: string;
  name: string;
  type: 'MANUAL' | 'SMART';
  studentCount: number;
}

interface RecommendedQuest {
  id: string;
  type: string;
  title: string;
  description: string;
  estimatedTime: number;
  primarySkills: string[];
  skillSignals: string[];
  gradeApplicability: number[];
}

const INTENT_OPTIONS = [
  { value: 'IMPROVE_FOCUS', label: 'Improve Focus', icon: Target, description: 'Help students build attention and concentration' },
  { value: 'STRENGTHEN_PLANNING', label: 'Strengthen Planning', icon: Calendar, description: 'Develop organizational and planning skills' },
  { value: 'ENCOURAGE_COMMUNICATION', label: 'Encourage Communication', icon: Users, description: 'Build language and social communication' },
  { value: 'BUILD_CONSISTENCY', label: 'Build Consistency', icon: CheckCircle2, description: 'Establish regular practice habits' },
  { value: 'PREPARE_FOR_EXAMS', label: 'Prepare for Exams', icon: FileText, description: 'Focus on reasoning, memory, and planning' },
  { value: 'REENGAGE_PARTICIPATION', label: 'Re-engage Participation', icon: Sparkles, description: 'Spark interest and re-engage students' },
];

function AssignmentBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentSection, setCurrentSection] = useState(1);
  
  // Data
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  
  // Section 1: Target
  const [targetType, setTargetType] = useState<'CLASS' | 'GROUP' | 'INDIVIDUAL'>('CLASS');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  // Section 2: Purpose
  const [intent, setIntent] = useState<string>('');
  const [teacherNote, setTeacherNote] = useState('');
  
  // Section 3: Content
  const [contentMode, setContentMode] = useState<'recommended' | 'library'>('recommended');
  const [selectedQuests, setSelectedQuests] = useState<RecommendedQuest[]>([]);
  const [recommendedQuests, setRecommendedQuests] = useState<RecommendedQuest[]>([]);
  const [isLoadingQuests, setIsLoadingQuests] = useState(false);
  const [libraryFilters, setLibraryFilters] = useState({
    type: [] as string[],
    skill: [] as string[],
    duration: '',
    grade: '',
  });
  
  // Section 4: Schedule
  const [dueDate, setDueDate] = useState('');
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [sessionLength, setSessionLength] = useState('');
  
  // Section 5: Review
  const [assignmentTitle, setAssignmentTitle] = useState('');

  useEffect(() => {
    fetchStudentsAndGroups();
    fetchDefaultSettings();
    
    // Handle query params for preselection
    const studentId = searchParams?.get('studentId');
    const groupId = searchParams?.get('groupId');
    
    if (studentId) {
      setTargetType('INDIVIDUAL');
      setSelectedStudentIds([studentId]);
    } else if (groupId) {
      setTargetType('GROUP');
      setSelectedGroupIds([groupId]);
    }
  }, [searchParams]);

  const fetchDefaultSettings = async () => {
    try {
      const response = await fetch('/api/teacher/settings', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data?.settings?.assignmentDefaults) {
          const defaults = data.data.settings.assignmentDefaults;
          setIntent(defaults.defaultIntent || '');
          if (defaults.defaultDueDays) {
            const dueDateObj = new Date();
            dueDateObj.setDate(dueDateObj.getDate() + defaults.defaultDueDays);
            setDueDate(dueDateObj.toISOString().split('T')[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching default settings:', error);
    }
  };

  const fetchStudentsAndGroups = async () => {
    try {
      setIsLoading(true);
      const [studentsRes, groupsRes] = await Promise.all([
        fetch('/api/teacher/students', { credentials: 'include' }),
        fetch('/api/teacher/groups', { credentials: 'include' }),
      ]);

      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data.data || []);
      }

      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setGroups(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendedQuests = async () => {
    try {
      setIsLoadingQuests(true);
      const params = new URLSearchParams();
      if (selectedStudentIds.length === 1) {
        params.append('studentId', selectedStudentIds[0]);
      }
      // Get grade from first selected student or class section
      const studentGrade = students.find(s => selectedStudentIds.includes(s.id))?.currentGrade;
      if (studentGrade) {
        params.append('studentGrade', studentGrade.toString());
      }
      params.append('questCount', '3');
      if (intent) {
        params.append('intent', intent);
      }
      
      const response = await fetch(`/api/teacher/recommend-quests?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendedQuests(data.data.quests || []);
        // Auto-select recommended quests
        setSelectedQuests(data.data.quests || []);
      }
    } catch (error) {
      console.error('Error fetching recommended quests:', error);
      setSaveMessage({ type: 'error', text: 'Failed to load recommended quests' });
    } finally {
      setIsLoadingQuests(false);
    }
  };

  useEffect(() => {
    if (currentSection === 3 && contentMode === 'recommended' && intent) {
      fetchRecommendedQuests();
    }
  }, [currentSection, contentMode, intent, selectedStudentIds]);

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleRemoveQuest = (questId: string) => {
    setSelectedQuests((prev) => prev.filter((q) => q.id !== questId));
  };

  const handleReplaceQuest = async (questId: string) => {
    // Fetch a new quest to replace
    try {
      setIsLoadingQuests(true);
      const params = new URLSearchParams();
      if (selectedStudentIds.length === 1) {
        params.append('studentId', selectedStudentIds[0]);
      }
      const studentGrade = students.find(s => selectedStudentIds.includes(s.id))?.currentGrade;
      if (studentGrade) {
        params.append('studentGrade', studentGrade.toString());
      }
      params.append('questCount', '1');
      if (intent) {
        params.append('intent', intent);
      }
      
      const response = await fetch(`/api/teacher/recommend-quests?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const newQuest = data.data.quests[0];
        if (newQuest) {
          setSelectedQuests((prev) => prev.map((q) => (q.id === questId ? newQuest : q)));
        }
      }
    } catch (error) {
      console.error('Error replacing quest:', error);
    } finally {
      setIsLoadingQuests(false);
    }
  };

  const getTargetCount = () => {
    if (targetType === 'CLASS') {
      return students.length;
    } else if (targetType === 'GROUP') {
      return groups.filter(g => selectedGroupIds.includes(g.id)).reduce((sum, g) => sum + g.studentCount, 0);
    } else {
      return selectedStudentIds.length;
    }
  };

  const getTargetPreview = () => {
    if (targetType === 'CLASS') {
      return <Badge variant="outline">Entire Class ({students.length} students)</Badge>;
    } else if (targetType === 'GROUP') {
      return (
        <div className="flex flex-wrap gap-2">
          {groups.filter(g => selectedGroupIds.includes(g.id)).map(g => (
            <Badge key={g.id} variant="outline">{g.name} ({g.studentCount})</Badge>
          ))}
        </div>
      );
    } else {
      return (
        <div className="flex flex-wrap gap-2">
          {students.filter(s => selectedStudentIds.includes(s.id)).slice(0, 5).map(s => (
            <Badge key={s.id} variant="outline">{s.name}</Badge>
          ))}
          {selectedStudentIds.length > 5 && (
            <Badge variant="outline">+{selectedStudentIds.length - 5} more</Badge>
          )}
        </div>
      );
    }
  };

  const handleSubmit = async () => {
    if (!assignmentTitle.trim()) {
      setSaveMessage({ type: 'error', text: 'Please enter an assignment title' });
      return;
    }

    if (selectedQuests.length === 0) {
      setSaveMessage({ type: 'error', text: 'Please select at least one quest' });
      return;
    }

    if (targetType === 'GROUP' && selectedGroupIds.length === 0) {
      setSaveMessage({ type: 'error', text: 'Please select at least one group' });
      return;
    }

    if (targetType === 'INDIVIDUAL' && selectedStudentIds.length === 0) {
      setSaveMessage({ type: 'error', text: 'Please select at least one student' });
      return;
    }

    try {
      setIsSaving(true);
      const targetIds =
        targetType === 'CLASS'
          ? []
          : targetType === 'GROUP'
          ? selectedGroupIds
          : selectedStudentIds;

      const questTypes = [...new Set(selectedQuests.map(q => q.type))];
      
      const response = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: assignmentTitle,
          description: teacherNote || null,
          targetType,
          targetIds,
          questCount: selectedQuests.length,
          questTypes,
          intent: intent || null,
          dueDate: dueDate || null,
          // Store selected quest IDs for later reference
          selectedQuestIds: selectedQuests.map(q => q.id),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSaveMessage({ type: 'success', text: 'Assignment created successfully!' });
        setTimeout(() => {
          router.push(`/teacher/assignments/${data.data.assignmentId}`);
        }, 1500);
      } else {
        const error = await response.json();
        setSaveMessage({ type: 'error', text: error.error || 'Failed to create assignment' });
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      setSaveMessage({ type: 'error', text: 'Failed to create assignment' });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

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
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Create Assignment</h1>
            <p className="text-gray-600 mt-1">Build a personalized activity for your students</p>
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

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step <= currentSection
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}
                  >
                    {step < currentSection ? <CheckCircle2 className="h-5 w-5" /> : step}
                  </div>
                  {step < 5 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step < currentSection ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>Target</span>
              <span>Purpose</span>
              <span>Content</span>
              <span>Schedule</span>
              <span>Review</span>
            </div>
          </div>

          {/* Section 1: Target */}
          {currentSection === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>1. Select Target</CardTitle>
                <CardDescription>Choose who will receive this assignment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Target Type</Label>
                  <RadioGroup value={targetType} onValueChange={(v: any) => setTargetType(v)} className="mt-2">
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="CLASS" id="target-class" />
                      <Label htmlFor="target-class" className="flex-1 cursor-pointer">
                        <div className="font-medium">Entire Class</div>
                        <div className="text-sm text-gray-500">{students.length} students</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="GROUP" id="target-group" />
                      <Label htmlFor="target-group" className="flex-1 cursor-pointer">
                        <div className="font-medium">Specific Group(s)</div>
                        <div className="text-sm text-gray-500">Select one or more groups</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="INDIVIDUAL" id="target-individual" />
                      <Label htmlFor="target-individual" className="flex-1 cursor-pointer">
                        <div className="font-medium">Individual Student(s)</div>
                        <div className="text-sm text-gray-500">Select specific students</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {targetType === 'GROUP' && (
                  <div>
                    <Label>Select Groups</Label>
                    <div className="mt-2 space-y-2 border rounded-lg p-4 max-h-64 overflow-y-auto">
                      {groups.length > 0 ? (
                        groups.map((group) => (
                          <div key={group.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`group-${group.id}`}
                              checked={selectedGroupIds.includes(group.id)}
                              onCheckedChange={() => handleGroupToggle(group.id)}
                            />
                            <Label htmlFor={`group-${group.id}`} className="flex-1 cursor-pointer">
                              <div className="font-medium">{group.name}</div>
                              <div className="text-sm text-gray-500">
                                {group.type === 'SMART' ? 'Smart Group' : 'Manual Group'} • {group.studentCount} students
                              </div>
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No groups available</p>
                      )}
                    </div>
                    {selectedGroupIds.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Selected: {getTargetCount()} students</p>
                      </div>
                    )}
                  </div>
                )}

                {targetType === 'INDIVIDUAL' && (
                  <div>
                    <Label>Select Students</Label>
                    <div className="mt-2 mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search students..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <div key={student.id} className="flex items-center space-x-2 py-2">
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={selectedStudentIds.includes(student.id)}
                              onCheckedChange={() => handleStudentToggle(student.id)}
                            />
                            <Label htmlFor={`student-${student.id}`} className="flex-1 cursor-pointer flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={student.avatarUrl} />
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                  {student.initials || student.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-sm text-gray-500">Grade {student.currentGrade}</div>
                              </div>
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No students found</p>
                      )}
                    </div>
                    {selectedStudentIds.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Selected: {selectedStudentIds.length} student(s)</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {students.filter(s => selectedStudentIds.includes(s.id)).slice(0, 5).map(s => (
                            <Badge key={s.id} variant="secondary">{s.name}</Badge>
                          ))}
                          {selectedStudentIds.length > 5 && (
                            <Badge variant="secondary">+{selectedStudentIds.length - 5} more</Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => router.push('/teacher')}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    if (targetType === 'GROUP' && selectedGroupIds.length === 0) {
                      setSaveMessage({ type: 'error', text: 'Please select at least one group' });
                      return;
                    }
                    if (targetType === 'INDIVIDUAL' && selectedStudentIds.length === 0) {
                      setSaveMessage({ type: 'error', text: 'Please select at least one student' });
                      return;
                    }
                    setCurrentSection(2);
                  }}>
                    Next: Purpose
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 2: Purpose */}
          {currentSection === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>2. Set Purpose</CardTitle>
                <CardDescription>Choose the intent for this assignment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {INTENT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <div
                        key={option.value}
                        onClick={() => setIntent(option.value)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          intent === option.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${intent === option.value ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-gray-500 mt-1">{option.description}</div>
                          </div>
                          {intent === option.value && (
                            <CheckCircle2 className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <Label htmlFor="teacherNote">Teacher Note (Optional)</Label>
                  <Textarea
                    id="teacherNote"
                    value={teacherNote}
                    onChange={(e) => setTeacherNote(e.target.value)}
                    placeholder="Add a brief note about this assignment..."
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => setCurrentSection(1)}>
                    Back
                  </Button>
                  <Button onClick={() => {
                    if (!intent) {
                      setSaveMessage({ type: 'error', text: 'Please select an intent' });
                      return;
                    }
                    setCurrentSection(3);
                  }}>
                    Next: Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 3: Content */}
          {currentSection === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>3. Select Content</CardTitle>
                <CardDescription>Choose quests for this assignment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={contentMode} onValueChange={(v: any) => setContentMode(v)}>
                  <TabsList>
                    <TabsTrigger value="recommended">Recommended</TabsTrigger>
                    <TabsTrigger value="library">Choose from Library</TabsTrigger>
                  </TabsList>

                  <TabsContent value="recommended" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Quests recommended based on your class focus, student needs, and selected intent.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchRecommendedQuests}
                        disabled={isLoadingQuests}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingQuests ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>

                    {isLoadingQuests ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Loading recommended quests...</p>
                      </div>
                    ) : selectedQuests.length > 0 ? (
                      <div className="space-y-3">
                        {selectedQuests.map((quest) => (
                          <div key={quest.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="capitalize">
                                    {quest.type.replace(/_/g, ' ')}
                                  </Badge>
                                  <span className="text-sm font-medium">{quest.title}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {quest.estimatedTime} min
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {quest.primarySkills.slice(0, 3).map((skill) => (
                                      <Badge key={skill} variant="secondary" className="text-xs">
                                        {skill.replace(/_/g, ' ').toLowerCase()}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReplaceQuest(quest.id)}
                                  disabled={isLoadingQuests}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Replace
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveQuest(quest.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No recommended quests available. Click Refresh to generate recommendations.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="library" className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                      Browse and select quests from the library. Filters coming soon.
                    </div>
                    <div className="text-center py-8 text-gray-500">
                      <p>Quest library browsing coming soon. Use Recommended mode for now.</p>
                    </div>
                  </TabsContent>
                </Tabs>

                {selectedQuests.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Selected: {selectedQuests.length} quest(s)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuests.map((quest) => (
                        <Badge key={quest.id} variant="secondary">
                          {quest.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => setCurrentSection(2)}>
                    Back
                  </Button>
                  <Button onClick={() => {
                    if (selectedQuests.length === 0) {
                      setSaveMessage({ type: 'error', text: 'Please select at least one quest' });
                      return;
                    }
                    setCurrentSection(4);
                  }}>
                    Next: Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 4: Schedule & Rules */}
          {currentSection === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>4. Schedule & Rules</CardTitle>
                <CardDescription>Set deadlines and attempt limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="attemptsAllowed">Attempts Allowed</Label>
                  <Select
                    value={attemptsAllowed.toString()}
                    onValueChange={(v) => setAttemptsAllowed(parseInt(v))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 attempt</SelectItem>
                      <SelectItem value="2">2 attempts</SelectItem>
                      <SelectItem value="3">3 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sessionLength">Recommended Session Length (Optional)</Label>
                  <Input
                    id="sessionLength"
                    type="text"
                    value={sessionLength}
                    onChange={(e) => setSessionLength(e.target.value)}
                    placeholder="e.g., 15-20 minutes"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Informational only. Students will see this as guidance.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Student-Facing Label</p>
                  <p className="text-sm text-gray-600">
                    This assignment will appear to students as a <strong>"Challenge Pack"</strong>. 
                    Students will see quest completion results, not detailed reports.
                  </p>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => setCurrentSection(3)}>
                    Back
                  </Button>
                  <Button onClick={() => setCurrentSection(5)}>
                    Next: Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 5: Review & Create */}
          {currentSection === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>5. Review & Create</CardTitle>
                <CardDescription>Review your assignment and create it</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="assignmentTitle">Assignment Title *</Label>
                  <Input
                    id="assignmentTitle"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="e.g., Weekly Practice Challenge"
                    className="mt-2"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Target</Label>
                    <div className="mt-1">{getTargetPreview()}</div>
                    <p className="text-xs text-gray-500 mt-1">{getTargetCount()} student(s) will receive this assignment</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Purpose</Label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {INTENT_OPTIONS.find(i => i.value === intent)?.label || 'None'}
                      </Badge>
                    </div>
                    {teacherNote && (
                      <p className="text-sm text-gray-600 mt-1">{teacherNote}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Content</Label>
                    <div className="mt-1 space-y-2">
                      {selectedQuests.map((quest) => (
                        <div key={quest.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="text-sm font-medium">{quest.title}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {quest.type.replace(/_/g, ' ')} • {quest.estimatedTime} min
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{selectedQuests.length} quest(s) selected</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Schedule</Label>
                    <div className="mt-1 space-y-1 text-sm text-gray-600">
                      <p>Due Date: {dueDate || 'No due date'}</p>
                      <p>Attempts Allowed: {attemptsAllowed}</p>
                      {sessionLength && <p>Session Length: {sessionLength}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => setCurrentSection(4)}>
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSaving || !assignmentTitle.trim()}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Assignment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AssignmentBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    }>
      <AssignmentBuilderContent />
    </Suspense>
  );
}
