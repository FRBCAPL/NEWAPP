// Test script for calendar integration
const { BACKEND_URL } = require('./src/config.js');

async function testCalendarIntegration() {
  console.log('Testing calendar integration...');
  
  // Test 1: Create a proposal
  console.log('\n1. Creating a test proposal...');
  const proposalData = {
    senderName: "Test Player 1",
    receiverName: "Test Player 2", 
    senderEmail: "test1@example.com",
    receiverEmail: "test2@example.com",
    date: "2024-12-25",
    time: "7:00 PM",
    location: "Test Location",
    note: "Test proposal for calendar integration",
    gameType: "8-Ball",
    raceLength: "Race to 5",
    phase: "scheduled",
    divisions: ["FRBCAPL TEST"]
  };

  try {
    const createResponse = await fetch(`${BACKEND_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposalData)
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create proposal: ${createResponse.statusText}`);
    }

    const createResult = await createResponse.json();
    console.log('✅ Proposal created successfully:', createResult.proposalId);

    // Test 2: Confirm the proposal (this should trigger calendar integration)
    console.log('\n2. Confirming the proposal...');
    const confirmResponse = await fetch(`${BACKEND_URL}/api/proposals/${createResult.proposalId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'confirmed',
        note: 'Test confirmation'
      })
    });

    if (!confirmResponse.ok) {
      throw new Error(`Failed to confirm proposal: ${confirmResponse.statusText}`);
    }

    const confirmResult = await confirmResponse.json();
    console.log('✅ Proposal confirmed successfully');

    // Test 3: Check if a match was created
    console.log('\n3. Checking if match was created...');
    const matchesResponse = await fetch(`${BACKEND_URL}/api/matches?proposalId=${createResult.proposalId}`);
    
    if (!matchesResponse.ok) {
      throw new Error(`Failed to fetch matches: ${matchesResponse.statusText}`);
    }

    const matches = await matchesResponse.json();
    console.log('✅ Match created:', matches.length > 0 ? 'Yes' : 'No');

    console.log('\n🎉 Calendar integration test completed successfully!');
    console.log('Check your Google Calendar to see if the event was created.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCalendarIntegration();
