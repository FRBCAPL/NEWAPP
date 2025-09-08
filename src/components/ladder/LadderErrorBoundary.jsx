import React, { Component } from 'react';

class LadderErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LadderErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #8B5CF6',
          borderRadius: '12px',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          color: '#8B5CF6',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#8B5CF6' }}>
            🏆 Ladder System Error
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#666' }}>
            There was an issue loading the ladder data. This won't affect other parts of the app.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              background: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              marginRight: '8px'
            }}
          >
            Retry
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
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LadderErrorBoundary;
