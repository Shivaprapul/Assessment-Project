# Student Dashboard Wiring Summary

## Overview
The Student Dashboard has been updated to fetch real student profile data from `GET /api/students/me` with proper authentication, error handling, and loading states.

## Files Changed

### 1. `app/(student)/dashboard/page.tsx`
**Changes:**
- Removed dependency on localStorage session (`lib/session`)
- Now uses NextAuth cookies for authentication (via `credentials: 'include'`)
- Fetches real student profile from `GET /api/students/me` on mount
- Added loading skeleton using shadcn/ui `Skeleton` component
- Added error state with retry button for non-auth errors
- Handles 401/403 errors by redirecting to `/login`
- Replaced all hardcoded/mock data with real API response fields:
  - `studentProfile.user.name` (was `user.name`)
  - `studentProfile.user.email` (was `user.email`)
  - `studentProfile.user.avatar` (was `user.avatar`)
  - `studentProfile.grade` (real API data)
  - `studentProfile.section` (real API data)
  - `studentProfile.goals` (real API data, displayed in welcome banner)
  - `studentProfile.preferredMode` (real API data, used for mode toggle state)

**Key Features:**
- Loading skeleton shows while fetching data
- Error card with retry button appears if fetch fails (non-auth errors)
- Automatic redirect to `/login` on 401/403
- Mode toggle persists changes via `PUT /api/students/me`
- All data comes from API response (no mock data)

### 2. `components/ui/skeleton.tsx` (NEW)
**Created:**
- Added shadcn/ui Skeleton component for loading states
- Used in dashboard loading skeleton

## API Integration

### Endpoints Used
1. **GET /api/students/me** (authenticated)
   - Fetches student profile on dashboard load
   - Returns: `id`, `userId`, `tenantId`, `grade`, `section`, `dateOfBirth`, `goals`, `preferredMode`, `onboardingComplete`, `assessmentComplete`, `createdAt`, `user` (name, email, avatar)

2. **PUT /api/students/me** (authenticated)
   - Updates `preferredMode` when user toggles Explorer/Facilitator mode
   - Handles 401/403 by redirecting to login

3. **GET /api/students/me/skill-tree** (authenticated)
   - Fetches skill tree data (unchanged)

4. **GET /api/students/me/timeline** (authenticated)
   - Fetches timeline data (unchanged)

5. **POST /api/auth/signout** (NextAuth)
   - Handles logout

## Authentication Flow

1. User logs in via OTP → NextAuth session cookie is set
2. Dashboard loads → Fetches `/api/students/me` with `credentials: 'include'`
3. API validates NextAuth JWT token from cookie
4. If 401/403 → Redirect to `/login`
5. If success → Display real student profile data

## Testing Instructions

### Prerequisites
1. Database seeded with student profile:
   ```bash
   npm run db:seed-simple
   ```

2. Dev server running:
   ```bash
   npm run dev
   ```

### Test Cases

#### 1. **Successful Dashboard Load**
**Steps:**
1. Navigate to `http://localhost:3000/login`
2. Enter email: `student@test-school.com`
3. Request OTP (check terminal for OTP)
4. Enter OTP and verify
5. Should redirect to `/dashboard`

**Expected:**
- Loading skeleton appears briefly
- Dashboard displays:
  - Welcome banner with real student name
  - Grade and section from API
  - Goals count (if any)
  - Mode toggle reflects `preferredMode` from API
  - Skill tree preview loads
  - Recent activity timeline loads

#### 2. **Loading Skeleton**
**Steps:**
1. Open browser DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Navigate to dashboard
4. Observe loading state

**Expected:**
- Skeleton components appear:
  - Header with logo and skeleton avatar
  - Welcome banner skeleton
  - Mode toggle skeleton (2 cards)
  - Skill tree skeleton
- No flash of empty content

#### 3. **Error State with Retry**
**Steps:**
1. Stop the dev server
2. Navigate to `/dashboard` (or refresh if already there)
3. Should see error state

**Expected:**
- Error card appears with:
  - Alert icon
  - Error message
  - "Retry" button
- Clicking "Retry" attempts to fetch again

#### 4. **401/403 Redirect**
**Steps:**
1. Clear browser cookies (or use incognito)
2. Navigate directly to `http://localhost:3000/dashboard`

**Expected:**
- Automatically redirects to `/login`
- No error message shown
- User can log in normally

#### 5. **Mode Toggle Persistence**
**Steps:**
1. Log in and navigate to dashboard
2. Click "Explorer Mode" or "Facilitator Mode"
3. Observe loading state ("Saving preference...")
4. Refresh page

**Expected:**
- Mode toggle reflects saved preference
- Mode persists after refresh
- API call to `PUT /api/students/me` succeeds

#### 6. **Real Data Display**
**Steps:**
1. Check database for student profile:
   ```sql
   SELECT sp.grade, sp.section, sp.goals, sp.preferred_mode, u.name, u.email
   FROM "StudentProfile" sp
   JOIN "User" u ON sp."userId" = u.id
   WHERE u.email = 'student@test-school.com';
   ```
2. Compare with dashboard display

**Expected:**
- Dashboard shows exact values from database:
  - Name matches `u.name`
  - Grade matches `sp.grade`
  - Section matches `sp.section`
  - Goals count matches `sp.goals` array length
  - Mode matches `sp.preferred_mode`

### Manual Verification Checklist

- [ ] Dashboard loads without errors
- [ ] Loading skeleton appears on initial load
- [ ] Real student name appears in welcome banner
- [ ] Grade and section display correctly
- [ ] Goals count appears (if goals exist)
- [ ] Mode toggle reflects saved preference
- [ ] Skill tree preview loads
- [ ] Recent activity timeline loads
- [ ] Mode toggle saves changes
- [ ] Error state appears when API fails
- [ ] Retry button works
- [ ] 401/403 redirects to login
- [ ] Logout button works

## API Response Structure

### GET /api/students/me Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "tenantId": "uuid",
    "grade": 9,
    "section": "A",
    "dateOfBirth": "2011-05-15",
    "goals": ["Improve logical reasoning", "Explore creative fields"],
    "preferredMode": "facilitator",
    "onboardingComplete": true,
    "assessmentComplete": true,
    "createdAt": "2026-01-01T00:00:00Z",
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://..."
    }
  }
}
```

## Notes

- All authentication is handled via NextAuth cookies (no localStorage)
- API calls use `credentials: 'include'` to send cookies
- No new fields or endpoints were added (strictly follows API spec)
- Error handling is comprehensive (loading, error, success states)
- Loading skeleton provides better UX than spinner

