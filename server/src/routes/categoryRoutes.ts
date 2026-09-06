import { Router } from 'express';
import { getCategories, createCategory } from '../controllers/categoryController';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getCategories);
router.post('/', authenticate, authorizeRoles('admin'), createCategory);

export default router;
