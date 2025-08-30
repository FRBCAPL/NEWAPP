// Pool Table Fix Test - Copy and paste this into browser console

console.log('🏓 POOL TABLE FIX TEST');
console.log('======================');

// Check screen size
console.log('Screen size:', window.innerWidth, 'x', window.innerHeight);
console.log('Mobile view?', window.innerWidth <= 768);

// Check pool table proportions
const loginSection = document.querySelector('.login-section');
if (loginSection) {
  const loginRect = loginSection.getBoundingClientRect();
  console.log('\n📐 POOL TABLE PROPORTIONS:');
  console.log('- Login section width:', loginRect.width, 'px');
  console.log('- Login section height:', loginRect.height, 'px');
  console.log('- Aspect ratio:', (loginRect.width / loginRect.height).toFixed(2));
  
  // Check if proportions are realistic for a pool table
  const aspectRatio = loginRect.width / loginRect.height;
  if (aspectRatio >= 1.5 && aspectRatio <= 2.5) {
    console.log('✅ Pool table has realistic proportions (not too tall)');
  } else {
    console.log('❌ Pool table proportions still unrealistic');
  }
  
  // Check if height is reasonable
  if (loginRect.height <= 400) {
    console.log('✅ Pool table height is reasonable');
  } else {
    console.log('❌ Pool table still too tall');
  }
}

// Check login card positioning
const loginForm = loginSection?.querySelector('div[style*="position: relative"]');
if (loginForm) {
  const formRect = loginForm.getBoundingClientRect();
  const sectionRect = loginSection.getBoundingClientRect();
  
  console.log('\n🎯 LOGIN CARD POSITIONING:');
  console.log('- Login card width:', formRect.width, 'px');
  console.log('- Login card left position:', formRect.left, 'px');
  console.log('- Section left position:', sectionRect.left, 'px');
  console.log('- Section width:', sectionRect.width, 'px');
  
  // Calculate if card is centered
  const cardCenter = formRect.left + (formRect.width / 2);
  const sectionCenter = sectionRect.left + (sectionRect.width / 2);
  const centerOffset = Math.abs(cardCenter - sectionCenter);
  
  console.log('- Card center:', cardCenter, 'px');
  console.log('- Section center:', sectionCenter, 'px');
  console.log('- Center offset:', centerOffset, 'px');
  
  if (centerOffset <= 20) {
    console.log('✅ Login card is properly centered on pool table');
  } else {
    console.log('❌ Login card is not centered (offset too large)');
  }
  
  // Check if card is not too large
  if (formRect.width <= 400) {
    console.log('✅ Login card size is appropriate');
  } else {
    console.log('❌ Login card too large');
  }
}

// Check overall layout
console.log('\n📱 OVERALL LAYOUT:');
const hubHeader = document.querySelector('.logged-out-hub-header');
const appCards = document.querySelectorAll('.app-card');

console.log('- Login section found:', !!loginSection);
console.log('- Hub header found:', !!hubHeader);
console.log('- App cards found:', appCards.length);

// Check if layout order is correct
if (loginSection && hubHeader) {
  const loginRect = loginSection.getBoundingClientRect();
  const headerRect = hubHeader.getBoundingClientRect();
  
  if (loginRect.top < headerRect.top) {
    console.log('✅ Layout order correct: Login first, then header');
  } else {
    console.log('❌ Layout order wrong');
  }
}

// Check app cards size
if (appCards.length > 0) {
  console.log('\n🎯 APP CARDS SIZE:');
  appCards.forEach((card, index) => {
    const rect = card.getBoundingClientRect();
    console.log(`Card ${index + 1} height:`, rect.height, 'px');
    
    if (rect.height <= 180) {
      console.log(`✅ Card ${index + 1} reasonably sized`);
    } else {
      console.log(`❌ Card ${index + 1} too large`);
    }
  });
}

// Overall assessment
console.log('\n📊 FIXES VERIFIED:');
const hasGoodProportions = loginSection && (loginSection.getBoundingClientRect().width / loginSection.getBoundingClientRect().height) >= 1.5;
const isCardCentered = loginForm && Math.abs((loginForm.getBoundingClientRect().left + loginForm.getBoundingClientRect().width / 2) - (loginSection.getBoundingClientRect().left + loginSection.getBoundingClientRect().width / 2)) <= 20;
const hasReasonableHeight = loginSection && loginSection.getBoundingClientRect().height <= 400;

console.log('- Pool table realistic proportions:', hasGoodProportions ? '✅' : '❌');
console.log('- Login card centered:', isCardCentered ? '✅' : '❌');
console.log('- Pool table reasonable height:', hasReasonableHeight ? '✅' : '❌');

const score = [hasGoodProportions, isCardCentered, hasReasonableHeight].filter(Boolean).length;
console.log('\n🎯 OVERALL SCORE:', score, '/ 3');

if (score === 3) {
  console.log('🎉 PERFECT! Both issues fixed!');
} else if (score >= 2) {
  console.log('👍 GOOD! Most issues fixed');
} else {
  console.log('⚠️ NEEDS WORK! Issues remain');
}

console.log('\n======================');
console.log('🎯 GOAL: Pool table should look realistic and login card centered');
console.log('✅ Pool table not too tall');
console.log('✅ Login card centered on pool table');
console.log('✅ Realistic pool table proportions');
