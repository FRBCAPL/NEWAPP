// Test New Workflow: Proposal Acceptance → Match Creation
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

const testNewWorkflow = async () => {
  try {
    log('🧪 Testing New Workflow: Proposal → Match');
    
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
      notes: 'Test proposal for new workflow'
    });
    
    const proposalId = proposalResponse.proposalId;
    log(`Created proposal: ${proposalId}`);
    
    // Step 2: Check that no match exists yet
    log('Step 2: Checking that no match exists yet...');
    const matchesBefore = await apiCall('/api/matches/status/FRBCAPL%20TEST/scheduled');
    log(`Scheduled matches before acceptance: ${matchesBefore.length}`);
    
    // Step 3: Accept the proposal (this should create a match)
    log('Step 3: Accepting the proposal...');
    const acceptResponse = await apiCall(`/api/proposals/${proposalId}/status`, 'PATCH', {
      status: 'confirmed',
      note: 'Accepted via new workflow test'
    });
    
    log('Proposal accepted successfully');
    
    // Step 4: Check that a match was created
    log('Step 4: Checking that a match was created...');
    const matchesAfter = await apiCall('/api/matches/status/FRBCAPL%20TEST/scheduled');
    log(`Scheduled matches after acceptance: ${matchesAfter.length}`);
    
    if (matchesAfter.length > matchesBefore.length) {
      const newMatch = matchesAfter.find(match => match.proposalId === proposalId);
      if (newMatch) {
        log('✅ Match created successfully!');
        log('New match details:', {
          id: newMatch._id,
          player1Id: newMatch.player1Id,
          player2Id: newMatch.player2Id,
          status: newMatch.status,
          type: newMatch.type,
          scheduledDate: newMatch.scheduledDate
        });
      } else {
        log('⚠️ Match count increased but new match not found');
      }
    } else {
      log('❌ No new match was created');
    }
    
    // Step 5: Test the complete workflow by completing the match
    log('Step 5: Testing match completion...');
    if (matchesAfter.length > matchesBefore.length) {
      const newMatch = matchesAfter.find(match => match.proposalId === proposalId);
      if (newMatch) {
        const completeResponse = await apiCall(`/api/matches/${newMatch._id}/complete`, 'PATCH', {
          winner: 'Mark Slam',
          score: '7-5',
          notes: 'Completed via new workflow test'
        });
        
        log('Match completed successfully');
        
        // Step 6: Verify the match is now completed
        log('Step 6: Verifying match completion...');
        const completedMatches = await apiCall('/api/matches/status/FRBCAPL%20TEST/completed');
        const completedMatch = completedMatches.find(match => match._id === newMatch._id);
        
        if (completedMatch) {
          log('✅ Match completion verified!');
          log('Completed match details:', {
            winner: completedMatch.winner,
            score: completedMatch.score,
            completedDate: completedMatch.completedDate
          });
        } else {
          log('❌ Match not found in completed matches');
        }
      }
    }
    
    log('✅ New Workflow Test Completed Successfully!');
    
    // Cleanup
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
testNewWorkflow();
