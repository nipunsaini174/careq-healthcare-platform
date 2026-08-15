"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

/**
 * Payload broadcast by the backend whenever a doctor row mutates.
 * `doctor_created` and `doctor_updated` carry the full DoctorDto so
 * receivers can replace state without an extra fetch. `doctor_deleted`
 * carries only the id + scope so receivers can drop the row locally.
 */
export interface DirectoryDoctorPayload {
  id: string;
  name: string;
  dept: string;
  hospitalId: string;
  departmentId: string;
  specialization: string;
  focus: string;
  qualification: string;
  experience: number;
  phone: string;
  email: string;
  opd: string;
  schedule: string;
  bio: string;
  status: string;
  rating: number;
}

export interface DirectoryDoctorDeleted {
  id: string;
  hospitalId: string | null;
  departmentId: string | null;
}

export interface DirectoryDepartmentPayload {
  hospital_id: string;
  department: {
    department_id: string;
    department_name: string;
    location: string;
    daily_capacity: number;
  };
}

export interface DirectoryDepartmentDeleted {
  hospital_id: string;
  department_id: string;
}

export interface ServerToClientEvents {
  queue_updated: (data: any) => void;
  appointment_updated: (data: any) => void;
  appointment_created: (data: any) => void;
  consultation_completed: (data: any) => void;
  appointment_cancelled: (data: any) => void;
  broadcast_notification: (data: any) => void;
  "notification:new": (data: any) => void;
  // Directory mutations broadcast from the hospital app — patients use
  // them to live-refresh the Book Appointment screen.
  doctor_created: (data: DirectoryDoctorPayload) => void;
  doctor_updated: (data: DirectoryDoctorPayload) => void;
  doctor_deleted: (data: DirectoryDoctorDeleted) => void;
  department_created: (data: DirectoryDepartmentPayload) => void;
  department_deleted: (data: DirectoryDepartmentDeleted) => void;
}

export interface ClientToServerEvents {
  "queue:subscribe": (data: { tokenId: string }) => void;
  "dashboard:subscribe": (data: { patientId: string }) => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "http://localhost:5000";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketInstance: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socketInstance) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("healthflow-access-token")
        : null;

    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: false,
      auth: token ? { token } : {},
    });
  }
  return socketInstance;
}

export function connectSocket() {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function disconnectSocket() {
  if (socketInstance?.connected) {
    socketInstance.disconnect();
  }
}

// ---- Hook: Queue Updates ----
export function useQueueSocket(
  tokenId: string | null,
  onUpdate: (data: Parameters<ServerToClientEvents["queue_updated"]>[0]) => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!tokenId) return;

    const socket = connectSocket();

    socket.emit("queue:subscribe", { tokenId });

    const handler = (data: Parameters<ServerToClientEvents["queue_updated"]>[0]) => {
      onUpdateRef.current(data);
    };

    socket.on("queue_updated", handler);

    return () => {
      socket.off("queue_updated", handler);
    };
  }, [tokenId]);
}

// ---- Hook: Notification Socket ----
export function useNotificationSocket(
  patientId: string | null,
  onNew: (data: Parameters<ServerToClientEvents["notification:new"]>[0]) => void
) {
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;

  useEffect(() => {
    if (!patientId) return;

    const socket = connectSocket();

    socket.emit("dashboard:subscribe", { patientId });

    const handler = (data: Parameters<ServerToClientEvents["notification:new"]>[0]) => {
      onNewRef.current(data);
    };

    socket.on("notification:new", handler);

    return () => {
      socket.off("notification:new", handler);
    };
  }, [patientId]);
}

// ---- Hook: Directory Socket (doctors + departments) ----
//
// One mount-time subscription used by the Book Appointment page so it
// can live-update the doctor list and the hospital→departments map.
// Handlers are stored in refs and read fresh on every event so callers
// can pass inline closures without churning the listeners.
export function useDirectorySocket(handlers: {
  onDoctorCreated?: (doctor: DirectoryDoctorPayload) => void;
  onDoctorUpdated?: (doctor: DirectoryDoctorPayload) => void;
  onDoctorDeleted?: (deleted: DirectoryDoctorDeleted) => void;
  onDepartmentCreated?: (event: DirectoryDepartmentPayload) => void;
  onDepartmentDeleted?: (event: DirectoryDepartmentDeleted) => void;
}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = connectSocket();

    const onDC = (d: DirectoryDoctorPayload) => handlersRef.current.onDoctorCreated?.(d);
    const onDU = (d: DirectoryDoctorPayload) => handlersRef.current.onDoctorUpdated?.(d);
    const onDD = (d: DirectoryDoctorDeleted) => handlersRef.current.onDoctorDeleted?.(d);
    const onDeptC = (d: DirectoryDepartmentPayload) => handlersRef.current.onDepartmentCreated?.(d);
    const onDeptD = (d: DirectoryDepartmentDeleted) => handlersRef.current.onDepartmentDeleted?.(d);

    socket.on("doctor_created", onDC);
    socket.on("doctor_updated", onDU);
    socket.on("doctor_deleted", onDD);
    socket.on("department_created", onDeptC);
    socket.on("department_deleted", onDeptD);

    return () => {
      socket.off("doctor_created", onDC);
      socket.off("doctor_updated", onDU);
      socket.off("doctor_deleted", onDD);
      socket.off("department_created", onDeptC);
      socket.off("department_deleted", onDeptD);
    };
  }, []);
}
