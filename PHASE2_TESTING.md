# Phase 2 System Testing Guide

## 🎯 Overview

This testing system automatically verifies all aspects of the Phase 2 challenge system, including:
- Dynamic challenge limits based on times challenged
- Standings-based challenge restrictions (up to 4 spots above)
- Total match limits (challenges + defenses = 2-4 total)
- Defense limits (0-2 required if challenged)
- Weekly limits (1 match per week)
- API response consistency
- Edge cases and error handling

## 🚀 Quick Start

### Prerequisites
1. **Backend Server Running**: Make sure your backend is running on `http://localhost:8080`
2. **MongoDB Connected**: Database should be accessible
3. **Standings Files**: Required JSON files should be in place

### Run All Tests
```bash
node run_phase2_tests.js
```

### Run Comprehensive Tests Directly
```bash
node test_phase2_comprehensive.js
```

## 📋 What Gets Tested

### 1. Basic Stats Initialization ✅
- Verifies all players start with correct default values
- Tests: `totalChallengeMatches: 0`, `timesChallenged: 0`, `remainingChallenges: 4`, etc.

### 2. Dynamic Challenge Limits ✅
- Tests the core Phase 2 rule: "Times Challenged → Challenges You May Issue"
- **0 times challenged** = 4 challenges allowed
- **1 time challenged** = 3 challenges allowed  
- **2+ times challenged** = 2 challenges allowed

### 3. Standings-Based Restrictions ✅
- Verifies players can only challenge up to 4 spots above them
- Tests both valid and invalid challenge attempts
- Ensures proper error messages

### 4. Total Match Limits ✅
- Confirms that challenges + defenses count toward the 4-match total
- Tests backend validation matches frontend display logic

### 5. Defense Limits ✅
- Verifies players can't be required to defend more than 2 times
- Tests proper error handling for defense limits

### 6. Weekly Limits ✅
- Ensures players can only have 1 match per week
- Tests both challenge and defense weekly restrictions

### 7. Eligible Opponents Filtering ✅
- Verifies the API returns only valid opponents
- Tests standings range filtering (up to 4 spots above)

### 8. API Response Consistency ✅
- Ensures stats and limits APIs return consistent data
- Tests overlapping fields match between endpoints

### 9. Edge Cases ✅
- Self-challenges (should be blocked)
- Non-existent players (should be blocked)
- Empty parameters (should be blocked)

### 10. Comprehensive Integration ✅
- Tests the full challenge flow from validation to stats updates
- Verifies dynamic limits update correctly when challenged
- Tests duplicate challenge prevention

## 🔧 Test Configuration

### Test Players
The system uses 6 test players with different standings:
- **Test Player 1** (Rank 1)
- **Test Player 2** (Rank 2) 
- **Test Player 3** (Rank 3)
- **Test Player 4** (Rank 4)
- **Test Player 5** (Rank 5)
- **Test Player 6** (Rank 6)

### Test Division
- Uses `FRBCAPL TEST` division
- Requires corresponding standings JSON file

## 📊 Understanding Test Results

### ✅ Success Indicators
- All tests pass with green checkmarks
- No error messages in red
- Summary shows "ALL TESTS PASSED!"

### ❌ Failure Indicators
- Red X marks for failed tests
- Error messages explaining what went wrong
- Summary shows failed test count

### Common Issues & Solutions

#### Backend Not Running
```
❌ Failed to run tests: fetch failed
```
**Solution**: Start your backend server (`npm start` in atlasbackend folder)

#### Missing Standings File
```
❌ Error loading standings for division FRBCAPL TEST
```
**Solution**: Ensure `standings_FRBCAPL_TEST.json` exists in `atlasbackend/public/`

#### Database Connection Issues
```
❌ Failed to get stats: System error during validation
```
**Solution**: Check MongoDB connection and ensure database is accessible

## 🛠️ Manual Testing Tips

### Test Dynamic Limits Manually
1. Go to Phase 2 tracker in your app
2. Check a player's "Dynamic Challenge Limits" section
3. Create a challenge to that player
4. Verify their limits decrease correctly

### Test Standings Restrictions
1. Try challenging a player more than 4 spots above you
2. Should see error message about standings restrictions
3. Try challenging a player within 4 spots - should work

### Test Total Match Limits
1. Create challenges until a player reaches 4 total matches
2. Try to challenge them again - should be blocked
3. Verify the error message mentions "total matches"

## 🎯 What This Proves

When all tests pass, you can be confident that:

✅ **Dynamic Challenge Limits** work correctly  
✅ **Standings Restrictions** are properly enforced  
✅ **Total Match Limits** (challenges + defenses) are accurate  
✅ **Defense Requirements** are tracked correctly  
✅ **Weekly Limits** prevent over-scheduling  
✅ **API Consistency** between frontend and backend  
✅ **Error Handling** works for edge cases  
✅ **Integration** between all systems is solid  

## 🚨 If Tests Fail

1. **Check the error messages** - they'll tell you exactly what's wrong
2. **Verify backend is running** - most failures are connection issues
3. **Check database connection** - ensure MongoDB is accessible
4. **Review recent changes** - if you just modified code, check for syntax errors
5. **Restart backend** - sometimes needed after code changes

## 📞 Need Help?

If tests are failing and you can't figure out why:
1. Copy the exact error messages
2. Check that your backend server is running
3. Verify MongoDB connection
4. Look at the backend console for additional error details

The testing system is designed to be comprehensive and will catch any issues with the Phase 2 implementation!
