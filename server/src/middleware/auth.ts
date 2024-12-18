import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../../src/db";
import { users } from "../../src/db/schema";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  user?: typeof users.$inferSelect;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.id),
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
}; 