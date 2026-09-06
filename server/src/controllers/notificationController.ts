import { Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/appError';
import { AuthRequest } from '../types';

export const getMyNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipientId: req.user.userId }).sort({ createdAt: -1 }).limit(20),
      Notification.countDocuments({ recipientId: req.user.userId, isRead: false }),
    ]);

    sendResponse(res, 200, true, { notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: req.user.userId },
      { isRead: true },
      { new: true }
    );

    sendResponse(res, 200, true, { notification });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    await Notification.updateMany({ recipientId: req.user.userId, isRead: false }, { isRead: true });

    sendResponse(res, 200, true, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};
