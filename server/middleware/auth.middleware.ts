import { Request, Response, NextFunction } from 'express';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required',
    });
  }

  // TODO: Implement actual JWT verification
  // For now, mock a user
  req.user = {
    id: '1',
    email: 'user@example.com',
    role: 'user',
  };

  next();
}