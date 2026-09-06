import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Professional } from '../models/Professional';
import { Booking } from '../models/Booking';
import { Category } from '../models/Category';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export const getAdminStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalUsers, totalPros, pendingApprovals, totalBookings, totalRevenueAgg] = await Promise.all([
      User.countDocuments(),
      Professional.countDocuments({ isApproved: true }),
      Professional.countDocuments({ isApproved: false }),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: { $in: ['CONFIRMED', 'COMPLETED'] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    sendResponse(res, 200, true, {
      stats: {
        totalUsers,
        totalPros,
        pendingApprovals,
        totalBookings,
        totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, role } = req.query;
    const filter: any = {};

    if (role && role !== 'ALL') {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    sendResponse(res, 200, true, { users });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isActive = !user.isActive;
    await user.save();

    sendResponse(res, 200, true, { user }, `User status updated to ${user.isActive ? 'Active' : 'Suspended'}`);
  } catch (error) {
    next(error);
  }
};

export const getAdminProfessionals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.query; // 'pending' | 'approved' | 'all'
    const filter: any = {};

    if (status === 'pending') filter.isApproved = false;
    if (status === 'approved') filter.isApproved = true;

    const professionals = await Professional.find(filter)
      .populate('userId', 'name email avatar phone isActive')
      .populate('category', 'name slug icon')
      .sort({ createdAt: -1 });

    sendResponse(res, 200, true, { professionals });
  } catch (error) {
    next(error);
  }
};

export const updateProApproval = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (isApproved === undefined) {
      throw new AppError('isApproved boolean is required', 400);
    }

    const professional = await Professional.findByIdAndUpdate(
      id,
      { isApproved: Boolean(isApproved) },
      { new: true }
    )
      .populate('userId', 'name email avatar phone')
      .populate('category', 'name slug icon');

    if (!professional) {
      throw new AppError('Professional not found', 404);
    }

    sendResponse(
      res,
      200,
      true,
      { professional },
      `Professional ${isApproved ? 'Approved' : 'Rejected'} successfully`
    );
  } catch (error) {
    next(error);
  }
};
