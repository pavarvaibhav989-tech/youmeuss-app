import { useEffect, useRef } from 'react';
import { VideoCamera, MicrophoneSlash, Microphone, VideoCameraSlash, PhoneDisconnect, PhoneCall } from '@phosphor-icons/react';

export default function VideoCall({
  localStream, remoteStreams, isCallActive,
  isMuted, isCameraOff,
  onStartCall, onEndCall, onToggleMute, onToggleCamera,
}) {
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  if (!isCallActive) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '1.25rem',
        padding: '1.5rem',
      }}>
        {/* Illustration */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-surface-800)',
          border: '1px solid color-mix(in srgb, white 6%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 1px 0 color-mix(in srgb, white 8%, transparent)',
        }}>
          <VideoCamera size={28} color="var(--color-text-muted)" weight="duotone" />
        </div>

        <div style={{ textAlign: 'center', gap: '0.375rem', display: 'flex', flexDirection: 'column' }}>
          <p style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.01em',
          }}>
            Start a video call
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Watch together, face to face
          </p>
        </div>

        <button
          onClick={onStartCall}
          className="btn-primary"
          style={{ gap: '0.5rem', padding: '0.625rem 1.5rem' }}
        >
          <PhoneCall size={15} weight="fill" />
          Join call
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      padding: '0.875rem',
      height: '100%',
    }}>
      {/* Video grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: remoteStreams.size > 0 ? '1fr 1fr' : '1fr',
        gap: '0.5rem',
        flex: 1,
      }}>
        {/* Local video */}
        <LocalVideo
          videoRef={localVideoRef}
          isCameraOff={isCameraOff}
          isMuted={isMuted}
          label="You"
        />

        {/* Remote videos */}
        {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
          <RemoteVideo key={userId} userId={userId} stream={stream} />
        ))}
      </div>

      {/* Controls bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.625rem',
        flexShrink: 0,
        padding: '0.25rem 0 0',
      }}>
        {/* Mic */}
        <CallControlBtn
          onClick={onToggleMute}
          active={!isMuted}
          danger={isMuted}
          label={isMuted ? 'Unmute' : 'Mute'}
          icon={isMuted
            ? <MicrophoneSlash size={16} weight="fill" />
            : <Microphone size={16} weight="fill" />
          }
        />

        {/* Camera */}
        <CallControlBtn
          onClick={onToggleCamera}
          active={!isCameraOff}
          danger={isCameraOff}
          label={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          icon={isCameraOff
            ? <VideoCameraSlash size={16} weight="fill" />
            : <VideoCamera size={16} weight="fill" />
          }
        />

        {/* End call — larger, red */}
        <button
          onClick={onEndCall}
          title="End call"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--color-red-500)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            transition: 'background 150ms, transform 150ms',
            boxShadow: '0 2px 8px color-mix(in srgb, var(--color-red-500) 35%, transparent)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--color-red-500)'}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <PhoneDisconnect size={18} weight="fill" />
        </button>
      </div>
    </div>
  );
}

function CallControlBtn({ onClick, danger, label, icon }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: danger
          ? 'color-mix(in srgb, var(--color-red-500) 15%, transparent)'
          : 'var(--color-surface-700)',
        border: '1px solid',
        borderColor: danger
          ? 'color-mix(in srgb, var(--color-red-500) 30%, transparent)'
          : 'color-mix(in srgb, white 8%, transparent)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: danger ? 'var(--color-red-500)' : 'var(--color-text-secondary)',
        transition: 'background 150ms, transform 150ms, color 150ms',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger
          ? 'color-mix(in srgb, var(--color-red-500) 22%, transparent)'
          : 'var(--color-surface-600)';
        e.currentTarget.style.color = danger ? 'var(--color-red-500)' : 'var(--color-text-primary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = danger
          ? 'color-mix(in srgb, var(--color-red-500) 15%, transparent)'
          : 'var(--color-surface-700)';
        e.currentTarget.style.color = danger ? 'var(--color-red-500)' : 'var(--color-text-secondary)';
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {icon}
    </button>
  );
}

function LocalVideo({ videoRef, isCameraOff, isMuted, label }) {
  return (
    <div style={{
      position: 'relative',
      aspectRatio: '16/9',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--color-surface-800)',
      border: '1px solid color-mix(in srgb, white 6%, transparent)',
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: isCameraOff ? 'none' : 'block',
        }}
      />
      {isCameraOff && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            background: 'linear-gradient(135deg, var(--color-rose-500), var(--color-rose-700))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 700,
          }}>
            Y
          </div>
        </div>
      )}
      {/* Name tag */}
      <div style={{
        position: 'absolute',
        bottom: '0.5rem',
        left: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        background: 'color-mix(in srgb, black 55%, transparent)',
        backdropFilter: 'blur(8px)',
        padding: '0.2rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.6875rem',
        color: 'white',
        fontWeight: 500,
      }}>
        {label}
        {isMuted && <MicrophoneSlash size={10} weight="fill" style={{ opacity: 0.8 }} />}
      </div>
    </div>
  );
}

function RemoteVideo({ userId, stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{
      position: 'relative',
      aspectRatio: '16/9',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--color-surface-800)',
      border: '1px solid color-mix(in srgb, white 6%, transparent)',
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div style={{
        position: 'absolute',
        bottom: '0.5rem',
        left: '0.5rem',
        background: 'color-mix(in srgb, black 55%, transparent)',
        backdropFilter: 'blur(8px)',
        padding: '0.2rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.6875rem',
        color: 'white',
        fontWeight: 500,
      }}>
        {userId.slice(0, 6)}
      </div>
    </div>
  );
}
