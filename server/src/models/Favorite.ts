import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IFavorite extends Document {
  customerId: Types.ObjectId;
  professionalId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
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
  },
  { timestamps: true }
);

// Compound unique index so customer cannot favorite the same pro twice
FavoriteSchema.index({ customerId: 1, professionalId: 1 }, { unique: true });

export const Favorite: Model<IFavorite> = mongoose.model<IFavorite>('Favorite', FavoriteSchema);
