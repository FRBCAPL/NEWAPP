// Mobile Optimization Test - Copy and paste this into browser console

console.log('📱 MOBILE OPTIMIZATION TEST');
console.log('==========================');

// Check screen size
console.log('Screen size:', window.innerWidth, 'x', window.innerHeight);
console.log('Should show mobile optimizations?', window.innerWidth <= 768);

// Check for mobile-optimized elements
const buttons = document.querySelectorAll('button');
const inputs = document.querySelectorAll('input');
const cards = document.querySelectorAll('.app-card');
const loginCard = document.querySelector('.logged-out-hub-container');

console.log('Total buttons:', buttons.length);
console.log('Total inputs:', inputs.length);
console.log('App cards found:', cards.length);
console.log('Login container found:', !!loginCard);

// Check button sizes
let bigButtons = 0;
buttons.forEach(btn => {
  const style = window.getComputedStyle(btn);
  const height = parseInt(style.height);
  const width = parseInt(style.width);
  if (height >= 40 && width >= 40) {
    bigButtons++;
  }
});

console.log('Touch-friendly buttons (40px+):', bigButtons, '/', buttons.length);

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

// Check card sizes on mobile
if (window.innerWidth <= 768) {
  console.log('\n📱 MOBILE CARD ANALYSIS:');
  
  cards.forEach((card, index) => {
    const style = window.getComputedStyle(card);
    const padding = style.padding;
    const borderRadius = style.borderRadius;
    
    console.log(`Card ${index + 1}:`);
    console.log(`  - Padding: ${padding}`);
    console.log(`  - Border radius: ${borderRadius}`);
    
    // Check if card is compact
    const paddingValue = parseInt(padding);
    if (paddingValue <= 16) {
      console.log(`  ✅ Compact padding (${paddingValue}px)`);
    } else {
      console.log(`  ❌ Large padding (${paddingValue}px)`);
    }
  });
}

// Check login card size
if (loginCard) {
  const style = window.getComputedStyle(loginCard);
  const padding = style.padding;
  console.log('\n🔐 LOGIN CARD ANALYSIS:');
  console.log(`- Container padding: ${padding}`);
  
  const paddingValue = parseInt(padding);
  if (paddingValue <= 8) {
    console.log('✅ Compact login container');
  } else {
    console.log('❌ Large login container');
  }
}

// Check for mobile-specific CSS
const mediaQueries = document.querySelectorAll('style');
let hasMobileCSS = false;
mediaQueries.forEach(style => {
  if (style.textContent.includes('@media (max-width: 768px)')) {
    hasMobileCSS = true;
  }
});

console.log('\n📐 RESPONSIVE DESIGN:');
console.log('Mobile CSS media queries found:', hasMobileCSS);

// Check navigation size
const nav = document.querySelector('.hub-navigation');
if (nav) {
  const style = window.getComputedStyle(nav);
  const padding = style.padding;
  console.log(`Navigation padding: ${padding}`);
  
  const paddingValue = parseInt(padding);
  if (paddingValue <= 4) {
    console.log('✅ Compact navigation');
  } else {
    console.log('❌ Large navigation');
  }
}

console.log('\n==========================');
console.log('✅ Mobile optimization should now be much better!');
console.log('📱 Cards should be smaller and more compact');
console.log('🔐 Login card should be smaller');
console.log('🧭 Navigation should be more compact');
