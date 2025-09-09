#!/usr/bin/env node

/**
 * BUSINESS LOGIC & EDGE CASE ANALYZER
 * 
 * This script analyzes the ladder system's business logic for edge cases,
 * inconsistencies, and potential failure scenarios.
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

let TOTAL_LOGIC_ISSUES = 0;
let CRITICAL_LOGIC_ISSUES = 0;
let HIGH_LOGIC_ISSUES = 0;
let MEDIUM_LOGIC_ISSUES = 0;

const reportLogicIssue = (severity, component, issue, details = '') => {
  TOTAL_LOGIC_ISSUES++;
  
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
  
  if (severity === 'CRITICAL') CRITICAL_LOGIC_ISSUES++;
  else if (severity === 'HIGH') HIGH_LOGIC_ISSUES++;
  else if (severity === 'MEDIUM') MEDIUM_LOGIC_ISSUES++;
  
  log(`${severityIcons[severity]} ${severity}: ${component} - ${issue}`, severityColors[severity]);
  if (details) log(`   ${details}`, 'white');
};

// Analyze Challenge Logic
const analyzeChallengeLogic = () => {
  logSection('⚔️ CHALLENGE LOGIC ANALYSIS');
  
  const challengeModalPath = './src/components/ladder/LadderChallengeModal.jsx';
  const smartMatchPath = './src/components/ladder/LadderSmartMatchModal.jsx';
  const confirmModalPath = './src/components/ladder/LadderChallengeConfirmModal.jsx';
  
  // Analyze Challenge Creation Logic
  if (fs.existsSync(challengeModalPath)) {
    const content = fs.readFileSync(challengeModalPath, 'utf8');
    
    // Check for position validation in challenge creation
    if (!content.includes('position') || !content.includes('challenge.position')) {
      reportLogicIssue('CRITICAL', 'ChallengeModal', 'Missing position validation',
        'Players could challenge anyone without position restrictions');
    }
    
    // Check for immunity checking
    if (!content.includes('immunity') && !content.includes('immunityUntil')) {
      reportLogicIssue('HIGH', 'ChallengeModal', 'Missing immunity validation',
        'Players could challenge immune players');
    }
    
    // Check for duplicate challenge prevention
    if (!content.includes('existing') && !content.includes('duplicate')) {
      reportLogicIssue('HIGH', 'ChallengeModal', 'No duplicate challenge prevention',
        'Multiple challenges to same player could be created');
    }
    
    // Check for expiration logic
    if (!content.includes('expir') && !content.includes('deadline')) {
      reportLogicIssue('MEDIUM', 'ChallengeModal', 'Missing challenge expiration',
        'Challenges might not expire automatically');
    }
    
    // Check for entry fee validation
    const entryFeeMatch = content.match(/entryFee.*(\d+)/);
    if (entryFeeMatch && !content.includes('validate')) {
      reportLogicIssue('HIGH', 'ChallengeModal', 'Unvalidated entry fees',
        'Entry fees not validated against ladder requirements');
    }
  }
  
  // Analyze Smart Match Logic
  if (fs.existsSync(smartMatchPath)) {
    const content = fs.readFileSync(smartMatchPath, 'utf8');
    
    // Check for confidence calculation edge cases
    if (content.includes('calculateConfidence') && !content.includes('Math.min') && !content.includes('Math.max')) {
      reportLogicIssue('MEDIUM', 'SmartMatch', 'Unbounded confidence calculation',
        'Confidence scores could exceed expected ranges');
    }
    
    // Check for ladder cross-matching validation
    if (!content.includes('ladderName') || !content.includes('sameLadder')) {
      reportLogicIssue('HIGH', 'SmartMatch', 'Cross-ladder challenge risk',
        'Players might be matched across different ladders incorrectly');
    }
    
    // Check for activity-based matching
    if (!content.includes('recentMatches') && !content.includes('lastMatch')) {
      reportLogicIssue('MEDIUM', 'SmartMatch', 'Missing activity consideration',
        'Inactive players might be suggested');
    }
  }
  
  // Analyze Challenge Response Logic
  if (fs.existsSync(confirmModalPath)) {
    const content = fs.readFileSync(confirmModalPath, 'utf8');
    
    // Check for response deadline validation
    if (!content.includes('deadline') || !content.includes('expired')) {
      reportLogicIssue('HIGH', 'ChallengeConfirm', 'Missing deadline validation',
        'Expired challenges might still be acceptable');
    }
    
    // Check for position change logic
    if (!content.includes('position') && !content.includes('switch')) {
      reportLogicIssue('CRITICAL', 'ChallengeConfirm', 'Missing position change logic',
        'Challenge outcomes might not update ladder positions');
    }
  }
};

// Analyze Position Update Logic
const analyzePositionLogic = () => {
  logSection('📊 POSITION UPDATE LOGIC ANALYSIS');
  
  const ladderAppPath = './src/components/ladder/LadderApp.jsx';
  const matchReportPath = './src/components/ladder/LadderMatchReportingModal.jsx';
  
  if (fs.existsSync(ladderAppPath)) {
    const content = fs.readFileSync(ladderAppPath, 'utf8');
    
    // Check for SmackDown position logic
    if (content.includes('smackdown') || content.includes('SmackDown')) {
      if (!content.includes('3 down') && !content.includes('2 up')) {
        reportLogicIssue('CRITICAL', 'LadderApp', 'Incorrect SmackDown logic',
          'SmackDown position changes not implemented correctly');
      }
    }
    
    // Check for boundary conditions
    if (!content.includes('position === 1') && !content.includes('first')) {
      reportLogicIssue('HIGH', 'LadderApp', 'Missing boundary checks',
        'Position updates might go below 1 or above maximum');
    }
    
    // Check for concurrent update handling
    if (!content.includes('lock') && !content.includes('transaction')) {
      reportLogicIssue('CRITICAL', 'LadderApp', 'No concurrent update protection',
        'Multiple position updates could cause inconsistent state');
    }
    
    // Check for immunity application
    if (content.includes('immunityUntil') && !content.includes('Date')) {
      reportLogicIssue('HIGH', 'LadderApp', 'Invalid immunity date handling',
        'Immunity dates might be set incorrectly');
    }
  }
  
  if (fs.existsSync(matchReportPath)) {
    const content = fs.readFileSync(matchReportPath, 'utf8');
    
    // Check for winner validation
    if (!content.includes('winner') || !content.includes('loser')) {
      reportLogicIssue('CRITICAL', 'MatchReporting', 'Missing winner/loser validation',
        'Match results might not specify clear winners');
    }
    
    // Check for score validation
    if (content.includes('score') && !content.includes('validate')) {
      reportLogicIssue('HIGH', 'MatchReporting', 'Unvalidated match scores',
        'Invalid scores could be submitted (e.g., 10-0 in race to 5)');
    }
  }
};

// Analyze Payment Logic Edge Cases
const analyzePaymentLogic = () => {
  logSection('💰 PAYMENT LOGIC ANALYSIS');
  
  const paymentFiles = [
    './src/components/ladder/PaymentSuccess.jsx',
    './src/components/ladder/MatchFeePayment.jsx',
    './src/components/ladder/MembershipTiers.jsx'
  ];
  
  for (const file of paymentFiles) {
    if (!fs.existsSync(file)) continue;
    
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    // Check for payment verification
    if (content.includes('amount') && !content.includes('verify')) {
      reportLogicIssue('CRITICAL', fileName, 'Missing payment verification',
        'Payment amounts not verified server-side');
    }
    
    // Check for refund logic
    if (!content.includes('refund') && !content.includes('cancel')) {
      reportLogicIssue('HIGH', fileName, 'Missing refund mechanism',
        'No way to handle payment failures or cancellations');
    }
    
    // Check for membership expiration handling
    if (content.includes('membership') && !content.includes('expir')) {
      reportLogicIssue('HIGH', fileName, 'Missing expiration handling',
        'Membership expiration not properly handled');
    }
    
    // Check for payment method validation
    if (content.includes('paymentMethod') && !content.includes('validate')) {
      reportLogicIssue('MEDIUM', fileName, 'Unvalidated payment methods',
        'Payment methods not validated before processing');
    }
  }
};

// Analyze Prize Pool Logic
const analyzePrizePoolLogic = () => {
  logSection('🏆 PRIZE POOL LOGIC ANALYSIS');
  
  const prizePoolFiles = [
    './src/components/ladder/LadderPrizePoolModal.jsx',
    './src/components/ladder/LadderPrizePoolTracker.jsx',
    './src/components/ladder/PrizePoolDisplay.jsx'
  ];
  
  for (const file of prizePoolFiles) {
    if (!fs.existsSync(file)) continue;
    
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    // Check for calculation accuracy
    if (content.includes('prizePool') && !content.includes('Math.round')) {
      reportLogicIssue('MEDIUM', fileName, 'Floating point precision issues',
        'Prize calculations might have rounding errors');
    }
    
    // Check for distribution period validation
    if (content.includes('monthly') || content.includes('bi-monthly')) {
      if (!content.includes('Date') || !content.includes('period')) {
        reportLogicIssue('HIGH', fileName, 'Invalid distribution periods',
          'Prize distribution timing might be incorrect');
      }
    }
    
    // Check for winner determination logic
    if (content.includes('winner') && !content.includes('sort')) {
      reportLogicIssue('HIGH', fileName, 'Unclear winner determination',
        'Winner selection algorithm not clearly defined');
    }
    
    // Check for tie-breaking logic
    if (!content.includes('tie') && !content.includes('equal')) {
      reportLogicIssue('MEDIUM', fileName, 'Missing tie-breaking logic',
        'No mechanism to handle tied positions in prize distribution');
    }
  }
};

// Analyze Data Consistency Logic
const analyzeDataConsistency = () => {
  logSection('🔄 DATA CONSISTENCY ANALYSIS');
  
  const managementPath = './src/components/ladder/LadderManagement.jsx';
  const playerMgmtPath = './src/components/ladder/LadderPlayerManagement.jsx';
  
  if (fs.existsSync(managementPath)) {
    const content = fs.readFileSync(managementPath, 'utf8');
    
    // Check for import validation
    if (content.includes('import') && !content.includes('validate')) {
      reportLogicIssue('CRITICAL', 'LadderManagement', 'Unvalidated data import',
        'Imported data not validated before insertion');
    }
    
    // Check for position uniqueness
    if (!content.includes('unique') && !content.includes('duplicate')) {
      reportLogicIssue('HIGH', 'LadderManagement', 'Missing position uniqueness check',
        'Duplicate positions could be created during import');
    }
    
    // Check for data format consistency
    if (!content.includes('schema') && !content.includes('format')) {
      reportLogicIssue('HIGH', 'LadderManagement', 'Missing data format validation',
        'Inconsistent data formats could cause system errors');
    }
  }
  
  if (fs.existsSync(playerMgmtPath)) {
    const content = fs.readFileSync(playerMgmtPath, 'utf8');
    
    // Check for email uniqueness
    if (content.includes('email') && !content.includes('unique')) {
      reportLogicIssue('HIGH', 'PlayerManagement', 'Missing email uniqueness check',
        'Duplicate email addresses could be registered');
    }
    
    // Check for FargoRate validation
    if (content.includes('fargoRate') && !content.includes('range')) {
      reportLogicIssue('MEDIUM', 'PlayerManagement', 'Unbounded FargoRate values',
        'FargoRate values not validated within reasonable bounds');
    }
  }
};

// Analyze Edge Cases and Boundary Conditions
const analyzeEdgeCases = () => {
  logSection('🎯 EDGE CASES & BOUNDARY CONDITIONS');
  
  const allFiles = ['./src/components/ladder/LadderApp.jsx'];
  
  for (const file of allFiles) {
    if (!fs.existsSync(file)) continue;
    
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    // Check for empty ladder handling
    if (!content.includes('length === 0') && !content.includes('empty')) {
      reportLogicIssue('HIGH', fileName, 'Missing empty ladder handling',
        'System behavior undefined for empty ladders');
    }
    
    // Check for single player scenarios
    if (!content.includes('length === 1') && !content.includes('single')) {
      reportLogicIssue('MEDIUM', fileName, 'Missing single player handling',
        'Edge case for one-player ladders not handled');
    }
    
    // Check for maximum player limits
    if (!content.includes('max') && !content.includes('limit')) {
      reportLogicIssue('MEDIUM', fileName, 'Missing player limits',
        'No maximum player count enforced');
    }
    
    // Check for negative value handling
    if (!content.includes('< 0') && !content.includes('negative')) {
      reportLogicIssue('HIGH', fileName, 'Missing negative value protection',
        'Negative positions, scores, or fees might be accepted');
    }
    
    // Check for null/undefined handling
    const nullChecks = content.match(/!.*\w|.*!==.*null|.*!==.*undefined/g) || [];
    const nullableFields = content.match(/\?\./g) || [];
    
    if (nullableFields.length > nullChecks.length) {
      reportLogicIssue('HIGH', fileName, 'Insufficient null checking',
        'More nullable operations than null checks found');
    }
  }
};

// Analyze Race Conditions and Concurrency
const analyzeConcurrency = () => {
  logSection('🏃 CONCURRENCY & RACE CONDITION ANALYSIS');
  
  const concurrentFiles = [
    './src/components/ladder/LadderApp.jsx',
    './src/components/ladder/LadderChallengeModal.jsx',
    './src/components/ladder/LadderMatchReportingModal.jsx'
  ];
  
  for (const file of concurrentFiles) {
    if (!fs.existsSync(file)) continue;
    
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    // Check for state update race conditions
    const setStateMatches = content.match(/set\w+\(/g) || [];
    const useEffectMatches = content.match(/useEffect\(/g) || [];
    
    if (setStateMatches.length > 10 && useEffectMatches.length < 3) {
      reportLogicIssue('HIGH', fileName, 'Potential state race conditions',
        `${setStateMatches.length} state updates with only ${useEffectMatches.length} effects`);
    }
    
    // Check for API call synchronization
    const fetchMatches = content.match(/fetch\(/g) || [];
    const awaitMatches = content.match(/await/g) || [];
    
    if (fetchMatches.length > awaitMatches.length) {
      reportLogicIssue('MEDIUM', fileName, 'Unsynchronized API calls',
        'More fetch calls than await statements - potential timing issues');
    }
    
    // Check for loading state management
    if (fetchMatches.length > 0 && !content.includes('loading')) {
      reportLogicIssue('HIGH', fileName, 'Missing loading state management',
        'API calls without loading states can cause UI inconsistencies');
    }
  }
};

// Generate Business Logic Report
const generateBusinessLogicReport = () => {
  logSection('📊 BUSINESS LOGIC ASSESSMENT REPORT');
  
  log(`\n🧠 BUSINESS LOGIC AUDIT RESULTS:`, 'bright');
  log(`   Total Logic Issues: ${TOTAL_LOGIC_ISSUES}`, 'white');
  log(`   Critical Issues: ${CRITICAL_LOGIC_ISSUES}`, CRITICAL_LOGIC_ISSUES > 0 ? 'red' : 'green');
  log(`   High Issues: ${HIGH_LOGIC_ISSUES}`, HIGH_LOGIC_ISSUES > 0 ? 'red' : 'green');
  log(`   Medium Issues: ${MEDIUM_LOGIC_ISSUES}`, MEDIUM_LOGIC_ISSUES > 0 ? 'yellow' : 'green');
  
  // Calculate business logic score
  let businessLogicScore = 100;
  businessLogicScore -= CRITICAL_LOGIC_ISSUES * 25;
  businessLogicScore -= HIGH_LOGIC_ISSUES * 15;
  businessLogicScore -= MEDIUM_LOGIC_ISSUES * 5;
  businessLogicScore = Math.max(0, businessLogicScore);
  
  log(`\n🧮 BUSINESS LOGIC SCORE: ${businessLogicScore}/100`, 
      businessLogicScore >= 80 ? 'green' : businessLogicScore >= 60 ? 'yellow' : 'red');
  
  // Risk assessment
  log(`\n⚠️  RISK ASSESSMENT:`, 'bright');
  
  if (CRITICAL_LOGIC_ISSUES > 0) {
    log(`   🚨 CRITICAL RISK: ${CRITICAL_LOGIC_ISSUES} critical business logic flaws`, 'red');
    log(`      Could cause data corruption, financial loss, or system failure`, 'red');
  }
  
  if (HIGH_LOGIC_ISSUES > 5) {
    log(`   ❌ HIGH RISK: ${HIGH_LOGIC_ISSUES} high-priority logic issues`, 'red');
    log(`      Could cause incorrect game outcomes or user frustration`, 'red');
  }
  
  if (MEDIUM_LOGIC_ISSUES > 10) {
    log(`   ⚠️  MEDIUM RISK: ${MEDIUM_LOGIC_ISSUES} medium-priority issues`, 'yellow');
    log(`      Could cause edge case failures or poor user experience`, 'yellow');
  }
  
  // Final verdict
  log(`\n🎯 BUSINESS LOGIC VERDICT:`, 'bright');
  
  if (businessLogicScore >= 85 && CRITICAL_LOGIC_ISSUES === 0) {
    log(`   ✅ BUSINESS LOGIC: PRODUCTION READY`, 'green');
  } else if (businessLogicScore >= 70 && CRITICAL_LOGIC_ISSUES <= 2) {
    log(`   ⚠️  BUSINESS LOGIC: NEEDS FIXES BEFORE PRODUCTION`, 'yellow');
  } else {
    log(`   ❌ BUSINESS LOGIC: NOT PRODUCTION READY`, 'red');
  }
};

// Main execution
const runBusinessLogicAnalysis = async () => {
  log(`${colors.bright}${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🧠 BUSINESS LOGIC & EDGE CASE ANALYZER v1.0 🧠       ║
║                                                              ║
║         Deep Analysis of Ladder System Business Logic       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  log(`\n⏰ Started: ${new Date().toISOString()}`, 'white');
  
  try {
    analyzeChallengeLogic();
    analyzePositionLogic();
    analyzePaymentLogic();
    analyzePrizePoolLogic();
    analyzeDataConsistency();
    analyzeEdgeCases();
    analyzeConcurrency();
  } catch (error) {
    log(`\n💥 Business logic analysis crashed: ${error.message}`, 'red');
    process.exit(1);
  }
  
  generateBusinessLogicReport();
  
  log(`\n⏰ Completed: ${new Date().toISOString()}`, 'white');
};

// Run the analysis
runBusinessLogicAnalysis().catch(error => {
  console.error('Fatal error running business logic analysis:', error);
  process.exit(3);
});

export { runBusinessLogicAnalysis };