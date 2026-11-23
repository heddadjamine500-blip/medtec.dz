const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const adapter = new PrismaBetterSqlite3({ url: 'file:' + path.resolve(__dirname, 'dev.db') });
const prisma = new PrismaClient({ adapter });

async function check() {
  const doctors = await prisma.doctorProfile.findMany({ select: { firstName: true, lastName: true, specialty: true, phone: true } });
  const patients = await prisma.patientProfile.findMany({ select: { firstName: true, lastName: true, address: true, phone: true } });
  const pharmacies = await prisma.pharmacyProfile.findMany({ select: { name: true, address: true, phone: true } });
  const inventory = await prisma.inventoryItem.findMany({ select: { name: true, supplier: true, price: true, stock: true } });

  console.log('🩺 DOCTEURS ALGÉRIENS :');
  console.table(doctors);

  console.log('\n🧑‍⚕️ PATIENTS ALGÉRIENS :');
  console.table(patients);

  console.log('\n💊 PHARMACIES ALGÉRIENNES :');
  console.table(pharmacies);

  console.log('\n📦 INVENTAIRE PHARMACEUTIQUE ALGÉRIEN :');
  console.table(inventory);
}

check().finally(() => prisma.$disconnect());
