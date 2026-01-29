# Teacher Portal Implementation

## Overview

Complete Teacher Portal with role-based routing, class monitoring, assignment creation, smart groups, and Class Focus priorities.

## A) Route Conflict Resolution ✅

### Solution: Distinct Paths
- **Student Settings**: `/settings` (remains at `(student)/settings/page.tsx`)
- **Teacher Settings**: `/teacher/settings` (moved to `(teacher)/teacher/settings/page.tsx`)

### Navigation Updates
- `UserMenu.tsx` now routes based on role:
  - Teachers → `/teacher/settings`
  - Students/Parents → `/settings`

### Verification
- ✅ No route conflicts in build
- ✅ Role-based routing works correctly
- ✅ Layouts and guards intact

## B) Class Focus Integration ✅

### Implementation

**File: `lib/class-focus-prioritization.ts`**
- `getActiveClassFocus()` - Fetches active Class Focus profile
- `applyClassFocusBoost()` - Applies boost (capped at 0.20 per skill)
- `calculatePriorityBreakdown()` - For debugging
- `debugClassFocusPrioritization()` - Debug logging when `DEBUG_CLASS_FOCUS=true`

**File: `lib/assignment-quest-selection.ts`**
- `selectQuestsForAssignment()` - Main quest selection function
- Formula: `FinalPriority = BasePriority * (1 + ClassFocusBoost)`
- BasePriority = `Σ(emphasisWeight * (100 - studentScore))`
- ClassFocusBoost = `priorityBoosts[skill]` (capped at 0.20)

**File: `app/api/teacher/assignments/[assignmentId]/recommend-quests/route.ts`**
- API endpoint to get recommended quests for an assignment
- Includes Class Focus integration
- Returns debug breakdown when `DEBUG_CLASS_FOCUS=true`

### Guardrails
- ✅ Boosts are additive and capped (max +0.20 per skill)
- ✅ Grade filtering always applied first (never overridden)
- ✅ Hard constraints (availability/eligibility) never overridden

### Testing

**Unit Test: `__tests__/class-focus-prioritization.test.ts`**
- Verifies boost application
- Verifies 0.20 cap
- Verifies no boost for non-focused skills
- Verifies priority breakdown calculation

**Debug Logging:**
Set `DEBUG_CLASS_FOCUS=true` in `.env` to see:
- Top 5 selected quests
- Base priority vs final priority
- Class Focus boost percentage
- Skill affected

## C) Grade-Aware Filtering ✅

### ClassSection Model

```prisma
model ClassSection {
  id                String   @id
  tenantId          String
  name              String   // e.g., "8A", "9B"
  grade             Int      // 8, 9, or 10
  teacherId         String
  academicYearStart DateTime
  academicYearEnd   DateTime
  isActive          Boolean
}
```

### Teacher API Filtering

All teacher APIs now filter by:
1. **ClassSection membership**: `classSectionId == teacher's active section`
2. **Current grade**: `currentGrade == ClassSection.grade`
3. **Grade at attempt**: `gradeAtTimeOfAttempt == ClassSection.grade`

**Updated APIs:**
- `GET /api/teacher/class-signals` - Filters students and attempts by ClassSection grade
- `GET /api/teacher/students` - Only shows students in teacher's ClassSection
- `GET /api/teacher/students/:studentId` - Verifies student belongs to section, filters attempts
- `GET /api/teacher/groups` - Smart groups only from ClassSection students
- `POST /api/teacher/assignments` - Class targeting uses ClassSection students

### Developer Note: Future History Toggle

See `TEACHER_PORTAL_GRADE_FILTERING.md` for implementation guide.

To add history toggle:
1. Add optional query params: `grade?: 8|9|10`, `includeHistory?: boolean`
2. Modify where clauses conditionally
3. Add UI toggle in teacher dashboard
4. Display grade badge on attempts

## Manual Test Steps

### 1. Route Testing
```bash
# As Student
1. Login as student
2. Navigate to /settings
3. Verify student settings page loads
4. Verify no teacher layout visible

# As Teacher
1. Login as teacher
2. Navigate to /teacher/settings
3. Verify teacher settings page loads
4. Verify no student layout visible
```

### 2. Class Focus Integration
```bash
# Setup
1. Login as teacher
2. Go to /teacher/settings
3. Apply "Exam Focus" preset (boosts Planning, Attention, Reasoning)
4. Save Class Focus

# Create Assignment
5. Go to /teacher/assign
6. Create assignment targeting entire class
7. Set quest types: mini_game, reflection, choice_scenario
8. Set quest count: 4

# Verify Quest Selection
9. Set DEBUG_CLASS_FOCUS=true in .env
10. Call GET /api/teacher/assignments/{assignmentId}/recommend-quests?studentId={id}
11. Check server logs for debug output
12. Verify quests with Planning/Attention/Reasoning have higher priority
```

### 3. Grade-Aware Filtering
```bash
# Setup ClassSection
1. Create ClassSection for teacher (Grade 9)
2. Assign students to ClassSection
3. Ensure students have currentGrade = 9

# Test Dashboard
4. Login as teacher
5. Go to /teacher
6. Verify only Grade 9 students shown
7. Verify class signals computed from Grade 9 attempts only

# Test Student Drilldown
8. Click on a student
9. Verify only Grade 9 attempts shown
10. Verify no attempts from other grades visible

# Test Smart Groups
11. Go to /teacher/groups
12. Verify smart groups only include Grade 9 students
13. Verify groups computed from Grade 9 attempts only
```

## Files Created/Updated

### New Files
- `app/(teacher)/layout.tsx` - Teacher portal layout with role guards
- `app/(teacher)/page.tsx` - Teacher dashboard
- `app/(teacher)/students/[studentId]/page.tsx` - Student drilldown
- `app/(teacher)/assign/page.tsx` - Assignment builder
- `app/(teacher)/groups/page.tsx` - Groups view
- `app/(teacher)/teacher/settings/page.tsx` - Class Focus settings
- `app/api/teacher/class-signals/route.ts` - Class signals API
- `app/api/teacher/students/route.ts` - Students list API
- `app/api/teacher/students/[studentId]/route.ts` - Student report API
- `app/api/teacher/assignments/route.ts` - Assignment creation API
- `app/api/teacher/assignments/[assignmentId]/recommend-quests/route.ts` - Quest recommendations API
- `app/api/teacher/groups/route.ts` - Groups API
- `app/api/teacher/class-focus/route.ts` - Class Focus API
- `lib/class-focus-prioritization.ts` - Class Focus utilities
- `lib/assignment-quest-selection.ts` - Assignment quest selection with Class Focus
- `components/ui/slider.tsx` - Slider component
- `__tests__/class-focus-prioritization.test.ts` - Unit tests
- `TEACHER_PORTAL_GRADE_FILTERING.md` - Developer documentation

### Updated Files
- `prisma/schema.prisma` - Added ClassSection, ClassFocusProfile, StudentGroup, Assignment models
- `components/UserMenu.tsx` - Role-based settings routing
- `app/api/explorer/today/route.ts` - Placeholder for Class Focus (student-driven quests don't use it)

## Key Features

1. **Teacher Dashboard**
   - Class Signals (3-6 insights)
   - Student overview table
   - Quick actions

2. **Student Drilldown**
   - Brief actionable report
   - Top strengths + strengthening areas
   - Trend highlights
   - Recent activity
   - Recommended classroom actions

3. **Assignment Builder**
   - Target: Class, Group, or Individual
   - Quest count, types, grade scope
   - Intent selector
   - Class Focus integration (via quest recommendations API)

4. **Smart Groups**
   - Auto-generated: Low Engagement, Needs Planning Support, Strong Creativity Cluster
   - Manual groups support

5. **Class Focus Priorities**
   - Skill priority boosts (0-20% per skill)
   - Presets: Exam Focus, Project Mode, Values Focus
   - Focus window (week/month/custom)
   - Grade scope filtering

6. **Grade-Aware Filtering**
   - All teacher APIs filter by ClassSection grade
   - Only current grade attempts shown
   - No grade selector UI (MVP)

## Safety & Constraints

- ✅ No peer ranking or leaderboards
- ✅ No psychological labels
- ✅ Short, actionable narratives
- ✅ Grade filtering never overridden by Class Focus
- ✅ Boosts capped at 20% per skill
- ✅ Backend-only filtering (no UI grade selector)

## D) Teacher Settings Implementation ✅

### Data Models

**TeacherProfile** (`prisma/schema.prisma`):
- `teacherId` (FK to User)
- `displayName`
- `avatarUrl` (optional)
- `phone` (optional)
- `subjectsTaught` (string[])
- `roleLabel` (optional)

**TeacherSettings** (`prisma/schema.prisma`):
- `teacherId` (FK to User)
- `assignmentDefaults` (JSON): defaultDueDays, defaultQuestCount, defaultQuestTypes, defaultIntent
- `notificationPrefs` (JSON): emailEnabled, inAppEnabled, alertInactiveDays, alertOverdueAssignments, alertEngagementDrop, alertGroupGrowthThreshold
- `reportPrefs` (JSON): defaultTimeRange, weeklySummaryEmail, defaultLanding
- `privacyPrefs` (JSON): hideCharacterValuesInsights, showOnlyBriefSummaries, disableSensitiveNarratives

### API Endpoints

**GET /api/teacher/settings**
- Returns teacher profile, settings, and user info
- Provides defaults if no settings exist

**PUT /api/teacher/settings**
- Updates teacher profile and/or settings
- Supports partial updates (only send fields to update)
- Validates with Zod schemas

### Settings UI Tabs

**1. Profile Tab**
- Display name, phone, role label
- Subjects taught (add/remove)
- Avatar display
- Save button with optimistic UI

**2. Class Focus Tab**
- Reuses existing Class Focus UI
- Skill priority boosts (0-20%)
- Presets (Exam Focus, Project Mode, Values Focus)
- Focus window and grade scope

**3. Assignment Defaults Tab**
- Default due days (3/5/7/14)
- Default quest count (1-10 slider)
- Default quest types (checkboxes)
- Default intent selector
- **Integration**: Pre-fills `/teacher/assign` form

**4. Notifications Tab**
- Email/in-app toggles
- Alert thresholds (inactive days, overdue assignments, engagement drop, group growth)
- All preferences persist

**5. Reports Tab**
- Default time range (7d/30d)
- Weekly summary email toggle
- Dashboard default landing (overview/signals)
- Export buttons (placeholder, disabled)

**6. Privacy Tab**
- Show only brief summaries (default: ON)
- Hide character & values insights
- Disable sensitive narratives (default: ON, locked)
- Clear explanation of teacher-safe guardrails

**7. Support Tab**
- Report bug / Send feedback (modal)
- View help docs (placeholder)
- App version/build info
- Logout button

### Key Features

- ✅ All settings persist to database
- ✅ Assignment defaults automatically pre-fill assignment builder
- ✅ Privacy settings ensure teacher-safe content only
- ✅ Responsive design with shadcn/ui components
- ✅ Success/error message notifications
- ✅ Optimistic UI updates

### Files Created/Updated

**New Files:**
- `app/api/teacher/settings/route.ts` - Settings API
- Updated `app/(teacher)/teacher/settings/page.tsx` - Comprehensive tabbed settings UI

**Updated Files:**
- `prisma/schema.prisma` - Added TeacherProfile and TeacherSettings models
- `app/(teacher)/teacher/assign/page.tsx` - Pre-fills with assignment defaults

### Manual Test Steps

1. **Settings Access**
   - Login as teacher
   - Navigate to `/teacher/settings`
   - Verify all 7 tabs are visible and functional

2. **Profile Tab**
   - Update display name, phone, role label
   - Add/remove subjects
   - Save and verify persistence
   - Refresh page and verify data loads

3. **Assignment Defaults Integration**
   - Set default due days: 5
   - Set default quest count: 3
   - Set default quest types: mini_game, reflection
   - Set default intent: IMPROVE_FOCUS
   - Save settings
   - Navigate to `/teacher/assign`
   - Verify form is pre-filled with defaults

4. **Notifications Tab**
   - Toggle email/in-app notifications
   - Set alert thresholds
   - Save and verify persistence

5. **Reports Tab**
   - Change default time range
   - Toggle weekly summary email
   - Change dashboard landing
   - Save and verify persistence

6. **Privacy Tab**
   - Toggle privacy preferences
   - Verify "Disable Sensitive Narratives" is locked ON
   - Save and verify persistence

7. **Support Tab**
   - Submit feedback via modal
   - Verify app version is displayed
   - Test logout functionality

