import { Router } from 'express';
import { 
  getDoctors, 
  getPatients, 
  getStats, 
  getAllUsers, 
  updateUser, 
  deleteUser,
  getConsultations,
  createConsultation,
  getImagings,
  createImaging,
  deleteImaging
} from '../controllers/clinical.controller';
import { authenticateJWT, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

// Clinical data
router.get('/doctors', requireRoles(['PATIENT', 'DOCTOR', 'PHARMACY', 'ADMIN']), getDoctors);
router.get('/patients', requireRoles(['DOCTOR']), getPatients);
router.get('/stats', requireRoles(['DOCTOR', 'ADMIN']), getStats);

// Consultations (Clinique uniquement - ADMIN exclu)
router.get('/consultations', requireRoles(['PATIENT', 'DOCTOR']), getConsultations);
router.post('/consultations', requireRoles(['DOCTOR']), createConsultation);

// Medical Imaging (Radiographies, Scanners, IRM - Clinique uniquement - ADMIN exclu)
router.get('/imaging', requireRoles(['PATIENT', 'DOCTOR']), getImagings);
router.post('/imaging', requireRoles(['PATIENT', 'DOCTOR']), createImaging);
router.delete('/imaging/:id', requireRoles(['PATIENT', 'DOCTOR']), deleteImaging);

// Admin Users CRUD
router.get('/users', requireRoles(['ADMIN']), getAllUsers);
router.put('/users/:id', requireRoles(['ADMIN']), updateUser);
router.delete('/users/:id', requireRoles(['ADMIN']), deleteUser);

export default router;
