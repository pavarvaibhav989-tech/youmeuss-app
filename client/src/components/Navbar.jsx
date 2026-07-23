import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isInRoom = location.pathname.startsWith('/room/');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <span className="text-2xl">🎬</span>
              <span className="text-xl font-bold gradient-brand-text">YouMeUss</span>
            </Link>
            {/* Home button — only shown inside a room */}
            {isInRoom && (
              <Link
                to="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                           text-text-muted hover:text-text-primary bg-surface-600 hover:bg-surface-500
                           border border-surface-400/20 transition-all duration-200 no-underline"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Home
              </Link>
            )}
          </div>


          {/* Right side */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* User info */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-sm font-semibold text-white">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-text-secondary">{user?.username}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary
                             bg-surface-600 hover:bg-surface-500 transition-all duration-200
                             border border-surface-400/30 cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary
                             hover:text-text-primary transition-colors duration-200 no-underline"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white
                             gradient-brand hover:opacity-90 transition-opacity duration-200
                             no-underline glow-brand"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
