import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";
import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/api-error.js';
import { catchAsync } from '../utils/catch-async.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for general API endpoints
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Get token from cookie
  const token = req.cookies.token;

  if (!token) {
    throw new ApiError(401, 'Not authenticated');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number };

    // Get user from token
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new ApiError(401, 'User is inactive');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, 'Not authenticated');
  }
});

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Not authorized');
    }

    next();
  };
};
