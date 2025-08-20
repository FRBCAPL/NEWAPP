// Basic API Connectivity Test
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:8080';

const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const testBasicAPI = async () => {
  try {
    log('Testing basic API connectivity...');
    
    // Test 1: Check if server is running
    const response = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    log(`Users API Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      log(`Users API Response:`, data);
    } else {
      const text = await response.text();
      log(`Users API Error: ${text.substring(0, 200)}`);
    }
    
    // Test 2: Check proposals endpoint
    const proposalsResponse = await fetch(`${BACKEND_URL}/api/proposals`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    log(`Proposals API Response status: ${proposalsResponse.status}`);
    
    if (proposalsResponse.ok) {
      const data = await proposalsResponse.json();
      log(`Proposals API Response:`, data);
    } else {
      const text = await proposalsResponse.text();
      log(`Proposals API Error: ${text.substring(0, 200)}`);
    }
    
  } catch (error) {
    log(`Error: ${error.message}`);
  }
};

testBasicAPI();
