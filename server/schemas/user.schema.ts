/**
 * User Validation Schemas with Zod
 */

import { z } from 'zod';

// Password validation
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
    'Password must contain at least one special character'
  );

// Email validation
const emailSchema = z.string().email('Invalid email address');

// Username validation
const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

// Base user schema
export const UserSchema = z.object({
  id: z.number().int().positive(),
  username: usernameSchema,
  email: emailSchema,
  password: z.string(), // Hashed password
  role: z.enum(['user', 'agent', 'admin']),
  trustScore: z.number().int().min(0).max(100).default(50),
  isVerifiedAgent: z.boolean().default(false),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  bio: z.string().max(500).nullable(),
  profileImageUrl: z.string().url().nullable(),
  phone: z.string().nullable(),
  isActive: z.boolean().default(true),
  emailVerifiedAt: z.date().nullable(),
  lastLoginAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// Schema for user registration
export const RegisterUserSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['user', 'agent']).default('user'),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

// Schema for user login
export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// Schema for updating user profile
export const UpdateUserSchema = z.object({
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  bio: z.string().max(500).optional(),
  profileImageUrl: z.string().url().optional(),
  phone: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// Schema for changing password
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// Schema for password reset request
export const PasswordResetRequestSchema = z.object({
  email: emailSchema,
});

export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;

// Schema for password reset
export const PasswordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;

// Schema for user ID validation
export const UserIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid user ID').transform(Number),
});

export type UserIdInput = z.infer<typeof UserIdSchema>;

export default {
  UserSchema,
  RegisterUserSchema,
  LoginSchema,
  UpdateUserSchema,
  ChangePasswordSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema,
  UserIdSchema,
};
