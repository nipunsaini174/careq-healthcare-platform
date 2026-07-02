import { PrismaClient } from '@prisma/client';
import fs from 'fs';

// Force BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const prisma = new PrismaClient();

async function importAll() {
  console.log('Importing data to Mumbai database...\n');

  const inPath = './scripts/exported-data.json';
  if (!fs.existsSync(inPath)) {
    console.error('Export file not found!');
    return;
  }

  const data = JSON.parse(fs.readFileSync(inPath, 'utf8'));

  // Import in same order
  const tables = [
    { name: 'hospitals', fn: (rows: any[]) => prisma.hospitals.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'users', fn: (rows: any[]) => prisma.users.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'departments', fn: (rows: any[]) => prisma.departments.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'admins', fn: (rows: any[]) => prisma.admins.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'receptionists', fn: (rows: any[]) => prisma.receptionists.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'doctors', fn: (rows: any[]) => prisma.doctors.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'patients', fn: (rows: any[]) => prisma.patients.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'patient_profiles', fn: (rows: any[]) => prisma.patient_profiles.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'appointments', fn: (rows: any[]) => prisma.appointments.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'queue_tokens', fn: (rows: any[]) => prisma.queue_tokens.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'consultations', fn: (rows: any[]) => prisma.consultations.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'follow_up_consultations', fn: (rows: any[]) => prisma.follow_up_consultations.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'billing_invoices', fn: (rows: any[]) => prisma.billing_invoices.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'lab_reports', fn: (rows: any[]) => prisma.lab_reports.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'notifications', fn: (rows: any[]) => prisma.notifications.createMany({ data: rows, skipDuplicates: true }) },
    { name: 'walk_in_patients', fn: (rows: any[]) => prisma.walk_in_patients.createMany({ data: rows, skipDuplicates: true }) },
  ];

  for (const table of tables) {
    try {
      const rows = data[table.name] || [];
      if (rows.length === 0) continue;
      
      const parsedRows = rows.map((row: any) => {
        const parsed = castBigInts(row);
        // Clean up legacy fields that might exist in old export but not new schema
        if (table.name === 'patients') {
          delete parsed.parent_id;
          if (parsed.abha_id !== null && typeof parsed.abha_id !== 'string') {
            parsed.abha_id = String(parsed.abha_id);
          }
        }
        if (table.name === 'doctors') {
          if (parsed.phone !== null && typeof parsed.phone !== 'string') {
            parsed.phone = String(parsed.phone);
          }
        }
        return parsed;
      });
      
      await table.fn(parsedRows);
      console.log(`  ✓ ${table.name}: inserted ${rows.length} rows`);
    } catch (err: any) {
      console.log(`  ✗ ${table.name}: ${err.message}`);
    }
  }

  console.log(`\n✅ Data import complete!`);
  await prisma.$disconnect();
}

// Quick helper to cast fields ending in _id or known BigInt fields
function castBigInts(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(castBigInts);
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      // Only convert fields ending in _id (except abha_id which is a string)
      if (
        (key.endsWith('_id') && key !== 'abha_id') && 
        (typeof obj[key] === 'string' || typeof obj[key] === 'number') && 
        /^-?\d+$/.test(String(obj[key]))
      ) {
        newObj[key] = BigInt(obj[key]);
      } else {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  }
  return obj;
}

importAll().catch(console.error);
