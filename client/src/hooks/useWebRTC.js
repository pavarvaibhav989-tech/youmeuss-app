import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../lib/socket';

// ICE servers: STUN for local/same-network + TURN for cross-network calls
// OpenRelay is a free public TURN server — works well for production use
const ICE_SERVERS = {
  iceServers: [
    // STUN servers (fast, no relay)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    // TURN servers (relay — works across all network types)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};

/**
 * Hook for WebRTC video/voice calling.
 * Manages peer connections, media streams, and signaling.
 */
export function useWebRTC(roomId, userId) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const peerConnections = useRef(new Map());
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const handleWebRTCJoin = async ({ userId: remoteUserId, username }) => {
      if (!localStreamRef.current) return;
      await createPeerConnection(remoteUserId, true);
    };

    const handleOffer = async ({ userId: remoteUserId, offer }) => {
      if (!localStreamRef.current) return;
      const pc = await createPeerConnection(remoteUserId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('WEBRTC_ANSWER', {
        roomId,
        targetUserId: remoteUserId,
        answer,
      });
    };

    const handleAnswer = async ({ userId: remoteUserId, answer }) => {
      const pc = peerConnections.current.get(remoteUserId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIce = async ({ userId: remoteUserId, candidate }) => {
      const pc = peerConnections.current.get(remoteUserId);
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleWebRTCLeave = ({ userId: remoteUserId }) => {
      closePeerConnection(remoteUserId);
    };

    socket.on('WEBRTC_JOIN', handleWebRTCJoin);
    socket.on('WEBRTC_OFFER', handleOffer);
    socket.on('WEBRTC_ANSWER', handleAnswer);
    socket.on('WEBRTC_ICE', handleIce);
    socket.on('WEBRTC_LEAVE', handleWebRTCLeave);

    return () => {
      socket.off('WEBRTC_JOIN', handleWebRTCJoin);
      socket.off('WEBRTC_OFFER', handleOffer);
      socket.off('WEBRTC_ANSWER', handleAnswer);
      socket.off('WEBRTC_ICE', handleIce);
      socket.off('WEBRTC_LEAVE', handleWebRTCLeave);
    };
  }, [roomId]);

  const createPeerConnection = useCallback(async (remoteUserId, createOffer) => {
    // Don't create duplicate connections
    if (peerConnections.current.has(remoteUserId)) {
      return peerConnections.current.get(remoteUserId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(remoteUserId, pc);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('WEBRTC_ICE', {
          roomId,
          targetUserId: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(remoteUserId, remoteStream);
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        closePeerConnection(remoteUserId);
      }
    };

    // Create and send offer if we're the initiator
    if (createOffer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit('WEBRTC_OFFER', {
        roomId,
        targetUserId: remoteUserId,
        offer,
      });
    }

    return pc;
  }, [roomId]);

  const closePeerConnection = useCallback((remoteUserId) => {
    const pc = peerConnections.current.get(remoteUserId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(remoteUserId);
    }
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(remoteUserId);
      return next;
    });
  }, []);

  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsCallActive(true);

      // Notify others in the room
      socketRef.current?.emit('WEBRTC_JOIN', { roomId });
    } catch (err) {
      console.error('Failed to access media devices:', err);
      // Try audio-only
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsCallActive(true);
        setIsCameraOff(true);

        socketRef.current?.emit('WEBRTC_JOIN', { roomId });
      } catch (audioErr) {
        console.error('Failed to access audio:', audioErr);
      }
    }
  }, [roomId]);

  const endCall = useCallback(() => {
    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close all peer connections
    peerConnections.current.forEach((pc, id) => {
      pc.close();
    });
    peerConnections.current.clear();

    setLocalStream(null);
    setRemoteStreams(new Map());
    setIsCallActive(false);
    setIsMuted(false);
    setIsCameraOff(false);

    socketRef.current?.emit('WEBRTC_LEAVE', { roomId });
  }, [roomId]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      peerConnections.current.forEach((pc) => pc.close());
    };
  }, []);

  return {
    localStream,
    remoteStreams,
    isCallActive,
    isMuted,
    isCameraOff,
    startCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}

export default useWebRTC;
