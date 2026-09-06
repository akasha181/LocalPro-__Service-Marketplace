import { Router } from 'express';
import {
  getProfessionals,
  getProfessionalById,
  updateOwnProfile,
  getOwnProfile,
  getRecommendations,
} from '../controllers/professionalController';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getProfessionals);
router.get('/recommendations', getRecommendations);
router.get('/profile/me', authenticate, authorizeRoles('professional'), getOwnProfile);
router.put('/profile', authenticate, authorizeRoles('professional'), updateOwnProfile);
router.get('/:id', getProfessionalById);

export default router;
