/** Admin / socket payload shape for patient list rows. */
export function formatPatientForSocket(p: {
  uhid: string;
  full_name: string;
  age: number;
  gender: string;
  blood_group: string;
  patient_status: string;
  phone: string | null;
  email: string | null;
  hospital_id: number;
}) {
  return {
    id: p.uhid,
    name: p.full_name,
    age: String(p.age),
    gender: p.gender,
    blood: p.blood_group,
    dept: 'General',
    doctor: 'Not Assigned',
    status: p.patient_status,
    condition: 'Stable',
    phone: p.phone || 'N/A',
    email: p.email || 'N/A',
    address: 'Not Provided',
    admitted: new Date().toISOString(),
    hospitalId: String(p.hospital_id),
  };
}
