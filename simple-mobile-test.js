// Simple Mobile Test - Just copy and paste this into browser console

console.log('📱 SIMPLE MOBILE TEST');
console.log('=====================');

// Check screen size
console.log('Screen size:', window.innerWidth, 'x', window.innerHeight);

// Check if mobile detection thinks we're on mobile
const isMobile = window.innerWidth <= 768;
console.log('Should show mobile version?', isMobile);

// Check if mobile components exist
const mobileDashboard = document.querySelector('[data-mobile-dashboard]');
const mobileNav = document.querySelector('[data-mobile-nav]');
const bottomNav = document.querySelector('.mobile-bottom-nav');

console.log('Mobile dashboard found:', !!mobileDashboard);
console.log('Mobile nav found:', !!mobileNav);
console.log('Bottom nav found:', !!bottomNav);

// Check for any obvious mobile elements
const buttons = document.querySelectorAll('button');
const bigButtons = Array.from(buttons).filter(btn => {
  const style = window.getComputedStyle(btn);
  return parseInt(style.height) >= 44;
});

console.log('Big touch-friendly buttons:', bigButtons.length, 'out of', buttons.length);

// Check for mobile-specific CSS
const mobileStyles = document.querySelectorAll('style');
let hasMobileCSS = false;
mobileStyles.forEach(style => {
  if (style.textContent.includes('@media (max-width: 768px)')) {
    hasMobileCSS = true;
  }
});

console.log('Mobile CSS found:', hasMobileCSS);

console.log('=====================');
console.log('If you see desktop layout but should see mobile, there might be an error.');
console.log('Check the console for any red error messages above.');
