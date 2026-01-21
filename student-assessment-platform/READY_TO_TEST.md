# ✅ Ready to Test - Complete Checklist

## Status: All Components Ready for Testing

### ✅ 1. Authentication APIs

#### POST /api/auth/send-otp
- **Status**: ✅ Implemented
- **Features**: 
  - Email validation
  - Rate limiting (3 per 15 min)
  - User existence check
  - OTP stored in Redis (5 min expiry)
  - Email sending (console log in dev)

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test-school.com"}'
```

**Expected**: `{"success": true, "data": {"message": "OTP sent...", "expiresIn": 300}}`

#### POST /api/auth/verify-otp
- **Status**: ✅ Implemented
- **Features**:
  - OTP validation from Redis
  - Failed attempt tracking (5 max)
  - User data retrieval
  - Tenant information included
  - Last login update

**Test Command:**
```bash
# First get OTP from Redis
redis-cli GET otp:student@test-school.com

# Then verify
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test-school.com","otp":"123456"}'
```

**Expected**: `{"success": true, "data": {"user": {...}, "tenant": {...}}}`

#### GET /api/auth/session
- **Status**: ✅ Implemented
- **Features**:
  - NextAuth session retrieval
  - Full user and tenant data
  - Proper error handling

**Test Command:**
```bash
curl http://localhost:3000/api/auth/session
```

**Expected**: `{"success": true, "data": {...}}` or `{"success": false, "error": {...}}` if not authenticated

### ✅ 2. Database Seeding

#### Seed Script: `prisma/seed.ts`
- **Status**: ✅ Implemented
- **Creates**:
  - Platform admin tenant
  - Test school tenant (test-school)
  - Second test school tenant (test-school-2) for isolation testing
  - Users: admin, teacher, parent, student (tenant 1)
  - Student 2 (tenant 2) for isolation testing

**Run:**
```bash
npm run db:seed
```

**Verify:**
```bash
# Check tenants
psql $DATABASE_URL -c "SELECT id, name, subdomain FROM tenants;"

# Check users
psql $DATABASE_URL -c "SELECT email, role, \"tenantId\" FROM users;"
```

### ✅ 3. Tenant Isolation

#### Implementation
- **Status**: ✅ Implemented
- **Features**:
  - Middleware enforces tenant context
  - All queries filter by tenant_id
  - Test endpoint available

#### Test Endpoint: GET /api/test/tenant-isolation
- **Status**: ✅ Implemented
- **Purpose**: Verify tenant isolation works

**Test Commands:**
```bash
# Test own tenant (should work)
curl http://localhost:3000/api/test/tenant-isolation \
  -H "Authorization: Bearer <token>" \
  -H "x-tenant-id: <user-tenant-id>"

# Test cross-tenant (should be blocked)
curl "http://localhost:3000/api/test/tenant-isolation?targetTenantId=<other-tenant-id>" \
  -H "Authorization: Bearer <token>" \
  -H "x-tenant-id: <user-tenant-id>"
```

**Expected**: 
- Own tenant: Returns data
- Cross-tenant: Returns 403 or empty data

### ✅ 4. UI Pages

#### /login
- **Status**: ✅ Implemented
- **Features**:
  - Email input
  - OTP request
  - Error handling
  - Success messages
  - Redirects to verify-otp

**Test**: Open http://localhost:3000/login

#### /verify-otp
- **Status**: ✅ Implemented
- **Features**:
  - 6-digit OTP input boxes
  - Auto-focus and navigation
  - Paste support
  - Resend with timer
  - Redirects to dashboard

**Test**: Open http://localhost:3000/verify-otp?email=student@test-school.com

#### /dashboard
- **Status**: ✅ Implemented
- **Features**:
  - Welcome banner
  - User avatar
  - Mode selection
  - Skill tree preview
  - Recent activity
  - Logout

**Test**: Open http://localhost:3000/dashboard (after authentication)

## 🧪 Complete Test Sequence

### Step 1: Setup
```bash
# 1. Ensure database and Redis are running
# 2. Set environment variables in .env
# 3. Run migrations
npx prisma migrate dev

# 4. Seed database
npm run db:seed

# 5. Start dev server
npm run dev
```

### Step 2: Test Authentication APIs

**Terminal 1 - Send OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test-school.com"}'
```

**Terminal 2 - Get OTP:**
```bash
redis-cli GET otp:student@test-school.com
```

**Terminal 1 - Verify OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test-school.com","otp":"<OTP_FROM_REDIS>"}'
```

**Save the response** - contains `tenantId` for isolation testing.

### Step 3: Test Tenant Isolation

**Get Tenant IDs:**
```bash
psql $DATABASE_URL -c "SELECT id, subdomain FROM tenants;"
```

**Test Cross-Tenant Access:**
```bash
# User from Tenant 1 tries to access Tenant 2
curl "http://localhost:3000/api/test/tenant-isolation?targetTenantId=<TENANT2_ID>" \
  -H "x-tenant-id: <TENANT1_ID>"
```

**Expected**: Should return 403 or empty data, NOT Tenant 2's data

### Step 4: Test UI Pages

1. **Login Page**: http://localhost:3000/login
   - Enter email: `student@test-school.com`
   - Click "Send Login Code"
   - Should redirect to verify-otp

2. **Verify OTP Page**: http://localhost:3000/verify-otp?email=student@test-school.com
   - Enter 6-digit OTP from Redis
   - Should redirect to dashboard

3. **Dashboard Page**: http://localhost:3000/dashboard
   - Should show welcome message
   - Should display user information
   - Should have mode selection buttons

## 📊 Test Results Checklist

After running all tests, verify:

- [ ] ✅ Send OTP API returns 200 with success
- [ ] ✅ OTP stored in Redis (check with redis-cli)
- [ ] ✅ Verify OTP API returns user and tenant data
- [ ] ✅ Session API works (with proper auth)
- [ ] ✅ Tenant isolation blocks cross-tenant access
- [ ] ✅ Login page loads and functions
- [ ] ✅ Verify OTP page loads and functions
- [ ] ✅ Dashboard page loads after authentication
- [ ] ✅ Database has seeded data (tenants, users, students)

## 🔧 Quick Test Script

Run the automated test:

```bash
node test-auth-apis.js
```

Or use the shell script:

```bash
./test-apis.sh
```

## 📝 Notes

1. **OTP in Development**: Check console logs or Redis for OTP (email service logs to console)
2. **Session Management**: Currently uses localStorage (temporary - should use NextAuth sessions)
3. **Tenant Isolation**: Application-level filtering is working; RLS can be added for extra security

## 🎯 Success Criteria

All items checked ✅ = Foundation is ready for feature development!

---

**Last Updated**: January 2026  
**Status**: ✅ Ready for Testing

