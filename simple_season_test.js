// Simple Season Test - Phase 1 to Phase 2 Complete Scenario
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:8080';

// Test configuration
const TEST_DIVISION = 'FRBCAPL TEST';
const TEST_PLAYERS = [
  'Mark Slam',
  'John Smith', 
  'Jane Doe',
  'Bob Johnson'
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

// Phase 1: Create and complete schedule matches
const runPhase1 = async () => {
  log('=== PHASE 1: SCHEDULE MATCHES ===');
  
  // Create a few schedule matches for testing
  const matches = [
    { sender: 'Mark Slam', receiver: 'John Smith' },
    { sender: 'Jane Doe', receiver: 'Bob Johnson' },
    { sender: 'Mark Slam', receiver: 'Jane Doe' },
    { sender: 'John Smith', receiver: 'Bob Johnson' }
  ];
  
  for (const match of matches) {
    try {
      // Create proposal for schedule match
      const response = await apiCall('/api/proposals', 'POST', {
        senderName: match.sender,
        receiverName: match.receiver,
        divisions: [TEST_DIVISION],
        type: 'schedule',
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
      
      // Accept the proposal
      await apiCall(`/api/proposals/${proposal._id}/accept`, 'POST', {
        acceptedBy: match.receiver
      });
      
      log(`Accepted schedule proposal: ${match.sender} vs ${match.receiver}`);
      
      // Mark as completed with random winner
      const winner = Math.random() > 0.5 ? match.sender : match.receiver;
      const loser = winner === match.sender ? match.receiver : match.sender;
      
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
  
  // Create a few challenge matches
  const challenges = [
    { challenger: 'Mark Slam', defender: 'John Smith' },
    { challenger: 'Jane Doe', defender: 'Bob Johnson' }
  ];
  
  for (const challenge of challenges) {
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
      
      // Accept the challenge
      await apiCall(`/api/proposals/${proposal._id}/accept`, 'POST', {
        acceptedBy: challenge.defender
      });
      
      log(`Accepted challenge: ${challenge.challenger} vs ${challenge.defender}`);
      
      // Mark as completed with random winner
      const winner = Math.random() > 0.5 ? challenge.challenger : challenge.defender;
      const loser = winner === challenge.challenger ? challenge.defender : challenge.challenger;
      
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
const runSimpleSeasonTest = async () => {
  try {
    log('🚀 Starting Simple Season Test');
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
    
    log('✅ Simple Season Test Completed Successfully!');
    
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
    log(`❌ Simple Season Test Failed: ${error.message}`);
    process.exit(1);
  }
};

// Run the test
runSimpleSeasonTest();
