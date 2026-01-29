# Grade-Aware Quest and Assessment System Implementation

## Overview

This document describes the implementation of grade-aware content selection and performance interpretation for quests and assessments. Grade determines content context and difficulty, while skill maturity is inferred from performance, not from grade.

## Core Principles

1. **Grade determines content context and difficulty** - Not skill maturity assumptions
2. **Skill maturity is inferred from performance** - Not from grade
3. **Grade affects interpretation, not scoring** - Same quest/assessment, different context
4. **No deficit language** - Never show "below grade" or "ahead of grade" in student UI

## Implementation Files

### 1. `lib/grade-aware-content.ts`

Core utility functions for grade-aware content selection and performance interpretation.

**Key Functions:**
- `isContentApplicableForGrade()` - Check if content applies to student's grade
- `filterByGradeApplicability()` - Filter content by grade
- `prioritizeByGradeEmphasis()` - Prioritize content based on grade skill emphasis
- `selectGradeAwareContent()` - Main selection function (filter + prioritize)
- `interpretPerformanceInGradeContext()` - Interpret performance against grade expectations
- `generateGradeContextualSummary()` - Generate summary after all assessments

### 2. Updated Interfaces

**Quest Interface (`lib/explorer-quests.ts`):**
- Added `gradeApplicability?: number[]` - e.g. [8], [9,10], [8,9,10]
- Added `primarySkills?: string[]` - Primary skill categories
- Added `secondarySkills?: string[]` - Secondary skill categories
- Added `difficultyByGrade?: Record<number, 'easy' | 'medium' | 'hard'>` - Grade-specific difficulty

**GameConfig Interface (`lib/games.ts`):**
- Same grade metadata fields as Quest interface

### 3. Grade-Aware Quest Generation

**Explorer Mode (`lib/explorer-quests.ts`):**
- `generateDailyQuests()` now accepts `studentGrade` parameter
- Quest content adapts to grade:
  - Grade 8: 6 questions, simpler prompts
  - Grade 9: 8 questions, medium complexity
  - Grade 10: 8 questions, deeper reflection prompts
- All quests default to `gradeApplicability: [8,9,10]` (universal)

**Facilitator Mode (`lib/facilitator-weekly-plan.ts`):**
- `generateWeeklyPlan()` now accepts `studentGrade` parameter
- `generateDailyFacilitatorQuests()` now accepts `studentGrade` parameter
- Quest selection considers grade-expected skills that are lagging

### 4. Grade-Aware API Updates

**Assessment APIs:**
- `POST /api/assessments/[gameId]/start` - Stores `gradeAtTimeOfAttempt`
- `GET /api/assessments` - Filters games by `gradeApplicability`
- `POST /api/assessments/attempts/[attemptId]/submit` - Generates grade-contextual summary

**Quest APIs:**
- `GET /api/explorer/today` - Generates grade-aware quests, stores `gradeAtCreation`
- `GET /api/facilitator/today` - Generates grade-aware quests, stores `gradeAtCreation`
- `POST /api/explorer/quests/[questId]/start` - Stores `gradeAtTimeOfAttempt`
- `POST /api/facilitator/quests/[questId]/start` - Stores `gradeAtTimeOfAttempt`

**Facilitator Weekly Plan:**
- `GET /api/facilitator/week` - Generates grade-aware weekly plan

### 5. Grade-Aware Performance Interpretation

After quest or assessment attempt:
1. Identify impacted skill branches
2. For each skill:
   - Retrieve expected maturity band from `GradeSkillExpectations` for student's grade
   - Compare actual performance signals against expected band
   - Generate interpretive insights (not judgments)

**Example Logic:**
- Grade 8 expected → Practicing
- Observed performance → Consistent
- Insight → "Showing early consistency for this grade context"

### 6. Database Fields

**AssessmentAttempt:**
- `gradeAtTimeOfAttempt Int?` - Grade when attempt was made

**QuestAttempt:**
- `gradeAtTimeOfAttempt Int?` - Grade when attempt was made

**DailyQuestSet:**
- `gradeAtCreation Int?` - Grade when quest set was created

## Usage Examples

### Grade-Aware Quest Selection

```typescript
import { selectGradeAwareContent } from '@/lib/grade-aware-content';

const studentGrade = 9;
const availableQuests = [...]; // Array of Quest objects

// Filter and prioritize by grade
const gradeAwareQuests = selectGradeAwareContent(
  availableQuests,
  studentGrade,
  3 // count
);
```

### Grade-Aware Performance Interpretation

```typescript
import { interpretPerformanceInGradeContext } from '@/lib/grade-aware-content';

const interpretation = interpretPerformanceInGradeContext(
  'COGNITIVE_REASONING',
  SkillMaturityBand.CONSISTENT,
  9 // studentGrade
);

// Returns:
// {
//   skill: 'COGNITIVE_REASONING',
//   currentBand: SkillMaturityBand.CONSISTENT,
//   expectedBand: SkillMaturityBand.CONSISTENT,
//   comparison: 'within_expected',
//   insight: 'At a Grade 9 level, this skill is commonly consistent. Currently showing consistent use. This is developing as expected.'
// }
```

## Safety & UX Rules

✅ **Approved:**
- "At Grade 9 level, this skill is commonly practicing"
- "This is common and typically becomes consistent with practice"
- "This shows signs of independent use for this grade context"

❌ **Never Use:**
- "Below grade level"
- "Ahead of grade"
- "Behind"
- "Weak"
- "Not ready"

## Testing Checklist

- [ ] Grade 8 student sees only Grade 8 / universal quests
- [ ] Grade 9 student joins directly → no assumptions made
- [ ] Same quest attempted by Grade 8 vs Grade 10 → different interpretation, same scoring
- [ ] Explorer mode quests adapt to grade
- [ ] Facilitator mode weekly plans consider grade-expected skills
- [ ] Assessment games filtered by grade applicability
- [ ] Grade-contextual summary generated after all assessments
- [ ] No "below grade" or "ahead of grade" language in student UI

## Future Enhancements

1. **Evidence-based maturity calculation** - Replace placeholder `getCurrentSkillBand` with actual evidence-based logic
2. **Grade-specific quest pools** - Create grade-specific quest variations
3. **Difficulty scaling** - Adjust question difficulty based on grade
4. **Parent/Teacher grade context** - Show grade expectations in parent/teacher views (soft language)

## Notes

- Grade metadata defaults to `[8,9,10]` (universal) if not specified
- Existing content without grade metadata still works (backward compatible)
- Grade affects interpretation, not scoring - same performance, different context
- Skill maturity bands update from evidence, not from grade assumptions

