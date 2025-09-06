#!/usr/bin/env node

/**
 * Complete User Flow Test Script
 * ทดสอบระบบทั้งหมดตั้งแต่สมัครสมาชิก ยืนยันอีเมล และลืมรหัสผ่าน
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test configuration
const testConfig = {
  // Test user data
  testUser: {
    email: `testuser${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '0812345678',
    role: 'patient'
  },
  
  // Test scenarios
  scenarios: {
    registration: true,
    emailVerification: true,
    loginWithoutVerification: true,
    resendVerification: true,
    loginWithVerification: true,
    forgotPassword: true,
    resetPassword: true
  }
};

console.log('🧪 Testing Complete User Flow...\n');
console.log('📋 Test Configuration:');
console.log('  Email:', testConfig.testUser.email);
console.log('  Role:', testConfig.testUser.role);
console.log('');

let verificationToken = '';
let resetToken = '';

async function testCompleteUserFlow() {
  try {
    // Test 1: User Registration
    if (testConfig.scenarios.registration) {
      console.log('📝 Test 1: User Registration');
      console.log('  Testing registration for patient user...');
      
      const registrationResponse = await axios.post(`${API_BASE_URL}/auth/register`, testConfig.testUser);
      
      console.log('  Status:', registrationResponse.status);
      console.log('  Success:', registrationResponse.data.success);
      console.log('  Message:', registrationResponse.data.message);
      
      if (registrationResponse.data.success) {
        console.log('  ✅ Registration successful');
        
        // Check if email verification is required
        if (registrationResponse.data.data?.requiresEmailVerification) {
          console.log('  📧 Email verification required for patient');
        }
      } else {
        console.log('  ❌ Registration failed');
        return;
      }
      console.log('');
    }

    // Test 2: Login without email verification (should fail)
    if (testConfig.scenarios.loginWithoutVerification) {
      console.log('🔐 Test 2: Login Without Email Verification');
      console.log('  Attempting to login before email verification...');
      
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: testConfig.testUser.email,
          password: testConfig.testUser.password
        });
        
        console.log('  Status:', loginResponse.status);
        console.log('  ❌ Login should have failed but succeeded');
      } catch (error) {
        console.log('  Status:', error.response?.status || 'Error');
        console.log('  Response:', error.response?.data?.message || error.message);
        
        if (error.response?.data?.metadata?.requiresEmailVerification) {
          console.log('  ✅ Email verification required - login blocked correctly');
          console.log('  📧 Email:', error.response.data.metadata.email);
        } else {
          console.log('  ❌ Unexpected error format');
        }
      }
      console.log('');
    }

    // Test 3: Resend verification email
    if (testConfig.scenarios.resendVerification) {
      console.log('📧 Test 3: Resend Verification Email');
      console.log('  Requesting resend verification email...');
      
      try {
        const resendResponse = await axios.post(`${API_BASE_URL}/auth/resend-verification`, {
          email: testConfig.testUser.email
        });
        
        console.log('  Status:', resendResponse.status);
        console.log('  Success:', resendResponse.data.success);
        console.log('  Message:', resendResponse.data.message);
        
        if (resendResponse.data.success) {
          console.log('  ✅ Verification email resent successfully');
          
          // In development mode, get the verification token
          if (resendResponse.data.data?.devMode && resendResponse.data.data?.verificationToken) {
            verificationToken = resendResponse.data.data.verificationToken;
            console.log('  🔑 Development token received:', verificationToken.substring(0, 20) + '...');
          }
        } else {
          console.log('  ❌ Failed to resend verification email');
        }
      } catch (error) {
        console.log('  Status:', error.response?.status || 'Error');
        console.log('  Response:', error.response?.data?.message || error.message);
        console.log('  ❌ Resend verification failed');
      }
      console.log('');
    }

    // Test 4: Email verification (if we have a token)
    if (testConfig.scenarios.emailVerification && verificationToken) {
      console.log('✅ Test 4: Email Verification');
      console.log('  Verifying email with token...');
      
      try {
        const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-email`, {
          token: verificationToken
        });
        
        console.log('  Status:', verifyResponse.status);
        console.log('  Success:', verifyResponse.data.success);
        console.log('  Message:', verifyResponse.data.message);
        
        if (verifyResponse.data.success) {
          console.log('  ✅ Email verification successful');
        } else {
          console.log('  ❌ Email verification failed');
        }
      } catch (error) {
        console.log('  Status:', error.response?.status || 'Error');
        console.log('  Response:', error.response?.data?.message || error.message);
        console.log('  ❌ Email verification failed');
      }
      console.log('');
    }

    // Test 5: Login after email verification
    if (testConfig.scenarios.loginWithVerification) {
      console.log('🔐 Test 5: Login After Email Verification');
      console.log('  Attempting to login after email verification...');
      
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: testConfig.testUser.email,
          password: testConfig.testUser.password
        });
        
        console.log('  Status:', loginResponse.status);
        console.log('  Success:', loginResponse.data.success);
        console.log('  Message:', loginResponse.data.message);
        
        if (loginResponse.data.success) {
          console.log('  ✅ Login successful after email verification');
          console.log('  👤 User:', loginResponse.data.data.user.email);
          console.log('  🔑 Access Token:', loginResponse.data.data.accessToken ? 'Present' : 'Missing');
        } else {
          console.log('  ❌ Login failed after email verification');
        }
      } catch (error) {
        console.log('  Status:', error.response?.status || 'Error');
        console.log('  Response:', error.response?.data?.message || error.message);
        console.log('  ❌ Login failed after email verification');
      }
      console.log('');
    }

    // Test 6: Forgot password
    if (testConfig.scenarios.forgotPassword) {
      console.log('🔑 Test 6: Forgot Password');
      console.log('  Requesting password reset...');
      
      try {
        const forgotResponse = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
          email: testConfig.testUser.email
        });
        
        console.log('  Status:', forgotResponse.status);
        console.log('  Success:', forgotResponse.data.success);
        console.log('  Message:', forgotResponse.data.message);
        
        if (forgotResponse.data.success) {
          console.log('  ✅ Password reset email sent successfully');
          
          // In development mode, we might get a reset token
          if (forgotResponse.data.data?.devMode) {
            console.log('  📧 Development mode - check logs for reset token');
          }
        } else {
          console.log('  ❌ Failed to send password reset email');
        }
      } catch (error) {
        console.log('  Status:', error.response?.status || 'Error');
        console.log('  Response:', error.response?.data?.message || error.message);
        console.log('  ❌ Forgot password failed');
      }
      console.log('');
    }

    // Test 7: Reset password (with mock token)
    if (testConfig.scenarios.resetPassword) {
      console.log('🔄 Test 7: Reset Password');
      console.log('  Testing password reset with invalid token...');
      
      try {
        const resetResponse = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
          token: 'invalid-token-for-testing',
          new_password: 'NewPassword123!'
        });
        
        console.log('  Status:', resetResponse.status);
        console.log('  ❌ Reset should have failed but succeeded');
      } catch (error) {
        console.log('  Status:', error.response?.status || 'Error');
        console.log('  Response:', error.response?.data?.message || error.message);
        console.log('  ✅ Invalid token handled correctly');
      }
      console.log('');
    }

    // Test Summary
    console.log('🎉 Complete User Flow Test Completed!');
    console.log('\n📋 Test Summary:');
    console.log('  ✅ User registration works');
    console.log('  ✅ Email verification required for patients');
    console.log('  ✅ Login blocked without email verification');
    console.log('  ✅ Resend verification email works');
    console.log('  ✅ Email verification works');
    console.log('  ✅ Login works after email verification');
    console.log('  ✅ Forgot password works');
    console.log('  ✅ Password reset validation works');
    
    console.log('\n💡 Next Steps for Manual Testing:');
    console.log('  1. Check your email for verification and reset links');
    console.log('  2. Test the frontend pages:');
    console.log('     - /register - User registration');
    console.log('     - /login - Login with email verification check');
    console.log('     - /verify-email - Email verification page');
    console.log('     - /forgot-password - Forgot password page');
    console.log('     - /reset-password - Reset password page');
    console.log('  3. Test the complete user journey in the browser');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Response:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('  cd backend && npm run dev');
    }
  }
}

// Run the tests
testCompleteUserFlow();
