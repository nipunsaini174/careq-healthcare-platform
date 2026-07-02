"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { Info, AlertTriangle, AlertCircle } from "lucide-react";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let socket: Socket | null = null;

export function NotificationListener() {
  useEffect(() => {
    // Connect to the backend Socket.io
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("Connected to notification server");
      // Join the global patients room to receive broadcasts
      socket?.emit("join_patient_room");
    });

    // Listen for broadcast events
    socket.on("broadcast_notification", (data: { title: string; message: string; type: string }) => {
      
      const type = data.type || "Info";
      
      const renderIcon = () => {
        if (type === "Warning") return <AlertTriangle className="w-5 h-5 text-orange-500" />;
        if (type === "Emergency") return <AlertCircle className="w-5 h-5 text-red-500" />;
        return <Info className="w-5 h-5 text-blue-500" />;
      };

      // Use sonner to display a customized rich toast
      toast.custom((t) => (
        <div className={`p-4 rounded-xl border w-full flex items-start gap-3 bg-white shadow-lg
          ${type === "Warning" ? "border-orange-200" : type === "Emergency" ? "border-red-200" : "border-blue-200"}
        `}>
          <div className="mt-0.5">{renderIcon()}</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm">{data.title}</h3>
            <p className="text-gray-600 text-sm mt-1 leading-relaxed">{data.message}</p>
          </div>
        </div>
      ), {
        duration: type === "Emergency" ? 10000 : 5000, // Show longer for emergency
        position: "top-center"
      });
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  // This component doesn't render anything visible directly
  return null;
}
