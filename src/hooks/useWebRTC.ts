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

  // Keep stable ref
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Sync tracks dynamically
  useEffect(() => {
    if (!localStream) return;
    peersRef.current.forEach(peer => {
      const senders = peer.pc.getSenders();
      localStream.getTracks().forEach(track => {
        const sender = senders.find(s => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          try { peer.pc.addTrack(track, localStream); } catch (e) {}
        }
      });
    });
  }, [localStream]);

  useEffect(() => {
    let active = true;
    if (!socket) return;
    
    // Polite peer mechanism setup
    // We determine politeness based on socket ID comparison
    const rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    function createPeerConnection(socketId: string, user: { handle: string; id: string; initials?: string }, polite: boolean) {
      const existingIdx = peersRef.current.findIndex(p => p.peerID === socketId);
      if (existingIdx !== -1) {
        peersRef.current[existingIdx].pc.close();
        peersRef.current.splice(existingIdx, 1);
      }

      const pc = new RTCPeerConnection(rtcConfig);
      const remoteStream = new MediaStream();
      let makingOffer = false;
      let ignoreOffer = false;

      const peerObj: PeerObj = {
        peerID: socketId,
        pc,
        stream: remoteStream,
        user
      };

      peersRef.current = [...peersRef.current, peerObj];
      setPeers([...peersRef.current]);

      // Add transceivers explicitly to guarantee both audio and video m-lines
      pc.addTransceiver('audio', { direction: 'sendrecv' });
      pc.addTransceiver('video', { direction: 'sendrecv' });

      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const senders = pc.getSenders();
        if (audioTrack) {
          const s = senders.find(s => s.track?.kind === 'audio' || s.receiver?.track?.kind === 'audio');
          if (s) s.replaceTrack(audioTrack);
        }
        if (videoTrack) {
          const s = senders.find(s => s.track?.kind === 'video' || s.receiver?.track?.kind === 'video');
          if (s) s.replaceTrack(videoTrack);
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && active) {
          socket?.emit('peer:signal', { to: socketId, signalData: { candidate: event.candidate } });
        }
      };

      pc.ontrack = (event) => {
        if (!active) return;
        if (!remoteStream.getTracks().includes(event.track)) {
          remoteStream.addTrack(event.track);
        }
        setPeers([...peersRef.current]);
      };

      pc.onnegotiationneeded = async () => {
        if (!active) return;
        try {
          makingOffer = true;
          await pc.setLocalDescription();
          socket?.emit('peer:signal', { to: socketId, signalData: { type: 'offer', sdp: pc.localDescription } });
        } catch (err) {
          console.error('[useWebRTC] Negotiation error', err);
        } finally {
          makingOffer = false;
        }
      };

      // Expose state for signal handling
      return { pc, polite, getMakingOffer: () => makingOffer, setIgnoreOffer: (v: boolean) => ignoreOffer = v, getIgnoreOffer: () => ignoreOffer };
    }

    // Keep track of PC metadata
    const pcMeta: Record<string, ReturnType<typeof createPeerConnection>> = {};

    socket.on('room:existing-peers', (users: { socketId: string, user: { handle: string; id: string } }[]) => {
      if (!active) return;
      for (const { socketId, user } of users) {
        // We are joining, existing peers are polite
        const polite = false; 
        pcMeta[socketId] = createPeerConnection(socketId, user, polite);
      }
    });

    socket.on('peer:joined', ({ socketId, user }) => {
      if (!active) return;
      // Someone joined our room, we are polite to them
      const polite = true;
      pcMeta[socketId] = createPeerConnection(socketId, user, polite);
    });

    socket.on('peer:signal', async ({ from, signalData }) => {
      if (!active) return;
      const meta = pcMeta[from];
      if (!meta) return;
      
      const { pc, polite, getMakingOffer, setIgnoreOffer, getIgnoreOffer } = meta;

      try {
        if (signalData.type === 'offer' || signalData.type === 'answer') {
          const offerCollision = signalData.type === 'offer' && (getMakingOffer() || pc.signalingState !== 'stable');
          
          setIgnoreOffer(!polite && offerCollision);
          if (getIgnoreOffer()) return;

          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
          if (signalData.type === 'offer') {
            await pc.setLocalDescription();
            socket.emit('peer:signal', { to: from, signalData: { type: 'answer', sdp: pc.localDescription } });
          }
        } else if (signalData.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
          } catch (e) {
            if (!getIgnoreOffer()) console.error('[useWebRTC] ICE candidate error', e);
          }
        }
      } catch (err) {
        console.error(`[useWebRTC] Signal error:`, err);
      }
    });

    socket.on('peer:left', (socketId: string) => {
      if (!active) return;
      const peerObj = peersRef.current.find(p => p.peerID === socketId);
      if (peerObj) {
        peerObj.pc.getTransceivers().forEach(t => t.stop?.());
        peerObj.pc.close();
      }
      peersRef.current = peersRef.current.filter(p => p.peerID !== socketId);
      setPeers([...peersRef.current]);
      delete pcMeta[socketId];
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
  }, []);

  return { peers };
}