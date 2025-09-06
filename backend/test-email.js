const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🔧 Testing Email Configuration...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'Set' : 'Not Set');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test email sending
async function testEmail() {
  try {
    console.log('\n📧 Testing email sending...');
    
    const info = await transporter.sendMail({
      from: `"HealthChain EMR" <${process.env.EMAIL_FROM}>`,
      to: 'test@example.com',
      subject: '🏥 HealthChain - Test Email',
      html: `
        <h2>Test Email from HealthChain EMR</h2>
        <p>This is a test email to verify email configuration.</p>
        <p>If you receive this email, the email service is working correctly!</p>
        <p>Time: ${new Date().toISOString()}</p>
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('1. SMTP_USER and SMTP_PASSWORD are correct');
      console.log('2. Use App Password for Gmail (not regular password)');
      console.log('3. Enable 2-Factor Authentication in Gmail');
    }
    
    if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Please check:');
      console.log('1. SMTP_HOST and SMTP_PORT are correct');
      console.log('2. Internet connection is working');
      console.log('3. Firewall is not blocking the connection');
    }
  }
}

// Test connection first
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP connection failed:', error.message);
  } else {
    console.log('✅ SMTP connection successful!');
    testEmail();
  }
});
