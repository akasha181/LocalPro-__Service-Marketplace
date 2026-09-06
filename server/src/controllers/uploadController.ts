import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { uploadMedia, deleteMedia } from '../services/cloudinaryService';
import { User } from '../models/User';
import { Professional } from '../models/Professional';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export const uploadImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { image, folder = 'localpro' } = req.body;
    if (!image) {
      throw new AppError('Base64 image data or URL is required', 400);
    }

    const { url, publicId } = await uploadMedia(image, folder);
    sendResponse(res, 200, true, { url, publicId }, 'Image uploaded successfully');
  } catch (err) {
    next(err);
  }
};

export const updateAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { image } = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Unauthorized', 401);
    if (!image) throw new AppError('Image is required', 400);

    const { url } = await uploadMedia(image, 'localpro/avatars');
    const user = await User.findByIdAndUpdate(userId, { avatar: url }, { new: true });

    sendResponse(res, 200, true, { avatar: url, user }, 'Avatar updated successfully');
  } catch (err) {
    next(err);
  }
};

export const addPortfolioItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { title, description, image } = req.body;

    if (!title || !image) {
      throw new AppError('Title and image are required for portfolio items', 400);
    }

    const pro = await Professional.findOne({ userId });
    if (!pro) throw new AppError('Professional profile not found', 404);

    const { url } = await uploadMedia(image, 'localpro/portfolios');

    pro.portfolio.push({
      title,
      imageUrl: url,
      description,
    });

    await pro.save();

    sendResponse(res, 201, true, { portfolio: pro.portfolio }, 'Portfolio item added successfully');
  } catch (err) {
    next(err);
  }
};
