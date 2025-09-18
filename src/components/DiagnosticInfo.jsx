import React, { useState, useEffect } from 'react';

const DiagnosticInfo = () => {
  const [diagnostics, setDiagnostics] = useState({});

  useEffect(() => {
    const runDiagnostics = () => {
      const diag = {
        // Environment info
        userAgent: navigator.userAgent,
        url: window.location.href,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        referrer: document.referrer,
        
        // Window context
        isInIframe: window.self !== window.top,
        windowSelf: window.self,
        windowTop: window.top,
        
        // Screen/viewport
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        
        // CSS/DOM
        bodyWidth: document.body.offsetWidth,
        bodyHeight: document.body.offsetHeight,
        rootWidth: document.getElementById('root')?.offsetWidth,
        rootHeight: document.getElementById('root')?.offsetHeight,
        
        // Computed styles
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        htmlBackground: getComputedStyle(document.documentElement).backgroundColor,
        bodyMargin: getComputedStyle(document.body).margin,
        bodyPadding: getComputedStyle(document.body).padding,
        
        // Data attributes
        htmlDataIframe: document.documentElement.getAttribute('data-iframe'),
        bodyDataIframe: document.body.getAttribute('data-iframe'),
        rootDataIframe: document.getElementById('root')?.getAttribute('data-iframe'),
        
        // Nav grid info
        navGridElements: document.querySelectorAll('.nav-grid').length,
        navCardElements: document.querySelectorAll('.nav-card').length,
        navGridDisplay: document.querySelector('.nav-grid') ? 
          getComputedStyle(document.querySelector('.nav-grid')).display : 'not found',
        navGridColumns: document.querySelector('.nav-grid') ? 
          getComputedStyle(document.querySelector('.nav-grid')).gridTemplateColumns : 'not found',
        
        // Environment variables
        nodeEnv: process.env.NODE_ENV,
        
        // Build info
        buildTime: new Date().toISOString(),
        timestamp: Date.now()
      };
      
      setDiagnostics(diag);
      console.log('🔍 DIAGNOSTIC INFO:', diag);
    };

    // Run immediately and on resize
    runDiagnostics();
    window.addEventListener('resize', runDiagnostics);
    
    return () => window.removeEventListener('resize', runDiagnostics);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '400px',
      zIndex: 10000,
      fontFamily: 'monospace',
      border: '2px solid #e53e3e'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#e53e3e' }}>🔍 DIAGNOSTIC INFO</h3>
      
      <div><strong>Environment:</strong></div>
      <div>• URL: {diagnostics.url}</div>
      <div>• Hostname: {diagnostics.hostname}</div>
      <div>• Protocol: {diagnostics.protocol}</div>
      <div>• Referrer: {diagnostics.referrer || 'none'}</div>
      <div>• NODE_ENV: {diagnostics.nodeEnv}</div>
      
      <div style={{ marginTop: '10px' }}><strong>Iframe Detection:</strong></div>
      <div>• Is in iframe: {diagnostics.isInIframe ? 'YES' : 'NO'}</div>
      <div>• HTML data-iframe: {diagnostics.htmlDataIframe || 'none'}</div>
      <div>• Body data-iframe: {diagnostics.bodyDataIframe || 'none'}</div>
      <div>• Root data-iframe: {diagnostics.rootDataIframe || 'none'}</div>
      
      <div style={{ marginTop: '10px' }}><strong>Viewport:</strong></div>
      <div>• Window: {diagnostics.windowWidth} x {diagnostics.windowHeight}</div>
      <div>• Screen: {diagnostics.screenWidth} x {diagnostics.screenHeight}</div>
      <div>• Body: {diagnostics.bodyWidth} x {diagnostics.bodyHeight}</div>
      <div>• Root: {diagnostics.rootWidth} x {diagnostics.rootHeight}</div>
      
      <div style={{ marginTop: '10px' }}><strong>Nav Grid:</strong></div>
      <div>• Grid elements: {diagnostics.navGridElements}</div>
      <div>• Card elements: {diagnostics.navCardElements}</div>
      <div>• Display: {diagnostics.navGridDisplay}</div>
      <div>• Columns: {diagnostics.navGridColumns}</div>
      
      <div style={{ marginTop: '10px' }}><strong>Backgrounds:</strong></div>
      <div>• Body: {diagnostics.bodyBackground}</div>
      <div>• HTML: {diagnostics.htmlBackground}</div>
      <div>• Body margin: {diagnostics.bodyMargin}</div>
      <div>• Body padding: {diagnostics.bodyPadding}</div>
      
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#888' }}>
        Built: {diagnostics.buildTime}
      </div>
    </div>
  );
};

export default DiagnosticInfo;
