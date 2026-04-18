import crypto from '../app';

import bcrypt from '../app';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import { LoginCredentials, RegisterData, User } from '@shared/types/auth.types';

interface AuthResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

interface LoginAttempt {
  ip: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  userId?: string;
  failureReason?: string;
}

interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  password: {
    saltRounds: number;
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  lockout: {
    maxAttempts: number;
    lockoutDuration: number;
    enabled: boolean;
  };
}

export class AuthService {
  private readonly config: AuthConfig;
  private readonly PASSWORD_RESET_MESSAGE = 'If an account with that email exists, a password reset link has been sent.';

  // In-memory stores (replace with database in production)
  private users: Map<string, User & { password: string }> = new Map();
  private invalidatedTokens: Set<string> = new Set();
  private refreshTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();
  private loginAttempts: Map<string, LoginAttempt[]> = new Map();
  private lockedAccounts: Map<string, Date> = new Map();
  private cleanupIntervals: NodeJS.Timeout[] = [];

  constructor(config?: Partial<AuthConfig>) {
    this.config = {
      jwt: {
        secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        ...config?.jwt
      },
      password: {
        saltRounds: 12,
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        ...config?.password
      },
      lockout: {
        maxAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        enabled: process.env.NODE_ENV === 'production',
        ...config?.lockout
      }
    };

    this.startCleanupTasks();

    // Add a default test user for development
    this.createTestUser().catch((error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create test user:', error);
      }
    });
  }

  private async createTestUser(): Promise<void> {
    // Ensure we have valid values for bcrypt
    const password = 'password123';
    const saltRounds = this.config.password.saltRounds || 12;
    
    if (!password || !saltRounds) {
      throw new Error('Invalid password or salt rounds for test user creation');
    }
    
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const testUser: User & { password: string } = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      isVerified: true,
      password: hashedPassword,
      preferences: {
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        privacy: {
          showProfile: true,
          showContactInfo: false
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(testUser.email, testUser);
  }

  async login(credentials: LoginCredentials, req?: Request): Promise<AuthResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      const { email, password } = credentials;
      const ip = req?.ip || 'unknown';
      const userAgent = req?.get('User-Agent') || '';

      // Check if account is locked
      if (this.isAccountLocked(email)) {
        this.recordLoginAttempt(email, ip, userAgent, false, undefined, 'account_locked');
        return {
          success: false,
          error: 'Account is temporarily locked due to too many failed attempts'
        };
      }

      // Find user by email
      const userWithPassword = this.users.get(email);
      if (!userWithPassword) {
        this.recordLoginAttempt(email, ip, userAgent, false, undefined, 'user_not_found');
        this.handleFailedLogin(email);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
      if (!isPasswordValid) {
        this.recordLoginAttempt(email, ip, userAgent, false, userWithPassword.id, 'invalid_password');
        this.handleFailedLogin(email);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Successful login
      this.recordLoginAttempt(email, ip, userAgent, true, userWithPassword.id);
      this.clearFailedAttempts(email);

      // Generate tokens
      const tokens = this.generateTokens(userWithPassword);

      // Remove password from user object
      const { password: _password, ...user } = userWithPassword;

      return {
        success: true,
        data: {
          user,
          tokens
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      const { email, password, firstName, lastName, phone, agreeToTerms } = userData;

      // Check if user already exists
      if (this.users.has(email)) {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Validate terms agreement
      if (!agreeToTerms) {
        return {
          success: false,
          error: 'You must agree to the terms and conditions'
        };
      }

      // Validate password strength
      if (!this.validatePasswordStrength(password)) {
        return {
          success: false,
          error: 'Password does not meet security requirements'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.config.password.saltRounds);

      // Create new user
      const newUser: User & { password: string } = {
        id: Date.now().toString(), // Simple ID generation for development
        email,
        firstName,
        lastName,
        ...(phone && { phone }),
        role: 'user',
        isVerified: false, // Email verification required
        password: hashedPassword,
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          privacy: {
            showProfile: true,
            showContactInfo: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store user
      this.users.set(email, newUser);

      // Generate tokens
      const tokens = this.generateTokens(newUser);

      // Remove password from user object
      const { password: _password, ...user } = newUser;

      return {
        success: true,
        data: {
          user,
          tokens
        },
        message: 'Registration successful'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  async logout(authHeader?: string): Promise<AuthResponse<void>> {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          success: false,
          error: 'No valid token provided'
        };
      }

      const token = authHeader.substring(7);

      // Add token to invalidated tokens set
      this.invalidatedTokens.add(token);

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Logout failed'
      };
    }
  }

  async getProfile(authHeader?: string): Promise<AuthResponse<User>> {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          success: false,
          error: 'No valid token provided'
        };
      }

      const token = authHeader.substring(7);

      // Check if token is invalidated
      if (this.invalidatedTokens.has(token)) {
        return {
          success: false,
          error: 'Token has been invalidated'
        };
      }

      // Verify JWT token
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string; email: string; role: string };

      // Find user by email
      const userWithPassword = this.users.get(decoded.email);
      if (!userWithPassword) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Remove password from user object
      const { password: _password, ...user } = userWithPassword;

      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get user profile'
      };
    }
  }

  async updateProfile(authHeader: string, updates: Partial<User>): Promise<AuthResponse<User>> {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          success: false,
          error: 'No valid token provided'
        };
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string; email: string; role: string };

      const userWithPassword = this.users.get(decoded.email);
      if (!userWithPassword) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Update user data (excluding sensitive fields)
      const filteredUpdates: Partial<User> = {};

      if (updates.firstName !== undefined) {
        filteredUpdates.firstName = updates.firstName;
      }
      if (updates.lastName !== undefined) {
        filteredUpdates.lastName = updates.lastName;
      }
      if (updates.phone !== undefined) {
        filteredUpdates.phone = updates.phone;
      }
      if (updates.preferences !== undefined) {
        filteredUpdates.preferences = updates.preferences;
      }

      // Apply updates
      const updatedUser = {
        ...userWithPassword,
        ...filteredUpdates,
        updatedAt: new Date()
      };

      this.users.set(decoded.email, updatedUser);

      // Remove password from response
      const { password: _password, ...user } = updatedUser;

      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update profile'
      };
    }
  }

  async requestPasswordReset(email: string): Promise<AuthResponse<void>> {
    try {
      const user = this.users.get(email);
      if (!user) {
        // Don't reveal if user exists for security
        return {
          success: true,
          message: this.PASSWORD_RESET_MESSAGE
        };
      }

      // In a real implementation, you would:
      // 1. Generate a secure reset token
      // 2. Store it with expiration
      // 3. Send email with reset link

      // TODO: Implement actual password reset logic

      return {
        success: true,
        message: this.PASSWORD_RESET_MESSAGE
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process password reset request'
      };
    }
  }

  async resetPassword(_token: string, _newPassword: string): Promise<AuthResponse<void>> {
    try {
      // In a real implementation, you would:
      // 1. Verify the reset token
      // 2. Check if it's not expired
      // 3. Hash the new password
      // 4. Update the user's password

      // TODO: Implement actual password reset logic

      return {
        success: true,
        message: 'Password has been reset successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reset password'
      };
    }
  }

  // Helper method to validate token without returning user data
  async validateToken(authHeader?: string): Promise<boolean> {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
      }

      const token = authHeader.substring(7);

      if (this.invalidatedTokens.has(token)) {
        return false;
      }

      jwt.verify(token, this.config.jwt.secret);
      return true;
    } catch (error) {
      return false;
    }
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

    if (this.config.password.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return false;
    }

    return true;
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(user: User & { password: string }): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      trustScore: user.trustScore || 0,
      iat: Math.floor(Date.now() / 1000)
    };

    const options: SignOptions = { expiresIn: this.config.jwt.expiresIn as string };
    const accessToken = jwt.sign(payload, this.config.jwt.secret, options);
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
  private generateRefreshToken(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.parseExpirationTime(this.config.jwt.refreshExpiresIn) * 1000);

    this.refreshTokens.set(token, { userId, expiresAt });
    return token;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthResponse<AuthTokens>> {
    const tokenData = this.refreshTokens.get(refreshToken);

    if (!tokenData || Date.now() > tokenData.expiresAt.getTime()) {
      this.refreshTokens.delete(refreshToken);
      return {
        success: false,
        error: 'Invalid or expired refresh token'
      };
    }

    const userWithPassword = Array.from(this.users.values()).find(u => u.id === tokenData.userId);
    if (!userWithPassword) {
      this.refreshTokens.delete(refreshToken);
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Remove old refresh token
    this.refreshTokens.delete(refreshToken);

    // Generate new tokens
    const tokens = this.generateTokens(userWithPassword);

    return {
      success: true,
      data: tokens
    };
  }

  /**
   * Authentication middleware
   */
  requireAuth() {
    return (req: Request & { user?: User }, res: Response, next: NextFunction): void | Response => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Authentication token required'
        });
      }

      const token = authHeader.substring(7);

      if (this.invalidatedTokens.has(token)) {
        return res.status(401).json({
          success: false,
          error: 'Token has been invalidated'
        });
      }

      try {
        const decoded = jwt.verify(token, this.config.jwt.secret) as any;
        const userWithPassword = this.users.get(decoded.email);

        if (!userWithPassword) {
          return res.status(401).json({
            success: false,
            error: 'User not found'
          });
        }

        const { password: _password, ...user } = userWithPassword;
        req.user = user;
        next();
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }
    };
  }

  /**
   * Role-based authorization middleware
   */
  requireRole(roles: string | string[]) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req: Request & { user?: User }, res: Response, next: NextFunction): void | Response => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to access this resource'
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
    userId?: string,
    failureReason?: string
  ): void {
    const attempt: LoginAttempt = {
      ip,
      userAgent,
      timestamp: new Date(),
      success,
      ...(userId && { userId }),
      ...(failureReason && { failureReason })
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

    const value = parseInt(match[1]);
    const unit = match[2];

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
    activeUsers: number;
    activeRefreshTokens: number;
    lockedAccounts: number;
    recentLoginAttempts: number;
  } {
    const recentAttempts = Array.from(this.loginAttempts.values())
      .flat()
      .filter(attempt => Date.now() - attempt.timestamp.getTime() < 60 * 60 * 1000).length;

    return {
      activeUsers: this.users.size,
      activeRefreshTokens: this.refreshTokens.size,
      lockedAccounts: this.lockedAccounts.size,
      recentLoginAttempts: recentAttempts
    };
  }

  /**
   * Cleanup method to prevent memory leaks
   */
  public cleanup(): void {
    this.cleanupIntervals.forEach(interval => clearInterval(interval));
    this.cleanupIntervals = [];
    this.refreshTokens.clear();
    this.loginAttempts.clear();
    this.lockedAccounts.clear();
  }
}

// Create singleton authentication service with default config
export const authService = new AuthService();