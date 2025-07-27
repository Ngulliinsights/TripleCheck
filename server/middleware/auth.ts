// This file is deprecated. Please use ./auth.middleware.ts instead.
// This file is kept for backward compatibility during the migration.

import { z } from "zod";
import bcrypt from "bcrypt";

// Note: This file contains legacy auth utilities
// Main auth functionality is in auth.middleware.ts

// Validation schemas (kept here for now to avoid breaking changes)
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

// Legacy function aliases for backward compatibility
export const getUserIdFromSession = (req: any) => {
  const { SessionManager } = require('./auth.middleware');
  return SessionManager.getUserIdFromSession(req);
};

export const setUserSession = (req: any, userId: number) => {
  const { SessionManager } = require('./auth.middleware');
  return SessionManager.setUserSession(req, userId);
};

export const clearUserSession = (req: any) => {
  const { SessionManager } = require('./auth.middleware');
  return SessionManager.clearUserSession(req);
};