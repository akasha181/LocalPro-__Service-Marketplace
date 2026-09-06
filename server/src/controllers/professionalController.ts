import { Request, Response, NextFunction } from 'express';
import { Professional } from '../models/Professional';
import { Service } from '../models/Service';
import { Category } from '../models/Category';
import { getRecommendedProfessionals } from '../services/recommendationService';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/appError';
import { AuthRequest } from '../types';

export const getProfessionals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      minRating,
      city,
      sortBy = 'rating',
      page = '1',
      limit = '12',
    } = req.query;

    const filter: any = { isApproved: true };

    // Search by text in title or bio
    if (search) {
      filter.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { bio: { $regex: String(search), $options: 'i' } },
      ];
    }

    // Category filter by slug or ID
    if (category) {
      const categoryDoc = await Category.findOne({
        $or: [{ slug: String(category) }, { _id: category }],
      });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
      }
    }

    // Hourly rate budget filter
    if (minPrice || maxPrice) {
      filter.hourlyRate = {};
      if (minPrice) filter.hourlyRate.$gte = Number(minPrice);
      if (maxPrice) filter.hourlyRate.$lte = Number(maxPrice);
    }

    // Minimum rating filter
    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    // City location filter
    if (city) {
      filter['location.city'] = { $regex: String(city), $options: 'i' };
    }

    // Sorting
    let sortOptions: any = { rating: -1, reviewCount: -1 };
    if (sortBy === 'price_asc') sortOptions = { hourlyRate: 1 };
    if (sortBy === 'price_desc') sortOptions = { hourlyRate: -1 };
    if (sortBy === 'newest') sortOptions = { createdAt: -1 };

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [professionals, total] = await Promise.all([
      Professional.find(filter)
        .populate('userId', 'name email avatar phone')
        .populate('category', 'name slug icon')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Professional.countDocuments(filter),
    ]);

    sendResponse(res, 200, true, {
      professionals,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfessionalById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const professional = await Professional.findById(id)
      .populate('userId', 'name email avatar phone')
      .populate('category', 'name slug icon');

    if (!professional) {
      throw new AppError('Professional not found', 404);
    }

    // Fetch active services offered by this professional
    const services = await Service.find({ professionalId: professional._id, isActive: true });

    sendResponse(res, 200, true, { professional, services });
  } catch (error) {
    next(error);
  }
};

export const updateOwnProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { title, bio, hourlyRate, experienceYears, location, portfolio, category } = req.body;

    let professional = await Professional.findOne({ userId: req.user.userId });

    if (!professional) {
      // Create profile if doesn't exist yet
      if (!category || !title || !bio || !hourlyRate) {
        throw new AppError('Category, title, bio, and hourly rate are required to create a professional profile', 400);
      }
      professional = await Professional.create({
        userId: req.user.userId,
        category,
        title,
        bio,
        hourlyRate,
        experienceYears: experienceYears || 1,
        location: location || { city: 'New York', state: 'NY', country: 'USA' },
        portfolio: portfolio || [],
        isApproved: true, // auto-approve for testing/demo
      });
    } else {
      if (title) professional.title = title;
      if (bio) professional.bio = bio;
      if (hourlyRate) professional.hourlyRate = hourlyRate;
      if (experienceYears) professional.experienceYears = experienceYears;
      if (location) professional.location = location;
      if (portfolio) professional.portfolio = portfolio;
      if (category) professional.category = category;
      await professional.save();
    }

    sendResponse(res, 200, true, { professional }, 'Professional profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getOwnProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const professional = await Professional.findOne({ userId: req.user.userId })
      .populate('userId', 'name email avatar phone')
      .populate('category', 'name slug icon');

    sendResponse(res, 200, true, { professional });
  } catch (error) {
    next(error);
  }
};

export const getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, limit } = req.query;

    const recommendations = await getRecommendedProfessionals({
      category: category ? String(category) : undefined,
      limit: limit ? parseInt(String(limit), 10) : 6,
    });

    sendResponse(res, 200, true, { recommendations }, 'AI Recommendations generated');
  } catch (error) {
    next(error);
  }
};
