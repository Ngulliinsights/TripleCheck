"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPublicProfileContract = exports.PasswordChangeContract = exports.UserProfileUpdateContract = exports.UserProfileContract = exports.UserLogoutContract = exports.UserLoginContract = exports.UserRegistrationContract = exports.AuthResponseSchema = exports.PasswordChangeRequestSchema = exports.UserProfileUpdateRequestSchema = exports.UserLoginRequestSchema = exports.UserRegistrationRequestSchema = exports.PublicUserSchema = exports.UserSchema = void 0;
var zod_1 = require("zod");
var api_contracts_1 = require("../api-contracts");
// User Schemas
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().min(1).max(50),
    lastName: zod_1.z.string().min(1).max(50),
    phone: zod_1.z.string().optional(),
    avatar: zod_1.z.string().url().optional(),
    role: zod_1.z.enum(['user', 'agent', 'admin']),
    status: zod_1.z.enum(['active', 'inactive', 'suspended']),
    verificationStatus: zod_1.z.enum(['pending', 'verified', 'rejected']),
    trustScore: zod_1.z.number().min(0).max(100),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    lastLoginAt: zod_1.z.string().datetime().optional(),
});
// Public User Schema (for public profiles)
exports.PublicUserSchema = exports.UserSchema.omit({
    email: true,
    phone: true,
    lastLoginAt: true,
});
// User Registration Request Schema
var UserRegistrationRequestSchemaBase = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(128),
    firstName: zod_1.z.string().min(1).max(50),
    lastName: zod_1.z.string().min(1).max(50),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['user', 'agent']).default('user'),
});
exports.UserRegistrationRequestSchema = UserRegistrationRequestSchemaBase.transform(function (data) { return (__assign(__assign({}, data), { role: data.role })); });
// User Login Request Schema
var UserLoginRequestSchemaBase = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
    rememberMe: zod_1.z.boolean().default(false),
});
exports.UserLoginRequestSchema = UserLoginRequestSchemaBase.transform(function (data) { return (__assign(__assign({}, data), { rememberMe: data.rememberMe })); });
// User Profile Update Request Schema
exports.UserProfileUpdateRequestSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(50).optional(),
    lastName: zod_1.z.string().min(1).max(50).optional(),
    phone: zod_1.z.string().optional(),
    avatar: zod_1.z.string().url().optional(),
});
// Password Change Request Schema
exports.PasswordChangeRequestSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8).max(128),
    confirmPassword: zod_1.z.string().min(8).max(128),
}).refine(function (data) { return data.newPassword === data.confirmPassword; }, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
// Authentication Response Schema
exports.AuthResponseSchema = zod_1.z.object({
    user: exports.UserSchema,
    token: zod_1.z.string(),
    refreshToken: zod_1.z.string(),
    expiresAt: zod_1.z.string().datetime(),
});
// User Contracts
exports.UserRegistrationContract = {
    method: 'POST',
    path: '/api/auth/register',
    requestSchema: UserRegistrationRequestSchemaBase,
    responseSchema: (0, api_contracts_1.SuccessResponseSchema)(exports.AuthResponseSchema),
    description: 'Register new user account',
    tags: ['auth', 'users'],
};
exports.UserLoginContract = {
    method: 'POST',
    path: '/api/auth/login',
    requestSchema: UserLoginRequestSchemaBase,
    responseSchema: (0, api_contracts_1.SuccessResponseSchema)(exports.AuthResponseSchema),
    description: 'Login user',
    tags: ['auth', 'users'],
};
exports.UserLogoutContract = {
    method: 'POST',
    path: '/api/auth/logout',
    responseSchema: (0, api_contracts_1.SuccessResponseSchema)(zod_1.z.object({ success: zod_1.z.boolean() })),
    description: 'Logout user',
    tags: ['auth', 'users'],
};
exports.UserProfileContract = {
    method: 'GET',
    path: '/api/users/profile',
    responseSchema: (0, api_contracts_1.SuccessResponseSchema)(exports.UserSchema),
    description: 'Get current user profile',
    tags: ['users'],
};
exports.UserProfileUpdateContract = {
    method: 'PUT',
    path: '/api/users/profile',
    requestSchema: exports.UserProfileUpdateRequestSchema,
    responseSchema: (0, api_contracts_1.SuccessResponseSchema)(exports.UserSchema),
    description: 'Update user profile',
    tags: ['users'],
};
exports.PasswordChangeContract = {
    method: 'POST',
    path: '/api/users/change-password',
    requestSchema: exports.PasswordChangeRequestSchema,
    responseSchema: (0, api_contracts_1.SuccessResponseSchema)(zod_1.z.object({ success: zod_1.z.boolean() })),
    description: 'Change user password',
    tags: ['users'],
};
exports.UserPublicProfileContract = {
    method: 'GET',
    path: '/api/users/:id/public',
    requestSchema: zod_1.z.object({ id: zod_1.z.string() }),
    responseSchema: (0, api_contracts_1.SuccessResponseSchema)(exports.PublicUserSchema),
    description: 'Get public user profile',
    tags: ['users'],
};
// Register contracts
api_contracts_1.apiContractRegistry.register('user.register', exports.UserRegistrationContract);
api_contracts_1.apiContractRegistry.register('user.login', exports.UserLoginContract);
api_contracts_1.apiContractRegistry.register('user.logout', exports.UserLogoutContract);
api_contracts_1.apiContractRegistry.register('user.profile', exports.UserProfileContract);
api_contracts_1.apiContractRegistry.register('user.profile.update', exports.UserProfileUpdateContract);
api_contracts_1.apiContractRegistry.register('user.password.change', exports.PasswordChangeContract);
api_contracts_1.apiContractRegistry.register('user.public.profile', exports.UserPublicProfileContract);
