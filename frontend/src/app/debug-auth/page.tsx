"use client";

import { useState } from 'react';
import { apiClient } from '@/lib/api';

export default function DebugAuth() {
  const [testResults, setTestResults] = useState<any[]>([]);

  const addResult = (test: string, result: any) => {
    setTestResults(prev => [...prev, { test, result, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testTokenOperations = () => {
    // Test 1: Get current token
    const currentToken = apiClient.getAccessToken();
    addResult('Get Current Token', currentToken ? currentToken.substring(0, 30) + '...' : 'null');

    // Test 2: Set a test token
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
    apiClient.setAccessToken(testToken);
    addResult('Set Test Token', 'Set test token');

    // Test 3: Verify token was set
    const retrievedToken = apiClient.getAccessToken();
    addResult('Retrieve After Set', retrievedToken === testToken ? 'Success' : 'Failed');

    // Test 4: Check cookies directly
    const allCookies = document.cookie;
    addResult('All Cookies', allCookies);

    // Test 5: Clear tokens
    apiClient.clearTokens();
    addResult('Clear Tokens', 'Cleared');

    // Test 6: Verify tokens were cleared
    const tokenAfterClear = apiClient.getAccessToken();
    addResult('Token After Clear', tokenAfterClear || 'null');
  };

  const testAPICall = async () => {
    try {
      // First, login to get a real token
      const loginResponse = await apiClient.login({
        username: 'manualtest@example.com',
        password: 'ManualTest123!'
      });
      addResult('Login Response', loginResponse.statusCode === 200 ? 'Success' : 'Failed');

      // Check if token was stored
      const tokenAfterLogin = apiClient.getAccessToken();
      addResult('Token After Login', tokenAfterLogin ? tokenAfterLogin.substring(0, 30) + '...' : 'null');

      // Make a profile setup call
      const profileResponse = await apiClient.setupProfile({
        thai_name: 'Debug Test',
        phone: '1234567890',
        emergency_contact: 'Debug Emergency',
        address: 'Debug Address'
      });
      addResult('Profile Setup Response', profileResponse.statusCode === 200 ? 'Success' : 'Failed');

    } catch (error) {
      addResult('API Call Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={testTokenOperations}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Token Operations
          </button>
          
          <button
            onClick={testAPICall}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test API Call Flow
          </button>
          
          <button
            onClick={() => setTestResults([])}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Results
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="font-medium text-gray-900">{result.test}</div>
                <div className="text-sm text-gray-600">{result.timestamp}</div>
                <div className="text-sm bg-gray-100 p-2 rounded mt-1 font-mono">
                  {typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
