import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

// Enhanced error interface
interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Error types
export class ValidationError extends Error {
  statusCode = 400;
  isOperational = true;
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  statusCode = 500;
  isOperational = true;
  
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  isOperational = true;
  
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  isOperational = true;
  
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  isOperational = true;
  
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Global error handler middleware
export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error details
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        received: err.received
      })),
      timestamp: new Date().toISOString()
    });
  }

  // Handle known application errors
  if (error.isOperational) {
    return res.status(error.statusCode || 500).json({
      error: error.message,
      ...(error instanceof ValidationError && error.details && { details: error.details }),
      timestamp: new Date().toISOString()
    });
  }

  // Handle database connection errors
  if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Database connection failed. Please try again later.',
      timestamp: new Date().toISOString()
    });
  }

  // Handle file upload errors
  if (error.message.includes('Multer') || error.message.includes('upload')) {
    return res.status(400).json({
      error: 'File upload failed',
      message: 'Please check your file and try again.',
      timestamp: new Date().toISOString()
    });
  }

  // Handle unexpected errors
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred. Please try again later.',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      originalMessage: error.message 
    })
  });
}

// Async error wrapper
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
}

// Health check with error handling
export function healthCheck(req: Request, res: Response) {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
}

// Request timeout handler
export function timeoutHandler(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          message: 'The request took too long to process',
          timestamp: new Date().toISOString()
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    next();
  };
}

// CORS error handler
export function corsErrorHandler(req: Request, res: Response, next: NextFunction) {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}