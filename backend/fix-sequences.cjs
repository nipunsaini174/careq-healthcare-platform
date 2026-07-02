const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAllSequences() {
  console.log("Fixing all sequences...");
  const tables = [
    { table: 'appointments', id: 'appointment_id' },
    { table: 'billing_invoices', id: 'invoice_id' },
    { table: 'consultations', id: 'consultation_id' },
    { table: 'departments', id: 'department_id' },
    { table: 'doctors', id: 'doctor_id' },
    { table: 'follow_up_consultations', id: 'follow_up_id' },
    { table: 'hospitals', id: 'hospital_id' },
    { table: 'lab_reports', id: 'report_id' },
    { table: 'notifications', id: 'notification_id' },
    { table: 'patient_profiles', id: 'profile_id' },
    { table: 'patients', id: 'patient_id' },
    { table: 'queue_tokens', id: 'token_id' },
    { table: 'receptionists', id: 'receptionist_id' },
    { table: 'users', id: 'user_id' },
    { table: 'walk_in_patients', id: 'walkin_id' },
  ];

  for (const { table, id } of tables) {
    try {
      const maxRes = await prisma.$queryRawUnsafe(`SELECT MAX(${id}) as max_id FROM ${table}`);
      if (maxRes[0] && maxRes[0].max_id) {
        const nextId = Number(maxRes[0].max_id) + 1;
        await prisma.$queryRawUnsafe(`ALTER SEQUENCE ${table}_${id}_seq RESTART WITH ${nextId}`);
        console.log(`Fixed sequence for ${table} to ${nextId}`);
      }
    } catch (err) {
      console.error(`Failed to fix sequence for ${table}:`, err.message);
    }
  }
}

fixAllSequences().catch(console.error).finally(() => prisma.$disconnect());
