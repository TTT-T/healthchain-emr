const autocannon = require('autocannon');
const { performance } = require('perf_hooks');

// Concurrent Users Test Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_SCENARIOS = [
  { name: 'Light Load', connections: 10, duration: 30 },
  { name: 'Medium Load', connections: 50, duration: 30 },
  { name: 'Heavy Load', connections: 100, duration: 30 },
  { name: 'Stress Test', connections: 200, duration: 60 }
];

// Test endpoints for concurrent testing
const CONCURRENT_ENDPOINTS = [
  { path: '/api/health', method: 'GET', name: 'Health Check' },
  { path: '/api/patients', method: 'GET', name: 'Get Patients' },
  { path: '/api/medical/records', method: 'GET', name: 'Get Medical Records' },
  { path: '/api/appointments', method: 'GET', name: 'Get Appointments' }
];

// Results storage
const concurrentResults = {
  timestamp: new Date().toISOString(),
  server: BASE_URL,
  scenarios: []
};

console.log('🚀 Starting Concurrent Users Performance Testing...');
console.log(`📊 Testing ${TEST_SCENARIOS.length} load scenarios`);
console.log(`🎯 Endpoints: ${CONCURRENT_ENDPOINTS.length}`);
console.log('');

async function runConcurrentTest(scenario, endpoint) {
  console.log(`🧪 ${scenario.name} - ${endpoint.name} (${scenario.connections} connections, ${scenario.duration}s)`);
  
  const startTime = performance.now();
  
  try {
    const result = await autocannon({
      url: `${BASE_URL}${endpoint.path}`,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      connections: scenario.connections,
      duration: scenario.duration,
      timeout: 30,
      requests: [
        {
          method: endpoint.method,
          path: endpoint.path,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        }
      ]
    });

    const endTime = performance.now();
    const testDuration = endTime - startTime;

    const testResult = {
      scenario: scenario.name,
      endpoint: endpoint.name,
      connections: scenario.connections,
      duration: scenario.duration,
      actualDuration: testDuration,
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
      non2xx: result.non2xx,
      successRate: ((result.requests.total - result.errors - result.non2xx) / result.requests.total * 100).toFixed(2)
    };

    console.log(`✅ ${scenario.name} - ${endpoint.name}:`);
    console.log(`   📈 Requests: ${result.requests.total} (${result.requests.average}/sec)`);
    console.log(`   ⚡ Latency: ${result.latency.average}ms (p90: ${result.latency.p90}ms)`);
    console.log(`   🎯 Success Rate: ${testResult.successRate}%`);
    console.log(`   ❌ Errors: ${result.errors} (${result.timeouts} timeouts)`);
    console.log('');

    return testResult;

  } catch (error) {
    console.log(`❌ ${scenario.name} - ${endpoint.name}: ${error.message}`);
    return {
      scenario: scenario.name,
      endpoint: endpoint.name,
      connections: scenario.connections,
      duration: scenario.duration,
      error: error.message
    };
  }
}

async function runAllConcurrentTests() {
  for (const scenario of TEST_SCENARIOS) {
    console.log(`🔥 Running ${scenario.name} Scenario (${scenario.connections} concurrent users)`);
    console.log('='.repeat(60));
    
    const scenarioResults = [];
    
    for (const endpoint of CONCURRENT_ENDPOINTS) {
      const result = await runConcurrentTest(scenario, endpoint);
      scenarioResults.push(result);
      
      // Wait 5 seconds between endpoint tests
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    concurrentResults.scenarios.push({
      scenario: scenario.name,
      connections: scenario.connections,
      duration: scenario.duration,
      results: scenarioResults
    });
    
    console.log(`✅ ${scenario.name} scenario completed`);
    console.log('');
    
    // Wait 10 seconds between scenarios
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  // Generate comprehensive report
  generateConcurrentReport();
}

function generateConcurrentReport() {
  console.log('📊 CONCURRENT USERS PERFORMANCE REPORT');
  console.log('='.repeat(60));
  
  concurrentResults.scenarios.forEach(scenario => {
    console.log(`🔥 ${scenario.scenario} (${scenario.connections} users):`);
    
    const successfulTests = scenario.results.filter(r => !r.error);
    const failedTests = scenario.results.filter(r => r.error);
    
    if (successfulTests.length > 0) {
      const avgLatency = successfulTests.reduce((sum, r) => sum + r.latency.average, 0) / successfulTests.length;
      const avgSuccessRate = successfulTests.reduce((sum, r) => sum + parseFloat(r.successRate), 0) / successfulTests.length;
      const totalRequests = successfulTests.reduce((sum, r) => sum + r.requests.total, 0);
      const totalErrors = successfulTests.reduce((sum, r) => sum + r.errors, 0);
      
      console.log(`   📈 Total Requests: ${totalRequests}`);
      console.log(`   ⚡ Average Latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`   🎯 Average Success Rate: ${avgSuccessRate.toFixed(2)}%`);
      console.log(`   ❌ Total Errors: ${totalErrors}`);
      
      // Performance assessment
      if (avgSuccessRate >= 99 && avgLatency < 100) {
        console.log(`   ✅ EXCELLENT: High success rate, low latency`);
      } else if (avgSuccessRate >= 95 && avgLatency < 500) {
        console.log(`   ✅ GOOD: Acceptable performance`);
      } else if (avgSuccessRate >= 90 && avgLatency < 1000) {
        console.log(`   ⚠️  FAIR: Performance degradation under load`);
      } else {
        console.log(`   ❌ POOR: Significant performance issues`);
      }
    }
    
    if (failedTests.length > 0) {
      console.log(`   ❌ Failed Tests: ${failedTests.length}`);
      failedTests.forEach(test => {
        console.log(`      - ${test.endpoint}: ${test.error}`);
      });
    }
    
    console.log('');
  });

  // Overall recommendations
  console.log('🎯 PERFORMANCE RECOMMENDATIONS:');
  
  const allResults = concurrentResults.scenarios.flatMap(s => s.results).filter(r => !r.error);
  const maxConnections = Math.max(...TEST_SCENARIOS.map(s => s.connections));
  const stressTestResults = concurrentResults.scenarios.find(s => s.scenario === 'Stress Test');
  
  if (stressTestResults) {
    const stressSuccessRate = stressTestResults.results
      .filter(r => !r.error)
      .reduce((sum, r) => sum + parseFloat(r.successRate), 0) / stressTestResults.results.filter(r => !r.error).length;
    
    if (stressSuccessRate >= 95) {
      console.log('   ✅ System handles high load well');
    } else {
      console.log('   ⚠️  System struggles under high load - consider scaling');
    }
  }
  
  const avgLatency = allResults.reduce((sum, r) => sum + r.latency.average, 0) / allResults.length;
  if (avgLatency > 500) {
    console.log('   ⚠️  High average latency - optimize database queries and caching');
  }
  
  const totalErrors = allResults.reduce((sum, r) => sum + r.errors, 0);
  if (totalErrors > 0) {
    console.log('   ⚠️  Some requests failed - check error handling and resource limits');
  }
  
  console.log('   💡 Consider implementing:');
  console.log('      - Database connection pooling');
  console.log('      - Redis caching for frequently accessed data');
  console.log('      - Load balancing for multiple server instances');
  console.log('      - CDN for static assets');
  
  console.log('');
  console.log('📄 Full results saved to concurrent-users-results.json');
  
  // Save results to file
  require('fs').writeFileSync(
    'concurrent-users-results.json',
    JSON.stringify(concurrentResults, null, 2)
  );
}

// Run the concurrent users tests
runAllConcurrentTests().catch(console.error);
