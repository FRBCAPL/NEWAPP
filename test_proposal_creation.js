// Test Proposal Creation API Response
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:8080';

const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const testProposalCreation = async () => {
  try {
    log('Testing proposal creation API...');
    
    const response = await fetch(`${BACKEND_URL}/api/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        senderName: 'Mark Slam',
        receiverName: 'John Smith',
        divisions: ['FRBCAPL TEST'],
        type: 'schedule',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        notes: 'Test proposal'
      })
    });
    
    log(`Response status: ${response.status}`);
    log(`Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    log(`Response body (raw): ${text}`);
    
    try {
      const json = JSON.parse(text);
      log(`Response body (parsed):`, json);
    } catch (e) {
      log(`Failed to parse JSON: ${e.message}`);
    }
    
  } catch (error) {
    log(`Error: ${error.message}`);
  }
};

testProposalCreation();
