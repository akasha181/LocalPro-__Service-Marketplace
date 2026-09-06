import { Router } from 'express';
import { createReview, getProReviews } from '../controllers/reviewController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/pro/:professionalId', getProReviews);
router.post('/', authenticate, createReview);

export default router;
