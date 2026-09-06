import mongoose from 'mongoose';
import { seedInitialData } from '../utils/seed';

let mongoMemoryServer: any = null;

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (mongoUri && !mongoUri.includes('127.0.0.1') && !mongoUri.includes('localhost')) {
    try {
      const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[MongoDB] Connected to Cloud Cluster: ${conn.connection.host}`);
      await seedInitialData();
      return;
    } catch (err: any) {
      console.warn(`[MongoDB] Cloud connection failed: ${err.message}. Attempting fallback...`);
    }
  }

  // Try local MongoDB first, otherwise fallback to in-memory server
  try {
    const localUri = mongoUri || 'mongodb://127.0.0.1:27017/localpro';
    const conn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[MongoDB] Connected to local database: ${conn.connection.host}`);
    await seedInitialData();
  } catch (localErr) {
    console.log('[MongoDB] Local MongoDB daemon not detected. Starting embedded In-Memory MongoDB engine...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[MongoDB] Embedded In-Memory Database active: ${conn.connection.host}`);
      await seedInitialData();
    } catch (memErr) {
      console.error('[MongoDB] Failed to start embedded database:', memErr);
      process.exit(1);
    }
  }
};
