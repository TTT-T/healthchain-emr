// Debug Authentication Script
// Run this in browser console to debug auth issues

console.log('=== Authentication Debug ===');

// Check token storage
function checkTokenStorage() {
    console.log('--- Token Storage Check ---');
    
    // Check localStorage
    const localToken = localStorage.getItem('access_token');
    console.log('localStorage token:', localToken ? 'EXISTS' : 'NOT FOUND');
    if (localToken) {
        console.log('Token preview:', localToken.substring(0, 50) + '...');
        
        // Decode JWT token (without verification)
        try {
            const payload = JSON.parse(atob(localToken.split('.')[1]));
            console.log('Token payload:', payload);
            console.log('Token expires:', new Date(payload.exp * 1000));
            console.log('Token expired:', new Date() > new Date(payload.exp * 1000));
        } catch (e) {
            console.log('Token decode error:', e);
        }
    }
    
    // Check sessionStorage
    const sessionToken = sessionStorage.getItem('access_token');
    console.log('sessionStorage token:', sessionToken ? 'EXISTS' : 'NOT FOUND');
    
    // Check cookies
    const cookies = document.cookie;
    console.log('Cookies:', cookies);
    
    // Check rememberMe preference
    const rememberMe = localStorage.getItem('rememberMe');
    console.log('Remember Me:', rememberMe);
}

// Test API call
async function testAPICall() {
    console.log('--- API Call Test ---');
    
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    
    if (!token) {
        console.log('ERROR: No token found for API call');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3001/api/auth/profile', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('API Response Status:', response.status);
        console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('API Response Data:', data);
        
        if (response.status === 401) {
            console.log('401 Error - Possible causes:');
            console.log('1. Token expired');
            console.log('2. Token invalid');
            console.log('3. User account inactive');
            console.log('4. Token not sent properly');
        }
        
    } catch (error) {
        console.log('API Call Error:', error.message);
    }
}

// Test login
async function testLogin() {
    console.log('--- Login Test ---');
    
    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });
        
        console.log('Login Response Status:', response.status);
        const data = await response.json();
        console.log('Login Response Data:', data);
        
    } catch (error) {
        console.log('Login Error:', error.message);
    }
}

// Run all tests
checkTokenStorage();
testAPICall();
testLogin();

console.log('=== Debug Complete ===');
