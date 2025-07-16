import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        email: string
        role: string
      }
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret'
  
  jwt.verify(token, jwtSecret, (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' })
    }
    if (typeof decoded === 'object' && decoded && 'id' in decoded && 'email' in decoded && 'role' in decoded) {
      req.user = { id: (decoded as any).id, email: (decoded as any).email, role: (decoded as any).role };
    }
    next()
  })
}

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' })
    }

    next()
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret'
  
  jwt.verify(token, jwtSecret, (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' })
    }
    if (typeof decoded === 'object' && decoded && 'id' in decoded && 'email' in decoded && 'role' in decoded) {
      req.user = { id: (decoded as any).id, email: (decoded as any).email, role: (decoded as any).role };
    }
    next()
  })
}
