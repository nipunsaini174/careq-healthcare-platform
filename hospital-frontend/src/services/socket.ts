import { io, Socket } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://127.0.0.1:5000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(URL, {
        transports: ['websocket', 'polling'],
        autoConnect: false, // Don't auto-connect endlessly if backend is offline
        reconnection: true,
        reconnectionAttempts: 3, // Cap attempts to 3
        reconnectionDelay: 2000,
      });

      this.socket.on('connect', () => {
        console.log('[Hospital] Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Hospital] Socket disconnected:', reason);
      });

      this.socket.on('connect_error', () => {
        // Silently handled when backend offline
      });
    }

    try {
      if (!this.socket.connected) {
        this.socket.connect();
      }
    } catch {
      // Ignored
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
