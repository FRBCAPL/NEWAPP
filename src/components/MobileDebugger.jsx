import React, { useState, useEffect } from 'react';

/**
 * 📱 MOBILE DEBUGGER
 * 
 * Shows mobile viewport info and helps identify scaling issues.
 * Only shows in development mode.
 */
export default function MobileDebugger() {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
    devicePixelRatio: 1,
    isMobile: false
  });
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        isMobile: window.innerWidth <= 768
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
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
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
        title="Toggle Mobile Debugger"
      >
        📱
      </button>

      {/* Debug Panel */}
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
          fontFamily: 'monospace',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          border: `2px solid ${viewport.isMobile ? '#e74c3c' : '#27ae60'}`
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <strong>📱 Mobile Debugger</strong>
            <button
              onClick={() => setIsVisible(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>🖥️ Viewport:</strong> {viewport.width} × {viewport.height}px
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>📊 Pixel Ratio:</strong> {viewport.devicePixelRatio}x
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>📱 Device Type:</strong> {viewport.isMobile ? 'Mobile/Tablet' : 'Desktop'}
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>🎯 Breakpoint:</strong> {
              viewport.width <= 479 ? 'Extra Small (≤479px)' :
              viewport.width <= 767 ? 'Small Mobile (480-767px)' :
              viewport.width <= 1023 ? 'Tablet (768-1023px)' :
              viewport.width <= 1199 ? 'Desktop (1024-1199px)' :
              'Large Desktop (≥1200px)'
            }
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>🌐 User Agent:</strong> {
              /iPhone|iPad/.test(navigator.userAgent) ? 'iOS' :
              /Android/.test(navigator.userAgent) ? 'Android' :
              /Mobile/.test(navigator.userAgent) ? 'Mobile' :
              'Desktop'
            }
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>🔧 CSS Fixes:</strong> <span style={{ color: '#27ae60' }}>✅ Applied</span>
          </div>
          
          {/* Quick Fix Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginTop: '12px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => {
                document.body.style.overflow = 'auto';
                document.documentElement.style.overflow = 'auto';
                alert('✅ Enabled body scrolling');
              }}
              style={{
                background: '#3498db',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Fix Scroll
            </button>
            
            <button
              onClick={() => {
                const root = document.getElementById('root');
                if (root) {
                  root.style.width = '100%';
                  root.style.maxWidth = '100vw';
                  root.style.padding = '0.5rem';
                }
                alert('✅ Applied mobile width fix');
              }}
              style={{
                background: '#9b59b6',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Fix Width
            </button>
            
            <button
              onClick={() => {
                // Add debug outlines
                document.body.setAttribute('data-debug', 'true');
                setTimeout(() => {
                  document.body.removeAttribute('data-debug');
                }, 3000);
                alert('✅ Debug outlines added for 3 seconds');
              }}
              style={{
                background: '#e67e22',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Debug Layout
            </button>
          </div>
          
          <div style={{ 
            marginTop: '12px', 
            padding: '8px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '6px',
            fontSize: '10px'
          }}>
            💡 <strong>Tips:</strong>
            <br />• Try rotating your device
            <br />• Test different zoom levels
            <br />• Check if content fits without horizontal scroll
          </div>
        </div>
      )}
    </>
  );
}
