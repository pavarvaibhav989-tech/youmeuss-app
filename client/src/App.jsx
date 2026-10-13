import { useState, lazy, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useToast } from './components/Toast';
import Navbar from './components/Navbar';
import api from './lib/api';
import './index.css';

import {
  Play,
  ArrowRight,
  Users,
  Chat,
  VideoCamera,
  Link as LinkIcon,
  ClockCounterClockwise,
  FilmSlate,
  SpeakerHigh,
  Smiley,
} from '@phosphor-icons/react';

const ParticleBackground = lazy(() => import('./components/ParticleBackground'));

// ── Feature data — no emoji, Phosphor icons, varied asymmetric layout ──
const FEATURES = [
  {
    Icon: FilmSlate,
    title: 'Synchronized playback',
    desc: 'One press plays for everyone. No lag, no drift, no "wait, where are you?"',
    accent: 'rose',
    size: 'large', // spans more in the grid
  },
  {
    Icon: VideoCamera,
    title: 'Live video calls',
    desc: 'See faces react in real-time while the movie plays.',
    accent: 'neutral',
    size: 'small',
  },
  {
    Icon: Chat,
    title: 'Real-time chat',
    desc: 'Fire off reactions without pausing. History persists after you leave.',
    accent: 'neutral',
    size: 'small',
  },
  {
    Icon: LinkIcon,
    title: 'Instant invites',
    desc: 'Share a 6-char code. No installs, no accounts required for guests.',
    accent: 'neutral',
    size: 'small',
  },
];

export default function App() {
  const [roomCode, setRoomCode]   = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [myRooms, setMyRooms]     = useState([]);
  const { isAuthenticated }       = useAuth();
  const { addToast }              = useToast();
  const navigate                  = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/rooms')
       .then(({ data }) => setMyRooms(data.rooms || []))
       .catch(() => {});
  }, [isAuthenticated]);

  const createRoom = async () => {
    if (!isAuthenticated) {
      addToast('Sign in to create a room', 'warning');
      navigate('/login');
      return;
    }
    setCreatingRoom(true);
    try {
      const { data } = await api.post('/rooms');
      addToast('Room created', 'success');
      navigate(`/room/${data.room.room_code}`);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create room', 'error');
    } finally {
      setCreatingRoom(false);
    }
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      addToast('Sign in to join a room', 'warning');
      navigate('/login');
      return;
    }
    if (roomCode.trim()) navigate(`/room/${roomCode.trim()}`);
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-surface-950)', display: 'flex', flexDirection: 'column' }}>
      <Suspense fallback={null}>
        <ParticleBackground />
      </Suspense>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Navbar />

        {/* ── HERO — asymmetric: left-aligned headline, right-side form ──────── */}
        <section
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            paddingTop: '96px',
            paddingBottom: '80px',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 420px)',
              gap: '4rem',
              alignItems: 'center',
              width: '100%',
            }}
            className="hero-grid"
          >
            {/* Left — headline copy */}
            <div className="animate-slide-up">
              {/* Eyebrow — used ONCE in the hero only */}
              <div
                className="tag animate-fade-in"
                style={{ marginBottom: '1.5rem', animationDelay: '0ms' }}
              >
                <div className="status-dot" style={{ width: '6px', height: '6px' }} />
                Watch parties, reimagined
              </div>

              {/* H1 — max 2 lines, tracking-tight */}
              <h1
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'clamp(2.75rem, 5.5vw, 4.25rem)',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.045em',
                  color: 'var(--color-text-primary)',
                  marginBottom: '1.25rem',
                  textWrap: 'balance',
                }}
              >
                Movies feel better<br />
                <span style={{ color: 'var(--color-rose-500)' }}>together.</span>
              </h1>

              {/* Sub — max 20 words */}
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.0625rem',
                  lineHeight: 1.65,
                  color: 'var(--color-text-secondary)',
                  maxWidth: '44ch',
                  marginBottom: '2.25rem',
                }}
              >
                Synchronized video, live video calls, and real-time chat — in one shared room.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  id="create-room-btn"
                  onClick={createRoom}
                  disabled={creatingRoom}
                  className="btn-nested"
                  style={{ fontSize: '0.9375rem', padding: '0.625rem 0.75rem 0.625rem 1.6rem' }}
                >
                  <span>{creatingRoom ? 'Creating…' : 'Create a room'}</span>
                  <span className="btn-nested-icon" style={{ width: '32px', height: '32px' }}>
                    <ArrowRight size={15} weight="bold" />
                  </span>
                </button>
              </div>
            </div>

            {/* Right — join form panel with Double-Bezel */}
            <div
              className="double-bezel animate-scale-in"
              style={{
                borderRadius: 'var(--radius-xl)',
                padding: '6px',
                animationDelay: '120ms',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                className="double-bezel-inner"
                style={{
                  padding: '2rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
              {/* Subtle rose ambient behind the card */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '-40%',
                  right: '-30%',
                  width: '280px',
                  height: '280px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, color-mix(in srgb, var(--color-rose-500) 10%, transparent) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              <h2
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.375rem',
                }}
              >
                Join an existing room
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                Enter the 6-character room code from your friend.
              </p>

              <form onSubmit={joinRoom}>
                <div style={{ marginBottom: '0.875rem' }}>
                  <label
                    htmlFor="room-code-input"
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
                    Room code
                  </label>
                  <input
                    id="room-code-input"
                    type="text"
                    className="input-base"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. XK9WPQ"
                    maxLength={6}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      fontSize: '1rem',
                      textAlign: 'center',
                    }}
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-nested"
                  id="join-room-btn"
                  style={{ width: '100%', marginTop: '0.25rem' }}
                >
                  <span>Join room</span>
                  <span className="btn-nested-icon">
                    <Play size={14} weight="fill" />
                  </span>
                </button>
              </form>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  margin: '1.25rem 0',
                }}
              >
                <div className="divider" style={{ flex: 1 }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>or</span>
                <div className="divider" style={{ flex: 1 }} />
              </div>

              <button
                onClick={createRoom}
                disabled={creatingRoom}
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Start a new room
              </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── RECENT ROOMS — only for logged-in users ──────────────────────── */}
        {isAuthenticated && myRooms.length > 0 && (
          <section
            style={{
              paddingBottom: '2rem',
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
              maxWidth: '1280px',
              margin: '0 auto',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <ClockCounterClockwise size={14} color="var(--color-text-muted)" />
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                }}
              >
                Recent rooms
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {myRooms.slice(0, 6).map((room) => (
                <button
                  key={room.id}
                  onClick={() => navigate(`/room/${room.room_code}`)}
                  className="card-surface"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem 1.125rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'border-color 150ms, background 150ms, transform 150ms',
                    background: 'var(--color-surface-800)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-rose-500) 25%, transparent)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, white 5%, transparent)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="room-code">{room.room_code}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Users size={11} color="var(--color-text-muted)" />
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                        {room.participant_count}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                    Hosted by{' '}
                    <span style={{ color: 'var(--color-text-secondary)' }}>{room.host_username}</span>
                  </p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    {room.last_message_at
                      ? new Date(room.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      : new Date(room.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── FEATURES — asymmetric bento grid, not 4-equal-card row ─────────── */}
        <section
          style={{
            padding: '2rem 1.5rem 5rem',
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'grid',
              // Asymmetric: large feature spans 2 cols on desktop
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gridTemplateRows: 'auto auto',
              gap: '1rem',
            }}
            className="features-grid"
          >
            {/* Feature 0 — large hero feature card */}
            <div
              className="card-surface animate-fade-in"
              style={{
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                gridColumn: '1 / span 2',
                gridRow: '1',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative',
                overflow: 'hidden',
                animationDelay: '0ms',
              }}
            >
              {/* Ambient tint */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '220px',
                  height: '220px',
                  background: 'radial-gradient(circle, color-mix(in srgb, var(--color-rose-500) 8%, transparent) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'color-mix(in srgb, var(--color-rose-500) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--color-rose-500) 20%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FilmSlate size={20} color="var(--color-rose-400)" weight="fill" />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    letterSpacing: '-0.025em',
                    color: 'var(--color-text-primary)',
                    marginBottom: '0.4rem',
                  }}
                >
                  Synchronized playback
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: '38ch' }}>
                  One press plays for everyone. No lag, no drift — perfectly locked across all devices in the room.
                </p>
              </div>
            </div>

            {/* Feature 1 — video call, right column */}
            <FeatureCard
              Icon={VideoCamera}
              title="Live video calls"
              desc="See faces react in real time while the movie plays."
              style={{ gridColumn: '3', gridRow: '1', animationDelay: '80ms' }}
            />

            {/* Feature 2 — chat */}
            <FeatureCard
              Icon={Chat}
              title="Real-time chat"
              desc="Fire off reactions without pausing. History persists after you leave."
              style={{ gridColumn: '1', gridRow: '2', animationDelay: '160ms' }}
            />

            {/* Feature 3 — invite */}
            <FeatureCard
              Icon={Users}
              title="Instant invites"
              desc="6-character code, zero installs. Click and you're in."
              style={{ gridColumn: '2 / span 2', gridRow: '2', animationDelay: '240ms' }}
            />
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
        <footer
          style={{
            borderTop: '1px solid color-mix(in srgb, white 5%, transparent)',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            <span style={{ color: 'var(--color-rose-500)', fontWeight: 600 }}>YouMeUss</span>
            {' '}— Watch together, wherever you are.
          </span>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <a href="#" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}>Terms</a>
          </div>
        </footer>
      </div>

      {/* ── Responsive CSS for hero grid and features on mobile ── */}
      <style>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          .features-grid > div {
            grid-column: 1 !important;
            grid-row: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Reusable small feature card ─────────────────────────────────────── */
function FeatureCard({ Icon, title, desc, style }) {
  return (
    <div
      className="card-surface animate-fade-in"
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        ...style,
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'var(--color-surface-700)',
          border: '1px solid color-mix(in srgb, white 7%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={17} color="var(--color-text-secondary)" />
      </div>
      <div>
        <h3
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9375rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
            marginBottom: '0.3rem',
          }}
        >
          {title}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
          {desc}
        </p>
      </div>
    </div>
  );
}