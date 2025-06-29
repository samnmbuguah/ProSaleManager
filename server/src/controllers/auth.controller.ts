import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/api-error.js';
import { catchAsync } from '../utils/catch-async.js';

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(400, 'User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'sales',
    is_active: true
  });

  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  // Return user data (excluding password)
  const userData = user.toJSON();
  delete userData.password;

  res.status(201).json({
    success: true,
    data: userData
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  // Find user
  const user = await User.findOne({ where: { email: email.trim() } });
  
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Check if user is active
  if (!user.is_active) {
    throw new ApiError(401, 'Account is inactive');
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Update last login
  await user.update({ last_login: new Date() });

  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  // Return user data (excluding password)
  const userData = user.toJSON();
  delete userData.password;

  console.log('Login successful for:', email);
  res.json({
    success: true,
    data: userData
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  // If no user is attached to the request, return unauthenticated
  if (!req.user) {
    return res.json({
      success: true,
      data: null,
      authenticated: false
    });
  }
  
  // Return user data (excluding password)
  const userData = req.user.toJSON();
  delete userData.password;

  res.json({
    success: true,
    data: userData,
    authenticated: true
  });
});
