import { Router } from 'express';
import { toggleFavorite, getMyFavorites, checkIsFavorite } from '../controllers/favoriteController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/toggle', authenticate, toggleFavorite);
router.get('/my', authenticate, getMyFavorites);
router.get('/check/:professionalId', authenticate, checkIsFavorite);

export default router;
