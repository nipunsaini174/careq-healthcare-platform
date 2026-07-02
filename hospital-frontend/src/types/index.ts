export interface Doctor {
  id: string;
  name: string;
  dept: string;
  qualification: string;
  experience: number;
  patients: number;
  delay: number;
  status: "Active" | "Busy" | "Offline";
  rating: number;
  phone: string;
  email: string;
  schedule: string;
  opd: string;
  bio?: string;
  education?: string[];
  publications?: string[];
  achievements?: string[];
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  blood: string;
  dept: string;
  doctor: string;
  status: "Admitted" | "OPD" | "Discharged";
  phone: string;
  email: string;
  address: string;
  admitted: string; // ISO date string
  condition: "Stable" | "Good" | "Critical" | "Recovered";
}

export interface Appointment {
  id: string;
  patient: string;
  doctor: string;
  dept: string;
  date: string;
  time: string;
  type: string;
  status: "Confirmed" | "In Progress" | "Waiting" | "Completed" | "No Show";
  duration: string;
}

export interface LabTest {
  id: string;
  patient: string;
  doctor: string;
  test: string;
  priority: "Routine" | "Urgent" | "Emergency";
  collected: string;
  status: "Completed" | "In Progress" | "Pending";
  result: "Normal" | "Abnormal" | "Positive" | "—";
  turnaround: string;
}

export interface Invoice {
  id: string;
  patient: string;
  dept: string;
  services: string[];
  amount: number;
  paid: number;
  status: "Paid" | "Partial" | "Pending";
  date: string;
  method: "Card" | "Insurance" | "Cash" | "UPI" | "—";
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string; // "PPE" | "Consumables" | "Equipment" | "Surgical" | "Pharmacy - Analgesic", etc.
  stock: number;
  unit: string;
  threshold: number;
  cost: number;
  supplier: string;
  lastOrdered: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

export interface Prescription {
  id: string;
  patient: string;
  doctor: string;
  medicines: string[];
  issued: string;
  status: "Dispensed" | "Processing" | "Pending";
  priority: "Normal" | "Urgent" | "Emergency";
}

export interface Notification {
  id: number;
  type: "emergency" | "inventory" | "queue" | "patient" | "billing" | "doctor" | "lab" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface Queue {
  id: string;
  label: string;
  waiting: number;
  max: number;
  color: string;
  status: "Active" | "Paused" | "Closed";
}

export interface Receptionist {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Offline";
  shift_start: string;
  shift_end: string;
}
