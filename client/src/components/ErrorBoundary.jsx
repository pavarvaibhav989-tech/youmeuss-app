import { Component } from 'react';

/**
 * ErrorBoundary — catches uncaught JS errors anywhere in the component tree
 * and renders a styled fallback instead of crashing the entire app.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary fallback={<p>Custom message</p>}>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Use custom fallback if provided
    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Default full-page fallback
    const { compact, label } = this.props;

    if (compact) {
      // Inline fallback for widget-level boundaries (chat, video player, etc.)
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '24px', textAlign: 'center',
          background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '12px', gap: '8px',
        }}>
          <span style={{ fontSize: '28px' }}>⚠️</span>
          <p style={{ color: '#fc8181', fontSize: '13px', fontWeight: 600, margin: 0 }}>
            {label || 'Something went wrong'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '4px', padding: '6px 16px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fc8181', fontSize: '12px', cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    // Full-page fallback
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0a0a0f', padding: '24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>💔</div>

        <h1 style={{
          fontSize: '22px', fontWeight: 700, color: '#f1f5f9',
          margin: '0 0 8px',
        }}>
          Something went wrong
        </h1>

        <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '360px', lineHeight: 1.6, margin: '0 0 24px' }}>
          An unexpected error occurred. Try refreshing — if it keeps happening, the room may have an issue.
        </p>

        {/* Error detail (collapsed, for developers) */}
        {this.state.error && (
          <details style={{ marginBottom: '20px', maxWidth: '480px', textAlign: 'left' }}>
            <summary style={{ color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>
              Error details
            </summary>
            <pre style={{
              marginTop: '8px', padding: '12px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#fc8181', fontSize: '11px', overflowX: 'auto',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {this.state.error.message}
            </pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={this.handleReset}
            style={{
              padding: '10px 24px', borderRadius: '12px', cursor: 'pointer',
              background: 'linear-gradient(135deg, #e879f9, #8b5cf6)',
              border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600,
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              padding: '10px 24px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', fontSize: '14px', fontWeight: 500, textDecoration: 'none',
            }}
          >
            Go home
          </a>
        </div>
      </div>
    );
  }
}
