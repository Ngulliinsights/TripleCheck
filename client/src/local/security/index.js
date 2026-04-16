"use strict";
/**
 * Security Framework Index
 * Exports all security-related services, hooks, and utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSecurityMonitoring = exports.useInputSanitization = exports.useSecureApi = exports.useRateLimit = exports.useAuth = exports.useSecureValidation = exports.auditLogService = exports.rateLimitService = exports.authTokenService = void 0;
// Services
// export { default as validationService } from '../services/ValidationService' // File doesn't exist
var AuthTokenService_1 = require("../services/AuthTokenService");
Object.defineProperty(exports, "authTokenService", { enumerable: true, get: function () { return AuthTokenService_1.default; } });
var RateLimitService_1 = require("../services/RateLimitService");
Object.defineProperty(exports, "rateLimitService", { enumerable: true, get: function () { return RateLimitService_1.default; } });
var AuditLogService_1 = require("../services/AuditLogService");
Object.defineProperty(exports, "auditLogService", { enumerable: true, get: function () { return AuditLogService_1.default; } });
// Hooks
var useSecurity_1 = require("../hooks/useSecurity");
Object.defineProperty(exports, "useSecureValidation", { enumerable: true, get: function () { return useSecurity_1.useSecureValidation; } });
Object.defineProperty(exports, "useAuth", { enumerable: true, get: function () { return useSecurity_1.useAuth; } });
Object.defineProperty(exports, "useRateLimit", { enumerable: true, get: function () { return useSecurity_1.useRateLimit; } });
Object.defineProperty(exports, "useSecureApi", { enumerable: true, get: function () { return useSecurity_1.useSecureApi; } });
Object.defineProperty(exports, "useInputSanitization", { enumerable: true, get: function () { return useSecurity_1.useInputSanitization; } });
Object.defineProperty(exports, "useSecurityMonitoring", { enumerable: true, get: function () { return useSecurity_1.useSecurityMonitoring; } });
