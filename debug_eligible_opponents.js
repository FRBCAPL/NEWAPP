// Debug script to check why eligible opponents filtering isn't working correctly
const BACKEND_URL = 'http://localhost:8080';
const TEST_DIVISION = 'FRBCAPL TEST';

async function debugEligibleOpponents() {
  console.log('🔍 Debugging Eligible Opponents Filtering...');
  
  const challenger = 'Vince Ivey'; // Rank 6
  
  try {
    // Get eligible opponents
    const response = await fetch(
      `${BACKEND_URL}/api/challenges/eligible-opponents/${encodeURIComponent(challenger)}/${encodeURIComponent(TEST_DIVISION)}`
    );
    
    if (!response.ok) {
      console.log(`❌ API error: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Eligible opponents response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check each player's stats individually
    const allPlayers = ['Randy Fishburn', 'Randall Fishburn', 'Don Lowe', 'Lucas Taylor'];
    
    console.log('\n🔍 Checking individual player stats:');
    for (const playerName of allPlayers) {
      const statsResponse = await fetch(
        `${BACKEND_URL}/api/challenges/stats/${encodeURIComponent(playerName)}/${encodeURIComponent(TEST_DIVISION)}`
      );
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log(`\n${playerName} (Rank ${stats.currentStanding}):`);
        console.log(`  - totalChallengeMatches: ${stats.totalChallengeMatches}`);
        console.log(`  - requiredDefenses: ${stats.requiredDefenses}`);
        console.log(`  - timesChallenged: ${stats.timesChallenged}`);
        console.log(`  - isEligibleForChallenges: ${stats.isEligibleForChallenges}`);
        console.log(`  - isEligibleForDefense: ${stats.isEligibleForDefense}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

debugEligibleOpponents();
