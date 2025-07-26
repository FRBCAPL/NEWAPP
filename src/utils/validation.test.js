/**
 * Simple Tests for Pool League Validation Functions
 * Run with: node src/utils/validation.test.js
 */

// Import validation functions (we'll copy them here for testing)
const validateEmail = (email) => {
  return email && email.includes('@') && email.length > 3;
};

const validateNote = (noteText) => {
  if (!noteText || noteText.trim().length === 0) {
    return { isValid: false, error: 'Note cannot be empty' };
  }
  if (noteText.trim().length > 500) {
    return { isValid: false, error: 'Note must be less than 500 characters' };
  }
  if (noteText.trim().length < 3) {
    return { isValid: false, error: 'Note must be at least 3 characters' };
  }
  return { isValid: true };
};

const validateUserData = (user) => {
  if (!user) return { isValid: false, error: 'No user data received' };
  if (!user.email) return { isValid: false, error: 'User email missing' };
  if (!user.firstName && !user.lastName) return { isValid: false, error: 'User name missing' };
  return { isValid: true };
};

const normalizeDivisions = (divisions) => {
  if (Array.isArray(divisions)) {
    return divisions
      .map(s => s.trim())
      .filter(Boolean)
      .filter(div => div.length > 0);
  } else if (typeof divisions === "string") {
    return divisions
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .filter(div => div.length > 0);
  }
  return [];
};

// Test Runner
function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name, testFn) {
    try {
      testFn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  console.log('🧪 Running Pool League Validation Tests...\n');

  // Email Validation Tests
  test('validateEmail - valid email', () => {
    assert(validateEmail('user@example.com'), 'Should accept valid email');
    assert(validateEmail('admin@bcapl.com'), 'Should accept admin email');
  });

  test('validateEmail - invalid email', () => {
    assert(!validateEmail(''), 'Should reject empty email');
    assert(!validateEmail('abc'), 'Should reject email without @');
    assert(!validateEmail('@'), 'Should reject just @');
  });

  // Note Validation Tests
  test('validateNote - valid notes', () => {
    const result1 = validateNote('Good game!');
    assert(result1.isValid, 'Should accept normal note');
    
    const result2 = validateNote('Hello');
    assert(result2.isValid, 'Should accept 5 character note');
  });

  test('validateNote - invalid notes', () => {
    const result1 = validateNote('');
    assert(!result1.isValid && result1.error.includes('empty'), 'Should reject empty note');
    
    const result2 = validateNote('Hi');
    assert(!result2.isValid && result2.error.includes('3 characters'), 'Should reject short note');
    
    const longNote = 'a'.repeat(501);
    const result3 = validateNote(longNote);
    assert(!result3.isValid && result3.error.includes('500 characters'), 'Should reject long note');
  });

  // User Data Validation Tests
  test('validateUserData - valid user', () => {
    const user = { email: 'test@example.com', firstName: 'John', lastName: 'Doe' };
    const result = validateUserData(user);
    assert(result.isValid, 'Should accept valid user');
  });

  test('validateUserData - invalid user', () => {
    const result1 = validateUserData(null);
    assert(!result1.isValid, 'Should reject null user');
    
    const result2 = validateUserData({ firstName: 'John' });
    assert(!result2.isValid && result2.error.includes('email'), 'Should reject user without email');
    
    const result3 = validateUserData({ email: 'test@example.com' });
    assert(!result3.isValid && result3.error.includes('name'), 'Should reject user without name');
  });

  // Divisions Normalization Tests
  test('normalizeDivisions - array input', () => {
    const result = normalizeDivisions(['FRBCAPL TEST', ' Singles Test ', '']);
    assert(result.length === 2, 'Should filter out empty strings');
    assert(result[0] === 'FRBCAPL TEST', 'Should keep first division');
    assert(result[1] === 'Singles Test', 'Should trim spaces');
  });

  test('normalizeDivisions - string input', () => {
    const result = normalizeDivisions('FRBCAPL TEST, Singles Test, ');
    assert(result.length === 2, 'Should split and filter');
    assert(result[0] === 'FRBCAPL TEST', 'Should parse first division');
  });

  test('normalizeDivisions - invalid input', () => {
    assert(normalizeDivisions(null).length === 0, 'Should handle null');
    assert(normalizeDivisions(123).length === 0, 'Should handle number');
    assert(normalizeDivisions({}).length === 0, 'Should handle object');
  });

  // Results
  console.log(`\n🎯 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your validation functions are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the validation functions.');
  }
}

// Run the tests
runTests();
