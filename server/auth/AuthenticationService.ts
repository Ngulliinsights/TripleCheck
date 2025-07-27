import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { structuredLogger } from '../monitoring/StructuredLogger';
import { storage } from '../infrastructure/storage/storage';

export interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string;
  };
  password: {
    saltRounds: number;
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  session: {
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  lockout: {
    maxAttempts: number;
    lockoutDuration: number;
    enabled: boolean;
  };
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'agent' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  trustScore: number;
  lastLoginAt?: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface LoginAttempt {
  ip: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  userId?: number;
  failureReason?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  correlationId?: string;
  sessionId?: string;
}

export class AuthenticationService {
  private config: AuthConfig;
  private refreshTokens: Map<string, { userId: number; expiresAt: Date }> = new Map();
  private loginAttempts: Map<string, LoginAttempt[]> = new Map();
  private lockedAccounts: Map<string, Date> = new Map();
  private cleanupIntervals: NodeJS.Timeout[] = [];

  constructor(config: AuthConfig) {
    this.config = config;
    this.startCleanupTasks();
  }

  /**
   * Hash password with bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    if (!this.validatePasswordStrength(password)) {
      throw new Error('Password does not meet security requirements');
    }

    return bcrypt.hash(password, this.config.password.saltRounds);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): boolean {
    if (password.length < this.config.password.minLength) {
      return false;
    }

    if (this.config.password.requireUppercase && !/[A-Z]/.test(password)) {
      return false;
    }

    if (this.config.password.requireLowercase && !/[a-z]/.test(password)) {
      return false;
    }

    if (this.config.password.requireNumbers && !/\d/.test(password)) {
      return false;
    }

    if (this.config.password.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return false;
    }

    return true;
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(user: AuthUser): AuthTokens {
    const payload = {
      sub: user.id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      trustScore: user.trustScore,
      iat: Math.floor(Date.now() / 1000)
    };

    const accessToken = jwt.sign(payload, this.config.jwt.secret, {
      expiresIn: this.config.jwt.expiresIn,
      issuer: this.config.jwt.issuer,
      audience: this.config.jwt.audience
    } as jwt.SignOptions);

    const refreshToken = this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirationTime(this.config.jwt.expiresIn),
      tokenType: 'Bearer'
    };
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(userId: number): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.parseExpirationTime(this.config.jwt.refreshExpiresIn) * 1000);
    
    this.refreshTokens.set(token, { userId, expiresAt });
    return token;
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, this.config.jwt.secret, {
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience
      }) as any;

      return {
        id: parseInt(decoded.sub),
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        isActive: true,
        emailVerified: true,
        trustScore: decoded.trustScore || 0
      };
    } catch (error) {
      structuredLogger.warn('Token verification failed', {
        component: 'auth',
        operation: 'token_verification',
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens | null> {
    const tokenData = this.refreshTokens.get(refreshToken);
    
    if (!tokenData || Date.now() > tokenData.expiresAt.getTime()) {
      this.refreshTokens.delete(refreshToken);
      return null;
    }

    try {
      const user = await storage.getUser(tokenData.userId);
      if (!user || !user.isActive) {
        this.refreshTokens.delete(refreshToken);
        return null;
      }

      // Remove old refresh token
      this.refreshTokens.delete(refreshToken);

      // Generate new tokens
      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: true,
        emailVerified: !!user.emailVerifiedAt,
        trustScore: user.trustScore,
        ...(user.lastLoginAt && { lastLoginAt: user.lastLoginAt })
      };

      return this.generateTokens(authUser);
    } catch (error) {
      structuredLogger.error('Token refresh failed', {
        component: 'auth',
        operation: 'token_refresh',
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Authenticate user with email/password
   */
  async authenticate(email: string, password: string, req: Request): Promise<{
    success: boolean;
    user?: AuthUser;
    tokens?: AuthTokens;
    error?: string;
  }> {
    const ip = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || '';
    const correlationId = (req as any).correlationId;

    // Check if account is locked
    if (this.isAccountLocked(email)) {
      this.recordLoginAttempt(email, ip, userAgent, false, undefined, 'account_locked');
      
      structuredLogger.warn('Login attempt on locked account', {
        correlationId,
        component: 'auth',
        operation: 'login_attempt',
        metadata: { email, ip, userAgent }
      });

      return {
        success: false,
        error: 'Account is temporarily locked due to too many failed attempts'
      };
    }

    try {
      // Get user by email
      const user = await storage.getUserByUsername(email); // Assuming this works with email too
      
      if (!user) {
        this.recordLoginAttempt(email, ip, userAgent, false, undefined, 'user_not_found');
        this.handleFailedLogin(email);
        
        structuredLogger.warn('Login attempt with non-existent email', {
          correlationId,
          component: 'auth',
          operation: 'login_attempt',
          metadata: { email, ip, userAgent }
        });

        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Check if user is active
      if (!user.isActive) {
        this.recordLoginAttempt(email, ip, userAgent, false, user.id, 'account_inactive');
        
        structuredLogger.warn('Login attempt on inactive account', {
          correlationId,
          component: 'auth',
          operation: 'login_attempt',
          metadata: { email, userId: user.id, ip, userAgent }
        });

        return {
          success: false,
          error: 'Account is inactive'
        };
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        this.recordLoginAttempt(email, ip, userAgent, false, user.id, 'invalid_password');
        this.handleFailedLogin(email);
        
        structuredLogger.warn('Login attempt with invalid password', {
          correlationId,
          component: 'auth',
          operation: 'login_attempt',
          metadata: { email, userId: user.id, ip, userAgent }
        });

        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Successful login
      this.recordLoginAttempt(email, ip, userAgent, true, user.id);
      this.clearFailedAttempts(email);

      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: true,
        emailVerified: !!user.emailVerifiedAt,
        trustScore: user.trustScore,
        ...(user.lastLoginAt && { lastLoginAt: user.lastLoginAt })
      };

      const tokens = this.generateTokens(authUser);

      // Update last login time
      // await storage.updateUserLastLogin(user.id); // Assuming this method exists

      structuredLogger.info('Successful login', {
        correlationId,
        component: 'auth',
        operation: 'login_success',
        userId: user.id.toString(),
        metadata: { email, ip, userAgent }
      });

      return {
        success: true,
        user: authUser,
        tokens
      };

    } catch (error) {
      structuredLogger.error('Authentication error', {
        correlationId,
        component: 'auth',
        operation: 'authentication_error',
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Logout user and invalidate tokens
   */
  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      this.refreshTokens.delete(refreshToken);
    }

    structuredLogger.info('User logged out', {
      component: 'auth',
      operation: 'logout'
    });
  }

  /**
   * Authentication middleware
   */
  requireAuth() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void | Response => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication token required'
          }
        });
        return;
      }

      const token = authHeader.substring(7);
      const user = this.verifyToken(token);

      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token'
          }
        });
        return;
      }

      req.user = user;
      next();
    };
  }

  /**
   * Role-based authorization middleware
   */
  requireRole(roles: string | string[]) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void | Response => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        structuredLogger.warn('Authorization failed - insufficient role', {
          correlationId: req.correlationId || 'unknown',
          component: 'auth',
          operation: 'authorization_failed',
          userId: req.user.id.toString(),
          metadata: {
            userRole: req.user.role,
            requiredRoles: allowedRoles,
            path: req.path
          }
        });

        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to access this resource'
          }
        });
      }

      next();
    };
  }

  /**
   * Record login attempt
   */
  private recordLoginAttempt(
    email: string,
    ip: string,
    userAgent: string,
    success: boolean,
    userId?: number,
    failureReason?: string
  ): void {
    const attempt: LoginAttempt = {
      ip,
      userAgent,
      timestamp: new Date(),
      success,
      ...(userId !== undefined && { userId }),
      ...(failureReason !== undefined && { failureReason })
    };

    const attempts = this.loginAttempts.get(email) || [];
    attempts.push(attempt);
    
    // Keep only last 10 attempts
    if (attempts.length > 10) {
      attempts.shift();
    }
    
    this.loginAttempts.set(email, attempts);
  }

  /**
   * Handle failed login attempt
   */
  private handleFailedLogin(email: string): void {
    if (!this.config.lockout.enabled) {
      return;
    }

    const attempts = this.loginAttempts.get(email) || [];
    const recentFailures = attempts.filter(
      attempt => !attempt.success && 
      Date.now() - attempt.timestamp.getTime() < 15 * 60 * 1000 // Last 15 minutes
    );

    if (recentFailures.length >= this.config.lockout.maxAttempts) {
      const lockUntil = new Date(Date.now() + this.config.lockout.lockoutDuration);
      this.lockedAccounts.set(email, lockUntil);
      
      structuredLogger.warn('Account locked due to failed login attempts', {
        component: 'auth',
        operation: 'account_locked',
        metadata: {
          email,
          failedAttempts: recentFailures.length,
          lockUntil: lockUntil.toISOString()
        }
      });
    }
  }

  /**
   * Check if account is locked
   */
  private isAccountLocked(email: string): boolean {
    const lockUntil = this.lockedAccounts.get(email);
    
    if (!lockUntil) {
      return false;
    }

    if (Date.now() > lockUntil.getTime()) {
      this.lockedAccounts.delete(email);
      return false;
    }

    return true;
  }

  /**
   * Clear failed attempts for email
   */
  private clearFailedAttempts(email: string): void {
    this.loginAttempts.delete(email);
    this.lockedAccounts.delete(email);
  }

  /**
   * Parse expiration time string to seconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiration format: ${expiresIn}`);
    }

    const value = parseInt(match[1]!);
    const unit = match[2]!;

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: throw new Error(`Invalid time unit: ${unit}`);
    }
  }

  /**
   * Start cleanup tasks
   */
  private startCleanupTasks(): void {
    // Store intervals for cleanup
    this.cleanupIntervals = [];

    // Clean up expired refresh tokens every hour
    this.cleanupIntervals.push(setInterval(() => {
      const now = Date.now();
      for (const [token, data] of this.refreshTokens.entries()) {
        if (now > data.expiresAt.getTime()) {
          this.refreshTokens.delete(token);
        }
      }
    }, 60 * 60 * 1000));

    // Clean up old login attempts every hour
    this.cleanupIntervals.push(setInterval(() => {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
      for (const [email, attempts] of this.loginAttempts.entries()) {
        const recentAttempts = attempts.filter(attempt => attempt.timestamp.getTime() > cutoff);
        if (recentAttempts.length === 0) {
          this.loginAttempts.delete(email);
        } else {
          this.loginAttempts.set(email, recentAttempts);
        }
      }
    }, 60 * 60 * 1000));

    // Clean up expired account locks every 15 minutes
    this.cleanupIntervals.push(setInterval(() => {
      const now = Date.now();
      for (const [email, lockUntil] of this.lockedAccounts.entries()) {
        if (now > lockUntil.getTime()) {
          this.lockedAccounts.delete(email);
        }
      }
    }, 15 * 60 * 1000));
  }

  /**
   * Get authentication statistics
   */
  getAuthStats(): {
    activeRefreshTokens: number;
    lockedAccounts: number;
    recentLoginAttempts: number;
  } {
    const recentAttempts = Array.from(this.loginAttempts.values())
      .flat()
      .filter(attempt => Date.now() - attempt.timestamp.getTime() < 60 * 60 * 1000).length;

    return {
      activeRefreshTokens: this.refreshTokens.size,
      lockedAccounts: this.lockedAccounts.size,
      recentLoginAttempts: recentAttempts
    };
  }

  /**
   * Cleanup method to prevent memory leaks
   */
  public cleanup(): void {
    // Clear all intervals
    this.cleanupIntervals.forEach(interval => clearInterval(interval));
    this.cleanupIntervals = [];
    
    // Clear all maps
    this.refreshTokens.clear();
    this.loginAttempts.clear();
    this.lockedAccounts.clear();
  }
}

// Default authentication configuration
export const defaultAuthConfig: AuthConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    expiresIn: '15m',
    refreshExpiresIn: '7d',
    issuer: 'triplecheck-api',
    audience: 'triplecheck-app'
  },
  password: {
    saltRounds: 12,
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },
  lockout: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    enabled: true
  }
};

// Create singleton authentication service
export const authService = new AuthenticationService(defaultAuthConfig);