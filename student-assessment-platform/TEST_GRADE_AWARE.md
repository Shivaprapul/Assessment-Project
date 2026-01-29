# Quick Test Guide: Grade-Aware System

## 🚀 Quick Start Testing

### Step 1: Verify Student Grade
```sql
-- Check current student grade
SELECT id, "currentGrade", "onboardingComplete" 
FROM student_profiles 
WHERE "userId" = '<your-user-id>';
```

If `currentGrade` is NULL or not set:
```sql
-- Set grade to 8 for testing
UPDATE student_profiles 
SET "currentGrade" = 8 
WHERE "userId" = '<your-user-id>';
```

### Step 2: Test Explorer Mode (Grade-Aware Quests)

1. **Login and navigate to `/explorer`**
2. **Check browser console** for quest data:
   - Open DevTools → Network tab
   - Look for `/api/explorer/today` request
   - Check response: quests should have grade metadata

3. **Verify quest content:**
   - **Grade 8:** 6 questions in mini-game, simpler prompts
   - **Grade 9:** 8 questions, medium complexity
   - **Grade 10:** 8 questions, deeper reflection prompts

4. **Start a quest:**
   - Click on any quest
   - Check database:
   ```sql
   SELECT "gradeAtTimeOfAttempt" FROM quest_attempts 
   ORDER BY "startedAt" DESC LIMIT 1;
   ```
   - Should match student's `currentGrade`

### Step 3: Test Assessments (Grade-Aware Filtering)

1. **Navigate to `/assessments`**
2. **All 8 games should be visible** (all are universal: [8,9,10])
3. **Start an assessment:**
   - Click "Start Assessment" on any game
   - Check database:
   ```sql
   SELECT "gradeAtTimeOfAttempt" FROM assessment_attempts 
   ORDER BY "startedAt" DESC LIMIT 1;
   ```
   - Should match student's `currentGrade`

4. **Complete the assessment:**
   - Answer questions and submit
   - Check that `gradeAtTimeOfAttempt` is preserved

### Step 4: Test Facilitator Mode (Grade-Aware Weekly Plan)

1. **Navigate to `/facilitator`**
2. **Set a goal** (if not already set):
   - Choose "Software Engineer" or any goal
   - Save goal

3. **Check weekly plan:**
   - View "Plan for the Week" card
   - Quests should consider grade-expected skills

4. **Start a facilitator quest:**
   - Click on a quest
   - Verify `gradeAtTimeOfAttempt` in database

### Step 5: Test Grade Upgrade Flow

1. **Start as Grade 8:**
   - Complete a quest or assessment
   - Verify `gradeAtTimeOfAttempt: 8` in database

2. **Upgrade to Grade 9:**
   - Navigate to `/profile`
   - Click "Upgrade to Grade 9"
   - Complete upgrade

3. **Generate new quests:**
   - Navigate to `/explorer`
   - New quests should be Grade 9 appropriate
   - Check `gradeAtCreation: 9` in database

4. **Start new assessment:**
   - New attempts should have `gradeAtTimeOfAttempt: 9`
   - Old attempts should still have `gradeAtTimeOfAttempt: 8`

### Step 6: Test Grade-Contextual Summary

1. **Complete all 8 assessment games:**
   - Navigate through all games
   - Complete each one

2. **After final submission:**
   - Check browser console for response
   - Look for `gradeContextualSummary` in response
   - Verify `overallInsight` mentions grade context
   - Verify NO "below grade" or "ahead of grade" language

## 🔍 Verification Checklist

### Database Checks
- [ ] `daily_quest_sets.gradeAtCreation` matches student's grade
- [ ] `quest_attempts.gradeAtTimeOfAttempt` matches student's grade
- [ ] `assessment_attempts.gradeAtTimeOfAttempt` matches student's grade

### Content Checks
- [ ] Grade 8 quests have 6 questions (mini-game)
- [ ] Grade 9 quests have 8 questions (mini-game)
- [ ] Grade 10 quests have deeper reflection prompts
- [ ] All assessment games visible for all grades

### Language Checks
- [ ] No "below grade" language in student UI
- [ ] No "ahead of grade" language in student UI
- [ ] Grade-contextual insights use supportive language
- [ ] Insights reference "At Grade X level..."

## 🐛 Common Issues & Fixes

### Issue: Quests not grade-appropriate
**Fix:** Check that `generateDailyQuests()` is called with `studentGrade` parameter in API route

### Issue: `gradeAtCreation` is NULL
**Fix:** Ensure API route sets `gradeAtCreation: student.currentGrade || 8` when creating `DailyQuestSet`

### Issue: `gradeAtTimeOfAttempt` is NULL
**Fix:** Ensure API route sets `gradeAtTimeOfAttempt: student.currentGrade || 8` when creating attempts

### Issue: Grade-contextual summary not appearing
**Fix:** 
1. Ensure all 8 assessments are completed
2. Check that `generateGradeContextualSummary()` is called
3. Verify skill scores exist in database

## 📊 Test Different Grades

### Test Grade 8
```sql
UPDATE student_profiles SET "currentGrade" = 8 WHERE id = '<student-id>';
```
- Navigate to `/explorer` → Generate new quests
- Verify Grade 8 content

### Test Grade 9
```sql
UPDATE student_profiles SET "currentGrade" = 9 WHERE id = '<student-id>';
```
- Navigate to `/explorer` → Generate new quests
- Verify Grade 9 content

### Test Grade 10
```sql
UPDATE student_profiles SET "currentGrade" = 10 WHERE id = '<student-id>';
```
- Navigate to `/explorer` → Generate new quests
- Verify Grade 10 content

## ✅ Success Criteria

1. ✅ Quest content adapts to student's grade
2. ✅ Grade metadata stored correctly
3. ✅ Performance interpreted in grade context
4. ✅ No deficit language in student UI
5. ✅ Late joiners (Grade 9/10) work without assumptions
6. ✅ Grade upgrade preserves old attempts' grade
7. ✅ New attempts use new grade

## 🎯 Quick Test Commands

```bash
# 1. Check student grade
psql $DATABASE_URL -c "SELECT id, \"currentGrade\" FROM student_profiles LIMIT 1;"

# 2. Set grade to 8
psql $DATABASE_URL -c "UPDATE student_profiles SET \"currentGrade\" = 8 WHERE id = '<student-id>';"

# 3. Check quest set grade
psql $DATABASE_URL -c "SELECT \"gradeAtCreation\" FROM daily_quest_sets ORDER BY \"createdAt\" DESC LIMIT 1;"

# 4. Check quest attempt grade
psql $DATABASE_URL -c "SELECT \"gradeAtTimeOfAttempt\" FROM quest_attempts ORDER BY \"startedAt\" DESC LIMIT 1;"

# 5. Check assessment attempt grade
psql $DATABASE_URL -c "SELECT \"gradeAtTimeOfAttempt\" FROM assessment_attempts ORDER BY \"startedAt\" DESC LIMIT 1;"
```

