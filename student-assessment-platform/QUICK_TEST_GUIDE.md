# Quick Test Guide - Assessment Demo Flow

## Prerequisites

1. Database seeded with test user:
   ```bash
   npm run db:seed-simple
   ```

2. Environment variable set:
   ```bash
   # In file
   DEMO_ASSESSMENTS=true
   ```

3. Server running:
   ```bash
   npm run dev
   ```

## Test User

- **Email**: `student@test-school.com`
- **OTP**: Check server console or Redis (`redis-cli GET otp:student@test-school.com`)

## Complete 8-Game Flow

### Step 1: Login
1. Go to: http://localhost:3000/login
2. Enter email: `student@test-school.com`
3. Click "Send Login Code"
4. Get OTP from console/Redis
5. Enter OTP at: http://localhost:3000/verify-otp?email=student@test-school.com
6. Redirected to dashboard

### Step 2: Start Assessments
1. From dashboard, click "Start Assessment" or go to: http://localhost:3000/assessments
2. Should see all 8 games listed
3. First game (Pattern Forge) should be unlocked

### Step 3: Complete Game 1 (Pattern Forge)
1. Click "Start Game" on Pattern Forge
2. URL: http://localhost:3000/assessments/pattern_forge
3. Answer 12 questions (multiple choice)
4. Click "Next" after each answer
5. On last question, click "Submit"
6. Redirected to: http://localhost:3000/assessments/results/[attemptId]

**Expected Results Page:**
- Accuracy percentage
- Average time per question
- Total time spent
- 2 strengths listed
- 2 growth areas listed
- "Start Many Ways Builder" button

### Step 4: Complete Games 2-7
Repeat Step 3 for each game:
- Game 2: Many Ways Builder
- Game 3: Story Lens
- Game 4: Visual Vault
- Game 5: Focus Sprint
- Game 6: Mission Planner
- Game 7: Dilemma Compass

Each game should:
- Unlock after previous completion
- Show demo questions (12 questions)
- Redirect to results page
- Show "Next Game" button

### Step 5: Complete Game 8 (Replay & Reflect)
1. Start Game 8
2. Answer questions (mix of text and multiple choice)
3. Submit
4. **Should redirect to**: http://localhost:3000/reports/latest

### Step 6: View Comprehensive Report
**URL**: http://localhost:3000/reports/latest

**Expected Content:**
- Celebratory message
- Strengths section (top 3 categories)
- Growth opportunities section
- Recommendations (4 items)
- Parent guidance (collapsible accordion)
  - Overview
  - Support tips (5 items)
- Demo badge (indicating demo-generated report)

## Verification Checklist

- [ ] All 8 games can be started
- [ ] Questions appear for each game
- [ ] Answers can be selected/entered
- [ ] Progress bar updates
- [ ] Timer works (if enabled)
- [ ] Submit button works
- [ ] Results page shows after each game
- [ ] Strengths and growth areas appear
- [ ] "Next Game" button works
- [ ] After Game 8, redirects to report
- [ ] Report page loads with all sections
- [ ] Report shows demo badge
- [ ] All navigation works

## Troubleshooting

### OTP not received
- Check server console for OTP
- Or check Redis: `redis-cli GET otp:student@test-school.com`
- Clear rate limit: `curl -X POST http://localhost:3000/api/auth/clear-rate-limit -H "Content-Type: application/json" -d '{"email":"student@test-school.com"}'`

### Questions not appearing
- Check `DEMO_ASSESSMENTS=true` in `.env`
- Restart dev server after changing `.env`
- Check browser console for errors

### Results not showing
- Check that attempt was submitted successfully
- Check API response in Network tab
- Verify attemptId in URL matches database

### Report not generating
- Verify all 8 games are completed
- Check that `assessmentComplete` is true in student profile
- Check server logs for report generation errors
- Verify report exists in database: `SELECT * FROM ai_reports WHERE "reportType" = 'INITIAL_ASSESSMENT';`

## Quick Commands

```bash
# Clear OTP rate limit
curl -X POST http://localhost:3000/api/auth/clear-rate-limit \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test-school.com"}'

# Check if report exists (via psql)
psql $DATABASE_URL -c "SELECT id, \"generatedAt\", \"reportType\" FROM ai_reports;"

# Check completed attempts
psql $DATABASE_URL -c "SELECT \"gameId\", status, \"completedAt\" FROM assessment_attempts WHERE status = 'COMPLETED';"
```

## Expected Flow Summary

```
Login → Dashboard → Assessments List → Game 1 → Results → Game 2 → Results → ... → Game 8 → Results → Report
```

Total time: ~15-20 minutes for all 8 games (12 questions each, ~2-3 minutes per game)

