// Quick Mobile Test - Copy and paste this into browser console

console.log('📱 QUICK MOBILE TEST');
console.log('===================');

// Check screen size
console.log('Screen size:', window.innerWidth, 'x', window.innerHeight);
console.log('Should show mobile optimizations?', window.innerWidth <= 768);

// Check for mobile-optimized elements
const buttons = document.querySelectorAll('button');
const inputs = document.querySelectorAll('input');

console.log('Total buttons:', buttons.length);
console.log('Total inputs:', inputs.length);

// Check button sizes
let bigButtons = 0;
buttons.forEach(btn => {
  const style = window.getComputedStyle(btn);
  const height = parseInt(style.height);
  const width = parseInt(style.width);
  if (height >= 44 && width >= 44) {
    bigButtons++;
  }
});

console.log('Touch-friendly buttons (44px+):', bigButtons, '/', buttons.length);

// Check input font sizes
let bigInputs = 0;
inputs.forEach(input => {
  const style = window.getComputedStyle(input);
  const fontSize = parseInt(style.fontSize);
  if (fontSize >= 16) {
    bigInputs++;
  }
});

console.log('Mobile-friendly inputs (16px+):', bigInputs, '/', inputs.length);

// Check for mobile-specific classes
const mobileElements = document.querySelectorAll('.mobile-padding, .mobile-margin, .mobile-text');
console.log('Mobile-specific CSS classes found:', mobileElements.length);

// Check for responsive design
const mediaQueries = document.querySelectorAll('style');
let hasMobileCSS = false;
mediaQueries.forEach(style => {
  if (style.textContent.includes('@media (max-width: 768px)')) {
    hasMobileCSS = true;
  }
});

console.log('Mobile CSS media queries found:', hasMobileCSS);

console.log('===================');
console.log('✅ If most buttons are 44px+ and inputs are 16px+, mobile optimization is working!');
