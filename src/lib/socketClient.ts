/**
 * src/lib/socketClient.ts
 *
 * Module-level Socket.io singleton — initialized ONCE per browser JS context.
 *
 * Why this works:
 * - Next.js Fast Refresh re-executes React component functions and hooks on
 * every file save, but module-level code in a separate file is NOT re-executed
 * during HMR unless the file itself changes.
 * - autoConnect: false means the socket only connects when .connect() is
 * explicitly called by useSignaling — giving full lifecycle control to the hook.
 * - A single export means every import receives the exact same Socket instance,
 * making ghost duplicates structurally impossible from the client side.
 */
import { io, Socket } from 'socket.io-client';

const SIGNALING_URL = process.env.NEXT_PUBLIC_SIGNALING_URL || 'https://monolith-signaling-server.onrender.com';

// The singleton — created exactly once when this module is first imported.
// Subsequent imports return the cached module, not a new socket.
export const signalingSocket: Socket = io(SIGNALING_URL, {
  autoConnect: false,          // Never connects until .connect() is called explicitly
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});