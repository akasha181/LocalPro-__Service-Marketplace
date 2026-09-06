import { Response, NextFunction } from 'express';
import { Booking } from '../models/Booking';
import { AuthRequest } from '../types';
import { createCheckoutSession, verifyAndConfirmPayment } from '../services/stripeService';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export const createPaymentSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) throw new AppError('bookingId is required', 400);

    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email')
      .populate('serviceId', 'title');

    if (!booking) throw new AppError('Booking not found', 404);

    // Verify ownership
    if (String(booking.customerId._id) !== String(req.user?.userId)) {
      throw new AppError('Unauthorized: You can only pay for your own bookings', 403);
    }

    if (booking.paymentStatus === 'PAID') {
      throw new AppError('Booking is already paid', 400);
    }

    const serviceTitle = (booking.serviceId as any)?.title || 'LocalPro Specialist Service';
    const customerEmail = (booking.customerId as any)?.email;

    const { sessionId, sessionUrl } = await createCheckoutSession(
      booking._id.toString(),
      serviceTitle,
      booking.totalPrice,
      customerEmail
    );

    sendResponse(res, 200, true, { sessionId, sessionUrl });
  } catch (err) {
    next(err);
  }
};

export const verifyPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId, sessionId } = req.body;
    if (!bookingId || !sessionId) {
      throw new AppError('bookingId and sessionId are required', 400);
    }

    const isSuccess = await verifyAndConfirmPayment(bookingId, sessionId);

    if (isSuccess) {
      const updatedBooking = await Booking.findById(bookingId)
        .populate('customerId', 'name email')
        .populate('professionalId')
        .populate('serviceId');

      sendResponse(res, 200, true, { booking: updatedBooking }, 'Payment verified and booking confirmed!');
    } else {
      throw new AppError('Payment verification was not confirmed by Stripe', 400);
    }
  } catch (err) {
    next(err);
  }
};
