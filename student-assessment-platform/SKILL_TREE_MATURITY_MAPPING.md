# Skill Tree Maturity Band Mapping Implementation

## Overview

This document describes the implementation of the Skill Tree UI mapped to the new Skill Maturity Band system (Discovering, Practicing, Consistent, Independent, Adaptive). The implementation ensures role-based display where students never see maturity band labels, while parents and teachers get appropriate context.

## Core Principles

1. **Students never see maturity band labels** - Only game-like levels (1-10) and fun titles
2. **Visual progression cues** - Different visual styles based on maturity band (internal only)
3. **Role-based display** - Different information shown to students, parents, and teachers
4. **Grade context integration** - Silent but powerful influence on copy tone and recommendations

## Implementation Files

### 1. `lib/skill-tree-display.ts`

Core utility functions for mapping maturity bands to game-like levels and role-based display props.

**Key Functions:**
- `mapMaturityBandToLevel(band, score?)` - Maps maturity band to level 1-10
- `getFunLevelTitle(level)` - Returns student-friendly level titles (Seedling, Sprout, etc.)
- `calculateSkillXP(band, score)` - Calculates XP from maturity band and score
- `getVisualProgressionCues(band)` - Returns visual style cues (glow, progress style, animation)
- `getStudentFriendlyCopy(band, trend)` - Returns encouraging copy for students
- `getParentContext(currentBand, expectedBand, grade, skillName)` - Returns parent-friendly context with grade expectations
- `getTeacherInsights(currentBand, skill)` - Returns actionable insights for teachers
- `getSkillTreeDisplayProps(role, ...)` - Main function that returns role-specific display props

**Maturity Band to Level Mapping:**
- Discovering → Level 1-2
- Practicing → Level 3-4
- Consistent → Level 5-6
- Independent → Level 7-8
- Adaptive → Level 9-10

**Visual Progression Cues:**
- Discovering: soft glow, dotted progress, pulse animation
- Practicing: solid glow, solid progress, steady animation
- Consistent: steady glow, animated progress, glow animation
- Independent: highlight glow, badge progress, sparkle animation
- Adaptive: aura glow, star progress, sparkle animation

### 2. `components/skill-tree/SkillTreeWithMaturity.tsx`

New Skill Tree component that integrates maturity bands with role-based display.

**Features:**
- **Student View:**
  - Shows level number and fun title (e.g., "Lv 3 • Budding")
  - XP progress bar
  - Encouraging copy ("Level Up! 🎉", "You're getting faster at this!")
  - Trending indicators
  - Visual progression cues (glow, badges, stars)
  - **Never shows maturity band labels**

- **Parent View:**
  - Shows level number
  - Grade expectation context (soft language)
  - Approved phrasing: "At Grade 9 level, this skill is commonly practicing. Currently showing discovering use. This is common and typically becomes consistent with practice."
  - Neutral indicators (✓, ➝, ✨)
  - No red/yellow warning colors

- **Teacher View:**
  - Shows maturity band (visible only to teachers)
  - Level number
  - Suggested classroom actions per skill
  - Actionable insights (e.g., "Use 2-minute planning prompt before task")

## Usage Example

```typescript
import { SkillTreeWithMaturity } from '@/components/skill-tree/SkillTreeWithMaturity';
import { useUserRole } from '@/hooks/useUserRole';

function SkillTreePage() {
  const { role } = useUserRole();
  const currentGrade = 9; // From student profile
  
  return (
    <SkillTreeWithMaturity
      data={skillTreeData}
      role={role === 'STUDENT' ? 'student' : role === 'PARENT' ? 'parent' : 'teacher'}
      currentGrade={currentGrade}
    />
  );
}
```

## Student-Friendly Copy Examples

**Never use:**
- ❌ "You're behind"
- ❌ "Below grade level"
- ❌ "Weak in this skill"
- ❌ Maturity band names (Discovering, Practicing, etc.)

**Always use:**
- ✅ "Level Up! 🎉"
- ✅ "You're getting faster at this!"
- ✅ "Nice consistency streak!"
- ✅ "New ability unlocked!"
- ✅ "Mastery achieved! 🌟"

## Parent Context Examples

**Approved phrasing:**
- "At Grade 9 level, this skill is commonly practicing. Currently showing discovering use. This is common and typically becomes consistent with practice."
- "At Grade 10 level, this skill is commonly independent. Currently showing consistent use. This is developing as expected."
- "This shows signs of independent use for this grade context."

## Teacher Insights Examples

**Suggested actions by maturity band:**

**Discovering:**
- Use 2-minute planning prompt before task
- Break complex problems into smaller steps
- Encourage "think aloud" strategies

**Practicing:**
- Provide guided practice with examples
- Use scaffolded problem-solving prompts
- Celebrate logical thinking attempts

**Consistent:**
- Introduce more complex problem types
- Encourage independent reasoning
- Connect reasoning to real-world applications

**Independent:**
- Provide challenging, open-ended problems
- Encourage peer teaching opportunities
- Support creative problem-solving approaches

**Adaptive:**
- Offer advanced problem-solving challenges
- Encourage leadership in group problem-solving
- Support exploration of novel approaches

## Integration Points

### API Integration

The Skill Tree API (`/api/students/me/skill-tree`) should be updated to:
1. Include `currentMaturityBand` for each skill category
2. Include `currentGrade` in the response
3. Support role-based filtering if needed

### Database Integration

The `SkillScore` model should be extended to:
1. Store `currentMaturityBand` (calculated from evidence)
2. Store `skillLevel` (1-10, derived from maturity band)
3. Store `skillXP` (calculated from maturity band and score)

## Testing Checklist

- [ ] Student view shows only levels and fun titles (no maturity bands)
- [ ] Parent view shows grade context with soft language
- [ ] Teacher view shows maturity bands and actionable insights
- [ ] Visual progression cues work correctly (glow, badges, stars)
- [ ] Grade 9 late joiner sees motivating UI, not remedial
- [ ] Parent sees grade context appropriately
- [ ] Teacher sees actionable insights per skill

## Future Enhancements

1. **Evidence-based maturity calculation** - Replace placeholder `getCurrentSkillBand` with actual evidence-based calculation
2. **XP system integration** - Connect XP to actual quest/assessment completions
3. **Level progression animations** - Add confetti/animations when leveling up
4. **Badge system** - Award badges for reaching certain maturity bands
5. **Historical tracking** - Show maturity band progression over time (for parents/teachers)

## Notes

- This implementation does NOT modify quests, assessments, Explorer, or Facilitator modes
- Maturity bands are internal only - students never see them
- All comparisons are descriptive, never judgmental
- Supports fair assessment for late joiners (Grade 9/10)
- Skill maturity is non-linear and can move in any direction based on evidence

