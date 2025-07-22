/**
 * 🚀 PHASE 3B: ENHANCED ERROR BOUNDARY
 * 
 * Professional-grade error boundary with Phase 3B improvements:
 * 🏗️ Structure: Organized error state management
 * 🛡️ Safety: Input sanitization & security monitoring  
 * ⚡ Speed: Performance-aware error handling & caching
 */

import React from 'react';
import { sanitizeInput, securityHelpers } from '../utils/comprehensive-validation';
import { dataCache, performanceUtils } from '../utils/performance-optimizations';

class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      lastErrorTime: null,
      errorType: 'unknown'
    };
    
    // 🚀 PHASE 3B: Enhanced error tracking
    this.errorHistory = [];
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    // 🎯 Performance monitoring
    this.componentRenderStart = performance.now();
  }

  static getDerivedStateFromError(error) {
    const errorType = EnhancedErrorBoundary.classifyError(error);
    
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2),
      lastErrorTime: Date.now(),
      errorType
    };
  }

  // 🔍 PHASE 3B: Smart error classification
  static classifyError(error) {
    const message = error.message?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('chunk') || message.includes('loading')) {
      return 'loading';
    }
    if (stack.includes('react') || message.includes('component')) {
      return 'react';
    }
    if (message.includes('permission') || message.includes('security')) {
      return 'security';
    }
    
    return 'unknown';
  }

  componentDidCatch(error, errorInfo) {
    const errorData = {
      error: error,
      errorInfo: errorInfo,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      component: this.props.componentName || 'Unknown',
      type: this.state.errorType
    };
    
    // 🛡️ PHASE 3B: Sanitize error data for security
    const sanitizedError = {
      ...errorData,
      message: sanitizeInput.general(error.message || 'Unknown error'),
      stack: error.stack ? sanitizeInput.general(error.stack.substring(0, 500)) : 'No stack trace',
      componentStack: errorInfo.componentStack ? 
        sanitizeInput.general(errorInfo.componentStack.substring(0, 300)) : 'No component stack'
    };
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // 📊 Enhanced error logging with performance data
    this.logEnhancedError(sanitizedError);
    
    // 🚨 Security: Detect suspicious error patterns
    this.errorHistory.push(sanitizedError);
    if (this.errorHistory.length > 10) {
      this.errorHistory.shift();
    }
    
    if (securityHelpers.detectSuspiciousActivity(this.errorHistory.map(e => ({
      type: e.type,
      timestamp: e.timestamp
    })))) {
      console.warn('🚨 Suspicious error pattern detected - possible security issue');
    }

    // 🔄 Auto-recovery for certain error types
    this.attemptAutoRecovery();

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  logEnhancedError = (errorData) => {
    // 📈 Collect performance context
    const performanceInfo = {
      renderTime: performance.now() - this.componentRenderStart,
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        percentage: Math.round((performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100)
      } : 'unavailable',
      connection: navigator.connection ? {
        type: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : 'unavailable',
      cacheStats: dataCache.getStats(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    const enhancedLog = {
      ...errorData,
      performance: performanceInfo,
      retryCount: this.state.retryCount,
      recovery: this.getRecoveryStrategy(errorData.type)
    };
    
    // 🔍 Smart logging based on environment
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Enhanced Error Boundary Report:', enhancedLog);
      
      // 💡 Helpful debugging suggestions
      this.provideDeveloperSuggestions(errorData);
    } else {
      // Production: Clean, minimal logging
      console.error(`🚨 Error [${errorData.type}]:`, errorData.message, `(ID: ${errorData.errorId})`);
      
      // Could integrate with error reporting service here
      // this.sendToErrorService(enhancedLog);
    }
  };

  provideDeveloperSuggestions = (errorData) => {
    console.group('💡 Developer Suggestions:');
    
    switch (errorData.type) {
      case 'network':
        console.log('• Check if backend is running');
        console.log('• Verify API endpoints');
        console.log('• Check network connectivity');
        break;
      case 'loading':
        console.log('• Check if all chunks are built correctly');
        console.log('• Try refreshing or clearing cache');
        break;
      case 'react':
        console.log('• Check component props and state');
        console.log('• Look for missing dependencies in useEffect');
        console.log('• Verify component lifecycle usage');
        break;
      case 'security':
        console.log('• Check for XSS attempts');
        console.log('• Verify input validation');
        console.log('• Review user permissions');
        break;
      default:
        console.log('• Check the error stack trace above');
        console.log('• Try reproducing with minimal steps');
        break;
    }
    
    console.groupEnd();
  };

  getRecoveryStrategy = (errorType) => {
    switch (errorType) {
      case 'network':
        return 'retry_with_backoff';
      case 'loading':
        return 'force_reload';
      case 'react':
        return 'component_reset';
      case 'security':
        return 'no_auto_recovery';
      default:
        return 'standard_retry';
    }
  };

  attemptAutoRecovery = () => {
    const strategy = this.getRecoveryStrategy(this.state.errorType);
    
    switch (strategy) {
      case 'retry_with_backoff':
        // Auto-retry for network errors
        if (this.state.retryCount < 2) {
          setTimeout(() => {
            this.handleReset();
          }, 2000 * Math.pow(2, this.state.retryCount));
        }
        break;
        
      case 'force_reload':
        // Reload for loading errors after a delay
        setTimeout(() => {
          this.handleReload();
        }, 3000);
        break;
        
      case 'component_reset':
        // Quick reset for React errors
        setTimeout(() => {
          this.handleReset();
        }, 1000);
        break;
        
      case 'no_auto_recovery':
        // No auto-recovery for security errors
        console.warn('🚨 Security error detected - manual intervention required');
        break;
    }
  };

  handleReload = () => {
    // 🧹 Clean up performance optimizations before reload
    dataCache.clear();
    
    // 📊 Log reload reason
    console.log('🔄 Reloading due to error:', this.state.errorType);
    
    window.location.reload();
  };

  handleReset = performanceUtils.debounce(() => {
    const newRetryCount = this.state.retryCount + 1;
    
    if (newRetryCount >= this.maxRetries) {
      console.warn('🚨 Max retries reached, forcing reload');
      this.handleReload();
      return;
    }
    
    console.log(`🔄 Attempting reset #${newRetryCount} for ${this.state.errorType} error`);
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: newRetryCount
    });
  }, 500);

  render() {
    if (this.state.hasError) {
      // 🎨 Enhanced error UI based on error type
      return this.renderErrorUI();
    }
    
    return this.props.children;
  }

  renderErrorUI = () => {
    const { errorType, errorId, retryCount } = this.state;
    const { message } = this.props;
    
    // 🎯 Different UI for different error types
    const errorConfig = {
      network: {
        icon: '🌐',
        title: 'Connection Problem',
        defaultMessage: 'Having trouble connecting. We\'ll keep trying...',
        color: '#f39c12'
      },
      loading: {
        icon: '📦',
        title: 'Loading Error',
        defaultMessage: 'Something didn\'t load properly. Refreshing should fix this.',
        color: '#e74c3c'
      },
      react: {
        icon: '⚛️',
        title: 'Component Error',
        defaultMessage: 'A component encountered an issue. This is usually temporary.',
        color: '#9b59b6'
      },
      security: {
        icon: '🔒',
        title: 'Security Notice',
        defaultMessage: 'For your security, this action was blocked.',
        color: '#e67e22'
      },
      unknown: {
        icon: '🎱',
        title: 'Oops! Something went wrong',
        defaultMessage: 'The pool league app encountered an unexpected error.',
        color: '#34495e'
      }
    };
    
    const config = errorConfig[errorType] || errorConfig.unknown;
    
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#2c3e50',
        borderRadius: '12px',
        margin: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>
          {config.icon}
        </div>
        
        <h2 style={{ 
          color: config.color, 
          marginBottom: '16px',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          {config.title}
        </h2>
        
        <p style={{ 
          fontSize: '16px', 
          marginBottom: '30px',
          maxWidth: '500px',
          lineHeight: '1.5',
          opacity: 0.8
        }}>
          {message || config.defaultMessage}
        </p>

        {/* Error details in development */}
        {process.env.NODE_ENV === 'development' && this.state.error && (
          <details style={{ 
            marginBottom: '20px',
            textAlign: 'left',
            background: 'rgba(0,0,0,0.05)',
            padding: '15px',
            borderRadius: '8px',
            maxWidth: '600px'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: '600' }}>
              🐛 Error Details (Development Mode)
            </summary>
            <pre style={{ 
              marginTop: '10px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              <strong>Type:</strong> {errorType}
              {'\n'}
              <strong>Error:</strong> {this.state.error.toString()}
              {'\n\n'}
              <strong>Component Stack:</strong>
              {this.state.errorInfo.componentStack}
            </pre>
          </details>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={this.handleReset}
            disabled={retryCount >= this.maxRetries}
            style={{
              background: retryCount >= this.maxRetries ? '#bdc3c7' : config.color,
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '25px',
              cursor: retryCount >= this.maxRetries ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              opacity: retryCount >= this.maxRetries ? 0.6 : 1
            }}
          >
            🔄 Try Again {retryCount > 0 && `(${retryCount}/${this.maxRetries})`}
          </button>
          
          <button
            onClick={this.handleReload}
            style={{
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            🔃 Reload Page
          </button>
        </div>

        {/* Error ID for support */}
        <p style={{ 
          fontSize: '12px', 
          opacity: 0.6, 
          marginTop: '20px',
          fontFamily: 'monospace'
        }}>
          Error ID: {errorId}
        </p>
        
        {/* Performance info in development */}
        {process.env.NODE_ENV === 'development' && (
          <p style={{ 
            fontSize: '11px', 
            opacity: 0.5, 
            marginTop: '10px',
            fontFamily: 'monospace'
          }}>
            Cache: {dataCache.getStats().usage}% | Memory: {
              performance.memory ? 
                `${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB` : 
                'N/A'
            }
          </p>
        )}
      </div>
    );
  };
}

export default EnhancedErrorBoundary;
