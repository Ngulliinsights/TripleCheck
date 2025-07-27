import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityHardening, defaultSecurityConfig } from '../../security/SecurityHardening';
import { Request, Response, NextFunction } from 'express';

describe('SecurityHardening', () => {
  let securityHardening: SecurityHardening;

  beforeEach(() => {
    securityHardening = new SecurityHardening(defaultSecurityConfig);
  });

  describe('Rate Limiting', () => {
    it('should create rate limiter with default config', () => {
      const rateLimiter = securityHardening.createRateLimiter();
      expect(rateLimiter).toBeDefined();
    });

    it('should create specialized rate limiters', () => {
      const authLimiter = securityHardening.createAuthRateLimiter();
      const apiLimiter = securityHardening.createAPIRateLimiter();
      const uploadLimiter = securityHardening.createUploadRateLimiter();

      expect(authLimiter).toBeDefined();
      expect(apiLimiter).toBeDefined();
      expect(uploadLimiter).toBeDefined();
    });
  });

  describe('Input Sanitization', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        body: {},
        query: {},
        params: {}
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      mockNext = vi.fn();
    });

    it('should sanitize malicious input', () => {
      const middleware = securityHardening.inputSanitizationMiddleware();
      
      mockReq.body = {
        name: '<script>alert("xss")</script>John',
        description: 'Normal text with <iframe src="evil.com"></iframe>'
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.name).not.toContain('<script>');
      expect(mockReq.body.description).not.toContain('<iframe>');
    });

    it('should handle nested objects', () => {
      const middleware = securityHardening.inputSanitizationMiddleware();
      
      mockReq.body = {
        user: {
          profile: {
            bio: '<script>alert("nested xss")</script>Safe content'
          }
        }
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.user.profile.bio).not.toContain('<script>');
    });

    it('should handle arrays', () => {
      const middleware = securityHardening.inputSanitizationMiddleware();
      
      mockReq.body = {
        tags: ['<script>evil</script>tag1', 'normal tag', '<iframe>bad</iframe>tag2']
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.tags[0]).not.toContain('<script>');
      expect(mockReq.body.tags[2]).not.toContain('<iframe>');
    });
  });

  describe('CSRF Protection', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        method: 'POST',
        headers: {},
        body: {},
        ip: '127.0.0.1'
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      mockNext = vi.fn();
    });

    it('should skip CSRF for GET requests', () => {
      const middleware = securityHardening.csrfProtection();
      mockReq.method = 'GET';

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject POST without CSRF token', () => {
      const middleware = securityHardening.csrfProtection();

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept valid CSRF token', () => {
      const sessionId = 'test-session';
      const token = securityHardening.generateCSRFToken(sessionId);
      
      const middleware = securityHardening.csrfProtection();
      mockReq.headers = { 'x-csrf-token': token };
      (mockReq as any).sessionID = sessionId;

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('SQL Injection Prevention', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        body: {},
        query: {},
        params: {},
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('test-agent'),
        path: '/test',
        method: 'POST'
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      mockNext = vi.fn();
    });

    it('should detect SQL injection attempts', () => {
      const middleware = securityHardening.sqlInjectionPrevention();
      
      mockReq.body = {
        username: "admin'; DROP TABLE users; --",
        search: "1 OR 1=1"
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow safe input', () => {
      const middleware = securityHardening.sqlInjectionPrevention();
      
      mockReq.body = {
        username: "john.doe@example.com",
        search: "property in nairobi"
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should detect SQL injection in query parameters', () => {
      const middleware = securityHardening.sqlInjectionPrevention();
      
      mockReq.query = {
        id: "1 UNION SELECT * FROM users"
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('XSS Prevention', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        body: {},
        query: {},
        params: {},
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('test-agent'),
        path: '/test',
        method: 'POST'
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      mockNext = vi.fn();
    });

    it('should detect XSS attempts', () => {
      const middleware = securityHardening.xssPrevention();
      
      mockReq.body = {
        comment: '<script>alert("xss")</script>',
        description: '<img src="x" onerror="alert(1)">'
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow safe HTML-like content', () => {
      const middleware = securityHardening.xssPrevention();
      
      mockReq.body = {
        comment: 'This is a normal comment with <3 hearts',
        description: 'Price: $500 < $600'
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should detect javascript: URLs', () => {
      const middleware = securityHardening.xssPrevention();
      
      mockReq.body = {
        link: 'javascript:alert("xss")'
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('File Upload Security', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        ip: '127.0.0.1'
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      mockNext = vi.fn();
    });

    it('should allow valid file uploads', () => {
      const middleware = securityHardening.fileUploadSecurity();
      
      mockReq.files = {
        image: {
          name: 'photo.jpg',
          size: 1024 * 1024, // 1MB
          mimetype: 'image/jpeg'
        }
      } as any;

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject files that are too large', () => {
      const middleware = securityHardening.fileUploadSecurity();
      
      mockReq.files = {
        image: {
          name: 'large.jpg',
          size: 20 * 1024 * 1024, // 20MB
          mimetype: 'image/jpeg'
        }
      } as any;

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject dangerous file types', () => {
      const middleware = securityHardening.fileUploadSecurity();
      
      mockReq.files = {
        file: {
          name: 'malware.exe',
          size: 1024,
          mimetype: 'application/octet-stream'
        }
      } as any;

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject files with dangerous extensions', () => {
      const middleware = securityHardening.fileUploadSecurity();
      
      mockReq.files = {
        file: {
          name: 'script.php',
          size: 1024,
          mimetype: 'text/plain'
        }
      } as any;

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('CSRF Token Management', () => {
    it('should generate unique tokens', () => {
      const token1 = securityHardening.generateCSRFToken('session1');
      const token2 = securityHardening.generateCSRFToken('session2');
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(32);
    });

    it('should validate tokens correctly', () => {
      const sessionId = 'test-session';
      const token = securityHardening.generateCSRFToken(sessionId);
      
      // Valid token should pass
      const middleware = securityHardening.csrfProtection();
      const mockReq = {
        method: 'POST',
        headers: { 'x-csrf-token': token },
        sessionID: sessionId,
        body: {},
        ip: '127.0.0.1'
      } as any;
      
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as any;
      
      const mockNext = vi.fn();

      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Security Metrics', () => {
    it('should provide security metrics', () => {
      const metrics = securityHardening.getSecurityMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.activeCSRFTokens).toBe('number');
      expect(typeof metrics.rateLimitViolations).toBe('number');
      expect(typeof metrics.securityEvents).toBe('number');
    });
  });
});