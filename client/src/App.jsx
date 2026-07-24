import { useState, lazy, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useToast } from './components/Toast';
import Navbar from './components/Navbar';
import api from './lib/api';
import './index.css';

// Lazy-load Three.js particle background — renders after critical content
// so the page text/buttons appear instantly without waiting for 172KB of Three.js
const ParticleBackground = lazy(() => import('./components/ParticleBackground'));

export default function App() {
  const [roomCode, setRoomCode] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [myRooms, setMyRooms] = useState([]);
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Load user's existing rooms
  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/rooms')
      .then(({ data }) => setMyRooms(data.rooms || []))
      .catch(() => {}); // silently ignore — not critical
  }, [isAuthenticated]);

  const createRoom = async () => {
    if (!isAuthenticated) {
      addToast('Please sign in to create a room', 'warning');
      navigate('/login');
      return;
    }

    setCreatingRoom(true);
    try {
      const { data } = await api.post('/rooms');
      addToast('Room created! 🎬', 'success');
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
      addToast('Please sign in to join a room', 'warning');
      navigate('/login');
      return;
    }

    if (roomCode.trim()) {
      navigate(`/room/${roomCode.trim()}`);
    }
  };

  const features = [
    {
      icon: '🎬',
      title: 'Watch Together',
      desc: 'Perfectly synchronized video playback. When one person plays, everyone plays.',
    },
    {
      icon: '📹',
      title: 'Video Call',
      desc: 'See your friends\' reactions in real-time with built-in video calling.',
    },
    {
      icon: '💬',
      title: 'Live Chat',
      desc: 'Chat while you watch. Share reactions, comments, and emojis instantly.',
    },
    {
      icon: '🔗',
      title: 'Easy Invites',
      desc: 'Share a simple link. No downloads, no installs. Just click and join.',
    },
  ];

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      {/* Particles load after main content — null fallback = no flash */}
      <Suspense fallback={null}>
        <ParticleBackground />
      </Suspense>
      <div className="relative z-10 flex flex-col flex-1">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 pt-16 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/8 rounded-full blur-[150px] animate-pulse-soft" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-500/8 rounded-full blur-[150px] animate-pulse-soft"
               style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium
                          text-text-secondary mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            Watch parties, reimagined
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-6 animate-slide-up">
            <span className="text-text-primary">Movies feel</span>
            <br />
            <span className="text-text-primary">better with </span>
            <span className="gradient-brand-text">Uss</span>
            <span className="ml-2">🍿</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-12 animate-slide-up leading-relaxed"
             style={{ animationDelay: '0.1s' }}>
            Watch videos together with friends, no matter the distance.
            Synchronized playback, video calls, and real-time chat — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 animate-slide-up"
               style={{ animationDelay: '0.2s' }}>
            <button
              onClick={createRoom}
              disabled={creatingRoom}
              className="px-8 py-4 rounded-2xl text-base font-bold text-white gradient-brand
                         hover:opacity-90 transition-all duration-300 cursor-pointer border-none
                         glow-brand disabled:opacity-50 min-w-[200px]"
            >
              {creatingRoom ? '✨ Creating...' : '✨ Create Room'}
            </button>

            <span className="text-text-muted text-sm">or</span>

            <form onSubmit={joinRoom} className="flex items-center gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                maxLength={6}
                className="w-36 bg-surface-700 border border-surface-400/20 rounded-xl px-4 py-3.5
                           text-sm text-text-primary placeholder:text-text-muted text-center
                           font-mono tracking-[0.2em] uppercase
                           focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20
                           transition-all duration-200"
              />
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl text-sm font-semibold text-white
                           bg-accent-600 hover:bg-accent-500 transition-all duration-200
                           cursor-pointer border-none glow-accent"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Your Rooms — only shown to logged-in users with existing rooms */}
      {isAuthenticated && myRooms.length > 0 && (
        <section className="px-4 pb-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
              🕐 Your Recent Rooms
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myRooms.slice(0, 6).map((room) => (
                <button
                  key={room.id}
                  onClick={() => navigate(`/room/${room.room_code}`)}
                  className="glass rounded-xl p-4 text-left group hover:border-brand-500/30
                             transition-all duration-200 cursor-pointer border border-surface-400/10
                             hover:bg-surface-700/30 w-full"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-base font-bold text-brand-400 tracking-widest">
                      {room.room_code}
                    </span>
                    <span className="text-xs text-text-muted">
                      {room.participant_count} 👤
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Hosted by <span className="text-text-secondary">{room.host_username}</span>
                  </p>
                  <p className="text-[10px] text-text-muted mt-1">
                    Last active {room.last_message_at
                      ? new Date(room.last_message_at).toLocaleDateString()
                      : new Date(room.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="px-4 pb-20 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="glass rounded-2xl p-6 group hover:border-brand-500/20 transition-all duration-300
                           animate-slide-up"
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </span>
                <h3 className="text-sm font-bold text-text-primary mb-1.5">{feature.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t border-surface-400/10 py-6 text-center">
        <p className="text-xs text-text-muted">
          🎬 YouMeUss — Watch Together, Stay Connected
        </p>
      </footer>
      </div>
    </div>
  );
}