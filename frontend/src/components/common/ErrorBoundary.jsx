import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    self.state = { hasError: false, error: null };
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React Error Boundary Caught]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            backgroundColor: '#1e293b',
            padding: '2.5rem',
            borderRadius: '16px',
            border: '1px solid #334155',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f8fafc' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              The application encountered an unexpected visual rendering error. Don't worry, your cart and session state are safe.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
