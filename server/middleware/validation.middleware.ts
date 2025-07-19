import { Request, Response, NextFunction } from 'express';

export function validationMiddleware(req: Request, res: Response, next: NextFunction) {
  // TODO: Implement request validation using Zod or similar
  // For now, just pass through
  next();
}