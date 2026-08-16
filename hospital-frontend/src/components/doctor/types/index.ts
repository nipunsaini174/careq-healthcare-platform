export interface ConsultationHistory {
  id: string;
  patientId: string;
  date: string;
  diagnosis: string;
  note: string;
}

export interface Patient {
  id: string;
  uhid?: string;
  tokenCode?: string;
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
  status: 'NEXT' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | string;
  reasonForVisit: string;
  alerts: string; // Comma separated
  history: ConsultationHistory[];

  // Clinical Intake & Pre-Consultation Fields
  chiefComplaint?: string;
  symptoms?: string;
  symptomsDuration?: string;
  severity?: string;
  isFirstVisit?: boolean;
  daysSinceLastVisit?: number | null;
  medications?: string;
  medicalHistory?: string;
  allergies?: string;
  intakeNotes?: string;
  scheduledTime?: string;
  queuePosition?: number;
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
