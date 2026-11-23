import { Router } from 'express';
import { 
  getPrescriptions, 
  createPrescription, 
  getPrescriptionById 
} from '../controllers/prescription.controller';
import { authenticateJWT, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRoles(['DOCTOR', 'PATIENT', 'PHARMACY', 'ADMIN']), getPrescriptions);
router.post('/', requireRoles(['DOCTOR', 'ADMIN']), createPrescription);
router.get('/:id', requireRoles(['DOCTOR', 'PATIENT', 'PHARMACY', 'ADMIN']), getPrescriptionById);

export default router;
