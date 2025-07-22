import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Store, User } from '../models/index.js';

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
  const host = req.headers.host || '';
  let subdomain = '';

  if (host.endsWith('.local')) {
    subdomain = host.replace('.local', '');
  } else if (host.endsWith('.eltee.store')) {
    subdomain = host.replace('.eltee.store', '');
  } else {
    // fallback: take first part
    subdomain = host.split('.')[0];
  }

  let store: Store | null = null;
  if (subdomain) {
    store = await Store.findOne({ where: { subdomain } });
  }

  if (!store) {
    // Only allow super admin login on the main domain (no store subdomain)
    if (
      req.path.startsWith('/api/auth/login') &&
      req.method === 'POST' &&
      req.body && req.body.email &&
      req.body.email.endsWith('@prosale.com') // adjust as needed for super admin
    ) {
      return next();
    }
    return res.status(400).json({ success: false, error: 'Store subdomain required', message: 'You must access this route from a valid store subdomain.' });
  }

  req.store = {
    id: store.id,
    name: store.name,
    subdomain: store.subdomain,
  };
  next();
};

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';

  jwt.verify(token, jwtSecret, async (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    if (typeof decoded === 'object' && decoded && 'id' in decoded && 'email' in decoded && 'role' in decoded) {
      // Fetch user from DB to get store_id
      const user = await User.findByPk((decoded as any).id);
      req.user = {
        id: (decoded as any).id,
        email: (decoded as any).email,
        role: (decoded as any).role,
        store_id: user?.role === 'super_admin' ? null : user?.store_id,
      };
    }
    next();
  });
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';

  jwt.verify(token, jwtSecret, async (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (typeof decoded === 'object' && decoded && 'id' in decoded && 'email' in decoded && 'role' in decoded) {
      // Fetch user from DB to get store_id
      const user = await User.findByPk((decoded as any).id);
      req.user = {
        id: (decoded as any).id,
        email: (decoded as any).email,
        role: (decoded as any).role,
        store_id: user?.role === 'super_admin' ? null : user?.store_id,
      };
    }
    next();
  });
};

// Middleware to sync req.user.store_id with req.store.id for non-super_admins
export function attachStoreIdToUser(req: Request, res: Response, next: NextFunction) {
  if (req.user && req.store && req.user.role !== 'super_admin') {
    req.user.store_id = req.store.id;
  }
  next();
}
