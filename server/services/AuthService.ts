import bcrypt from 'bcrypt';
import type { User, InsertUser } from '../../src/shared/schema';
import type { IStorage } from '../infrastructure/storage/storage';
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResult, 
  SessionValidationResult,
  RateLimitResult,
  AuthenticatedRequest 
} from '../types/auth.types';
import { AUTH_CONSTANTS } from '../utils/constants';
import { AUTH_ERROR_MESSAGES, DATABASE_ERROR_MESSAGES } from '../utils/error-messages';

/**
 * AuthService handles all authentication-related business logic
 * including user registration, login, session management, and password operations
 */
export class AuthService {
  private storage: IStorage;
  
  // Rate limiting storage (in production, this should use Redis or similar)
  private static loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Register a new user with password hashing and validation
   */
  async register(userData: RegisterRequest): Promise<AuthResult> {
    try {
      // Check if username already exists
      const existingUser = await this.storage.getUserByUsername(userData.username);
      if (existingUser) {
        throw new Error(AUTH_ERROR_MESSAGES.USERNAME_EXISTS);
      }

      // Hash password with appropriate salt rounds
      const saltRounds = process.env.NODE_ENV === 'production' 
        ? AUTH_CONSTANTS.SALT_ROUNDS_PRODUCTION 
        : AUTH_CONSTANTS.SALT_ROUNDS_DEVELOPMENT;
      
      const hashedPassword = await this.hashPassword(userData.password, saltRounds);

      // Create user with hashed password
      const newUser: InsertUser = {
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
      };

      const user = await this.storage.createUser(newUser);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      return {
        user: userWithoutPassword,
        expiresAt: new Date(Date.now() + AUTH_CONSTANTS.SESSION_MAX_AGE),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === AUTH_ERROR_MESSAGES.USERNAME_EXISTS) {
          throw error;
        }
      }
      
      console.error('Registration error:', error);
      throw new Error(AUTH_ERROR_MESSAGES.REGISTRATION_FAILED);
    }
  }

  /**
   * Authenticate user with username and password
   */
  async login(credentials: LoginRequest, clientId: string = 'unknown'): Promise<AuthResult> {
    try {
      // Check rate limiting
      const rateLimitResult = this.checkRateLimit(clientId);
      if (!rateLimitResult.allowed) {
        throw new Error(AUTH_ERROR_MESSAGES.RATE_LIMITED);
      }

      // Get user by username
      const user = await this.storage.getUserByUsername(credentials.username);
      if (!user) {
        this.recordFailedAttempt(clientId);
        throw new Error(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // Validate password
      const isPasswordValid = await this.validateCredentials(credentials.username, credentials.password);
      if (!isPasswordValid) {
        this.recordFailedAttempt(clientId);
        throw new Error(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // Clear failed attempts on successful login
      this.clearFailedAttempts(clientId);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      return {
        user: userWithoutPassword,
        expiresAt: new Date(Date.now() + AUTH_CONSTANTS.SESSION_MAX_AGE),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS || 
            error.message === AUTH_ERROR_MESSAGES.RATE_LIMITED) {
          throw error;
        }
      }
      
      console.error('Login error:', error);
      throw new Error(AUTH_ERROR_MESSAGES.LOGIN_FAILED);
    }
  }

  /**
   * Validate user session and return user data
   */
  async validateSession(userId: number): Promise<SessionValidationResult> {
    try {
      if (!userId || userId <= 0) {
        return {
          valid: false,
          error: AUTH_ERROR_MESSAGES.INVALID_SESSION,
        };
      }

      const user = await this.storage.getUser(userId);
      if (!user) {
        return {
          valid: false,
          error: AUTH_ERROR_MESSAGES.USER_NOT_FOUND,
        };
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      return {
        valid: true,
        userId: user.id,
        user: userWithoutPassword,
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return {
        valid: false,
        error: AUTH_ERROR_MESSAGES.INVALID_SESSION,
      };
    }
  }

  /**
   * Hash password with specified salt rounds
   */
  async hashPassword(password: string, saltRounds: number = AUTH_CONSTANTS.SALT_ROUNDS_PRODUCTION): Promise<string> {
    try {
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Validate user credentials by comparing password hash
   */
  async validateCredentials(username: string, password: string): Promise<boolean> {
    try {
      const user = await this.storage.getUserByUsername(username);
      if (!user) {
        return false;
      }

      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('Credential validation error:', error);
      return false;
    }
  }

  /**
   * Get user by ID (used for session validation)
   */
  async getUserById(userId: number): Promise<Omit<User, 'password'> | null> {
    try {
      const user = await this.storage.getUser(userId);
      if (!user) {
        return null;
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
  }

  /**
   * Get user by username (used for login)
   */
  async getUserByUsername(username: string): Promise<Omit<User, 'password'> | null> {
    try {
      const user = await this.storage.getUserByUsername(username);
      if (!user) {
        return null;
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Get user by username error:', error);
      return null;
    }
  }

  /**
   * Set user session with proper typing
   */
  setUserSession(req: AuthenticatedRequest, userId: number): void {
    if (req.session) {
      req.session.userId = userId;
      req.session.lastActivity = new Date().toISOString();
    }
  }

  /**
   * Clear user session
   */
  async clearUserSession(req: AuthenticatedRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            console.error('Session destruction error:', err);
            reject(new Error(AUTH_ERROR_MESSAGES.LOGOUT_FAILED));
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get user ID from session
   */
  getUserIdFromSession(req: AuthenticatedRequest): number | null {
    return req.session?.userId ?? null;
  }

  /**
   * Check if session is valid and not expired
   */
  isSessionValid(req: AuthenticatedRequest, maxAgeMs: number = AUTH_CONSTANTS.SESSION_MAX_AGE): boolean {
    if (!req.session?.userId) {
      return false;
    }

    const lastActivity = req.session.lastActivity;
    if (lastActivity) {
      const sessionAge = Date.now() - new Date(lastActivity).getTime();
      return sessionAge <= maxAgeMs;
    }

    return true;
  }

  /**
   * Update session activity timestamp
   */
  updateSessionActivity(req: AuthenticatedRequest): void {
    if (req.session?.userId) {
      req.session.lastActivity = new Date().toISOString();
    }
  }

  /**
   * Check rate limiting for login attempts
   */
  private checkRateLimit(
    clientId: string,
    maxAttempts: number = AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS,
    windowMs: number = AUTH_CONSTANTS.RATE_LIMIT_WINDOW
  ): RateLimitResult {
    const now = Date.now();
    const attempts = AuthService.loginAttempts.get(clientId);

    if (!attempts || now - attempts.lastAttempt > windowMs) {
      // Reset or initialize attempts
      AuthService.loginAttempts.set(clientId, { count: 0, lastAttempt: now });
      return { 
        allowed: true, 
        attemptsRemaining: maxAttempts 
      };
    }

    if (attempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((windowMs - (now - attempts.lastAttempt)) / 1000 / 60);
      return { 
        allowed: false, 
        timeLeft,
        attemptsRemaining: 0
      };
    }

    return { 
      allowed: true, 
      attemptsRemaining: maxAttempts - attempts.count 
    };
  }

  /**
   * Record failed login attempt
   */
  private recordFailedAttempt(clientId: string): void {
    const now = Date.now();
    const attempts = AuthService.loginAttempts.get(clientId);

    if (attempts) {
      attempts.count++;
      attempts.lastAttempt = now;
    } else {
      AuthService.loginAttempts.set(clientId, { count: 1, lastAttempt: now });
    }
  }

  /**
   * Clear failed login attempts (called on successful login)
   */
  private clearFailedAttempts(clientId: string): void {
    AuthService.loginAttempts.delete(clientId);
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters long`);
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate username format
   */
  validateUsername(username: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (username.length < AUTH_CONSTANTS.USERNAME_MIN_LENGTH) {
      errors.push(`Username must be at least ${AUTH_CONSTANTS.USERNAME_MIN_LENGTH} characters long`);
    }

    if (username.length > AUTH_CONSTANTS.USERNAME_MAX_LENGTH) {
      errors.push(`Username must be less than ${AUTH_CONSTANTS.USERNAME_MAX_LENGTH} characters long`);
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get rate limit status for a client
   */
  getRateLimitStatus(clientId: string): RateLimitResult {
    return this.checkRateLimit(clientId);
  }

  /**
   * Clean up expired rate limit entries (should be called periodically)
   */
  static cleanupRateLimitEntries(): void {
    const now = Date.now();
    const windowMs = AUTH_CONSTANTS.RATE_LIMIT_WINDOW;

    for (const [clientId, attempts] of AuthService.loginAttempts.entries()) {
      if (now - attempts.lastAttempt > windowMs) {
        AuthService.loginAttempts.delete(clientId);
      }
    }
  }
}