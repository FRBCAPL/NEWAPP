// Simple Match System Test
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:8080';

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
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${response.status} - ${error.error || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    log(`API Call Failed: ${endpoint}`, { error: error.message });
    throw error;
  }
};

const testSimpleMatchSystem = async () => {
  try {
    log('🧪 Testing Simple Match System');
    
    // Step 1: Check current match statistics
    log('Step 1: Checking current match statistics...');
    const stats = await apiCall('/api/matches/stats/FRBCAPL%20TEST');
    log('Current match statistics:', stats);
    
    // Step 2: Get all matches
    log('Step 2: Getting all matches...');
    const allMatches = await apiCall('/api/matches?division=FRBCAPL%20TEST');
    log(`Found ${allMatches.length} total matches`);
    
    // Step 3: Get matches by status
    log('Step 3: Getting matches by status...');
    const scheduledMatches = await apiCall('/api/matches/status/FRBCAPL%20TEST/scheduled');
    const completedMatches = await apiCall('/api/matches/status/FRBCAPL%20TEST/completed');
    
    log(`Scheduled matches: ${scheduledMatches.length}`);
    log(`Completed matches: ${completedMatches.length}`);
    
    // Step 4: Test player matches endpoint
    log('Step 4: Testing player matches endpoint...');
    const playerMatches = await apiCall('/api/matches/player/Mark%20Slam/FRBCAPL%20TEST');
    log(`Mark Slam has ${playerMatches.length} matches`);
    
    // Step 5: Test the new endpoints work correctly
    log('Step 5: Testing endpoint functionality...');
    
    if (scheduledMatches.length > 0) {
      const firstMatch = scheduledMatches[0];
      log(`Sample scheduled match: ${firstMatch.player1Id} vs ${firstMatch.player2Id}`);
      log(`Match details:`, {
        id: firstMatch._id,
        status: firstMatch.status,
        scheduledDate: firstMatch.scheduledDate,
        location: firstMatch.location,
        type: firstMatch.type
      });
    }
    
    if (completedMatches.length > 0) {
      const firstCompleted = completedMatches[0];
      log(`Sample completed match: ${firstCompleted.player1Id} vs ${firstCompleted.player2Id}`);
      log(`Match result:`, {
        winner: firstCompleted.winner,
        score: firstCompleted.score,
        completedDate: firstCompleted.completedDate
      });
    }
    
    log('✅ Simple Match System Test Completed Successfully!');
    log('📊 Summary:');
    log(`  - Total matches: ${stats.total}`);
    log(`  - Scheduled: ${stats.scheduled}`);
    log(`  - Completed: ${stats.completed}`);
    log(`  - Mark Slam matches: ${playerMatches.length}`);
    
  } catch (error) {
    log(`❌ Test Failed: ${error.message}`);
  }
};

// Run the test
testSimpleMatchSystem();
