// Cleanup All Proposals Script
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

const cleanupAllProposals = async () => {
  try {
    log('🧹 Starting cleanup of all proposals...');
    
    // Get all proposals
    const proposals = await apiCall('/api/proposals');
    log(`Found ${proposals.length} proposals to delete`);
    
    if (proposals.length === 0) {
      log('No proposals found to delete');
      return;
    }
    
    // Delete each proposal
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const proposal of proposals) {
      try {
        await apiCall(`/api/proposals/admin/${proposal._id}`, 'DELETE');
        log(`Deleted proposal: ${proposal._id} (${proposal.senderName} vs ${proposal.receiverName})`);
        deletedCount++;
      } catch (error) {
        log(`Error deleting proposal ${proposal._id}: ${error.message}`);
        errorCount++;
      }
    }
    
    log(`Cleanup completed! Deleted ${deletedCount} proposals, ${errorCount} errors`);
    
    // Also reset challenge stats for the test division
    try {
      await apiCall(`/api/challenges/reset-division/FRBCAPL%20TEST`, 'DELETE');
      log('Reset challenge stats for FRBCAPL TEST division');
    } catch (error) {
      log(`Error resetting challenge stats: ${error.message}`);
    }
    
    // Verify cleanup
    const remainingProposals = await apiCall('/api/proposals');
    log(`Remaining proposals after cleanup: ${remainingProposals.length}`);
    
  } catch (error) {
    log(`Error during cleanup: ${error.message}`);
  }
};

// Run the cleanup
cleanupAllProposals();
