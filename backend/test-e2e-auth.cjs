// Comprehensive End-to-End Auth & Flow Test Suite
const API_BASE = 'http://localhost:10000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🩺 MEDTEC PLATFORM - END-TO-END VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function check(name, testFn) {
    process.stdout.write(`[TEST] ${name} ... `);
    try {
      await testFn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await check('API Server Health Endpoint (/api/health)', async () => {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Unexpected payload: ${JSON.stringify(data)}`);
  });

  // 2. Demo logins for each role
  const roles = [
    { role: 'PATIENT', email: 'patient@medtec.com' },
    { role: 'DOCTOR', email: 'doctor@medtec.com' },
    { role: 'PHARMACY', email: 'pharmacy@medtec.com' },
    { role: 'ADMIN', email: 'admin@medtec.com' },
  ];

  for (const { role, email } of roles) {
    await check(`Login for Demo Role [${role}] (${email})`, async () => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} - ${text}`);
      }
      const data = await res.json();
      if (!data.token) throw new Error('Missing token in response');
      if (data.user?.role !== role) throw new Error(`Expected role ${role}, got ${data.user?.role}`);
    });
  }

  // 3. Invalid credentials test
  await check('Reject invalid credentials with proper HTTP error', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unknown_user_999@medtec.com', password: 'badpassword' }),
    });
    if (res.ok) throw new Error('Expected login to fail, but got 200 OK');
    if (res.status !== 401 && res.status !== 404 && res.status !== 400) {
      throw new Error(`Unexpected status code ${res.status}`);
    }
  });

  // 4. Register new Patient
  const timestamp = Date.now();
  const testPatientEmail = `test.patient.${timestamp}@medtec-test.com`;
  let patientToken = null;

  await check('Register new PATIENT account', async () => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testPatientEmail,
        password: 'password123',
        role: 'PATIENT',
        firstName: 'Jean',
        lastName: 'E2ETest',
        phone: '0601020304',
        address: '15 rue de Test',
        birthDate: '1990-05-15',
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} - ${text}`);
    }
    const data = await res.json();
    if (!data.token) throw new Error('No token returned after registration');
    if (data.user?.role !== 'PATIENT') throw new Error(`Expected role PATIENT, got ${data.user?.role}`);
    patientToken = data.token;
  });

  // 5. Verify /api/auth/me with newly created patient token
  await check('Profile verification via GET /api/auth/me', async () => {
    if (!patientToken) throw new Error('No token from previous step');
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const user = data.user || data;
    if (user.email !== testPatientEmail) throw new Error(`Expected email ${testPatientEmail}, got ${user.email}`);
    if (user.role !== 'PATIENT') throw new Error(`Expected role PATIENT, got ${user.role}`);
  });

  // 6. Register new Doctor
  const testDoctorEmail = `test.doctor.${timestamp}@medtec-test.com`;
  await check('Register new DOCTOR account with specialty & license', async () => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testDoctorEmail,
        password: 'password123',
        role: 'DOCTOR',
        firstName: 'Dr. Jeanne',
        lastName: 'E2ETest',
        specialty: 'Cardiologie',
        licenseNb: `RPPS-${timestamp}`,
        phone: '0102030405',
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} - ${text}`);
    }
    const data = await res.json();
    if (data.user?.role !== 'DOCTOR') throw new Error(`Expected role DOCTOR, got ${data.user?.role}`);
    if (data.user?.doctorInfo?.specialty !== 'Cardiologie') {
      throw new Error(`Expected specialty Cardiologie, got ${data.user?.doctorInfo?.specialty}`);
    }
  });

  // 7. Register new Pharmacy
  const testPharmacyEmail = `test.pharmacy.${timestamp}@medtec-test.com`;
  await check('Register new PHARMACY account with official name & address', async () => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testPharmacyEmail,
        password: 'password123',
        role: 'PHARMACY',
        name: 'Pharmacie Nouvelle E2E',
        address: '100 Boulevard Voltaire, 75011 Paris',
        phone: '0143210987',
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} - ${text}`);
    }
    const data = await res.json();
    if (data.user?.role !== 'PHARMACY') throw new Error(`Expected role PHARMACY, got ${data.user?.role}`);
    if (data.user?.pharmacyInfo?.name !== 'Pharmacie Nouvelle E2E') {
      throw new Error(`Expected name Pharmacie Nouvelle E2E, got ${data.user?.pharmacyInfo?.name}`);
    }
  });

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
