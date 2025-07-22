import { Request, Response, NextFunction } from 'express';

export function requireStoreContext(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'super_admin' && !req.user?.store_id) {
    return res.status(400).json({ message: 'Store context missing' });
  }
  next();
} 