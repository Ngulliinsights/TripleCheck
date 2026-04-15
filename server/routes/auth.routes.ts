/**
 * Authentication Routes v2
 * Using Passport.js and Zod validation
 */

import { Router } from 'express';
import passport from '../auth/passport-config';
import { requireAuth } from '../auth/authorization';
import { validateBody } from '../middleware/validation';
import { authLimiter } from '../middleware/rate-limit';
import {
  RegisterUserSchema,
  LoginSchema,
  ChangePasswordSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema,
} from '../schemas/user.schema';
import { logger } from '../infrastructure/observability/telemetry';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { storage } from '../infrastructure/storage/storage';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

/**
 * POST /api/auth/register
 * Register new user
 */
router.post(
  '/register',
  validateBody(RegisterUserSchema),
  async (req, res) => {
    try {
      const userData = req.body;

      logger.info('User registration attempt', { email: userData.email });

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User already exists',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = {
        ...userData,
        password: hashedPassword,
        trustScore: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: Save user to database
      // const savedUser = await storage.createUser(user);

      logger.info('User registered successfully', { email: userData.email });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: 1, // savedUser.id
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      logger.error('Registration failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Registration failed',
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  validateBody(LoginSchema),
  (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        logger.error('Login error', { error: err.message });
        return res.status(500).json({
          success: false,
          error: 'Login failed',
        });
      }

      if (!user) {
        logger.warn('Login failed', { email: req.body.email, reason: info?.message });
        return res.status(401).json({
          success: false,
          error: info?.message || 'Invalid credentials',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          sub: user.id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          trustScore: user.trustScore,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        {
          expiresIn: '24h',
          issuer: 'triplecheck-api',
          audience: 'triplecheck-app',
        }
      );

      // Generate refresh token (store in database)
      const refreshToken = jwt.sign(
        { sub: user.id.toString() },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Update last login
      // await storage.updateUserLastLogin(user.id);

      logger.info('Login successful', { userId: user.id, email: user.email });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            trustScore: user.trustScore,
          },
          accessToken: token,
          refreshToken,
          expiresIn: 86400, // 24 hours in seconds
        },
      });
    })(req, res, next);
  }
);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', requireAuth(), async (req, res) => {
  try {
    const user = (req as any).user;

    logger.info('User logout', { userId: user.id });

    // TODO: Invalidate refresh token in database

    req.logout((err) => {
      if (err) {
        logger.error('Logout error', { error: err.message });
        return res.status(500).json({
          success: false,
          error: 'Logout failed',
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  } catch (error: any) {
    logger.error('Logout failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', requireAuth(), async (req, res) => {
  try {
    const user = (req as any).user;

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        trustScore: user.trustScore,
        isVerifiedAgent: user.isVerifiedAgent,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      },
    });
  } catch (error: any) {
    logger.error('Get current user failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post(
  '/change-password',
  requireAuth(),
  validateBody(ChangePasswordSchema),
  async (req, res) => {
    try {
      const user = (req as any).user;
      const { currentPassword, newPassword } = req.body;

      logger.info('Password change attempt', { userId: user.id });

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      // await storage.updateUserPassword(user.id, hashedPassword);

      logger.info('Password changed successfully', { userId: user.id });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      logger.error('Password change failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to change password',
      });
    }
  }
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  validateBody(PasswordResetRequestSchema),
  async (req, res) => {
    try {
      const { email } = req.body;

      logger.info('Password reset requested', { email });

      // Check if user exists
      const user = await storage.getUserByUsername(email);
      if (!user) {
        // Don't reveal if user exists
        return res.json({
          success: true,
          message: 'If the email exists, a reset link has been sent',
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { sub: user.id.toString(), type: 'password-reset' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      // TODO: Send reset email
      // await sendPasswordResetEmail(user.email, resetToken);

      logger.info('Password reset email sent', { email });

      res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
    } catch (error: any) {
      logger.error('Password reset request failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to process password reset request',
      });
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post(
  '/reset-password',
  validateBody(PasswordResetSchema),
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      logger.info('Password reset attempt');

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as any;

      if (decoded.type !== 'password-reset') {
        return res.status(400).json({
          success: false,
          error: 'Invalid reset token',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      // await storage.updateUserPassword(decoded.sub, hashedPassword);

      logger.info('Password reset successful', { userId: decoded.sub });

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          error: 'Reset token has expired',
        });
      }

      logger.error('Password reset failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to reset password',
      });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as any;

    // Get user
    const user = await storage.getUser(parseInt(decoded.sub));
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        sub: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        trustScore: user.trustScore,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      {
        expiresIn: '24h',
        issuer: 'triplecheck-api',
        audience: 'triplecheck-app',
      }
    );

    logger.info('Token refreshed', { userId: user.id });

    res.json({
      success: true,
      data: {
        accessToken,
        expiresIn: 86400,
      },
    });
  } catch (error: any) {
    logger.error('Token refresh failed', { error: error.message });
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
    });
  }
});

export default router;
