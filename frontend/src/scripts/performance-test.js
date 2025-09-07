import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import fs from 'fs';
// import path from 'path';

// Performance Test Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_PAGES = [
  { path: '/', name: 'Home Page' },
  { path: '/login', name: 'Login Page' },
  { path: '/emr/dashboard', name: 'EMR Dashboard' },
  { path: '/emr/patients', name: 'Patients Page' },
  { path: '/emr/medical-records', name: 'Medical Records' },
  { path: '/emr/appointments', name: 'Appointments' },
  { path: '/admin/dashboard', name: 'Admin Dashboard' }
];

// Lighthouse Configuration
const LIGHTHOUSE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    onlyAudits: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'first-meaningful-paint',
      'speed-index',
      'cumulative-layout-shift',
      'total-blocking-time',
      'interactive',
      'performance-budget',
      'resource-summary',
      'unused-css-rules',
      'unused-javascript',
      'modern-image-formats',
      'uses-optimized-images',
      'uses-text-compression',
      'uses-responsive-images'
    ],
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    }
  }
};

// Results storage
const performanceResults = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  pages: []
};

console.log('🚀 Starting Frontend Performance Testing...');
console.log(`📊 Testing ${TEST_PAGES.length} pages`);
console.log(`🌐 Base URL: ${BASE_URL}`);
console.log('');

async function runLighthouseTest(page) {
  console.log(`🧪 Testing: ${page.name} (${page.path})`);
  
  const url = `${BASE_URL}${page.path}`;
  
  try {
    // Launch Chrome
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
    });
    
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port
    };
    
    // Run Lighthouse
    const runnerResult = await lighthouse(url, options, LIGHTHOUSE_CONFIG);
    
    // Close Chrome
    await chrome.kill();
    
    const lhr = runnerResult.lhr;
    const performanceScore = lhr.categories.performance.score * 100;
    
    // Extract key metrics
    const metrics = {
      performanceScore: Math.round(performanceScore),
      firstContentfulPaint: lhr.audits['first-contentful-paint'].numericValue,
      largestContentfulPaint: lhr.audits['largest-contentful-paint'].numericValue,
      firstMeaningfulPaint: lhr.audits['first-meaningful-paint'].numericValue,
      speedIndex: lhr.audits['speed-index'].numericValue,
      cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].numericValue,
      totalBlockingTime: lhr.audits['total-blocking-time'].numericValue,
      interactive: lhr.audits['interactive'].numericValue
    };
    
    // Extract resource information
    const resourceSummary = lhr.audits['resource-summary'];
    const resources = {
      totalRequests: resourceSummary.details?.items?.[0]?.requestCount || 0,
      totalSize: resourceSummary.details?.items?.[0]?.transferSize || 0,
      totalSizeKB: Math.round((resourceSummary.details?.items?.[0]?.transferSize || 0) / 1024)
    };
    
    const pageResult = {
      page: page.name,
      path: page.path,
      url: url,
      metrics: metrics,
      resources: resources,
      recommendations: []
    };
    
    // Generate recommendations
    if (metrics.performanceScore < 90) {
      pageResult.recommendations.push('Performance score is below 90 - optimize loading');
    }
    if (metrics.firstContentfulPaint > 2000) {
      pageResult.recommendations.push('First Contentful Paint is slow - optimize initial rendering');
    }
    if (metrics.largestContentfulPaint > 4000) {
      pageResult.recommendations.push('Largest Contentful Paint is slow - optimize main content loading');
    }
    if (metrics.cumulativeLayoutShift > 0.1) {
      pageResult.recommendations.push('High Cumulative Layout Shift - fix layout shifts');
    }
    if (metrics.totalBlockingTime > 300) {
      pageResult.recommendations.push('High Total Blocking Time - reduce JavaScript execution time');
    }
    if (resources.totalSizeKB > 1000) {
      pageResult.recommendations.push('Large page size - optimize assets and enable compression');
    }
    
    performanceResults.pages.push(pageResult);
    
    console.log(`✅ ${page.name}:`);
    console.log(`   📊 Performance Score: ${metrics.performanceScore}/100`);
    console.log(`   ⚡ First Contentful Paint: ${Math.round(metrics.firstContentfulPaint)}ms`);
    console.log(`   🎯 Largest Contentful Paint: ${Math.round(metrics.largestContentfulPaint)}ms`);
    console.log(`   📱 Speed Index: ${Math.round(metrics.speedIndex)}ms`);
    console.log(`   🔄 Total Blocking Time: ${Math.round(metrics.totalBlockingTime)}ms`);
    console.log(`   📦 Resources: ${resources.totalRequests} requests, ${resources.totalSizeKB}KB`);
    
    if (pageResult.recommendations.length > 0) {
      console.log(`   ⚠️  Recommendations: ${pageResult.recommendations.length}`);
    }
    
    console.log('');
    
  } catch (error) {
    console.log(`❌ ${page.name}: ${error.message}`);
    performanceResults.pages.push({
      page: page.name,
      path: page.path,
      url: url,
      error: error.message
    });
  }
}

async function runAllPerformanceTests() {
  for (const page of TEST_PAGES) {
    await runLighthouseTest(page);
    // Wait 3 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Generate summary report
  generatePerformanceReport();
}

function generatePerformanceReport() {
  console.log('📊 FRONTEND PERFORMANCE REPORT');
  console.log('='.repeat(50));
  
  const successfulTests = performanceResults.pages.filter(page => !page.error);
  const failedTests = performanceResults.pages.filter(page => page.error);
  
  console.log(`✅ Successful tests: ${successfulTests.length}`);
  console.log(`❌ Failed tests: ${failedTests.length}`);
  console.log('');
  
  if (successfulTests.length > 0) {
    // Calculate average metrics
    const avgPerformanceScore = successfulTests.reduce((sum, page) => sum + page.metrics.performanceScore, 0) / successfulTests.length;
    const avgFCP = successfulTests.reduce((sum, page) => sum + page.metrics.firstContentfulPaint, 0) / successfulTests.length;
    const avgLCP = successfulTests.reduce((sum, page) => sum + page.metrics.largestContentfulPaint, 0) / successfulTests.length;
    const avgTBT = successfulTests.reduce((sum, page) => sum + page.metrics.totalBlockingTime, 0) / successfulTests.length;
    const totalResources = successfulTests.reduce((sum, page) => sum + page.resources.totalSizeKB, 0);
    
    console.log('📈 AVERAGE METRICS:');
    console.log(`   📊 Performance Score: ${avgPerformanceScore.toFixed(1)}/100`);
    console.log(`   ⚡ First Contentful Paint: ${Math.round(avgFCP)}ms`);
    console.log(`   🎯 Largest Contentful Paint: ${Math.round(avgLCP)}ms`);
    console.log(`   🔄 Total Blocking Time: ${Math.round(avgTBT)}ms`);
    console.log(`   📦 Total Resources: ${totalResources}KB`);
    console.log('');
    
    console.log('🏆 TOP PERFORMING PAGES:');
    successfulTests
      .sort((a, b) => b.metrics.performanceScore - a.metrics.performanceScore)
      .slice(0, 3)
      .forEach((page, index) => {
        console.log(`${index + 1}. ${page.page}: ${page.metrics.performanceScore}/100`);
      });
    console.log('');
    
    console.log('⚠️  PAGES NEEDING OPTIMIZATION:');
    successfulTests
      .filter(page => page.metrics.performanceScore < 90)
      .forEach(page => {
        console.log(`   🐌 ${page.page}: ${page.metrics.performanceScore}/100`);
      });
    console.log('');
    
    console.log('💡 OPTIMIZATION RECOMMENDATIONS:');
    const allRecommendations = successfulTests.flatMap(page => page.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    if (uniqueRecommendations.length > 0) {
      uniqueRecommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    } else {
      console.log('   ✅ No major optimization issues found!');
    }
    console.log('');
    
    console.log('🎯 PERFORMANCE TARGETS:');
    console.log('   📊 Performance Score: >90 (Current: ' + avgPerformanceScore.toFixed(1) + ')');
    console.log('   ⚡ First Contentful Paint: <2000ms (Current: ' + Math.round(avgFCP) + 'ms)');
    console.log('   🎯 Largest Contentful Paint: <4000ms (Current: ' + Math.round(avgLCP) + 'ms)');
    console.log('   🔄 Total Blocking Time: <300ms (Current: ' + Math.round(avgTBT) + 'ms)');
  }
  
  if (failedTests.length > 0) {
    console.log('');
    console.log('❌ FAILED TESTS:');
    failedTests.forEach(page => {
      console.log(`   ${page.page}: ${page.error}`);
    });
  }
  
  console.log('');
  console.log('📄 Full results saved to frontend-performance-results.json');
  
  // Save results to file
  fs.writeFileSync(
    'frontend-performance-results.json',
    JSON.stringify(performanceResults, null, 2)
  );
}

// Run the performance tests
runAllPerformanceTests().catch(console.error);
