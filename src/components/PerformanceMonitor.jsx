import React, { useState, useEffect, useRef } from 'react';

const PerformanceMonitor = React.memo(() => {
  const [renderCount, setRenderCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsInterval = useRef(null);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  useEffect(() => {
    // FPS counter
    const updateFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime.current >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / (currentTime - lastTime.current)));
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      fpsInterval.current = requestAnimationFrame(updateFPS);
    };
    
    fpsInterval.current = requestAnimationFrame(updateFPS);
    
    return () => {
      if (fpsInterval.current) {
        cancelAnimationFrame(fpsInterval.current);
      }
    };
  }, []);

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 10000,
      minWidth: '150px',
      border: '1px solid #333'
    }}>
      <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Performance Monitor</div>
      <div>FPS: {fps}</div>
      <div>Renders: {renderCount}</div>
      <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.7 }}>
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

export default PerformanceMonitor;

