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
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#080B12', color: '#E8EDF5', fontFamily: "'Inter', sans-serif", padding: 24
        }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚠</div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>Something went wrong</h1>
            <p style={{ fontSize: 13, color: '#8892A8', marginBottom: 24, lineHeight: 1.5 }}>
              {this.state.error.message}
            </p>
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
