import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  bookingId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
export default Conversation;