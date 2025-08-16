import { Router } from 'express';

import validateRequest, { UserValidationSchemas } from '../middleware/validation.middleware';

import { AuthService } from './auth.service';

const router = Router();
const authService = new AuthService();

// Login
router.post('/login', validateRequest({
  body: UserValidationSchemas.login
}), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Register
router.post('/register', validateRequest({
  body: UserValidationSchemas.register
}), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    await authService.logout(req.headers.authorization);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Get profile
router.get('/profile', async (req, res, next) => {
  try {
    const result = await authService.getProfile(req.headers.authorization);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Update profile
router.patch('/profile', async (req, res, next) => {
  try {
    const result = await authService.updateProfile(req.headers.authorization || '', req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Request password reset
router.post('/forgot-password', async (req, res, next) => {
  try {
    const result = await authService.requestPasswordReset(req.body.email);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password', async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Check email availability
router.get('/check-email', async (req, res, next) => {
  try {
    const { email } = req.query;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email parameter is required'
      });
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({
        success: true,
        available: false,
        message: 'Invalid email format'
      });
    }
    
    // Mock email availability check
    // In real implementation, this would check the database
    const unavailableEmails = [
      'admin@example.com',
      'test@test.com',
      'user@demo.com'
    ];
    
    const isAvailable = !unavailableEmails.includes(email.toLowerCase());
    
    res.json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Email is available' : 'Email is already registered'
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };