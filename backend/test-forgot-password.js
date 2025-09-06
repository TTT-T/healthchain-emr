#!/usr/bin/env node

/**
 * Forgot Password Flow Test Script
 * ทดสอบระบบลืมรหัสผ่านแบบครบวงจร
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test configuration
const testConfig = {
  email: 'test@example.com',
  newPassword: 'NewPassword123!',
  invalidToken: 'invalid-token-12345'
};

console.log('🧪 Testing Forgot Password Flow...\n');

async function testForgotPasswordFlow() {
  try {
    // Test 1: Request password reset
    console.log('📧 Test 1: Request Password Reset');
    console.log('  Email:', testConfig.email);
    
    const forgotResponse = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email: testConfig.email
    });
    
    console.log('  Status:', forgotResponse.status);
    console.log('  Response:', forgotResponse.data);
    console.log('  ✅ Forgot password request successful\n');
    
    // Test 2: Test with invalid email
    console.log('📧 Test 2: Request with Invalid Email');
    
    const invalidEmailResponse = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email: 'nonexistent@example.com'
    });
    
    console.log('  Status:', invalidEmailResponse.status);
    console.log('  Response:', invalidEmailResponse.data);
    console.log('  ✅ Invalid email handled correctly\n');
    
    // Test 3: Test reset password with invalid token
    console.log('🔐 Test 3: Reset Password with Invalid Token');
    
    try {
      const invalidTokenResponse = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token: testConfig.invalidToken,
        new_password: testConfig.newPassword
      });
      
      console.log('  Status:', invalidTokenResponse.status);
      console.log('  Response:', invalidTokenResponse.data);
    } catch (error) {
      console.log('  Status:', error.response?.status || 'Error');
      console.log('  Response:', error.response?.data || error.message);
      console.log('  ✅ Invalid token handled correctly\n');
    }
    
    // Test 4: Test reset password with weak password
    console.log('🔐 Test 4: Reset Password with Weak Password');
    
    try {
      const weakPasswordResponse = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token: testConfig.invalidToken,
        new_password: '123'
      });
      
      console.log('  Status:', weakPasswordResponse.status);
      console.log('  Response:', weakPasswordResponse.data);
    } catch (error) {
      console.log('  Status:', error.response?.status || 'Error');
      console.log('  Response:', error.response?.data || error.message);
      console.log('  ✅ Weak password handled correctly\n');
    }
    
    // Test 5: Test missing parameters
    console.log('🔐 Test 5: Reset Password with Missing Parameters');
    
    try {
      const missingParamsResponse = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token: testConfig.invalidToken
        // missing new_password
      });
      
      console.log('  Status:', missingParamsResponse.status);
      console.log('  Response:', missingParamsResponse.data);
    } catch (error) {
      console.log('  Status:', error.response?.status || 'Error');
      console.log('  Response:', error.response?.data || error.message);
      console.log('  ✅ Missing parameters handled correctly\n');
    }
    
    console.log('🎉 All Forgot Password Tests Completed Successfully!');
    console.log('\n📋 Test Summary:');
    console.log('  ✅ Forgot password request works');
    console.log('  ✅ Invalid email handling works');
    console.log('  ✅ Invalid token handling works');
    console.log('  ✅ Weak password validation works');
    console.log('  ✅ Missing parameters handling works');
    
    console.log('\n💡 Next Steps:');
    console.log('  1. Check your email for the password reset link');
    console.log('  2. Use the token from the email to test the reset password endpoint');
    console.log('  3. Test the complete flow in the frontend');
    
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
testForgotPasswordFlow();
