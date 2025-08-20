// Test Frontend Data Fetching: New Match System Integration
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

const testFrontendDataFetching = async () => {
  try {
    log('🧪 Testing Frontend Data Fetching: New Match System Integration');
    
    // Step 1: Create test data
    log('Step 1: Creating test proposals and matches...');
    
    const proposal1 = await apiCall('/api/proposals', 'POST', {
      senderName: 'Mark Slam',
      receiverName: 'Randy Fishburn',
      divisions: ['FRBCAPL TEST'],
      type: 'schedule',
      phase: 'schedule',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      location: 'Test Location 1',
      notes: 'Test proposal 1'
    });
    
    const proposal2 = await apiCall('/api/proposals', 'POST', {
      senderName: 'Mark Slam',
      receiverName: 'John Doe',
      divisions: ['FRBCAPL TEST'],
      type: 'schedule',
      phase: 'schedule',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Test Location 2',
      notes: 'Test proposal 2'
    });
    
    // Accept both proposals to create matches
    await apiCall(`/api/proposals/${proposal1.proposalId}/status`, 'PATCH', {
      status: 'confirmed',
      note: 'Accepted for testing'
    });
    
    await apiCall(`/api/proposals/${proposal2.proposalId}/status`, 'PATCH', {
      status: 'confirmed',
      note: 'Accepted for testing'
    });
    
    // Find the created matches
    const matches1 = await apiCall(`/api/matches?proposalId=${proposal1.proposalId}`);
    const matches2 = await apiCall(`/api/matches?proposalId=${proposal2.proposalId}`);
    
    const match1 = matches1[0];
    const match2 = matches2[0];
    
    // Complete one match
    await apiCall(`/api/matches/${match1._id}/complete`, 'PATCH', {
      winner: 'Mark Slam',
      score: '7-5',
      notes: 'Completed for testing'
    });
    
    log('Test data created successfully');
    
    // Step 2: Test the new match endpoints (simulating what useMatches does)
    log('Step 2: Testing new match endpoints...');
    
    // Test getMatchesByStatus for scheduled matches
    const scheduledMatches = await apiCall('/api/matches/status/FRBCAPL%20TEST/scheduled');
    log(`Found ${scheduledMatches.length} scheduled matches`);
    
    // Test getMatchesByStatus for completed matches
    const completedMatches = await apiCall('/api/matches/status/FRBCAPL%20TEST/completed');
    log(`Found ${completedMatches.length} completed matches`);
    
    // Step 3: Test player filtering (simulating useMatches logic)
    log('Step 3: Testing player filtering...');
    
    const playerName = 'Mark Slam';
    const playerScheduled = scheduledMatches.filter(match => 
      match.player1Id === playerName || match.player2Id === playerName
    );
    const playerCompleted = completedMatches.filter(match => 
      match.player1Id === playerName || match.player2Id === playerName
    );
    
    log(`Player "${playerName}" has ${playerScheduled.length} scheduled matches`);
    log(`Player "${playerName}" has ${playerCompleted.length} completed matches`);
    
    // Step 4: Test sorting (simulating useMatches logic)
    log('Step 4: Testing sorting...');
    
    const sortedScheduled = [...playerScheduled].sort((a, b) => 
      new Date(a.scheduledDate) - new Date(b.scheduledDate)
    );
    const sortedCompleted = [...playerCompleted].sort((a, b) => 
      new Date(b.completedDate) - new Date(a.completedDate)
    );
    
    log('Scheduled matches sorted by scheduledDate (ascending)');
    log('Completed matches sorted by completedDate (descending)');
    
    // Step 5: Verify the data structure matches what frontend expects
    log('Step 5: Verifying data structure...');
    
    if (playerScheduled.length > 0) {
      const sampleScheduled = playerScheduled[0];
      log('Sample scheduled match structure:', {
        id: sampleScheduled._id,
        player1Id: sampleScheduled.player1Id,
        player2Id: sampleScheduled.player2Id,
        status: sampleScheduled.status,
        scheduledDate: sampleScheduled.scheduledDate,
        type: sampleScheduled.type,
        division: sampleScheduled.division
      });
    }
    
    if (playerCompleted.length > 0) {
      const sampleCompleted = playerCompleted[0];
      log('Sample completed match structure:', {
        id: sampleCompleted._id,
        player1Id: sampleCompleted.player1Id,
        player2Id: sampleCompleted.player2Id,
        status: sampleCompleted.status,
        completedDate: sampleCompleted.completedDate,
        winner: sampleCompleted.winner,
        score: sampleCompleted.score
      });
    }
    
    // Step 6: Test getPlayerMatches endpoint (alternative approach)
    log('Step 6: Testing getPlayerMatches endpoint...');
    
    const playerMatches = await apiCall(`/api/matches/player/${encodeURIComponent(playerName)}/FRBCAPL%20TEST`);
    log(`getPlayerMatches found ${playerMatches.length} matches for ${playerName}`);
    
    const playerScheduledAlt = playerMatches.filter(m => m.status === 'scheduled');
    const playerCompletedAlt = playerMatches.filter(m => m.status === 'completed');
    
    log(`Alternative method: ${playerScheduledAlt.length} scheduled, ${playerCompletedAlt.length} completed`);
    
    log('✅ Frontend Data Fetching Test Completed Successfully!');
    
    // Cleanup
    log('🧹 Cleaning up test data...');
    try {
      await apiCall(`/api/proposals/admin/${proposal1.proposalId}`, 'DELETE');
      await apiCall(`/api/proposals/admin/${proposal2.proposalId}`, 'DELETE');
      log('Test proposals deleted');
    } catch (error) {
      log('Error deleting test proposals:', error.message);
    }
    
  } catch (error) {
    log(`❌ Test Failed: ${error.message}`);
  }
};

// Run the test
testFrontendDataFetching();
