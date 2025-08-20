// Simple test to check if matches endpoint is accessible
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:8080';

const testMatchesEndpoint = async () => {
  try {
    console.log('Testing matches endpoint...');
    
    // Test basic matches endpoint
    const response = await fetch(`${BACKEND_URL}/api/matches`);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Matches endpoint working:', data);
    } else {
      const text = await response.text();
      console.log('❌ Matches endpoint failed:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.log('❌ Error testing matches endpoint:', error.message);
  }
};

testMatchesEndpoint();
