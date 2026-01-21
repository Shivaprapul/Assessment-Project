# Testing Guide

## Prerequisites

1. **Database & Redis Running**
   ```bash
   # PostgreSQL should be running
   # Redis should be running
   ```

2. **Environment Variables Set**
   ```env
   DATABASE_URL="postgresql://user:pass@localhost:5432/db"
   REDIS_URL="redis://localhost:6379"
   NEXTAUTH_SECRET="your-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Database Seeded**
   ```bash
   npm run db:seed
   ```

## 1. Test Authentication APIs

### 1.1 Send OTP

```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test-school.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent to your email",
    "expiresIn": 300
  }
}
```

**Check:**
- ✅ Status: 200
- ✅ Response has `success: true`
- ✅ OTP stored in Redis (check with `redis-cli GET otp:student@test-school.com`)

### 1.2 Verify OTP

**First, get OTP from Redis:**
```bash
redis-cli GET otp:student@test-school.com
```

**Then verify:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test-school.com","otp":"123456"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@test-school.com",
      "name": "Test Student",
      "role": "STUDENT",
      "tenantId": "uuid"
    },
    "tenant": {
      "id": "uuid",
      "name": "Test International School",
      "subdomain": "test-school"
    }
  }
}
```

**Check:**
- ✅ Status: 200
- ✅ User data returned
- ✅ Tenant data returned
- ✅ OTP deleted from Redis

### 1.3 Get Session

```bash
curl http://localhost:3000/api/auth/session
```

**Expected Response (if authenticated):**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "tenant": {...}
  }
}
```

**Expected Response (if not authenticated):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No active session"
  }
}
```

## 2. Test Tenant Isolation

### 2.1 Get User's Own Data

```bash
# First, verify OTP to get user context
# Then call with user's tenant
curl http://localhost:3000/api/test/tenant-isolation
```

**Expected:** Returns data from user's own tenant only

### 2.2 Attempt Cross-Tenant Access

```bash
# Get tenant IDs from seed output or database
TENANT1_ID="uuid-from-tenant-1"
TENANT2_ID="uuid-from-tenant-2"

# User from Tenant 1 tries to access Tenant 2 data
curl "http://localhost:3000/api/test/tenant-isolation?targetTenantId=$TENANT2_ID" \
  -H "Authorization: Bearer <token-from-tenant1-user>"
```

**Expected:**
- ✅ Returns 403 Forbidden OR
- ✅ Returns null/empty data (blocked by isolation)
- ❌ Should NOT return Tenant 2's data

### 2.3 Manual Database Test

```sql
-- Connect to database
psql $DATABASE_URL

-- Set tenant context for Tenant 1
SET app.current_tenant = 'tenant-1-uuid';

-- Try to query Tenant 2 users (should return empty)
SELECT * FROM users WHERE tenant_id = 'tenant-2-uuid';
-- Should return 0 rows due to RLS

-- Query own tenant (should work)
SELECT * FROM users WHERE tenant_id = current_setting('app.current_tenant');
-- Should return Tenant 1 users only
```

## 3. Test UI Pages

### 3.1 Login Page

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000/login
```

**Check:**
- ✅ Page loads without errors
- ✅ Email input field visible
- ✅ "Send Login Code" button works
- ✅ Error messages display correctly
- ✅ Success message shows after sending OTP

### 3.2 Verify OTP Page

```bash
# Navigate to verify-otp with email param
open http://localhost:3000/verify-otp?email=student@test-school.com
```

**Check:**
- ✅ Page loads with email displayed
- ✅ 6 OTP input boxes visible
- ✅ Auto-focus works (first box focused)
- ✅ Can type OTP digits
- ✅ Auto-advance to next box works
- ✅ Backspace moves to previous box
- ✅ Resend button works (with timer)
- ✅ Submit button disabled until 6 digits entered

### 3.3 Dashboard Page

```bash
# After successful OTP verification
open http://localhost:3000/dashboard
```

**Check:**
- ✅ Page loads without errors
- ✅ Welcome message with user name
- ✅ Avatar displays
- ✅ Mode selection buttons visible
- ✅ Skill Tree section visible
- ✅ Recent Activity section visible
- ✅ Logout button works

## 4. Automated Test Script

Run the automated test script:

```bash
./test-apis.sh
```

This will:
1. Test send-otp endpoint
2. Prompt for OTP and test verify-otp
3. Test session endpoint
4. Provide instructions for tenant isolation testing

## 5. Database Seed Verification

Verify seed data exists:

```bash
# Connect to database
psql $DATABASE_URL

# Check tenants
SELECT id, name, subdomain, type FROM tenants;

# Check users
SELECT id, email, role, "tenantId" FROM users;

# Check student profiles
SELECT id, grade, section, "tenantId" FROM student_profiles;
```

**Expected:**
- ✅ 2+ tenants (platform, test-school, test-school-2)
- ✅ Multiple users (admin, teacher, parent, student)
- ✅ Student profiles linked to users

## 6. Tenant Isolation Proof

### Test Case 1: User from Tenant A cannot access Tenant B user

```bash
# 1. Login as student@test-school.com (Tenant 1)
# 2. Get their user ID and tenant ID
# 3. Try to access student2@test-school-2.com data (Tenant 2)

curl http://localhost:3000/api/students/me \
  -H "Authorization: Bearer <tenant1-token>" \
  -H "x-tenant-id: <tenant2-id>"
```

**Expected:** 403 Forbidden

### Test Case 2: Direct database query with wrong tenant

```sql
-- Set Tenant 1 context
SET app.current_tenant = 'tenant-1-uuid';

-- Try to query Tenant 2 data
SELECT * FROM users WHERE email = 'student2@test-school-2.com';
-- Should return 0 rows (RLS blocks it)
```

**Expected:** 0 rows returned

## 7. Common Issues & Solutions

### Issue: "USER_NOT_FOUND" when sending OTP

**Solution:** Run seed script
```bash
npm run db:seed
```

### Issue: "REDIS_URL is not defined"

**Solution:** Set REDIS_URL in .env file

### Issue: "Can't reach database server"

**Solution:** 
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify database exists

### Issue: OTP not received

**Solution:**
- Check Redis: `redis-cli GET otp:email@example.com`
- Check email service configuration
- In development, OTP is logged to console

### Issue: Tenant isolation not working

**Solution:**
- Verify middleware is applied to all routes
- Check that `x-tenant-id` header is set correctly
- Ensure RLS policies are created (see migration script)

## 8. Success Criteria

✅ **All tests pass if:**
1. Send OTP returns 200 with success message
2. Verify OTP returns user and tenant data
3. Session endpoint returns user data when authenticated
4. Tenant isolation test returns 403 for cross-tenant access
5. Login page loads and functions
6. Verify OTP page loads and functions
7. Dashboard page loads after authentication

---

**Last Updated**: January 2026

