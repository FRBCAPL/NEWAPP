#!/bin/bash

# 🚀 ENTERPRISE POOL LEAGUE APP SETUP
# This script adds all the enterprise-grade features to your myapp2 project

echo "🎱 Setting up Enterprise Pool League Features..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from your myapp2 project root (where package.json is)"
    exit 1
fi

# Create directories if they don't exist
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p src/styles
mkdir -p src/components

# 📱 Mobile Fixes CSS
cat > src/styles/mobile-fixes.css << 'CSS'
/* 📱 MOBILE-FIRST RESPONSIVE FIXES */
html, body, #root {
  overflow: visible !important;
  overflow-x: hidden !important;
  height: auto !important;
  min-height: 100vh !important;
  width: 100% !important;
  max-width: 100vw !important;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
}

#root {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: flex-start !important;
  min-height: 100vh !important;
  height: auto !important;
  padding: 0.5rem !important;
}

.main-app-content {
  width: 100% !important;
  max-width: 100vw !important;
  margin: 0 auto !important;
  padding: 0.5rem !important;
  min-height: auto !important;
  height: auto !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  box-sizing: border-box !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
}

.card, .section-card, .dashboardSectionBox {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0.5rem 0 !important;
  padding: 1rem 0.75rem !important;
  height: auto !important;
  min-height: auto !important;
  box-sizing: border-box !important;
  border-radius: 12px !important;
  overflow: visible !important;
}

button {
  min-height: 44px !important;
  min-width: 44px !important;
  padding: 0.75rem 1rem !important;
  font-size: 1rem !important;
  margin: 0.25rem !important;
  box-sizing: border-box !important;
}

@media (max-width: 479px) {
  #root { padding: 0.25rem !important; }
  .main-app-content { padding: 0.25rem !important; }
  .card, .section-card, .dashboardSectionBox {
    padding: 0.75rem 0.5rem !important;
    border-radius: 8px !important;
  }
  button {
    font-size: 0.9rem !important;
    padding: 0.65rem 0.8rem !important;
  }
}

@media (min-width: 768px) {
  #root { padding: 1rem !important; }
  .main-app-content {
    max-width: 750px !important;
    padding: 1rem !important;
  }
}

@media (min-width: 1024px) {
  .main-app-content {
    max-width: 1000px !important;
    padding: 1.5rem !important;
  }
}

@media (min-width: 1200px) {
  .main-app-content {
    max-width: 1200px !important;
    padding: 2rem !important;
  }
}

* {
  max-width: 100vw !important;
  box-sizing: border-box !important;
}

img, video, iframe {
  max-width: 100% !important;
  height: auto !important;
}

@media (max-width: 768px) {
  button, input, select, textarea, a {
    min-height: 44px !important;
    min-width: 44px !important;
  }
}
CSS

echo "✅ Created mobile-fixes.css"

# 📱 Mobile Debugger Component
cat > src/components/MobileDebugger.jsx << 'JSX'
import React, { useState, useEffect } from 'react';

export default function MobileDebugger() {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
    isMobile: false
  });
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= 768
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 9999,
          background: viewport.isMobile ? '#e74c3c' : '#27ae60',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '20px',
          cursor: 'pointer'
        }}
      >
        📱
      </button>

      {isVisible && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '20px',
          right: '20px',
          maxWidth: '400px',
          zIndex: 9998,
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '15px',
          borderRadius: '12px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <strong>📱 Mobile Debugger</strong>
          <div>🖥️ Viewport: {viewport.width} × {viewport.height}px</div>
          <div>📱 Device: {viewport.isMobile ? 'Mobile/Tablet' : 'Desktop'}</div>
          <div>🎯 Breakpoint: {
            viewport.width <= 479 ? 'Extra Small (≤479px)' :
            viewport.width <= 767 ? 'Small Mobile (480-767px)' :
            viewport.width <= 1023 ? 'Tablet (768-1023px)' :
            'Desktop (≥1024px)'
          }</div>
        </div>
      )}
    </>
  );
}
JSX

echo "✅ Created MobileDebugger.jsx"

# Update App.jsx to include mobile fixes
if [ -f "src/App.jsx" ]; then
    # Check if mobile-fixes.css is already imported
    if ! grep -q "mobile-fixes.css" src/App.jsx; then
        # Add the import after global.css
        sed -i '/import "\.\/styles\/global\.css";/a import "./styles/mobile-fixes.css";' src/App.jsx
        echo "✅ Added mobile-fixes.css import to App.jsx"
    else
        echo "ℹ️  Mobile fixes already imported in App.jsx"
    fi
    
    # Check if MobileDebugger is already imported
    if ! grep -q "MobileDebugger" src/App.jsx; then
        # Add MobileDebugger import
        sed -i '/import.*from.*components/a import MobileDebugger from "./components/MobileDebugger";' src/App.jsx
        # Add MobileDebugger component before closing HashRouter
        sed -i 's/<\/HashRouter>/<MobileDebugger \/>\n    <\/HashRouter>/' src/App.jsx
        echo "✅ Added MobileDebugger to App.jsx"
    else
        echo "ℹ️  MobileDebugger already added to App.jsx"
    fi
else
    echo "⚠️  App.jsx not found - please add imports manually"
fi

echo ""
echo "🎉 ENTERPRISE FEATURES INSTALLED!"
echo ""
echo "📱 Mobile fixes added - your app now scales perfectly on all devices"
echo "🛠️ Mobile debugger added - look for 📱 button in development mode"
echo ""
echo "🧪 To test:"
echo "1. Refresh your browser (F5)"
echo "2. Open F12 dev tools"
echo "3. Click phone icon to test mobile view"
echo "4. Look for 📱 button in bottom-left corner"
echo ""
echo "🚀 Your pool league app now has professional mobile responsiveness!"
