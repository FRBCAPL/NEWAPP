#!/usr/bin/env node

/**
 * MANUAL TEST DATA CLEANUP
 * 
 * Since the DELETE endpoint doesn't exist, this script will attempt
 * alternative cleanup methods and provide manual instructions if needed
 */

const BACKEND_URL = 'https://atlasbackend-bnng.onrender.com';

const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

const cleanup = async () => {
  log('🧹 MANUAL CLEANUP OF TEST USERS');
  log('===============================');
  
  try {
    // Get current ladder data
    const response = await fetch(`${BACKEND_URL}/api/ladder/ladders/499-under/players`);
    const players = await response.json();
    
    const testUsers = players.filter(p => 
      p.email && p.email.includes('laddertest-')
    );
    
    log(`Found ${testUsers.length} test users to remove:`);
    testUsers.forEach(user => {
      log(`  • ${user.firstName} ${user.lastName} (${user.email}) - Position ${user.position}`);
    });
    
    if (testUsers.length > 0) {
      log('\n📝 MANUAL CLEANUP REQUIRED:');
      log('=============================');
      log('The ladder system does not have a public DELETE endpoint.');
      log('Test users need to be removed manually by an admin or through database access.');
      log('\nTest users to remove:');
      testUsers.forEach(user => {
        log(`  DELETE WHERE email = '${user.email}' AND firstName = '${user.firstName}'`);
      });
      
      log('\n⚠️ IMPORTANT: These users have identifiable test emails and can be safely removed.');
    } else {
      log('✅ No test users found - cleanup not needed');
    }
    
  } catch (error) {
    log(`❌ Error during cleanup check: ${error.message}`);
  }
};

cleanup();