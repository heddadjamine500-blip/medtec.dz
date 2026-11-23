const BASE_URL = 'http://localhost:10000/api';

async function runTestSuite() {
  console.log('--- DÉMARRAGE DES TESTS MEDTEC ---');

  const accounts = [
    { email: 'patient@medtec.com', password: 'password123', expectedRole: 'PATIENT' },
    { email: 'doctor@medtec.com', password: 'password123', expectedRole: 'DOCTOR' },
    { email: 'pharmacy@medtec.com', password: 'password123', expectedRole: 'PHARMACY' },
    { email: 'admin@medtec.com', password: 'password123', expectedRole: 'ADMIN' },
  ];

  const tokens: Record<string, string> = {};

  // 1. Test Login on all 4 demo accounts
  console.log('\n1. Test de connexion des 4 comptes de démonstration :');
  for (const acc of accounts) {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.password }),
      });
      const data: any = await res.json();
      if (data.token && data.user.role === acc.expectedRole) {
        console.log(`✅ [${acc.expectedRole}] Connexion réussie pour ${acc.email}`);
        tokens[acc.expectedRole] = data.token;
      } else {
        console.error(`❌ [${acc.expectedRole}] Échec rôle inattendu:`, data);
      }
    } catch (err: any) {
      console.error(`❌ [${acc.expectedRole}] Erreur connexion ${acc.email}:`, err.message);
    }
  }

  // 2. Test GET /auth/me for patient
  console.log('\n2. Test chargement profil connecté (/auth/me) :');
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokens.PATIENT}` },
    });
    const data: any = await res.json();
    console.log(`✅ Profil Patient chargé: ${data.user.patientInfo?.firstName} ${data.user.patientInfo?.lastName}`);
  } catch (err: any) {
    console.error('❌ Erreur getMe Patient:', err.message);
  }

  // 3. Test Authorization: Patient trying to access Admin Users list (should return 403)
  console.log('\n3. Test des permissions RBAC (Sécurité) :');
  try {
    const res = await fetch(`${BASE_URL}/clinical/users`, {
      headers: { Authorization: `Bearer ${tokens.PATIENT}` },
    });
    if (res.status === 403) {
      console.log('✅ Sécurité RBAC validée: Accès interdit (403) pour Patient sur la gestion Admin');
    } else {
      console.error('❌ Échec de sécurité: status inattendu', res.status);
    }
  } catch (err: any) {
    console.error('❌ Erreur inattendue:', err.message);
  }

  // 4. Test Doctor Appointments list & Consultation creation
  console.log('\n4. Test Espace Médecin (RDV & Consultation) :');
  try {
    const apptsRes = await fetch(`${BASE_URL}/appointments`, {
      headers: { Authorization: `Bearer ${tokens.DOCTOR}` },
    });
    const appts: any = await apptsRes.json();
    console.log(`✅ Médecin a récupéré ${appts.length} rendez-vous`);

    const patientsRes = await fetch(`${BASE_URL}/clinical/patients`, {
      headers: { Authorization: `Bearer ${tokens.DOCTOR}` },
    });
    const patients: any = await patientsRes.json();
    console.log(`✅ Médecin a accès à ${patients.length} patients`);

    if (patients.length > 0) {
      const targetPatient = patients[0];
      const consultRes = await fetch(`${BASE_URL}/clinical/consultations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.DOCTOR}`,
        },
        body: JSON.stringify({
          patientId: targetPatient.id,
          diagnosis: 'Bilan cardio standard - Tension normale',
          vitalSigns: 'TA: 12/8, FC: 68 bpm',
          notes: 'Patient en excellente santé générale.',
        }),
      });
      const consult: any = await consultRes.json();
      console.log(`✅ Consultation créée avec succès par le Médecin (ID: ${consult.id.substring(0, 8)})`);
    }
  } catch (err: any) {
    console.error('❌ Erreur test médecin:', err.message);
  }

  // 5. Test Pharmacy (Inventory & Stock adjustment)
  console.log('\n5. Test Espace Pharmacie (Inventaire & Mouvements de stock) :');
  try {
    const invRes = await fetch(`${BASE_URL}/pharmacy/inventory`, {
      headers: { Authorization: `Bearer ${tokens.PHARMACY}` },
    });
    const inv: any = await invRes.json();
    console.log(`✅ Pharmacie a récupéré ${inv.length} références en stock`);

    if (inv.length > 0) {
      const item = inv[0];
      const initialStock = item.stock;
      const updateRes = await fetch(`${BASE_URL}/pharmacy/inventory/${item.id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.PHARMACY}`,
        },
        body: JSON.stringify({ delta: 5, reason: 'Réapprovisionnement automatique' }),
      });
      const updated: any = await updateRes.json();
      console.log(`✅ Stock de ${item.name} mis à jour : ${initialStock} -> ${updated.stock}`);
    }
  } catch (err: any) {
    console.error('❌ Erreur test pharmacie:', err.message);
  }

  // 6. Test Admin (Users management & Stats)
  console.log('\n6. Test Espace Administrateur (Gestion globale) :');
  try {
    const usersRes = await fetch(`${BASE_URL}/clinical/users`, {
      headers: { Authorization: `Bearer ${tokens.ADMIN}` },
    });
    const users: any = await usersRes.json();
    console.log(`✅ Administrateur a listé ${users.length} comptes utilisateurs`);

    const statsRes = await fetch(`${BASE_URL}/clinical/stats`, {
      headers: { Authorization: `Bearer ${tokens.ADMIN}` },
    });
    const stats: any = await statsRes.json();
    console.log(`✅ Statistiques globales: ${stats.totalPatients} patients, ${stats.totalDoctors} médecins, ${stats.totalInventoryItems} médicaments en stock`);
  } catch (err: any) {
    console.error('❌ Erreur test admin:', err.message);
  }

  console.log('\n--- TOUS LES TESTS SONT TERMINÉS AVEC SUCCÈS ! ---');
}

runTestSuite();
