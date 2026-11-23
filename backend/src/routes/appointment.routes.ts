import { Router } from 'express';
import { 
  getAppointments, 
  createAppointment, 
  updateAppointmentStatus, 
  deleteAppointment 
} from '../controllers/appointment.controller';
import { authenticateJWT, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRoles(['DOCTOR', 'PATIENT', 'ADMIN']), getAppointments);
router.post('/', requireRoles(['PATIENT', 'ADMIN']), createAppointment);
router.patch('/:id/status', requireRoles(['DOCTOR', 'PATIENT', 'ADMIN']), updateAppointmentStatus);
router.delete('/:id', requireRoles(['PATIENT', 'DOCTOR', 'ADMIN']), deleteAppointment);

export default router;
