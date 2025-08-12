import { z } from 'zod';

import {
  ApiContract,
  SuccessResponseSchema,
  PaginatedResponseSchema,
  apiContractRegistry,
} from '../api-contracts';

// User Schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  role: z.enum(['user', 'agent', 'admin']),
  status: z.enum(['active', 'inactive', 'suspended']),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']),
  trustScore: z.number().min(0).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().optional(),
});

export type User = z.infer<typeof UserSchema>;

// Public User Schema (for public profiles)
export const PublicUserSchema = UserSchema.omit({
  email: true,
  phone: true,
  lastLoginAt: true,
});

export type PublicUser = z.infer<typeof PublicUserSchema>;

// User Registration Request Schema
export const UserRegistrationRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  role: z.enum(['user', 'agent']).default('user'),
}).transform((data) => ({
  ...data,
  role: data.role as 'user' | 'agent',
}));

export type UserRegistrationRequest = z.infer<typeof UserRegistrationRequestSchema>;

// User Login Request Schema
export const UserLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false),
}).transform((data) => ({
  ...data,
  rememberMe: data.rememberMe as boolean,
}));

export type UserLoginRequest = z.infer<typeof UserLoginRequestSchema>;

// User Profile Update Request Schema
export const UserProfileUpdateRequestSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

export type UserProfileUpdateRequest = z.infer<typeof UserProfileUpdateRequestSchema>;

// Password Change Request Schema
export const PasswordChangeRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type PasswordChangeRequest = z.infer<typeof PasswordChangeRequestSchema>;

// Authentication Response Schema
export const AuthResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
  refreshToken: z.string(),
  expiresAt: z.string().datetime(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// User Contracts
export const UserRegistrationContract: ApiContract<UserRegistrationRequest, any> = {
  method: 'POST',
  path: '/api/auth/register',
  requestSchema: UserRegistrationRequestSchema,
  responseSchema: SuccessResponseSchema(AuthResponseSchema),
  description: 'Register new user account',
  tags: ['auth', 'users'],
};

export const UserLoginContract: ApiContract<UserLoginRequest, any> = {
  method: 'POST',
  path: '/api/auth/login',
  requestSchema: UserLoginRequestSchema,
  responseSchema: SuccessResponseSchema(AuthResponseSchema),
  description: 'Login user',
  tags: ['auth', 'users'],
};

export const UserLogoutContract: ApiContract<{}, any> = {
  method: 'POST',
  path: '/api/auth/logout',
  responseSchema: SuccessResponseSchema(z.object({ success: z.boolean() })),
  description: 'Logout user',
  tags: ['auth', 'users'],
};

export const UserProfileContract: ApiContract<{}, any> = {
  method: 'GET',
  path: '/api/users/profile',
  responseSchema: SuccessResponseSchema(UserSchema),
  description: 'Get current user profile',
  tags: ['users'],
};

export const UserProfileUpdateContract: ApiContract<UserProfileUpdateRequest, any> = {
  method: 'PUT',
  path: '/api/users/profile',
  requestSchema: UserProfileUpdateRequestSchema,
  responseSchema: SuccessResponseSchema(UserSchema),
  description: 'Update user profile',
  tags: ['users'],
};

export const PasswordChangeContract: ApiContract<PasswordChangeRequest, any> = {
  method: 'POST',
  path: '/api/users/change-password',
  requestSchema: PasswordChangeRequestSchema,
  responseSchema: SuccessResponseSchema(z.object({ success: z.boolean() })),
  description: 'Change user password',
  tags: ['users'],
};

export const UserPublicProfileContract: ApiContract<{ id: string }, any> = {
  method: 'GET',
  path: '/api/users/:id/public',
  requestSchema: z.object({ id: z.string() }),
  responseSchema: SuccessResponseSchema(PublicUserSchema),
  description: 'Get public user profile',
  tags: ['users'],
};

// Register contracts
apiContractRegistry.register('user.register', UserRegistrationContract);
apiContractRegistry.register('user.login', UserLoginContract);
apiContractRegistry.register('user.logout', UserLogoutContract);
apiContractRegistry.register('user.profile', UserProfileContract);
apiContractRegistry.register('user.profile.update', UserProfileUpdateContract);
apiContractRegistry.register('user.password.change', PasswordChangeContract);
apiContractRegistry.register('user.public.profile', UserPublicProfileContract);