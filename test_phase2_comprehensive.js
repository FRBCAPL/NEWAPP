// Comprehensive Phase 2 System Testing Script
// Tests all aspects of the Phase 2 challenge system automatically

const BACKEND_URL = 'http://localhost:8080';
const TEST_DIVISION = 'FRBCAPL TEST';

// Test data - players with different scenarios (using actual players from standings)
const TEST_PLAYERS = [
  { name: 'Mark Slam', standing: 1 },
  { name: 'Randy Fishburn', standing: 2 },
  { name: 'Randall Fishburn', standing: 3 },
  { name: 'Don Lowe', standing: 4 },
  { name: 'Lucas Taylor', standing: 5 },
  { name: 'Vince Ivey', standing: 6 }
];

class Phase2Tester {
  constructor() {
    this.testResults = [];
    this.currentTest = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
      const data = await response.json();
      
      return { success: response.ok, status: response.status, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async resetPlayerStats(playerName) {
    const result = await this.makeRequest(
      `/api/challenges/stats/${encodeURIComponent(playerName)}/${encodeURIComponent(TEST_DIVISION)}`,
      'DELETE'
    );
    return result;
  }

  async getPlayerStats(playerName) {
    const result = await this.makeRequest(
      `/api/challenges/stats/${encodeURIComponent(playerName)}/${encodeURIComponent(TEST_DIVISION)}`
    );
    return result;
  }

  async getPlayerLimits(playerName) {
    const result = await this.makeRequest(
      `/api/challenges/limits/${encodeURIComponent(playerName)}/${encodeURIComponent(TEST_DIVISION)}`
    );
    return result;
  }

  async validateChallenge(senderName, receiverName, isRematch = false) {
    const result = await this.makeRequest('/api/challenges/validate', 'POST', {
      senderName,
      receiverName,
      division: TEST_DIVISION,
      isRematch
    });
    return result;
  }

  async validateDefenseAcceptance(defenderName, challengerName) {
    const result = await this.makeRequest('/api/challenges/validate-defense', 'POST', {
      defenderName,
      challengerName,
      division: TEST_DIVISION
    });
    return result;
  }

  async getEligibleOpponents(playerName) {
    const result = await this.makeRequest(
      `/api/challenges/eligible-opponents/${encodeURIComponent(playerName)}/${encodeURIComponent(TEST_DIVISION)}`
    );
    return result;
  }

  // Test 1: Basic Stats Initialization
  async testBasicStatsInitialization() {
    this.log('🧪 TEST 1: Basic Stats Initialization');
    
    for (const player of TEST_PLAYERS) {
      const stats = await this.getPlayerStats(player.name);
      
      if (!stats.success) {
        this.log(`Failed to get stats for ${player.name}: ${stats.error}`, 'error');
        return false;
      }

      const expectedDefaults = {
        totalChallengeMatches: 0,
        matchesAsChallenger: 0,
        matchesAsDefender: 0,
        requiredDefenses: 0,
        voluntaryDefenses: 0,
        timesChallenged: 0,
        remainingChallenges: 4,
        remainingDefenses: 2
      };

      for (const [key, expectedValue] of Object.entries(expectedDefaults)) {
        if (stats.data[key] !== expectedValue) {
          this.log(`${player.name} ${key}: expected ${expectedValue}, got ${stats.data[key]}`, 'error');
          return false;
        }
      }
    }

    this.log('✅ All players initialized with correct default stats', 'success');
    return true;
  }

  // Test 2: Dynamic Challenge Limits
  async testDynamicChallengeLimits() {
    this.log('🧪 TEST 2: Dynamic Challenge Limits');
    
    const player = TEST_PLAYERS[0];
    
    // Test initial state (0 times challenged = 4 challenges allowed)
    let limits = await this.getPlayerLimits(player.name);
    if (!limits.success) {
      this.log(`Failed to get limits for ${player.name}`, 'error');
      return false;
    }

    if (limits.data.dynamicLimits.timesChallenged !== 0 || 
        limits.data.dynamicLimits.baseChallengesAllowed !== 4 ||
        limits.data.dynamicLimits.remainingChallenges !== 4) {
      this.log(`Initial dynamic limits incorrect for ${player.name}`, 'error');
      return false;
    }

    // Simulate being challenged once
    // Note: In real system, this would happen when a proposal is created
    // For testing, we'll manually update the stats
    const updateResult = await this.makeRequest(
      `/api/challenges/stats/${encodeURIComponent(player.name)}/${encodeURIComponent(TEST_DIVISION)}`,
      'PUT',
      { timesChallenged: 1 }
    );

    if (!updateResult.success) {
      this.log(`Failed to update timesChallenged for ${player.name}`, 'error');
      return false;
    }

    // Check that limits updated correctly (1 time challenged = 3 challenges allowed)
    limits = await this.getPlayerLimits(player.name);
    if (limits.data.dynamicLimits.timesChallenged !== 1 || 
        limits.data.dynamicLimits.baseChallengesAllowed !== 3 ||
        limits.data.dynamicLimits.remainingChallenges !== 3) {
      this.log(`Dynamic limits not updated correctly after being challenged once`, 'error');
      return false;
    }

    // Simulate being challenged twice
    await this.makeRequest(
      `/api/challenges/stats/${encodeURIComponent(player.name)}/${encodeURIComponent(TEST_DIVISION)}`,
      'PUT',
      { timesChallenged: 2 }
    );

    // Check that limits updated correctly (2+ times challenged = 2 challenges allowed)
    limits = await this.getPlayerLimits(player.name);
    if (limits.data.dynamicLimits.timesChallenged !== 2 || 
        limits.data.dynamicLimits.baseChallengesAllowed !== 2 ||
        limits.data.dynamicLimits.remainingChallenges !== 2) {
      this.log(`Dynamic limits not updated correctly after being challenged twice`, 'error');
      return false;
    }

    this.log('✅ Dynamic challenge limits working correctly', 'success');
    return true;
  }

  // Test 3: Standings-Based Challenge Restrictions
  async testStandingsBasedRestrictions() {
    this.log('🧪 TEST 3: Standings-Based Challenge Restrictions');
    
    const challenger = TEST_PLAYERS[5]; // Rank 6
    const validTarget = TEST_PLAYERS[1]; // Rank 2 (4 spots above)
    const invalidTarget = TEST_PLAYERS[0]; // Rank 1 (5 spots above - too high)

    // Test valid challenge (within 4 spots)
    let validation = await this.validateChallenge(challenger.name, validTarget.name);
    if (!validation.success) {
      this.log(`Failed to validate challenge from ${challenger.name} to ${validTarget.name}`, 'error');
      return false;
    }

    if (!validation.data.isValid) {
      this.log(`Valid challenge incorrectly rejected: ${validation.data.errors.join(', ')}`, 'error');
      return false;
    }

    // Test invalid challenge (beyond 4 spots)
    validation = await this.validateChallenge(challenger.name, invalidTarget.name);
    if (!validation.success) {
      this.log(`Failed to validate challenge from ${challenger.name} to ${invalidTarget.name}`, 'error');
      return false;
    }

    if (validation.data.isValid) {
      this.log(`Invalid challenge incorrectly allowed`, 'error');
      return false;
    }

    const hasStandingsError = validation.data.errors.some(error => 
      error.includes('4 spots above') || error.includes('standings')
    );

    if (!hasStandingsError) {
      this.log(`Expected standings restriction error, got: ${validation.data.errors.join(', ')}`, 'error');
      return false;
    }

    this.log('✅ Standings-based challenge restrictions working correctly', 'success');
    return true;
  }

  // Test 4: Total Match Limit (Challenges + Defenses)
  async testTotalMatchLimit() {
    this.log('🧪 TEST 4: Total Match Limit (Challenges + Defenses)');
    
    const player = TEST_PLAYERS[2]; // Use player 3 (Randall Fishburn, rank 3)
    const challenger = TEST_PLAYERS[5]; // Use player 6 (Vince Ivey, rank 6) - can challenge up to rank 2

    // Simulate player having 3 challenges and 1 defense (total = 4)
    await this.makeRequest(
      `/api/challenges/stats/${encodeURIComponent(player.name)}/${encodeURIComponent(TEST_DIVISION)}`,
      'PUT',
      { 
        totalChallengeMatches: 3,
        matchesAsChallenger: 3,
        requiredDefenses: 1
      }
    );

    // Try to challenge this player (should fail - at 4-match limit)
    const validation = await this.validateChallenge(challenger.name, player.name);
    if (!validation.success) {
      this.log(`Failed to validate challenge to ${player.name}`, 'error');
      return false;
    }

    if (validation.data.isValid) {
      this.log(`Challenge incorrectly allowed to player at 4-match limit`, 'error');
      return false;
    }

    const hasTotalMatchError = validation.data.errors.some(error => 
      error.includes('total matches') && error.includes('4')
    );

    if (!hasTotalMatchError) {
      this.log(`Expected total match limit error, got: ${validation.data.errors.join(', ')}`, 'error');
      return false;
    }

    this.log('✅ Total match limit (challenges + defenses) working correctly', 'success');
    return true;
  }

  // Test 5: Defense Limits
  async testDefenseLimits() {
    this.log('🧪 TEST 5: Defense Limits');
    
    const player = TEST_PLAYERS[3]; // Use player 4

    // Simulate player having 2 required defenses
    await this.makeRequest(
      `/api/challenges/stats/${encodeURIComponent(player.name)}/${encodeURIComponent(TEST_DIVISION)}`,
      'PUT',
      { requiredDefenses: 2 }
    );

    // Try to challenge this player (should fail - at defense limit)
    const validation = await this.validateChallenge(TEST_PLAYERS[0].name, player.name);
    if (!validation.success) {
      this.log(`Failed to validate challenge to ${player.name}`, 'error');
      return false;
    }

    if (validation.data.isValid) {
      this.log(`Challenge incorrectly allowed to player at defense limit`, 'error');
      return false;
    }

    const hasDefenseError = validation.data.errors.some(error => 
      error.includes('defended') && error.includes('2')
    );

    if (!hasDefenseError) {
      this.log(`Expected defense limit error, got: ${validation.data.errors.join(', ')}`, 'error');
      return false;
    }

    this.log('✅ Defense limits working correctly', 'success');
    return true;
  }

  // Test 6: Weekly Limits
  async testWeeklyLimits() {
    this.log('🧪 TEST 6: Weekly Limits');
    
    const player = TEST_PLAYERS[4]; // Use player 5 (Lucas Taylor, rank 5)
    const challenger = TEST_PLAYERS[5]; // Use player 6 (Vince Ivey, rank 6) - can challenge up to rank 2

    // Simulate player having a match this week
    const currentWeek = 7; // Assuming we're in week 7
    await this.makeRequest(
      `/api/challenges/stats/${encodeURIComponent(player.name)}/${encodeURIComponent(TEST_DIVISION)}`,
      'PUT',
      { 
        challengesByWeek: [currentWeek],
        defendedByWeek: []
      }
    );

    // Try to challenge this player (should fail - already has match this week)
    const validation = await this.validateChallenge(challenger.name, player.name);
    if (!validation.success) {
      this.log(`Failed to validate challenge to ${player.name}`, 'error');
      return false;
    }

    if (validation.data.isValid) {
      this.log(`Challenge incorrectly allowed to player with match this week`, 'error');
      return false;
    }

    const hasWeeklyError = validation.data.errors.some(error => 
      error.includes('week') && error.includes('scheduled')
    );

    if (!hasWeeklyError) {
      this.log(`Expected weekly limit error, got: ${validation.data.errors.join(', ')}`, 'error');
      return false;
    }

    this.log('✅ Weekly limits working correctly', 'success');
    return true;
  }

  // Test 7: Eligible Opponents Filtering
  async testEligibleOpponentsFiltering() {
    this.log('🧪 TEST 7: Eligible Opponents Filtering');
    
    const challenger = TEST_PLAYERS[5]; // Rank 6 (Vince Ivey)

    const eligibleResult = await this.getEligibleOpponents(challenger.name);
    if (!eligibleResult.success) {
      this.log(`Failed to get eligible opponents for ${challenger.name}`, 'error');
      return false;
    }

    // Should only see players ranked 2-5 (within 4 spots above)
    const eligibleOpponents = eligibleResult.data.eligibleOpponents;
    
    // Log what we got for debugging
    this.log(`Found ${eligibleOpponents.length} eligible opponents:`, 'info');
    eligibleOpponents.forEach(opp => this.log(`  - ${opp.name} (rank ${opp.position})`, 'info'));

    // Check that all returned opponents are within the correct range (2-5)
    for (const opponent of eligibleOpponents) {
      if (opponent.position < 2 || opponent.position > 5) {
        this.log(`Invalid opponent in results: ${opponent.name} (rank ${opponent.position})`, 'error');
        return false;
      }
    }

    // Should have 4 opponents (ranks 2, 3, 4, 5)
    if (eligibleOpponents.length !== 4) {
      this.log(`Expected 4 eligible opponents, got ${eligibleOpponents.length}`, 'error');
      return false;
    }

    this.log('✅ Eligible opponents filtering working correctly', 'success');
    return true;
  }

  // Test 8: API Response Consistency
  async testAPIResponseConsistency() {
    this.log('🧪 TEST 8: API Response Consistency');
    
    const player = TEST_PLAYERS[0];

    // Get stats and limits for the same player
    const stats = await this.getPlayerStats(player.name);
    const limits = await this.getPlayerLimits(player.name);

    if (!stats.success || !limits.success) {
      this.log(`Failed to get stats or limits for ${player.name}`, 'error');
      return false;
    }

    // Check that overlapping fields are consistent
    const consistencyChecks = [
      { statsField: 'totalChallengeMatches', limitsField: 'usage.totalChallengeMatches' },
      { statsField: 'requiredDefenses', limitsField: 'usage.requiredDefenses' },
      { statsField: 'timesChallenged', limitsField: 'usage.timesChallenged' },
      { statsField: 'remainingChallenges', limitsField: 'remaining.challenges' },
      { statsField: 'remainingDefenses', limitsField: 'remaining.defenses' }
    ];

    for (const check of consistencyChecks) {
      const statsValue = stats.data[check.statsField];
      const limitsValue = check.limitsField.split('.').reduce((obj, key) => obj[key], limits.data);

      if (statsValue !== limitsValue) {
        this.log(`Inconsistency in ${check.statsField}: stats=${statsValue}, limits=${limitsValue}`, 'error');
        return false;
      }
    }

    this.log('✅ API response consistency verified', 'success');
    return true;
  }

  // Test 9: Edge Cases
  async testEdgeCases() {
    this.log('🧪 TEST 9: Edge Cases');
    
    // Test challenging yourself
    const player = TEST_PLAYERS[0];
    const selfChallenge = await this.validateChallenge(player.name, player.name);
    
    if (selfChallenge.data.isValid) {
      this.log(`Self-challenge incorrectly allowed`, 'error');
      return false;
    }

    // Test challenging non-existent player
    const nonExistentChallenge = await this.validateChallenge(player.name, 'Non Existent Player');
    
    if (nonExistentChallenge.data.isValid) {
      this.log(`Challenge to non-existent player incorrectly allowed`, 'error');
      return false;
    }

    // Test with empty/null parameters
    const emptyParams = await this.validateChallenge('', '');
    
    if (emptyParams.data.isValid) {
      this.log(`Challenge with empty parameters incorrectly allowed`, 'error');
      return false;
    }

    this.log('✅ Edge cases handled correctly', 'success');
    return true;
  }

  // Test 10: Comprehensive Integration Test
  async testComprehensiveIntegration() {
    this.log('🧪 TEST 10: Comprehensive Integration Test');
    
    const challenger = TEST_PLAYERS[5]; // Rank 6
    const target = TEST_PLAYERS[2]; // Rank 3

    // Reset both players to clean state
    await this.resetPlayerStats(challenger.name);
    await this.resetPlayerStats(target.name);

    // Step 1: Validate initial challenge (should succeed)
    let validation = await this.validateChallenge(challenger.name, target.name);
    if (!validation.success || !validation.data.isValid) {
      this.log(`Initial challenge validation failed: ${validation.data?.errors?.join(', ')}`, 'error');
      return false;
    }

    // Step 2: Simulate challenge being created (update stats)
    await this.makeRequest(
      `/api/challenges/stats/${encodeURIComponent(challenger.name)}/${encodeURIComponent(TEST_DIVISION)}`,
      'PUT',
      { 
        matchesAsChallenger: 1,
        totalChallengeMatches: 1,
        challengedOpponents: [target.name]
      }
    );

    await this.makeRequest(
      `/api/challenges/stats/${encodeURIComponent(target.name)}/${encodeURIComponent(TEST_DIVISION)}`,
      'PUT',
      { 
        matchesAsDefender: 1,
        totalChallengeMatches: 1,
        requiredDefenses: 1,
        timesChallenged: 1
      }
    );

    // Step 3: Try to challenge the same player again (should fail - already challenged)
    validation = await this.validateChallenge(challenger.name, target.name);
    if (validation.data.isValid) {
      this.log(`Duplicate challenge incorrectly allowed`, 'error');
      return false;
    }

    // Step 4: Check that target's dynamic limits updated correctly
    const targetLimits = await this.getPlayerLimits(target.name);
    if (targetLimits.data.dynamicLimits.timesChallenged !== 1 || 
        targetLimits.data.dynamicLimits.baseChallengesAllowed !== 3) {
      this.log(`Target's dynamic limits not updated correctly after being challenged`, 'error');
      return false;
    }

    this.log('✅ Comprehensive integration test passed', 'success');
    return true;
  }

  async runAllTests() {
    this.log('🚀 STARTING COMPREHENSIVE PHASE 2 SYSTEM TESTING');
    this.log('================================================');
    
    const tests = [
      this.testBasicStatsInitialization.bind(this),
      this.testDynamicChallengeLimits.bind(this),
      this.testStandingsBasedRestrictions.bind(this),
      this.testTotalMatchLimit.bind(this),
      this.testDefenseLimits.bind(this),
      this.testWeeklyLimits.bind(this),
      this.testEligibleOpponentsFiltering.bind(this),
      this.testAPIResponseConsistency.bind(this),
      this.testEdgeCases.bind(this),
      this.testComprehensiveIntegration.bind(this)
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (let i = 0; i < tests.length; i++) {
      this.log(`\n📋 Running Test ${i + 1}/${totalTests}...`);
      
      try {
        const result = await tests[i]();
        if (result) {
          passedTests++;
        }
      } catch (error) {
        this.log(`Test ${i + 1} failed with error: ${error.message}`, 'error');
      }
    }

    this.log('\n📊 TEST RESULTS SUMMARY');
    this.log('=======================');
    this.log(`✅ Passed: ${passedTests}/${totalTests}`);
    this.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      this.log('🎉 ALL TESTS PASSED! Phase 2 system is working correctly.', 'success');
    } else {
      this.log('⚠️ Some tests failed. Please review the errors above.', 'warning');
    }

    return passedTests === totalTests;
  }
}

// Run the tests
async function main() {
  const tester = new Phase2Tester();
  await tester.runAllTests();
}

main().catch(error => {
  console.error('❌ Test runner failed:', error);
});
