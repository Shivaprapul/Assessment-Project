# Teacher Portal Grade-Aware Filtering

## Overview

Teacher APIs filter attempts and results by the teacher's ClassSection grade. This ensures teachers only see data relevant to their current class context.

## ClassSection Model

Each teacher is assigned to a ClassSection with:
- `grade` (8, 9, or 10)
- `academicYearStart` and `academicYearEnd` dates
- `teacherId` (primary teacher)
- `isActive` flag

Students are linked to a ClassSection via `classSectionId` in StudentProfile.

## Grade-Aware Filtering Rules

### 1. Student List (`GET /api/teacher/students`)
- Filters by: `classSectionId` AND `currentGrade == ClassSection.grade`
- Only shows students in teacher's active section

### 2. Student Drilldown (`GET /api/teacher/students/:studentId`)
- Verifies student belongs to teacher's ClassSection
- Filters quest attempts by: `gradeAtTimeOfAttempt == ClassSection.grade`
- Only shows attempts from current class grade

### 3. Class Signals (`GET /api/teacher/class-signals`)
- Computes signals only from:
  - Students in teacher's ClassSection
  - Attempts with `gradeAtTimeOfAttempt == ClassSection.grade`
  - Within current academic year window (if available)

### 4. Smart Groups (`GET /api/teacher/groups`)
- Auto-generated groups only include:
  - Students in teacher's ClassSection
  - Current grade students
  - Attempts filtered by `gradeAtTimeOfAttempt`

### 5. Assignments (`POST /api/teacher/assignments`)
- When targeting "CLASS", only includes students from teacher's ClassSection
- Grade scope defaults to ClassSection.grade

## Future: History Toggle (Not Implemented in MVP)

To add a history toggle later without changing API contracts:

1. Add optional query parameters:
   - `grade?: 8 | 9 | 10` - Filter by specific grade
   - `includeHistory?: boolean` - Include attempts from other grades

2. API implementation:
```typescript
// In teacher APIs, add optional params
const gradeFilter = req.nextUrl.searchParams.get('grade');
const includeHistory = req.nextUrl.searchParams.get('includeHistory') === 'true';

const whereClause = {
  ...(gradeFilter ? {
    gradeAtTimeOfAttempt: parseInt(gradeFilter),
  } : includeHistory ? {} : {
    gradeAtTimeOfAttempt: classSection.grade, // Default: current grade only
  }),
};
```

3. UI addition (future):
- Add a toggle in teacher dashboard: "Show history from other grades"
- When enabled, fetch with `includeHistory=true`
- Display grade badge on each attempt to show context

## MVP Constraints

- **No grade selector UI** - Teachers see only their ClassSection grade
- **No history toggle** - Only current grade attempts shown
- **One section per teacher** - MVP assumes teacher has one active ClassSection
- **Backend-only filtering** - All filtering happens in API, not UI

## Testing

1. Create ClassSection for teacher (Grade 9)
2. Assign students to ClassSection
3. Verify teacher dashboard only shows Grade 9 students
4. Verify student drilldown only shows Grade 9 attempts
5. Verify class signals computed from Grade 9 attempts only

