import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export const getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    sendResponse(res, 200, true, { categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, icon, description } = req.body;
    if (!name) {
      throw new AppError('Category name is required', 400);
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existing = await Category.findOne({ slug });
    if (existing) {
      throw new AppError('Category with this name already exists', 409);
    }

    const category = await Category.create({ name, slug, icon, description });
    sendResponse(res, 201, true, { category }, 'Category created successfully');
  } catch (error) {
    next(error);
  }
};
