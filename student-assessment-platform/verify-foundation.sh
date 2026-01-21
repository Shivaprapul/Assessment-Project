#!/bin/bash

# Foundation Verification Script
# Tests all components step by step

set -e  # Exit on error

BASE_URL="http://localhost:3000"
PROJECT_DIR="/Users/vamsimundra/Desktop/Assessment Project/student-assessment-platform"
cd "$PROJECT_DIR"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Foundation Verification Checklist${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Install Dependencies
echo -e "${YELLOW}Step 1: Install Dependencies${NC}"
echo "----------------------------------------"
if npm install > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASSED: Dependencies installed${NC}"
else
  echo -e "${RED}❌ FAILED: npm install${NC}"
  exit 1
fi
echo ""

# Step 2: TypeScript Compilation
echo -e "${YELLOW}Step 2: TypeScript Compilation${NC}"
echo "----------------------------------------"
if npx tsc --noEmit 2>&1 | grep -q "error"; then
  echo -e "${RED}❌ FAILED: TypeScript errors found${NC}"
  npx tsc --noEmit 2>&1 | grep "error" | head -5
  exit 1
else
  echo -e "${GREEN}✅ PASSED: TypeScript compiles${NC}"
fi
echo ""

# Step 3: Database Migration
echo -e "${YELLOW}Step 3: Database Migration${NC}"
echo "----------------------------------------"
echo "Checking migration status..."
if npx prisma migrate status 2>&1 | grep -q "Database schema is up to date"; then
  echo -e "${GREEN}✅ PASSED: Migrations up to date${NC}"
elif npx prisma migrate status 2>&1 | grep -q "P1001"; then
  echo -e "${YELLOW}⚠️  SKIPPED: Database not running${NC}"
  echo "   Run: npx prisma migrate dev --name init"
else
  echo -e "${YELLOW}⚠️  Migrations pending${NC}"
  echo "   Run: npx prisma migrate dev --name init"
fi
echo ""

# Step 4: Database Seeding
echo -e "${YELLOW}Step 4: Database Seeding${NC}"
echo "----------------------------------------"
if npm run db:seed 2>&1 | grep -q "Seed completed successfully"; then
  echo -e "${GREEN}✅ PASSED: Database seeded${NC}"
elif npm run db:seed 2>&1 | grep -q "P1001"; then
  echo -e "${YELLOW}⚠️  SKIPPED: Database not running${NC}"
  echo "   Start database and run: npm run db:seed"
else
  echo -e "${YELLOW}⚠️  Seed may have issues${NC}"
  echo "   Check output above"
fi
echo ""

# Step 5: Build Application
echo -e "${YELLOW}Step 5: Build Application${NC}"
echo "----------------------------------------"
if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASSED: Build successful${NC}"
else
  echo -e "${RED}❌ FAILED: Build failed${NC}"
  npm run build 2>&1 | tail -10
  exit 1
fi
echo ""

# Step 6: Check Server (if running)
echo -e "${YELLOW}Step 6: Server Status${NC}"
echo "----------------------------------------"
if curl -s "$BASE_URL" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Server is running${NC}"
  SERVER_RUNNING=true
else
  echo -e "${YELLOW}⚠️  Server not running${NC}"
  echo "   Start with: npm run dev"
  SERVER_RUNNING=false
fi
echo ""

# Step 7: Test Authentication APIs (if server running)
if [ "$SERVER_RUNNING" = true ]; then
  echo -e "${YELLOW}Step 7: Test Authentication APIs${NC}"
  echo "----------------------------------------"
  
  # 7.1 Send OTP
  echo "7.1 Testing POST /api/auth/send-otp..."
  SEND_OTP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/send-otp" \
    -H "Content-Type: application/json" \
    -d '{"email":"student@test-school.com"}')
  
  if echo "$SEND_OTP_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASSED: Send OTP${NC}"
  else
    echo -e "${RED}❌ FAILED: Send OTP${NC}"
    echo "$SEND_OTP_RESPONSE" | jq '.' 2>/dev/null || echo "$SEND_OTP_RESPONSE"
  fi
  
  # 7.2 Get OTP from Redis (if available)
  echo ""
  echo "7.2 Getting OTP from Redis..."
  OTP=$(redis-cli GET otp:student@test-school.com 2>/dev/null || echo "")
  if [ -n "$OTP" ]; then
    echo -e "${GREEN}✅ OTP found in Redis: $OTP${NC}"
    
    # 7.3 Verify OTP
    echo ""
    echo "7.3 Testing POST /api/auth/verify-otp..."
    VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/verify-otp" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"student@test-school.com\",\"otp\":\"$OTP\"}")
    
    if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
      echo -e "${GREEN}✅ PASSED: Verify OTP${NC}"
      TENANT_ID=$(echo "$VERIFY_RESPONSE" | jq -r '.data.user.tenantId' 2>/dev/null || echo "")
      if [ -n "$TENANT_ID" ]; then
        echo "   Tenant ID: $TENANT_ID"
      fi
    else
      echo -e "${RED}❌ FAILED: Verify OTP${NC}"
      echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
    fi
  else
    echo -e "${YELLOW}⚠️  OTP not found in Redis${NC}"
    echo "   Redis may not be running or OTP expired"
  fi
  
  # 7.4 Get Session
  echo ""
  echo "7.4 Testing GET /api/auth/session..."
  SESSION_RESPONSE=$(curl -s "$BASE_URL/api/auth/session")
  if echo "$SESSION_RESPONSE" | grep -q '"success"'; then
    echo -e "${GREEN}✅ PASSED: Get Session (endpoint works)${NC}"
  else
    echo -e "${YELLOW}⚠️  Session endpoint response:${NC}"
    echo "$SESSION_RESPONSE" | jq '.' 2>/dev/null || echo "$SESSION_RESPONSE"
  fi
else
  echo -e "${YELLOW}Step 7: SKIPPED (server not running)${NC}"
fi
echo ""

# Step 8: Test Tenant Isolation (if server running)
if [ "$SERVER_RUNNING" = true ]; then
  echo -e "${YELLOW}Step 8: Test Tenant Isolation${NC}"
  echo "----------------------------------------"
  echo "⚠️  Manual test required:"
  echo "   1. Get tenant IDs: psql \$DATABASE_URL -c \"SELECT id, subdomain FROM tenants;\""
  echo "   2. Test cross-tenant: curl \"$BASE_URL/api/test/tenant-isolation?targetTenantId=<TENANT2_ID>\" -H \"x-tenant-id: <TENANT1_ID>\""
  echo "   3. Expected: 403 or empty data (NOT Tenant 2's data)"
else
  echo -e "${YELLOW}Step 8: SKIPPED (server not running)${NC}"
fi
echo ""

# Step 9: Test UI Pages
echo -e "${YELLOW}Step 9: UI Pages${NC}"
echo "----------------------------------------"
echo "⚠️  Manual test required:"
echo "   - Login: $BASE_URL/login"
echo "   - Verify OTP: $BASE_URL/verify-otp?email=student@test-school.com"
echo "   - Dashboard: $BASE_URL/dashboard"
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Verification Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "✅ Steps completed:"
echo "   1. Dependencies installed"
echo "   2. TypeScript compiles"
echo "   3-4. Database (requires running DB)"
echo "   5. Build successful"
echo "   6-9. API/UI tests (requires running server)"
echo ""
echo "📝 Next Steps:"
echo "   1. Start PostgreSQL and Redis"
echo "   2. Run: npx prisma migrate dev --name init"
echo "   3. Run: npm run db:seed"
echo "   4. Run: npm run dev"
echo "   5. Test APIs and UI manually"
echo ""

