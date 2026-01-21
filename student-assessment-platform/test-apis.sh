#!/bin/bash

# API Testing Script
# Tests the authentication APIs and tenant isolation

BASE_URL="http://localhost:3000"
EMAIL="student@test-school.com"

echo "🧪 Testing Authentication APIs"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Send OTP
echo "1️⃣  Testing POST /api/auth/send-otp"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q "success.*true"; then
  echo -e "${GREEN}✅ Send OTP: PASSED${NC}"
else
  echo -e "${RED}❌ Send OTP: FAILED${NC}"
fi
echo ""

# Test 2: Get OTP from Redis (for testing)
echo "2️⃣  Testing OTP retrieval (manual step)"
echo "-----------------------------------"
echo "Check your email or Redis for the OTP code"
echo "Then run: curl -X POST $BASE_URL/api/auth/verify-otp -H 'Content-Type: application/json' -d '{\"email\":\"$EMAIL\",\"otp\":\"YOUR_OTP\"}'"
echo ""

# Test 3: Verify OTP (requires manual OTP input)
echo "3️⃣  Testing POST /api/auth/verify-otp"
echo "-----------------------------------"
echo -e "${YELLOW}⚠️  Manual test required - enter OTP from email/Redis${NC}"
read -p "Enter OTP: " OTP

RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"otp\":\"$OTP\"}")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q "success.*true"; then
  echo -e "${GREEN}✅ Verify OTP: PASSED${NC}"
  TOKEN=$(echo "$RESPONSE" | jq -r '.data.user.id' 2>/dev/null)
  TENANT_ID=$(echo "$RESPONSE" | jq -r '.data.user.tenantId' 2>/dev/null)
  echo "User ID: $TOKEN"
  echo "Tenant ID: $TENANT_ID"
else
  echo -e "${RED}❌ Verify OTP: FAILED${NC}"
fi
echo ""

# Test 4: Get Session
echo "4️⃣  Testing GET /api/auth/session"
echo "-----------------------------------"
echo -e "${YELLOW}⚠️  Requires NextAuth session (may need to use NextAuth endpoints)${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/session" \
  -H "Cookie: next-auth.session-token=test")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 5: Tenant Isolation Test
echo "5️⃣  Testing Tenant Isolation"
echo "-----------------------------------"
echo "This test verifies that users cannot access data from other tenants"
echo "See __tests__/tenant-isolation.test.ts for automated tests"
echo ""

echo "✅ API Testing Complete!"
echo ""
echo "📝 Next Steps:"
echo "  1. Verify all responses have correct structure"
echo "  2. Test tenant isolation manually"
echo "  3. Check UI pages load correctly"

