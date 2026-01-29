# Grade Skill Expectations Framework

## Overview

The Grade Skill Expectations framework clearly separates **academic grade** from **skill maturity**. This ensures fair, evidence-based assessment that supports all students, including those who join directly in Grade 9 or 10.

## Core Principles

### 1. Academic Grade ≠ Skill Maturity

- **Academic grade** defines the learning context and commonly observed expectations
- **Skill maturity** is individual, evidence-based, and non-linear
- A Grade 10 student might be at "Practicing" for a skill
- A Grade 8 student might be at "Independent" for a skill
- **This is normal and expected**

### 2. Skill Maturity is Individual, Evidence-Based, and Non-Linear

- Skills can move forward or backward based on evidence
- Skills are assessed per skill, not as a global student label
- No skill maturity band is a "deficit" or "permanent state"
- All students are on their own unique journey

### 3. Grades Define Context, Not Assumptions

- Grade expectations = "commonly observed at this grade"
- Grade expectations ≠ "required to be at this grade"
- Expectations help contextualize progress, not judge it
- Supports students joining directly in Grade 9 or 10

## Global Skill Maturity Bands

These bands apply to **all students**, regardless of grade:

1. **DISCOVERING** - First encounters, experimenting, learning what the skill feels like
2. **PRACTICING** - Using the skill with effort and some support
3. **CONSISTENT** - Showing the skill reliably in familiar situations
4. **INDEPENDENT** - Applying the skill confidently without guidance
5. **ADAPTIVE** - Flexibly using the skill across new or complex situations
6. **UNCLASSIFIED** - Not yet observed/assessed (baseline phase)

## Grade Expectations

### Grade 8 (Exploratory Academic Context)
- **Emphasis**: Curiosity, experimentation, learning how to learn
- **Common Expectations**:
  - Reasoning: **Practicing**
  - Focus & Attention: **Discovering / Practicing**
  - Planning & Organization: **Discovering**
  - Creativity: **Practicing**
  - Reflection & Metacognition: **Discovering**

### Grade 9 (Structured Academic Context)
- **Emphasis**: Building structure, consistency, and awareness
- **Common Expectations**:
  - Reasoning: **Consistent**
  - Focus & Attention: **Practicing / Consistent**
  - Planning & Organization: **Practicing**
  - Reflection & Metacognition: **Practicing**

### Grade 10 (Application-Oriented Academic Context)
- **Emphasis**: Applying skills deliberately and confidently
- **Common Expectations**:
  - Reasoning: **Independent**
  - Focus & Attention: **Consistent**
  - Planning & Organization: **Consistent / Independent**
  - Reflection & Metacognition: **Consistent / Independent**

## Late Joiners & Baseline Handling

### Critical Rule: No Assumptions

**Do NOT assume** a student joining Grade 9 or Grade 10 is already at the expected bands.

### Baseline Observation Phase

1. **Skills start as UNCLASSIFIED** when a student first joins
2. **System observes performance** for 2-3 weeks or N attempts
3. **After baseline**, assign skill maturity bands based on evidence
4. **This ensures fairness** and avoids mislabeling late entrants

### Example Scenarios

**Scenario 1: Student joins Grade 9 directly**
- All skills start as UNCLASSIFIED
- System observes performance over 2-3 weeks
- Skills are assigned maturity bands based on evidence
- Student might be at "Practicing" for Reasoning (expected: "Consistent")
- **This is normal and supported**

**Scenario 2: Student joins Grade 10 directly**
- All skills start as UNCLASSIFIED
- System observes performance
- Skills are assigned maturity bands
- Student might be at "Discovering" for Planning (expected: "Consistent / Independent")
- **This is normal and supported**

## Language & Reporting Rules

### Never Use Deficit Language

❌ **Don't say:**
- "Weak"
- "Behind"
- "Poor"
- "Lacking"
- "Not ready"
- "Below grade level"
- "Struggling"

✅ **Approved phrasing:**
- "At a Grade 9 level, this skill is currently practicing."
- "This is common and typically becomes consistent with practice."
- "This shows signs of independent use for this grade context."
- "At a Grade 10 level, planning skills are typically consistent. Your current practicing phase is a natural part of your journey."

### Supportive Phrasing Examples

- "At a Grade 10 level, planning skills are typically consistent. Your current practicing phase is a natural part of your journey."
- "This is common and typically becomes consistent with practice."
- "Your creativity is in the independent phase, which shows strong development for Grade 9."

## Helper Utilities

### `getExpectedBandForGradeSkill(grade, skill)`
Returns the expected skill maturity band for a grade and skill.

### `getCurrentSkillBand(studentId, skill)`
Returns the student's current skill maturity band based on evidence.

### `compareSkillToExpectation(currentBand, expectedBand)`
Returns descriptive comparison:
- `below_expected` - Skill is at an earlier maturity stage
- `within_expected` - Skill is at or near expected stage
- `above_expected` - Skill is at a later maturity stage

**Note**: Comparisons are descriptive only, never judgmental.

## Future Integration

This framework will be used for:

1. **Content Selection**: Adapt quests and challenges to student's current skill maturity
2. **Reporting**: Provide context-aware insights to students, parents, and teachers
3. **Progress Tracking**: Track skill maturity progression over time
4. **Personalization**: Tailor learning experiences to individual skill development

## Files

- `lib/skill-maturity-bands.ts` - Global skill maturity band definitions
- `lib/grade-skill-expectations.ts` - Grade-specific skill expectations
- `lib/skill-expectation-helpers.ts` - Helper utilities for comparison and lookup

## Implementation Status

✅ **Completed:**
- Global skill maturity bands definition (Discovering, Practicing, Consistent, Independent, Adaptive)
- Grade-specific expectations (8, 9, 10)
- Helper utilities for lookup and comparison
- Supportive language framework
- Baseline handling for late joiners

🚧 **Pending:**
- Actual skill maturity calculation from evidence (currently placeholder)
- Integration with content selection
- Integration with reporting
- UI integration (not in scope for this task)

## Notes

- This framework does NOT change quests, assessments, Explorer, Facilitator, or UI
- It provides the foundation for future evidence-based skill maturity assessment
- All comparisons are descriptive, never judgmental
- Supports fair assessment for late joiners
- Skill maturity is non-linear and can move in any direction based on evidence
