import bcrypt from 'bcrypt';
import prisma from '../src/utils/prisma';

async function seedSamples() {
  console.log('🏥 Ajout des exemples de Salles et d\'Employés hospitaliers MEDTEC...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Salles Hospitalières
  const roomsData = [
    {
      name: 'Salle C-01',
      type: 'CONSULTATION',
      floor: 0,
      capacity: 3,
      status: 'AVAILABLE',
      notes: 'Cabinet de consultation générale & cardiologie, équipé d\'un ECG et stéthoscope connecté.',
    },
    {
      name: 'Salle C-02',
      type: 'CONSULTATION',
      floor: 0,
      capacity: 2,
      status: 'AVAILABLE',
      notes: 'Cabinet pédiatrique & néonatalogie avec toise médicale et table d\'examen sécurisée.',
    },
    {
      name: 'Salle C-03',
      type: 'CONSULTATION',
      floor: 1,
      capacity: 3,
      status: 'AVAILABLE',
      notes: 'Cabinet de neurologie & médecine interne avec matériel d\'exploration des réflexes.',
    },
    {
      name: 'Bloc Opératoire Central A',
      type: 'OPERATING',
      floor: 2,
      capacity: 6,
      status: 'AVAILABLE',
      notes: 'Bloc chirurgical stérile ISO 5, tour de cœlioscopie HD et éclairage scialytique LED.',
    },
    {
      name: 'Bloc Chirurgie Ambulatoire',
      type: 'OPERATING',
      floor: 2,
      capacity: 4,
      status: 'MAINTENANCE',
      notes: 'Maintenance préventive des filtres HEPA et de la centrale de traitement d\'air.',
    },
    {
      name: 'Unité Réanimation Polyvalente',
      type: 'ICU',
      floor: 1,
      capacity: 4,
      status: 'AVAILABLE',
      notes: 'Monitoring hémodynamique continu, ventilateurs d\'anesthésie et défibrillateur débrayable.',
    },
    {
      name: 'Box Déchocage Urgences',
      type: 'EMERGENCY',
      floor: 0,
      capacity: 3,
      status: 'AVAILABLE',
      notes: 'Poste d\'urgence vitale prioritaire, accès direct aux brancards SMUR et oxygénothérapie murale.',
    },
    {
      name: 'Laboratoire Central d\'Analyses',
      type: 'LAB',
      floor: -1,
      capacity: 6,
      status: 'AVAILABLE',
      notes: 'Plateau technique d\'hématologie, biochimie clinique et gazométrie sanguine.',
    },
    {
      name: 'Chambre 201 - Hospitalisation',
      type: 'WARD',
      floor: 2,
      capacity: 2,
      status: 'AVAILABLE',
      notes: 'Chambre double avec lits médicalisés automatisés, appel malade et sanitaires PMR.',
    },
  ];

  const createdRooms: Record<string, any> = {};

  for (const r of roomsData) {
    const room = await prisma.room.upsert({
      where: { name: r.name },
      update: {
        type: r.type,
        floor: r.floor,
        capacity: r.capacity,
        status: r.status,
        notes: r.notes,
      },
      create: r,
    });
    createdRooms[room.name] = room;
  }
  console.log(`✅ ${Object.keys(createdRooms).length} salles configurées avec succès.`);

  // 2. Employés Hospitaliers
  const employeesData = [
    {
      email: 'infirmiere.amira@medtec.com',
      employeeCode: 'EMP-2024-001',
      firstName: 'Amira',
      lastName: 'Cherif',
      jobTitle: 'NURSE',
      department: 'Urgences & Soins Intensifs',
      phone: '+213 550 21 44 88',
      hireDate: new Date('2022-03-15'),
      status: 'ACTIVE',
      notes: 'Infirmière coordinatrice de nuit, certifiée en soins d\'urgence avancés et réanimation.',
    },
    {
      email: 'anesthesiste.malik@medtec.com',
      employeeCode: 'EMP-2024-002',
      firstName: 'Malik',
      lastName: 'Khelifi',
      jobTitle: 'ANESTHESIOLOGIST',
      department: 'Bloc Opératoire & Anesthésie',
      phone: '+213 661 33 55 77',
      hireDate: new Date('2021-09-01'),
      status: 'ACTIVE',
      notes: 'Infirmier anesthésiste diplômé d\'État (IADE), responsable du matériel de ventilation.',
    },
    {
      email: 'reception.samia@medtec.com',
      employeeCode: 'EMP-2024-003',
      firstName: 'Samia',
      lastName: 'Bensaad',
      jobTitle: 'RECEPTIONIST',
      department: 'Accueil & Admissions',
      phone: '+213 770 11 22 33',
      hireDate: new Date('2023-01-10'),
      status: 'ACTIVE',
      notes: 'Gestion des admissions des patients, orientation clinique et dossiers de prise en charge CNAS.',
    },
    {
      email: 'tech.mourad@medtec.com',
      employeeCode: 'EMP-2024-004',
      firstName: 'Mourad',
      lastName: 'Dahmani',
      jobTitle: 'TECHNICIAN',
      department: 'Radiologie & Imagerie Médicale',
      phone: '+213 555 99 88 11',
      hireDate: new Date('2022-06-01'),
      status: 'ACTIVE',
      notes: 'Manipulateur d\'électroradiologie médicale, certifié scanner multibarette et IRM 1.5T.',
    },
    {
      email: 'pharma.karima@medtec.com',
      employeeCode: 'EMP-2024-005',
      firstName: 'Karima',
      lastName: 'Ouali',
      jobTitle: 'PHARMACIST_ASSISTANT',
      department: 'Pharmacie Hospitalière Centrale',
      phone: '+213 662 44 77 99',
      hireDate: new Date('2023-05-18'),
      status: 'ACTIVE',
      notes: 'Gestion des stocks de solutés massifs, stupéfiants sécurisés et délivrance aux services de soins.',
    },
    {
      email: 'securite.yacine@medtec.com',
      employeeCode: 'EMP-2024-006',
      firstName: 'Yacine',
      lastName: 'Mebarki',
      jobTitle: 'SECURITY',
      department: 'Sécurité & Accès',
      phone: '+213 551 66 77 88',
      hireDate: new Date('2023-08-01'),
      status: 'ACTIVE',
      notes: 'Surveillance des accès aux blocs opératoires, urgences et contrôle des flux de visiteurs.',
    },
  ];

  const createdEmployees: any[] = [];

  for (const emp of employeesData) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {
        role: 'EMPLOYEE',
        isActive: true,
      },
      create: {
        email: emp.email,
        password: passwordHash,
        role: 'EMPLOYEE',
        isActive: true,
      },
    });

    const profile = await prisma.employeeProfile.upsert({
      where: { userId: user.id },
      update: {
        employeeCode: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        jobTitle: emp.jobTitle,
        department: emp.department,
        phone: emp.phone,
        hireDate: emp.hireDate,
        status: emp.status,
        notes: emp.notes,
      },
      create: {
        userId: user.id,
        employeeCode: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        jobTitle: emp.jobTitle,
        department: emp.department,
        phone: emp.phone,
        hireDate: emp.hireDate,
        status: emp.status,
        notes: emp.notes,
      },
    });

    // Planning standard du Lundi au Vendredi (08h00 - 16h30)
    for (let day = 1; day <= 5; day++) {
      await prisma.workSchedule.upsert({
        where: {
          userId_weekday: {
            userId: user.id,
            weekday: day,
          },
        },
        update: {
          startTime: '08:00',
          endTime: '16:30',
          isActive: true,
        },
        create: {
          userId: user.id,
          weekday: day,
          startTime: '08:00',
          endTime: '16:30',
          isActive: true,
        },
      });
    }

    // Pointage du jour (Aujourd'hui)
    const todayStr = new Date().toISOString().split('T')[0];
    const checkInTime = new Date();
    checkInTime.setHours(7, 55, 0, 0);

    await prisma.attendance.upsert({
      where: {
        id: `att-${user.id}-${todayStr}`,
      },
      update: {
        status: 'PRESENT',
        checkInAt: checkInTime,
      },
      create: {
        id: `att-${user.id}-${todayStr}`,
        userId: user.id,
        date: todayStr,
        checkInAt: checkInTime,
        status: 'PRESENT',
        source: 'SELF',
        note: 'Pointage badgeuse d\'entrée principale',
      },
    });

    createdEmployees.push({ user, profile });
  }
  console.log(`✅ ${createdEmployees.length} employés créés avec plannings et pointages d'aujourd'hui.`);

  // 3. Réservations de Salles (Room Bookings)
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const doctorBenali = await prisma.doctorProfile.findFirst({
    where: { firstName: 'Amine' },
  });
  const doctorMansouri = await prisma.doctorProfile.findFirst({
    where: { firstName: 'Yasmine' },
  });

  if (admin && createdRooms['Salle C-01'] && doctorBenali) {
    const today = new Date();
    const start1 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0);
    const end1 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0, 0);

    const existingBooking1 = await prisma.roomBooking.findFirst({
      where: {
        roomId: createdRooms['Salle C-01'].id,
        startAt: start1,
      },
    });

    if (!existingBooking1) {
      await prisma.roomBooking.create({
        data: {
          roomId: createdRooms['Salle C-01'].id,
          startAt: start1,
          endAt: end1,
          purpose: 'Consultations Cardiologie & Échographies cardiaques de suivi',
          bookedByUserId: admin.id,
          doctorId: doctorBenali.id,
          status: 'SCHEDULED',
        },
      });
      console.log('✅ Réservation créée : Salle C-01 pour Dr Benali.');
    }
  }

  if (admin && createdRooms['Bloc Opératoire Central A'] && doctorMansouri) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start2 = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 8, 30, 0);
    const end2 = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 0, 0);

    const existingBooking2 = await prisma.roomBooking.findFirst({
      where: {
        roomId: createdRooms['Bloc Opératoire Central A'].id,
        startAt: start2,
      },
    });

    if (!existingBooking2) {
      await prisma.roomBooking.create({
        data: {
          roomId: createdRooms['Bloc Opératoire Central A'].id,
          startAt: start2,
          endAt: end2,
          purpose: 'Interventions programmées de chirurgie pédiatrique',
          bookedByUserId: admin.id,
          doctorId: doctorMansouri.id,
          status: 'SCHEDULED',
        },
      });
      console.log('✅ Réservation créée : Bloc Opératoire Central A pour Dr Mansouri.');
    }
  }

  console.log('🎉 Données d\'exemples créées avec succès !');
}

seedSamples()
  .catch((e) => {
    console.error('Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
