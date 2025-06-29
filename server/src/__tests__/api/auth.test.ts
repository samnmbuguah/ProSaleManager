import request from 'supertest';
import { app } from '../../index';
import User from '../../models/User';
import bcrypt from 'bcryptjs';
import { sequelize } from '../../config/database';

describe('Auth API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 if email already exists', async () => {
      await User.create({
        name: 'Existing User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'sales',
        is_active: true
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'sales'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should create a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'new@example.com',
          password: 'password123',
          role: 'sales'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'new@example.com');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'sales',
        is_active: true
      });
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return token for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;
    let user: any;

    beforeEach(async () => {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'sales',
        is_active: true
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      token = loginResponse.body.token;
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
    });

    it('should return user data with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'test@example.com');
    });
  });
}); 