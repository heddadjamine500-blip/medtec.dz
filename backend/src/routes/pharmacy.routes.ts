import { Router } from 'express';
import { 
  getInventory, 
  addInventoryItem, 
  updateInventoryItem,
  deleteInventoryItem,
  updateStock, 
  getOrders, 
  createOrder, 
  updateOrderStatus 
} from '../controllers/pharmacy.controller';
import { authenticateJWT, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

// Inventory
router.get('/inventory', requireRoles(['DOCTOR', 'PATIENT', 'PHARMACY', 'ADMIN']), getInventory);
router.post('/inventory', requireRoles(['PHARMACY', 'ADMIN']), addInventoryItem);
router.put('/inventory/:id', requireRoles(['PHARMACY', 'ADMIN']), updateInventoryItem);
router.delete('/inventory/:id', requireRoles(['PHARMACY', 'ADMIN']), deleteInventoryItem);
router.patch('/inventory/:id/stock', requireRoles(['PHARMACY', 'ADMIN']), updateStock);

// Orders
router.get('/orders', requireRoles(['PATIENT', 'PHARMACY', 'ADMIN']), getOrders);
router.post('/orders', requireRoles(['PATIENT', 'ADMIN']), createOrder);
router.patch('/orders/:id/status', requireRoles(['PHARMACY', 'ADMIN']), updateOrderStatus);

export default router;
