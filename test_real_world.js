// Simple test to show real-world Phase 2 behavior with fresh stats
const BACKEND_URL = 'http://localhost:8080';
const TEST_DIVISION = 'FRBCAPL TEST';

async function testRealWorldBehavior() {
  console.log('🌍 Testing Real-World Phase 2 Behavior (Fresh Stats)');
  console.log('===================================================\n');
  
  const challenger = 'Vince Ivey'; // Rank 6
  const testPlayers = ['Randy Fishburn', 'Randall Fishburn', 'Don Lowe', 'Lucas Taylor'];
  
  console.log(`🔍 Testing eligible opponents for ${challenger} (Rank 6):`);
  
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
    const eligibleOpponents = data.eligibleOpponents;
    
    console.log(`✅ Found ${eligibleOpponents.length} eligible opponents:`);
    eligibleOpponents.forEach(opp => {
      console.log(`   - ${opp.name} (Rank ${opp.position})`);
    });
    
    console.log('\n🔍 Testing individual player stats:');
    for (const playerName of testPlayers) {
      const statsResponse = await fetch(
        `${BACKEND_URL}/api/challenges/stats/${encodeURIComponent(playerName)}/${encodeURIComponent(TEST_DIVISION)}`
      );
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log(`\n${playerName} (Rank ${stats.currentStanding}):`);
        console.log(`   - Challenges issued: ${stats.matchesAsChallenger}/4`);
        console.log(`   - Defenses required: ${stats.requiredDefenses}/2`);
        console.log(`   - Times challenged: ${stats.timesChallenged}`);
        console.log(`   - Remaining challenges: ${stats.remainingChallenges}`);
        console.log(`   - Can be challenged: ${stats.isEligibleForChallenges ? '✅ Yes' : '❌ No'}`);
      }
    }
    
    console.log('\n🎯 Testing a sample challenge validation:');
    const sampleValidation = await fetch(`${BACKEND_URL}/api/challenges/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderName: challenger,
        receiverName: 'Randy Fishburn',
        division: TEST_DIVISION
      })
    });
    
    if (sampleValidation.ok) {
      const validation = await sampleValidation.json();
      console.log(`Challenge from ${challenger} to Randy Fishburn:`);
      console.log(`   - Valid: ${validation.isValid ? '✅ Yes' : '❌ No'}`);
      if (!validation.isValid) {
        console.log(`   - Reason: ${validation.errors.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testRealWorldBehavior();
