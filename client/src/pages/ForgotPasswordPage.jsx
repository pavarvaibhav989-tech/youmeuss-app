import { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import api from '../lib/api';

const ParticleBackground = lazy(() => import('../components/ParticleBackground'));

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { addToast } = useToast();

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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <Suspense fallback={null}>
        <ParticleBackground />
      </Suspense>
      {/* Background blobs */}
      <div className="absolute inset-0 bg-surface-900">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center gap-2 no-underline mb-4">
            <span className="text-3xl">🎬</span>
            <span className="text-2xl font-bold gradient-brand-text">YouMeUss</span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mt-4">Forgot your password?</h1>
          <p className="text-text-secondary text-sm mt-1">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="glass rounded-2xl p-5 sm:p-8 animate-scale-in">
          {sent ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="text-5xl">📬</div>
              <h2 className="text-lg font-semibold text-text-primary">Check your inbox</h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                If <span className="text-text-primary font-medium">{email}</span> is registered,
                you'll receive a reset link shortly. The link expires in <strong>1 hour</strong>.
              </p>
              <p className="text-xs text-text-muted">
                Don't see it? Check your spam folder.
              </p>
              <Link
                to="/login"
                className="inline-block mt-2 text-sm text-brand-400 hover:text-brand-300 transition-colors no-underline"
              >
                ← Back to login
              </Link>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-text-secondary mb-1.5">
                  Email address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  className="w-full bg-surface-700 border border-surface-400/20 rounded-xl px-4 py-3
                             text-sm text-text-primary placeholder:text-text-muted
                             focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20
                             transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white gradient-brand
                           hover:opacity-90 transition-all duration-200 cursor-pointer border-none
                           disabled:opacity-50 disabled:cursor-not-allowed glow-brand"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <p className="text-center text-sm text-text-muted">
                Remember it?{' '}
                <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors no-underline font-medium">
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
