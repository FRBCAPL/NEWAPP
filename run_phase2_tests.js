// Simple Phase 2 Test Runner
// Run this to test all Phase 2 functionality

console.log('🚀 Starting Phase 2 System Tests...');
console.log('Make sure your backend server is running on http://localhost:8080');
console.log('');

// Import and run the comprehensive test
import('./test_phase2_comprehensive.js').catch(error => {
  console.error('❌ Failed to run tests:', error.message);
  console.log('');
  console.log('💡 Make sure:');
  console.log('   1. Your backend server is running (npm start in atlasbackend folder)');
  console.log('   2. MongoDB is connected');
  console.log('   3. You have the required standings JSON files');
  console.log('');
  console.log('📋 To start the backend server:');
  console.log('   cd atlasbackend');
  console.log('   npm start');
});
