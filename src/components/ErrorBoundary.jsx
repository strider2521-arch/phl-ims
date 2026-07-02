import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const err = this.state.error;
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#080B12', color: '#E8EDF5', fontFamily: "'Inter', sans-serif", padding: 24
        }}>
          <div style={{ maxWidth: 640, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚠</div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>Something went wrong</h1>
            <p style={{ fontSize: 13, color: '#8892A8', marginBottom: 16, lineHeight: 1.5 }}>
              {err.message}
            </p>
            {err.stack && (
              <details style={{ textAlign: 'left', marginBottom: 24 }}>
                <summary style={{ fontSize: 11, color: '#8892A8', cursor: 'pointer', marginBottom: 8 }}>
                  Technical details
                </summary>
                <pre style={{
                  fontSize: 10, color: '#8892A8', background: 'rgba(255,255,255,0.04)',
                  padding: 12, borderRadius: 6, overflowX: 'auto', lineHeight: 1.5,
                  maxHeight: 300, overflowY: 'auto',
                }}>{err.stack}</pre>
              </details>
            )}
            <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              style={{
                padding: '10px 24px', background: '#3B82F6', border: 'none', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 6
              }}>
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
