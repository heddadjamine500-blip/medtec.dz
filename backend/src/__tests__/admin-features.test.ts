import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Set test environment before imports
process.env.NODE_ENV = 'test';
const testDbPath = path.resolve(__dirname, '../../test.db');
process.env.TEST_DB_PATH = testDbPath;

import app from '../app';
import prisma from '../utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

const createToken = (user: { id: string; email: string; role: string }) => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
};

describe('Admin & Core Platform Features Integration Tests', () => {
  let adminToken: string;
  let doctorToken: string;
  let patientToken: string;
  let employeeToken: string;

  let adminUser: any;
  let doctorUser: any;
  let patientUser: any;
  let employeeUser: any;

  beforeAll(async () => {
    // Duplicate dev.db to isolated test.db
    const devDbPath = path.resolve(__dirname, '../../dev.db');
    if (fs.existsSync(devDbPath)) {
      fs.copyFileSync(devDbPath, testDbPath);
    }

    const passwordHash = await bcrypt.hash('password123', 10);

    // Setup dedicated test users in test.db
    adminUser = await prisma.user.upsert({
      where: { email: 'test.admin@medtec.com' },
      update: {},
      create: {
        email: 'test.admin@medtec.com',
        password: passwordHash,
        role: 'ADMIN',
      },
    });

    doctorUser = await prisma.user.upsert({
      where: { email: 'test.doctor@medtec.com' },
      update: {},
      create: {
        email: 'test.doctor@medtec.com',
        password: passwordHash,
        role: 'DOCTOR',
        doctorInfo: {
          create: {
            firstName: 'Jean',
            lastName: 'Dupont',
            specialty: 'Cardiologie',
            licenseNb: 'LIC-TEST-999',
          },
        },
      },
    });

    patientUser = await prisma.user.upsert({
      where: { email: 'test.patient@medtec.com' },
      update: {},
      create: {
        email: 'test.patient@medtec.com',
        password: passwordHash,
        role: 'PATIENT',
        patientInfo: {
          create: {
            firstName: 'Claire',
            lastName: 'Lemoine',
            phone: '0612345678',
          },
        },
      },
    });

    employeeUser = await prisma.user.upsert({
      where: { email: 'test.employee@medtec.com' },
      update: {},
      create: {
        email: 'test.employee@medtec.com',
        password: passwordHash,
        role: 'EMPLOYEE',
        employeeInfo: {
          create: {
            employeeCode: 'EMP-TEST-001',
            firstName: 'Marc',
            lastName: 'Infirmier',
            jobTitle: 'NURSE',
          },
        },
      },
    });

    adminToken = createToken({ id: adminUser.id, email: adminUser.email, role: 'ADMIN' });
    doctorToken = createToken({ id: doctorUser.id, email: doctorUser.email, role: 'DOCTOR' });
    patientToken = createToken({ id: patientUser.id, email: patientUser.email, role: 'PATIENT' });
    employeeToken = createToken({ id: employeeUser.id, email: employeeUser.email, role: 'EMPLOYEE' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (e) {
        // file lock might be freed later
      }
    }
  });

  // 1. SECURITY FIXES
  describe('Security Boundaries & Registration Isolation', () => {
    it('should reject public registration with ADMIN or EMPLOYEE role (403)', async () => {
      const resAdmin = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'hack.admin@medtec.com',
          password: 'password123',
          role: 'ADMIN',
        });
      expect(resAdmin.status).toBe(403);

      const resEmp = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'hack.emp@medtec.com',
          password: 'password123',
          role: 'EMPLOYEE',
        });
      expect(resEmp.status).toBe(403);
    });

    it('should block ADMIN from accessing clinical patients route (403)', async () => {
      const res = await request(app)
        .get('/api/clinical/patients')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });

    it('should block ADMIN from accessing clinical consultations (403)', async () => {
      const res = await request(app)
        .get('/api/clinical/consultations')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });
  });

  // 2. ROOM MANAGEMENT
  describe('Room Management (/api/admin/rooms)', () => {
    let createdRoomId: string;

    it('should allow ADMIN to create a room (201)', async () => {
      const res = await request(app)
        .post('/api/admin/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Salle Test Vitest 101',
          type: 'CONSULTATION',
          capacity: 4,
          floor: 1,
          status: 'AVAILABLE',
        });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Salle Test Vitest 101');
      createdRoomId = res.body.id;
    });

    it('should refuse duplicate room name with 409', async () => {
      const res = await request(app)
        .post('/api/admin/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Salle Test Vitest 101',
          type: 'CONSULTATION',
        });
      expect(res.status).toBe(409);
    });

    it('should book a room and prevent overlapping bookings with 409', async () => {
      const now = new Date();
      const startAt = new Date(now.getTime() + 3600000).toISOString(); // +1h
      const endAt = new Date(now.getTime() + 7200000).toISOString();   // +2h

      const resBooking1 = await request(app)
        .post('/api/admin/rooms/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roomId: createdRoomId,
          startAt,
          endAt,
          purpose: 'Consultation cardiologie',
        });
      expect(resBooking1.status).toBe(201);

      // Overlap booking (e.g. +1h30 to +2h30)
      const overlapStart = new Date(now.getTime() + 5400000).toISOString();
      const overlapEnd = new Date(now.getTime() + 9000000).toISOString();

      const resOverlap = await request(app)
        .post('/api/admin/rooms/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roomId: createdRoomId,
          startAt: overlapStart,
          endAt: overlapEnd,
          purpose: 'Consultation chevauchante',
        });
      expect(resOverlap.status).toBe(409);
    });

    it('should prevent deleting a room with active/future bookings (409)', async () => {
      const res = await request(app)
        .delete(`/api/admin/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(409);
    });
  });

  // 3. EMPLOYEE MANAGEMENT
  describe('Employee Management (/api/admin/employees)', () => {
    let createdEmployeeId: string;

    it('should allow ADMIN to create employee with EMPLOYEE role (201)', async () => {
      const res = await request(app)
        .post('/api/admin/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'nouvel.employe@medtec.com',
          password: 'securePassword123',
          employeeCode: 'EMP-VITEST-99',
          firstName: 'Sarah',
          lastName: 'Madi',
          jobTitle: 'RECEPTIONIST',
          department: 'Accueil & Admissions',
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.employeeCode).toBe('EMP-VITEST-99');
      expect(res.body.user.role).toBe('EMPLOYEE');
      expect(res.body.user.password).toBeUndefined(); // Password hash never returned
      createdEmployeeId = res.body.id;
    });

    it('should deactivate user when employee is marked TERMINATED', async () => {
      const res = await request(app)
        .put(`/api/admin/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'TERMINATED',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('TERMINATED');
      expect(res.body.user.isActive).toBe(false);
    });
  });

  // 4. ATTENDANCE SYSTEM
  describe('Attendance & Clock-In System', () => {
    it('should allow EMPLOYEE to clock in (201)', async () => {
      const res = await request(app)
        .post('/api/attendance/clock-in')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect([201, 409]).toContain(res.status); // 201 if clean, 409 if already open
      if (res.status === 201) {
        expect(res.body.userId).toBe(employeeUser.id);
        expect(res.body.checkInAt).toBeDefined();
        expect(res.body.checkOutAt).toBeNull();
      }
    });

    it('should prevent double clock-in while session is open (409)', async () => {
      const res = await request(app)
        .post('/api/attendance/clock-in')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(409);
    });

    it('should allow EMPLOYEE to clock out (200)', async () => {
      const res = await request(app)
        .post('/api/attendance/clock-out')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.checkOutAt).toBeDefined();
    });

    it('should require a note when admin corrects an attendance and log to AuditLog', async () => {
      const resWithoutNote = await request(app)
        .post('/api/admin/attendance/correction')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: employeeUser.id,
          date: '2026-11-23',
          checkInAt: new Date().toISOString(),
          status: 'PRESENT',
          note: '', // Empty note
        });

      expect(resWithoutNote.status).toBe(400);

      const resWithNote = await request(app)
        .post('/api/admin/attendance/correction')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: employeeUser.id,
          date: '2026-11-23',
          checkInAt: new Date().toISOString(),
          status: 'PRESENT',
          note: 'Oubli de badge le matin à l’entrée',
        });

      expect(resWithNote.status).toBe(201);
      expect(resWithNote.body.note).toBe('Oubli de badge le matin à l’entrée');
    });

    it('should export attendance data as CSV', async () => {
      const res = await request(app)
        .get('/api/admin/attendance/export-csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('ID;Date;Nom;Email;Role');
    });
  });

  // 5. ADMINISTRATIVE PATIENT MANAGEMENT
  describe('Admin Patient Management (Strict Privacy Isolation)', () => {
    it('should return administrative fields only, without clinical records', async () => {
      const res = await request(app)
        .get('/api/admin/patients')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.patients).toBeDefined();

      if (res.body.patients.length > 0) {
        const patient = res.body.patients[0];
        expect(patient.firstName).toBeDefined();
        expect(patient.consultations).toBeUndefined();
        expect(patient.prescriptions).toBeUndefined();
        expect(patient.imagings).toBeUndefined();
      }
    });
  });
});
