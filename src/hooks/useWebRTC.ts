import { useEffect, useState, useRef } from 'react';
import { signalingSocket as socket } from '@/lib/socketClient';

export interface PeerObj {
  peerID: string;
  pc: RTCPeerConnection;
  stream: MediaStream | null;
  user: { handle: string; id: string; initials?: string };
}

export function useWebRTC(localStream: MediaStream | null) {
  const [peers, setPeers] = useState<PeerObj[]>([]);
  const peersRef = useRef<PeerObj[]>([]);
  const localStreamRef = useRef(localStream);

  // Keep a stable ref to the latest localStream so connection closures don't trigger re-runs
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Sync latest localStream tracks to all existing peer connections
  useEffect(() => {
    if (!localStream) return;
    
    const audioTrack = localStream.getAudioTracks()[0];
    const videoTrack = localStream.getVideoTracks()[0];
    
    peersRef.current.forEach(peer => {
      peer.pc.getTransceivers().forEach(t => {
        if (t.receiver.track.kind === 'audio' && audioTrack) {
          t.sender.replaceTrack(audioTrack);
        }
        if (t.receiver.track.kind === 'video' && videoTrack) {
          t.sender.replaceTrack(videoTrack);
        }
      });
    });
  }, [localStream]);

  useEffect(() => {
    let active = true;

    if (!socket) return;

    console.log(`[useWebRTC] ✅ Initializing Native WebRTC with socket ${socket?.id || 'pre-connect'}`);

    const rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    function createPeerConnection(socketId: string, user: { handle: string; id: string; initials?: string }) {
      const existingIdx = peersRef.current.findIndex(p => p.peerID === socketId);
      if (existingIdx !== -1) {
        peersRef.current[existingIdx].pc.close();
        peersRef.current.splice(existingIdx, 1);
      }

      const pc = new RTCPeerConnection(rtcConfig);

      // Always add transceivers so renegotiation isn't needed when we add tracks later
      const audioTransceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
      const videoTransceiver = pc.addTransceiver('video', { direction: 'sendrecv' });

      // Attach tracks immediately if we have them
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) audioTransceiver.sender.replaceTrack(audioTrack);
        
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) videoTransceiver.sender.replaceTrack(videoTrack);
      }

      const peerObj: PeerObj = {
        peerID: socketId,
        pc,
        stream: null,
        user
      };

      peersRef.current = [...peersRef.current, peerObj];
      setPeers([...peersRef.current]);

      pc.onicecandidate = (event) => {
        if (event.candidate && active) {
          socket?.emit('peer:signal', {
            to: socketId,
            signalData: { candidate: event.candidate }
          });
        }
      };

      pc.ontrack = (event) => {
        if (!active) return;
        const [remoteStream] = event.streams;
        
        // Only update if we actually got a stream (transceivers without tracks might fire ontrack without streams in some edge cases)
        if (remoteStream) {
          peersRef.current = peersRef.current.map(p =>
            p.peerID === socketId ? { ...p, stream: remoteStream } : p
          );
          setPeers([...peersRef.current]);
        }
      };

      return pc;
    }

    socket.on('room:existing-peers', async (users: { socketId: string, user: { handle: string; id: string } }[]) => {
      if (!active) return;
      for (const { socketId, user } of users) {
        const pc = createPeerConnection(socketId, user);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('peer:signal', { to: socketId, signalData: { type: 'offer', sdp: pc.localDescription } });
      }
    });

    socket.on('peer:joined', ({ socketId, user }) => {
      if (!active) return;
      createPeerConnection(socketId, user);
    });

    socket.on('peer:signal', async ({ from, signalData }) => {
      if (!active) return;
      const peerObj = peersRef.current.find(p => p.peerID === from);
      if (!peerObj) return;

      try {
        if (signalData.type === 'offer') {
          await peerObj.pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
          const answer = await peerObj.pc.createAnswer();
          await peerObj.pc.setLocalDescription(answer);
          socket.emit('peer:signal', { to: from, signalData: { type: 'answer', sdp: peerObj.pc.localDescription } });
        } else if (signalData.type === 'answer') {
          await peerObj.pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
        } else if (signalData.candidate) {
          await peerObj.pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        }
      } catch (err) {
        console.error(`[useWebRTC] Signal error:`, err);
      }
    });

    socket.on('peer:left', (socketId: string) => {
      if (!active) return;
      // Find and destroy
      const peerObj = peersRef.current.find(p => p.peerID === socketId);
      if (peerObj) {
        peerObj.pc.getTransceivers().forEach(t => t.stop?.());
        peerObj.pc.close();
      }
      // Update refs and state
      peersRef.current = peersRef.current.filter(p => p.peerID !== socketId);
      setPeers([...peersRef.current]);
    });

    return () => {
      active = false;
      socket.off('room:existing-peers');
      socket.off('peer:joined');
      socket.off('peer:signal');
      socket.off('peer:left');
      peersRef.current.forEach(p => p.pc.close());
      peersRef.current = [];
      setPeers([]);
    };
  }, []); // Run only once on mount, DO NOT depend on localStream

  return { peers };
}