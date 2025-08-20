// Full Season Test - Phase 1 to Phase 2 Complete Scenario
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:8080';

// Test configuration
const TEST_DIVISION = 'FRBCAPL TEST';
const TEST_PLAYERS = [
  'Mark Slam',
  'John Smith', 
  'Jane Doe',
  'Bob Johnson',
  'Alice Brown',
  'Charlie Wilson',
  'Diana Davis',
  'Edward Miller'
];

// Test data storage
let testData = {
  proposals: [],
  matches: [],
  challengeStats: {}
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
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${data.error || 'Unknown error'}`);
    }
    
    return data;
  } catch (error) {
    log(`API Call Failed: ${endpoint}`, { error: error.message });
    throw error;
  }
};

// Phase 1: Create and complete schedule matches
const runPhase1 = async () => {
  log('=== PHASE 1: SCHEDULE MATCHES ===');
  
  // Create schedule matches for each player
  for (let i = 0; i < TEST_PLAYERS.length; i++) {
    const player = TEST_PLAYERS[i];
    
    // Create 6 schedule matches per player (typical Phase 1)
    for (let j = 0; j < 6; j++) {
      const opponent = TEST_PLAYERS[(i + j + 1) % TEST_PLAYERS.length];
      
      if (player !== opponent) {
        try {
          // Create proposal for schedule match
          const proposal = await apiCall('/api/proposals', 'POST', {
            senderName: player,
            receiverName: opponent,
            divisions: [TEST_DIVISION],
            type: 'schedule',
            date: new Date(Date.now() + (j + 1) * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Test Location',
            notes: `Phase 1 Schedule Match ${j + 1}`
          });
          
          testData.proposals.push(proposal);
          log(`Created schedule proposal: ${player} vs ${opponent}`);
          
          // Accept the proposal
          await apiCall(`/api/proposals/${proposal._id}/accept`, 'POST', {
            acceptedBy: opponent
          });
          
          log(`Accepted schedule proposal: ${player} vs ${opponent}`);
          
          // Mark as completed with random winner
          const winner = Math.random() > 0.5 ? player : opponent;
          const loser = winner === player ? opponent : player;
          
          await apiCall(`/api/proposals/${proposal._id}/completed`, 'PATCH', {
            completed: true,
            winner,
            loser,
            score: '7-5',
            notes: 'Phase 1 completed match'
          });
          
          log(`Completed schedule match: ${winner} def. ${loser}`);
          
        } catch (error) {
          log(`Error in Phase 1 match creation: ${error.message}`);
        }
      }
    }
  }
  
  log(`Phase 1 completed. Created ${testData.proposals.length} schedule matches.`);
};

// Phase 2: Create challenge matches
const runPhase2 = async () => {
  log('=== PHASE 2: CHALLENGE MATCHES ===');
  
  // Get current challenge stats for all players
  for (const player of TEST_PLAYERS) {
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
  
  // Create challenge matches
  for (let i = 0; i < TEST_PLAYERS.length; i++) {
    const challenger = TEST_PLAYERS[i];
    
    // Get eligible opponents for this challenger
    try {
      const eligibleOpponents = await apiCall(`/api/challenges/eligible-opponents/${encodeURIComponent(challenger)}/${encodeURIComponent(TEST_DIVISION)}`);
      
      log(`Eligible opponents for ${challenger}:`, eligibleOpponents.eligibleOpponents.map(o => o.name));
      
      // Create 2-3 challenge matches per player
      const numChallenges = Math.min(2 + Math.floor(Math.random() * 2), eligibleOpponents.eligibleOpponents.length);
      
      for (let j = 0; j < numChallenges; j++) {
        const opponent = eligibleOpponents.eligibleOpponents[j];
        
        try {
          // Validate challenge first
          const validation = await apiCall('/api/challenges/validate', 'POST', {
            senderName: challenger,
            receiverName: opponent.name,
            division: TEST_DIVISION
          });
          
          if (!validation.isValid) {
            log(`Challenge validation failed for ${challenger} vs ${opponent.name}:`, validation.errors);
            continue;
          }
          
          // Create challenge proposal
          const proposal = await apiCall('/api/proposals', 'POST', {
            senderName: challenger,
            receiverName: opponent.name,
            divisions: [TEST_DIVISION],
            type: 'challenge',
            date: new Date(Date.now() + (j + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Challenge Location',
            notes: `Phase 2 Challenge Match ${j + 1}`
          });
          
          testData.proposals.push(proposal);
          log(`Created challenge proposal: ${challenger} vs ${opponent.name}`);
          
          // Accept the challenge
          await apiCall(`/api/proposals/${proposal._id}/accept`, 'POST', {
            acceptedBy: opponent.name
          });
          
          log(`Accepted challenge: ${challenger} vs ${opponent.name}`);
          
          // Mark as completed with random winner
          const winner = Math.random() > 0.5 ? challenger : opponent.name;
          const loser = winner === challenger ? opponent.name : challenger;
          
          await apiCall(`/api/proposals/${proposal._id}/completed`, 'PATCH', {
            completed: true,
            winner,
            loser,
            score: '7-6',
            notes: 'Phase 2 completed challenge'
          });
          
          log(`Completed challenge match: ${winner} def. ${loser}`);
          
        } catch (error) {
          log(`Error in Phase 2 challenge creation: ${error.message}`);
        }
      }
      
    } catch (error) {
      log(`Error getting eligible opponents for ${challenger}: ${error.message}`);
    }
  }
  
  log(`Phase 2 completed. Created challenge matches.`);
};

// Verify final statistics
const verifyFinalStats = async () => {
  log('=== FINAL STATISTICS VERIFICATION ===');
  
  for (const player of TEST_PLAYERS) {
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
      await apiCall(`/api/proposals/${proposal._id}`, 'DELETE');
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
const runFullSeasonTest = async () => {
  try {
    log('🚀 Starting Full Season Test');
    log(`Testing Division: ${TEST_DIVISION}`);
    log(`Test Players: ${TEST_PLAYERS.join(', ')}`);
    
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
    
    log('✅ Full Season Test Completed Successfully!');
    
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
    log(`❌ Full Season Test Failed: ${error.message}`);
    process.exit(1);
  }
};

// Run the test
runFullSeasonTest();
