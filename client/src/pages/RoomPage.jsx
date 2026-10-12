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
import { Chat, Users, VideoCamera, UserPlus, HourglassMedium, House } from '@phosphor-icons/react';

export default function RoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);
  const urlInputRef = useRef(null);
  const [sidebarTab, setSidebarTab] = useState('chat'); // 'chat' | 'people' | 'call'

  // Connect socket and join room
  useSocket(roomId);

  // Room data
  const { room, participants, host, loading, error } = useRoom(roomId);

  const isHost = host?.id === user?.id;

  // Video sync
  const {
    videoUrl,
    isPlaying,
    currentTime,
    isSyncing,
    loadVideo,
    play,
    pause,
    seek,
  } = useVideoSync(roomId, isHost);

  // Chat
  const { messages, typingUsers, sendMessage, sendTyping } = useChat(roomId);

  // WebRTC
  const {
    localStream,
    remoteStreams,
    isCallActive,
    isMuted,
    isCameraOff,
    startCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useWebRTC(roomId, user?.id);

  const handleLoadUrl = (e) => {
    e.preventDefault();
    // Read directly from the DOM ref so it works even if onChange didn't fire
    const val = (urlInputRef.current?.value || '').trim();
    if (val) {
      loadVideo(val);
      if (urlInputRef.current) urlInputRef.current.value = '';
    }
  };

  const handleVideoUploaded = (url) => {
    loadVideo(url);
  };

  // Expose loadVideo globally for debugging/testing
  useEffect(() => {
    window.__loadVideo = loadVideo;
    return () => { delete window.__loadVideo; };
  }, [loadVideo]);

  if (loading) {
    return <LoadingSpinner text="Joining room…" />;
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-surface-950)',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'var(--color-surface-800)',
            border: '1px solid color-mix(in srgb, white 6%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <House size={24} color="var(--color-text-muted)" />
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-sans)', fontSize: '1.125rem', fontWeight: 700,
            letterSpacing: '-0.025em', color: 'var(--color-text-primary)',
          }}
        >
          Room not found
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{error}</p>
        <a
          href="/"
          className="btn-primary"
          style={{ textDecoration: 'none', marginTop: '0.5rem' }}
        >
          Go home
        </a>
      </div>
    );
  }

  return (
    <div className="h-screen bg-surface-900 flex flex-col overflow-hidden">
      <Navbar />

      {/* Room Header */}
      <div style={{ paddingTop: '64px', flexShrink: 0 }}>
        <div
          style={{
            padding: '0.625rem 1rem',
            borderBottom: '1px solid color-mix(in srgb, white 5%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'color-mix(in srgb, var(--color-surface-900) 80%, transparent)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="room-code">{room?.room_code}</span>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                fontSize: '0.75rem', color: 'var(--color-text-muted)',
              }}
            >
              <div className="status-dot" style={{ width: '6px', height: '6px' }} />
              {participants.filter(p => p.isOnline !== false).length} online
            </div>
          </div>

          <button
            onClick={() => setShowInvite(true)}
            className="btn-ghost"
            style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem', gap: '0.375rem' }}
          >
            <UserPlus size={13} weight="bold" />
            Invite
          </button>
        </div>
      </div>

      {/* Main Content — on mobile: video on top, sidebar fixed height below */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left: Video Area */}
        <div className="flex flex-col min-w-0 overflow-y-auto
                        h-auto lg:flex-1 lg:min-h-0">
          <div className="p-3 sm:p-4 space-y-3">

            {/* Video Controls — host only, above player */}
            {isHost && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                <form onSubmit={handleLoadUrl} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    ref={urlInputRef}
                    type="text"
                    defaultValue=""
                    placeholder="Paste YouTube or video URL…"
                    className="input-base"
                    style={{ flex: 1, minWidth: 0, padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flexShrink: 0, padding: '0.625rem 1.125rem', fontSize: '0.8125rem' }}
                  >
                    Load
                  </button>
                </form>
                <VideoUpload roomId={room?.id} onVideoLoaded={handleVideoUploaded} />
              </div>
            )}

            {/* Non-host waiting state */}
            {!isHost && !videoUrl && (
              <div
                className="glass"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.875rem 1rem',
                  textAlign: 'center',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <HourglassMedium size={14} color="var(--color-text-muted)" />
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Waiting for{' '}
                  <span style={{ color: 'var(--color-rose-400)', fontWeight: 600 }}>
                    {host?.username}
                  </span>{' '}
                  to load a video
                </p>
              </div>
            )}

            {/* Video Player — isolated boundary so a player crash doesn't eject the user */}
            <div className="flex-shrink-0">
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
        </div>

        {/* Right/Bottom: Sidebar */}
        <div
          style={{
            height: 'clamp(45vh, 45vh, 45vh)',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid color-mix(in srgb, white 5%, transparent)',
            background: 'color-mix(in srgb, var(--color-surface-900) 60%, transparent)',
            flexShrink: 0,
            overflow: 'hidden',
          }}
          className="lg-sidebar"
        >
          {/* Sidebar Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid color-mix(in srgb, white 5%, transparent)',
              padding: '0 0.5rem',
              flexShrink: 0,
            }}
          >
            {[
              { id: 'chat',   Icon: Chat,        label: 'Chat',   extra: messages.length > 0 ? messages.length : null },
              { id: 'people', Icon: Users,       label: 'People', extra: participants.length },
              { id: 'call',   Icon: VideoCamera, label: 'Call',   dot: isCallActive },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSidebarTab(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                  background: 'none',
                  border: 'none',
                  borderBottom: '2px solid',
                  borderColor: sidebarTab === tab.id
                    ? 'var(--color-rose-500)'
                    : 'transparent',
                  color: sidebarTab === tab.id
                    ? 'var(--color-rose-400)'
                    : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  transition: 'color 150ms, border-color 150ms',
                  whiteSpace: 'nowrap',
                }}
              >
                <tab.Icon size={13} weight={sidebarTab === tab.id ? 'fill' : 'regular'} />
                {tab.label}
                {tab.extra !== null && tab.extra !== undefined && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.625rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {tab.extra}
                  </span>
                )}
                {tab.dot && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--color-green-500)',
                      display: 'inline-block',
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Sidebar Content — each tab isolated so one crash doesn't break the others */}
          <div className="flex-1 min-h-0 overflow-hidden">
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
              <div className="p-3 overflow-y-auto h-full">
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
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal
          roomCode={room?.room_code}
          onClose={() => setShowInvite(false)}
        />
      )}

      {/* Responsive: sidebar goes full-width on desktop */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar {
            height: auto !important;
            width: 360px !important;
            border-top: none !important;
            border-left: 1px solid color-mix(in srgb, white 5%, transparent) !important;
          }
        }
      `}</style>
    </div>
  );
}
