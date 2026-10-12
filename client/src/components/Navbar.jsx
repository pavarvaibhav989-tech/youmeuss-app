import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { House, SignOut, ArrowLeft, UserCircle, FilmSlate } from '@phosphor-icons/react';

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
    <nav
      className="fixed top-0 left-0 right-0 z-50 glass"
      style={{
        borderBottom: '1px solid color-mix(in srgb, white 5%, transparent)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}
      >
        {/* Left — Logo + optional back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--color-rose-500), var(--color-rose-700))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px color-mix(in srgb, var(--color-rose-600) 30%, transparent)',
              }}
            >
              <FilmSlate size={15} color="white" weight="fill" />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.0625rem',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--color-text-primary)',
              }}
            >
              YouMe<span style={{ color: 'var(--color-rose-500)' }}>Uss</span>
            </span>
          </Link>

          {/* In-room back button */}
          {isInRoom && (
            <Link
              to="/"
              className="btn-ghost"
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                gap: '0.35rem',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={12} weight="bold" />
              Home
            </Link>
          )}
        </div>

        {/* Right — auth controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAuthenticated ? (
            <>
              {/* User pill */}
              <div
                className="hidden sm:flex"
                style={{ alignItems: 'center', gap: '0.5rem' }}
              >
                <div
                  className="avatar"
                  style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}
                >
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {user?.username}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="btn-icon"
                title="Log out"
                style={{ borderRadius: '8px' }}
              >
                <SignOut size={15} weight="bold" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="nav-link"
                style={{ textDecoration: 'none' }}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="btn-primary"
                style={{ textDecoration: 'none', padding: '0.5rem 1.125rem' }}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
