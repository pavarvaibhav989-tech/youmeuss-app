import { useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const ParticleBackground = lazy(() => import('../components/ParticleBackground'));

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

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
      addToast('Welcome to YouMeUss! 🎬🍿', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.error || 'Registration failed', 'error');
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
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 -left-32 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 no-underline mb-4">
            <span className="text-3xl">🎬</span>
            <span className="text-2xl font-bold gradient-brand-text">YouMeUss</span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mt-4">Create your account</h1>
          <p className="text-text-secondary text-sm mt-1">Start watching together in seconds</p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-5 sm:p-8 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="coolwatcher42"
                className="w-full bg-surface-700 border border-surface-400/20 rounded-xl px-4 py-3
                           text-sm text-text-primary placeholder:text-text-muted
                           focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20
                           transition-all duration-200"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-text-secondary mb-1.5">
                Email
              </label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-password" className="block text-sm font-medium text-text-secondary mb-1.5">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full bg-surface-700 border border-surface-400/20 rounded-xl px-4 py-3
                           text-sm text-text-primary placeholder:text-text-muted
                           focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20
                           transition-all duration-200"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-text-secondary mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-700 border border-surface-400/20 rounded-xl px-4 py-3
                           text-sm text-text-primary placeholder:text-text-muted
                           focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20
                           transition-all duration-200"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white gradient-brand
                         hover:opacity-90 transition-all duration-200 cursor-pointer border-none
                         disabled:opacity-50 disabled:cursor-not-allowed glow-brand mt-2"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors no-underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
