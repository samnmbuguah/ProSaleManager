import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Store tokens in memory (in production, use Redis or similar)
const tokens = new Set<string>();

// Only set up interval in production or when explicitly needed
let cleanupInterval: NodeJS.Timeout | null = null;

export const generateCsrfToken = (req: Request, res: Response) => {
  const token = crypto.randomBytes(32).toString("hex");
  tokens.add(token);

  // Set token in cookie
  res.cookie("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return token;
};

export const validateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["x-csrf-token"] as string;

  if (!token || !tokens.has(token)) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }

  // Don't remove token immediately - let it expire naturally
  // This prevents multiple CSRF calls for the same session
  next();
};

// Initialize cleanup interval only when needed
export const initializeCsrfCleanup = () => {
  if (!cleanupInterval && process.env.NODE_ENV === "production") {
    cleanupInterval = setInterval(() => {
      tokens.clear();
    }, 60 * 60 * 1000); // Every hour
  }
};

// Cleanup function for tests
export const cleanupCsrf = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  tokens.clear();
};

// Auto-initialize in production
if (process.env.NODE_ENV === "production") {
  initializeCsrfCleanup();
}
