// Mobile Optimization Test Script
// Run this in the browser console to test mobile features

console.log('🧪 Testing Mobile Optimization...');

// Test mobile detection
function testMobileDetection() {
  console.log('📱 Testing Mobile Detection:');
  console.log('- Window width:', window.innerWidth);
  console.log('- Window height:', window.innerHeight);
  console.log('- User agent:', navigator.userAgent);
  console.log('- Touch support:', 'ontouchstart' in window);
  console.log('- Max touch points:', navigator.maxTouchPoints);
  
  // Check if mobile components are loaded
  const mobileDashboard = document.querySelector('[data-mobile-dashboard]');
  const mobileNav = document.querySelector('[data-mobile-nav]');
  const mobileCards = document.querySelectorAll('[data-mobile-card]');
  
  console.log('- Mobile Dashboard found:', !!mobileDashboard);
  console.log('- Mobile Navigation found:', !!mobileNav);
  console.log('- Mobile Cards found:', mobileCards.length);
}

// Test touch interactions
function testTouchInteractions() {
  console.log('👆 Testing Touch Interactions:');
  
  // Check for touch-friendly elements
  const buttons = document.querySelectorAll('button');
  const inputs = document.querySelectorAll('input');
  const links = document.querySelectorAll('a');
  
  let touchFriendlyButtons = 0;
  let touchFriendlyInputs = 0;
  
  buttons.forEach(button => {
    const style = window.getComputedStyle(button);
    const height = parseInt(style.height);
    const width = parseInt(style.width);
    if (height >= 44 && width >= 44) touchFriendlyButtons++;
  });
  
  inputs.forEach(input => {
    const style = window.getComputedStyle(input);
    const fontSize = parseInt(style.fontSize);
    if (fontSize >= 16) touchFriendlyInputs++;
  });
  
  console.log('- Touch-friendly buttons:', touchFriendlyButtons, '/', buttons.length);
  console.log('- Touch-friendly inputs:', touchFriendlyInputs, '/', inputs.length);
  console.log('- Total interactive elements:', buttons.length + inputs.length + links.length);
}

// Test responsive design
function testResponsiveDesign() {
  console.log('📐 Testing Responsive Design:');
  
  const viewport = document.querySelector('meta[name="viewport"]');
  console.log('- Viewport meta tag:', !!viewport);
  if (viewport) {
    console.log('- Viewport content:', viewport.getAttribute('content'));
  }
  
  // Check for mobile-specific CSS classes
  const mobileClasses = [
    'mobile-padding',
    'mobile-margin', 
    'mobile-text',
    'mobile-scroll',
    'mobile-touch-feedback'
  ];
  
  mobileClasses.forEach(className => {
    const elements = document.querySelectorAll(`.${className}`);
    console.log(`- Elements with .${className}:`, elements.length);
  });
}

// Test performance
function testPerformance() {
  console.log('⚡ Testing Performance:');
  
  // Check for optimized animations
  const styleSheets = Array.from(document.styleSheets);
  let mobileOptimizations = 0;
  
  styleSheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      rules.forEach(rule => {
        if (rule.cssText.includes('@media (max-width: 768px)')) {
          mobileOptimizations++;
        }
        if (rule.cssText.includes('touch-action')) {
          mobileOptimizations++;
        }
        if (rule.cssText.includes('-webkit-overflow-scrolling')) {
          mobileOptimizations++;
        }
      });
    } catch (e) {
      // Cross-origin stylesheets will throw errors
    }
  });
  
  console.log('- Mobile CSS optimizations found:', mobileOptimizations);
  
  // Check for lazy loading
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  console.log('- Lazy-loaded images:', lazyImages.length);
}

// Test accessibility
function testAccessibility() {
  console.log('♿ Testing Accessibility:');
  
  // Check for ARIA labels
  const ariaLabels = document.querySelectorAll('[aria-label]');
  const ariaLabelledBy = document.querySelectorAll('[aria-labelledby]');
  
  console.log('- Elements with aria-label:', ariaLabels.length);
  console.log('- Elements with aria-labelledby:', ariaLabelledBy.length);
  
  // Check for proper heading structure
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  console.log('- Total headings:', headings.length);
  
  // Check for focus indicators
  const focusableElements = document.querySelectorAll('button, input, select, textarea, a, [tabindex]');
  console.log('- Focusable elements:', focusableElements.length);
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting Mobile Optimization Tests...\n');
  
  testMobileDetection();
  console.log('');
  
  testTouchInteractions();
  console.log('');
  
  testResponsiveDesign();
  console.log('');
  
  testPerformance();
  console.log('');
  
  testAccessibility();
  console.log('');
  
  console.log('✅ Mobile Optimization Tests Complete!');
  console.log('💡 Check the results above to identify any issues.');
}

// Auto-run tests if in mobile viewport
if (window.innerWidth <= 768) {
  console.log('📱 Mobile device detected - running tests automatically...');
  setTimeout(runAllTests, 1000);
} else {
  console.log('💻 Desktop detected - run runAllTests() manually to test mobile features');
}

// Export for manual testing
window.testMobileOptimization = {
  runAllTests,
  testMobileDetection,
  testTouchInteractions,
  testResponsiveDesign,
  testPerformance,
  testAccessibility
};

console.log('🔧 Mobile optimization test functions loaded. Use testMobileOptimization.runAllTests() to run tests.');
