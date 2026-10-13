import { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { FilmSlate, EnvelopeSimple, ArrowLeft } from '@phosphor-icons/react';
import api from '../lib/api';

const ParticleBackground = lazy(() => import('../components/ParticleBackground'));

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const { addToast }          = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      addToast('Please enter your email address', 'warning');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-surface-950)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Suspense fallback={null}>
        <ParticleBackground />
      </Suspense>

      {/* Subtle ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-8%',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--color-rose-500) 7%, transparent) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '400px',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            marginBottom: '2rem',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, var(--color-rose-500), var(--color-rose-700))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FilmSlate size={16} color="white" weight="fill" />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.125rem',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--color-text-primary)',
            }}
          >
            YouMe<span style={{ color: 'var(--color-rose-500)' }}>Uss</span>
          </span>
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.75rem',
              fontWeight: 700,
              letterSpacing: '-0.035em',
              color: 'var(--color-text-primary)',
              marginBottom: '0.375rem',
              lineHeight: 1.15,
            }}
          >
            {sent ? 'Check your inbox' : 'Forgot password?'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {sent ? 'A reset link was dispatched to your email' : 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-elevated animate-scale-in"
          style={{ borderRadius: 'var(--radius-xl)', padding: '2rem' }}
        >
          {sent ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'color-mix(in srgb, var(--color-rose-500) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--color-rose-500) 25%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <EnvelopeSimple size={28} color="var(--color-rose-400)" weight="duotone" />
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                If <strong style={{ color: 'var(--color-text-primary)' }}>{email}</strong> is registered, you’ll receive a link shortly. The link expires in 1 hour.
              </p>

              <Link
                to="/login"
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  marginTop: '0.5rem',
                }}
              >
                <ArrowLeft size={14} weight="bold" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label
                  htmlFor="forgot-email"
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Email address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-base"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ justifyContent: 'center' }}
              >
                {loading ? 'Sending link…' : 'Send reset link'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Remembered your password?{' '}
                <Link
                  to="/login"
                  style={{ color: 'var(--color-rose-400)', textDecoration: 'none', fontWeight: 500 }}
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
