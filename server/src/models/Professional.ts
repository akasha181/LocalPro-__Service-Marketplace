import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IPortfolioItem {
  title: string;
  imageUrl: string;
  description?: string;
}

export interface IProfessional extends Document {
  userId: Types.ObjectId;
  category: Types.ObjectId;
  title: string;
  bio: string;
  hourlyRate: number;
  experienceYears: number;
  location: {
    address?: string;
    city: string;
    state: string;
    zipCode?: string;
    country: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  isApproved: boolean;
  rating: number;
  reviewCount: number;
  portfolio: IPortfolioItem[];
  createdAt: Date;
  updatedAt: Date;
}

const ProfessionalSchema = new Schema<IProfessional>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Professional title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    bio: {
      type: String,
      required: [true, 'Bio is required'],
      trim: true,
      maxlength: [2000, 'Bio cannot exceed 2000 characters'],
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [5, 'Hourly rate must be at least $5'],
      index: true,
    },
    experienceYears: {
      type: Number,
      default: 1,
      min: 0,
    },
    location: {
      address: { type: String, trim: true },
      city: { type: String, required: true, trim: true, index: true },
      state: { type: String, required: true, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, default: 'USA' },
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    rating: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 5,
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    portfolio: [
      {
        title: { type: String, required: true },
        imageUrl: { type: String, required: true },
        description: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Compound index for optimized catalog queries
ProfessionalSchema.index({ category: 1, isApproved: 1, rating: -1 });

export const Professional: Model<IProfessional> = mongoose.model<IProfessional>(
  'Professional',
  ProfessionalSchema
);
