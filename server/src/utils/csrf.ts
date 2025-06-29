import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Store tokens in memory (in production, use Redis or similar)
const tokens = new Set<string>();

export const generateCsrfToken = (req: Request, res: Response) => {
  const token = crypto.randomBytes(32).toString('hex');
  tokens.add(token);
  
  // Set token in cookie
  res.cookie('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return token;
};

export const validateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-csrf-token'] as string;
  
  if (!token || !tokens.has(token)) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  // Remove used token
  tokens.delete(token);
  next();
};

// Clean up expired tokens periodically (every hour)
setInterval(() => {
  tokens.clear();
}, 60 * 60 * 1000); 