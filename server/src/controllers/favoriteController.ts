import { Response, NextFunction } from 'express';
import { Favorite } from '../models/Favorite';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/appError';
import { AuthRequest } from '../types';

export const toggleFavorite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const { professionalId } = req.body;

    if (!professionalId) throw new AppError('professionalId is required', 400);

    const existing = await Favorite.findOne({
      customerId: req.user.userId,
      professionalId,
    });

    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      sendResponse(res, 200, true, { isFavorite: false }, 'Removed from favorites');
    } else {
      await Favorite.create({
        customerId: req.user.userId,
        professionalId,
      });
      sendResponse(res, 201, true, { isFavorite: true }, 'Added to favorites');
    }
  } catch (error) {
    next(error);
  }
};

export const getMyFavorites = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const favorites = await Favorite.find({ customerId: req.user.userId })
      .populate({
        path: 'professionalId',
        populate: [
          { path: 'userId', select: 'name email avatar phone' },
          { path: 'category', select: 'name slug icon' },
        ],
      })
      .sort({ createdAt: -1 });

    sendResponse(res, 200, true, { favorites });
  } catch (error) {
    next(error);
  }
};

export const checkIsFavorite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      sendResponse(res, 200, true, { isFavorite: false });
      return;
    }
    const { professionalId } = req.params;
    const favorite = await Favorite.findOne({
      customerId: req.user.userId,
      professionalId,
    });

    sendResponse(res, 200, true, { isFavorite: !!favorite });
  } catch (error) {
    next(error);
  }
};
