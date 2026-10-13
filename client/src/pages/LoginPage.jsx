import { useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Eye, EyeSlash, ArrowRight } from '@phosphor-icons/react';
import BrandSymbol from '../components/BrandSymbol';

const ParticleBackground = lazy(() => import('../components/ParticleBackground'));

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const { login }     = useAuth();
  const { addToast }  = useToast();
  const navigate      = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please fill in all fields', 'warning');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      addToast('Welcome back', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.error || 'Login failed', 'error');
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

      {/* Ambient rose glow — one, positioned, not centered blob */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-8%',
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
          <div className="tag" style={{ margin: '0 auto 1rem', width: 'fit-content' }}>
            <span className="status-dot" style={{ width: '6px', height: '6px' }} />
            <span>Cinema Sync</span>
          </div>
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
            Welcome back
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Sign in to continue watching together
          </p>
        </div>

        {/* Form card with Double-Bezel */}
        <div
          className="double-bezel animate-scale-in"
          style={{ borderRadius: 'var(--radius-xl)', padding: '6px' }}
        >
          <div
            className="double-bezel-inner"
            style={{ padding: '2rem' }}
          >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
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
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-base"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label
                  htmlFor="login-password"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: '0.75rem', color: 'var(--color-rose-400)', textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-rose-300)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-rose-400)'}
                >
                  Forgot?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base"
                  autoComplete="current-password"
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
                    transition: 'color 150ms',
                  }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                >
                  {showPw ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-nested"
              style={{ width: '100%', marginTop: '0.25rem' }}
            >
              <span>{loading ? 'Signing in…' : 'Sign in'}</span>
              <span className="btn-nested-icon">
                <ArrowRight size={14} weight="bold" />
              </span>
            </button>
          </form>

          <p
            style={{
              textAlign: 'center',
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
              marginTop: '1.5rem',
            }}
          >
            No account?{' '}
            <Link
              to="/register"
              style={{ color: 'var(--color-rose-400)', textDecoration: 'none', fontWeight: 500, transition: 'color 150ms' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-rose-300)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-rose-400)'}
            >
              Sign up
            </Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
