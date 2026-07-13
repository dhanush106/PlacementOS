import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Subject from '../src/models/Subject.js';
import Habit from '../src/models/Habit.js';

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/trackforge_test';

beforeAll(async () => {
  // Connect to test database
  try {
    await mongoose.connect(TEST_MONGO_URI, { serverSelectionTimeoutMS: 1500 });
  } catch (err) {
    console.warn('MongoDB not running. Integration tests will be bypassed.');
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.connection.close();
  }
});

describe('Authentication Flow Integration Tests', () => {
  // Skip tests if database is not connected
  const runTests = () => mongoose.connection.readyState === 1;

  test('POST /api/auth/register - Should register a new user successfully', async () => {
    if (!runTests()) return;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
        college: 'Test College',
        targetRole: 'SDE'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.email).toBe('test@example.com');
    expect(res.body.data.verificationEmailSent).toBe(true);

    const user = await User.findOne({ email: 'test@example.com' });
    expect(user).toBeDefined();
    expect(user.emailVerified).toBe(false);
    expect(user.verificationCode).toBeDefined();
  });

  test('POST /api/auth/register - Should prevent registration with existing email', async () => {
    if (!runTests()) return;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        name: 'Duplicate User',
        password: 'Password123!',
        college: 'Other College',
        targetRole: 'SDE'
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('POST /api/auth/verify-email - Should verify email and seed collections', async () => {
    if (!runTests()) return;

    const user = await User.findOne({ email: 'test@example.com' });
    const otp = user.verificationCode;

    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({
        email: 'test@example.com',
        otp
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.verified).toBe(true);

    // Verify user is active in DB
    const updatedUser = await User.findOne({ email: 'test@example.com' });
    expect(updatedUser.emailVerified).toBe(true);

    // Verify default subjects seeded
    const subjects = await Subject.find({ userId: updatedUser._id });
    expect(subjects.length).toBe(4); // DBMS, OS, CN, COA

    // Verify default habits seeded
    const habits = await Habit.find({ userId: updatedUser._id });
    expect(habits.length).toBe(4);
  });

  test('POST /api/auth/login - Should log in successfully and return JWT tokens', async () => {
    if (!runTests()) return;

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.email).toBe('test@example.com');
  });

  test('POST /api/auth/login - Should fail with incorrect password', async () => {
    if (!runTests()) return;

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
