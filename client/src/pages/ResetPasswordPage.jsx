import { useState, lazy, Suspense } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import api from '../lib/api';

const ParticleBackground = lazy(() => import('../components/ParticleBackground'));

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // No token in URL → show error immediately
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-surface-900">
        <div className="glass rounded-2xl p-8 text-center max-w-sm">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Invalid reset link</h2>
          <p className="text-sm text-text-secondary mb-6">
            This link is missing a reset token. Please request a new password reset.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-6 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold no-underline hover:opacity-90 transition-opacity"
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
      addToast(err.response?.data?.error || 'Reset failed — the link may have expired', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <Suspense fallback={null}>
        <ParticleBackground />
      </Suspense>
      {/* Background blobs */}
      <div className="absolute inset-0 bg-surface-900">
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 no-underline mb-4">
            <span className="text-3xl">🎬</span>
            <span className="text-2xl font-bold gradient-brand-text">YouMeUss</span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mt-4">
            {done ? 'Password updated!' : 'Set new password'}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {done ? 'Redirecting you to login...' : 'Choose a strong password for your account'}
          </p>
        </div>

        <div className="glass rounded-2xl p-5 sm:p-8 animate-scale-in">
          {done ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="text-5xl">✅</div>
              <p className="text-sm text-text-secondary">
                Your password has been updated successfully.
                You'll be redirected to the login page in a moment.
              </p>
              <Link
                to="/login"
                className="inline-block mt-2 text-sm text-brand-400 hover:text-brand-300 transition-colors no-underline font-medium"
              >
                Go to login now →
              </Link>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-text-secondary mb-1.5">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  autoFocus
                  className="w-full bg-surface-700 border border-surface-400/20 rounded-xl px-4 py-3
                             text-sm text-text-primary placeholder:text-text-muted
                             focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20
                             transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="confirm-new-password" className="block text-sm font-medium text-text-secondary mb-1.5">
                  Confirm new password
                </label>
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full bg-surface-700 border border-surface-400/20 rounded-xl px-4 py-3
                             text-sm text-text-primary placeholder:text-text-muted
                             focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20
                             transition-all duration-200"
                />
              </div>

              {/* Password strength hint */}
              {password.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-surface-600 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: password.length >= 12 ? '100%' : password.length >= 8 ? '66%' : password.length >= 6 ? '33%' : '10%',
                        background: password.length >= 12 ? '#22c55e' : password.length >= 8 ? '#eab308' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className="text-xs text-text-muted">
                    {password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Good' : 'Weak'}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white gradient-brand
                           hover:opacity-90 transition-all duration-200 cursor-pointer border-none
                           disabled:opacity-50 disabled:cursor-not-allowed glow-brand mt-2"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
