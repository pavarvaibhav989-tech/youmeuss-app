import { useState, lazy, Suspense } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { Key, CheckCircle, WarningCircle, Eye, EyeSlash } from '@phosphor-icons/react';
import BrandSymbol from '../components/BrandSymbol';
import api from '../lib/api';

const ParticleBackground = lazy(() => import('../components/ParticleBackground'));

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const { addToast }            = useToast();
  const navigate                = useNavigate();
  const [searchParams]          = useSearchParams();
  const token                   = searchParams.get('token');

  // No token in URL → show error immediately
  if (!token) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: 'var(--color-surface-950)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
        }}
      >
        <div
          className="glass-elevated"
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            maxWidth: '380px',
            width: '100%',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'color-mix(in srgb, var(--color-red-500) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-red-500) 25%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <WarningCircle size={26} color="var(--color-red-500)" weight="fill" />
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            Invalid reset link
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.55, marginBottom: '1.5rem' }}>
            This link is missing a valid reset token. Please request a new password reset link.
          </p>
          <Link
            to="/forgot-password"
            className="btn-primary"
            style={{ textDecoration: 'none', width: '100%', justifyContent: 'center' }}
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirm) {
      addToast('Please fill in both fields', 'warning');
      return;
    }
    if (password.length < 6) {
      addToast('Password must be at least 6 characters', 'warning');
      return;
    }
    if (password !== confirm) {
      addToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      addToast(err.response?.data?.error || 'Reset failed — link may have expired', 'error');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
    marginBottom: '0.5rem',
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
          <BrandSymbol size={34} />
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
            {done ? 'Password updated' : 'Set new password'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {done ? 'Redirecting to login in a moment…' : 'Enter your new account password'}
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-elevated animate-scale-in"
          style={{ borderRadius: 'var(--radius-xl)', padding: '2rem' }}
        >
          {done ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'color-mix(in srgb, var(--color-green-500) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--color-green-500) 25%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={28} color="var(--color-green-500)" weight="fill" />
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Your password has been successfully updated.
              </p>
              <Link
                to="/login"
                className="btn-primary"
                style={{ textDecoration: 'none', width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              >
                Go to login now
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              <div>
                <label htmlFor="new-password" style={labelStyle}>New password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="new-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="input-base"
                    autoComplete="new-password"
                    autoFocus
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute',
                      right: '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-new-password" style={labelStyle}>Confirm new password</label>
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="input-base"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ justifyContent: 'center', marginTop: '0.25rem' }}
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
