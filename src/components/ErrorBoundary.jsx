import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: Date.now()
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
          maxWidth: '500px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎱</div>
          
          <h2 style={{ 
            color: '#c92a2a', 
            marginBottom: '16px',
            fontSize: '24px'
          }}>
            Oops! Something went wrong
          </h2>
          
          <p style={{ 
            color: '#495057', 
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            {this.props.message || 
             "The pool league app encountered an error. Don't worry - your data is safe!"}
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              🔄 Try Again
            </button>
            
            <button
              onClick={this.handleReload}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              🔃 Reload Page
            </button>
          </div>
          
          <p style={{ 
            fontSize: '12px', 
            color: '#6c757d', 
            marginTop: '20px',
            fontStyle: 'italic'
          }}>
            Error ID: {this.state.errorId}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
