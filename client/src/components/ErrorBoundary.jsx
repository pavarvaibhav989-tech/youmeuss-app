import { Component } from 'react';
import { WarningCircle, FilmSlate, ArrowCounterClockwise } from '@phosphor-icons/react';

/**
 * ErrorBoundary — catches uncaught JS errors anywhere in the component tree
 * and renders a styled fallback instead of crashing the entire app.
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

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const { compact, label } = this.props;

    if (compact) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '20px', textAlign: 'center',
          background: 'color-mix(in srgb, var(--color-red-500) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-red-500) 20%, transparent)',
          borderRadius: 'var(--radius-lg)', gap: '8px',
        }}>
          <WarningCircle size={22} color="var(--color-red-500)" weight="fill" />
          <p style={{ color: 'var(--color-text-primary)', fontSize: '0.8125rem', fontWeight: 600, margin: 0 }}>
            {label || 'Something went wrong'}
          </p>
          <button
            onClick={this.handleReset}
            className="btn-ghost"
            style={{
              padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.35rem',
            }}
          >
            <ArrowCounterClockwise size={12} weight="bold" />
            Try again
          </button>
        </div>
      );
    }

    // Full-page fallback
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-surface-950)', padding: '24px', textAlign: 'center',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'var(--color-surface-800)',
          border: '1px solid color-mix(in srgb, white 8%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          <FilmSlate size={26} color="var(--color-rose-400)" weight="duotone" />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)',
          letterSpacing: '-0.03em', margin: '0 0 8px',
        }}>
          Something went wrong
        </h1>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', maxWidth: '380px', lineHeight: 1.6, margin: '0 0 24px' }}>
          An unexpected error occurred. Try refreshing or head back to the home page.
        </p>

        {this.state.error && (
          <details style={{ marginBottom: '20px', maxWidth: '480px', textAlign: 'left', width: '100%' }}>
            <summary style={{ color: 'var(--color-text-muted)', fontSize: '12px', cursor: 'pointer' }}>
              Error details
            </summary>
            <pre style={{
              marginTop: '8px', padding: '12px', borderRadius: '8px',
              background: 'var(--color-surface-800)', border: '1px solid color-mix(in srgb, white 6%, transparent)',
              color: 'var(--color-text-muted)', fontSize: '11px', overflowX: 'auto',
              fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {this.state.error.message}
            </pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={this.handleReset}
            className="btn-primary"
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            Try again
          </button>
          <a
            href="/"
            className="btn-ghost"
            style={{ textDecoration: 'none' }}
          >
            Go home
          </a>
        </div>
      </div>
    );
  }
}
