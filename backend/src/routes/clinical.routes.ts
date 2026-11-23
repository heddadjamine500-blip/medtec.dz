import { Router } from 'express';
import { 
  getDoctors, 
  getPatients, 
  getStats, 
  getAllUsers, 
  updateUser, 
  deleteUser,
  getConsultations,
  createConsultation
} from '../controllers/clinical.controller';
import { authenticateJWT, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

// Clinical data
router.get('/doctors', requireRoles(['PATIENT', 'DOCTOR', 'PHARMACY', 'ADMIN']), getDoctors);
router.get('/patients', requireRoles(['DOCTOR', 'ADMIN']), getPatients);
router.get('/stats', requireRoles(['DOCTOR', 'ADMIN']), getStats);

// Consultations
router.get('/consultations', requireRoles(['PATIENT', 'DOCTOR', 'ADMIN']), getConsultations);
router.post('/consultations', requireRoles(['DOCTOR', 'ADMIN']), createConsultation);

// Admin Users CRUD
router.get('/users', requireRoles(['ADMIN']), getAllUsers);
router.put('/users/:id', requireRoles(['ADMIN']), updateUser);
router.delete('/users/:id', requireRoles(['ADMIN']), deleteUser);

export default router;
