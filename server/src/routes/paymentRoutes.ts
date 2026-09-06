import { Router } from 'express';
import { createPaymentSession, verifyPayment } from '../controllers/paymentController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/create-session', createPaymentSession);
router.post('/verify', verifyPayment);

export default router;
