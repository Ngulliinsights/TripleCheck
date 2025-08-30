import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/base-error';
import { ErrorFactory } from '../utilities/error-factory';
import { generateCorrelationId, redactSensitiveData } from '../utilities/error-utils';
import { shouldAlert } from '../utilities/error-utils';

export const correlationIdMiddleware = (
  req: any,
  res: Response,
  next: NextFunction
): void => {
  const id = (req.headers['x-correlation-id'] as string) || generateCorrelationId();
  (req as any).correlationId = id;
  res.setHeader('X-Correlation-ID', id);
  next();
};

export const errorHandler = (
  err: Error,
  req: any,
  res: Response,
  _next: NextFunction
): void => {
  const appErr = ErrorFactory.fromUnknown(err, req.correlationId);

  const log = {
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.id,
    error: appErr.toJSON(),
    ...(req.method !== 'GET' && { body: redactSensitiveData(req.body) }),
  };

  if (shouldAlert(appErr)) {
    console.error('🚨 Application Error:', log);
  } else {
    console.warn('⚠️ Application Warning:', log);
  }

  if (res.headersSent) return;
  res.status(appErr.statusCode).json(appErr.toJSON());
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ 
    success: false, 
    error: `Route ${req.method} ${req.path} not found` 
  });
};

export const requestTimeoutHandler = (ms = 30000) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const t = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ success: false, error: 'Request timeout' });
    }
  }, ms);
  res.on('finish', () => clearTimeout(t));
  res.on('close', () => clearTimeout(t));
  next();
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);