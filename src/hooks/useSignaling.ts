/**
 * src/hooks/useSignaling.ts
 *
 * Consumes the module-level socket singleton from src/lib/socketClient.ts.
 * This hook NEVER creates a new io() instance — it only:
 *   1. Calls socket.connect() when mounting into a room
 *   2. Emits room:join once per mount (guarded by joinedRef)
 *   3. Attaches/detaches event listeners in useEffect cleanup
 *   4. Calls socket.disconnect() only when the user leaves the room
 *
 * Because the underlying socket object is the same reference on every render,
 * Fast Refresh / StrictMode double-mounts cannot produce duplicate connections.
 */
import { useEffect, useRef, useState } from 'react';
import { signalingSocket } from '@/lib/socketClient';
import type { Socket } from 'socket.io-client';

// Track which room this tab's socket is currently joined to.
// Lives at module level so it survives React re-renders.
let _currentRoomId: string | null = null;

export function useSignaling(
  roomId: string,
  user: { handle: string; id: string },
  password?: string
) {
  // Expose the singleton directly — consumers (useWebRTC, StudioClient) get a
  // stable reference that never changes across re-renders.
  const [socket]      = useState<Socket>(() => signalingSocket);
  const [isConnected, setIsConnected] = useState(signalingSocket.connected);
  interface ChatMessage {
    senderId?: string;
    sender: { handle: string; id: string; initials?: string };
    text: string;
    time?: string;
  }
  const [messages,    setMessages]    = useState<ChatMessage[]>([]);

  // joinedRef prevents emitting room:join more than once per mount cycle,
  // even if connect fires twice (StrictMode) or the effect re-runs.
  const joinedRef = useRef(false);

  useEffect(() => {
    joinedRef.current = false;

    // ── Room switching — leave stale room before joining new one ───────────────
    if (_currentRoomId && _currentRoomId !== roomId && signalingSocket.connected) {
      console.log(
        `[useSignaling] 🔄 Room switch: ${_currentRoomId} → ${roomId}. Disconnecting stale connection.`
      );
      signalingSocket.disconnect();
      _currentRoomId = null;
    }

    // ── Event handlers ────────────────────────────────────────────────────────
    const onConnect = () => {
      console.log(`[useSignaling] ✅ CONNECTED: ${signalingSocket.id}`);
      setIsConnected(true);

      if (!joinedRef.current) {
        joinedRef.current  = true;
        _currentRoomId     = roomId;
        // 300 ms delay lets useWebRTC attach its peer:joined / peer:signal
        // listeners before room:join fires and existing peers are enumerated.
        setTimeout(() => {
          console.log(
            `[useSignaling] 🚪 room:join → roomId=${roomId} userId=${user.id}`
          );
          signalingSocket.emit('room:join', { roomId, user, password });
        }, 300);
      }
    };

    const onDisconnect = (reason: string) => {
      console.log(`[useSignaling] ⚠️ DISCONNECTED. Reason: ${reason}`);
      setIsConnected(false);
      joinedRef.current = false;
    };

    const onConnectError = (err: Error) => {
      console.error(`[useSignaling] ❌ CONNECT ERROR:`, err.message, (err as any).cause);
    };

    const onChatMessage = (message: { senderId?: string; sender: { handle: string; id: string; initials?: string }; text: string; time?: string }) => {
      setMessages(prev => [...prev, message]);
    };

    // ── Attach listeners ─────────────────────────────────────────────────────
    signalingSocket.on('connect',       onConnect);
    signalingSocket.on('disconnect',    onDisconnect);
    signalingSocket.on('connect_error', onConnectError);
    signalingSocket.on('chat-message',  onChatMessage);

    // ── Connect (no-op if already connected) ─────────────────────────────────
    if (signalingSocket.connected) {
      // Already connected from a previous room — trigger join immediately.
      onConnect();
    } else {
      signalingSocket.connect();
    }

    // ── Cleanup — detach listeners, disconnect, reset room state ──────────────
    return () => {
      signalingSocket.off('connect',       onConnect);
      signalingSocket.off('disconnect',    onDisconnect);
      signalingSocket.off('connect_error', onConnectError);
      signalingSocket.off('chat-message',  onChatMessage);

      // Fully disconnect when leaving a room so the next room gets a clean join.
      signalingSocket.disconnect();
      _currentRoomId    = null;
      joinedRef.current = false;
    };
  }, [roomId, user.id, password]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send room chat message ─────────────────────────────────────────────────
  const sendMessage = (text: string) => {
    if (isConnected) {
      signalingSocket.emit('chat-message', { roomId, message: text });
      setMessages(prev => [
        ...prev,
        {
          senderId: signalingSocket.id,
          sender:   user,
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  return { socket, isConnected, messages, sendMessage };
}
