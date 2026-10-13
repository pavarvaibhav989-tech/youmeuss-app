import { useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Eye, EyeSlash, ArrowRight } from '@phosphor-icons/react';
import BrandSymbol from '../components/BrandSymbol';

const ParticleBackground = lazy(() => import('../components/ParticleBackground'));

export default function RegisterPage() {
  const [username,        setUsername]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw,          setShowPw]          = useState(false);
  const [loading,         setLoading]         = useState(false);
  const { register }   = useAuth();
  const { addToast }   = useToast();
  const navigate       = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !email || !password || !confirmPassword) {
      addToast('Please fill in all fields', 'warning');
      return;
    }
    if (password.length < 6) {
      addToast('Password must be at least 6 characters', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password);
      addToast('Account created. Welcome!', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.error || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputLabelStyle = {
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

      {/* Single ambient glow — top right, not centered */}
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
          maxWidth: '420px',
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
            <span>Instant Free Access</span>
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
            Create your account
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Start watching together in under a minute
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
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {/* Username */}
            <div>
              <label htmlFor="reg-username" style={inputLabelStyle}>Username</label>
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                className="input-base"
                autoComplete="username"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" style={inputLabelStyle}>Email</label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-password" style={inputLabelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="input-base"
                  autoComplete="new-password"
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
                >
                  {showPw ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm-password" style={inputLabelStyle}>Confirm password</label>
              <input
                id="reg-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input-base"
                autoComplete="new-password"
              />
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="btn-nested"
              style={{ width: '100%', marginTop: '0.375rem' }}
            >
              <span>{loading ? 'Creating account…' : 'Create account'}</span>
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
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: 'var(--color-rose-400)', textDecoration: 'none', fontWeight: 500, transition: 'color 150ms' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-rose-300)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-rose-400)'}
            >
              Sign in
            </Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
