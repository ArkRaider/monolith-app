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

  useEffect(() => {
    let active = true;

    if (!socket || !localStream) return;

    console.log(`[useWebRTC] ✅ Initializing Native WebRTC with socket ${socket?.id || 'pre-connect'}`);

    const rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    function createPeerConnection(socketId: string, user: { handle: string; id: string; initials?: string }) {
      const pc = new RTCPeerConnection(rtcConfig);

      const peerObj: PeerObj = {
        peerID: socketId,
        pc,
        stream: null,
        user
      };

      peersRef.current = [...peersRef.current, peerObj];
      setPeers(peersRef.current);

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

        peersRef.current = peersRef.current.map(p =>
          p.peerID === socketId ? { ...p, stream: remoteStream } : p
        );
        setPeers(peersRef.current);
      };

      return pc;
    }

    socket.on('room:existing-peers', async (users: { socketId: string, user: { handle: string; id: string } }[]) => {
      if (!active) return;
      for (const { socketId, user } of users) {
        const pc = createPeerConnection(socketId, user);
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('peer:signal', { to: socketId, signalData: { type: 'offer', sdp: pc.localDescription } });
      }
    });

    socket.on('peer:joined', ({ socketId, user }) => {
      if (!active) return;
      const pc = createPeerConnection(socketId, user);
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
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
      setPeers(peersRef.current);
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
  }, [localStream]);

  return { peers };
}