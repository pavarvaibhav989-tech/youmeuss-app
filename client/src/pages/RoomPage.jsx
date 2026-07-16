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
    return <LoadingSpinner text="Joining room..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-900">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Room not found</h2>
        <p className="text-text-secondary text-sm">{error}</p>
        <a href="/" className="mt-6 px-6 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold
                               no-underline hover:opacity-90 transition-opacity">
          Go Home
        </a>
      </div>
    );
  }

  return (
    <div className="h-screen bg-surface-900 flex flex-col overflow-hidden">
      <Navbar />

      {/* Room Header */}
      <div className="pt-16 flex-shrink-0">
        <div className="px-4 py-3 border-b border-surface-400/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">
                Room:
              </span>
              <span className="text-sm font-mono tracking-wider text-brand-400 bg-surface-700 px-2.5 py-1 rounded-lg">
                {room?.room_code}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted">
              <div className="w-2 h-2 rounded-full bg-success" />
              {participants.filter(p => p.isOnline !== false).length} online
            </div>
          </div>

          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                       bg-surface-600 hover:bg-surface-500 text-text-primary
                       transition-all duration-200 cursor-pointer border border-surface-400/20"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Invite
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left: Video Area — scrollable internally */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex-1 overflow-y-auto p-4">
            {/* Video Player */}
            <div className="flex-shrink-0">
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
            </div>

            {/* Video Controls - only for host */}
            {isHost && (
              <div className="mt-4 space-y-3 flex-shrink-0">
                {/* URL Input */}
                <form onSubmit={handleLoadUrl} className="flex gap-2">
                  <input
                    ref={urlInputRef}
                    type="text"
                    defaultValue=""
                    placeholder="Paste video URL (YouTube, Vimeo, direct link...)"
                    className="flex-1 bg-surface-700 border border-surface-400/20 rounded-xl px-4 py-2.5
                               text-sm text-text-primary placeholder:text-text-muted
                               focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20
                               transition-all duration-200"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold
                               hover:opacity-90 transition-opacity cursor-pointer border-none whitespace-nowrap"
                  >
                    Load
                  </button>
                </form>

                {/* Upload */}
                <VideoUpload roomId={room?.id} onVideoLoaded={handleVideoUploaded} />
              </div>
            )}

            {/* Non-host sees host info */}
            {!isHost && !videoUrl && (
              <div className="mt-4 glass rounded-xl p-4 text-center">
                <p className="text-sm text-text-secondary">
                  Waiting for <span className="text-brand-400 font-medium">{host?.username}</span> to load a video...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="w-full lg:w-[380px] flex flex-col border-t lg:border-t-0 lg:border-l border-surface-400/10
                        bg-surface-800/50 min-h-0 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="flex border-b border-surface-400/10 px-2">
            {[
              { id: 'chat', label: '💬 Chat', count: messages.length },
              { id: 'people', label: '👥 People', count: participants.length },
              { id: 'call', label: '📹 Call', active: isCallActive },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSidebarTab(tab.id)}
                className={`flex-1 px-3 py-3 text-xs font-medium transition-all duration-200
                           border-b-2 cursor-pointer bg-transparent
                           ${sidebarTab === tab.id
                             ? 'border-brand-500 text-brand-400'
                             : 'border-transparent text-text-muted hover:text-text-secondary'
                           }`}
              >
                {tab.label}
                {tab.active && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-success inline-block" />
                )}
              </button>
            ))}
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {sidebarTab === 'chat' && (
              <ChatPanel
                messages={messages}
                typingUsers={typingUsers}
                onSendMessage={sendMessage}
                onTyping={sendTyping}
              />
            )}

            {sidebarTab === 'people' && (
              <div className="p-3 overflow-y-auto h-full">
                <ParticipantList
                  participants={participants}
                  hostId={host?.id}
                  currentUserId={user?.id}
                />
              </div>
            )}

            {sidebarTab === 'call' && (
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
    </div>
  );
}
