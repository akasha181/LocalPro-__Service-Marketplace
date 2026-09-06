import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ITimeSlot {
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "17:00"
}

export interface IDaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  isWorking: boolean;
  slots: ITimeSlot[];
}

export interface IAvailability extends Document {
  professionalId: Types.ObjectId;
  weeklySchedule: IDaySchedule[];
  blackoutDates: Date[];
  slotDurationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySchema = new Schema<IAvailability>(
  {
    professionalId: {
      type: Schema.Types.ObjectId,
      ref: 'Professional',
      required: true,
      unique: true,
      index: true,
    },
    weeklySchedule: [
      {
        dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
        isWorking: { type: Boolean, default: true },
        slots: [
          {
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
          },
        ],
      },
    ],
    blackoutDates: [{ type: Date }],
    slotDurationMinutes: { type: Number, default: 60 },
  },
  { timestamps: true }
);

export const Availability: Model<IAvailability> = mongoose.model<IAvailability>(
  'Availability',
  AvailabilitySchema
);
