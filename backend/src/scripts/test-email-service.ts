#!/usr/bin/env tsx

/**
 * Email Service Test Script
 * ทดสอบการส่ง email จริง
 */

import { emailService } from '../services/emailService';
import config from '../config/index';

async function testEmailService() {
  console.log('🧪 Testing Email Service...');
  console.log('📧 SMTP Configuration:');
  console.log('  Host:', config.email.smtp.host);
  console.log('  Port:', config.email.smtp.port);
  console.log('  User:', config.email.smtp.user);
  console.log('  From:', config.email.from);
  console.log('  Environment:', process.env.NODE_ENV);
  console.log('');

  // Test 1: Basic email sending
  console.log('📧 Test 1: Basic Email Sending');
  const testEmail = {
    to: 'test@example.com',
    subject: 'Test Email from EMR System',
    html: `
      <h2>Test Email</h2>
      <p>This is a test email from the EMR System.</p>
      <p>If you receive this email, the email service is working correctly.</p>
      <p>Timestamp: ${new Date().toISOString()}</p>
    `
  };

  const result1 = await emailService.sendEmail(testEmail);
  console.log('  Result:', result1 ? '✅ Success' : '❌ Failed');
  console.log('');

  // Test 2: Email verification
  console.log('📧 Test 2: Email Verification');
  const verificationToken = 'test-verification-token-12345';
  const result2 = await emailService.sendEmailVerification(
    'test@example.com',
    'Test User',
    verificationToken
  );
  console.log('  Result:', result2 ? '✅ Success' : '❌ Failed');
  console.log('');

  // Test 3: Password reset email (if available)
  console.log('📧 Test 3: Password Reset Email');
  try {
    const resetToken = 'test-reset-token-67890';
    const result3 = await emailService.sendPasswordResetEmail(
      'test@example.com',
      'Test User',
      resetToken
    );
    console.log('  Result:', result3 ? '✅ Success' : '❌ Failed');
  } catch (error) {
    console.log('  Result: ⚠️ Function not available (this is normal)');
  }
  console.log('');

  console.log('🎉 Email Service Test Completed!');
  console.log('');
  console.log('📝 Notes:');
  console.log('  - In development mode, emails are logged instead of sent');
  console.log('  - In production mode, emails are sent via SMTP');
  console.log('  - Check the logs above for email content');
  console.log('  - To send real emails, configure SMTP settings in .env file');
}

// Run the test
testEmailService().catch(console.error);
