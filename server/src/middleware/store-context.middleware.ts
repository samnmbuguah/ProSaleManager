import { Request, Response, NextFunction } from "express";

export function requireStoreContext(req: Request, res: Response, next: NextFunction) {
  // For super_admin, store context is optional
  if (req.user?.role === "super_admin") {
    return next();
  }
  
  // For other users, we need either store_id on user OR store context from middleware
  if (!req.user?.store_id && !req.store?.id) {
    return res.status(400).json({ message: "Store context missing" });
  }
  
  next();
}
