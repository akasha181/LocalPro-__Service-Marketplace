import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '../types';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import mongoose from 'mongoose';

interface AuthenticatedSocket extends Socket {
  user?: AuthTokenPayload;
}

export const setupSocketHandlers = (io: SocketIOServer): void => {
  // Authentication middleware for socket connections
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'localpro-super-secret-jwt-key'
      ) as AuthTokenPayload;
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.userId;
    if (userId) {
      // User joins their personal room for direct notifications/messages
      socket.join(`user:${userId}`);
    }

    // Join a specific conversation room
    socket.on('join_conversation', ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    // Leave a specific conversation room
    socket.on('leave_conversation', ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Handle typing status
    socket.on('typing', ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping,
      });
    });

    // Handle sending message
    socket.on(
      'send_message',
      async ({
        conversationId,
        recipientId,
        text,
      }: {
        conversationId: string;
        recipientId: string;
        text: string;
      }) => {
        try {
          if (!userId || !text?.trim() || !conversationId) return;

          // Create and save message
          const message = await Message.create({
            conversationId: new mongoose.Types.ObjectId(conversationId),
            sender: new mongoose.Types.ObjectId(userId),
            recipient: new mongoose.Types.ObjectId(recipientId),
            text: text.trim(),
          });

          // Update conversation lastMessage
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            updatedAt: new Date(),
          });

          const populatedMessage = await Message.findById(message._id).populate(
            'sender',
            'name avatar'
          );

          // Emit to both conversation room and recipient personal room
          io.to(`conversation:${conversationId}`).emit('new_message', populatedMessage);
          io.to(`user:${recipientId}`).emit('message_received', populatedMessage);
        } catch (error) {
          console.error('[Socket] Error handling send_message:', error);
          socket.emit('error', { message: 'Failed to deliver message' });
        }
      }
    );

    socket.on('disconnect', () => {
      // Socket automatically handles room departure
    });
  });
};