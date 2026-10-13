import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useRoom } from '../hooks/useRoom';
import { useVideoSync } from '../hooks/useVideoSync';
import { useChat } from '../hooks/useChat';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoPlayer from '../components/VideoPlayer';
import ChatPanel from '../components/ChatPanel';
import ParticipantList from '../components/ParticipantList';
import VideoCall from '../components/VideoCall';
import VideoUpload from '../components/VideoUpload';
import InviteModal from '../components/InviteModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';
import ErrorBoundary from '../components/ErrorBoundary';
import { Chat, Users, VideoCamera, UserPlus, HourglassMedium, Link, FilmSlate } from '@phosphor-icons/react';

export default function RoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);
  const urlInputRef = useRef(null);
  const [sidebarTab, setSidebarTab] = useState('chat');

  useSocket(roomId);

  const { room, participants, host, loading, error } = useRoom(roomId);
  const isHost = host?.id === user?.id;

  const {
    videoUrl, isPlaying, currentTime, isSyncing,
    loadVideo, play, pause, seek,
  } = useVideoSync(roomId, isHost);

  const { messages, typingUsers, sendMessage, sendTyping } = useChat(roomId);

  const {
    localStream, remoteStreams, isCallActive,
    isMuted, isCameraOff,
    startCall, endCall, toggleMute, toggleCamera,
  } = useWebRTC(roomId, user?.id);

  const handleLoadUrl = (e) => {
    e.preventDefault();
    const val = (urlInputRef.current?.value || '').trim();
    if (val) {
      loadVideo(val);
      if (urlInputRef.current) urlInputRef.current.value = '';
    }
  };

  const handleVideoUploaded = (url) => loadVideo(url);

  useEffect(() => {
    window.__loadVideo = loadVideo;
    return () => { delete window.__loadVideo; };
  }, [loadVideo]);

  if (loading) return <LoadingSpinner text="Joining room…" />;

  if (error) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-surface-950)', gap: '0.75rem',
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: 'var(--color-surface-800)',
          border: '1px solid color-mix(in srgb, white 6%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FilmSlate size={22} color="var(--color-text-muted)" />
        </div>
        <h2 style={{
          fontFamily: 'var(--font-sans)', fontSize: '1.125rem', fontWeight: 700,
          letterSpacing: '-0.025em', color: 'var(--color-text-primary)',
        }}>
          Room not found
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{error}</p>
        <a href="/" className="btn-primary" style={{ textDecoration: 'none', marginTop: '0.5rem' }}>
          Go home
        </a>
      </div>
    );
  }

  const onlineCount = participants.filter(p => p.isOnline !== false).length;
  const tabs = [
    { id: 'chat',   Icon: Chat,        label: 'Chat',   badge: messages.length > 0 ? messages.length : null, dot: false },
    { id: 'people', Icon: Users,       label: 'People', badge: participants.length, dot: false },
    { id: 'call',   Icon: VideoCamera, label: 'Call',   badge: null, dot: isCallActive },
  ];

  return (
    <div style={{
      height: '100dvh',
      background: 'var(--color-surface-950)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <Navbar />

      {/* ── Room sub-header ───────────────────────────────────── */}
      <div style={{ paddingTop: '64px', flexShrink: 0 }}>
        <div style={{
          padding: '0 1.25rem',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid color-mix(in srgb, white 5%, transparent)',
          background: 'color-mix(in srgb, var(--color-surface-900) 90%, transparent)',
          backdropFilter: 'blur(12px)',
        }}>
          {/* Left: room code + presence */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="room-code">{room?.room_code}</span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              fontSize: '0.75rem', color: 'var(--color-text-muted)',
            }}>
              <span className="status-dot" style={{ width: '6px', height: '6px' }} />
              <span style={{ fontFamily: 'var(--font-mono)' }}>{onlineCount}</span>
              <span>online</span>
            </div>
          </div>

          {/* Right: invite */}
          <button
            onClick={() => setShowInvite(true)}
            className="btn-ghost"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.35rem', height: '32px' }}
          >
            <UserPlus size={13} weight="bold" />
            Invite
          </button>
        </div>
      </div>

      {/* ── Main two-column layout ─────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }} className="room-main">
        {/* Left: Video Column */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
        }}>
          {/* Host controls */}
          {isHost && (
            <div style={{
              padding: '0.75rem 1rem 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              flexShrink: 0,
            }}>
              <form onSubmit={handleLoadUrl} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Link
                    size={14}
                    color="var(--color-text-muted)"
                    style={{
                      position: 'absolute', left: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)', pointerEvents: 'none',
                    }}
                  />
                  <input
                    ref={urlInputRef}
                    type="text"
                    defaultValue=""
                    placeholder="Paste YouTube or video URL…"
                    className="input-base"
                    style={{
                      paddingLeft: '2.25rem',
                      paddingTop: '0.55rem',
                      paddingBottom: '0.55rem',
                      fontSize: '0.8125rem',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flexShrink: 0, padding: '0.55rem 1.125rem', fontSize: '0.8125rem' }}
                >
                  Load
                </button>
              </form>
              <VideoUpload roomId={room?.id} onVideoLoaded={handleVideoUploaded} />
            </div>
          )}

          {/* Non-host waiting banner */}
          {!isHost && !videoUrl && (
            <div style={{ padding: '0.75rem 1rem 0', flexShrink: 0 }}>
              <div className="glass" style={{
                borderRadius: 'var(--radius-lg)',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
              }}>
                <HourglassMedium size={15} color="var(--color-rose-400)" weight="duotone" />
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  Waiting for{' '}
                  <span style={{ color: 'var(--color-rose-400)', fontWeight: 600 }}>
                    {host?.username}
                  </span>{' '}
                  to load a video
                </p>
              </div>
            </div>
          )}

          {/* Video player */}
          <div style={{ flex: 1, padding: '0.75rem 1rem 1rem', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <ErrorBoundary compact label="Video player error">
              <VideoPlayer
                videoUrl={videoUrl}
                isPlaying={isPlaying}
                currentTime={currentTime}
                isSyncing={isSyncing}
                isHost={isHost}
                onPlay={play}
                onPause={pause}
                onSeek={seek}
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* Right: Sidebar */}
        <aside style={{
          width: '340px',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid color-mix(in srgb, white 5%, transparent)',
          background: 'color-mix(in srgb, var(--color-surface-900) 70%, transparent)',
          flexShrink: 0,
          overflow: 'hidden',
        }} className="room-sidebar">
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid color-mix(in srgb, white 5%, transparent)',
            flexShrink: 0,
          }}>
            {tabs.map((tab) => {
              const active = sidebarTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSidebarTab(tab.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    padding: '0.8rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                    background: active
                      ? 'color-mix(in srgb, var(--color-rose-500) 6%, transparent)'
                      : 'none',
                    border: 'none',
                    borderBottom: `2px solid ${active ? 'var(--color-rose-500)' : 'transparent'}`,
                    color: active ? 'var(--color-rose-400)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    transition: 'color 150ms, border-color 150ms, background 150ms',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <tab.Icon size={14} weight={active ? 'fill' : 'regular'} />
                  {tab.label}
                  {tab.badge !== null && tab.badge !== undefined && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.625rem',
                      background: active
                        ? 'color-mix(in srgb, var(--color-rose-500) 18%, transparent)'
                        : 'var(--color-surface-700)',
                      color: active ? 'var(--color-rose-400)' : 'var(--color-text-muted)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '9999px',
                      minWidth: '18px',
                      textAlign: 'center',
                    }}>
                      {tab.badge}
                    </span>
                  )}
                  {tab.dot && (
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'var(--color-green-500)',
                      display: 'inline-block',
                      boxShadow: '0 0 6px var(--color-green-500)',
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {sidebarTab === 'chat' && (
              <ErrorBoundary compact label="Chat error">
                <ChatPanel
                  messages={messages}
                  typingUsers={typingUsers}
                  onSendMessage={sendMessage}
                  onTyping={sendTyping}
                />
              </ErrorBoundary>
            )}

            {sidebarTab === 'people' && (
              <div style={{ padding: '0.75rem', overflowY: 'auto', height: '100%' }}>
                <ErrorBoundary compact label="Participants error">
                  <ParticipantList
                    participants={participants}
                    hostId={host?.id}
                    currentUserId={user?.id}
                  />
                </ErrorBoundary>
              </div>
            )}

            {sidebarTab === 'call' && (
              <ErrorBoundary compact label="Video call error">
                <VideoCall
                  localStream={localStream}
                  remoteStreams={remoteStreams}
                  isCallActive={isCallActive}
                  isMuted={isMuted}
                  isCameraOff={isCameraOff}
                  onStartCall={startCall}
                  onEndCall={endCall}
                  onToggleMute={toggleMute}
                  onToggleCamera={toggleCamera}
                />
              </ErrorBoundary>
            )}
          </div>
        </aside>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <InviteModal
          roomCode={room?.room_code}
          onClose={() => setShowInvite(false)}
        />
      )}

      {/* Mobile: stack vertically, sidebar becomes full-width bottom panel */}
      <style>{`
        @media (max-width: 1023px) {
          .room-main {
            flex-direction: column !important;
            overflow-y: auto !important;
          }
          .room-sidebar {
            width: 100% !important;
            border-left: none !important;
            border-top: 1px solid color-mix(in srgb, white 5%, transparent) !important;
            height: 48vh !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
