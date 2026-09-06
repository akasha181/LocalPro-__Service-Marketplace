import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  toggleUserStatus,
  getAdminProfessionals,
  updateProApproval,
} from '../controllers/adminController';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// Strict Admin-only guard for all admin routes
router.use(authenticate, authorizeRoles('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/professionals', getAdminProfessionals);
router.patch('/professionals/:id/approval', updateProApproval);

export default router;
