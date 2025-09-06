const https = require('https');
const http = require('http');

// Test user registration
async function testRegistration() {
  const timestamp = Date.now();
  const testUser = {
    email: `testuser${timestamp}@example.com`,
    password: 'test12345',
    firstName: 'Test',
    lastName: 'User',
    role: 'patient'
  };

  console.log('🧪 Testing user registration...');
  console.log('Test user:', testUser);

  const postData = JSON.stringify(testUser);

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('Response:', JSON.stringify(response, null, 2));
        
        if (response.data && response.data.emailSent) {
          console.log('✅ Registration successful! Email should be sent.');
          if (response.data.devMode) {
            console.log('🔧 Development mode - verification token:', response.data.verificationToken);
          }
        } else {
          console.log('❌ Registration failed or email not sent.');
        }
      } catch (error) {
        console.log('Raw response:', data);
        console.error('Error parsing response:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });

  req.write(postData);
  req.end();
}

testRegistration();
