#!/usr/bin/env node

/**
 * FRONTEND SECURITY & BUSINESS LOGIC AUDIT
 * 
 * This script audits the frontend code for security vulnerabilities,
 * business logic flaws, and potential edge cases.
 */

import fs from 'fs';
import path from 'path';

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

const log = (message, color = 'white') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
};

let TOTAL_ISSUES = 0;
let CRITICAL_ISSUES = 0;
let HIGH_ISSUES = 0;
let MEDIUM_ISSUES = 0;

const reportIssue = (severity, component, issue, details = '') => {
  TOTAL_ISSUES++;
  
  const severityColors = {
    'CRITICAL': 'red',
    'HIGH': 'red',
    'MEDIUM': 'yellow',
    'LOW': 'blue'
  };
  
  const severityIcons = {
    'CRITICAL': '🚨',
    'HIGH': '❌',
    'MEDIUM': '⚠️',
    'LOW': 'ℹ️'
  };
  
  if (severity === 'CRITICAL') CRITICAL_ISSUES++;
  else if (severity === 'HIGH') HIGH_ISSUES++;
  else if (severity === 'MEDIUM') MEDIUM_ISSUES++;
  
  log(`${severityIcons[severity]} ${severity}: ${component} - ${issue}`, severityColors[severity]);
  if (details) log(`   ${details}`, 'white');
};

// Recursively read all JS/JSX files
const getAllJSFiles = (dir) => {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
      files.push(...getAllJSFiles(fullPath));
    } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
};

// Security Pattern Analysis
const analyzeSecurityPatterns = () => {
  logSection('🔒 FRONTEND SECURITY PATTERN ANALYSIS');
  
  const ladderFiles = getAllJSFiles('./src/components/ladder');
  const authFiles = getAllJSFiles('./src/components/auth');
  const allFiles = [...ladderFiles, ...authFiles];
  
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    // Check for direct user input in URLs
    if (content.includes('${') && content.includes('encodeURIComponent')) {
      const matches = content.match(/\$\{[^}]*\}/g) || [];
      for (const match of matches) {
        if (!content.includes(`encodeURIComponent(${match.slice(2, -1)})`)) {
          reportIssue('HIGH', fileName, 'Potential XSS in URL construction', 
            `Found ${match} without proper encoding`);
        }
      }
    }
    
    // Check for innerHTML usage (XSS risk)
    if (content.includes('innerHTML') || content.includes('dangerouslySetInnerHTML')) {
      reportIssue('CRITICAL', fileName, 'XSS Vulnerability - innerHTML usage',
        'Using innerHTML with user data can lead to XSS attacks');
    }
    
    // Check for eval or Function constructor
    if (content.includes('eval(') || content.includes('new Function')) {
      reportIssue('CRITICAL', fileName, 'Code Injection Vulnerability',
        'eval() or Function constructor detected');
    }
    
    // Check for sensitive data in localStorage/sessionStorage
    if (content.includes('localStorage') || content.includes('sessionStorage')) {
      const storageMatches = content.match(/(localStorage|sessionStorage)\.setItem\([^)]+\)/g) || [];
      for (const match of storageMatches) {
        if (match.toLowerCase().includes('password') || 
            match.toLowerCase().includes('token') ||
            match.toLowerCase().includes('secret')) {
          reportIssue('HIGH', fileName, 'Sensitive data in browser storage',
            `Found: ${match}`);
        }
      }
    }
    
    // Check for hardcoded credentials or API keys
    const credentialPatterns = [
      /password\s*[:=]\s*['"]/i,
      /api[_-]?key\s*[:=]\s*['"]/i,
      /secret\s*[:=]\s*['"]/i,
      /token\s*[:=]\s*['"]/i
    ];
    
    for (const pattern of credentialPatterns) {
      if (pattern.test(content)) {
        reportIssue('CRITICAL', fileName, 'Hardcoded credentials detected',
          'Credentials should not be hardcoded in source code');
      }
    }
  }
};

// Business Logic Analysis
const analyzeBusinessLogic = () => {
  logSection('🧠 BUSINESS LOGIC ANALYSIS');
  
  // Analyze LadderApp.jsx for business logic flaws
  const ladderAppPath = './src/components/ladder/LadderApp.jsx';
  if (fs.existsSync(ladderAppPath)) {
    const content = fs.readFileSync(ladderAppPath, 'utf8');
    
    // Check for race conditions in challenge handling
    if (content.includes('setSelectedDefender') && content.includes('setShowChallengeModal')) {
      if (!content.includes('useCallback') && !content.includes('useMemo')) {
        reportIssue('MEDIUM', 'LadderApp.jsx', 'Potential race condition in challenge flow',
          'State updates without proper dependencies could cause race conditions');
      }
    }
    
    // Check for proper error boundaries
    if (!content.includes('ErrorBoundary') && !content.includes('componentDidCatch')) {
      reportIssue('HIGH', 'LadderApp.jsx', 'Missing error boundaries',
        'Complex component without error boundaries can crash entire app');
    }
    
    // Check for memory leaks (event listeners, intervals)
    const intervalMatches = content.match(/setInterval|setTimeout/g) || [];
    const cleanupMatches = content.match(/clearInterval|clearTimeout/g) || [];
    
    if (intervalMatches.length > cleanupMatches.length) {
      reportIssue('MEDIUM', 'LadderApp.jsx', 'Potential memory leak',
        'More intervals/timeouts created than cleaned up');
    }
    
    // Check for infinite loop risks in useEffect
    const useEffectMatches = content.match(/useEffect\([^,]+,\s*\[[^\]]*\]/g) || [];
    for (const match of useEffectMatches) {
      if (match.includes('[]')) continue; // Empty deps is OK
      
      const deps = match.match(/\[([^\]]*)\]/)[1];
      if (deps.includes('state') && !deps.includes('...')) {
        reportIssue('MEDIUM', 'LadderApp.jsx', 'Potential infinite loop in useEffect',
          `Effect with state dependency: ${match.substring(0, 50)}...`);
      }
    }
  }
  
  // Analyze Challenge Modal for logic issues
  const challengeModalPath = './src/components/ladder/LadderChallengeModal.jsx';
  if (fs.existsSync(challengeModalPath)) {
    const content = fs.readFileSync(challengeModalPath, 'utf8');
    
    // Check for input validation before API calls
    if (content.includes('fetch(') && !content.includes('if (') && !content.includes('validation')) {
      reportIssue('HIGH', 'LadderChallengeModal.jsx', 'Missing input validation',
        'API calls without proper input validation can cause server errors');
    }
    
    // Check for proper error handling in async operations
    const asyncMatches = content.match(/async\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g) || [];
    for (const asyncFunc of asyncMatches) {
      if (!asyncFunc.includes('try') || !asyncFunc.includes('catch')) {
        reportIssue('MEDIUM', 'LadderChallengeModal.jsx', 'Unhandled async errors',
          'Async functions without try/catch can cause unhandled rejections');
      }
    }
  }
};

// Data Flow Analysis
const analyzeDataFlow = () => {
  logSection('🔄 DATA FLOW & STATE MANAGEMENT ANALYSIS');
  
  const ladderFiles = getAllJSFiles('./src/components/ladder');
  
  // Check for prop drilling
  let maxPropDepth = 0;
  let propDrillingIssues = 0;
  
  for (const file of ladderFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    // Count prop levels
    const propMatches = content.match(/\w+\.\w+\.\w+/g) || [];
    for (const match of propMatches) {
      const depth = match.split('.').length;
      if (depth > maxPropDepth) maxPropDepth = depth;
      if (depth > 4) propDrillingIssues++;
    }
    
    // Check for direct state mutations
    const stateMutationPatterns = [
      /\w+\.push\(/,
      /\w+\.pop\(/,
      /\w+\.shift\(/,
      /\w+\.unshift\(/,
      /\w+\[\w+\]\s*=/
    ];
    
    for (const pattern of stateMutationPatterns) {
      if (pattern.test(content)) {
        reportIssue('HIGH', fileName, 'Direct state mutation detected',
          'Mutating state directly can cause React rendering issues');
      }
    }
    
    // Check for missing dependency arrays in useEffect
    const effectWithoutDeps = content.match(/useEffect\([^)]+\)\s*(?!\s*,)/g) || [];
    if (effectWithoutDeps.length > 0) {
      reportIssue('MEDIUM', fileName, 'useEffect without dependency array',
        `Found ${effectWithoutDeps.length} effects that may cause infinite renders`);
    }
  }
  
  if (propDrillingIssues > 5) {
    reportIssue('MEDIUM', 'Architecture', 'Excessive prop drilling detected',
      `${propDrillingIssues} instances of deep prop drilling (>4 levels)`);
  }
};

// Payment Flow Analysis
const analyzePaymentFlow = () => {
  logSection('💳 PAYMENT FLOW SECURITY ANALYSIS');
  
  const paymentFiles = [
    './src/components/ladder/PaymentSuccess.jsx',
    './src/components/ladder/MatchFeePayment.jsx',
    './src/components/ladder/MembershipTiers.jsx'
  ];
  
  for (const file of paymentFiles) {
    if (!fs.existsSync(file)) continue;
    
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    // Check for client-side price validation
    if (content.includes('amount') || content.includes('price')) {
      if (!content.includes('server') && !content.includes('backend')) {
        reportIssue('CRITICAL', fileName, 'Client-side price calculation',
          'Payment amounts should be validated server-side only');
      }
    }
    
    // Check for payment data exposure
    if (content.includes('console.log') && (content.includes('payment') || content.includes('stripe'))) {
      reportIssue('HIGH', fileName, 'Payment data logging',
        'Payment information should not be logged to console');
    }
    
    // Check for proper HTTPS enforcement
    if (content.includes('http://') && !content.includes('localhost')) {
      reportIssue('CRITICAL', fileName, 'Insecure HTTP in payment flow',
        'Payment flows must use HTTPS only');
    }
  }
};

// Error Handling Analysis
const analyzeErrorHandling = () => {
  logSection('🚨 ERROR HANDLING ANALYSIS');
  
  const allFiles = getAllJSFiles('./src/components/ladder');
  
  let totalFetchCalls = 0;
  let handledFetchCalls = 0;
  let totalAsyncFunctions = 0;
  let handledAsyncFunctions = 0;
  
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    // Analyze fetch error handling
    const fetchMatches = content.match(/fetch\([^)]+\)/g) || [];
    totalFetchCalls += fetchMatches.length;
    
    for (const fetchCall of fetchMatches) {
      const followingCode = content.substring(content.indexOf(fetchCall) + fetchCall.length, 
        content.indexOf(fetchCall) + fetchCall.length + 500);
      
      if (followingCode.includes('.catch(') || followingCode.includes('try')) {
        handledFetchCalls++;
      } else {
        reportIssue('HIGH', fileName, 'Unhandled fetch error',
          `Fetch call without error handling: ${fetchCall}`);
      }
    }
    
    // Analyze async function error handling
    const asyncMatches = content.match(/async\s+(?:function\s+)?\w*\s*\([^)]*\)\s*=>\s*\{|async\s+function\s+\w+\s*\([^)]*\)\s*\{/g) || [];
    totalAsyncFunctions += asyncMatches.length;
    
    for (const asyncFunc of asyncMatches) {
      const funcStart = content.indexOf(asyncFunc);
      const funcBody = content.substring(funcStart, funcStart + 1000);
      
      if (funcBody.includes('try') && funcBody.includes('catch')) {
        handledAsyncFunctions++;
      } else {
        reportIssue('MEDIUM', fileName, 'Unhandled async function error',
          'Async function without try/catch error handling');
      }
    }
  }
  
  log(`📊 Error Handling Statistics:`, 'cyan');
  log(`   Fetch calls with error handling: ${handledFetchCalls}/${totalFetchCalls} (${Math.round(handledFetchCalls/totalFetchCalls*100)}%)`, 'white');
  log(`   Async functions with error handling: ${handledAsyncFunctions}/${totalAsyncFunctions} (${Math.round(handledAsyncFunctions/totalAsyncFunctions*100)}%)`, 'white');
};

// Generate Frontend Security Report
const generateSecurityReport = () => {
  logSection('📊 FRONTEND SECURITY ASSESSMENT REPORT');
  
  log(`\n🔍 SECURITY AUDIT RESULTS:`, 'bright');
  log(`   Total Issues Found: ${TOTAL_ISSUES}`, 'white');
  log(`   Critical Issues: ${CRITICAL_ISSUES}`, CRITICAL_ISSUES > 0 ? 'red' : 'green');
  log(`   High Issues: ${HIGH_ISSUES}`, HIGH_ISSUES > 0 ? 'red' : 'green');
  log(`   Medium Issues: ${MEDIUM_ISSUES}`, MEDIUM_ISSUES > 0 ? 'yellow' : 'green');
  
  // Calculate security score
  let securityScore = 100;
  securityScore -= CRITICAL_ISSUES * 20;
  securityScore -= HIGH_ISSUES * 10;
  securityScore -= MEDIUM_ISSUES * 5;
  securityScore = Math.max(0, securityScore);
  
  log(`\n🛡️  FRONTEND SECURITY SCORE: ${securityScore}/100`, 
      securityScore >= 80 ? 'green' : securityScore >= 60 ? 'yellow' : 'red');
  
  log(`\n💡 SECURITY RECOMMENDATIONS:`, 'bright');
  
  if (CRITICAL_ISSUES > 0) {
    log(`   🚨 IMMEDIATE: Fix ${CRITICAL_ISSUES} critical security vulnerabilities`, 'red');
  }
  
  if (HIGH_ISSUES > 0) {
    log(`   ❌ HIGH PRIORITY: Address ${HIGH_ISSUES} high-risk issues`, 'red');
  }
  
  if (MEDIUM_ISSUES > 0) {
    log(`   ⚠️  MEDIUM PRIORITY: Resolve ${MEDIUM_ISSUES} medium-risk issues`, 'yellow');
  }
  
  if (TOTAL_ISSUES === 0) {
    log(`   ✅ No security issues found in frontend code`, 'green');
  }
  
  // Frontend readiness verdict
  log(`\n🎯 FRONTEND SECURITY VERDICT:`, 'bright');
  
  if (securityScore >= 90 && CRITICAL_ISSUES === 0) {
    log(`   ✅ FRONTEND SECURITY: PRODUCTION READY`, 'green');
  } else if (securityScore >= 70 && CRITICAL_ISSUES <= 1) {
    log(`   ⚠️  FRONTEND SECURITY: NEEDS MINOR FIXES`, 'yellow');
  } else {
    log(`   ❌ FRONTEND SECURITY: NOT PRODUCTION READY`, 'red');
  }
};

// Main execution
const runFrontendSecurityAudit = async () => {
  log(`${colors.bright}${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           🔒 FRONTEND SECURITY AUDIT v1.0 🔒                ║
║                                                              ║
║        Deep Analysis of Ladder System Frontend Code         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  log(`\n⏰ Started: ${new Date().toISOString()}`, 'white');
  
  try {
    analyzeSecurityPatterns();
    analyzeBusinessLogic();
    analyzeDataFlow();
    analyzePaymentFlow();
    analyzeErrorHandling();
  } catch (error) {
    log(`\n💥 Security audit crashed: ${error.message}`, 'red');
    process.exit(1);
  }
  
  generateSecurityReport();
  
  log(`\n⏰ Completed: ${new Date().toISOString()}`, 'white');
};

// Run the audit
runFrontendSecurityAudit().catch(error => {
  console.error('Fatal error running security audit:', error);
  process.exit(3);
});

export { runFrontendSecurityAudit };