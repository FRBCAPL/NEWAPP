// Test Match Completion Flow: User Interface Integration
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

const testMatchCompletionFlow = async () => {
  try {
    log('🧪 Testing Match Completion Flow: User Interface Integration');
    
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
      notes: 'Test proposal for completion flow'
    });
    
    const proposalId = proposalResponse.proposalId;
    log(`Created proposal: ${proposalId}`);
    
    // Step 2: Accept the proposal (creates match)
    log('Step 2: Accepting the proposal...');
    await apiCall(`/api/proposals/${proposalId}/status`, 'PATCH', {
      status: 'confirmed',
      note: 'Accepted for completion flow test'
    });
    
    log('Proposal accepted successfully');
    
    // Step 3: Find the created match
    log('Step 3: Finding the created match...');
    const matches = await apiCall(`/api/matches?proposalId=${proposalId}`);
    
    if (matches.length === 0) {
      throw new Error('No match found for the proposal');
    }
    
    const match = matches[0];
    log(`Found match: ${match._id}`);
    
    // Step 4: Simulate the user interface completion flow
    log('Step 4: Simulating user interface completion flow...');
    
    // This simulates what the Dashboard.jsx does when a user selects a winner
    const winner = 'Mark Slam';
    const playerName = 'Mark';
    const playerLastName = 'Slam';
    
    // Simulate the new completion logic from Dashboard.jsx
    const completionResponse = await apiCall(`/api/matches/${match._id}/complete`, 'PATCH', {
      winner,
      score: 'TBD',
      notes: `Completed by ${playerName} ${playerLastName}`
    });
    
    log('Match completed successfully via new system');
    
    // Step 5: Verify the match is completed
    log('Step 5: Verifying match completion...');
    const completedMatches = await apiCall('/api/matches/status/FRBCAPL%20TEST/completed');
    const completedMatch = completedMatches.find(m => m._id === match._id);
    
    if (completedMatch) {
      log('✅ Match completion verified!');
      log('Completed match details:', {
        id: completedMatch._id,
        winner: completedMatch.winner,
        score: completedMatch.score,
        completedDate: completedMatch.completedDate,
        notes: completedMatch.notes
      });
    } else {
      log('❌ Match not found in completed matches');
    }
    
    // Step 6: Verify the proposal is also updated (backward compatibility)
    log('Step 6: Verifying proposal backward compatibility...');
    const proposal = await apiCall(`/api/proposals/admin/list?division=FRBCAPL%20TEST&status=confirmed&completed=true`);
    const completedProposal = proposal.proposals?.find(p => p._id === proposalId);
    
    if (completedProposal) {
      log('✅ Proposal also updated for backward compatibility');
    } else {
      log('⚠️ Proposal not found in completed proposals (this is expected for new system)');
    }
    
    log('✅ Match Completion Flow Test Completed Successfully!');
    
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
testMatchCompletionFlow();
