/* ---------------------------------------------------------
   src/server/middleware/error.ts
   Express-specific helpers that consume the canonical errors
--------------------------------------------------------- */
import { Request, Response, NextFunction } from 'express';
import { 
  AppError, 
  ErrorFactory, 
  redactSensitiveData, 
  generateCorrelationId 
} from '../../src/local/error-handling';

/* ---------- Request identity ---------- */
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

/* ---------- Error handler ---------- */
export const errorHandler = (
  err: Error,
  req: any,
  res: Response,
  _next: NextFunction
): void => {
  const appErr = ErrorFactory.fromUnknown(err, req.correlationId);

  // Structured log
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
  appErr.statusCode >= 500 ? console.error(log) : console.warn(log);

  if (res.headersSent) return;
  res.status(appErr.statusCode).json(appErr.toJSON());
};

/* ---------- 404 handler ---------- */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
};

/* ---------- Timeout handler ---------- */
export const requestTimeoutHandler = (ms = 30000) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const t = setTimeout(() => {
    if (!res.headersSent) res.status(408).json({ success: false, error: 'Request timeout' });
  }, ms);
  res.on('finish', () => clearTimeout(t));
  res.on('close', () => clearTimeout(t));
  next();
};

/* ---------- Async wrapper ---------- */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);