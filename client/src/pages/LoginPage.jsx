import { useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const ParticleBackground = lazy(() => import('../components/ParticleBackground'));

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please fill in all fields', 'warning');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      addToast('Welcome back! 🎬', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <Suspense fallback={null}>
        <ParticleBackground />
      </Suspense>
      {/* Background effects */}
      <div className="absolute inset-0 bg-surface-900">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 no-underline mb-4">
            <span className="text-3xl">🎬</span>
            <span className="text-2xl font-bold gradient-brand-text">YouMeUss</span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mt-4">Welcome back</h1>
          <p className="text-text-secondary text-sm mt-1">Sign in to continue watching together</p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-5 sm:p-8 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-surface-700 border border-surface-400/20 rounded-xl px-4 py-3
                           text-sm text-text-primary placeholder:text-text-muted
                           focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20
                           transition-all duration-200"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-700 border border-surface-400/20 rounded-xl px-4 py-3
                           text-sm text-text-primary placeholder:text-text-muted
                           focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20
                           transition-all duration-200"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white gradient-brand
                         hover:opacity-90 transition-all duration-200 cursor-pointer border-none
                         disabled:opacity-50 disabled:cursor-not-allowed glow-brand"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 transition-colors no-underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
