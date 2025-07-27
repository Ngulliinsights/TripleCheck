import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { structuredLogger } from '../monitoring/StructuredLogger';
import crypto from 'crypto';

export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  };
  csrf: {
    enabled: boolean;
    secret?: string;
    cookieName?: string;
  };
  helmet: {
    contentSecurityPolicy?: boolean;
    crossOriginEmbedderPolicy?: boolean;
    hsts?: boolean;
  };
  inputSanitization: {
    enabled: boolean;
    maxLength: number;
    allowedTags: string[];
  };
}

export class SecurityHardening {
  private config: SecurityConfig;
  private csrfTokens: Map<string, { token: string; expires: number }> = new Map();

  constructor(config: SecurityConfig) {
    this.config = config;
    this.startTokenCleanup();
  }

  /**
   * Create rate limiting middleware
   */
  createRateLimiter(options?: Partial<SecurityConfig['rateLimit']>) {
    const rateLimitConfig = { ...this.config.rateLimit, ...options };

    return rateLimit({
      windowMs: rateLimitConfig.windowMs,
      max: rateLimitConfig.max,
      skipSuccessfulRequests: rateLimitConfig.skipSuccessfulRequests,
      skipFailedRequests: rateLimitConfig.skipFailedRequests,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        structuredLogger.warn('Rate limit exceeded', {
          correlationId: (req as any).correlationId,
          component: 'security',
          operation: 'rate_limit',
          metadata: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method
          }
        });

        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000)
          }
        });
      },
      skip: (req: Request) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
      }
    });
  }

  /**
   * Create specialized rate limiters for different endpoints
   */
  createAuthRateLimiter() {
    return this.createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      skipSuccessfulRequests: true
    });
  }

  createAPIRateLimiter() {
    return this.createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      skipSuccessfulRequests: false
    });
  }

  createUploadRateLimiter() {
    return this.createRateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 uploads per hour
      skipSuccessfulRequests: false
    });
  }

  /**
   * Configure Helmet security headers
   */
  configureHelmet() {
    return helmet({
      contentSecurityPolicy: this.config.helmet.contentSecurityPolicy ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: []
        }
      } : false,
      crossOriginEmbedderPolicy: this.config.helmet.crossOriginEmbedderPolicy,
      hsts: this.config.helmet.hsts ? {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      } : false,
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'same-origin' }
    });
  }

  /**
   * Input sanitization middleware
   */
  inputSanitizationMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.inputSanitization.enabled) {
        return next();
      }

      try {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
          req.body = this.sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
          req.query = this.sanitizeObject(req.query);
        }

        // Sanitize route parameters
        if (req.params && typeof req.params === 'object') {
          req.params = this.sanitizeObject(req.params);
        }

        next();
      } catch (error) {
        structuredLogger.error('Input sanitization error', {
          correlationId: (req as any).correlationId,
          component: 'security',
          operation: 'input_sanitization',
          error: error instanceof Error ? error.message : String(error)
        });

        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid input detected'
          }
        });
      }
    };
  }

  /**
   * CSRF protection middleware
   */
  csrfProtection() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.csrf.enabled) {
        return next();
      }

      // Skip CSRF for GET, HEAD, OPTIONS requests
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      const token = req.headers['x-csrf-token'] as string || req.body._csrf;
      const sessionId = (req as any).sessionID || req.ip;

      if (!token || !this.validateCSRFToken(sessionId, token)) {
        structuredLogger.warn('CSRF token validation failed', {
          correlationId: (req as any).correlationId,
          component: 'security',
          operation: 'csrf_validation',
          metadata: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            hasToken: !!token
          }
        });

        return res.status(403).json({
          success: false,
          error: {
            code: 'CSRF_TOKEN_INVALID',
            message: 'Invalid or missing CSRF token'
          }
        });
      }

      next();
    };
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + (60 * 60 * 1000); // 1 hour

    this.csrfTokens.set(sessionId, { token, expires });
    return token;
  }

  /**
   * Validate CSRF token
   */
  private validateCSRFToken(sessionId: string, token: string): boolean {
    const storedToken = this.csrfTokens.get(sessionId);
    
    if (!storedToken) {
      return false;
    }

    if (Date.now() > storedToken.expires) {
      this.csrfTokens.delete(sessionId);
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(storedToken.token),
      Buffer.from(token)
    );
  }

  /**
   * SQL injection prevention middleware
   */
  sqlInjectionPrevention() {
    return (req: Request, res: Response, next: NextFunction) => {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /(;|\-\-|\/\*|\*\/)/g,
        /(\b(WAITFOR|DELAY)\b)/gi,
        /(\b(XP_|SP_)\w+)/gi
      ];

      const checkForSQLInjection = (obj: any, path: string = ''): boolean => {
        if (typeof obj === 'string') {
          return sqlPatterns.some(pattern => pattern.test(obj));
        }

        if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            if (checkForSQLInjection(value, `${path}.${key}`)) {
              return true;
            }
          }
        }

        return false;
      };

      // Check request body, query, and params
      const suspicious = [
        checkForSQLInjection(req.body, 'body'),
        checkForSQLInjection(req.query, 'query'),
        checkForSQLInjection(req.params, 'params')
      ].some(Boolean);

      if (suspicious) {
        structuredLogger.error('SQL injection attempt detected', {
          correlationId: (req as any).correlationId,
          component: 'security',
          operation: 'sql_injection_detection',
          metadata: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            body: req.body,
            query: req.query,
            params: req.params
          }
        });

        return res.status(400).json({
          success: false,
          error: {
            code: 'MALICIOUS_INPUT_DETECTED',
            message: 'Potentially malicious input detected'
          }
        });
      }

      next();
    };
  }

  /**
   * XSS prevention middleware
   */
  xssPrevention() {
    return (req: Request, res: Response, next: NextFunction) => {
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<img[^>]+src[^>]*=\s*["\']?\s*javascript:/gi,
        /<svg[^>]*>.*<script/gi
      ];

      const checkForXSS = (obj: any): boolean => {
        if (typeof obj === 'string') {
          return xssPatterns.some(pattern => pattern.test(obj));
        }

        if (typeof obj === 'object' && obj !== null) {
          for (const value of Object.values(obj)) {
            if (checkForXSS(value)) {
              return true;
            }
          }
        }

        return false;
      };

      const suspicious = [
        checkForXSS(req.body),
        checkForXSS(req.query),
        checkForXSS(req.params)
      ].some(Boolean);

      if (suspicious) {
        structuredLogger.error('XSS attempt detected', {
          correlationId: (req as any).correlationId,
          component: 'security',
          operation: 'xss_detection',
          metadata: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method
          }
        });

        return res.status(400).json({
          success: false,
          error: {
            code: 'XSS_ATTEMPT_DETECTED',
            message: 'Cross-site scripting attempt detected'
          }
        });
      }

      next();
    };
  }

  /**
   * File upload security middleware
   */
  fileUploadSecurity() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.files) {
        return next();
      }

      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain'
      ];

      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt'];
      const maxFileSize = 10 * 1024 * 1024; // 10MB

      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();

      for (const file of files) {
        // Check file size
        if (file.size > maxFileSize) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: `File ${file.name} exceeds maximum size of ${maxFileSize / 1024 / 1024}MB`
            }
          });
        }

        // Check MIME type
        if (!allowedMimeTypes.includes(file.mimetype)) {
          structuredLogger.warn('Unauthorized file type upload attempt', {
            correlationId: (req as any).correlationId,
            component: 'security',
            operation: 'file_upload_security',
            metadata: {
              fileName: file.name,
              mimeType: file.mimetype,
              size: file.size,
              ip: req.ip
            }
          });

          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_FILE_TYPE',
              message: `File type ${file.mimetype} is not allowed`
            }
          });
        }

        // Check file extension
        const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!allowedExtensions.includes(extension)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_FILE_EXTENSION',
              message: `File extension ${extension} is not allowed`
            }
          });
        }

        // Check for executable content in file name
        const dangerousPatterns = [
          /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.com$/i, /\.pif$/i,
          /\.scr$/i, /\.vbs$/i, /\.js$/i, /\.jar$/i, /\.php$/i
        ];

        if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
          structuredLogger.error('Dangerous file upload attempt', {
            correlationId: (req as any).correlationId,
            component: 'security',
            operation: 'dangerous_file_upload',
            metadata: {
              fileName: file.name,
              ip: req.ip,
              userAgent: req.get('User-Agent')
            }
          });

          return res.status(400).json({
            success: false,
            error: {
              code: 'DANGEROUS_FILE_DETECTED',
              message: 'File appears to contain executable content'
            }
          });
        }
      }

      next();
    };
  }

  /**
   * Sanitize object recursively
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[this.sanitizeString(key)] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Sanitize string input
   */
  private sanitizeString(str: string): string {
    if (typeof str !== 'string') {
      return str;
    }

    // Limit string length
    if (str.length > this.config.inputSanitization.maxLength) {
      str = str.substring(0, this.config.inputSanitization.maxLength);
    }

    // Remove dangerous characters
    str = str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:text\/html/gi, '');

    // Encode HTML entities
    str = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    return str.trim();
  }

  /**
   * Start token cleanup process
   */
  private startTokenCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, tokenData] of this.csrfTokens.entries()) {
        if (now > tokenData.expires) {
          this.csrfTokens.delete(sessionId);
        }
      }
    }, 60 * 60 * 1000); // Clean up every hour
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): {
    activeCSRFTokens: number;
    rateLimitViolations: number;
    securityEvents: number;
  } {
    return {
      activeCSRFTokens: this.csrfTokens.size,
      rateLimitViolations: 0, // Would be tracked from rate limiter
      securityEvents: 0 // Would be tracked from security events
    };
  }
}

// Default security configuration
export const defaultSecurityConfig: SecurityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  csrf: {
    enabled: process.env.NODE_ENV === 'production',
    secret: process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex'),
    cookieName: '_csrf'
  },
  helmet: {
    contentSecurityPolicy: true,
    crossOriginEmbedderPolicy: false,
    hsts: process.env.NODE_ENV === 'production'
  },
  inputSanitization: {
    enabled: true,
    maxLength: 10000,
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br']
  }
};

// Create singleton security hardening instance
export const securityHardening = new SecurityHardening(defaultSecurityConfig);