/**
 * ⚡ PHASE 3B: PERFORMANCE OPTIMIZATION SYSTEM
 * 
 * Professional-grade performance optimizations that make your pool league app
 * feel lightning fast and smooth like premium paid apps.
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// 🚀 SMART CACHING SYSTEM
class SmartCache {
  constructor(maxSize = 100, ttl = 300000) { // 5 minute TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key, value) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();
    
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: Math.round((this.cache.size / this.maxSize) * 100)
    };
  }
}

// Global cache instances
export const dataCache = new SmartCache(50, 300000); // 5 min TTL for data
export const uiCache = new SmartCache(30, 600000);   // 10 min TTL for UI
export const apiCache = new SmartCache(100, 180000); // 3 min TTL for API

// 🧠 SMART MEMOIZATION HOOKS
export const useSmartMemo = (factory, deps, cacheKey) => {
  return useMemo(() => {
    if (cacheKey && dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey);
    }
    
    const result = factory();
    
    if (cacheKey) {
      dataCache.set(cacheKey, result);
    }
    
    return result;
  }, deps);
};

export const useSmartCallback = (callback, deps, cacheKey) => {
  return useCallback((...args) => {
    const argsKey = cacheKey ? `${cacheKey}_${JSON.stringify(args)}` : null;
    
    if (argsKey && dataCache.has(argsKey)) {
      return dataCache.get(argsKey);
    }
    
    const result = callback(...args);
    
    if (argsKey && result !== undefined) {
      dataCache.set(argsKey, result);
    }
    
    return result;
  }, deps);
};

// 🎯 OPTIMIZED COMPONENT PATTERNS
export const createOptimizedComponent = (Component, compareProps) => {
  const OptimizedComponent = React.memo(Component, compareProps);
  OptimizedComponent.displayName = `Optimized(${Component.displayName || Component.name})`;
  return OptimizedComponent;
};

// Custom comparison functions for common patterns
export const shallowCompare = (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  
  if (prevKeys.length !== nextKeys.length) return false;
  
  return prevKeys.every(key => prevProps[key] === nextProps[key]);
};

export const deepCompareArray = (prevArray, nextArray) => {
  if (prevArray.length !== nextArray.length) return false;
  return prevArray.every((item, index) => 
    JSON.stringify(item) === JSON.stringify(nextArray[index])
  );
};

// 📱 MOBILE OPTIMIZATIONS
export const useMobileOptimizations = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const [connectionSpeed, setConnectionSpeed] = useState('fast');

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    // Detect orientation
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    // Detect connection speed
    const checkConnection = () => {
      if ('connection' in navigator) {
        const conn = navigator.connection;
        const speed = conn.effectiveType === '4g' ? 'fast' : 
                     conn.effectiveType === '3g' ? 'medium' : 'slow';
        setConnectionSpeed(speed);
      }
    };

    checkMobile();
    checkOrientation();
    checkConnection();

    window.addEventListener('resize', checkMobile);
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return { isMobile, orientation, connectionSpeed };
};

// ⚡ PERFORMANCE MONITORING
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const renderTimes = useRef([]);

  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const renderTime = now - lastRenderTime.current;
    
    renderTimes.current.push(renderTime);
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift();
    }
    
    lastRenderTime.current = now;

    // Log performance warnings in development
    if (process.env.NODE_ENV === 'development') {
      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      
      if (avgRenderTime > 16) { // 60fps = 16ms per frame
        console.warn(`⚡ Performance Warning: ${componentName} average render time: ${avgRenderTime.toFixed(2)}ms`);
      }
      
      if (renderCount.current > 100) {
        console.warn(`⚡ Performance Warning: ${componentName} has rendered ${renderCount.current} times`);
      }
    }
  });

  return {
    renderCount: renderCount.current,
    avgRenderTime: renderTimes.current.length > 0 ? 
      renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length : 0
  };
};

// 🔄 OPTIMIZED DATA FETCHING
export const useOptimizedFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const cacheKey = useMemo(() => `fetch_${url}_${JSON.stringify(options)}`, [url, options]);
  
  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      // Check cache first
      if (apiCache.has(cacheKey)) {
        setData(apiCache.get(cacheKey));
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(url, {
          ...options,
          // Add cache headers for better performance
          headers: {
            'Cache-Control': 'max-age=300', // 5 minutes
            ...options.headers
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!cancelled) {
          setData(result);
          apiCache.set(cacheKey, result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, [url, cacheKey]);
  
  return { data, loading, error };
};

// 🎨 SMOOTH ANIMATIONS
export const useSmootAnimations = () => {
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return {
    reducedMotion,
    transitionDuration: reducedMotion ? '0ms' : '300ms',
    animationDuration: reducedMotion ? '0ms' : '500ms'
  };
};

// 💾 MEMORY LEAK PREVENTION
export const useMemoryCleanup = () => {
  const timers = useRef(new Set());
  const listeners = useRef(new Set());
  
  const addTimer = useCallback((timerId) => {
    timers.current.add(timerId);
  }, []);
  
  const addListener = useCallback((element, event, handler) => {
    element.addEventListener(event, handler);
    listeners.current.add({ element, event, handler });
  }, []);
  
  useEffect(() => {
    return () => {
      // Clear all timers
      timers.current.forEach(timerId => {
        clearTimeout(timerId);
        clearInterval(timerId);
      });
      
      // Remove all listeners
      listeners.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      
      // Clear caches periodically
      if (Math.random() < 0.1) { // 10% chance on cleanup
        dataCache.clear();
        uiCache.clear();
      }
    };
  }, []);
  
  return { addTimer, addListener };
};

// 🔧 PERFORMANCE UTILITIES
export const performanceUtils = {
  // Debounce with leading edge option
  debounce: (func, wait, immediate = false) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Virtual scrolling helper
  calculateVisibleItems: (containerHeight, itemHeight, scrollTop, overscan = 5) => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      Number.MAX_SAFE_INTEGER
    );
    
    return {
      start: Math.max(0, visibleStart - overscan),
      end: visibleEnd + overscan
    };
  },

  // Bundle size analyzer (development only)
  analyzeBundleSize: () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    console.log('📦 Bundle Analysis:');
    scripts.forEach(script => {
      console.log(`JS: ${script.src.split('/').pop()}`);
    });
    styles.forEach(style => {
      console.log(`CSS: ${style.href.split('/').pop()}`);
    });
  }
};

// 🧪 PERFORMANCE TESTING
export const runPerformanceTests = () => {
  console.log('⚡ Running Performance Tests...\n');
  
  let passed = 0;
  let failed = 0;

  function test(name, testFn) {
    try {
      const start = performance.now();
      testFn();
      const end = performance.now();
      const duration = end - start;
      
      console.log(`✅ ${name} (${duration.toFixed(2)}ms)`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }

  // Test cache performance
  test('Cache Performance', () => {
    const cache = new SmartCache(10, 1000);
    
    // Fill cache
    for (let i = 0; i < 5; i++) {
      cache.set(`key${i}`, `value${i}`);
    }
    
    // Test retrieval
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      cache.get('key1');
    }
    const end = performance.now();
    
    if (end - start > 10) {
      throw new Error('Cache is too slow');
    }
  });

  // Test debounce
  test('Debounce Function', () => {
    let calls = 0;
    const debounced = performanceUtils.debounce(() => calls++, 10);
    
    // Call multiple times rapidly
    for (let i = 0; i < 10; i++) {
      debounced();
    }
    
    if (calls !== 0) {
      throw new Error('Debounce not working');
    }
    
    // Wait and check
    setTimeout(() => {
      if (calls !== 1) {
        throw new Error('Debounce called wrong number of times');
      }
    }, 20);
  });

  console.log(`\n⚡ Performance Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  // Display cache stats
  console.log('\n📊 Cache Statistics:');
  console.log(`   Data Cache: ${dataCache.getStats().usage}% full`);
  console.log(`   UI Cache: ${uiCache.getStats().usage}% full`);
  console.log(`   API Cache: ${apiCache.getStats().usage}% full`);
};
