# Tenant Isolation Testing Guide

## Critical Security Requirement

**Tenant isolation is NON-NEGOTIABLE.** Users from one tenant must NEVER be able to access data from another tenant.

## Manual Testing Steps

### Prerequisites

1. Seed database: `npm run db:seed`
2. Start server: `npm run dev`

### Test 1: Verify OTP for Tenant 1 Student

```bash
# Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test-school.com"}'

# Get OTP from Redis
redis-cli GET otp:student@test-school.com

# Verify OTP (save the response - contains tenantId)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test-school.com","otp":"YOUR_OTP"}'
```

**Save the `tenantId` from the response.**

### Test 2: Verify OTP for Tenant 2 Student

```bash
# Send OTP for Tenant 2 student
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"student2@test-school-2.com"}'

# Get and verify OTP
redis-cli GET otp:student2@test-school-2.com
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"student2@test-school-2.com","otp":"YOUR_OTP"}'
```

**Save the `tenantId` from this response (should be different).**

### Test 3: Attempt Cross-Tenant Access

**Scenario:** User from Tenant 1 tries to access Tenant 2's student data.

```bash
# Get Tenant IDs from seed output or database
TENANT1_ID="<from-test-school>"
TENANT2_ID="<from-test-school-2>"

# User from Tenant 1 tries to access their own data (should work)
curl http://localhost:3000/api/students/me \
  -H "Authorization: Bearer <token>" \
  -H "x-tenant-id: $TENANT1_ID"

# User from Tenant 1 tries to access Tenant 2 data (should FAIL)
curl http://localhost:3000/api/test/tenant-isolation?targetTenantId=$TENANT2_ID \
  -H "Authorization: Bearer <tenant1-token>" \
  -H "x-tenant-id: $TENANT1_ID"
```

**Expected Results:**
- ✅ Own tenant data: Returns 200 with data
- ❌ Cross-tenant access: Returns 403 Forbidden OR empty/null data

### Test 4: Database-Level Isolation

```sql
-- Connect to database
psql $DATABASE_URL

-- Get tenant IDs
SELECT id, name, subdomain FROM tenants;

-- Set Tenant 1 context
SET app.current_tenant = '<tenant1-id>';

-- Try to query Tenant 2 users (should return 0 rows if RLS is working)
SELECT * FROM users WHERE tenant_id = '<tenant2-id>';

-- Query own tenant (should work)
SELECT * FROM users WHERE tenant_id = current_setting('app.current_tenant');
```

## Automated Test Endpoint

Use the test endpoint to verify isolation:

```bash
# Test own tenant access
curl http://localhost:3000/api/test/tenant-isolation

# Test cross-tenant access (should be blocked)
curl "http://localhost:3000/api/test/tenant-isolation?targetTenantId=<other-tenant-id>"
```

## Verification Checklist

- [ ] User from Tenant A cannot query Tenant B users
- [ ] User from Tenant A cannot access Tenant B student profiles
- [ ] User from Tenant A cannot access Tenant B assessments
- [ ] Database queries automatically filter by tenant_id
- [ ] Middleware enforces tenant context on all requests
- [ ] API returns 403 when cross-tenant access attempted

## Security Notes

1. **Application-Level Filtering**: All queries must include `tenantId` in WHERE clause
2. **Row-Level Security**: PostgreSQL RLS policies provide additional protection
3. **Middleware Enforcement**: Tenant context set before any database access
4. **Never Trust Client**: Always use tenant_id from JWT token, never from request body

## If Tests Fail

If tenant isolation tests fail:

1. **Check Middleware**: Ensure `withTenantContext` is applied to all routes
2. **Check Queries**: Verify all database queries include `tenantId` filter
3. **Check RLS**: Ensure Row-Level Security policies are created
4. **Check Headers**: Verify `x-tenant-id` is set correctly from JWT

---

**Status**: Must pass before production deployment

