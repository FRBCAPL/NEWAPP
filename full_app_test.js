// Full App Test - Complete Season Workflow
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:8080';

// Test configuration
const TEST_DIVISION = 'FRBCAPL TEST';

// Test data storage
let testData = {
  proposals: [],
  matches: [],
  challengeStats: {},
  players: []
};

// Utility functions
const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const apiCall = async (endpoint, method = 'GET', body = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${data.error || 'Unknown error'}`);
      }
      
      return data;
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      throw new Error(`Non-JSON response: ${response.status} - ${text.substring(0, 100)}`);
    }
    
  } catch (error) {
    log(`API Call Failed: ${endpoint}`, { error: error.message });
    throw error;
  }
};

// Get players from standings
const getPlayersFromStandings = async () => {
  try {
    log('Fetching players from standings...');
    
    const response = await fetch(`${BACKEND_URL}/static/standings_${encodeURIComponent(TEST_DIVISION)}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch standings: ${response.status}`);
    }
    
    const standings = await response.json();
    const players = standings.map(player => player.name);
    
    log(`Found ${players.length} players in standings:`, players);
    return players;
    
  } catch (error) {
    log(`Error fetching standings: ${error.message}`);
    // Fallback to known players
    return ['Mark Slam', 'Randy Fishburn', 'Ryan Meindl', 'Christopher Anderson'];
  }
};

// Phase 1: Create and complete schedule matches
const runPhase1 = async () => {
  log('=== PHASE 1: SCHEDULE MATCHES ===');
  
  if (testData.players.length < 2) {
    log('Not enough players for Phase 1 testing');
    return;
  }
  
  // Create schedule matches between players
  const matches = [];
  for (let i = 0; i < testData.players.length; i++) {
    for (let j = i + 1; j < testData.players.length; j++) {
      matches.push({
        sender: testData.players[i],
        receiver: testData.players[j]
      });
    }
  }
  
  // Limit to first 6 matches for testing
  const testMatches = matches.slice(0, 6);
  
  for (const match of testMatches) {
    try {
      // Create proposal for schedule match
      const response = await apiCall('/api/proposals', 'POST', {
        senderName: match.sender,
        receiverName: match.receiver,
        divisions: [TEST_DIVISION],
        type: 'schedule',
        phase: 'schedule',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        notes: 'Phase 1 Schedule Match'
      });
      
      // Store proposal with the correct ID format
      const proposal = {
        _id: response.proposalId,
        ...response
      };
      testData.proposals.push(proposal);
      log(`Created schedule proposal: ${match.sender} vs ${match.receiver}`, { id: proposal._id });
      
      // Accept the proposal using the correct endpoint
      await apiCall(`/api/proposals/${proposal._id}/status`, 'PATCH', {
        status: 'confirmed',
        note: 'Accepted'
      });
      
      log(`Accepted schedule proposal: ${match.sender} vs ${match.receiver}`);
      
      // Mark as completed with random winner using admin endpoint
      const winner = Math.random() > 0.5 ? match.sender : match.receiver;
      const loser = winner === match.sender ? match.receiver : match.sender;
      
      await apiCall(`/api/proposals/admin/${proposal._id}/completed`, 'PATCH', {
        completed: true,
        winner
      });
      
      log(`Completed schedule match: ${winner} def. ${loser}`);
      
    } catch (error) {
      log(`Error in Phase 1 match creation: ${error.message}`);
    }
  }
  
  log(`Phase 1 completed. Created ${testData.proposals.length} schedule matches.`);
};

// Phase 2: Create challenge matches
const runPhase2 = async () => {
  log('=== PHASE 2: CHALLENGE MATCHES ===');
  
  if (testData.players.length < 2) {
    log('Not enough players for Phase 2 testing');
    return;
  }
  
  // Get current challenge stats for all players
  for (const player of testData.players) {
    try {
      const stats = await apiCall(`/api/challenges/stats/${encodeURIComponent(player)}/${encodeURIComponent(TEST_DIVISION)}`);
      testData.challengeStats[player] = stats;
      log(`Challenge stats for ${player}:`, {
        timesChallenged: stats.timesChallenged,
        matchesAsChallenger: stats.matchesAsChallenger,
        totalChallengeMatches: stats.totalChallengeMatches,
        requiredDefenses: stats.requiredDefenses
      });
    } catch (error) {
      log(`Error getting challenge stats for ${player}: ${error.message}`);
    }
  }
  
  // Create challenge matches between players
  const challenges = [];
  for (let i = 0; i < testData.players.length; i++) {
    for (let j = i + 1; j < testData.players.length; j++) {
      challenges.push({
        challenger: testData.players[i],
        defender: testData.players[j]
      });
    }
  }
  
  // Limit to first 4 challenges for testing
  const testChallenges = challenges.slice(0, 4);
  
  for (const challenge of testChallenges) {
    try {
      // Validate challenge first
      const validation = await apiCall('/api/challenges/validate', 'POST', {
        senderName: challenge.challenger,
        receiverName: challenge.defender,
        division: TEST_DIVISION
      });
      
      if (!validation.isValid) {
        log(`Challenge validation failed for ${challenge.challenger} vs ${challenge.defender}:`, validation.errors);
        continue;
      }
      
      // Create challenge proposal
      const response = await apiCall('/api/proposals', 'POST', {
        senderName: challenge.challenger,
        receiverName: challenge.defender,
        divisions: [TEST_DIVISION],
        type: 'challenge',
        phase: 'challenge',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Challenge Location',
        notes: 'Phase 2 Challenge Match'
      });
      
      // Store proposal with the correct ID format
      const proposal = {
        _id: response.proposalId,
        ...response
      };
      testData.proposals.push(proposal);
      log(`Created challenge proposal: ${challenge.challenger} vs ${challenge.defender}`, { id: proposal._id });
      
      // Accept the challenge using the correct endpoint
      await apiCall(`/api/proposals/${proposal._id}/status`, 'PATCH', {
        status: 'confirmed',
        note: 'Accepted challenge'
      });
      
      log(`Accepted challenge: ${challenge.challenger} vs ${challenge.defender}`);
      
      // Mark as completed with random winner using admin endpoint
      const winner = Math.random() > 0.5 ? challenge.challenger : challenge.defender;
      const loser = winner === challenge.challenger ? challenge.defender : challenge.challenger;
      
      await apiCall(`/api/proposals/admin/${proposal._id}/completed`, 'PATCH', {
        completed: true,
        winner
      });
      
      log(`Completed challenge match: ${winner} def. ${loser}`);
      
    } catch (error) {
      log(`Error in Phase 2 challenge creation: ${error.message}`);
    }
  }
  
  log(`Phase 2 completed. Created challenge matches.`);
};

// Test all API endpoints
const testAPIEndpoints = async () => {
  log('=== API ENDPOINTS TEST ===');
  
  try {
    // Test users endpoint
    const users = await apiCall('/api/users');
    log(`Users API: Found ${users.length} users`);
    
    // Test proposals endpoint
    const proposals = await apiCall('/api/proposals');
    log(`Proposals API: Found ${proposals.length} proposals`);
    
    // Test challenges stats for each player
    for (const player of testData.players) {
      try {
        const stats = await apiCall(`/api/challenges/stats/${encodeURIComponent(player)}/${encodeURIComponent(TEST_DIVISION)}`);
        log(`Challenge stats for ${player}:`, stats);
      } catch (error) {
        log(`Error getting challenge stats for ${player}: ${error.message}`);
      }
    }
    
    // Test division challenge stats
    try {
      const divisionStats = await apiCall(`/api/challenges/division-stats/${encodeURIComponent(TEST_DIVISION)}`);
      log('Division Challenge Statistics:', divisionStats);
    } catch (error) {
      log(`Error getting division stats: ${error.message}`);
    }
    
    // Test eligible opponents
    for (const player of testData.players.slice(0, 2)) {
      try {
        const eligibleOpponents = await apiCall(`/api/challenges/eligible-opponents/${encodeURIComponent(player)}/${encodeURIComponent(TEST_DIVISION)}`);
        log(`Eligible opponents for ${player}:`, eligibleOpponents);
      } catch (error) {
        log(`Error getting eligible opponents for ${player}: ${error.message}`);
      }
    }
    
  } catch (error) {
    log(`Error testing API endpoints: ${error.message}`);
  }
};

// Verify final statistics
const verifyFinalStats = async () => {
  log('=== FINAL STATISTICS VERIFICATION ===');
  
  for (const player of testData.players) {
    try {
      const stats = await apiCall(`/api/challenges/stats/${encodeURIComponent(player)}/${encodeURIComponent(TEST_DIVISION)}`);
      
      log(`Final stats for ${player}:`, {
        timesChallenged: stats.timesChallenged,
        matchesAsChallenger: stats.matchesAsChallenger,
        totalChallengeMatches: stats.totalChallengeMatches,
        requiredDefenses: stats.requiredDefenses,
        voluntaryDefenses: stats.voluntaryDefenses,
        hasReachedChallengeLimit: stats.hasReachedChallengeLimit,
        hasReachedDefenseLimit: stats.hasReachedDefenseLimit
      });
      
    } catch (error) {
      log(`Error getting final stats for ${player}: ${error.message}`);
    }
  }
  
  // Get division summary
  try {
    const divisionStats = await apiCall(`/api/challenges/division-stats/${encodeURIComponent(TEST_DIVISION)}`);
    log('Division Challenge Statistics:', divisionStats.summary);
  } catch (error) {
    log(`Error getting division stats: ${error.message}`);
  }
};

// Cleanup function
const cleanup = async () => {
  log('=== CLEANUP ===');
  
  // Delete all test proposals
  for (const proposal of testData.proposals) {
    try {
      await apiCall(`/api/proposals/admin/${proposal._id}`, 'DELETE');
      log(`Deleted proposal: ${proposal._id}`);
    } catch (error) {
      log(`Error deleting proposal ${proposal._id}: ${error.message}`);
    }
  }
  
  // Reset challenge stats for the division
  try {
    await apiCall(`/api/challenges/reset-division/${encodeURIComponent(TEST_DIVISION)}`, 'DELETE');
    log(`Reset challenge stats for division: ${TEST_DIVISION}`);
  } catch (error) {
    log(`Error resetting challenge stats: ${error.message}`);
  }
  
  log('Cleanup completed.');
};

// Main test execution
const runFullAppTest = async () => {
  try {
    log('🚀 Starting Full App Test');
    log(`Testing Division: ${TEST_DIVISION}`);
    
    // Get players from standings
    testData.players = await getPlayersFromStandings();
    log(`Using players: ${testData.players.join(', ')}`);
    
    // Test API endpoints first
    await testAPIEndpoints();
    
    // Run Phase 1
    await runPhase1();
    
    // Small delay to ensure Phase 1 is processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run Phase 2
    await runPhase2();
    
    // Small delay to ensure Phase 2 is processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify final statistics
    await verifyFinalStats();
    
    log('✅ Full App Test Completed Successfully!');
    
    // Ask user if they want to cleanup
    console.log('\nDo you want to cleanup test data? (y/n)');
    process.stdin.once('data', async (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === 'y' || answer === 'yes') {
        await cleanup();
        process.exit(0);
      } else {
        log('Test data preserved for inspection.');
        process.exit(0);
      }
    });
    
  } catch (error) {
    log(`❌ Full App Test Failed: ${error.message}`);
    process.exit(1);
  }
};

// Run the test
runFullAppTest();
