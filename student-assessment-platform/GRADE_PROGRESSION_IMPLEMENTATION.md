# Grade-Based Progression System Implementation

## Overview
This document tracks the implementation of a grade-based progression system for 8th, 9th, and 10th standard students, where curriculum adapts by grade while preserving all historical data.

## Status: In Progress

### ✅ Completed
1. **Database Schema**
   - Added `currentGrade` field to `StudentProfile` (defaults to 8)
   - Created `GradeJourney` model to track grade progression
   - Added `gradeAtTimeOfAttempt` to `AssessmentAttempt` and `QuestAttempt`
   - Added `gradeAtCreation` to `DailyQuestSet`
   - Migration created and applied

2. **Grade Utilities**
   - Created `lib/grade-utils.ts` with:
     - Grade validation functions
     - Grade-specific curriculum focus
     - Career messaging by grade
     - Content filtering by grade
     - Difficulty adjustment by grade

3. **Grade Upgrade API**
   - Created `/api/students/me/grade` (GET/POST)
   - GET: Returns current grade, next grade, and journey history
   - POST: Handles grade upgrade with:
     - Closing current grade journey
     - Creating summary snapshot
     - Creating new grade journey
     - Updating student profile

4. **API Updates**
   - Updated `/api/students/me` to include `currentGrade` in response

### 🚧 In Progress
1. **Profile Page Enhancements**
   - Add "My Journey" section showing grade history
   - Add grade upgrade UI/CTA
   - Display current grade prominently

### ⏳ Pending
1. **Onboarding**
   - Add grade selection during profile creation
   - Create initial GradeJourney on profile creation

2. **Grade-Aware Content**
   - Update quest generation to filter by grade
   - Update assessment generation to use currentGrade
   - Tag attempts with gradeAtTimeOfAttempt

3. **Explorer/Facilitator Integration**
   - Adapt quest difficulty/content by grade
   - Update career messaging by grade
   - Adjust goal readiness calculations

4. **Parent/Teacher Views**
   - Add grade-wise report filtering
   - Show grade history in parent tracker
   - Teacher view shows current grade only

## Database Changes

### New Model: GradeJourney
```prisma
model GradeJourney {
  id               String         @id @default(uuid())
  studentId        String
  grade            Int            // 8, 9, or 10
  startDate        DateTime       @default(now())
  endDate          DateTime?      // Null if active
  completionStatus GradeStatus    @default(IN_PROGRESS)
  summarySnapshot  Json           @default("{}")
  ...
}
```

### Updated Models
- `StudentProfile`: Added `currentGrade` (Int, default 8)
- `AssessmentAttempt`: Added `gradeAtTimeOfAttempt` (Int?)
- `QuestAttempt`: Added `gradeAtTimeOfAttempt` (Int?)
- `DailyQuestSet`: Added `gradeAtCreation` (Int?)

## API Endpoints

### GET /api/students/me/grade
Returns current grade, next grade eligibility, and grade journey history.

### POST /api/students/me/grade
Upgrades student to next grade:
- Closes current grade journey
- Creates summary snapshot
- Creates new grade journey
- Updates currentGrade

## Next Steps

1. **Complete Profile Page**
   - Add "My Journey" section
   - Add grade upgrade button
   - Show grade-specific messaging

2. **Update Content Generation**
   - Quest generation: filter by currentGrade
   - Assessment generation: tag with gradeAtTimeOfAttempt
   - Difficulty adjustment by grade

3. **Update Explorer/Facilitator**
   - Grade-aware quest selection
   - Grade-specific messaging
   - Career discovery framing by grade

4. **Testing**
   - Enroll in 8th → complete → upgrade to 9th
   - Direct enroll in 9th/10th
   - Verify content adapts correctly
   - Verify historical data preserved

