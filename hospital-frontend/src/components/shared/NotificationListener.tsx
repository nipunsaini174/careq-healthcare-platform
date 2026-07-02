"use client";

import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Info, AlertTriangle, AlertCircle } from "lucide-react";

export function NotificationListener() {
  const { socket, connected } = useSocket();
  const pathname = usePathname();

  useEffect(() => {
    if (!socket || !connected) return;

    // Join room based on role route
    if (pathname.includes("/dashboard/doctor")) {
      socket.emit("join_doctor_room");
    } else if (pathname.includes("/dashboard/receptionist")) {
      socket.emit("join_receptionist_room");
    } else if (pathname.includes("/dashboard/admin")) {
       // Admin could also optionally listen to something, but not required 
       // unless they want to see broadcasts targeted to 'ALL'
       // We'll emit join_admin_room just in case we add it later
       socket.emit("join_admin_room");
    }

    const handleBroadcast = (data: { title: string; message: string; type: string }) => {
      const type = data.type || "Info";
      
      const renderIcon = () => {
        if (type === "Warning") return <AlertTriangle className="w-5 h-5 text-orange-500" />;
        if (type === "Emergency") return <AlertCircle className="w-5 h-5 text-red-500" />;
        return <Info className="w-5 h-5 text-blue-500" />;
      };

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
        duration: type === "Emergency" ? 10000 : 5000,
        position: "top-center"
      });
    };

    socket.on("broadcast_notification", handleBroadcast);

    return () => {
      socket.off("broadcast_notification", handleBroadcast);
    };
  }, [socket, connected, pathname]);

  return null;
}
