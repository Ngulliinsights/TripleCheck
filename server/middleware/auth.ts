import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";

// Enhanced authentication middleware with better error handling

export interface AuthenticatedRequest extends Request {
  session: any;
  user?: {
    id: number;
    username: string;
    trustScore: number;
    isVerifiedAgent: boolean;
  };
}

// Validation schemas
export const LoginSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
});

export const RegisterSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number")
});

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Session utilities
export function getUserIdFromSession(req: AuthenticatedRequest): number | null {
  return req.session?.userId || null;
}

export function setUserSession(req: AuthenticatedRequest, userId: number): void {
  if (req.session) {
    req.session.userId = userId;
    req.session.lastActivity = new Date().toISOString();
  }
}

export function clearUserSession(req: AuthenticatedRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

// Authentication middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = getUserIdFromSession(req);
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
      message: "Please log in to access this resource"
    });
  }
  
  next();
}

// Optional authentication middleware (doesn't block if not authenticated)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = getUserIdFromSession(req);
  
  if (userId) {
    // User is authenticated, you can add user data to request if needed
    req.user = { id: userId } as any; // This would be populated from database in real implementation
  }
  
  next();
}

// Rate limiting for authentication attempts
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function authRateLimit(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    const attempts = authAttempts.get(clientId);
    
    if (!attempts || now - attempts.lastAttempt > windowMs) {
      // Reset or initialize attempts
      authAttempts.set(clientId, { count: 1, lastAttempt: now });
      return next();
    }
    
    if (attempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((windowMs - (now - attempts.lastAttempt)) / 1000 / 60);
      return res.status(429).json({
        success: false,
        error: "Too many authentication attempts",
        message: `Please try again in ${timeLeft} minutes`,
        retryAfter: timeLeft * 60
      });
    }
    
    // Increment attempts
    attempts.count++;
    attempts.lastAttempt = now;
    
    next();
  };
}

// Clear successful authentication attempts
export function clearAuthAttempts(clientId: string) {
  authAttempts.delete(clientId);
}

// Session validation middleware
export function validateSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    // Check if session is too old (optional)
    const lastActivity = req.session.lastActivity;
    if (lastActivity) {
      const sessionAge = Date.now() - new Date(lastActivity).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (sessionAge > maxAge) {
        // Session is too old, clear it
        req.session.destroy(() => {
          res.status(401).json({
            success: false,
            error: "Session expired",
            message: "Please log in again"
          });
        });
        return;
      }
      
      // Update last activity
      req.session.lastActivity = new Date().toISOString();
    }
  }
  
  next();
}

// Error messages
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "Invalid username or password",
  USERNAME_EXISTS: "Username already exists",
  REGISTRATION_FAILED: "Registration failed",
  LOGIN_FAILED: "Login failed",
  LOGOUT_FAILED: "Logout failed",
  AUTH_REQUIRED: "Authentication required",
  SESSION_EXPIRED: "Session expired",
  RATE_LIMITED: "Too many attempts, please try again later"
} as const;