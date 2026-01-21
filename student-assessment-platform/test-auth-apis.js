/**
 * Authentication API Test Script
 * 
 * Tests the authentication flow:
 * 1. Send OTP
 * 2. Verify OTP (requires manual OTP input)
 * 3. Get Session
 * 
 * Run with: node test-auth-apis.js
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_EMAIL = 'student@test-school.com';

async function testSendOTP() {
  console.log('\n🧪 Test 1: Send OTP');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: TEST_EMAIL }),
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ PASSED: OTP sent successfully');
      return true;
    } else {
      console.log('❌ FAILED: OTP send failed');
      console.log('Error:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ FAILED: Network error');
    console.error(error);
    return false;
  }
}

async function testVerifyOTP(otp) {
  console.log('\n🧪 Test 2: Verify OTP');
  console.log('='.repeat(50));
  
  if (!otp || otp.length !== 6) {
    console.log('⚠️  SKIPPED: Invalid OTP provided');
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: TEST_EMAIL, otp }),
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ PASSED: OTP verified successfully');
      console.log(`User ID: ${data.data?.user?.id}`);
      console.log(`Tenant ID: ${data.data?.user?.tenantId}`);
      return data.data;
    } else {
      console.log('❌ FAILED: OTP verification failed');
      console.log('Error:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ FAILED: Network error');
    console.error(error);
    return false;
  }
}

async function testGetSession() {
  console.log('\n🧪 Test 3: Get Session');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ PASSED: Session retrieved successfully');
      return true;
    } else if (response.status === 401) {
      console.log('⚠️  EXPECTED: No session (not authenticated)');
      return true; // This is expected if not logged in
    } else {
      console.log('❌ FAILED: Session retrieval failed');
      console.log('Error:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ FAILED: Network error');
    console.error(error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Authentication API Tests');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Email: ${TEST_EMAIL}`);
  
  // Test 1: Send OTP
  const otpSent = await testSendOTP();
  
  if (!otpSent) {
    console.log('\n❌ Cannot continue - OTP send failed');
    console.log('💡 Make sure:');
    console.log('   1. Server is running (npm run dev)');
    console.log('   2. Database is seeded (npm run db:seed)');
    console.log('   3. Redis is running');
    process.exit(1);
  }
  
  // Get OTP from user
  console.log('\n📧 OTP has been sent. Check:');
  console.log('   - Email inbox (if email service configured)');
  console.log('   - Redis: redis-cli GET otp:student@test-school.com');
  console.log('   - Console logs (development mode)');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const otp = await new Promise((resolve) => {
    readline.question('\nEnter the 6-digit OTP: ', (answer) => {
      readline.close();
      resolve(answer.trim());
    });
  });
  
  // Test 2: Verify OTP
  const verifyResult = await testVerifyOTP(otp);
  
  // Test 3: Get Session
  await testGetSession();
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`Send OTP: ${otpSent ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Verify OTP: ${verifyResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('Get Session: ⚠️  (Requires NextAuth session)');
  
  if (otpSent && verifyResult) {
    console.log('\n✅ All critical tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);

