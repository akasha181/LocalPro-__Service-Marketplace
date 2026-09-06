import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { Professional } from './Professional';

export interface IReview extends Document {
  bookingId: Types.ObjectId;
  customerId: Types.ObjectId;
  professionalId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    professionalId: {
      type: Schema.Types.ObjectId,
      ref: 'Professional',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [5, 'Comment must be at least 5 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  { timestamps: true }
);

// Static method to recalculate professional rating
ReviewSchema.statics.recalculateProRating = async function (professionalId: Types.ObjectId) {
  const stats = await this.aggregate([
    { $match: { professionalId } },
    {
      $group: {
        _id: '$professionalId',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Professional.findByIdAndUpdate(professionalId, {
      rating: Math.round(stats[0].avgRating * 100) / 100,
      reviewCount: stats[0].totalReviews,
    });
  } else {
    await Professional.findByIdAndUpdate(professionalId, {
      rating: 0,
      reviewCount: 0,
    });
  }
};

ReviewSchema.post('save', async function () {
  await (this.constructor as any).recalculateProRating(this.professionalId);
});

export const Review = mongoose.model<IReview>('Review', ReviewSchema) as Model<IReview> & {
  recalculateProRating(professionalId: Types.ObjectId): Promise<void>;
};
