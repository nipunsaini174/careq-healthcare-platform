export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthTokens {
  token: string;
  refreshToken?: string;
}

export type Theme = "light" | "dark" | "system";

export interface User {
  id: string | number;
  email: string;
  role: string;
  full_name?: string;
}

export interface Patient {
  patient_id?: string | number;
  full_name?: string;
  email?: string;
  phone?: string;
  dob?: string;
  abha_id?: string;
}

export interface Doctor {
  doctor_id?: string | number;
  full_name?: string;
  specialization?: string;
}

export interface Appointment {
  id: string | number;
  patient_id?: string | number;
  doctor_id?: string | number;
  appointment_date?: string;
  status?: string;
}

export type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface QueueToken {
  token_id?: string | number;
  status?: string;
}

export type QueueTokenStatus = "WAITING" | "CALLED" | "COMPLETED";
export type QueueStatus = "OPEN" | "CLOSED";

export interface Report {
  report_id?: string | number;
}
export type ReportType = "LAB" | "RADIOLOGY";
export type ReportStatus = "PENDING" | "READY";

export interface Notification {
  id?: string | number;
  message?: string;
}
export type NotificationType = "INFO" | "WARNING" | "ERROR";

// Frontend-only types
export interface NavItem {
  path: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterOption {
  value: string;
  label: string;
}
