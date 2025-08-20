// Test New Match System
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

const testNewMatchSystem = async () => {
  try {
    log('🧪 Testing New Match System');
    
    // Step 1: Create a proposal
    log('Step 1: Creating a proposal...');
    const proposalResponse = await apiCall('/api/proposals', 'POST', {
      senderName: 'Mark Slam',
      receiverName: 'Randy Fishburn',
      divisions: ['FRBCAPL TEST'],
      type: 'schedule',
      phase: 'schedule',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      location: 'Test Location',
      notes: 'Test proposal for new match system'
    });
    
    const proposalId = proposalResponse.proposalId;
    log(`Created proposal: ${proposalId}`);
    
    // Step 2: Create a match from the proposal
    log('Step 2: Creating a match from proposal...');
    const matchResponse = await apiCall('/api/matches/from-proposal', 'POST', {
      proposalId: proposalId
    });
    
    const matchId = matchResponse.matchId;
    log(`Created match: ${matchId}`);
    
    // Step 3: Get scheduled matches
    log('Step 3: Getting scheduled matches...');
    const scheduledMatches = await apiCall('/api/matches/status/FRBCAPL%20TEST/scheduled');
    log(`Found ${scheduledMatches.length} scheduled matches`);
    
    // Step 4: Complete the match
    log('Step 4: Completing the match...');
    const completeResponse = await apiCall(`/api/matches/${matchId}/complete`, 'PATCH', {
      winner: 'Mark Slam',
      score: '7-5',
      notes: 'Test completion'
    });
    
    log('Match completed successfully');
    
    // Step 5: Get completed matches
    log('Step 5: Getting completed matches...');
    const completedMatches = await apiCall('/api/matches/status/FRBCAPL%20TEST/completed');
    log(`Found ${completedMatches.length} completed matches`);
    
    // Step 6: Get match statistics
    log('Step 6: Getting match statistics...');
    const stats = await apiCall('/api/matches/stats/FRBCAPL%20TEST');
    log('Match statistics:', stats);
    
    // Step 7: Get player's matches
    log('Step 7: Getting player matches...');
    const playerMatches = await apiCall('/api/matches/player/Mark%20Slam/FRBCAPL%20TEST');
    log(`Found ${playerMatches.length} matches for Mark Slam`);
    
    log('✅ New Match System Test Completed Successfully!');
    
    // Cleanup: Delete the test proposal
    log('🧹 Cleaning up test data...');
    try {
      await apiCall(`/api/proposals/admin/${proposalId}`, 'DELETE');
      log('Test proposal deleted');
    } catch (error) {
      log('Error deleting test proposal:', error.message);
    }
    
  } catch (error) {
    log(`❌ Test Failed: ${error.message}`);
  }
};

// Run the test
testNewMatchSystem();
