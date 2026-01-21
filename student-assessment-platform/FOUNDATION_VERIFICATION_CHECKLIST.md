# Foundation Verification Checklist

## Prerequisites
- [ ] PostgreSQL is running
- [ ] Redis is running  
- [ ] Node.js 18+ installed
- [ ] Environment variables set in `.env`:
  ```
  DATABASE_URL="postgresql://user:password@localhost:5432/db"
  REDIS_URL="redis://localhost:6379"
  NEXTAUTH_SECRET="your-secret-key"
  NEXTAUTH_URL="http://localhost:3000"
  ```

---

## Step 1: Install Dependencies

```bash
cd "/Users/vamsimundra/Desktop/Assessment Project/student-assessment-platform"
npm install
```

**Expected**: No errors, exit code 0  
**Verify**: `node_modules` directory exists

---

## Step 2: TypeScript Compilation

```bash
npx tsc --noEmit
```

**Expected**: No errors, exit code 0  
**Verify**: No TypeScript errors in output

---

## Step 3: Database Migration

```bash
npx prisma migrate dev --name init
```

**Expected**: 
- Migration created in `prisma/migrations`
- Database schema created
- Exit code 0

**Verify**: Check `prisma/migrations` folder exists

---

## Step 4: Database Seeding

```bash
npm run db:seed
```

**Expected Output**:
```
🌱 Starting database seed...
✅ Platform tenant created: <uuid>
✅ School tenant created: <uuid>
✅ School tenant 2 created: <uuid>
✅ Platform admin created: admin@platform.com
✅ School admin created: admin@test-school.com
✅ Teacher created: teacher@test-school.com
✅ Parent created: parent@test-school.com
✅ Student user created: student@test-school.com
✅ Student profile created: <uuid>
✅ Second tenant and student created for isolation testing

✅ Seed completed successfully!
```

**Verify**: Run database query:
```bash
psql $DATABASE_URL -c "SELECT email, role, \"tenantId\" FROM users ORDER BY email;"
```

Should show at least 6 users.

---

## Step 5: Build Application

```bash
npm run build
```

**Expected**: 
- Build completes successfully
- All routes generated
- Exit code 0

**Verify**: Check output shows:
```
Route (app)
├ ○ /dashboard
├ ○ /login
└ ○ /verify-otp
```

---

## Step 6: Start Development Server

```bash
npm run dev
```

**Expected**: Server starts on http://localhost:3000  
**Verify**: Open http://localhost:3000 - should redirect to /login

**Keep this terminal running!**

---

## Step 7: Test Authentication APIs

### 7.1 Send OTP

**Command**:
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test-school.com"}'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "message": "OTP sent to your email",
    "expiresIn": 300
  }
}
```

**Status Code**: 200  
**Verify**: Check Redis:
```bash
redis-cli GET otp:student@test-school.com
```
Should return a 6-digit number.

---

### 7.2 Verify OTP

**First, get OTP from Redis**:
```bash
redis-cli GET otp:student@test-school.com
```

**Then verify** (replace `123456` with actual OTP):
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test-school.com","otp":"123456"}'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "<uuid>",
      "email": "student@test-school.com",
      "name": "Test Student",
      "role": "STUDENT",
      "tenantId": "<uuid>"
    },
    "tenant": {
      "id": "<uuid>",
      "name": "Test International School",
      "subdomain": "test-school"
    }
  }
}
```

**Status Code**: 200  
**Save the `tenantId` from response for Step 8!**

---

### 7.3 Get Session

**Command**:
```bash
curl http://localhost:3000/api/auth/session
```

**Expected Response** (if not authenticated):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No active session"
  }
}
```

**Status Code**: 401 (expected if not using NextAuth session)

---

## Step 8: Test Tenant Isolation

### 8.1 Get Tenant IDs

**Command**:
```bash
psql $DATABASE_URL -c "SELECT id, subdomain FROM tenants WHERE subdomain IN ('test-school', 'test-school-2');"
```

**Expected Output**:
```
                  id                  |   subdomain    
--------------------------------------+----------------
 <uuid-tenant-1>                      | test-school
 <uuid-tenant-2>                      | test-school-2
```

**Save both tenant IDs!**

---

### 8.2 Test Own Tenant Access

**Command** (replace `<TENANT1_ID>` with actual ID from 8.1):
```bash
curl http://localhost:3000/api/test/tenant-isolation \
  -H "x-tenant-id: <TENANT1_ID>"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "message": "Tenant isolation test",
    "userTenant": "<TENANT1_ID>",
    "ownTenantData": [
      {
        "id": "<uuid>",
        "email": "student@test-school.com",
        "name": "Test Student",
        "role": "STUDENT",
        "tenantId": "<TENANT1_ID>"
      }
    ],
    "isolationStatus": "Working correctly"
  }
}
```

**Status Code**: 200  
**Verify**: All returned users have `tenantId` matching the header.

---

### 8.3 Test Cross-Tenant Access (CRITICAL)

**Command** (replace `<TENANT1_ID>` and `<TENANT2_ID>` with actual IDs):
```bash
curl "http://localhost:3000/api/test/tenant-isolation?targetTenantId=<TENANT2_ID>" \
  -H "x-tenant-id: <TENANT1_ID>"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "message": "Tenant isolation working correctly",
    "test": "Attempted to access different tenant data",
    "result": "Blocked - returned null",
    "userTenant": "<TENANT1_ID>",
    "attemptedTenant": "<TENANT2_ID>",
    "isolationStatus": "PASSED"
  }
}
```

**Status Code**: 200  
**CRITICAL**: The response should show `"result": "Blocked - returned null"`  
**MUST NOT** contain any data from Tenant 2!

**If you see Tenant 2's data, this is a SECURITY ISSUE!**

---

## Step 9: Test UI Pages

### 9.1 Login Page

**URL**: http://localhost:3000/login

**Expected**:
- ✅ Page loads without errors
- ✅ Email input field visible
- ✅ "Send Login Code" button visible
- ✅ Can enter email: `student@test-school.com`
- ✅ Clicking button sends OTP and redirects to verify-otp

**Verify**: 
- No console errors in browser DevTools
- Form submission works

---

### 9.2 Verify OTP Page

**URL**: http://localhost:3000/verify-otp?email=student@test-school.com

**Expected**:
- ✅ Page loads without errors
- ✅ 6 OTP input boxes visible
- ✅ Email displayed: "We sent a 6-digit code to student@test-school.com"
- ✅ Can enter OTP digits
- ✅ Auto-focus moves to next box
- ✅ Can paste 6-digit OTP
- ✅ "Resend code" button visible

**Verify**:
- Get OTP from Redis: `redis-cli GET otp:student@test-school.com`
- Enter OTP in form
- Should redirect to dashboard

---

### 9.3 Dashboard Page

**URL**: http://localhost:3000/dashboard

**Expected** (if not authenticated):
- ✅ Redirects to /login

**Expected** (if authenticated):
- ✅ Welcome banner with user name
- ✅ User avatar displayed
- ✅ Mode selection buttons (Explorer/Facilitator)
- ✅ Skill Tree preview section
- ✅ Recent Activity section
- ✅ Logout button visible

**Verify**:
- After OTP verification, should land on dashboard
- All sections visible
- No console errors

---

## Step 10: Verify Database Data

**Command**:
```bash
# Check tenants
psql $DATABASE_URL -c "SELECT id, name, subdomain, type FROM tenants;"

# Check users
psql $DATABASE_URL -c "SELECT email, role, \"tenantId\" FROM users ORDER BY email;"

# Check student profiles
psql $DATABASE_URL -c "SELECT id, grade, section, \"tenantId\" FROM student_profiles;"
```

**Expected**:
- ✅ At least 3 tenants (platform, test-school, test-school-2)
- ✅ At least 6 users (various roles)
- ✅ At least 2 student profiles (one per tenant)

---

## ✅ Success Criteria

All steps must pass:

- [x] ✅ Dependencies installed
- [x] ✅ TypeScript compiles
- [x] ✅ Database migrations run
- [x] ✅ Database seeded with test data
- [x] ✅ Application builds successfully
- [x] ✅ Server starts
- [x] ✅ Send OTP API returns 200
- [x] ✅ Verify OTP API returns user data
- [x] ✅ Get Session API works
- [x] ✅ Tenant isolation blocks cross-tenant access
- [x] ✅ Login page loads and functions
- [x] ✅ Verify OTP page loads and functions
- [x] ✅ Dashboard page loads after authentication
- [x] ✅ Database has seeded data

---

## 🚨 If Any Step Fails

1. **Note the exact error message**
2. **Check the error output**
3. **Verify prerequisites** (PostgreSQL, Redis running)
4. **Check environment variables** in `.env`
5. **Review logs** for detailed error messages

---

## 📝 Quick Test Script

Run automated verification:

```bash
./verify-foundation.sh
```

This will test steps 1-5 automatically (requires manual testing for steps 6-9).

---

**Last Updated**: January 2026
