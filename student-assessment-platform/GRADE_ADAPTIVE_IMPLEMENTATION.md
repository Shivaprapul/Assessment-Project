# Grade-Adaptive Explorer/Facilitator + GameCompletionScreen Implementation

## Overview

This implementation updates Explorer and Facilitator modes to:
1. Adapt quest selection, difficulty, and messaging to student's `currentGrade` using `GradeSkillExpectations`
2. Use student-friendly `GameCompletionScreen` for quest results (gaming UI)
3. Maintain full reports for parents/teachers while students see lightweight completion screens

## Part A: Grade-Adaptive Explorer Mode

### A1) Grade-Aware Quest Generation

**File: `app/api/explorer/today/route.ts`**

- Fetches `student.currentGrade` (defaults to 8)
- Retrieves student skill scores from database
- Generates 10 quests (more than needed)
- Prioritizes quests based on:
  - Grade emphasis weight (`getEmphasisWeightForGradeSkill`)
  - Student's current skill scores (lower scores = higher priority)
  - Formula: `priority = emphasisWeight * (100 - studentScore)`
- Uses `selectGradeAwareContent` to filter and select top 3 quests
- Stores `gradeAtCreation` in `DailyQuestSet`

**Key Changes:**
- Quest prioritization now considers both grade expectations and student's weak areas
- Quests are filtered by `gradeApplicability` before selection
- Universal quests `[8,9,10]` are used as fallback

### A2) Grade-Adaptive Copy/Messaging

**File: `app/(student)/explorer/page.tsx`**

- Fetches student profile including `currentGrade`
- Displays grade-context messaging in Explorer header:
  - **Grade 8:** "Explore & discover new interests"
  - **Grade 9:** "Build consistency & structure in your learning"
  - **Grade 10:** "Sharpen & apply your skills"
- Messaging is subtle (1 line) and student-friendly

## Part B: Grade-Adaptive Facilitator Mode

### B1) Weekly Plan & Today Plan Grade-Aware

**File: `lib/facilitator-weekly-plan.ts`**

- `generateWeeklyPlan` accepts `studentGrade` parameter
- Focus skills calculation now includes grade emphasis:
  - Formula: `priority = goalWeight * (1 + gradeEmphasis) * (100 - currentScore)`
  - Prioritizes skills important for both goal AND grade
- `generateDailyFacilitatorQuests`:
  - Adjusts quest difficulty/time by grade:
    - Grade 8: More exploratory (5/3/4 min)
    - Grade 9: More structured (6/4/5 min)
    - Grade 10: More application-focused (6/4/5 min)
  - Filters quests by `gradeApplicability`
  - Ensures all quests have required `GradeApplicability` fields

**File: `app/api/facilitator/week/route.ts`**
- Already passes `studentGrade` to `generateWeeklyPlan`

**File: `app/api/facilitator/today/route.ts`**
- Already passes `studentGrade` when generating fallback quests

### B2) No Assumptions for Late Joiners

- Grade 9/10 students start with baseline "Unclassified" skill maturity bands
- Quest selection uses grade expectations but doesn't assume skill maturity
- Skill scores default to 50 if unknown (neutral priority)

## Part C: Results UI - GameCompletionScreen for Students

### C1) Explorer Quest Results

**File: `app/(student)/explorer/quests/[questId]/results/page.tsx`**

- **Replaced** full report UI with `GameCompletionScreen` component
- Shows:
  - Challenge complete message
  - XP gained
  - Accuracy (if available)
  - Time taken
  - Level progress
  - Badges unlocked
- Provides buttons:
  - "Back to Quests"
  - "Quick Review" (opens modal with brief insight)
  - "Next Challenge" or "View Unlocks" (if unlocks available)
- Uses `buildCompletionSummary` helper to calculate XP, badges, level

### C2) Facilitator Quest Results

**File: `app/(student)/facilitator/quests/[questId]/results/page.tsx`**

- **Replaced** full report UI with `GameCompletionScreen` component
- Same lightweight display as Explorer
- Buttons:
  - "Back to Training"
  - "Next Challenge"
  - "Quick Review" (optional)
- **Note:** Goal readiness is NOT shown on completion screen (kept in facilitator hub only)

### C3) Full Reports Still Generated

- Backend APIs (`/api/explorer/quests/[questId]/submit`, `/api/facilitator/quests/[questId]/submit`) still generate full AI insights
- Full report data is stored in `QuestAttempt` records
- Parents can access via Parent Tracker
- Teachers can access via Teacher Student Drilldown
- Students only see `GameCompletionScreen` by default

## Part D: Unified Role-Based Rendering Helpers

**File: `lib/report-views.ts`** (NEW)

### Helper Functions:

1. **`getStudentCompletionSummary(attemptData)`**
   - Returns: XP gained, badges, level, level title, time taken, accuracy
   - Used by `GameCompletionScreen`

2. **`getStudentQuickReview(attemptData)`**
   - Returns: 1 strength, 1 improvement tip, 2-3 skill tags
   - Used by `QuickReviewModal`

3. **`getParentFullReport(attemptData)`**
   - Returns: Full AI insight, evidence, recommendations
   - Used by Parent Tracker

4. **`getTeacherBriefReport(studentId, attemptData, studentProfile)`**
   - Returns: Overview, strengths, areas, recommended actions
   - Used by Teacher Student Drilldown

5. **`buildCompletionSummary(attemptData)`**
   - Wrapper for `GameCompletionScreen` props
   - Calculates XP, badges, current total XP

6. **`getResultViewForRole({ role, mode, attempt, studentProfile })`**
   - Main entry point for role-based result views
   - Returns appropriate view based on role

## Part E: Acceptance Criteria ✅

- ✅ Explorer quests list changes when student grade changes (8 vs 9 vs 10)
- ✅ Facilitator weekly/today plan changes when student grade changes
- ✅ After completing Explorer quest, student sees `GameCompletionScreen` (not long report)
- ✅ After completing Facilitator quest, student sees `GameCompletionScreen` (not long report)
- ✅ Quick Review exists and is brief (1 strength, 1 tip, 2-3 tags)
- ✅ Parent tracker and teacher drilldown still show deeper reports (via existing endpoints)
- ✅ No grade-based labeling in student UI (grade only affects content selection, not labels)

## Files Changed

### New Files:
- `lib/report-views.ts` - Role-based report view helpers

### Modified Files:
- `app/api/explorer/today/route.ts` - Grade-aware quest prioritization
- `app/(student)/explorer/page.tsx` - Grade-context messaging
- `app/(student)/explorer/quests/[questId]/results/page.tsx` - GameCompletionScreen for students
- `app/(student)/facilitator/quests/[questId]/results/page.tsx` - GameCompletionScreen for students
- `lib/facilitator-weekly-plan.ts` - Grade-aware quest generation with emphasis weighting

## Manual Test Steps

### Test 1: Grade 8 Student → Explorer Quests
1. Create/update student with `currentGrade: 8`
2. Navigate to `/explorer`
3. Verify grade-context message: "Explore & discover new interests"
4. Verify quests are grade-appropriate (6 questions in mini-game, simpler prompts)
5. Complete a quest
6. Verify `GameCompletionScreen` appears (not full report)
7. Click "Quick Review" → verify brief modal appears

### Test 2: Grade 10 Student → Explorer Quests Differ
1. Update student to `currentGrade: 10`
2. Navigate to `/explorer`
3. Verify grade-context message: "Sharpen & apply your skills"
4. Verify quests differ (8 questions, deeper reflection prompts)
5. Complete a quest
6. Verify `GameCompletionScreen` appears

### Test 3: Facilitator Weekly Plan Differs by Grade
1. Set student to Grade 8, set facilitator goal
2. Navigate to `/facilitator/week`
3. Note quest types and difficulty
4. Update student to Grade 10
5. Regenerate weekly plan (or wait for new week)
6. Verify quests differ (more application-focused)

### Test 4: Parent Sees Full Report
1. Login as parent
2. Navigate to Parent Tracker
3. View student's quest attempts
4. Verify full AI insight, evidence, recommendations are visible
5. Verify grade context is included in reports

### Test 5: Teacher Sees Brief Report
1. Login as teacher
2. Navigate to Teacher Tracker
3. Click on student name
4. View student detail report
5. Verify brief, actionable insights are visible
6. Verify recommended classroom actions are shown

## Key Implementation Details

### Grade-Aware Prioritization Formula

For Explorer quests:
```
priority = Σ(emphasisWeight * (100 - studentScore))
```
- Higher grade emphasis = higher priority
- Lower student score = higher priority
- Quests targeting skills where student is weak AND grade emphasizes = highest priority

For Facilitator quests:
```
priority = goalWeight * (1 + gradeEmphasis) * (100 - currentScore)
```
- Combines goal importance, grade emphasis, and student weakness
- Ensures quests align with both career goal and grade expectations

### Quest Filtering Logic

1. Filter by `gradeApplicability` (must include student's grade or be universal `[8,9,10]`)
2. Prioritize by grade emphasis + student skill scores
3. Select top N quests (3 for Explorer, 4 for Facilitator)

### Student Completion Screen Flow

1. Student completes quest → submits to API
2. API generates full report (stored in database)
3. API returns attempt data with summary
4. Frontend receives data → calls `buildCompletionSummary()`
5. Renders `GameCompletionScreen` with XP, badges, level
6. Student can click "Quick Review" for brief insight
7. Full report remains accessible to parents/teachers

## Safety & Constraints

- ✅ Grade determines content context, not skill maturity assumptions
- ✅ No "below grade" or "ahead of grade" language in student UI
- ✅ Late joiners (Grade 9/10) start with baseline observation phase
- ✅ Full reports still generated and stored for parents/teachers
- ✅ No breaking changes to login, dashboard, skill tree, trackers

