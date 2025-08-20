// Comprehensive Data Migration Script
// Converts old proposal data to new Match system
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:8080';

const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const apiCall = async (endpoint, method = 'GET', body = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${response.status} - ${error.error || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    log(`API Call Failed: ${endpoint}`, { error: error.message });
    throw error;
  }
};

// Migration statistics
const migrationStats = {
  totalProposals: 0,
  completedProposals: 0,
  confirmedProposals: 0,
  pendingProposals: 0,
  matchesCreated: 0,
  matchesSkipped: 0,
  errors: 0,
  divisions: new Set(),
  players: new Set()
};

const migrateData = async () => {
  try {
    log('🚀 Starting Comprehensive Data Migration');
    log('Step 1: Analyzing existing data...');
    
    // Get all proposals
    const allProposals = await apiCall('/api/proposals/admin/list?limit=1000');
    migrationStats.totalProposals = allProposals.proposals?.length || 0;
    
    log(`Found ${migrationStats.totalProposals} total proposals`);
    
    if (migrationStats.totalProposals === 0) {
      log('✅ No proposals found - migration complete!');
      return;
    }
    
    // Categorize proposals
    const proposals = allProposals.proposals || [];
    proposals.forEach(proposal => {
      if (proposal.completed) {
        migrationStats.completedProposals++;
      } else if (proposal.status === 'confirmed') {
        migrationStats.confirmedProposals++;
      } else {
        migrationStats.pendingProposals++;
      }
      
      // Track divisions and players
      if (proposal.divisions && Array.isArray(proposal.divisions)) {
        proposal.divisions.forEach(div => migrationStats.divisions.add(div));
      }
      if (proposal.senderName) migrationStats.players.add(proposal.senderName);
      if (proposal.receiverName) migrationStats.players.add(proposal.receiverName);
    });
    
    log('Data Analysis Results:', {
      totalProposals: migrationStats.totalProposals,
      completedProposals: migrationStats.completedProposals,
      confirmedProposals: migrationStats.confirmedProposals,
      pendingProposals: migrationStats.pendingProposals,
      uniqueDivisions: Array.from(migrationStats.divisions),
      uniquePlayers: Array.from(migrationStats.players).length
    });
    
    // Step 2: Migrate completed proposals to matches
    log('Step 2: Migrating completed proposals to matches...');
    
    for (const proposal of proposals) {
      if (proposal.completed && proposal.status === 'confirmed') {
        try {
          // Check if match already exists for this proposal
          const existingMatches = await apiCall(`/api/matches?proposalId=${proposal._id}`);
          
          if (existingMatches.length > 0) {
            log(`⏭️ Match already exists for proposal ${proposal._id} - skipping`);
            migrationStats.matchesSkipped++;
            continue;
          }
          
          // Create match from completed proposal
          const matchData = {
            proposalId: proposal._id,
            player1Id: proposal.senderName,
            player2Id: proposal.receiverName,
            division: proposal.divisions?.[0] || 'Unknown',
            type: proposal.phase === 'challenge' ? 'challenge' : 'schedule',
            scheduledDate: proposal.date ? new Date(proposal.date) : new Date(),
            status: 'completed',
            completedDate: proposal.winnerChangedAt || new Date(),
            winner: proposal.winner,
            loser: proposal.winner === proposal.senderName ? proposal.receiverName : proposal.senderName,
            score: 'TBD',
            location: proposal.location || 'TBD',
            notes: `Migrated from proposal - ${proposal.message || ''}`
          };
          
          const matchResponse = await apiCall('/api/matches/from-proposal', 'POST', {
            proposalId: proposal._id
          });
          
          if (matchResponse.success) {
            // Update the match with completion data
            await apiCall(`/api/matches/${matchResponse.matchId}/complete`, 'PATCH', {
              winner: proposal.winner,
              score: 'TBD',
              notes: `Migrated from proposal - ${proposal.message || ''}`
            });
            
            log(`✅ Created match for proposal ${proposal._id}`);
            migrationStats.matchesCreated++;
          }
          
        } catch (error) {
          log(`❌ Error migrating proposal ${proposal._id}:`, error.message);
          migrationStats.errors++;
        }
      }
    }
    
    // Step 3: Migrate confirmed (but not completed) proposals
    log('Step 3: Migrating confirmed proposals to scheduled matches...');
    
    for (const proposal of proposals) {
      if (proposal.status === 'confirmed' && !proposal.completed) {
        try {
          // Check if match already exists
          const existingMatches = await apiCall(`/api/matches?proposalId=${proposal._id}`);
          
          if (existingMatches.length > 0) {
            log(`⏭️ Match already exists for proposal ${proposal._id} - skipping`);
            migrationStats.matchesSkipped++;
            continue;
          }
          
          // Create scheduled match
          const matchResponse = await apiCall('/api/matches/from-proposal', 'POST', {
            proposalId: proposal._id
          });
          
          if (matchResponse.success) {
            log(`✅ Created scheduled match for proposal ${proposal._id}`);
            migrationStats.matchesCreated++;
          }
          
        } catch (error) {
          log(`❌ Error migrating proposal ${proposal._id}:`, error.message);
          migrationStats.errors++;
        }
      }
    }
    
    // Step 4: Verify migration results
    log('Step 4: Verifying migration results...');
    
    const [scheduledMatches, completedMatches] = await Promise.all([
      apiCall('/api/matches/status/FRBCAPL%20TEST/scheduled'),
      apiCall('/api/matches/status/FRBCAPL%20TEST/completed')
    ]);
    
    log('Migration Results:', {
      totalProposals: migrationStats.totalProposals,
      matchesCreated: migrationStats.matchesCreated,
      matchesSkipped: migrationStats.matchesSkipped,
      errors: migrationStats.errors,
      scheduledMatches: scheduledMatches.length,
      completedMatches: completedMatches.length,
      totalMatches: scheduledMatches.length + completedMatches.length
    });
    
    // Step 5: Data cleanup recommendations
    log('Step 5: Data cleanup recommendations...');
    
    if (migrationStats.matchesCreated > 0) {
      log('🧹 Cleanup Recommendations:');
      log('1. Verify all matches were created correctly');
      log('2. Test the app functionality with new match system');
      log('3. Consider archiving old proposals after verification');
      log('4. Update any remaining legacy code references');
    }
    
    log('✅ Data Migration Completed Successfully!');
    
  } catch (error) {
    log(`❌ Migration Failed: ${error.message}`);
    throw error;
  }
};

// Run the migration
migrateData().catch(error => {
  log(`❌ Migration failed: ${error.message}`);
  process.exit(1);
});
