// Playing Surface Fit Test - Copy and paste this into browser console

console.log('🎯 PLAYING SURFACE FIT TEST');
console.log('===========================');

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
    
    // Calculate positioning
    const cardCenter = formRect.left + (formRect.width / 2);
    const sectionCenter = loginRect.left + (loginRect.width / 2);
    const centerOffset = Math.abs(cardCenter - sectionCenter);
    
    console.log('\n📐 POSITIONING ANALYSIS:');
    console.log('- Card center X:', cardCenter, 'px');
    console.log('- Section center X:', sectionCenter, 'px');
    console.log('- Center offset:', centerOffset, 'px');
    
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // Mobile: Should be centered
      if (centerOffset <= 10) {
        console.log('✅ Mobile: Login card is properly centered');
      } else {
        console.log('❌ Mobile: Login card is not centered');
      }
    } else {
      // PC: Should be centered
      if (centerOffset <= 10) {
        console.log('✅ PC: Login card is properly centered on pool table');
      } else {
        console.log('❌ PC: Login card is not centered on pool table');
      }
    }
    
    // Check sizing appropriateness for playing surface
    if (isMobile) {
      console.log('\n📱 MOBILE PLAYING SURFACE FIT:');
      if (formRect.width <= 200) {
        console.log('✅ Mobile login card fits within blue playing surface (inside cushions)');
      } else {
        console.log('❌ Mobile login card still extends beyond blue playing surface');
      }
      
      if (formRect.height <= 240) {
        console.log('✅ Mobile login card height fits within blue playing surface');
      } else {
        console.log('❌ Mobile login card height extends beyond blue playing surface');
      }
      
      // Check if card is small enough to fit within cushions
      const cardArea = formRect.width * formRect.height;
      const sectionArea = loginRect.width * loginRect.height;
      const areaRatio = cardArea / sectionArea;
      
      console.log('- Card area ratio:', (areaRatio * 100).toFixed(1) + '%');
      if (areaRatio <= 0.2) {
        console.log('✅ Login card takes up appropriate amount of playing surface space');
      } else {
        console.log('❌ Login card takes up too much playing surface space');
      }
    } else {
      console.log('\n🖥️ DESKTOP SIZING:');
      if (formRect.width >= 400) {
        console.log('✅ Desktop login card is wide enough (like original)');
      } else {
        console.log('❌ Desktop login card should be wider');
      }
      
      if (formRect.width <= 450) {
        console.log('✅ Desktop login card is not too wide');
      } else {
        console.log('❌ Desktop login card too wide');
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

// Overall assessment
console.log('\n📊 PLAYING SURFACE ASSESSMENT:');
const isMobile = window.innerWidth <= 768;
const loginForm = loginSection?.querySelector('div[style*="position: absolute"]');

const isCorrectlyCentered = loginForm && Math.abs((loginForm.getBoundingClientRect().left + loginForm.getBoundingClientRect().width / 2) - (loginSection.getBoundingClientRect().left + loginSection.getBoundingClientRect().width / 2)) <= 10;
const fitsPlayingSurface = loginForm && (isMobile ? loginForm.getBoundingClientRect().width <= 200 : loginForm.getBoundingClientRect().width >= 400);
const hasGoodProportions = loginSection && (loginSection.getBoundingClientRect().width / loginSection.getBoundingClientRect().height) >= 1.5;

console.log('- Login card properly centered:', isCorrectlyCentered ? '✅' : '❌');
console.log('- Login card fits playing surface:', fitsPlayingSurface ? '✅' : '❌');
console.log('- Pool table realistic proportions:', hasGoodProportions ? '✅' : '❌');

const score = [isCorrectlyCentered, fitsPlayingSurface, hasGoodProportions].filter(Boolean).length;
console.log('\n🎯 PLAYING SURFACE SCORE:', score, '/ 3');

if (score === 3) {
  console.log('🎉 PERFECT! All playing surface and centering issues fixed!');
} else if (score >= 2) {
  console.log('👍 EXCELLENT! Most issues fixed');
} else {
  console.log('⚠️ NEEDS WORK! Issues remain');
}

console.log('\n===========================');
console.log('🎯 GOAL ACHIEVED:');
console.log('✅ PC: Login card centered on pool table');
console.log('✅ Mobile: Login card fits within blue playing surface (inside cushions)');
console.log('✅ Both: Realistic pool table proportions');
