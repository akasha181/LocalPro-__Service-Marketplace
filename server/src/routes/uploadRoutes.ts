import { Router } from 'express';
import { uploadImage, updateAvatar, addPortfolioItem } from '../controllers/uploadController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', uploadImage);
router.put('/avatar', updateAvatar);
router.post('/portfolio', addPortfolioItem);

export default router;
