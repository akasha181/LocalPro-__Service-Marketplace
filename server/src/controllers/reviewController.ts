import { Request, Response, NextFunction } from 'express';
import { Review } from '../models/Review';
import { Booking } from '../models/Booking';
import { Notification } from '../models/Notification';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/appError';
import { AuthRequest } from '../types';
import { io } from '../app';

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { bookingId, rating, comment } = req.body;
    if (!bookingId || !rating || !comment) {
      throw new AppError('Booking ID, rating (1-5), and comment are required', 400);
    }

    const booking = await Booking.findById(bookingId).populate('professionalId');
    if (!booking) throw new AppError('Booking not found', 404);

    if (booking.customerId.toString() !== req.user.userId) {
      throw new AppError('You can only review your own appointments', 403);
    }

    if (booking.status !== 'COMPLETED') {
      throw new AppError('Reviews can only be submitted for COMPLETED appointments', 400);
    }

    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      throw new AppError('You have already submitted a review for this booking', 409);
    }

    const review = await Review.create({
      bookingId,
      customerId: req.user.userId,
      professionalId: booking.professionalId._id,
      rating: Number(rating),
      comment,
    });

    const populatedReview = await Review.findById(review._id).populate(
      'customerId',
      'name avatar'
    );

    // Send notification to professional
    try {
      const proDoc = booking.professionalId as any;
      if (proDoc?.userId) {
        await Notification.create({
          recipientId: proDoc.userId,
          title: 'New Verified Review',
          message: `${req.user.email} gave you a ${rating}-star rating: "${comment.slice(0, 50)}..."`,
          type: 'SYSTEM',
          link: `/professionals/${proDoc._id}`,
        });

        io.to(`user:${proDoc.userId}`).emit('new_notification');
      }
    } catch (notifErr) {
      console.warn('Review notification error', notifErr);
    }

    sendResponse(res, 201, true, { review: populatedReview }, 'Review submitted successfully');
  } catch (error) {
    next(error);
  }
};

export const getProReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { professionalId } = req.params;

    const reviews = await Review.find({ professionalId })
      .populate('customerId', 'name avatar')
      .sort({ createdAt: -1 });

    sendResponse(res, 200, true, { reviews });
  } catch (error) {
    next(error);
  }
};
