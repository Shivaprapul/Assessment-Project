# UI/UX Design Specifications

## Document Overview
This document provides comprehensive UI/UX design specifications for the Student Assessment & Career Support Platform. It includes screen layouts, component specifications, design system, user flows, and accessibility requirements.

**Target Audience:** Frontend engineers, UI/UX designers, QA, AI coding agents (Cursor)  
**Version:** 1.0  
**Last Updated:** January 2026

---

## 1. Design System

### 1.1 Core Design Principles

1. **Student-First Experience**
   - Age-appropriate design (13-16 years old)
   - Engaging but not childish
   - Clear, simple language
   - Minimal cognitive load

2. **Growth-Oriented**
   - Celebrate progress, not perfection
   - No rankings or comparisons
   - Encouraging language and visuals
   - Focus on learning journey

3. **Accessible by Default**
   - WCAG 2.1 Level AA compliance
   - Keyboard navigation support
   - Screen reader compatible
   - Color contrast ratios ≥ 4.5:1

4. **Responsive & Performant**
   - Mobile-first approach
   - Desktop-optimized for games
   - Fast load times (< 2s)
   - Smooth animations (60fps)

---

### 1.2 Color Palette

**Primary Colors:**
```css
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6;  /* Main brand color */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;
```

**Secondary Colors (Accent):**
```css
--secondary-50: #f0fdf4;
--secondary-100: #dcfce7;
--secondary-200: #bbf7d0;
--secondary-300: #86efac;
--secondary-400: #4ade80;
--secondary-500: #22c55e;  /* Success/Growth indicator */
--secondary-600: #16a34a;
--secondary-700: #15803d;
--secondary-800: #166534;
--secondary-900: #14532d;
```

**Neutral/Gray Scale:**
```css
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

**Semantic Colors:**
```css
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

**Skill Tree Category Colors:**
```css
--cognitive: #3b82f6;      /* Blue */
--creativity: #a855f7;      /* Purple */
--language: #06b6d4;        /* Cyan */
--memory: #ec4899;          /* Pink */
--attention: #f59e0b;       /* Amber */
--planning: #10b981;        /* Green */
--social-emotional: #f43f5e; /* Rose */
--metacognition: #8b5cf6;   /* Violet */
--character: #0891b2;       /* Teal */
```

---

### 1.3 Typography

**Font Families:**
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-display: 'Cal Sans', 'Inter', sans-serif;  /* For headings */
--font-mono: 'Fira Code', 'Monaco', monospace;    /* For code/data */
```

**Font Sizes:**
```css
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */
```

**Font Weights:**
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

**Line Heights:**
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

---

### 1.4 Spacing System

**Base unit:** 4px

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

---

### 1.5 Border Radius

```css
--radius-none: 0;
--radius-sm: 0.125rem;    /* 2px */
--radius-default: 0.25rem; /* 4px */
--radius-md: 0.375rem;     /* 6px */
--radius-lg: 0.5rem;       /* 8px */
--radius-xl: 0.75rem;      /* 12px */
--radius-2xl: 1rem;        /* 16px */
--radius-full: 9999px;     /* Circle/Pill */
```

---

### 1.6 Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

---

### 1.7 Animation & Transitions

**Durations:**
```css
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

**Easing Functions:**
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

**Common Transitions:**
```css
.transition-default {
  transition: all var(--duration-base) var(--ease-in-out);
}

.transition-colors {
  transition: color var(--duration-base) var(--ease-in-out),
              background-color var(--duration-base) var(--ease-in-out);
}

.transition-transform {
  transition: transform var(--duration-base) var(--ease-out);
}
```

---

## 2. Component Library (shadcn/ui Based)

### 2.1 Button Component

**Variants:**

```tsx
import { Button } from '@/components/ui/button';

// Primary (Default)
<Button>Continue</Button>

// Secondary
<Button variant="secondary">Cancel</Button>

// Outline
<Button variant="outline">Learn More</Button>

// Ghost
<Button variant="ghost">Skip</Button>

// Destructive
<Button variant="destructive">Delete Account</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// With Icon
<Button>
  <Icon className="mr-2" />
  Save Progress
</Button>

// Loading State
<Button disabled>
  <Loader className="mr-2 animate-spin" />
  Processing...
</Button>
```

**Component Spec:**
- Minimum touch target: 44x44px
- Focus ring: 2px offset, primary color
- Disabled state: 40% opacity
- Hover: Darken by 10%
- Active: Scale(0.98)

---

### 2.2 Card Component

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Pattern Forge</CardTitle>
    <CardDescription>Discover your logical reasoning abilities</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Complete engaging puzzles...</p>
  </CardContent>
  <CardFooter>
    <Button>Start Game</Button>
  </CardFooter>
</Card>
```

**Variants:**
- Default: White background, subtle shadow
- Hover: Lift effect (shadow-lg)
- Interactive: Cursor pointer, scale(1.02) on hover
- Disabled: Gray overlay, no interaction

---

### 2.3 Form Components

**Input Field:**
```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="student@example.com"
    aria-describedby="email-error"
  />
  <p id="email-error" className="text-sm text-red-500">
    {error}
  </p>
</div>
```

**Select:**
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select grade" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="8">Grade 8</SelectItem>
    <SelectItem value="9">Grade 9</SelectItem>
    <SelectItem value="10">Grade 10</SelectItem>
  </SelectContent>
</Select>
```

**Checkbox:**
```tsx
import { Checkbox } from '@/components/ui/checkbox';

<div className="flex items-center space-x-2">
  <Checkbox id="consent" onCheckedChange={setConsent} />
  <Label htmlFor="consent">I consent to data processing</Label>
</div>
```

---

### 2.4 Dialog/Modal Component

```tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>View Report</Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Your Assessment Report</DialogTitle>
      <DialogDescription>
        Here are your personalized insights
      </DialogDescription>
    </DialogHeader>
    {/* Report content */}
  </DialogContent>
</Dialog>
```

**Accessibility:**
- Focus trap when open
- Escape key to close
- Click outside to close
- Focus returns to trigger on close

---

### 2.5 Toast/Notification Component

```tsx
import { toast } from '@/components/ui/toast';

// Success
toast({
  title: "Progress saved!",
  description: "Your game progress has been saved.",
  variant: "default"
});

// Error
toast({
  title: "Oops! Something went wrong",
  description: "Please try again in a moment.",
  variant: "destructive"
});

// Loading
const toastId = toast({
  title: "Generating report...",
  description: "This may take a few seconds.",
  duration: Infinity
});

// Dismiss
toast.dismiss(toastId);
```

---

### 2.6 Progress Indicator

```tsx
import { Progress } from '@/components/ui/progress';

<div>
  <div className="flex justify-between mb-2">
    <span className="text-sm">Game Progress</span>
    <span className="text-sm font-semibold">6/10</span>
  </div>
  <Progress value={60} />
</div>
```

---

### 2.7 Avatar Component

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src="/avatars/student.jpg" alt="John Doe" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

**Sizes:**
- sm: 32x32px
- default: 40x40px
- lg: 56x56px
- xl: 80x80px

---

## 3. Layout Structure

### 3.1 Page Layout (Authenticated)

```tsx
<div className="min-h-screen bg-gray-50">
  {/* Header */}
  <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      <Logo />
      <Navigation />
      <UserMenu />
    </div>
  </header>
  
  {/* Main Content */}
  <main className="container mx-auto px-4 py-8">
    <div className="max-w-7xl mx-auto">
      {children}
    </div>
  </main>
  
  {/* Footer (optional) */}
  <footer className="bg-white border-t border-gray-200 mt-auto">
    <div className="container mx-auto px-4 py-6">
      <p className="text-sm text-gray-600 text-center">
        © 2026 Student Assessment Platform
      </p>
    </div>
  </footer>
</div>
```

---

### 3.2 Dashboard Layout

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  {/* Sidebar */}
  <aside className="lg:col-span-3">
    <Card>
      <CardContent className="p-4">
        <ProfileCard />
        <ModeToggle />
        <QuickStats />
      </CardContent>
    </Card>
  </aside>
  
  {/* Main Dashboard */}
  <div className="lg:col-span-9">
    <div className="space-y-6">
      <WelcomeBanner />
      <DailyChallenge />
      <SkillTreePreview />
      <RecentActivity />
    </div>
  </div>
</div>
```

---

### 3.3 Game Layout

```tsx
<div className="fixed inset-0 bg-gray-900 z-50">
  {/* Game Header */}
  <div className="absolute top-0 left-0 right-0 bg-gray-800 p-4 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon">
        <ChevronLeft /> Back
      </Button>
      <h1 className="text-white font-semibold">Pattern Forge</h1>
    </div>
    
    <div className="flex items-center gap-6">
      <div className="text-white text-sm">
        Question 6/10
      </div>
      <div className="text-white text-sm">
        ⏱️ 5:30
      </div>
      <Button variant="outline" size="sm">
        Pause
      </Button>
    </div>
  </div>
  
  {/* Game Canvas */}
  <div className="absolute inset-0 top-16 flex items-center justify-center">
    <div className="max-w-4xl w-full mx-auto p-8">
      <GameCanvas />
    </div>
  </div>
  
  {/* Game Footer */}
  <div className="absolute bottom-0 left-0 right-0 bg-gray-800 p-4">
    <Progress value={60} className="mb-2" />
    <div className="flex justify-between">
      <Button variant="outline">Previous</Button>
      <Button>Next</Button>
    </div>
  </div>
</div>
```

---

## 4. Key Screens & Components

### 4.1 Login Screen

**File:** `app/(auth)/login/page.tsx`

```tsx
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Logo className="mx-auto mb-4" />
          <CardTitle className="text-center text-2xl">Welcome Back!</CardTitle>
          <CardDescription className="text-center">
            Enter your email to receive a login code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader className="mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Login Code'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-gray-600 text-center">
            New here? <Link href="/register" className="text-primary-600 hover:underline">Create an account</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

**Design Notes:**
- Gradient background for visual interest
- Centered card with max-width constraint
- Clear call-to-action
- Loading state for button
- Error handling with toast notifications

---

### 4.2 OTP Verification Screen

**File:** `app/(auth)/verify-otp/page.tsx`

```tsx
export default function VerifyOTPPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Enter Your Code</CardTitle>
          <CardDescription className="text-center">
            We sent a 6-digit code to<br />
            <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <Input
                    key={index}
                    ref={(el) => inputRefs.current[index] = el}
                    type="text"
                    maxLength={1}
                    className="w-12 h-12 text-center text-xl font-semibold"
                    value={otp[index] || ''}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                  />
                ))}
              </div>
              
              <Button type="submit" className="w-full" disabled={otp.length !== 6}>
                Verify Code
              </Button>
              
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleResend}
                  disabled={resendTimer > 0}
                >
                  {resendTimer > 0 
                    ? `Resend code in ${resendTimer}s`
                    : 'Resend code'
                  }
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**UX Enhancements:**
- 6 separate input boxes for OTP digits
- Auto-focus next input on entry
- Backspace moves to previous input
- Resend timer to prevent spam
- Clear visual feedback

---

### 4.3 Student Dashboard

**File:** `app/(student)/dashboard/page.tsx`

```tsx
export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {studentName}! 👋
              </h1>
              <p className="text-primary-100">
                You're on a {streak}-day streak! Keep it going!
              </p>
            </div>
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatar} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>
      
      {/* Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Your Learning Path</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={mode === 'explorer' ? 'default' : 'outline'}
              className="h-24 flex-col"
              onClick={() => setMode('explorer')}
            >
              <Compass className="w-8 h-8 mb-2" />
              <span className="font-semibold">Explorer Mode</span>
              <span className="text-xs text-gray-600">Discover new interests</span>
            </Button>
            <Button
              variant={mode === 'facilitator' ? 'default' : 'outline'}
              className="h-24 flex-col"
              onClick={() => setMode('facilitator')}
            >
              <Target className="w-8 h-8 mb-2" />
              <span className="font-semibold">Facilitator Mode</span>
              <span className="text-xs text-gray-600">Master specific skills</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Daily Challenge or Discovery */}
      {mode === 'facilitator' ? (
        <DailyChallengeCard />
      ) : (
        <DiscoveryQuestsGrid />
      )}
      
      {/* Skill Tree Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Skill Tree</CardTitle>
            <Button variant="ghost" size="sm">
              View Full Tree →
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <SkillTreePreview />
        </CardContent>
      </Card>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 4.4 Skill Tree Visualization

**File:** `components/skill-tree/SkillTree.tsx`

```tsx
export function SkillTree({ data }: { data: SkillTreeData }) {
  return (
    <div className="w-full h-[600px] relative">
      <svg className="w-full h-full">
        {/* Connections between nodes */}
        {connections.map((conn) => (
          <line
            key={`${conn.from}-${conn.to}`}
            x1={nodes[conn.from].x}
            y1={nodes[conn.from].y}
            x2={nodes[conn.to].x}
            y2={nodes[conn.to].y}
            stroke="#e5e7eb"
            strokeWidth="2"
          />
        ))}
        
        {/* Skill nodes */}
        {data.categories.map((category) => (
          <SkillNode
            key={category.category}
            data={category}
            position={getNodePosition(category.category)}
            onClick={() => handleNodeClick(category)}
          />
        ))}
      </svg>
      
      {/* Tooltip on hover */}
      {hoveredNode && (
        <div
          className="absolute bg-white p-4 rounded-lg shadow-lg border border-gray-200"
          style={{ top: tooltipY, left: tooltipX }}
        >
          <h3 className="font-semibold mb-2">{hoveredNode.name}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {getLevelIcon(hoveredNode.level)}
                <span className="ml-1">{hoveredNode.level}</span>
              </div>
              <Badge variant={getTrendVariant(hoveredNode.trend)}>
                {hoveredNode.trend}
              </Badge>
            </div>
            <Progress value={hoveredNode.score} className="h-2" />
            <p className="text-gray-600 mt-2">
              Evidence: {hoveredNode.evidence.length} data points
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SkillNode({ data, position, onClick }: SkillNodeProps) {
  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onClick={onClick}
      className="cursor-pointer hover:scale-110 transition-transform"
    >
      {/* Node circle */}
      <circle
        r="40"
        fill={getCategoryColor(data.category)}
        fillOpacity="0.2"
        stroke={getCategoryColor(data.category)}
        strokeWidth="3"
      />
      
      {/* Level icon */}
      <text
        textAnchor="middle"
        dy=".3em"
        fontSize="24"
      >
        {getLevelIcon(data.level)}
      </text>
      
      {/* Category label */}
      <text
        textAnchor="middle"
        y="55"
        fontSize="12"
        fill="#374151"
        fontWeight="500"
      >
        {data.name}
      </text>
      
      {/* Score */}
      <text
        textAnchor="middle"
        y="70"
        fontSize="10"
        fill="#6b7280"
      >
        {data.score}/100
      </text>
    </g>
  );
}
```

**Visual Design:**
- Tree layout with root at center
- Color-coded nodes by category
- Animated transitions when scores update
- Interactive hover states
- Tooltip with detailed info

---

### 4.5 Behavioral Timeline

**File:** `components/timeline/BehavioralTimeline.tsx`

```tsx
export function BehavioralTimeline({ events }: { events: BehavioralEvent[] }) {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
      
      {/* Events */}
      <div className="space-y-8">
        {events.map((event, index) => (
          <div key={event.id} className="relative pl-16">
            {/* Timeline dot */}
            <div className={cn(
              "absolute left-6 w-5 h-5 rounded-full border-4 border-white",
              getEventColor(event.eventType)
            )} />
            
            {/* Event card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getEventIcon(event.eventType)}
                    <CardTitle className="text-base">{event.context}</CardTitle>
                  </div>
                  <time className="text-sm text-gray-600">
                    {formatDate(event.timestamp)}
                  </time>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">{event.studentChoice}</p>
                
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Values Reflected
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {event.aiAnalysis.valuesReflected.map((value) => (
                          <Badge key={value} variant="secondary">
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Growth Indicator
                      </p>
                      <p className="text-sm text-gray-700">
                        {event.aiAnalysis.growthIndicator}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Design Features:**
- Vertical timeline with clear visual progression
- Color-coded event types
- AI insights highlighted in separate section
- Chronological ordering (newest first)
- Privacy indicator (lock icon if private)

---

### 4.6 Game Screen Components

**Pattern Forge Example:**

```tsx
export function PatternForgeGame() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Question Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Complete the Pattern
        </h2>
        <p className="text-gray-300">
          Choose the next number in the sequence
        </p>
      </div>
      
      {/* Pattern Display */}
      <div className="bg-white rounded-xl p-8 mb-6">
        <div className="flex items-center justify-center gap-4">
          {pattern.map((item, index) => (
            <div
              key={index}
              className="w-20 h-20 flex items-center justify-center bg-primary-100 rounded-lg text-2xl font-bold text-primary-700"
            >
              {item === '?' ? (
                <HelpCircle className="w-8 h-8" />
              ) : (
                item
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Answer Options */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => (
          <Button
            key={option}
            variant="outline"
            className={cn(
              "h-20 text-xl font-semibold bg-white hover:bg-primary-50",
              selectedAnswer === option && "bg-primary-500 text-white hover:bg-primary-600"
            )}
            onClick={() => handleAnswer(option)}
          >
            {option}
          </Button>
        ))}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" disabled={currentQuestion === 0}>
          <ChevronLeft className="mr-2" />
          Previous
        </Button>
        <Button onClick={handleNext}>
          {currentQuestion === totalQuestions - 1 ? 'Submit' : 'Next'}
          <ChevronRight className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
```

---

### 4.7 AI Report Display

**File:** `components/reports/AIReport.tsx`

```tsx
export function AIReportDisplay({ report }: { report: AIReport }) {
  return (
    <div className="space-y-6">
      {/* Celebratory Header */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Assessment Complete!</h2>
          </div>
          <p className="text-green-50 text-lg">
            {report.studentInsights.celebratoryMessage}
          </p>
        </CardContent>
      </Card>
      
      {/* Strengths */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <CardTitle>Your Strengths</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">
            {report.studentInsights.strengths}
          </p>
        </CardContent>
      </Card>
      
      {/* Growth Areas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <CardTitle>Growth Opportunities</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed mb-4">
            {report.studentInsights.growthAreas}
          </p>
        </CardContent>
      </Card>
      
      {/* Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-500" />
            <CardTitle>Next Steps</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {report.studentInsights.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-primary-700">
                    {index + 1}
                  </span>
                </div>
                <p className="text-gray-700">{rec}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      {/* Share Options */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1">
          <Download className="mr-2" />
          Download PDF
        </Button>
        <Button variant="outline" className="flex-1">
          <Share className="mr-2" />
          Share with Parent
        </Button>
      </div>
    </div>
  );
}
```

---

### 4.8 Parent Dashboard

**File:** `app/(parent)/dashboard/page.tsx`

```tsx
export default function ParentDashboard() {
  return (
    <div className="space-y-6">
      {/* Children List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Children</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((child) => (
              <Card key={child.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={child.avatar} />
                      <AvatarFallback>{child.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{child.name}</h3>
                      <p className="text-sm text-gray-600">
                        Grade {child.grade} • Section {child.section}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={child.assessmentComplete ? "success" : "secondary"}>
                          {child.assessmentComplete ? "Assessment Complete" : "In Progress"}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Consent Management */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy & Consent</CardTitle>
          <CardDescription>
            Manage data sharing preferences for your children
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConsentManagementPanel />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 5. Responsive Design Breakpoints

### 5.1 Breakpoint System

```css
/* Tailwind CSS breakpoints */
--screen-sm: 640px;   /* Small devices (phones) */
--screen-md: 768px;   /* Medium devices (tablets) */
--screen-lg: 1024px;  /* Large devices (laptops) */
--screen-xl: 1280px;  /* Extra large devices (desktops) */
--screen-2xl: 1536px; /* 2X large devices (large desktops) */
```

### 5.2 Responsive Layout Rules

**Mobile First Approach:**

```tsx
// Always design for mobile first, then enhance for larger screens
<div className="
  grid 
  grid-cols-1           // 1 column on mobile
  md:grid-cols-2        // 2 columns on tablets
  lg:grid-cols-3        // 3 columns on desktops
  gap-4
">
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</div>
```

**Navigation:**
- Mobile: Hamburger menu
- Tablet+: Horizontal navigation bar

**Typography:**
- Mobile: Reduce font sizes by 10-15%
- Desktop: Use design system sizes

**Spacing:**
- Mobile: Reduce padding/margins by 25%
- Desktop: Full spacing

---

## 6. Accessibility Requirements

### 6.1 WCAG 2.1 Level AA Compliance

**Color Contrast:**
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- Interactive elements: 3:1 minimum

**Keyboard Navigation:**
- All interactive elements must be keyboard accessible
- Visible focus indicators (2px outline)
- Logical tab order
- Skip to main content link

**Screen Reader Support:**
```tsx
// Use semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

// Provide alt text for images
<img src="/avatar.jpg" alt="Student profile picture" />

// Use ARIA labels when necessary
<Button aria-label="Close dialog">
  <X className="w-4 h-4" />
</Button>

// Announce dynamic content changes
<div role="status" aria-live="polite">
  {successMessage}
</div>
```

**Form Accessibility:**
```tsx
<div>
  <Label htmlFor="email">Email Address</Label>
  <Input
    id="email"
    type="email"
    aria-describedby="email-hint email-error"
    aria-invalid={!!error}
    required
  />
  <p id="email-hint" className="text-sm text-gray-600">
    We'll send your login code here
  </p>
  {error && (
    <p id="email-error" className="text-sm text-red-600" role="alert">
      {error}
    </p>
  )}
</div>
```

---

### 6.2 Focus Management

```tsx
// Trap focus in modals
import { useFocusTrap } from '@/hooks/useFocusTrap';

function Modal({ isOpen, onClose, children }) {
  const focusTrapRef = useFocusTrap(isOpen);
  
  return (
    <div ref={focusTrapRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

---

### 6.3 Motion Preferences

```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// In React components
const prefersReducedMotion = useReducedMotion();

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ 
    duration: prefersReducedMotion ? 0 : 0.3 
  }}
>
  {children}
</motion.div>
```

---

## 7. Animation Guidelines

### 7.1 Micro-interactions

**Button Hover:**
```tsx
<Button className="
  transition-all duration-200
  hover:scale-105 hover:shadow-lg
  active:scale-95
">
  Click Me
</Button>
```

**Card Hover:**
```tsx
<Card className="
  transition-all duration-300
  hover:-translate-y-1 hover:shadow-xl
  cursor-pointer
">
  {content}
</Card>
```

**Loading Spinner:**
```tsx
<div className="
  w-8 h-8 border-4 border-primary-200 border-t-primary-600
  rounded-full animate-spin
" />
```

---

### 7.2 Page Transitions

```tsx
// Using Framer Motion
import { motion } from 'framer-motion';

export default function Page() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page content */}
    </motion.div>
  );
}
```

---

### 7.3 Skill Tree Animations

```tsx
// Celebrate skill level up
<motion.div
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{
    type: "spring",
    stiffness: 260,
    damping: 20
  }}
>
  <SkillNode {...props} />
</motion.div>

// Confetti effect on milestone
import Confetti from 'react-confetti';

{showConfetti && (
  <Confetti
    width={windowWidth}
    height={windowHeight}
    recycle={false}
    numberOfPieces={200}
  />
)}
```

---

## 8. Loading States

### 8.1 Skeleton Loaders

```tsx
export function SkillTreeSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}
```

---

### 8.2 Progressive Loading

```tsx
// Show partial content while loading
export function Dashboard() {
  const { data: student, isLoading: studentLoading } = useStudent();
  const { data: skillTree, isLoading: skillTreeLoading } = useSkillTree();
  
  return (
    <div className="space-y-6">
      {/* Show header immediately */}
      <WelcomeBanner name={student?.name} />
      
      {/* Show skeleton while loading */}
      {skillTreeLoading ? (
        <SkillTreeSkeleton />
      ) : (
        <SkillTree data={skillTree} />
      )}
    </div>
  );
}
```

---

## 9. Empty States

### 9.1 No Data States

```tsx
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Usage
<EmptyState
  icon={BookOpen}
  title="No activities yet"
  description="Start your first activity to begin your learning journey"
  action={{
    label: "Explore Activities",
    onClick: () => router.push('/activities')
  }}
/>
```

---

## 10. Error States

### 10.1 Error Messages

```tsx
export function ErrorMessage({ error, retry }: ErrorMessageProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">
              Something went wrong
            </h3>
            <p className="text-sm text-red-700 mb-4">
              {error.message}
            </p>
            {retry && (
              <Button variant="outline" size="sm" onClick={retry}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 11. Mobile-Specific Considerations

### 11.1 Touch Targets

- Minimum size: 44x44px
- Spacing between targets: 8px minimum
- Avoid hover-only interactions

### 11.2 Mobile Navigation

```tsx
// Bottom navigation for mobile
export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around h-16">
        <NavItem icon={Home} label="Home" href="/dashboard" />
        <NavItem icon={Compass} label="Explore" href="/explore" />
        <NavItem icon={User} label="Profile" href="/profile" />
      </div>
    </nav>
  );
}
```

### 11.3 Swipe Gestures

```tsx
// Use react-swipeable for swipe gestures
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: () => goToNextQuestion(),
  onSwipedRight: () => goToPreviousQuestion(),
  trackMouse: true
});

<div {...handlers}>
  {/* Game content */}
</div>
```

---

## 12. Performance Optimization

### 12.1 Image Optimization

```tsx
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/avatar.jpg"
  alt="Student avatar"
  width={80}
  height={80}
  placeholder="blur"
  blurDataURL="data:image/..." // Low-quality placeholder
/>
```

### 12.2 Code Splitting

```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic';

const SkillTreeVisualization = dynamic(
  () => import('@/components/skill-tree/SkillTree'),
  { 
    loading: () => <SkillTreeSkeleton />,
    ssr: false // Don't render on server
  }
);
```

---

## 13. Dark Mode (Future Enhancement)

### 13.1 Color System for Dark Mode

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

---

## 14. Cursor Implementation Checklist

### 14.1 Setup Tasks

- [ ] Install shadcn/ui components: `npx shadcn-ui@latest add button card input select dialog toast progress avatar badge`
- [ ] Configure Tailwind CSS with design tokens
- [ ] Set up Framer Motion for animations
- [ ] Install chart libraries: `npm install recharts`
- [ ] Set up custom fonts (Inter, Cal Sans)

### 14.2 Component Implementation Order

1. **Week 1:** Base components (Button, Card, Input, etc.)
2. **Week 2:** Layout components (Header, Footer, Navigation)
3. **Week 3:** Auth screens (Login, OTP Verification)
4. **Week 4:** Dashboard layouts (Student, Parent, Teacher)
5. **Week 5:** Game components (Game Engine, Controls)
6. **Week 6:** Visualization components (Skill Tree, Timeline)
7. **Week 7-8:** Forms and data entry
8. **Week 9-10:** Polish and animations
9. **Week 11-12:** Accessibility and testing

---

## 15. Design Tokens Export

```typescript
// lib/design-tokens.ts
export const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      // ... full palette
    },
    // ... other colors
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    // ... full scale
  },
  typography: {
    fonts: {
      primary: 'Inter, sans-serif',
      // ...
    },
    sizes: {
      xs: '0.75rem',
      // ...
    }
  },
  // ... other tokens
};
```

---

## End of UI/UX Design Specifications

This document should be used alongside the Figma designs (when available) and updated as the design system evolves. All components should be tested for accessibility and responsiveness before deployment.