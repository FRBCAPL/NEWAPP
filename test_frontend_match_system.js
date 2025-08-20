// Test Frontend Match System Integration
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

const testFrontendIntegration = async () => {
  try {
    log('🧪 Testing Frontend Match System Integration');
    
    // Step 1: Create test proposals
    log('Step 1: Creating test proposals...');
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
      senderName: 'John Doe',
      receiverName: 'Jane Smith',
      divisions: ['FRBCAPL TEST'],
      type: 'challenge',
      phase: 'challenge',
      date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      location: 'Test Location 2',
      notes: 'Test proposal 2'
    });
    
    log(`Created proposals: ${proposal1.proposalId}, ${proposal2.proposalId}`);
    
    // Step 2: Convert proposals to matches
    log('Step 2: Converting proposals to matches...');
    const match1 = await apiCall('/api/matches/from-proposal', 'POST', {
      proposalId: proposal1.proposalId
    });
    
    const match2 = await apiCall('/api/matches/from-proposal', 'POST', {
      proposalId: proposal2.proposalId
    });
    
    log(`Created matches: ${match1.matchId}, ${match2.matchId}`);
    
    // Step 3: Test frontend-style API calls (simulating what the frontend would do)
    log('Step 3: Testing frontend-style API calls...');
    
    // Get matches by status (like the new MatchManager component)
    const scheduledMatches = await apiCall('/api/matches/status/FRBCAPL%20TEST/scheduled');
    log(`Frontend would see ${scheduledMatches.length} scheduled matches`);
    
    // Get match statistics (like the stats display)
    const matchStats = await apiCall('/api/matches/stats/FRBCAPL%20TEST');
    log('Frontend would see match statistics:', matchStats);
    
    // Get player matches (like player dashboard)
    const playerMatches = await apiCall('/api/matches/player/Mark%20Slam/FRBCAPL%20TEST');
    log(`Frontend would see ${playerMatches.length} matches for Mark Slam`);
    
    // Step 4: Complete a match (like admin actions)
    log('Step 4: Completing a match...');
    const completedMatch = await apiCall(`/api/matches/${match1.matchId}/complete`, 'PATCH', {
      winner: 'Mark Slam',
      score: '7-5',
      notes: 'Test completion from frontend'
    });
    
    log('Match completed successfully');
    
    // Step 5: Verify the frontend would see updated data
    log('Step 5: Verifying updated data for frontend...');
    
    const updatedScheduled = await apiCall('/api/matches/status/FRBCAPL%20TEST/scheduled');
    const updatedCompleted = await apiCall('/api/matches/status/FRBCAPL%20TEST/completed');
    const updatedStats = await apiCall('/api/matches/stats/FRBCAPL%20TEST');
    
    log(`After completion - Scheduled: ${updatedScheduled.length}, Completed: ${updatedCompleted.length}`);
    log('Updated statistics:', updatedStats);
    
    // Step 6: Test the new getDashboardMatches helper function logic
    log('Step 6: Testing dashboard matches logic...');
    
    // Simulate what getDashboardMatches would do
    const [dashboardScheduled, dashboardCompleted] = await Promise.all([
      apiCall('/api/matches/status/FRBCAPL%20TEST/scheduled'),
      apiCall('/api/matches/status/FRBCAPL%20TEST/completed')
    ]);
    
    // Filter for specific player (like the frontend would)
    const markSlamScheduled = dashboardScheduled.filter(match => 
      match.player1Id === 'Mark Slam' || match.player2Id === 'Mark Slam'
    );
    
    const markSlamCompleted = dashboardCompleted.filter(match => 
      match.player1Id === 'Mark Slam' || match.player2Id === 'Mark Slam'
    );
    
    log(`Dashboard would show Mark Slam: ${markSlamScheduled.length} scheduled, ${markSlamCompleted.length} completed`);
    
    log('✅ Frontend Integration Test Completed Successfully!');
    
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
testFrontendIntegration();
