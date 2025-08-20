// Test the from-proposal endpoint specifically
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:8080';

const testFromProposalEndpoint = async () => {
  try {
    console.log('Testing /api/matches/from-proposal endpoint...');
    
    // First create a proposal
    console.log('Step 1: Creating a test proposal...');
    const proposalResponse = await fetch(`${BACKEND_URL}/api/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        senderName: 'Mark Slam',
        receiverName: 'Randy Fishburn',
        divisions: ['FRBCAPL TEST'],
        type: 'schedule',
        phase: 'schedule',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        notes: 'Test proposal for endpoint testing'
      })
    });
    
    if (!proposalResponse.ok) {
      const text = await proposalResponse.text();
      console.log('❌ Failed to create proposal:', text.substring(0, 200));
      return;
    }
    
    const proposalData = await proposalResponse.json();
    const proposalId = proposalData.proposalId;
    console.log('✅ Created proposal:', proposalId);
    
    // Now test the from-proposal endpoint
    console.log('Step 2: Testing /api/matches/from-proposal...');
    const matchResponse = await fetch(`${BACKEND_URL}/api/matches/from-proposal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        proposalId: proposalId
      })
    });
    
    console.log('Response status:', matchResponse.status);
    console.log('Response headers:', matchResponse.headers.get('content-type'));
    
    if (matchResponse.ok) {
      const data = await matchResponse.json();
      console.log('✅ From-proposal endpoint working:', data);
    } else {
      const text = await matchResponse.text();
      console.log('❌ From-proposal endpoint failed:', text.substring(0, 300));
    }
    
    // Cleanup
    console.log('Step 3: Cleaning up...');
    try {
      await fetch(`${BACKEND_URL}/api/proposals/admin/${proposalId}`, {
        method: 'DELETE'
      });
      console.log('✅ Test proposal deleted');
    } catch (error) {
      console.log('⚠️ Could not delete test proposal:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Error testing from-proposal endpoint:', error.message);
  }
};

testFromProposalEndpoint();
