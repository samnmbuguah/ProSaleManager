import { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export class AuthController {
  constructor(private userService: UserService) {}

  async register(req: Request, res: Response) {
    try {
      const { email, password, name, role } = req.body;

      // Check if user already exists
      const existingUser = await this.userService.findByEmail(email);
      if (existingUser.success) {
        return res.status(400).json({
          success: false,
          message: 'User already exists',
        });
      }

      // Create new user
      const result = await this.userService.create({
        email,
        password,
        name,
        role: 'user',
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.data!.id, role: result.data!.role },
        env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Return success without password
      const { password: _, ...userWithoutPassword } = result.data!.toJSON();
      return res.status(201).json({
        success: true,
        data: userWithoutPassword,
        message: 'User registered successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.',
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const result = await this.userService.validateCredentials(email, password);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.data!.id, role: result.data!.role },
        env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });

      // Return success without password
      const { password: _, ...userWithoutPassword } = result.data!.toJSON();
      return res.json({
        success: true,
        data: userWithoutPassword,
        message: 'Login successful',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.',
      });
    }
  }

  async logout(_req: Request, res: Response) {
    try {
      res.clearCookie('token');
      return res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed. Please try again.',
      });
    }
  }

  async checkSession(req: Request, res: Response) {
    try {
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Please log in to continue',
        });
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: number };
      const result = await this.userService.findById(decoded.userId);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
        });
      }

      const { password: _, ...userWithoutPassword } = result.data!.toJSON();
      return res.json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. Please log in again.',
      });
    }
  }
} 