import { Router } from 'express';
import { AuthService } from './auth.service';
import validateRequest, { UserValidationSchemas } from '../middleware/validation.middleware';

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

export { router as authRouter };