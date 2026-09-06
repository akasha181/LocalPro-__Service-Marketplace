import { Router } from 'express';
import { getServices, createService, updateService, deleteService } from '../controllers/serviceController';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getServices);
router.post('/', authenticate, authorizeRoles('professional'), createService);
router.put('/:id', authenticate, authorizeRoles('professional'), updateService);
router.delete('/:id', authenticate, authorizeRoles('professional'), deleteService);

export default router;
