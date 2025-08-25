import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:8080';

// Simulate the frontend platform admin dashboard functionality
async function testPlatformAdminFrontend() {
  console.log('🧪 Testing Platform Admin Frontend Functionality...\n');
  
  // Simulate the credentials that the frontend would use
  const adminCredentials = {
    email: 'frbcapl@gmail.com',
    pin: '777777'
  };
  
  const headers = {
    'Content-Type': 'application/json',
    'x-admin-email': adminCredentials.email,
    'x-admin-pin': adminCredentials.pin
  };
  
  try {
    // Test 1: Load dashboard data (like the frontend does)
    console.log('📊 Test 1: Loading dashboard data...');
    const [statsRes, leaguesRes, operatorsRes, adminsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/platform/stats`, { headers }),
      fetch(`${BACKEND_URL}/api/platform/leagues`, { headers }),
      fetch(`${BACKEND_URL}/api/platform/operators`, { headers }),
      fetch(`${BACKEND_URL}/api/platform/admins`, { headers })
    ]);
    
    console.log('✅ Stats response:', statsRes.status);
    console.log('✅ Leagues response:', leaguesRes.status);
    console.log('✅ Operators response:', operatorsRes.status);
    console.log('✅ Admins response:', adminsRes.status);
    
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      console.log('📈 Platform Stats:', JSON.stringify(statsData, null, 2));
    }
    
    // Test 2: Create a test league
    console.log('\n🏆 Test 2: Creating a test league...');
    const testLeague = {
      leagueId: 'test-league-' + Date.now(),
      name: 'Test League',
      description: 'A test league created by the frontend',
      adminEmail: 'test@example.com',
      adminName: 'Test Admin'
    };
    
    const createLeagueRes = await fetch(`${BACKEND_URL}/api/platform/leagues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testLeague,
        adminEmail: adminCredentials.email,
        adminPin: adminCredentials.pin
      })
    });
    
    console.log('✅ Create league response:', createLeagueRes.status);
    if (createLeagueRes.ok) {
      const leagueData = await createLeagueRes.json();
      console.log('✅ League created:', leagueData);
    } else {
      const errorData = await createLeagueRes.text();
      console.log('❌ League creation failed:', errorData);
    }
    
    // Test 3: Create a test operator
    console.log('\n👤 Test 3: Creating a test operator...');
    const testOperator = {
      email: 'testoperator@example.com',
      firstName: 'Test',
      lastName: 'Operator',
      phone: '555-1234',
      password: 'testpass123'
    };
    
    const createOperatorRes = await fetch(`${BACKEND_URL}/api/platform/operators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testOperator,
        adminEmail: adminCredentials.email,
        adminPin: adminCredentials.pin
      })
    });
    
    console.log('✅ Create operator response:', createOperatorRes.status);
    if (createOperatorRes.ok) {
      const operatorData = await createOperatorRes.json();
      console.log('✅ Operator created:', operatorData);
    } else {
      const errorData = await createOperatorRes.text();
      console.log('❌ Operator creation failed:', errorData);
    }
    
    // Test 4: Create a test admin
    console.log('\n🔐 Test 4: Creating a test admin...');
    const testAdmin = {
      email: 'testadmin@example.com',
      firstName: 'Test',
      lastName: 'Admin',
      phone: '555-5678',
      password: 'testpass123',
      role: 'admin',
      permissions: {
        canViewAllLeagueData: true,
        canViewSystemLogs: true
      }
    };
    
    const createAdminRes = await fetch(`${BACKEND_URL}/api/platform/admins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testAdmin,
        adminEmail: adminCredentials.email,
        adminPin: adminCredentials.pin
      })
    });
    
    console.log('✅ Create admin response:', createAdminRes.status);
    if (createAdminRes.ok) {
      const adminData = await createAdminRes.json();
      console.log('✅ Admin created:', adminData);
    } else {
      const errorData = await createAdminRes.text();
      console.log('❌ Admin creation failed:', errorData);
    }
    
    console.log('\n🎉 All platform admin frontend tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPlatformAdminFrontend();
