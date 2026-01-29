# Role-Based UI/UX Testing Guide

## Overview
This guide helps you test the new role-based UI split where:
- **Students** see game-first, lightweight completion screens with XP, levels, and quick review
- **Parents/Teachers** see comprehensive reports (existing functionality)
- Navigation is role-specific

---

## Prerequisites
1. Server is running: `npm run dev`
2. Database is migrated and seeded
3. You have a student account logged in

---

## Test 1: Role-Based Navigation

### Steps:
1. **Login as a Student**
   - Go to `/login`
   - Enter student email and OTP
   - After login, check the user menu (avatar in top right)

### Expected Results:
✅ **Student Menu Should Show:**
- Dashboard
- Assessments
- Explorer Mode
- Facilitator Mode
- My Profile
- Community
- Settings
- Logout

❌ **Student Menu Should NOT Show:**
- Parent Tracker
- Teacher Tracker

### Test 2: Game Completion Screen (Assessment Results)

### Steps:
1. **Complete an Assessment Game**
   - Go to `/assessments`
   - Click "Start Assessment" or select a game
   - Complete the game (or use demo mode if enabled)
   - After submission, you should be redirected to results page

### Expected Results:
✅ **You Should See:**
- **Game Completion Screen** (not the old detailed report):
  - "Challenge Complete! 🎉" header
  - XP Gained (e.g., "+75 XP")
  - Accuracy percentage (if available)
  - Time spent
  - Current Level number
  - Level progress bar showing XP progress
  - "Back to Assessments" button
  - "Quick Review" button (if attempt data available)
  - "Next Challenge" or "Start [Next Game]" button (if more games available)
- **Confetti animation** on completion
- **Level Up animation** if you leveled up

❌ **You Should NOT See:**
- Long detailed report text
- Heavy "report" language
- Full AI analysis blocks

### Test 3: Quick Review Modal

### Steps:
1. **From Game Completion Screen**
   - Click "Quick Review" button
   - Modal should open

### Expected Results:
✅ **Quick Review Modal Should Show:**
- **Strength Observed** (1 line, green card)
- **Coach Tip** (1 line, blue card)
- **Skills Improved** (2 skill tags as chips)
- "Got it!" button to close

❌ **Should NOT Show:**
- Long paragraphs
- Multiple evidence bullets
- Full detailed analysis

### Test 4: XP and Levels System

### Steps:
1. **Check Your XP**
   - Complete multiple games/quests
   - Each completion should show XP gained
   - Check if level increases after accumulating enough XP

### Expected Results:
✅ **XP System Should:**
- Calculate XP based on:
  - Base 50 XP for completion
  - Accuracy bonus (0-50 XP)
  - Speed bonus (0-30 XP)
  - Hint penalty (-5 XP per hint)
- Show level progress bar
- Display current level name (e.g., "Curious Rookie", "Pattern Hunter")
- Trigger level up animation when level increases

### Level Names (in order):
1. Curious Rookie (0-100 XP)
2. Pattern Hunter (100-250 XP)
3. Logic Explorer (250-500 XP)
4. Strategy Crafter (500-1000 XP)
5. Mind Athlete (1000-2000 XP)
6. Insight Captain (2000-3500 XP)
7. Wisdom Seeker (3500-5500 XP)
8. Master Thinker (5500-8000 XP)
9. Genius Navigator (8000-12000 XP)
10. Legendary Scholar (12000-18000 XP)
11. Supreme Mind (18000-25000 XP)
12. Transcendent Master (25000+ XP)

---

## Test 5: Explorer/Facilitator Quest Results

### Steps:
1. **Complete an Explorer Quest**
   - Go to `/explorer`
   - Start and complete a quest
   - Check results page

### Expected Results:
✅ **Should show Game Completion Screen** (same as assessment results)
- XP gained
- Level progress
- Quick Review option

### Steps:
2. **Complete a Facilitator Quest**
   - Go to `/facilitator`
   - Start and complete a quest
   - Check results page

### Expected Results:
✅ **Should show Game Completion Screen** (same as assessment results)
- XP gained
- Level progress
- Quick Review option
- Goal readiness update (if applicable)

---

## Test 6: Navigation Flow

### Steps:
1. **From Game Completion Screen**
   - Click "Next Challenge" → Should go to next game
   - Click "Back to Assessments" → Should return to assessments list
   - Click "Quick Review" → Should open modal, then close and stay on page

### Expected Results:
✅ **All navigation should work smoothly**
✅ **No broken links or 404 errors**

---

## Known Limitations (To Be Implemented)

⚠️ **Still Using Old UI:**
- Explorer quest results page (needs update)
- Facilitator quest results page (needs update)

⚠️ **Not Yet Implemented:**
- Teacher student detail page (`/teacher/students/:studentId`)
- Route guards for role-based access
- Badge system (currently shows empty array)

---

## Troubleshooting

### Issue: "Cannot read properties of undefined (reading 'map')"
**Solution:** Make sure you've restarted the dev server after changes

### Issue: XP not showing or always 0
**Solution:** 
- Check browser console for errors
- Verify `/api/students/me/xp` endpoint is working
- Check that attempts have `rawScores` and `metadata` fields populated

### Issue: Confetti not showing
**Solution:**
- Check browser console for errors
- Make sure `canvas-confetti` package is installed
- Try refreshing the page

### Issue: Role not detected (menu shows all items)
**Solution:**
- Check `/api/auth/session` returns correct role
- Verify user role in database is 'STUDENT'
- Clear browser cache and cookies

---

## Next Steps After Testing

Once you've verified the student experience works:
1. We'll update Explorer/Facilitator quest results pages
2. Create teacher student detail page
3. Add route guards
4. Verify parent tracker still shows full reports

---

## Quick Test Checklist

- [ ] Login as student
- [ ] Check user menu shows only student items
- [ ] Complete an assessment game
- [ ] See game completion screen (not detailed report)
- [ ] See XP gained and level progress
- [ ] Click "Quick Review" and see brief insights
- [ ] Complete multiple games and see XP accumulate
- [ ] See level up animation when level increases
- [ ] Navigate between games using "Next Challenge"
- [ ] Verify confetti animations work

---

## Feedback Points

Please note:
1. **Visual Design:** Is the game completion screen engaging and fun?
2. **XP Calculation:** Does the XP gained feel fair and motivating?
3. **Level Names:** Are the level names appropriate and encouraging?
4. **Quick Review:** Is the brief insight helpful without being overwhelming?
5. **Navigation:** Is the flow smooth and intuitive?

