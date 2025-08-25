import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:8080';

async function debugAuth() {
  console.log('🔍 Debugging authentication...\n');
  
  const adminCredentials = {
    email: 'frbcapl@gmail.com',
    pin: '777777'
  };
  
  const testOperator = {
    email: 'testoperator@example.com',
    firstName: 'Test',
    lastName: 'Operator',
    phone: '555-1234',
    password: 'testpass123',
    adminEmail: adminCredentials.email,
    adminPin: adminCredentials.pin
  };
  
  console.log('📤 Sending request with data:', JSON.stringify(testOperator, null, 2));
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/platform/operators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOperator)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📥 Response body:', responseText);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugAuth();
