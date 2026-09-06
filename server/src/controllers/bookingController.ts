import { Request, Response, NextFunction } from 'express';
import { Booking, BookingStatus } from '../models/Booking';
import { Service } from '../models/Service';
import { Professional } from '../models/Professional';
import { checkSlotConflict, getAvailableSlotsForDate } from '../services/availabilityService';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/appError';
import { AuthRequest } from '../types';
import { io } from '../app';

export const getProAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { professionalId } = req.params;
    const { date } = req.query;

    if (!date) {
      throw new AppError('Date query parameter (YYYY-MM-DD) is required', 400);
    }

    const slots = await getAvailableSlotsForDate(String(professionalId), String(date));
    sendResponse(res, 200, true, { date, slots });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { professionalId, serviceId, date, startTime, notes } = req.body;

    if (!professionalId || !serviceId || !date || !startTime) {
      throw new AppError('Professional, service, date, and startTime are required', 400);
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) throw new AppError('Selected service not found', 404);

    // Calculate end time based on duration (default 60 mins if not specified)
    const durationMinutes = service.durationMinutes || 60;
    const [sHour, sMin] = startTime.split(':').map(Number);
    const startTotalMins = sHour * 60 + sMin;
    const endTotalMins = startTotalMins + durationMinutes;
    const eHour = Math.floor(endTotalMins / 60).toString().padStart(2, '0');
    const eMin = (endTotalMins % 60).toString().padStart(2, '0');
    const endTime = `${eHour}:${eMin}`;

    const dateStr = date.split('T')[0];
    const startDateTime = new Date(`${dateStr}T${startTime}:00.000Z`);
    const endDateTime = new Date(`${dateStr}T${endTime}:00.000Z`);

    // Strict Double-Booking Prevention
    const hasConflict = await checkSlotConflict(professionalId, startDateTime, endDateTime);
    if (hasConflict) {
      throw new AppError(
        'Double-booking prevented: This professional is already booked for this time window. Please select another slot.',
        409
      );
    }

    const booking = await Booking.create({
      customerId: req.user.userId,
      professionalId,
      serviceId,
      date: new Date(dateStr),
      startTime,
      endTime,
      startDateTime,
      endDateTime,
      totalPrice: service.price,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      notes,
    });

    // Populate for response
    const populated = await Booking.findById(booking._id)
      .populate('customerId', 'name email phone avatar')
      .populate('professionalId')
      .populate('serviceId', 'title description price durationMinutes');

    // Real-time socket notification to the professional
    try {
      io.to(`pro:${professionalId}`).emit('new_booking_request', populated);
    } catch (socketErr) {
      console.warn('Socket notification dispatch failed', socketErr);
    }

    sendResponse(res, 201, true, { booking: populated }, 'Booking request submitted successfully');
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    let filter: any = {};

    if (req.user.role === 'customer') {
      filter.customerId = req.user.userId;
    } else if (req.user.role === 'professional') {
      const pro = await Professional.findOne({ userId: req.user.userId });
      if (!pro) throw new AppError('Professional profile not found', 404);
      filter.professionalId = pro._id;
    }

    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email phone avatar')
      .populate({
        path: 'professionalId',
        populate: { path: 'userId', select: 'name email avatar phone' },
      })
      .populate('serviceId', 'title description price durationMinutes')
      .sort({ createdAt: -1 });

    sendResponse(res, 200, true, { bookings });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses: BookingStatus[] = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const booking = await Booking.findById(id);
    if (!booking) throw new AppError('Booking not found', 404);

    // Permission checks
    if (req.user.role === 'customer') {
      if (booking.customerId.toString() !== req.user.userId) {
        throw new AppError('Forbidden: Not your booking', 403);
      }
      if (status !== 'CANCELLED') {
        throw new AppError('Customers can only cancel bookings', 403);
      }
    } else if (req.user.role === 'professional') {
      const pro = await Professional.findOne({ userId: req.user.userId });
      if (!pro || booking.professionalId.toString() !== pro._id.toString()) {
        throw new AppError('Forbidden: Not your appointment', 403);
      }
    }

    booking.status = status;
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('customerId', 'name email phone avatar')
      .populate('professionalId')
      .populate('serviceId', 'title price');

    // Notify customer in real-time
    try {
      io.to(`user:${booking.customerId}`).emit('booking_status_updated', populated);
    } catch (socketErr) {
      console.warn('Socket emit error', socketErr);
    }

    sendResponse(res, 200, true, { booking: populated }, `Booking status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};
