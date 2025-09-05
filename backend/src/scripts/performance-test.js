const autocannon = require('autocannon');
const { performance } = require('perf_hooks');

// Performance Test Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_DURATION = 30; // seconds
const CONCURRENT_CONNECTIONS = 10;

// Test endpoints
const ENDPOINTS = [
  { path: '/api/health', method: 'GET', name: 'Health Check' },
  { path: '/api/auth/login', method: 'POST', name: 'Login', body: { email: 'test@example.com', password: 'password123' } },
  { path: '/api/patients', method: 'GET', name: 'Get Patients' },
  { path: '/api/medical/records', method: 'GET', name: 'Get Medical Records' },
  { path: '/api/appointments', method: 'GET', name: 'Get Appointments' },
  { path: '/api/ai/risk-assessment', method: 'POST', name: 'AI Risk Assessment', body: { patientId: '1' } },
  { path: '/api/consent/contracts', method: 'GET', name: 'Get Consent Contracts' }
];

// Performance Test Results
const results = {
  timestamp: new Date().toISOString(),
  server: BASE_URL,
  tests: []
};

console.log('🚀 Starting Performance Testing...');
console.log(`📊 Testing ${ENDPOINTS.length} endpoints`);
console.log(`⏱️  Duration: ${TEST_DURATION} seconds per endpoint`);
console.log(`👥 Concurrent connections: ${CONCURRENT_CONNECTIONS}`);
console.log('');

async function runPerformanceTest(endpoint) {
  console.log(`🧪 Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
  
  const startTime = performance.now();
  
  try {
    const result = await autocannon({
      url: `${BASE_URL}${endpoint.path}`,
      method: endpoint.method,
      body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Mock token for testing
      },
      connections: CONCURRENT_CONNECTIONS,
      duration: TEST_DURATION,
      timeout: 10
    });

    const endTime = performance.now();
    const testDuration = endTime - startTime;

    const testResult = {
      endpoint: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      duration: testDuration,
      requests: {
        total: result.requests.total,
        average: result.requests.average,
        min: result.requests.min,
        max: result.requests.max
      },
      latency: {
        average: result.latency.average,
        min: result.latency.min,
        max: result.latency.max,
        p50: result.latency.p50,
        p90: result.latency.p90,
        p99: result.latency.p99
      },
      throughput: {
        average: result.throughput.average,
        min: result.throughput.min,
        max: result.throughput.max
      },
      errors: result.errors,
      timeouts: result.timeouts,
      non2xx: result.non2xx
    };

    results.tests.push(testResult);

    console.log(`✅ ${endpoint.name}:`);
    console.log(`   📈 Requests: ${result.requests.total} (avg: ${result.requests.average}/sec)`);
    console.log(`   ⚡ Latency: ${result.latency.average}ms (p90: ${result.latency.p90}ms)`);
    console.log(`   🔄 Throughput: ${result.throughput.average} bytes/sec`);
    console.log(`   ❌ Errors: ${result.errors}`);
    console.log('');

  } catch (error) {
    console.log(`❌ ${endpoint.name}: ${error.message}`);
    results.tests.push({
      endpoint: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      error: error.message
    });
  }
}

async function runAllTests() {
  for (const endpoint of ENDPOINTS) {
    await runPerformanceTest(endpoint);
    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Generate summary report
  generateSummaryReport();
}

function generateSummaryReport() {
  console.log('📊 PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(50));
  
  const successfulTests = results.tests.filter(test => !test.error);
  const failedTests = results.tests.filter(test => test.error);
  
  console.log(`✅ Successful tests: ${successfulTests.length}`);
  console.log(`❌ Failed tests: ${failedTests.length}`);
  console.log('');

  if (successfulTests.length > 0) {
    console.log('🏆 TOP PERFORMING ENDPOINTS:');
    successfulTests
      .sort((a, b) => a.latency.average - b.latency.average)
      .slice(0, 3)
      .forEach((test, index) => {
        console.log(`${index + 1}. ${test.endpoint}: ${test.latency.average}ms avg latency`);
      });
    console.log('');

    console.log('📈 AVERAGE METRICS:');
    const avgLatency = successfulTests.reduce((sum, test) => sum + test.latency.average, 0) / successfulTests.length;
    const avgThroughput = successfulTests.reduce((sum, test) => sum + test.throughput.average, 0) / successfulTests.length;
    const totalRequests = successfulTests.reduce((sum, test) => sum + test.requests.total, 0);
    
    console.log(`   ⚡ Average Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`   🔄 Average Throughput: ${avgThroughput.toFixed(2)} bytes/sec`);
    console.log(`   📊 Total Requests: ${totalRequests}`);
    console.log('');

    console.log('⚠️  PERFORMANCE WARNINGS:');
    successfulTests.forEach(test => {
      if (test.latency.average > 1000) {
        console.log(`   🐌 ${test.endpoint}: High latency (${test.latency.average}ms)`);
      }
      if (test.errors > 0) {
        console.log(`   ❌ ${test.endpoint}: ${test.errors} errors`);
      }
      if (test.non2xx > 0) {
        console.log(`   ⚠️  ${test.endpoint}: ${test.non2xx} non-2xx responses`);
      }
    });
  }

  if (failedTests.length > 0) {
    console.log('');
    console.log('❌ FAILED TESTS:');
    failedTests.forEach(test => {
      console.log(`   ${test.endpoint}: ${test.error}`);
    });
  }

  console.log('');
  console.log('📄 Full results saved to performance-results.json');
  
  // Save results to file
  require('fs').writeFileSync(
    'performance-results.json',
    JSON.stringify(results, null, 2)
  );
}

// Run the performance tests
runAllTests().catch(console.error);
