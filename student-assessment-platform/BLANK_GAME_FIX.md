# Fix for Blank Game Screen

## Issue
Game screens show blank - no questions, no submit button, no content.

## Root Cause
When navigating with `attemptId` in query params, the page wasn't loading questions properly. The demo endpoint needs to be called to get questions.

## Fixes Applied

1. **Updated `useEffect` to always call `startNewAttempt`** - Even when `attemptId` is in query params, we call the start endpoint to get questions
2. **Added loading state check for questions** - If in demo mode and no questions, show loading message
3. **Fixed optional chaining** - Changed `attempt?.config.showTimer` to `attempt?.config?.showTimer`
4. **Added debug logging** - Console logs to help diagnose issues
5. **Fixed submit button condition** - Changed from `attempt.config.totalQuestions` to `totalQuestions`

## Verification Steps

1. **Check Environment Variables**:
   ```bash
   # In .env file, ensure both are set:
   DEMO_ASSESSMENTS=true
   NEXT_PUBLIC_DEMO_ASSESSMENTS=true
   ```

2. **Restart Server**:
   ```bash
   # Stop server (Ctrl+C) and restart
   npm run dev
   ```

3. **Check Browser Console**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Click "Start Game" on any assessment
   - Look for:
     - "Demo start response:" log with questions array
     - "Setting questions: 12" log
     - Any error messages

4. **Check Network Tab**:
   - Open Network tab in DevTools
   - Click "Start Game"
   - Find the request to `/api/demo/assessments/start`
   - Check Response tab - should show:
     ```json
     {
       "success": true,
       "data": {
         "attemptId": "...",
         "gameId": "pattern_forge",
         "questions": [
           {
             "id": "q-...",
             "question": "...",
             "type": "multiple_choice",
             "options": [...]
           },
           ...
         ]
       }
     }
     ```

## If Still Blank

### Check 1: Environment Variable
```bash
# Verify in terminal
echo $NEXT_PUBLIC_DEMO_ASSESSMENTS
# Should output: true

# If not set, add to .env and restart server
```

### Check 2: Server Console
Look for errors in the terminal where `npm run dev` is running:
- Should see "Demo start response:" logs
- Should NOT see authentication errors
- Should NOT see database errors

### Check 3: API Response
Test the endpoint directly:
```bash
# After logging in, get your session token from cookies
# Then test:
curl -X POST http://localhost:3000/api/demo/assessments/start \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"gameId":"pattern_forge"}'
```

Should return JSON with `questions` array.

### Check 4: Client-Side Detection
In browser console, type:
```javascript
process.env.NEXT_PUBLIC_DEMO_ASSESSMENTS
```

Should output: `"true"`

If it's `undefined`, the environment variable isn't being read. Restart the server.

## Expected Behavior After Fix

1. Click "Start Game" → Navigates to game page
2. Page shows loading spinner briefly
3. Questions appear (12 questions)
4. Can answer questions
5. Progress bar updates
6. Submit button appears on last question
7. After submit → Redirects to results page

## Files Changed

- `app/(student)/assessments/[gameId]/page.tsx`:
  - Always calls `startNewAttempt` even with attemptId in query
  - Added loading check for questions in demo mode
  - Fixed optional chaining for attempt.config
  - Added debug logging
  - Fixed submit button condition

## Next Steps if Issue Persists

1. Check browser console for specific error messages
2. Check server console for API errors
3. Verify database connection (attempts should be created)
4. Verify authentication (should be logged in)
5. Try clearing browser cache and hard refresh (Cmd+Shift+R)

