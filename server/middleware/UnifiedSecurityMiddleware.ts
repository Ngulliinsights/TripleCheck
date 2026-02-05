/**
 * Unified Security Middleware - Consolidated security implementation
 * Combines JWT validation, rate limiting, input validation, and security headers
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from './query-limiter.middleware';
import rateLimit from './query-limiter.middleware';
import helmet from './query-limiter.middleware';
import { z } from 'zod';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

interface SecurityConfig {
  jwt: {
    secret: string;
    audience: string;
    issuer: string;
    algorithms: string[];
  };
  rateLimit: {
    windowMs: number;
    max: number;
    message: string;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
}

export class UnifiedSecurityMiddleware {
  private config: SecurityConfig;
  
  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret',
        audience: 'kenya-land-platform',
        issuer: 'auth.kenyaland.com',
        algorithms: ['HS256']
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.'
      },
      cors: {
        origin: [
          'https://kenyaland.com',
          'https://www.kenyaland.com',
          'https://app.kenyaland.com'
        ],
        credentials: true
      },
      ...config
    };
  }

  /**
   * Create comprehensive security middleware stack
   */
  createSecurityMiddleware(): RequestHandler[] {
    return [
      this.securityHeaders(),
      this.rateLimiting(),
      this.corsHandler(),
      this.inputSanitization()
    ];
  }

  /**
   * Advanced security headers with Kenya Land Platform specific CSP
   */
  private securityHeaders(): RequestHandler {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for some React functionality
            "https://api.cloudinary.com",
            "https://maps.googleapis.com"
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com"
          ],
          imgSrc: [
            "'self'",
            "data:",
            "https://*.cloudinary.com",
            "https://maps.gstatic.com",
            "https://maps.googleapis.com"
          ],
          connectSrc: [
            "'self'",
            "https://api.kenyaland.com",
            "wss://api.kenyaland.com",
            "https://api.cloudinary.com"
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com"
          ],
          mediaSrc: [
            "'self'",
            "https://*.cloudinary.com"
          ],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      crossOriginEmbedderPolicy: { policy: "require-corp" },
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    });
  }

  /**
   * Intelligent rate limiting with different limits for different endpoints
   */
  private rateLimiting(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      // Different rate limits for different endpoint types
      let limit = this.config.rateLimit.max;
      
      if (req.path.includes('/auth/')) {
        limit = 5; // Stricter limit for auth endpoints
      } else if (req.path.includes('/api/fraud/')) {
        limit = 20; // Moderate limit for fraud detection
      } else if (req.path.includes('/api/upload/')) {
        limit = 10; // Limit for file uploads
      }

      const limiter = rateLimit({
        windowMs: this.config.rateLimit.windowMs,
        max: limit,
        message: {
          error: 'Rate limit exceeded',
          message: this.config.rateLimit.message,
          retryAfter: Math.ceil(this.config.rateLimit.windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
          // Use user ID if authenticated, otherwise IP
          return (req as any).user?.id || req.ip;
        }
      });

      return limiter(req, res, next);
    };
  }

  /**
   * CORS handler with environment-specific origins
   */
  private corsHandler(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;
      const allowedOrigins = process.env.NODE_ENV === 'development' 
        ? ['http://localhost:3000', 'http://localhost:5173', ...this.config.cors.origin]
        : this.config.cors.origin;

      if (!origin || allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control');
      }

      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }

      next();
    };
  }

  /**
   * Input sanitization and validation
   */
  private inputSanitization(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      // Sanitize common XSS patterns
      const sanitizeString = (str: string): string => {
        return str
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      };

      // Recursively sanitize object properties
      const sanitizeObject = (obj: any): any => {
        if (typeof obj === 'string') {
          return sanitizeString(obj);
        }
        if (typeof obj === 'object' && obj !== null) {
          const sanitized: any = Array.isArray(obj) ? [] : {};
          for (const key in obj) {
            sanitized[key] = sanitizeObject(obj[key]);
          }
          return sanitized;
        }
        return obj;
      };

      // Sanitize request body
      if (req.body) {
        req.body = sanitizeObject(req.body);
      }

      // Sanitize query parameters
      if (req.query) {
        req.query = sanitizeObject(req.query);
      }

      next();
    };
  }

  /**
   * Enhanced JWT validation middleware with audience and issuer verification
   */
  jwtValidation(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'No valid authorization header found'
          });
        }

        const token = authHeader.substring(7);
        
        // Enhanced JWT verification with audience and issuer validation
        const payload = jwt.verify(token, this.config.jwt.secret, {
          audience: this.config.jwt.audience,
          issuer: this.config.jwt.issuer,
          algorithms: this.config.jwt.algorithms as jwt.Algorithm[]
        }) as JWTPayload;

        // Additional security checks
        if (!payload.userId || !payload.email) {
          return res.status(401).json({
            error: 'Invalid token',
            message: 'Token missing required claims'
          });
        }

        // Check token expiration with buffer
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now + 60) { // 60 second buffer
          return res.status(401).json({
            error: 'Token expired',
            message: 'Please refresh your authentication'
          });
        }

        // Attach user info to request
        (req as any).user = {
          id: payload.userId,
          email: payload.email,
          role: payload.role
        };

        next();
      } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
          return res.status(401).json({
            error: 'Invalid token',
            message: error.message
          });
        }
        
        console.error('JWT validation error:', error);
        return res.status(500).json({
          error: 'Authentication error',
          message: 'Internal server error during authentication'
        });
      }
    };
  }

  /**
   * Optional authentication - validates JWT if present but doesn't require it
   */
  optionalJwtValidation(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // No token provided, continue without authentication
      }

      // Use the main JWT validation but catch errors
      try {
        await new Promise<void>((resolve, reject) => {
          this.jwtValidation()(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (error) {
        // Log the error but don't block the request
        console.warn('Optional JWT validation failed:', error);
      }

      next();
    };
  }

  /**
   * Role-based access control
   */
  requireRole(roles: string | string[]): RequestHandler {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please log in to access this resource'
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`
        });
      }

      next();
    };
  }

  /**
   * Request validation using Zod schemas
   */
  validateRequest(schema: {
    body?: z.ZodSchema;
    query?: z.ZodSchema;
    params?: z.ZodSchema;
  }): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        if (schema.body) {
          req.body = schema.body.parse(req.body);
        }
        
        if (schema.query) {
          req.query = schema.query.parse(req.query);
        }
        
        if (schema.params) {
          req.params = schema.params.parse(req.params);
        }

        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: 'Validation error',
            message: 'Request data does not match required format',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              received: err.received
            }))
          });
        }

        console.error('Request validation error:', error);
        return res.status(500).json({
          error: 'Validation error',
          message: 'Internal server error during request validation'
        });
      }
    };
  }
}

// Export singleton instance for easy use
export const unifiedSecurity = new UnifiedSecurityMiddleware();

// Export common middleware combinations
export const authRequired = [
  unifiedSecurity.jwtValidation()
];

export const adminRequired = [
  unifiedSecurity.jwtValidation(),
  unifiedSecurity.requireRole('admin')
];

export const optionalAuth = [
  unifiedSecurity.optionalJwtValidation()
];

export const fullSecurity = unifiedSecurity.createSecurityMiddleware();