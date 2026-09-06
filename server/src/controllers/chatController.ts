import { Response } from 'express';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { AuthRequest } from '../types';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/appError';
import mongoose from 'mongoose';

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate('participants', 'name email avatar role')
    .populate('lastMessage')
    .populate('bookingId', 'scheduledDate status')
    .sort({ updatedAt: -1 });

  sendResponse(res, 200, true, { conversations });
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const conversationId = String(req.params.conversationId);

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new AppError('Invalid conversation ID', 400);
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    throw new AppError('Conversation not found or unauthorized', 404);
  }

  // Mark all unread messages addressed to the requesting user as read
  await Message.updateMany(
    {
      conversationId,
      recipient: userId,
      isRead: false,
    },
    { isRead: true }
  );

  const messages = await Message.find({ conversationId })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 });

  sendResponse(res, 200, true, { messages });
};

export const startOrGetConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { recipientId, bookingId } = req.body;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
    throw new AppError('Valid recipientId is required', 400);
  }

  if (userId === recipientId) {
    throw new AppError('Cannot start a conversation with yourself', 400);
  }

  let query: any = {
    participants: { $all: [userId, recipientId] },
  };

  if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
    query.bookingId = bookingId;
  }

  let conversation = await Conversation.findOne(query)
    .populate('participants', 'name email avatar role')
    .populate('lastMessage');

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, recipientId],
      ...(bookingId && { bookingId }),
    });

    conversation = await Conversation.findById(conversation._id).populate(
      'participants',
      'name email avatar role'
    );
  }

  sendResponse(res, 200, true, { conversation });
};