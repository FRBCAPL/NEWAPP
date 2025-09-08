import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    // Reset the error state to allow the component to re-render
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #ff4444',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 68, 68, 0.1)',
          color: '#ff4444',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#ff4444' }}>
            ⚠️ Something went wrong
          </h2>
          <p style={{ margin: '0 0 16px 0', color: '#666' }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              marginRight: '8px'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Refresh Page
          </button>
          
          {/* Only show error details in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '16px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#ff4444' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{ 
                marginTop: '8px', 
                padding: '8px', 
                backgroundColor: 'rgba(0,0,0,0.1)', 
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
