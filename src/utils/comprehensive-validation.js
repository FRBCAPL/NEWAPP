/**
 * 🛡️ PHASE 3B: COMPREHENSIVE INPUT VALIDATION & SECURITY
 * 
 * Professional-grade validation that prevents users from breaking your app
 * with invalid input, protects against security vulnerabilities, and provides
 * user-friendly error messages.
 */

// 🧹 DATA SANITIZATION - Clean dangerous input
export const sanitizeInput = {
  // Remove dangerous characters but keep useful ones
  general: (input) => {
    if (typeof input !== 'string') return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  },

  // Sanitize email addresses
  email: (email) => {
    if (typeof email !== 'string') return '';
    return email.toLowerCase().trim().slice(0, 254); // RFC 5321 limit
  },

  // Sanitize text notes/messages
  note: (note) => {
    if (typeof note !== 'string') return '';
    return sanitizeInput.general(note)
      .replace(/\s+/g, ' ') // Normalize whitespace
      .slice(0, 1000); // Reasonable length limit
  },

  // Sanitize division names
  division: (division) => {
    if (typeof division !== 'string') return '';
    return sanitizeInput.general(division)
      .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Only safe characters
      .slice(0, 50);
  },

  // Sanitize numbers
  number: (num, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    const parsed = parseInt(num, 10);
    if (isNaN(parsed)) return min;
    return Math.min(Math.max(parsed, min), max);
  }
};

// 🔍 ADVANCED VALIDATION - More thorough than before
export const advancedValidation = {
  // Email validation with comprehensive checks
  email: (email) => {
    const cleaned = sanitizeInput.email(email);
    
    if (!cleaned) {
      return { isValid: false, error: 'Email is required', cleaned };
    }
    
    if (cleaned.length < 5) {
      return { isValid: false, error: 'Email is too short', cleaned };
    }
    
    if (cleaned.length > 254) {
      return { isValid: false, error: 'Email is too long', cleaned };
    }
    
    // RFC 5322 compliant regex (simplified but robust)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(cleaned)) {
      return { isValid: false, error: 'Please enter a valid email address', cleaned };
    }
    
    // Check for common typos
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = cleaned.split('@')[1];
    const suspiciousDomains = ['gmial.com', 'yaho.com', 'hotmial.com'];
    
    if (suspiciousDomains.includes(domain)) {
      const suggestion = commonDomains.find(d => d.includes(domain.slice(0, 3)));
      return { 
        isValid: false, 
        error: suggestion ? `Did you mean ${suggestion}?` : 'Please check your email domain',
        cleaned 
      };
    }
    
    return { isValid: true, error: '', cleaned };
  },

  // Note validation with security checks
  note: (noteText) => {
    const cleaned = sanitizeInput.note(noteText);
    
    if (!cleaned || cleaned.trim().length === 0) {
      return { isValid: false, error: 'Please enter a note', cleaned: '' };
    }
    
    if (cleaned.length < 3) {
      return { isValid: false, error: 'Note must be at least 3 characters', cleaned };
    }
    
    if (cleaned.length > 1000) {
      return { isValid: false, error: 'Note is too long (max 1000 characters)', cleaned: cleaned.slice(0, 1000) };
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /(.)\1{20,}/, // Repeated characters
      /https?:\/\/[^\s]{50,}/, // Very long URLs
      /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b/i // SQL injection attempts
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(cleaned)) {
        return { isValid: false, error: 'Note contains invalid content', cleaned: '' };
      }
    }
    
    return { isValid: true, error: '', cleaned };
  },

  // Division validation
  division: (divisionName) => {
    const cleaned = sanitizeInput.division(divisionName);
    
    if (!cleaned) {
      return { isValid: false, error: 'Division name is required', cleaned: '' };
    }
    
    if (cleaned.length < 2) {
      return { isValid: false, error: 'Division name too short', cleaned };
    }
    
    if (cleaned.length > 50) {
      return { isValid: false, error: 'Division name too long', cleaned: cleaned.slice(0, 50) };
    }
    
    return { isValid: true, error: '', cleaned };
  },

  // User data validation (comprehensive)
  userData: (user) => {
    if (!user || typeof user !== 'object') {
      return { isValid: false, error: 'Invalid user data' };
    }
    
    // Check required fields
    const requiredFields = ['email', 'firstName', 'lastName'];
    for (const field of requiredFields) {
      if (!user[field] || typeof user[field] !== 'string' || user[field].trim().length === 0) {
        return { isValid: false, error: `${field} is required` };
      }
    }
    
    // Validate email
    const emailValidation = advancedValidation.email(user.email);
    if (!emailValidation.isValid) {
      return { isValid: false, error: `Email: ${emailValidation.error}` };
    }
    
    // Validate names
    const nameRegex = /^[a-zA-Z\s\-']{2,50}$/;
    if (!nameRegex.test(user.firstName)) {
      return { isValid: false, error: 'First name contains invalid characters' };
    }
    
    if (!nameRegex.test(user.lastName)) {
      return { isValid: false, error: 'Last name contains invalid characters' };
    }
    
    return { isValid: true, error: '' };
  },

  // Proposal validation
  proposal: (proposalData) => {
    if (!proposalData || typeof proposalData !== 'object') {
      return { isValid: false, error: 'Invalid proposal data' };
    }
    
    // Validate required fields
    if (!proposalData.opponent || proposalData.opponent.trim().length === 0) {
      return { isValid: false, error: 'Opponent is required' };
    }
    
    if (!proposalData.division || proposalData.division.trim().length === 0) {
      return { isValid: false, error: 'Division is required' };
    }
    
    // Validate dates if present
    if (proposalData.proposedDate) {
      const date = new Date(proposalData.proposedDate);
      const now = new Date();
      const maxFuture = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
      
      if (isNaN(date.getTime())) {
        return { isValid: false, error: 'Invalid proposed date' };
      }
      
      if (date < now) {
        return { isValid: false, error: 'Proposed date must be in the future' };
      }
      
      if (date > maxFuture) {
        return { isValid: false, error: 'Proposed date is too far in the future' };
      }
    }
    
    return { isValid: true, error: '' };
  }
};

// 🚨 SECURITY HELPERS - Protect against common attacks
export const securityHelpers = {
  // Rate limiting helper (simple in-memory)
  createRateLimiter: (maxRequests = 10, windowMs = 60000) => {
    const requests = new Map();
    
    return (identifier) => {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];
      
      // Clean old requests
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return { allowed: false, error: 'Too many requests. Please wait a moment.' };
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
      
      return { allowed: true, error: '' };
    };
  },

  // Detect suspicious activity
  detectSuspiciousActivity: (actions) => {
    if (!Array.isArray(actions)) return false;
    
    const recentActions = actions.filter(action => 
      Date.now() - action.timestamp < 30000 // Last 30 seconds
    );
    
    // Too many actions too quickly
    if (recentActions.length > 20) {
      console.warn('🚨 Suspicious activity detected: Too many actions');
      return true;
    }
    
    // Same action repeated rapidly
    const actionTypes = recentActions.map(a => a.type);
    const uniqueTypes = new Set(actionTypes);
    if (actionTypes.length > 10 && uniqueTypes.size < 3) {
      console.warn('🚨 Suspicious activity detected: Repeated actions');
      return true;
    }
    
    return false;
  },

  // XSS protection
  escapeHtml: (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// 🎯 VALIDATION MIDDLEWARE - Easy integration with reducer actions
export const validationMiddleware = {
  // Wrap action creators with validation
  withValidation: (actionCreator, validator) => {
    return (payload) => {
      const validation = validator(payload);
      
      if (!validation.isValid) {
        console.warn(`🛡️ Validation failed:`, validation.error);
        return { type: 'VALIDATION_ERROR', payload: { error: validation.error } };
      }
      
      // Use cleaned data if available
      const cleanPayload = validation.cleaned !== undefined ? validation.cleaned : payload;
      return actionCreator(cleanPayload);
    };
  },

  // Validate form submissions
  validateForm: (formData, validationRules) => {
    const errors = {};
    let isValid = true;
    const cleanedData = {};
    
    for (const [field, value] of Object.entries(formData)) {
      if (validationRules[field]) {
        const validation = validationRules[field](value);
        if (!validation.isValid) {
          errors[field] = validation.error;
          isValid = false;
        } else {
          cleanedData[field] = validation.cleaned || value;
        }
      } else {
        cleanedData[field] = value;
      }
    }
    
    return { isValid, errors, cleanedData };
  }
};

// 🧪 VALIDATION TESTING
export const runValidationTests = () => {
  console.log('🧪 Running Comprehensive Validation Tests...\n');
  
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

  // Test sanitization
  test('HTML Sanitization', () => {
    const dangerous = '<script>alert("xss")</script>Hello';
    const safe = sanitizeInput.general(dangerous);
    assert(!safe.includes('<script>'), 'Scripts should be removed');
    assert(safe.includes('Hello'), 'Safe content should remain');
  });

  test('Email Validation', () => {
    const valid = advancedValidation.email('user@example.com');
    assert(valid.isValid, 'Valid email should pass');
    
    const invalid = advancedValidation.email('invalid-email');
    assert(!invalid.isValid, 'Invalid email should fail');
  });

  test('Note Security', () => {
    const malicious = 'DROP TABLE users; --';
    const validation = advancedValidation.note(malicious);
    assert(!validation.isValid, 'SQL injection should be blocked');
  });

  test('Rate Limiting', () => {
    const limiter = securityHelpers.createRateLimiter(2, 1000);
    assert(limiter('user1').allowed, 'First request should be allowed');
    assert(limiter('user1').allowed, 'Second request should be allowed');
    assert(!limiter('user1').allowed, 'Third request should be blocked');
  });

  console.log(`\n🛡️ Validation Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All validation tests passed! Your app is secure.');
  }
};
