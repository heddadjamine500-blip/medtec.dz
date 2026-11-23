import path from 'path';
import bcrypt from 'bcrypt';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

const dbPath = path.resolve(__dirname, '../dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('🇩🇿 Seeding clinical database with authentic Algerian medical records...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Doctors (Algerian Specialists & General Practitioners)
  const doctorUser1 = await prisma.user.upsert({
    where: { email: 'doctor@medtec.com' },
    update: {
      doctorInfo: {
        update: {
          firstName: 'Amine',
          lastName: 'Benali',
          specialty: 'Cardiologie & Maladies Vasculaires',
          licenseNb: 'ORD-ALGER-16042',
          phone: '+213 550 12 34 56',
        },
      },
    },
    create: {
      email: 'doctor@medtec.com',
      password: passwordHash,
      role: 'DOCTOR',
      doctorInfo: {
        create: {
          firstName: 'Amine',
          lastName: 'Benali',
          specialty: 'Cardiologie & Maladies Vasculaires',
          licenseNb: 'ORD-ALGER-16042',
          phone: '+213 550 12 34 56',
        },
      },
    },
    include: { doctorInfo: true },
  });

  const doctorUser2 = await prisma.user.upsert({
    where: { email: 'dr.martin@medtec.com' },
    update: {
      doctorInfo: {
        update: {
          firstName: 'Yasmine',
          lastName: 'Mansouri',
          specialty: 'Pédiatrie & Santé de l’Enfant',
          licenseNb: 'ORD-ORAN-31088',
          phone: '+213 770 45 67 89',
        },
      },
    },
    create: {
      email: 'dr.martin@medtec.com',
      password: passwordHash,
      role: 'DOCTOR',
      doctorInfo: {
        create: {
          firstName: 'Yasmine',
          lastName: 'Mansouri',
          specialty: 'Pédiatrie & Santé de l’Enfant',
          licenseNb: 'ORD-ORAN-31088',
          phone: '+213 770 45 67 89',
        },
      },
    },
    include: { doctorInfo: true },
  });

  const doctorUser3 = await prisma.user.upsert({
    where: { email: 'dr.boumediene@medtec.com' },
    update: {
      doctorInfo: {
        update: {
          firstName: 'Karim',
          lastName: 'Boumediene',
          specialty: 'Neurologie & Médecine Interne',
          licenseNb: 'ORD-CONST-25019',
          phone: '+213 661 88 99 00',
        },
      },
    },
    create: {
      email: 'dr.boumediene@medtec.com',
      password: passwordHash,
      role: 'DOCTOR',
      doctorInfo: {
        create: {
          firstName: 'Karim',
          lastName: 'Boumediene',
          specialty: 'Neurologie & Médecine Interne',
          licenseNb: 'ORD-CONST-25019',
          phone: '+213 661 88 99 00',
        },
      },
    },
    include: { doctorInfo: true },
  });

  // 2. Patients (Algerian Patients)
  const patientUser1 = await prisma.user.upsert({
    where: { email: 'patient@medtec.com' },
    update: {
      patientInfo: {
        update: {
          firstName: 'Anis',
          lastName: 'Brahimi',
          phone: '+213 555 88 12 34',
          address: '14 Rue Didouche Mourad, Alger Centre',
          birthDate: new Date('1992-04-14'),
        },
      },
    },
    create: {
      email: 'patient@medtec.com',
      password: passwordHash,
      role: 'PATIENT',
      patientInfo: {
        create: {
          firstName: 'Anis',
          lastName: 'Brahimi',
          phone: '+213 555 88 12 34',
          address: '14 Rue Didouche Mourad, Alger Centre',
          birthDate: new Date('1992-04-14'),
        },
      },
    },
    include: { patientInfo: true },
  });

  const patientUser2 = await prisma.user.upsert({
    where: { email: 'thomas.leroy@medtec.com' },
    update: {
      patientInfo: {
        update: {
          firstName: 'Meriem',
          lastName: 'Saidi',
          phone: '+213 662 34 56 78',
          address: '8 Boulevard Front de Mer, Oran',
          birthDate: new Date('1985-11-23'),
        },
      },
    },
    create: {
      email: 'thomas.leroy@medtec.com',
      password: passwordHash,
      role: 'PATIENT',
      patientInfo: {
        create: {
          firstName: 'Meriem',
          lastName: 'Saidi',
          phone: '+213 662 34 56 78',
          address: '8 Boulevard Front de Mer, Oran',
          birthDate: new Date('1985-11-23'),
        },
      },
    },
    include: { patientInfo: true },
  });

  const patientUser3 = await prisma.user.upsert({
    where: { email: 'sarah.connor@medtec.com' },
    update: {
      patientInfo: {
        update: {
          firstName: 'Sofiane',
          lastName: 'Khelifi',
          phone: '+213 771 90 12 34',
          address: '42 Avenue de l’Indépendance, Constantine',
          birthDate: new Date('1988-08-19'),
        },
      },
    },
    create: {
      email: 'sarah.connor@medtec.com',
      password: passwordHash,
      role: 'PATIENT',
      patientInfo: {
        create: {
          firstName: 'Sofiane',
          lastName: 'Khelifi',
          phone: '+213 771 90 12 34',
          address: '42 Avenue de l’Indépendance, Constantine',
          birthDate: new Date('1988-08-19'),
        },
      },
    },
    include: { patientInfo: true },
  });

  const patientUser4 = await prisma.user.upsert({
    where: { email: 'leila.belhadj@medtec.com' },
    update: {
      patientInfo: {
        update: {
          firstName: 'Leila',
          lastName: 'Belhadj',
          phone: '+213 550 77 66 55',
          address: '25 Boulevard Sidi Yahia, Hydra, Alger',
          birthDate: new Date('1995-02-10'),
        },
      },
    },
    create: {
      email: 'leila.belhadj@medtec.com',
      password: passwordHash,
      role: 'PATIENT',
      patientInfo: {
        create: {
          firstName: 'Leila',
          lastName: 'Belhadj',
          phone: '+213 550 77 66 55',
          address: '25 Boulevard Sidi Yahia, Hydra, Alger',
          birthDate: new Date('1995-02-10'),
        },
      },
    },
    include: { patientInfo: true },
  });

  // 3. Pharmacy (Algerian Pharmacies)
  const pharmacyUser = await prisma.user.upsert({
    where: { email: 'pharmacy@medtec.com' },
    update: {
      pharmacyInfo: {
        update: {
          name: 'Pharmacie Centrale El Chiffa',
          address: '18 Boulevard Colonel Amirouche, Alger Centre',
          phone: '+213 21 73 45 67',
        },
      },
    },
    create: {
      email: 'pharmacy@medtec.com',
      password: passwordHash,
      role: 'PHARMACY',
      pharmacyInfo: {
        create: {
          name: 'Pharmacie Centrale El Chiffa',
          address: '18 Boulevard Colonel Amirouche, Alger Centre',
          phone: '+213 21 73 45 67',
        },
      },
    },
    include: { pharmacyInfo: true },
  });

  // 4. Admin
  await prisma.user.upsert({
    where: { email: 'admin@medtec.com' },
    update: {},
    create: {
      email: 'admin@medtec.com',
      password: passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // 5. Update Existing Patients & Doctors directly in DB in case IDs match
  if (patientUser1.patientInfo) {
    await prisma.patientProfile.update({
      where: { id: patientUser1.patientInfo.id },
      data: {
        firstName: 'Anis',
        lastName: 'Brahimi',
        address: '14 Rue Didouche Mourad, Alger Centre',
        phone: '+213 555 88 12 34',
      },
    });
  }

  if (doctorUser1.doctorInfo) {
    await prisma.doctorProfile.update({
      where: { id: doctorUser1.doctorInfo.id },
      data: {
        firstName: 'Amine',
        lastName: 'Benali',
        specialty: 'Cardiologie & Maladies Vasculaires',
        licenseNb: 'ORD-ALGER-16042',
        phone: '+213 550 12 34 56',
      },
    });
  }

  if (pharmacyUser.pharmacyInfo) {
    await prisma.pharmacyProfile.update({
      where: { id: pharmacyUser.pharmacyInfo.id },
      data: {
        name: 'Pharmacie Centrale El Chiffa',
        address: '18 Boulevard Colonel Amirouche, Alger Centre',
        phone: '+213 21 73 45 67',
      },
    });
  }

  // 6. Pharmacy Inventory with Algerian producers & products
  const pharmacyId = pharmacyUser.pharmacyInfo!.id;
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.inventoryItem.deleteMany({ where: { pharmacyId } });

  await prisma.inventoryItem.createMany({
    data: [
      {
        pharmacyId,
        name: 'Doliprane 1000mg',
        description: 'Paracétamol - Boîte de 8 comprimés effervescents',
        stock: 15,
        price: 240, // DZD
        supplier: 'Biopharm Algérie',
        barcode: '6130093617001',
      },
      {
        pharmacyId,
        name: 'Amoxicilline Saidal 500mg',
        description: 'Antibiotique large spectre - Boîte de 24 gélules',
        stock: 25,
        price: 450, // DZD
        supplier: 'Groupe Saidal',
        barcode: '6130093710002',
      },
      {
        pharmacyId,
        name: 'Ventoline 100µg',
        description: 'Salbutamol - Flacon inhalateur 200 doses',
        stock: 8,
        price: 890, // DZD
        supplier: 'GSK Algérie',
        barcode: '6130093158003',
      },
      {
        pharmacyId,
        name: 'Spasfon 80mg',
        description: 'Antispasmodique - Boîte de 30 comprimés enrobés',
        stock: 35,
        price: 380, // DZD
        supplier: 'Merinal Laboratoires',
        barcode: '6130093108004',
      },
      {
        pharmacyId,
        name: 'Kardégic 75mg',
        description: 'Antiagrégant plaquettaire - Boîte de 30 sachets',
        stock: 40,
        price: 520, // DZD
        supplier: 'Sanofi Algérie',
        barcode: '6130093392005',
      },
      {
        pharmacyId,
        name: 'Céfacidal 1g',
        description: 'Céfazoline injectable - Flacon poudre + solvant',
        stock: 18,
        price: 610, // DZD
        supplier: 'Groupe Saidal',
        barcode: '6130093401006',
      },
    ],
  });

  // 7. Clinical Prescriptions & Consultations
  const doctorId = doctorUser1.doctorInfo!.id;
  const patientId = patientUser1.patientInfo!.id;

  // Clear previous demo prescriptions and appointments to refresh with Algerian data
  await prisma.prescription.deleteMany({});
  await prisma.appointment.deleteMany({});

  const today = new Date();
  const demain = new Date(today);
  demain.setDate(today.getDate() + 1);
  demain.setHours(10, 30, 0, 0);

  const dansTroisJours = new Date(today);
  dansTroisJours.setDate(today.getDate() + 3);
  dansTroisJours.setHours(14, 0, 0, 0);

  await prisma.appointment.createMany({
    data: [
      {
        doctorId,
        patientId,
        date: demain,
        status: 'CONFIRMED',
      },
      {
        doctorId,
        patientId: patientUser2.patientInfo!.id,
        date: dansTroisJours,
        status: 'PENDING',
      },
      {
        doctorId: doctorUser2.doctorInfo!.id,
        patientId: patientUser3.patientInfo!.id,
        date: new Date(Date.now() + 86400000 * 2),
        status: 'CONFIRMED',
      },
    ],
  });

  await prisma.prescription.create({
    data: {
      doctorId,
      patientId,
      notes: 'Suivi HTA - Traitement cardio-vasculaire et antalgique prescrit par Dr. Benali.',
      items: {
        create: [
          {
            medicationName: 'Amoxicilline Saidal 500mg',
            dosage: '1 gélule matin et soir au milieu du repas',
            duration: '7 jours',
          },
          {
            medicationName: 'Doliprane 1000mg',
            dosage: '1 comprimé toutes les 8 heures si céphalée',
            duration: '5 jours si besoin',
          },
          {
            medicationName: 'Kardégic 75mg',
            dosage: '1 sachet le matin dilué dans un verre d’eau',
            duration: '3 mois renouvelable',
          },
        ],
      },
    },
  });

  console.log('✅ Base de données médicale algérienne initialisée avec succès !');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
