import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import jwt from 'jsonwebtoken';
import env from '../config/env';

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
        role,
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
        message: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await this.userService.validateCredentials(email, password);
      if (!result.success) {
        return res.status(401).json(result);
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
      return res.json({
        success: true,
        data: userWithoutPassword,
        message: 'Login successful',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      });
    }
  }

  async logout(_req: Request, res: Response) {
    res.clearCookie('token');
    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  async checkSession(req: Request, res: Response) {
    try {
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No session found',
        });
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: number };
      const result = await this.userService.findById(decoded.userId);

      if (!result.success) {
        return res.status(401).json(result);
      }

      const { password: _, ...userWithoutPassword } = result.data!.toJSON();
      return res.json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session',
      });
    }
  }
} 