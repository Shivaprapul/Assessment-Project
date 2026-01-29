# Demo Assessment Flow - Complete Testing Guide

## Setup

### 1. Environment Variables

Add to your `.env` file:
```bash
DEMO_ASSESSMENTS=true
NEXT_PUBLIC_DEMO_ASSESSMENTS=true
```

**Important**: `NEXT_PUBLIC_DEMO_ASSESSMENTS` is needed for client-side code to detect demo mode.

### 2. Restart Server

After adding environment variables, restart the dev server:
```bash
npm run dev
```

## Complete Test Flow

### Step 1: Login
1. Navigate to: **http://localhost:3000/login**
2. Enter email: `student@test-school.com`
3. Click "Send Login Code"
4. Get OTP from server console or Redis:
   ```bash
   redis-cli GET otp:student@test-school.com
   ```
5. Enter OTP at verification page
6. You'll be redirected to dashboard

### Step 2: Go to Assessments
1. From dashboard, click "Start Assessment" or navigate to: **http://localhost:3000/assessments**
2. **Verify**: All 8 games should be **unlocked** (no lock icons)
3. Games should show:
   - Pattern Forge (#1)
   - Many Ways Builder (#2)
   - Story Lens (#3)
   - Visual Vault (#4)
   - Focus Sprint (#5)
   - Mission Planner (#6)
   - Dilemma Compass (#7)
   - Replay & Reflect (#8)

### Step 3: Start Any Game
1. Click "Start Game" on **any game** (e.g., Pattern Forge)
2. **Verify**: Navigates to game page: **http://localhost:3000/assessments/pattern_forge?attemptId=...**
3. **Verify**: 12 questions appear
4. **Verify**: Questions are deterministic (same questions if you refresh)

### Step 4: Answer Questions
1. Answer all 12 questions:
   - Multiple choice: Click an option
   - Text questions: Type your answer
2. Click "Next" after each answer
3. **Verify**: Progress bar updates
4. **Verify**: Question counter updates (1/12, 2/12, etc.)

### Step 5: Submit Assessment
1. On the last question (12/12), click "Submit"
2. **Verify**: Loading state shows "Submitting..."
3. **Verify**: Redirects to results page: **http://localhost:3000/assessments/results/[attemptId]**

### Step 6: View Results
**URL**: `http://localhost:3000/assessments/results/[attemptId]`

**Verify the page shows:**
- ✅ Success message: "Great Work! 🎉"
- ✅ Accuracy percentage (e.g., 85%)
- ✅ Average time per question
- ✅ Total time spent
- ✅ 2 strengths listed
- ✅ 2 growth areas listed
- ✅ "Play Another Game" button
- ✅ "View My Report" button

### Step 7: Play Another Game
1. Click "Play Another Game"
2. **Verify**: Returns to `/assessments` page
3. **Verify**: Previously completed game shows "Completed" badge
4. Start a different game (e.g., Many Ways Builder)
5. Complete it and verify results appear

### Step 8: View Report (After 1+ Games)
1. From results page, click "View My Report"
2. Or navigate to: **http://localhost:3000/reports/latest**
3. **Verify**: Report page loads
4. **Verify**: Shows:
   - Celebratory message
   - Strengths section
   - Growth opportunities section
   - Recommendations (4 items)
   - Parent guidance (collapsible)
   - Demo badge (indicating demo-generated)

### Step 9: Complete All 8 Games
1. Repeat Steps 3-7 for all remaining games
2. After completing all 8:
   - Results page shows "Congratulations! 🎊"
   - "View Your Report" button available
   - Report is comprehensive (includes all 8 games)

## API Endpoints Used (Demo Mode)

### Start Assessment
- **POST** `/api/demo/assessments/start`
- **Body**: `{ gameId: "pattern_forge" }`
- **Response**: `{ success: true, data: { attemptId, gameId, questions: [...] } }`

### Submit Assessment
- **POST** `/api/demo/assessments/submit`
- **Body**: `{ attemptId, gameId, answers: [...], telemetrySummary: { timeSpent, hintsUsed } }`
- **Response**: `{ success: true, data: { results: {...}, skillScoresUpdated, completedGames, allGamesCompleted } }`

### Get Report
- **GET** `/api/demo/reports/latest`
- **Response**: `{ success: true, data: { report: {...}, skillTree: [...] } }`

## Verification Checklist

### Assessments Page
- [ ] All 8 games visible
- [ ] All games unlocked (no lock icons)
- [ ] "Start Game" button works on any game
- [ ] No "Invalid response from server" errors

### Game Page
- [ ] 12 questions load correctly
- [ ] Questions are deterministic (same on refresh)
- [ ] Can answer questions (multiple choice and text)
- [ ] Progress bar updates
- [ ] Timer works (if enabled)
- [ ] Submit button works
- [ ] No "Invalid response from server" errors

### Results Page
- [ ] Results display correctly
- [ ] Accuracy, time, strengths, growth areas shown
- [ ] "Play Another Game" button works
- [ ] "View My Report" button works
- [ ] No "Invalid response from server" errors

### Report Page
- [ ] Report loads (even after just 1 game)
- [ ] All sections visible
- [ ] Demo badge shown
- [ ] No "Invalid response from server" errors

## Troubleshooting

### "Invalid response from server" Error
**Cause**: API endpoint returned HTML instead of JSON

**Solution**:
1. Check server console for errors
2. Verify `DEMO_ASSESSMENTS=true` in `.env`
3. Verify `NEXT_PUBLIC_DEMO_ASSESSMENTS=true` in `.env`
4. Restart dev server
5. Check that demo endpoints are being called (check Network tab)

### Games Still Locked
**Cause**: Demo mode not detected

**Solution**:
1. Verify `NEXT_PUBLIC_DEMO_ASSESSMENTS=true` in `.env`
2. Restart dev server
3. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
4. Check browser console for errors

### Questions Not Loading
**Cause**: Demo endpoint not returning questions

**Solution**:
1. Check Network tab - verify `/api/demo/assessments/start` is called
2. Check response - should have `questions` array
3. Check server console for errors
4. Verify `DEMO_ASSESSMENTS=true` in `.env`

### Report Not Generating
**Cause**: Report generation failed

**Solution**:
1. Check server console for errors
2. Verify at least 1 game is completed
3. Try accessing `/api/demo/reports/latest` directly
4. Check database: `SELECT * FROM ai_reports WHERE "reportType" = 'INITIAL_ASSESSMENT';`

## Quick Test Commands

```bash
# Check environment variables
echo $DEMO_ASSESSMENTS
echo $NEXT_PUBLIC_DEMO_ASSESSMENTS

# Test demo start endpoint (after login)
curl -X POST http://localhost:3000/api/demo/assessments/start \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"gameId":"pattern_forge"}'

# Check completed attempts
psql $DATABASE_URL -c "SELECT \"gameId\", status FROM assessment_attempts WHERE status = 'COMPLETED';"

# Check reports
psql $DATABASE_URL -c "SELECT id, \"generatedAt\" FROM ai_reports;"
```

## Expected Behavior

### In Demo Mode:
- ✅ All games unlocked from start
- ✅ Can start any game immediately
- ✅ Questions are deterministic (same seed = same questions)
- ✅ Scoring is deterministic (same answers = same scores)
- ✅ Report generates after 1+ games completed
- ✅ All API responses are JSON (never HTML)
- ✅ No "Invalid response from server" errors
- ✅ Skill tree updates after each game

### Not in Demo Mode:
- Games unlock sequentially (first game, then second, etc.)
- Uses regular API endpoints
- Real game mechanics (when implemented)

## Files Changed

1. **New Demo API Endpoints**:
   - `app/api/demo/assessments/start/route.ts`
   - `app/api/demo/assessments/submit/route.ts`
   - `app/api/demo/reports/latest/route.ts`

2. **Updated Frontend Pages**:
   - `app/(student)/assessments/page.tsx` - Unlocks all games in demo mode
   - `app/(student)/assessments/[gameId]/page.tsx` - Uses demo endpoints
   - `app/(student)/assessments/results/[attemptId]/page.tsx` - Shows "Play Another Game"
   - `app/(student)/reports/latest/page.tsx` - Uses demo endpoint

3. **Existing Files (Unchanged)**:
   - Regular API endpoints remain untouched
   - Real game logic remains separate

## Success Criteria

✅ All 8 games unlock immediately in demo mode
✅ Can start any game without errors
✅ Questions load and are deterministic
✅ Submit works and redirects to results
✅ Results page shows all data correctly
✅ "Play Another Game" returns to assessments
✅ "View My Report" shows report (after 1+ games)
✅ No "Invalid response from server" errors anywhere
✅ All API responses are valid JSON

