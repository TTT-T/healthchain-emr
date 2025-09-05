#!/usr/bin/env node

/**
 * API Test Script
 * Tests the complete API flow after cross-layer fixes
 */

import axios from 'axios';
import { config } from '../config/index';

const API_BASE_URL = `http://localhost:${config.server.port}/api`;

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration: number;
}

class APITester {
  private results: TestResult[] = [];

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      this.results.push({
        name,
        status: 'PASS',
        message: 'Test passed',
        duration: Date.now() - startTime
      });
      console.log(`✅ ${name} - PASS (${Date.now() - startTime}ms)`);
    } catch (error) {
      this.results.push({
        name,
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
      console.log(`❌ ${name} - FAIL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testHealthCheck(): Promise<void> {
    const response = await axios.get(`http://localhost:${config.server.port}/health`);
    
    if (response.status !== 200) {
      throw new Error(`Health check returned status ${response.status}`);
    }

    const data = response.data;
    
    // Check new standardized response format
    if (!data.data || !data.data.status) {
      throw new Error('Health check response format is incorrect');
    }

    if (data.data.status !== 'ok') {
      throw new Error(`Health check status is ${data.data.status}, expected 'ok'`);
    }

    if (!data.data.services || !data.data.services.database) {
      throw new Error('Health check missing services information');
    }
  }

  async testCORS(): Promise<void> {
    const response = await axios.options(`${API_BASE_URL}/medical/patients`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization'
      }
    });

    if (response.status !== 200) {
      throw new Error(`CORS preflight returned status ${response.status}`);
    }

    const allowOrigin = response.headers['access-control-allow-origin'];
    if (!allowOrigin) {
      throw new Error('CORS headers missing');
    }
  }

  async testPatientAPI(): Promise<void> {
    // Test patient list endpoint
    const response = await axios.get(`${API_BASE_URL}/medical/patients`, {
      headers: {
        'Authorization': 'Bearer test-token' // This will fail auth but test endpoint structure
      }
    });

    // We expect 401 for auth failure, but endpoint should exist
    if (response.status === 404) {
      throw new Error('Patient endpoint not found - check route configuration');
    }
  }

  async testErrorHandling(): Promise<void> {
    try {
      await axios.get(`${API_BASE_URL}/medical/patients/invalid-id`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Expected auth error
        return;
      }
      throw new Error(`Unexpected error response: ${error.response?.status}`);
    }
  }

  async testResponseFormat(): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/medical/patients`, {
        // Invalid data to test error response format
        invalidField: 'test'
      });
    } catch (error: any) {
      const response = error.response?.data;
      
      if (!response) {
        throw new Error('No response data received');
      }

      // Check standardized error response format
      if (typeof response.data !== 'object' || response.data !== null) {
        throw new Error('Error response data should be null');
      }

      if (!response.error || !response.error.code || !response.error.message) {
        throw new Error('Error response missing required fields');
      }

      if (typeof response.statusCode !== 'number') {
        throw new Error('Error response missing statusCode');
      }
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting API Tests...\n');

    await this.runTest('Health Check', () => this.testHealthCheck());
    await this.runTest('CORS Configuration', () => this.testCORS());
    await this.runTest('Patient API Endpoints', () => this.testPatientAPI());
    await this.runTest('Error Handling', () => this.testErrorHandling());
    await this.runTest('Response Format', () => this.testResponseFormat());

    this.printSummary();
  }

  printSummary(): void {
    console.log('\n📊 Test Summary');
    console.log('================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.message}`);
        });
    }
    
    console.log('\n⏱️ Performance:');
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    console.log(`Average Response Time: ${avgDuration.toFixed(1)}ms`);
    
    const slowest = this.results.reduce((max, r) => r.duration > max.duration ? r : max);
    console.log(`Slowest Test: ${slowest.name} (${slowest.duration}ms)`);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new APITester();
  tester.runAllTests().catch(console.error);
}

export { APITester };
