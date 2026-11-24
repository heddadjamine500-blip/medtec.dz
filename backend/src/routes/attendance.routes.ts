import { Router } from 'express';
import { authenticateJWT, requireRoles } from '../middlewares/auth.middleware';
import {
  clockIn,
  clockOut,
  getMyAttendances,
  getMyAttendanceStatus,
} from '../controllers/attendance.controller';

const router = Router();

// DOCTOR and EMPLOYEE can use attendance self clock-in/out
router.use(authenticateJWT);
router.use(requireRoles(['DOCTOR', 'EMPLOYEE']));

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/status', getMyAttendanceStatus);
router.get('/me', getMyAttendances);

export default router;
