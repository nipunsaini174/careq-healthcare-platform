"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket, disconnectSocket } from "@/services/socket";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketClient = getSocket();
    setSocket(socketClient);

    if (!socketClient) return;

    const onConnect = () => {
      console.log("Socket.io connection established.");
      setConnected(true);
    };

    const onDisconnect = () => {
      console.log("Socket.io connection disconnected.");
      setConnected(false);
    };

    socketClient.on("connect", onConnect);
    socketClient.on("disconnect", onDisconnect);

    // Set initial connection status if already connected
    if (socketClient.connected) {
      setConnected(true);
    }

    return () => {
      socketClient.off("connect", onConnect);
      socketClient.off("disconnect", onDisconnect);
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
