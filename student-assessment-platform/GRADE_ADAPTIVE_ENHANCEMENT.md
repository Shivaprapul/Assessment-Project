# Grade-Adaptive Explorer/Facilitator Enhancement

## Summary

Enhanced the grade-adaptive implementation with:
1. **Recent weak signal prioritization** (rolling 7/14 days) for Explorer quests
2. **Grade-specific quest mix** for Facilitator (40/30/30, 50/25/25, 60/25/15)
3. **Grade-specific constraints/difficulty** (timers, multi-step tasks, endurance sets)
4. **Facilitator-specific messaging** on completion screen

## Part A: Explorer Mode Enhancements

### A1) Recent Weak Signal Prioritization

**File: `app/api/explorer/today/route.ts`**

- Fetches recent quest attempts (last 14 days)
- Calculates weak signals per skill:
  - Lower accuracy = stronger weak signal
  - Recent attempts (7 days) get 1.5x weight
  - Older attempts (8-14 days) get 1.0x weight
- Secondary priority formula:
  ```
  priority += weakSignal * 0.3  // 30% weight for weak signals
  ```
- Combined with primary priority (grade emphasis + skill scores)

**Key Changes:**
- Quests targeting skills with recent weak performance get boosted priority
- Rolling window: 7 days (higher weight) + 8-14 days (standard weight)
- Weak signals don't overwhelm primary priority (30% weight)

## Part B: Facilitator Mode Enhancements

### B1) Grade-Specific Quest Mix

**File: `lib/facilitator-weekly-plan.ts`**

- **Grade 8:** mini_game 40%, scenario 30%, reflection 30%
- **Grade 9:** mini_game 50%, scenario 25%, reflection 25%
- **Grade 10:** mini_game 60%, scenario 25%, reflection 15%

**Implementation:**
- Replaces goal-based quest mix with grade-specific mix
- Applied in `generateDailyFacilitatorQuests()`
- Quest types distributed deterministically based on grade

### B2) Grade-Specific Constraints/Difficulty

**File: `lib/facilitator-weekly-plan.ts`**

- **Grade 8:**
  - Constraints: `['no_timer', 'simple_steps']`
  - Time: mini_game 5min, reflection 3min, scenario 4min
  - Minimal timers, simpler multi-step tasks

- **Grade 9:**
  - Constraints: `['occasional_timer', 'moderate_steps', 'planning_prompts']`
  - Time: mini_game 6min, reflection 4min, scenario 5min
  - Occasional timers, moderate multi-step reasoning, stronger planning prompts

- **Grade 10:**
  - Constraints: `['frequent_timer', 'mixed_skills', 'endurance_sets']`
  - Time: mini_game 7min, reflection 4min, scenario 6min
  - More frequent timers, mixed-skill sets, endurance sets

**Note:** Constraints are stored in quest metadata but not returned in `DailyPlanItem` interface. They can be accessed from quest templates for quest execution.

## Part C: Results UI Enhancements

### C1) Facilitator-Specific Messaging

**File: `components/GameCompletionScreen.tsx`**

- Added `mode` prop to `GameCompletionScreen`
- When `mode === 'facilitator'`, displays:
  - "+1 step toward your goal" (lightweight, no numbers)
  - Shown below level progress bar

**Files Updated:**
- `app/(student)/explorer/quests/[questId]/results/page.tsx` - passes `mode="explorer"`
- `app/(student)/facilitator/quests/[questId]/results/page.tsx` - passes `mode="facilitator"`

## Part D: Helper Functions

**File: `lib/report-views.ts`**

### New Functions:

1. **`buildQuickReview(attemptData)`**
   - Wrapper for `getStudentQuickReview()`
   - Returns: 1 strength, 1 improvement tip, 2-3 skill tags

2. **`renderRoleBasedResults({ role, mode, attempt, studentProfile })`**
   - Returns: `'GameCompletionScreen' | 'ParentReport' | 'TeacherReport'`
   - Chooses appropriate component based on role
   - Can be used for conditional rendering in future

## Grade-Specific Behavior Summary

### Explorer Mode

| Grade | Quest Mix | Constraints | Messaging |
|-------|-----------|-------------|-----------|
| 8 | Default (3 quests) | 6 questions, simpler prompts | "Explore & discover" |
| 9 | Default (3 quests) | 8 questions, medium prompts | "Build consistency & structure" |
| 10 | Default (3 quests) | 8 questions, deeper prompts | "Sharpen & apply" |

### Facilitator Mode

| Grade | Quest Mix | Constraints | Time per Quest |
|-------|-----------|-------------|----------------|
| 8 | 40% game, 30% scenario, 30% reflection | No timer, simple steps | 5/4/3 min |
| 9 | 50% game, 25% scenario, 25% reflection | Occasional timer, moderate steps | 6/5/4 min |
| 10 | 60% game, 25% scenario, 15% reflection | Frequent timer, mixed skills | 7/6/4 min |

## Testing Checklist

### Explorer Mode
- [ ] Grade 8 student → Explorer shows "Explore & discover" → Complete quest → See GameCompletionScreen
- [ ] Grade 9 student → Explorer shows "Build consistency" → Quests differ from Grade 8 → Complete quest → See GameCompletionScreen
- [ ] Grade 10 student → Explorer shows "Sharpen & apply" → Quests differ → Complete quest → See GameCompletionScreen
- [ ] Recent weak signals affect quest prioritization (complete quest with low accuracy, verify related quests appear next day)

### Facilitator Mode
- [ ] Grade 8 student → `/facilitator/week` → Verify quest mix ~40/30/30 → Verify minimal constraints
- [ ] Grade 9 student → `/facilitator/week` → Verify quest mix ~50/25/25 → Verify moderate constraints
- [ ] Grade 10 student → `/facilitator/week` → Verify quest mix ~60/25/15 → Verify stronger constraints
- [ ] Complete facilitator quest → See GameCompletionScreen with "+1 step toward your goal" message

### Reports
- [ ] Parent login → View full report for same attempt (gradeAtTimeOfAttempt shown)
- [ ] Teacher login → Student drilldown shows brief report (grade filter behavior unchanged)

## Files Changed

### Modified:
- `app/api/explorer/today/route.ts` - Added weak signal prioritization
- `lib/facilitator-weekly-plan.ts` - Grade-specific quest mix and constraints
- `components/GameCompletionScreen.tsx` - Facilitator-specific messaging
- `app/(student)/explorer/quests/[questId]/results/page.tsx` - Pass mode prop
- `app/(student)/facilitator/quests/[questId]/results/page.tsx` - Pass mode prop
- `lib/report-views.ts` - Added `buildQuickReview` and `renderRoleBasedResults`

## Key Formulas

### Explorer Quest Prioritization
```
priority = Σ(emphasisWeight * (100 - studentScore)) + Σ(weakSignal * 0.3)
```
- Primary: Grade emphasis × student weakness
- Secondary: Recent weak signals (30% weight)

### Facilitator Quest Prioritization
```
priority = goalWeight * (1 + gradeEmphasis) * (100 - currentScore)
```
- Combines goal importance, grade emphasis, and student weakness

### Weak Signal Calculation
```
weakSignalStrength = 1 - normalizedAccuracy
timeWeight = daysAgo <= 7 ? 1.5 : 1.0
weakSignal = Σ(weakSignalStrength * timeWeight)
```

## Safety & Constraints

- ✅ Grade determines content context, not skill maturity
- ✅ No "below grade" or "ahead of grade" language
- ✅ Late joiners start with baseline observation phase
- ✅ Full reports still generated for parents/teachers
- ✅ Constraints stored but not enforced in UI (ready for quest execution logic)

