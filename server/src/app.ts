import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import professionalRoutes from './routes/professionalRoutes';
import serviceRoutes from './routes/serviceRoutes';
import bookingRoutes from './routes/bookingRoutes';
import adminRoutes from './routes/adminRoutes';
import reviewRoutes from './routes/reviewRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import notificationRoutes from './routes/notificationRoutes';
import chatRoutes from './routes/chatRoutes';
import paymentRoutes from './routes/paymentRoutes';
import uploadRoutes from './routes/uploadRoutes';
import { setupSocketHandlers } from './services/socketService';
import { errorHandler } from './middleware/errorMiddleware';
import { AppError } from './utils/appError';
import { sendResponse } from './utils/response';

const app = express();
const server = http.createServer(app);

// Socket.IO instance
export const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Connect to Database
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Security & Utility Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  sendResponse(res, 200, true, {
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }, 'LocalPro API is healthy and operational');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/uploads', uploadRoutes);

// Initialize Socket.IO event listeners
setupSocketHandlers(io);

// Catch-all route for unhandled endpoints
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Centralized error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[Server] LocalPro API running on http://localhost:${PORT}`);
  });
}

export { app, server };
