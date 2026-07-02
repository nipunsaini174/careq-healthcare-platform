import { PrismaClient } from '@prisma/client';

// Force BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const prisma = new PrismaClient();

async function exportAll() {
  console.log('Exporting data from current database...\n');

  const data: Record<string, any[]> = {};

  // Export in dependency order (parent tables first)
  const tables = [
    { name: 'hospitals', fn: () => prisma.hospitals.findMany() },
    { name: 'users', fn: () => prisma.users.findMany() },
    { name: 'departments', fn: () => prisma.departments.findMany() },
    { name: 'admins', fn: () => prisma.admins.findMany() },
    { name: 'receptionists', fn: () => prisma.receptionists.findMany() },
    { name: 'doctors', fn: () => prisma.doctors.findMany() },
    { name: 'patients', fn: () => prisma.patients.findMany() },
    { name: 'patient_profiles', fn: () => prisma.patient_profiles.findMany() },
    { name: 'appointments', fn: () => prisma.appointments.findMany() },
    { name: 'queue_tokens', fn: () => prisma.queue_tokens.findMany() },
    { name: 'consultations', fn: () => prisma.consultations.findMany() },
    { name: 'follow_up_consultations', fn: () => prisma.follow_up_consultations.findMany() },
    { name: 'billing_invoices', fn: () => prisma.billing_invoices.findMany() },
    { name: 'lab_reports', fn: () => prisma.lab_reports.findMany() },
    { name: 'notifications', fn: () => prisma.notifications.findMany() },
    { name: 'walk_in_patients', fn: () => prisma.walk_in_patients.findMany() },
  ];

  for (const table of tables) {
    try {
      const rows = await table.fn();
      data[table.name] = rows;
      console.log(`  ✓ ${table.name}: ${rows.length} rows`);
    } catch (err: any) {
      console.log(`  ✗ ${table.name}: ${err.message}`);
      data[table.name] = [];
    }
  }

  // Write to file
  const fs = await import('fs');
  const outPath = './scripts/exported-data.json';
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`\n✅ Data exported to ${outPath}`);

  await prisma.$disconnect();
}

exportAll().catch(console.error);
