import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../app';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Professional } from '../models/Professional';
import { Service } from '../models/Service';
import { Booking } from '../models/Booking';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Phase 9 — Integration Test Suite', () => {
  describe('GET /api/health', () => {
    it('should return 200 operational health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('online');
    });
  });

  describe('Authentication & RBAC Flows', () => {
    it('should register a new customer successfully', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Jane Customer',
        email: 'jane@example.com',
        password: 'password123',
        role: 'customer',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.data.user.role).toBe('customer');
    });

    it('should login an existing user with valid credentials', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Login Tester',
        email: 'tester@example.com',
        password: 'password123',
        role: 'customer',
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'tester@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Login Tester 2',
        email: 'tester2@example.com',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'tester2@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Marketplace Categories & AI Recommendations', () => {
    it('should return categories', async () => {
      await Category.create({
        name: 'Plumbing Services',
        slug: 'plumbing',
        icon: 'Wrench',
        description: 'Pipes and fixtures',
      });

      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categories.length).toBe(1);
      expect(res.body.data.categories[0].slug).toBe('plumbing');
    });

    it('should calculate and return AI recommendations', async () => {
      const category = await Category.create({
        name: 'Electrical',
        slug: 'electrical',
        icon: 'Zap',
      });

      const user = await User.create({
        name: 'Master Electrician',
        email: 'electrician@example.com',
        password: 'password123',
        role: 'professional',
      });

      await Professional.create({
        userId: user._id,
        category: category._id,
        title: 'Master Electrician Pro',
        bio: 'Over 15 years certified commercial and residential wiring experience.',
        hourlyRate: 75,
        experienceYears: 15,
        location: { city: 'New York', state: 'NY', country: 'USA' },
        rating: 4.95,
        reviewCount: 28,
        isApproved: true,
      });

      const res = await request(app).get('/api/professionals/recommendations');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations.length).toBeGreaterThan(0);
      expect(res.body.data.recommendations[0].score).toBeGreaterThan(50);
      expect(res.body.data.recommendations[0].recommendationReason).toBeDefined();
    });
  });

  describe('Booking & Double-Booking Prevention', () => {
    it('should create a booking and prevent slot double-booking', async () => {
      // 1. Register customer
      const custRes = await request(app).post('/api/auth/register').send({
        name: 'Alice Customer',
        email: 'alice@example.com',
        password: 'password123',
      });
      const token = custRes.body.data.token;

      // 2. Setup pro and service
      const cat = await Category.create({ name: 'HVAC', slug: 'hvac', icon: 'Wind' });
      const proUser = await User.create({
        name: 'Bob HVAC',
        email: 'bob@example.com',
        password: 'password123',
        role: 'professional',
      });
      const pro = await Professional.create({
        userId: proUser._id,
        category: cat._id,
        title: 'HVAC Expert',
        bio: 'AC and heating repairs',
        hourlyRate: 90,
        experienceYears: 8,
        location: { city: 'Boston', state: 'MA', country: 'USA' },
        isApproved: true,
      });
      const service = await Service.create({
        professionalId: pro._id,
        category: cat._id,
        title: 'AC Tuneup',
        description: 'Complete air conditioning tuneup and diagnostic inspection.',
        price: 120,
        durationMinutes: 60,
      });

      // 3. First booking should succeed
      const date = '2026-10-15';
      const bookingRes1 = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          professionalId: pro._id,
          serviceId: service._id,
          date,
          startTime: '10:00',
        });

      expect(bookingRes1.status).toBe(201);
      expect(bookingRes1.body.success).toBe(true);

      // Confirm the booking
      await Booking.findByIdAndUpdate(bookingRes1.body.data.booking._id, {
        status: 'CONFIRMED',
      });

      // 4. Duplicate booking attempt for the exact same slot should be rejected (409 Conflict)
      const bookingRes2 = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          professionalId: pro._id,
          serviceId: service._id,
          date,
          startTime: '10:00',
        });

      expect(bookingRes2.status).toBe(409);
      expect(bookingRes2.body.success).toBe(false);
      expect(bookingRes2.body.message).toMatch(/Double-booking prevented/i);
    });
  });

  describe('Stripe Payments Endpoint Verification', () => {
    it('should create a checkout session and verify completion', async () => {
      const custRes = await request(app).post('/api/auth/register').send({
        name: 'Charlie Customer',
        email: 'charlie@example.com',
        password: 'password123',
      });
      const token = custRes.body.data.token;
      const custId = custRes.body.data.user._id;

      const cat = await Category.create({ name: 'Carpentry', slug: 'carpentry', icon: 'Hammer' });
      const proUser = await User.create({
        name: 'Dan Carpenter',
        email: 'dan@example.com',
        password: 'password123',
        role: 'professional',
      });
      const pro = await Professional.create({
        userId: proUser._id,
        category: cat._id,
        title: 'Woodworker',
        bio: 'Custom tables',
        hourlyRate: 60,
        experienceYears: 5,
        location: { city: 'Austin', state: 'TX', country: 'USA' },
        isApproved: true,
      });
      const service = await Service.create({
        professionalId: pro._id,
        category: cat._id,
        title: 'Custom Shelf',
        description: 'Handcrafted custom floating shelf installation.',
        price: 150,
        durationMinutes: 60,
      });

      const dateStr = '2026-11-20';
      const booking = await Booking.create({
        customerId: custId,
        professionalId: pro._id,
        serviceId: service._id,
        date: new Date(dateStr),
        startTime: '14:00',
        endTime: '15:00',
        startDateTime: new Date(`${dateStr}T14:00:00.000Z`),
        endDateTime: new Date(`${dateStr}T15:00:00.000Z`),
        totalPrice: 150,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      });

      // Request checkout session
      const sessionRes = await request(app)
        .post('/api/payments/create-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ bookingId: booking._id.toString() });

      expect(sessionRes.status).toBe(200);
      expect(sessionRes.body.success).toBe(true);
      expect(sessionRes.body.data.sessionId).toBeDefined();

      // Verify payment
      const verifyRes = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bookingId: booking._id.toString(),
          sessionId: sessionRes.body.data.sessionId,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.data.booking.paymentStatus).toBe('PAID');
      expect(verifyRes.body.data.booking.status).toBe('CONFIRMED');
    });
  });
});
