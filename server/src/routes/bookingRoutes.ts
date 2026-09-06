import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  updateBookingStatus,
  getProAvailability,
} from '../controllers/bookingController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/availability/:professionalId', getProAvailability);
router.post('/', authenticate, createBooking);
router.get('/my', authenticate, getMyBookings);
router.put('/:id/status', authenticate, updateBookingStatus);

export default router;
