import { Router, Response } from 'express';

import { requireAuth, authRateLimit, clearAuthAttempts, type AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateRequest, UserValidationSchemas, type ValidatedRequest } from '../middleware/validation.middleware';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import type { LoginRequest, RegisterRequest } from '../types/auth.types';
import { HTTP_STATUS } from '../utils/constants';
import { AUTH_ERROR_MESSAGES } from '../utils/error-messages';
import { ResponseHelper } from '../utils/response-helpers';

/**
 * AuthRoutes class handles all authentication-related endpoints
 * Provides user registration, login, logout, and current user retrieval
 */
export class AuthRoutes {
  private router: Router;
  private authService: AuthService;
  private userService: UserService;

  constructor(authService: AuthService, userService: UserService) {
    this.router = Router();
    this.authService = authService;
    this.userService = userService;
    this.initializeRoutes();
  }

  /**
   * Get the configured router with all authentication routes
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Initialize all authentication routes with proper middleware
   */
  private initializeRoutes(): void {
    // User registration endpoint
    this.router.post(
      '/register',
      authRateLimit(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
      validateRequest({
        body: UserValidationSchemas.register,
        sanitize: true,
        stripUnknown: true,
      }),
      this.register.bind(this)
    );

    // User login endpoint
    this.router.post(
      '/login',
      authRateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
      validateRequest({
        body: UserValidationSchemas.login,
        sanitize: true,
        stripUnknown: true,
      }),
      this.login.bind(this)
    );

    // User logout endpoint
    this.router.post(
      '/logout',
      requireAuth,
      this.logout.bind(this)
    );

    // Get current user endpoint
    this.router.get(
      '/me',
      requireAuth,
      this.getCurrentUser.bind(this)
    );

    // Session validation endpoint (for client-side auth checks)
    this.router.get(
      '/validate-session',
      this.validateSession.bind(this)
    );

    // Password change endpoint
    this.router.post(
      '/change-password',
      requireAuth,
      validateRequest({
        body: UserValidationSchemas.changePassword,
        sanitize: true,
        stripUnknown: true,
      }),
      this.changePassword.bind(this)
    );
  }

  /**
   * Handle user registration
   */
  private async register(req: ValidatedRequest<RegisterRequest>, res: Response): Promise<void> {
    try {
      const userData = req.validatedBody!;
      
      // Register user through AuthService
      const authResult = await this.authService.register(userData);
      
      // Set user session
      this.authService.setUserSession(req as AuthenticatedRequest, authResult.user.id);
      
      // Clear rate limiting for successful registration
      clearAuthAttempts(req);
      
      ResponseHelper.created(
        res,
        authResult.user,
        'User registered successfully',
        {
          expiresAt: authResult.expiresAt?.toISOString(),
        }
      );
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof Error) {
        if (error.message === AUTH_ERROR_MESSAGES.USERNAME_EXISTS) {
          ResponseHelper.conflict(res, error.message);
          return;
        }
        
        if (error.message === AUTH_ERROR_MESSAGES.REGISTRATION_FAILED) {
          ResponseHelper.error(res, error.message, HTTP_STATUS.BAD_REQUEST);
          return;
        }
      }
      
      ResponseHelper.error(res, AUTH_ERROR_MESSAGES.REGISTRATION_FAILED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Handle user login
   */
  private async login(req: ValidatedRequest<LoginRequest>, res: Response): Promise<void> {
    try {
      const credentials = req.validatedBody!;
      const clientId = req.ip || 'unknown';
      
      // Authenticate user through AuthService
      const authResult = await this.authService.login(credentials, clientId);
      
      // Set user session
      this.authService.setUserSession(req as AuthenticatedRequest, authResult.user.id);
      
      // Clear rate limiting for successful login
      clearAuthAttempts(req);
      
      ResponseHelper.success(
        res,
        authResult.user,
        'Login successful',
        {
          expiresAt: authResult.expiresAt?.toISOString(),
        }
      );
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof Error) {
        if (error.message === AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS) {
          ResponseHelper.authError(res, error.message, HTTP_STATUS.UNAUTHORIZED);
          return;
        }
        
        if (error.message === AUTH_ERROR_MESSAGES.RATE_LIMITED) {
          ResponseHelper.rateLimited(res, error.message);
          return;
        }
        
        if (error.message === AUTH_ERROR_MESSAGES.LOGIN_FAILED) {
          ResponseHelper.error(res, error.message, HTTP_STATUS.BAD_REQUEST);
          return;
        }
      }
      
      ResponseHelper.error(res, AUTH_ERROR_MESSAGES.LOGIN_FAILED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Handle user logout
   */
  private async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Clear user session through AuthService
      await this.authService.clearUserSession(req);
      
      ResponseHelper.successMessage(res, 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      
      if (error instanceof Error && error.message === AUTH_ERROR_MESSAGES.LOGOUT_FAILED) {
        ResponseHelper.error(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        return;
      }
      
      ResponseHelper.error(res, AUTH_ERROR_MESSAGES.LOGOUT_FAILED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get current authenticated user
   */
  private async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = this.authService.getUserIdFromSession(req);
      
      if (!userId) {
        ResponseHelper.authError(res, AUTH_ERROR_MESSAGES.AUTH_REQUIRED);
        return;
      }
      
      // Get user data through AuthService
      const user = await this.authService.getUserById(userId);
      
      if (!user) {
        // User was deleted but session still exists, clear session
        await this.authService.clearUserSession(req);
        ResponseHelper.authError(res, AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
        return;
      }
      
      ResponseHelper.success(res, user);
    } catch (error) {
      console.error('Get current user error:', error);
      ResponseHelper.error(res, 'Failed to retrieve user information', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Validate current session (for client-side auth checks)
   */
  private async validateSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = this.authService.getUserIdFromSession(req);
      
      if (!userId) {
        ResponseHelper.success(res, {
          isAuthenticated: false,
          userId: null,
        });
        return;
      }
      
      // Validate session through AuthService
      const sessionResult = await this.authService.validateSession(userId);
      
      if (!sessionResult.valid) {
        // Clear invalid session
        await this.authService.clearUserSession(req);
        ResponseHelper.success(res, {
          isAuthenticated: false,
          userId: null,
          error: sessionResult.error,
        });
        return;
      }
      
      ResponseHelper.success(res, {
        isAuthenticated: true,
        userId: sessionResult.userId,
        user: sessionResult.user,
      });
    } catch (error) {
      console.error('Session validation error:', error);
      ResponseHelper.success(res, {
        isAuthenticated: false,
        userId: null,
        error: 'Session validation failed',
      });
    }
  }

  /**
   * Handle password change
   */
  private async changePassword(req: ValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = this.authService.getUserIdFromSession(req as AuthenticatedRequest);
      
      if (!userId) {
        ResponseHelper.authError(res, AUTH_ERROR_MESSAGES.AUTH_REQUIRED);
        return;
      }
      
      const { currentPassword, newPassword } = req.validatedBody!;
      
      // Validate current password
      const user = await this.authService.getUserById(userId);
      if (!user) {
        ResponseHelper.notFound(res, AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
        return;
      }
      
      // Get full user data with password for validation
      const fullUser = await this.userService.getUserById(userId);
      if (!fullUser) {
        ResponseHelper.notFound(res, AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
        return;
      }
      
      // Validate current password
      const isCurrentPasswordValid = await this.authService.validateCredentials(
        fullUser.username, 
        currentPassword
      );
      
      if (!isCurrentPasswordValid) {
        ResponseHelper.authError(res, 'Current password is incorrect', HTTP_STATUS.UNAUTHORIZED);
        return;
      }
      
      // Hash new password and update
      const hashedNewPassword = await this.authService.hashPassword(newPassword);
      await this.userService.updateUserPassword(userId, hashedNewPassword);
      
      ResponseHelper.successMessage(res, 'Password changed successfully');
    } catch (error) {
      console.error('Password change error:', error);
      ResponseHelper.error(res, 'Failed to change password', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Initialize any required resources (called during application startup)
   */
  async initialize(): Promise<void> {
    // Any initialization logic can go here
    // For example, setting up rate limiting cleanup intervals
    console.log('AuthRoutes initialized successfully');
  }
}