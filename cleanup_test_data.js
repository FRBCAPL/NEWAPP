// Cleanup script to reset all Phase 2 test data
const BACKEND_URL = 'http://localhost:8080';
const TEST_DIVISION = 'FRBCAPL TEST';

const TEST_PLAYERS = [
  'Mark Slam',
  'Randy Fishburn', 
  'Randall Fishburn',
  'Don Lowe',
  'Lucas Taylor',
  'Vince Ivey'
];

async function cleanupTestData() {
  console.log('🧹 Cleaning up Phase 2 test data...');
  
  for (const playerName of TEST_PLAYERS) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/challenges/stats/${encodeURIComponent(playerName)}/${encodeURIComponent(TEST_DIVISION)}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        console.log(`✅ Reset stats for ${playerName}`);
      } else {
        console.log(`⚠️ Could not reset ${playerName} (may not exist)`);
      }
    } catch (error) {
      console.log(`❌ Error resetting ${playerName}: ${error.message}`);
    }
  }
  
  console.log('🎉 Cleanup complete! All test players should have fresh stats.');
}

cleanupTestData().catch(console.error);
