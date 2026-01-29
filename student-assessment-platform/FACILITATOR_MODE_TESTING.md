# Facilitator Mode Testing Guide

## ✅ Implementation Complete

All Facilitator Mode components have been implemented:
- Database models and migration
- Goal skill maps (IAS, Doctor, Software Engineer, Entrepreneur, CA)
- All 7 API endpoints
- Complete UI pages (hub, goal-setup, week, quest runner, results)
- Coaching insights and goal readiness calculator

## 🧪 Testing Steps

### 1. Prerequisites
- ✅ Migration applied: `npx prisma migrate dev`
- ✅ Environment variable set: `FACILITATOR_MODE=true`
- ✅ Server running: `npm run dev`

### 2. Set Goal (First Time)

1. Navigate to `/facilitator`
   - Should redirect to `/facilitator/goal-setup` if no goal set

2. Goal Setup Wizard:
   - **Step 1**: Select goal type
     - Choose "Curated Goals" → Select "IAS" (or any curated goal)
     - OR choose "From Career Catalog" → Select unlocked career
     - OR choose "Custom Goal" → Enter text (e.g., "Become a Data Scientist")
   - **Step 2**: Set time & focus
     - Select daily time: 10/20/30 minutes
     - (Optional) Select focus areas (skill categories)
   - Click "Save Goal"

3. Expected Result:
   - Redirected to `/facilitator` hub
   - Goal card shows goal title and readiness (0% initially)
   - Weekly plan card appears

### 3. View Weekly Plan

1. On `/facilitator` hub:
   - See "Plan for the Week" card preview
   - Click "View Full Plan"

2. Expected Result:
   - Navigate to `/facilitator/week`
   - See 7-day plan with:
     - Week date range
     - 3 focus skills (badges)
     - Daily time budget
     - Each day shows quests with:
       - Quest type (mini_game, reflection, choice_scenario)
       - Title and description
       - Estimated time
       - Skill focus

### 4. Complete Today's Quests

1. On `/facilitator` hub:
   - See "Today's Training" section
   - Should show 4 quests (based on time availability)

2. Start a Quest:
   - Click "Start" on any quest
   - Navigate to `/facilitator/quests/[questId]`
   - Complete the quest:
     - **Mini Game**: Answer 6-8 questions
     - **Reflection**: Write response
     - **Choice Scenario**: Select a choice

3. Submit Quest:
   - Click "Submit"
   - Navigate to results page

4. Expected Result:
   - See coaching insight card with:
     - Strength observed
     - Improvement tip (goal-aligned)
     - Goal alignment message
     - Evidence bullets
     - Skill signals
   - See goal readiness update (if calculated)
   - Click "Back to Training" → returns to hub

### 5. Check Progress

1. On `/facilitator` hub:
   - See "Progress Summary" card
   - Shows:
     - Current streak (days)
     - Most improved skill
     - Total quests completed

2. Goal Readiness:
   - Should increase after completing quests
   - Shown in goal card at top

### 6. View Weekly Plan Details

1. Navigate to `/facilitator/week`
2. Expected:
   - Full 7-day breakdown
   - Each day shows all quests
   - Quest types and skill focus visible

## 🔍 Verification Checklist

- [ ] Goal setup wizard works (curated/career/custom)
- [ ] Goal saved and appears on hub
- [ ] Weekly plan generated and visible
- [ ] Today's quests appear (4 quests default)
- [ ] Can start and complete a quest
- [ ] Coaching insight appears after submission
- [ ] Goal readiness updates
- [ ] Progress summary shows correct data
- [ ] Navigation between pages works
- [ ] All quest types work (mini_game, reflection, choice_scenario)

## 🐛 Common Issues

### "No facilitator goal set"
- **Fix**: Navigate to `/facilitator/goal-setup` and set a goal

### "Facilitator mode is not enabled"
- **Fix**: Set `FACILITATOR_MODE=true` in `.env` and restart server

### Weekly plan not generating
- **Fix**: Ensure goal is set first, then weekly plan will auto-generate

### Quest not starting
- **Fix**: Check that today's quest set exists (auto-created on first visit)

## 📊 Expected Behavior

1. **Goal Selection**:
   - Curated goals use pre-configured skill maps
   - Custom goals use keyword matching or default map
   - Career catalog goals use career's skill signals

2. **Weekly Plan**:
   - Regenerates every Monday (Asia/Kolkata timezone)
   - Focus skills = high goal weight + low current score
   - Quest mix follows goal's questMix percentages

3. **Daily Quests**:
   - Generated from weekly plan
   - Default 4 quests per day
   - Prioritizes focus skills

4. **Coaching Insights**:
   - Goal-aligned feedback
   - Emphasizes progress toward goal
   - No peer comparison or labels

5. **Goal Readiness**:
   - Weighted sum of skill scores
   - Updates after each quest completion
   - Range: 0-100%

## 🎯 Test Scenarios

### Scenario 1: New User Flow
1. Login as student
2. Navigate to `/facilitator`
3. Set goal (IAS)
4. View weekly plan
5. Complete today's first quest
6. Check coaching insight
7. Verify goal readiness increased

### Scenario 2: Custom Goal
1. Set custom goal: "Become a Data Scientist"
2. Verify keyword matching (should use Software Engineer map)
3. Complete quests
4. Verify coaching mentions goal

### Scenario 3: Time Availability
1. Set goal with 10 min/day
2. Verify fewer quests generated
3. Set goal with 30 min/day
4. Verify more quests generated

## 📝 Notes

- Weekly plans are stable for the week (don't change mid-week)
- Goal readiness recalculated after each quest
- Skill scores updated based on quest performance
- All APIs require authentication
- Feature flag guards all routes

