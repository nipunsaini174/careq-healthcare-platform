import { io, Socket } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://127.0.0.1:5000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(URL, {
        transports: ['websocket', 'polling'], // polling as fallback
        autoConnect: true,
        // ── Reconnection — without these, a network blip kills all live
        // updates silently until the receptionist manually refreshes ──────
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,       // 1 s first retry
        reconnectionDelayMax: 10000,   // cap at 10 s
        randomizationFactor: 0.3,      // jitter to avoid thundering-herd
      });

      this.socket.on('connect', () => {
        console.log('[Hospital] Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Hospital] Socket disconnected:', reason);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[Hospital] Socket connect error:', err.message);
      });

      // Re-join the receptionist room after every reconnect so events
      // keep flowing even if the server restarted and cleared the room.
      this.socket.on('reconnect', () => {
        console.log('[Hospital] Socket reconnected — rejoining rooms');
        // The SocketContext will call joinRoom after re-auth; we just
        // log here so it's easy to trace in the network tab.
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();

export const getSocket = () => {
  if (!socketService.getSocket()) {
    socketService.connect();
  }
  return socketService.getSocket();
};

export const disconnectSocket = () => {
  socketService.disconnect();
};

