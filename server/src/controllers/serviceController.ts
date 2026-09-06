import { Request, Response, NextFunction } from 'express';
import { Service } from '../models/Service';
import { Professional } from '../models/Professional';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/appError';
import { AuthRequest } from '../types';

export const getServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { professionalId, category } = req.query;
    const filter: any = { isActive: true };

    if (professionalId) filter.professionalId = professionalId;
    if (category) filter.category = category;

    const services = await Service.find(filter)
      .populate('category', 'name slug icon')
      .populate('professionalId', 'title hourlyRate rating');

    sendResponse(res, 200, true, { services });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const pro = await Professional.findOne({ userId: req.user.userId });
    if (!pro) {
      throw new AppError('Professional profile required before creating services', 400);
    }

    const { title, description, price, durationMinutes, category } = req.body;
    if (!title || !description || !price) {
      throw new AppError('Title, description, and price are required', 400);
    }

    const service = await Service.create({
      professionalId: pro._id,
      category: category || pro.category,
      title,
      description,
      price: Number(price),
      durationMinutes: durationMinutes ? Number(durationMinutes) : 60,
    });

    sendResponse(res, 201, true, { service }, 'Service created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const pro = await Professional.findOne({ userId: req.user.userId });
    if (!pro) throw new AppError('Forbidden', 403);

    const service = await Service.findOne({ _id: req.params.id, professionalId: pro._id });
    if (!service) throw new AppError('Service not found or unauthorized', 404);

    const { title, description, price, durationMinutes, isActive } = req.body;
    if (title) service.title = title;
    if (description) service.description = description;
    if (price !== undefined) service.price = Number(price);
    if (durationMinutes !== undefined) service.durationMinutes = Number(durationMinutes);
    if (isActive !== undefined) service.isActive = Boolean(isActive);

    await service.save();
    sendResponse(res, 200, true, { service }, 'Service updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const pro = await Professional.findOne({ userId: req.user.userId });
    if (!pro) throw new AppError('Forbidden', 403);

    const service = await Service.findOneAndDelete({ _id: req.params.id, professionalId: pro._id });
    if (!service) throw new AppError('Service not found or unauthorized', 404);

    sendResponse(res, 200, true, null, 'Service removed successfully');
  } catch (error) {
    next(error);
  }
};
