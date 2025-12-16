import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Store, User } from "../models/index.js";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        store_id?: number | null;
      };
      store?: {
        id: number;
        name: string;
        subdomain: string | null;
      };
    }
  }
}

// Middleware to resolve store from domain or subdomain
export const resolveStore = async (req: Request, res: Response, next: NextFunction) => {

  // Prefer path-based store resolution: expect URL like /api/... or /:store/... (frontend) and for API we stay /api
  // We will try to extract the first non-empty segment from the referer path if present, else from req.headers["x-store-slug"], else default to first store
  const referer = req.headers.referer || "";
  let storeSlug: string | null = null;

  try {
    if (typeof referer === "string" && referer) {
      const url = new URL(referer);
      const segments = url.pathname.split("/").filter(Boolean);
      // If path starts with auth, skip. Otherwise first segment is store slug
      if (segments.length > 0 && segments[0] !== "auth") {
        storeSlug = segments[0];
      }
    }
  } catch {
    // ignore
  }

  if (!storeSlug && typeof req.headers["x-store-slug"] === "string") {
    storeSlug = req.headers["x-store-slug"] as string;
  }

  let store: Store | null = null;
  if (storeSlug) {
    store = await Store.findOne({ where: { name: storeSlug } });
  }

  if (!store) {
    // Fallback to first store in DB
    store = await Store.findOne({ order: [["id", "ASC"]] });
  }

  if (store) {
    req.store = {
      id: store.id,
      name: store.name,
      subdomain: store.subdomain,
    };
  }
  next();
};

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  const jwtSecret = process.env.JWT_SECRET || "fallback-secret";

  jwt.verify(
    token,
    jwtSecret,
    async (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }
      if (
        typeof decoded === "object" &&
        decoded &&
        "id" in decoded &&
        "email" in decoded &&
        "role" in decoded
      ) {
        // Fetch user from DB to get store_id
        const user = await User.findByPk((decoded as jwt.JwtPayload).id);
        req.user = {
          id: (decoded as jwt.JwtPayload).id,
          email: (decoded as jwt.JwtPayload).email,
          role: (decoded as jwt.JwtPayload).role,
          store_id: user?.role === "super_admin" ? null : user?.store_id,
        };
      }
      await next();
    },
  );
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const jwtSecret = process.env.JWT_SECRET || "fallback-secret";

  jwt.verify(
    token,
    jwtSecret,
    async (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      if (
        typeof decoded === "object" &&
        decoded &&
        "id" in decoded &&
        "email" in decoded &&
        "role" in decoded
      ) {
        // Fetch user from DB to get store_id
        const user = await User.findByPk((decoded as jwt.JwtPayload).id);
        req.user = {
          id: (decoded as jwt.JwtPayload).id,
          email: (decoded as jwt.JwtPayload).email,
          role: (decoded as jwt.JwtPayload).role,
          store_id: user?.role === "super_admin" ? null : user?.store_id,
        };

        // Allow super_admin to impersonate a store via header
        if (req.user.role === "super_admin" && req.headers["x-store-id"]) {
          const requestedStoreId = parseInt(req.headers["x-store-id"] as string);
          if (!isNaN(requestedStoreId)) {
            req.user.store_id = requestedStoreId;
          }
        }
        console.log(`requireAuth: user_id=${req.user.id}, role=${req.user.role}, store_id=${req.user.store_id}, db_user_store_id=${user?.store_id}`);
      }
      await next();
    },
  );
};

// Middleware to sync req.user.store_id with req.store.id for non-super_admins
export function attachStoreIdToUser(req: Request, res: Response, next: NextFunction) {
  if (req.user && req.store && req.user.role !== "super_admin") {
    req.user.store_id = req.store.id;
  }
  next();
}
