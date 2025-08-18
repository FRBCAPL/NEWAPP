// Debug script to check validation logic for each player
const BACKEND_URL = 'http://localhost:8080';
const TEST_DIVISION = 'FRBCAPL TEST';

async function debugValidationLogic() {
  console.log('🔍 Debugging Validation Logic...');
  
  const challenger = 'Vince Ivey'; // Rank 6
  const testPlayers = ['Randy Fishburn', 'Randall Fishburn', 'Don Lowe', 'Lucas Taylor'];
  
  for (const playerName of testPlayers) {
    console.log(`\n🔍 Testing challenge from ${challenger} to ${playerName}:`);
    
    try {
      // Test challenge validation
      const validationResponse = await fetch(`${BACKEND_URL}/api/challenges/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: challenger,
          receiverName: playerName,
          division: TEST_DIVISION
        })
      });
      
      if (validationResponse.ok) {
        const validation = await validationResponse.json();
        console.log(`  ✅ Validation response:`, validation);
        
        if (!validation.isValid) {
          console.log(`  ❌ Challenge blocked: ${validation.errors.join(', ')}`);
        } else {
          console.log(`  ✅ Challenge allowed`);
        }
      } else {
        console.log(`  ❌ Validation request failed: ${validationResponse.status}`);
      }
      
      // Get player stats
      const statsResponse = await fetch(
        `${BACKEND_URL}/api/challenges/stats/${encodeURIComponent(playerName)}/${encodeURIComponent(TEST_DIVISION)}`
      );
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log(`  📊 Stats: totalMatches=${stats.totalChallengeMatches}, defenses=${stats.requiredDefenses}, timesChallenged=${stats.timesChallenged}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
}

debugValidationLogic();
