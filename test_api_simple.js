// Simple API test to check backend connectivity
const BACKEND_URL = 'http://localhost:8080';

async function testAPI() {
  console.log('🔍 Testing backend API connectivity...');
  
  try {
    // Test basic connectivity
    const response = await fetch(`${BACKEND_URL}/api/challenges/stats/Mark%20Slam/FRBCAPL%20TEST`);
    
    if (!response.ok) {
      console.log(`❌ API returned status: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if timesChallenged is present
    if (data.timesChallenged !== undefined) {
      console.log('✅ timesChallenged field is present:', data.timesChallenged);
    } else {
      console.log('❌ timesChallenged field is missing');
    }
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
    console.log('💡 Make sure your backend server is running on http://localhost:8080');
  }
}

testAPI();
