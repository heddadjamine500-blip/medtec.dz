import { Router } from 'express';
import { authenticateJWT, requireRoles } from '../middlewares/auth.middleware';
import { validateBody } from '../utils/validation';

// Controllers
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomBookings,
  createRoomBooking,
  cancelRoomBooking,
  roomSchema,
  updateRoomSchema,
  roomBookingSchema,
} from '../controllers/room.controller';

import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  createEmployeeSchema,
  updateEmployeeSchema,
} from '../controllers/employee.controller';

import {
  getAdminDoctors,
  createAdminDoctor,
  updateAdminDoctor,
  createDoctorSchema,
  updateDoctorSchema,
} from '../controllers/admin-doctor.controller';

import {
  getAdminPatients,
  getAdminPatientById,
  updateAdminPatient,
  updatePatientAdminSchema,
} from '../controllers/admin-patient.controller';

import {
  getAdminAttendances,
  correctAttendance,
  markAbsence,
  getAttendanceSummary,
  exportAttendanceCSV,
  getWorkSchedules,
  updateWorkSchedules,
  correctionSchema,
  markAbsenceSchema,
  updateWorkSchedulesSchema,
} from '../controllers/attendance.controller';

const router = Router();

// Strict security: all /api/admin routes require ADMIN role
router.use(authenticateJWT);
router.use(requireRoles(['ADMIN']));

// --- Salles (Rooms) & Réservations ---
router.get('/rooms', getRooms);
router.post('/rooms', validateBody(roomSchema), createRoom);
router.get('/rooms/bookings', getRoomBookings);
router.post('/rooms/bookings', validateBody(roomBookingSchema), createRoomBooking);
router.put('/rooms/bookings/:id/cancel', cancelRoomBooking);
router.get('/rooms/:id', getRoomById);
router.put('/rooms/:id', validateBody(updateRoomSchema), updateRoom);
router.delete('/rooms/:id', deleteRoom);

// --- Employés (Employees) ---
router.get('/employees', getEmployees);
router.post('/employees', validateBody(createEmployeeSchema), createEmployee);
router.get('/employees/:id', getEmployeeById);
router.put('/employees/:id', validateBody(updateEmployeeSchema), updateEmployee);

// --- Médecins (Doctors) ---
router.get('/doctors', getAdminDoctors);
router.post('/doctors', validateBody(createDoctorSchema), createAdminDoctor);
router.put('/doctors/:id', validateBody(updateDoctorSchema), updateAdminDoctor);

// --- Patients (Administratif uniquement, aucune donnée médicale) ---
router.get('/patients', getAdminPatients);
router.get('/patients/:id', getAdminPatientById);
router.put('/patients/:id', validateBody(updatePatientAdminSchema), updateAdminPatient);

// --- Pointage & Horaires (Attendance) ---
router.get('/attendance', getAdminAttendances);
router.get('/attendance/summary', getAttendanceSummary);
router.get('/attendance/export-csv', exportAttendanceCSV);
router.post('/attendance/correction', validateBody(correctionSchema), correctAttendance);
router.post('/attendance/mark-absence', validateBody(markAbsenceSchema), markAbsence);
router.get('/attendance/schedules/:userId', getWorkSchedules);
router.put('/attendance/schedules/:userId', validateBody(updateWorkSchedulesSchema), updateWorkSchedules);

export default router;
