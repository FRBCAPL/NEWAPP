// PC Layout Mimic Test - Copy and paste this into browser console

console.log('🖥️ PC LAYOUT MIMIC TEST');
console.log('========================');

// Check screen size
console.log('Screen size:', window.innerWidth, 'x', window.innerHeight);
console.log('Mobile view?', window.innerWidth <= 768);

// Check layout structure - should match PC version
const loginSection = document.querySelector('.login-section');
const hubHeader = document.querySelector('.logged-out-hub-header');
const appsSection = document.querySelector('.apps-section');
const appCards = document.querySelectorAll('.app-card');

console.log('\n📐 LAYOUT STRUCTURE (should match PC):');
console.log('Login section found:', !!loginSection);
console.log('Hub header found:', !!hubHeader);
console.log('Apps section found:', !!appsSection);
console.log('App cards found:', appCards.length);

// Check if layout order matches PC (login first, then header with apps)
if (loginSection && hubHeader) {
  const loginRect = loginSection.getBoundingClientRect();
  const headerRect = hubHeader.getBoundingClientRect();
  
  if (loginRect.top < headerRect.top) {
    console.log('✅ Layout order correct: Login section first, then header');
  } else {
    console.log('❌ Layout order wrong: Header should come after login');
  }
}

// Check login card styling (should mimic PC)
const loginForm = document.querySelector('.login-section');
if (loginForm) {
  const style = window.getComputedStyle(loginForm);
  console.log('\n🔐 LOGIN CARD ANALYSIS:');
  console.log('- Login section margin:', style.margin);
  console.log('- Login section max-width:', style.maxWidth);
  
  // Check if login card is prominent like PC
  if (style.maxWidth === '100%' || style.maxWidth === '600px') {
    console.log('✅ Login card properly sized like PC');
  } else {
    console.log('❌ Login card sizing needs adjustment');
  }
}

// Check header styling (should mimic PC)
if (hubHeader) {
  const style = window.getComputedStyle(hubHeader);
  console.log('\n📋 HEADER ANALYSIS:');
  console.log('- Header padding:', style.padding);
  console.log('- Header border:', style.border);
  console.log('- Header border-radius:', style.borderRadius);
  
  // Check if header has PC styling
  if (style.border.includes('2px solid rgb(229, 62, 62)')) {
    console.log('✅ Header has PC red border styling');
  } else {
    console.log('❌ Header missing PC border styling');
  }
}

// Check app cards styling (should mimic PC but stacked)
if (appCards.length > 0) {
  console.log('\n🎯 APP CARDS ANALYSIS:');
  
  appCards.forEach((card, index) => {
    const style = window.getComputedStyle(card);
    console.log(`Card ${index + 1}:`);
    console.log(`  - Padding: ${style.padding}`);
    console.log(`  - Border: ${style.border}`);
    console.log(`  - Border-radius: ${style.borderRadius}`);
    
    // Check if cards have PC styling
    if (style.border.includes('2px solid')) {
      console.log(`  ✅ Card ${index + 1} has PC border styling`);
    } else {
      console.log(`  ❌ Card ${index + 1} missing PC border styling`);
    }
  });
}

// Check if cards are stacked (mobile) vs grid (PC)
const appsGrid = document.querySelector('.apps-grid');
if (appsGrid) {
  const style = window.getComputedStyle(appsGrid);
  console.log('\n📱 GRID LAYOUT:');
  console.log('- Grid template columns:', style.gridTemplateColumns);
  
  if (window.innerWidth <= 768) {
    if (style.gridTemplateColumns === '1fr') {
      console.log('✅ Mobile: Cards properly stacked (single column)');
    } else {
      console.log('❌ Mobile: Cards should be stacked');
    }
  } else {
    if (style.gridTemplateColumns.includes('minmax(300px, 1fr)')) {
      console.log('✅ Desktop: Cards in grid layout');
    } else {
      console.log('❌ Desktop: Cards should be in grid');
    }
  }
}

// Check overall spacing and proportions
const container = document.querySelector('.logged-out-hub-container');
if (container) {
  const style = window.getComputedStyle(container);
  console.log('\n📏 OVERALL LAYOUT:');
  console.log('- Container padding:', style.padding);
  console.log('- Container max-width:', style.maxWidth);
  
  if (window.innerWidth <= 768) {
    const paddingValue = parseInt(style.padding);
    if (paddingValue <= 8) {
      console.log('✅ Mobile: Compact container padding');
    } else {
      console.log('❌ Mobile: Container padding too large');
    }
  }
}

console.log('\n========================');
console.log('🎯 GOAL: Mobile should look like PC version but scaled down');
console.log('✅ Login section prominent with pool table background');
console.log('✅ Header with red border containing app cards');
console.log('✅ App cards with proper styling (stacked on mobile)');
console.log('✅ Same visual hierarchy as PC version');
