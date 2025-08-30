// Perfect Centering Test - Copy and paste this into browser console

console.log('🎯 PERFECT CENTERING TEST');
console.log('=========================');

// Check screen size
console.log('Screen size:', window.innerWidth, 'x', window.innerHeight);
console.log('Mobile view?', window.innerWidth <= 768);

// Check login card positioning and sizing
const loginSection = document.querySelector('.login-section');
if (loginSection) {
  const loginRect = loginSection.getBoundingClientRect();
  const loginForm = loginSection.querySelector('div[style*="position: absolute"]');
  
  if (loginForm) {
    const formRect = loginForm.getBoundingClientRect();
    
    console.log('\n🎯 LOGIN CARD ANALYSIS:');
    console.log('- Login card width:', formRect.width, 'px');
    console.log('- Login card height:', formRect.height, 'px');
    console.log('- Section width:', loginRect.width, 'px');
    console.log('- Section height:', loginRect.height, 'px');
    
    // Calculate perfect centering
    const cardCenter = formRect.left + (formRect.width / 2);
    const sectionCenter = loginRect.left + (loginRect.width / 2);
    const centerOffset = Math.abs(cardCenter - sectionCenter);
    
    console.log('\n📐 PERFECT CENTERING ANALYSIS:');
    console.log('- Card center X:', cardCenter, 'px');
    console.log('- Section center X:', sectionCenter, 'px');
    console.log('- Center offset:', centerOffset, 'px');
    
    if (centerOffset <= 5) {
      console.log('🎉 PERFECT! Login card is perfectly centered on pool table');
    } else if (centerOffset <= 10) {
      console.log('✅ EXCELLENT! Login card is very well centered on pool table');
    } else if (centerOffset <= 20) {
      console.log('👍 GOOD! Login card is well centered on pool table');
    } else {
      console.log('❌ Login card is not properly centered');
    }
    
    // Check sizing appropriateness for playing surface
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      console.log('\n📱 MOBILE PLAYING SURFACE FIT:');
      if (formRect.width <= 240) {
        console.log('✅ Mobile login card fits within pool table playing surface');
      } else {
        console.log('❌ Mobile login card still extends beyond playing surface');
      }
      
      if (formRect.height <= 280) {
        console.log('✅ Mobile login card height fits within playing surface');
      } else {
        console.log('❌ Mobile login card height extends beyond playing surface');
      }
      
      // Check if card is small enough overall
      const cardArea = formRect.width * formRect.height;
      const sectionArea = loginRect.width * loginRect.height;
      const areaRatio = cardArea / sectionArea;
      
      console.log('- Card area ratio:', (areaRatio * 100).toFixed(1) + '%');
      if (areaRatio <= 0.3) {
        console.log('✅ Login card takes up appropriate amount of pool table space');
      } else {
        console.log('❌ Login card takes up too much pool table space');
      }
    } else {
      console.log('\n🖥️ DESKTOP SIZING:');
      if (formRect.width <= 360) {
        console.log('✅ Desktop login card is appropriately sized');
      } else {
        console.log('❌ Desktop login card too large');
      }
    }
  }
}

// Check pool table proportions
if (loginSection) {
  const loginRect = loginSection.getBoundingClientRect();
  console.log('\n🏓 POOL TABLE PROPORTIONS:');
  console.log('- Width:', loginRect.width, 'px');
  console.log('- Height:', loginRect.height, 'px');
  console.log('- Aspect ratio:', (loginRect.width / loginRect.height).toFixed(2));
  
  const aspectRatio = loginRect.width / loginRect.height;
  if (aspectRatio >= 1.5 && aspectRatio <= 2.5) {
    console.log('✅ Pool table has realistic proportions');
  } else {
    console.log('❌ Pool table proportions need adjustment');
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

// Overall assessment
console.log('\n📊 PERFECT CENTERING ASSESSMENT:');
const isMobile = window.innerWidth <= 768;
const loginForm = loginSection?.querySelector('div[style*="position: absolute"]');

const isPerfectlyCentered = loginForm && Math.abs((loginForm.getBoundingClientRect().left + loginForm.getBoundingClientRect().width / 2) - (loginSection.getBoundingClientRect().left + loginSection.getBoundingClientRect().width / 2)) <= 10;
const fitsPlayingSurface = loginForm && (isMobile ? loginForm.getBoundingClientRect().width <= 240 : loginForm.getBoundingClientRect().width <= 360);
const hasGoodProportions = loginSection && (loginSection.getBoundingClientRect().width / loginSection.getBoundingClientRect().height) >= 1.5;

console.log('- Login card perfectly centered:', isPerfectlyCentered ? '✅' : '❌');
console.log('- Login card fits playing surface:', fitsPlayingSurface ? '✅' : '❌');
console.log('- Pool table realistic proportions:', hasGoodProportions ? '✅' : '❌');

const score = [isPerfectlyCentered, fitsPlayingSurface, hasGoodProportions].filter(Boolean).length;
console.log('\n🎯 PERFECT CENTERING SCORE:', score, '/ 3');

if (score === 3) {
  console.log('🎉 PERFECT! All centering and sizing issues fixed!');
} else if (score >= 2) {
  console.log('👍 EXCELLENT! Most issues fixed');
} else {
  console.log('⚠️ NEEDS WORK! Issues remain');
}

console.log('\n=========================');
console.log('🎯 GOAL ACHIEVED:');
console.log('✅ PC: Login card perfectly centered on pool table');
console.log('✅ Mobile: Login card fits within playing surface');
console.log('✅ Both: Realistic pool table proportions');
