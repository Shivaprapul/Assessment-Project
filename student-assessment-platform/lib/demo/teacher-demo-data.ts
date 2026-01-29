/**
 * Teacher Demo Data Generator
 * 
 * Generates realistic dummy data for teacher dashboard when DEMO_TEACHER=true.
 * 
 * @module lib/demo/teacher-demo-data
 */

const DEMO_STUDENT_NAMES = [
  'Arjun Sharma',
  'Priya Patel',
  'Rohan Kumar',
  'Ananya Singh',
  'Vikram Reddy',
  'Kavya Nair',
  'Aditya Joshi',
  'Meera Desai',
  'Siddharth Iyer',
  'Neha Gupta',
  'Rahul Verma',
  'Sneha Menon',
  'Karan Malhotra',
  'Divya Rao',
  'Aryan Kapoor',
  'Isha Agarwal',
  'Vivek Chaturvedi',
  'Pooja Mehta',
  'Manish Shah',
  'Tanvi Bhatt',
  'Rishi Dutta',
  'Anjali Sinha',
  'Sahil Bansal',
  'Nisha Trivedi',
];

const SKILL_CATEGORIES = [
  'Cognitive Reasoning',
  'Creativity',
  'Language',
  'Memory',
  'Attention',
  'Planning',
  'Social & Emotional',
  'Metacognition',
  'Character & Values',
];

const STATUSES: Array<'active' | 'needs_nudge' | 'new_joiner'> = ['active', 'active', 'active', 'active', 'active', 'needs_nudge', 'needs_nudge', 'new_joiner'];

/**
 * Generate initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate demo students for teacher dashboard
 */
export function generateDemoStudents(grade: number = 9, count: number = 10) {
  const students = DEMO_STUDENT_NAMES.slice(0, count).map((name, index) => {
    const daysAgo = Math.floor(Math.random() * 14); // 0-14 days ago
    const lastActiveAt = daysAgo > 0 
      ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      : null;
    
    const weeklyCompleted = Math.floor(Math.random() * 8); // 0-7 quests
    const daysSinceCreated = Math.floor(Math.random() * 30); // 0-30 days
    
    // Determine status
    let status: 'active' | 'needs_nudge' | 'new_joiner' = STATUSES[index % STATUSES.length];
    if (daysSinceCreated <= 7) {
      status = 'new_joiner';
    } else if (weeklyCompleted === 0 && daysAgo > 7) {
      status = 'needs_nudge';
    }
    
    // Generate 2-3 skill highlights
    const skillCount = 2 + Math.floor(Math.random() * 2); // 2 or 3
    const shuffledSkills = [...SKILL_CATEGORIES].sort(() => Math.random() - 0.5);
    const topSkills = shuffledSkills.slice(0, skillCount);
    
    // Generate section (A, B, or C)
    const sections = ['A', 'B', 'C'];
    const section = sections[index % sections.length];
    
    return {
      id: `demo-student-${index + 1}`,
      name,
      avatarUrl: null, // No avatar, will use initials
      initials: getInitials(name),
      grade,
      section,
      lastActiveAt: lastActiveAt ? lastActiveAt.toISOString() : null,
      lastActive: lastActiveAt ? lastActiveAt.toLocaleDateString() : 'Never',
      weeklyCompletedCount: weeklyCompleted,
      questsCompleted: weeklyCompleted,
      topSkillChips: topSkills,
      skillHighlights: topSkills.map(s => s.toLowerCase().replace(/\s+/g, ' ')),
      status,
    };
  });
  
  return students;
}

/**
 * Generate demo class signals
 */
export function generateDemoClassSignals() {
  const signals = [];
  
  // Engagement signal
  const engagementTypes = [
    { type: 'engagement' as const, message: 'This week, many students are actively practicing with 4 quests per student on average.', trend: 'up' as const },
    { type: 'engagement' as const, message: 'This week, students are practicing with 2 quests per student on average.', trend: 'stable' as const },
    { type: 'engagement' as const, message: 'This week, engagement is lower than usual. Consider assigning activities to re-engage participation.', trend: 'down' as const },
  ];
  signals.push(engagementTypes[Math.floor(Math.random() * engagementTypes.length)]);
  
  // Strengthening area
  const strengtheningSkills = ['planning', 'creativity', 'attention', 'memory'];
  const strengtheningSkill = strengtheningSkills[Math.floor(Math.random() * strengtheningSkills.length)];
  signals.push({
    type: 'strengthening' as const,
    message: `Many students are strengthening ${strengtheningSkill}. This is a good time to build on this momentum.`,
    trend: 'up' as const,
  });
  
  // Common strength
  const strengthSkills = ['creativity', 'language', 'social & emotional'];
  const strengthSkill = strengthSkills[Math.floor(Math.random() * strengthSkills.length)];
  signals.push({
    type: 'strength' as const,
    message: `Many students show strength in ${strengthSkill}. Consider using this in group activities.`,
    trend: 'stable' as const,
  });
  
  // Anomaly (optional)
  if (Math.random() > 0.5) {
    const inactiveCount = Math.floor(Math.random() * 3) + 1;
    signals.push({
      type: 'anomaly' as const,
      message: `${inactiveCount} student${inactiveCount > 1 ? 's' : ''} haven't completed any quests this week. Consider reaching out.`,
      trend: 'down' as const,
    });
  }
  
  return signals.slice(0, 6); // Max 6 signals
}

/**
 * Generate demo groups
 */
export function generateDemoGroups() {
  return [
    {
      id: 'demo-group-1',
      name: 'Low engagement this week',
      type: 'SMART' as const,
      studentCount: 3,
      description: 'Students with no quests completed in the last 7 days',
    },
    {
      id: 'demo-group-2',
      name: 'Needs Planning support',
      type: 'SMART' as const,
      studentCount: 4,
      description: 'Students showing lower scores in planning skills',
    },
    {
      id: 'demo-group-3',
      name: 'Strong creativity cluster',
      type: 'SMART' as const,
      studentCount: 5,
      description: 'Students excelling in creativity-based activities',
    },
    {
      id: 'demo-group-4',
      name: 'Project Team Alpha',
      type: 'MANUAL' as const,
      studentCount: 6,
      description: 'Assigned for group project work',
    },
  ];
}

