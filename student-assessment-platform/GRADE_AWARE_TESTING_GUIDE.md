# Grade-Aware Quest & Assessment System - Testing Guide

## Prerequisites

1. **Database Setup:**
   ```bash
   cd student-assessment-platform
   npx prisma migrate dev
   npx prisma generate
   ```

2. **Environment Variables:**
   Ensure these are set in `.env`:
   ```bash
   EXPLORER_MODE=true
   FACILITATOR_MODE=true
   DEMO_ASSESSMENTS=true
   ```

3. **Start Server:**
   ```bash
   npm run dev
   ```

4. **Seed Test Data:**
   - Ensure you have at least one tenant
   - Ensure you have at least one student user with a profile

## Test Scenarios

### 1. Test Grade-Aware Quest Generation (Explorer Mode)

#### Test 1.1: Grade 8 Student
1. **Login as a Grade 8 student:**
   - Ensure student profile has `currentGrade: 8`
   - Navigate to `/explorer`

2. **Verify Quest Generation:**
   - Check that quests are generated with grade-appropriate content
   - Quest 1 (Mini Game): Should have 6 questions (not 8)
   - Quest 2 (Reflection): Should have Grade 8 reflection prompt
   - Quest 3 (Choice Scenario): Should have Grade 8 scenario

3. **Check Database:**
   ```sql
   SELECT "gradeAtCreation" FROM daily_quest_sets 
   WHERE "studentId" = '<student-id>' 
   ORDER BY "createdAt" DESC LIMIT 1;
   ```
   - Should show `gradeAtCreation: 8`

#### Test 1.2: Grade 9 Student
1. **Update student grade to 9:**
   ```sql
   UPDATE student_profiles 
   SET "currentGrade" = 9 
   WHERE id = '<student-id>';
   ```

2. **Generate new quests:**
   - Navigate to `/explorer` (or wait for next day)
   - Quest 1 should have 8 questions
   - Quest 2 should have Grade 9 reflection prompt
   - Quest 3 should have Grade 9 scenario

3. **Verify `gradeAtCreation`:**
   - Should show `gradeAtCreation: 9`

#### Test 1.3: Grade 10 Student
1. **Update student grade to 10:**
   ```sql
   UPDATE student_profiles 
   SET "currentGrade" = 10 
   WHERE id = '<student-id>';
   ```

2. **Generate new quests:**
   - Quest 1 should have 8 questions
   - Quest 2 should have Grade 10 reflection prompt (deeper)
   - Quest 3 should have Grade 10 scenario (more complex)

### 2. Test Grade-Aware Assessment Filtering

#### Test 2.1: Assessment List Filtering
1. **Login as Grade 8 student:**
   - Navigate to `/assessments`
   - All 8 games should be visible (all have `gradeApplicability: [8,9,10]`)

2. **Check API directly:**
   ```bash
   curl -X GET http://localhost:3000/api/assessments \
     -H "Cookie: next-auth.session-token=<your-session-token>" \
     -H "x-tenant-id: <tenant-id>"
   ```
   - Should return all 8 games
   - Each game should have grade metadata

#### Test 2.2: Assessment Attempt Grade Tracking
1. **Start an assessment:**
   - Navigate to `/assessments/pattern_forge`
   - Click "Start Assessment"

2. **Check database:**
   ```sql
   SELECT "gradeAtTimeOfAttempt" FROM assessment_attempts 
   WHERE "studentId" = '<student-id>' 
   ORDER BY "startedAt" DESC LIMIT 1;
   ```
   - Should show `gradeAtTimeOfAttempt: 8` (or student's current grade)

3. **Complete the assessment:**
   - Answer questions and submit
   - Check that `gradeAtTimeOfAttempt` is preserved

### 3. Test Grade-Aware Facilitator Mode

#### Test 3.1: Grade-Aware Weekly Plan
1. **Login as student with Facilitator goal:**
   - Navigate to `/facilitator`
   - Set a goal (e.g., "Software Engineer")

2. **Check weekly plan generation:**
   ```bash
   curl -X GET http://localhost:3000/api/facilitator/week \
     -H "Cookie: next-auth.session-token=<your-session-token>" \
     -H "x-tenant-id: <tenant-id>"
   ```
   - Should return weekly plan with grade-appropriate quests

3. **Verify quest content:**
   - Check that quests in daily plan consider grade-expected skills
   - Quest difficulty should respect `difficultyByGrade` if specified

#### Test 3.2: Grade-Aware Today's Quests
1. **Navigate to `/facilitator`:**
   - Check "Today's Plan" section
   - Quests should be grade-appropriate

2. **Start a quest:**
   - Click on a quest
   - Check database for `gradeAtTimeOfAttempt`

### 4. Test Grade-Aware Performance Interpretation

#### Test 4.1: Complete Assessment and Check Summary
1. **Complete all 8 assessments:**
   - Navigate through all games
   - Complete each one

2. **After final submission:**
   - Check API response for `gradeContextualSummary`
   - Should include `overallInsight` with grade context
   - Should NOT show "below grade" or "ahead of grade" language

3. **Verify interpretation:**
   - Insights should reference grade context: "At Grade 8 level..."
   - Language should be supportive, not judgmental

### 5. Test Late Joiner Scenario (Grade 9/10 Direct Enrollment)

#### Test 5.1: Grade 9 Late Joiner
1. **Create new student with Grade 9:**
   ```sql
   INSERT INTO student_profiles (id, "userId", "tenantId", "currentGrade", ...)
   VALUES (..., 9, ...);
   ```

2. **Complete onboarding:**
   - Navigate to `/onboarding`
   - Select Grade 9
   - Complete profile

3. **Generate quests:**
   - Navigate to `/explorer`
   - Quests should be Grade 9 appropriate
   - No assumptions should be made about skill maturity

4. **Start assessment:**
   - Navigate to `/assessments`
   - All games should be available
   - `gradeAtTimeOfAttempt` should be 9

#### Test 5.2: Grade 10 Late Joiner
1. **Repeat Test 5.1 with Grade 10:**
   - Verify Grade 10 quest content
   - Verify Grade 10 assessment interpretation

### 6. Test Grade Contextual Summary

#### Test 6.1: After All Assessments
1. **Complete all 8 assessment games:**
   - Ensure student has completed all games

2. **Check final submission response:**
   ```bash
   # Get the last assessment attempt ID
   # Then check the submit response
   ```
   - Response should include `gradeContextualSummary`
   - `overallInsight` should reference student's grade
   - Should use supportive language

3. **Verify no deficit language:**
   - Should NOT contain: "below", "behind", "weak", "not ready"
   - Should contain: "At Grade X level", "common", "typically", "developing as expected"

### 7. Test Quest Attempt Grade Tracking

#### Test 7.1: Explorer Quest Attempt
1. **Start an Explorer quest:**
   - Navigate to `/explorer`
   - Click on a quest
   - Start the quest

2. **Check database:**
   ```sql
   SELECT "gradeAtTimeOfAttempt" FROM quest_attempts 
   WHERE "studentId" = '<student-id>' 
   ORDER BY "startedAt" DESC LIMIT 1;
   ```
   - Should show student's current grade

#### Test 7.2: Facilitator Quest Attempt
1. **Start a Facilitator quest:**
   - Navigate to `/facilitator`
   - Click on a quest
   - Start the quest

2. **Verify `gradeAtTimeOfAttempt`:**
   - Should match student's current grade

### 8. Test Grade Upgrade Scenario

#### Test 8.1: Grade Upgrade Mid-Year
1. **Start as Grade 8:**
   - Complete some quests/assessments
   - Verify `gradeAtTimeOfAttempt: 8`

2. **Upgrade to Grade 9:**
   - Navigate to `/profile`
   - Click "Upgrade to Grade 9"
   - Complete upgrade flow

3. **Generate new quests:**
   - Navigate to `/explorer`
   - New quests should be Grade 9 appropriate
   - `gradeAtCreation` should be 9

4. **Start new assessment:**
   - New attempts should have `gradeAtTimeOfAttempt: 9`
   - Old attempts should still have `gradeAtTimeOfAttempt: 8`

## Manual Testing Checklist

### Explorer Mode
- [ ] Grade 8 student sees Grade 8 quest content
- [ ] Grade 9 student sees Grade 9 quest content
- [ ] Grade 10 student sees Grade 10 quest content
- [ ] `gradeAtCreation` stored correctly in `DailyQuestSet`
- [ ] `gradeAtTimeOfAttempt` stored correctly in `QuestAttempt`

### Facilitator Mode
- [ ] Weekly plan considers student's grade
- [ ] Today's quests are grade-appropriate
- [ ] Quest attempts store `gradeAtTimeOfAttempt`

### Assessments
- [ ] All games visible for all grades (universal content)
- [ ] `gradeAtTimeOfAttempt` stored on attempt creation
- [ ] Grade-contextual summary generated after all assessments
- [ ] Summary uses supportive language (no deficit terms)

### Late Joiners
- [ ] Grade 9 direct enrollment works
- [ ] Grade 10 direct enrollment works
- [ ] No assumptions made about skill maturity

### Grade Upgrade
- [ ] Old attempts preserve original grade
- [ ] New attempts use new grade
- [ ] Quest content adapts to new grade

## API Testing Commands

### Test Explorer Today (Grade-Aware)
```bash
curl -X GET http://localhost:3000/api/explorer/today \
  -H "Cookie: next-auth.session-token=<token>" \
  -H "x-tenant-id: <tenant-id>" \
  | jq '.data.quests[] | {id, title, gradeApplicability}'
```

### Test Facilitator Today (Grade-Aware)
```bash
curl -X GET http://localhost:3000/api/facilitator/today \
  -H "Cookie: next-auth.session-token=<token>" \
  -H "x-tenant-id: <tenant-id>" \
  | jq '.data.quests[] | {id, title}'
```

### Test Assessments List (Grade-Filtered)
```bash
curl -X GET http://localhost:3000/api/assessments \
  -H "Cookie: next-auth.session-token=<token>" \
  -H "x-tenant-id: <tenant-id>" \
  | jq '.data[] | {id, name, gradeApplicability}'
```

### Test Weekly Plan (Grade-Aware)
```bash
curl -X GET http://localhost:3000/api/facilitator/week \
  -H "Cookie: next-auth.session-token=<token>" \
  -H "x-tenant-id: <tenant-id>" \
  | jq '.data.dailyPlan[0].quests[] | {id, title}'
```

## Database Verification Queries

### Check Quest Set Grade
```sql
SELECT 
  dqs.id,
  dqs."gradeAtCreation",
  sp."currentGrade",
  dqs."createdAt"
FROM daily_quest_sets dqs
JOIN student_profiles sp ON dqs."studentId" = sp.id
WHERE sp."userId" = '<user-id>'
ORDER BY dqs."createdAt" DESC
LIMIT 5;
```

### Check Quest Attempt Grade
```sql
SELECT 
  qa.id,
  qa."gradeAtTimeOfAttempt",
  qa."questType",
  qa."startedAt"
FROM quest_attempts qa
JOIN student_profiles sp ON qa."studentId" = sp.id
WHERE sp."userId" = '<user-id>'
ORDER BY qa."startedAt" DESC
LIMIT 10;
```

### Check Assessment Attempt Grade
```sql
SELECT 
  aa.id,
  aa."gameId",
  aa."gradeAtTimeOfAttempt",
  aa."startedAt"
FROM assessment_attempts aa
JOIN student_profiles sp ON aa."studentId" = sp.id
WHERE sp."userId" = '<user-id>'
ORDER BY aa."startedAt" DESC
LIMIT 10;
```

## Expected Behaviors

### ✅ Should Happen
- Quest content adapts to student's grade
- Grade metadata stored on quest sets and attempts
- Performance interpreted in grade context
- Supportive, non-judgmental language
- Grade 9/10 late joiners work without assumptions

### ❌ Should NOT Happen
- "Below grade level" language in student UI
- "Ahead of grade" language in student UI
- Skill maturity assumptions based on grade
- Grade blocking quest/assessment access
- Peer or cross-grade comparisons

## Troubleshooting

### Issue: Quests not adapting to grade
**Check:**
1. Student profile has `currentGrade` set
2. `generateDailyQuests()` is called with `studentGrade` parameter
3. Quest generation logic uses grade parameter

### Issue: Grade metadata not stored
**Check:**
1. Database migration ran successfully
2. API routes set `gradeAtCreation` / `gradeAtTimeOfAttempt`
3. Prisma schema includes grade fields

### Issue: Grade-contextual summary not generated
**Check:**
1. All 8 assessments completed
2. `generateGradeContextualSummary()` is called
3. Skill scores exist for interpretation

### Issue: Wrong grade in attempts
**Check:**
1. Student profile `currentGrade` is correct
2. API routes fetch student grade before creating attempts
3. Default fallback to grade 8 if not set

## Quick Test Script

```bash
# 1. Set student grade to 8
# 2. Generate quests
# 3. Check gradeAtCreation = 8
# 4. Start quest
# 5. Check gradeAtTimeOfAttempt = 8
# 6. Upgrade to grade 9
# 7. Generate new quests
# 8. Check gradeAtCreation = 9
# 9. Start new quest
# 10. Check gradeAtTimeOfAttempt = 9
```

## Next Steps After Testing

1. **Verify grade-contextual insights** appear in parent/teacher views (when implemented)
2. **Test with multiple students** of different grades
3. **Verify skill maturity calculation** (when evidence-based logic is implemented)
4. **Test grade-specific quest pools** (when created)

