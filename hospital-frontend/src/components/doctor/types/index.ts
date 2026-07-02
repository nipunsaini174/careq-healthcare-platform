export interface ConsultationHistory {
  id: string;
  patientId: string;
  date: string;
  diagnosis: string;
  note: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  weight: string;
  phone: string;
  email: string;
  avatar: string;
  visitType: string;
  waitTime: string;
  waitTimeMinutes: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'NEXT' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';
  reasonForVisit: string;
  alerts: string; // Comma separated
  history: ConsultationHistory[];
}

export interface Doctor {
  id: string;
  name: string;
  credentials: string;
  department: string;
  room: string;
  focus: string;
  bio: string;
  awards: string;
  theme: string;
  clinicStatus: 'AVAILABLE' | 'BREAK' | 'EMERGENCY';
}
