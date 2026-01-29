# How to Set Student to Explorer Mode

## Option 1: Using the Dashboard UI (Easiest) ⭐

1. **Login** as a student:
   - Go to: http://localhost:3000/login
   - Email: `student@test-school.com`
   - Enter OTP

2. **Go to Dashboard**:
   - After login, you'll be on: http://localhost:3000/dashboard

3. **Click Explorer Mode Button**:
   - In the "Choose Your Learning Mode" section
   - Click the **"Explorer Mode"** button (with compass icon)
   - The mode will be saved automatically

**That's it!** The dashboard already has the mode toggle functionality built in.

---

## Option 2: Using the API (via curl)

If you want to set it programmatically:

```bash
# First, get your session token from browser cookies
# Then run:
curl -X PUT http://localhost:3000/api/students/me \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"preferredMode":"EXPLORER"}'
```

**Note**: You need to be logged in and have a valid session token.

---

## Option 3: Using SQL (Direct Database)

If you want to set it directly in the database:

```sql
-- Find the student user ID first
SELECT u.id, u.email, sp."preferredMode"
FROM users u
JOIN student_profiles sp ON sp."userId" = u.id
WHERE u.email = 'student@test-school.com';

-- Then update (replace USER_ID with the actual ID)
UPDATE student_profiles
SET "preferredMode" = 'EXPLORER'
WHERE "userId" = 'USER_ID';
```

Or update by email in one query:

```sql
UPDATE student_profiles
SET "preferredMode" = 'EXPLORER'
WHERE "userId" IN (
  SELECT id FROM users WHERE email = 'student@test-school.com'
);
```

---

## Option 4: Update Seed Script (For New Students)

Edit `prisma/seed-simple.ts` to set Explorer mode by default:

```typescript
// In the studentProfile creation:
create: {
  // ... other fields
  preferredMode: 'EXPLORER',  // Add this line
  // ... rest of fields
}
```

Then run:
```bash
npm run db:seed-simple
```

---

## Verify Explorer Mode is Set

### Check via API:
```bash
curl http://localhost:3000/api/students/me \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  | jq '.data.preferredMode'
```

Should return: `"EXPLORER"`

### Check via SQL:
```sql
SELECT u.email, sp."preferredMode"
FROM users u
JOIN student_profiles sp ON sp."userId" = u.id
WHERE u.email = 'student@test-school.com';
```

Should show: `preferredMode = EXPLORER`

---

## Quick Test

1. **Set mode via Dashboard** (Option 1 - easiest)
2. **Refresh the page**
3. **Check the mode toggle** - Explorer button should be highlighted/active
4. **Navigate to `/explorer`** - Should work if `EXPLORER_MODE=true` is set

---

## Troubleshooting

### Mode not saving?
- Check browser console for errors
- Verify you're logged in
- Check that the API endpoint is working: `PUT /api/students/me`

### Explorer page not accessible?
- Ensure `EXPLORER_MODE=true` in `.env`
- Restart dev server after adding the flag
- Check that student's `preferredMode` is set to `EXPLORER`

### API returns 403?
- Make sure you're logged in as a STUDENT (not parent/teacher)
- Check that the session token is valid

---

## Recommended Approach

**For testing**: Use **Option 1 (Dashboard UI)** - it's the easiest and tests the full flow.

**For automation**: Use **Option 3 (SQL)** if you need to set it for multiple students quickly.

