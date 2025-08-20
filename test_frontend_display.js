// Test Frontend Display Logic: New Match Data Structure
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

// Simulate the frontend display logic
const simulateFrontendDisplay = (matches, fullName, selectedDivision) => {
  log('🧪 Simulating Frontend Display Logic');
  
  // Simulate filteredUpcomingMatches logic
  const filteredUpcomingMatches = matches.filter(m => m.division === selectedDivision);
  log(`Filtered matches for division "${selectedDivision}": ${filteredUpcomingMatches.length}`);
  
  // Simulate match display logic
  const displayData = filteredUpcomingMatches.map((match, idx) => {
    let opponent = '';
    let formattedDate = '';
    
    // Handle new Match model structure
    if (match.player1Id && match.player2Id) {
      if (match.player1Id.trim().toLowerCase() === fullName.trim().toLowerCase()) {
        opponent = match.player2Id;
      } else {
        opponent = match.player1Id;
      }
      
      // Use scheduledDate for new Match model
      if (match.scheduledDate) {
        const dateObj = new Date(match.scheduledDate);
        if (!isNaN(dateObj.getTime())) {
          const dateStr = dateObj.toISOString().split('T')[0];
          const [year, month, day] = dateStr.split('-');
          formattedDate = `${month}-${day}-${year}`;
        } else {
          formattedDate = '[Invalid Date]';
        }
      } else {
        formattedDate = '[No Date]';
      }
    } else {
      // Fallback for old proposal structure
      if (match.senderName && match.receiverName) {
        if (match.senderName.trim().toLowerCase() === fullName.trim().toLowerCase()) {
          opponent = match.receiverName;
        } else {
          opponent = match.senderName;
        }
      }
      if (match.date) {
        const parts = match.date.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          formattedDate = `${month}-${day}-${year}`;
        } else {
          formattedDate = '[Invalid Date]';
        }
      } else {
        formattedDate = '[No Date]';
      }
    }
    
    const isCompleted = match.status === 'completed';
    const actuallyCompleted = match.status === 'completed';
    
    return {
      id: match._id,
      opponent,
      formattedDate,
      isCompleted,
      actuallyCompleted,
      location: match.location || '[No Location]',
      status: match.status,
      type: match.type
    };
  });
  
  return displayData;
};

// Simulate the scheduled matches counting logic
const simulateScheduledCounting = (scheduledMatches, completedMatches, fullName, selectedDivision) => {
  log('🧪 Simulating Scheduled Matches Counting Logic');
  
  // Count both confirmed and completed matches as 'scheduled'
  const scheduledOrCompletedMatches = [
    ...scheduledMatches.filter(match =>
      match.division === selectedDivision &&
      ([match.player1Id?.trim().toLowerCase(), match.player2Id?.trim().toLowerCase()].includes(fullName.toLowerCase()))
    ),
    ...completedMatches.filter(match =>
      match.division === selectedDivision &&
      ([match.player1Id?.trim().toLowerCase(), match.player2Id?.trim().toLowerCase()].includes(fullName.toLowerCase()))
    )
  ];
  
  // Remove duplicates (in case a match is both confirmed and completed)
  const uniqueScheduledOrCompleted = Array.from(new Set(scheduledOrCompletedMatches.map(m => m._id))).map(id =>
    scheduledOrCompletedMatches.find(m => m._id === id)
  );
  
  const matchesScheduledCount = uniqueScheduledOrCompleted.length;
  const requiredMatches = 6; // Phase 1
  const matchesToScheduleCount = Math.max(0, requiredMatches - matchesScheduledCount);
  
  return {
    matchesScheduledCount,
    matchesToScheduleCount,
    requiredMatches,
    uniqueScheduledOrCompleted
  };
};

const testFrontendDisplay = async () => {
  try {
    log('🧪 Testing Frontend Display Logic: New Match Data Structure');
    
    // Step 1: Get current matches data
    log('Step 1: Getting current matches data...');
    
    const [scheduledMatches, completedMatches] = await Promise.all([
      apiCall('/api/matches/status/FRBCAPL%20TEST/scheduled'),
      apiCall('/api/matches/status/FRBCAPL%20TEST/completed')
    ]);
    
    log(`Found ${scheduledMatches.length} scheduled matches`);
    log(`Found ${completedMatches.length} completed matches`);
    
    // Step 2: Test frontend display logic
    log('Step 2: Testing frontend display logic...');
    
    const fullName = 'Mark Slam';
    const selectedDivision = 'FRBCAPL TEST';
    
    const allMatches = [...scheduledMatches, ...completedMatches];
    const displayData = simulateFrontendDisplay(allMatches, fullName, selectedDivision);
    
    log(`Display data generated for ${displayData.length} matches`);
    
    // Show sample display data
    if (displayData.length > 0) {
      log('Sample display data:', displayData[0]);
    }
    
    // Step 3: Test scheduled matches counting logic
    log('Step 3: Testing scheduled matches counting logic...');
    
    const countingData = simulateScheduledCounting(scheduledMatches, completedMatches, fullName, selectedDivision);
    
    log('Counting results:', {
      matchesScheduledCount: countingData.matchesScheduledCount,
      matchesToScheduleCount: countingData.matchesToScheduleCount,
      requiredMatches: countingData.requiredMatches
    });
    
    // Step 4: Test player filtering (simulating useMatches logic)
    log('Step 4: Testing player filtering...');
    
    const playerScheduled = scheduledMatches.filter(match => 
      match.player1Id === fullName || match.player2Id === fullName
    );
    const playerCompleted = completedMatches.filter(match => 
      match.player1Id === fullName || match.player2Id === fullName
    );
    
    log(`Player "${fullName}" has ${playerScheduled.length} scheduled matches`);
    log(`Player "${fullName}" has ${playerCompleted.length} completed matches`);
    
    // Step 5: Test data structure validation
    log('Step 5: Testing data structure validation...');
    
    const validMatches = allMatches.filter(match => {
      const hasRequiredFields = match.player1Id && match.player2Id && match.division && match.status;
      const hasValidStatus = ['scheduled', 'completed', 'cancelled'].includes(match.status);
      const hasValidDates = match.scheduledDate || (match.status === 'completed' && match.completedDate);
      
      return hasRequiredFields && hasValidStatus && hasValidDates;
    });
    
    log(`Data structure validation: ${validMatches.length}/${allMatches.length} matches have valid structure`);
    
    // Step 6: Test edge cases
    log('Step 6: Testing edge cases...');
    
    // Test with empty data
    const emptyDisplayData = simulateFrontendDisplay([], fullName, selectedDivision);
    log(`Empty data test: ${emptyDisplayData.length} display items`);
    
    // Test with invalid division
    const invalidDivisionData = simulateFrontendDisplay(allMatches, fullName, 'INVALID_DIVISION');
    log(`Invalid division test: ${invalidDivisionData.length} display items`);
    
    log('✅ Frontend Display Logic Test Completed Successfully!');
    
  } catch (error) {
    log(`❌ Test Failed: ${error.message}`);
  }
};

// Run the test
testFrontendDisplay();
