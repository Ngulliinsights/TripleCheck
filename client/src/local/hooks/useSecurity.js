"use strict";
/**
 * Security Hooks
 * React hooks for security features and validation
 */
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSecurityMonitoring = exports.useInputSanitization = exports.useSecureApi = exports.useRateLimit = exports.useAuthLegacy = exports.useSecureValidation = void 0;
var react_1 = require("react");
var validation_error_1 = require("../error-handling/errors/validation-error");
var AuthTokenService_1 = require("../services/AuthTokenService");
var RateLimitService_1 = require("../services/RateLimitService");
var AuditLogService_1 = require("../services/AuditLogService");
// Simple sanitization functions
var sanitizeHtml = function (input) {
    return input.replace(/<[^>]*>/g, '');
};
var sanitizeSql = function (input) {
    return input.replace(/['";\\]/g, '');
};
var sanitizeUserInput = function (input) {
    return input.trim().replace(/[<>]/g, '');
};
/**
 * Hook for form validation with security features
 */
var useSecureValidation = function (schema) {
    var _a = (0, react_1.useState)({}), errors = _a[0], setErrors = _a[1];
    var _b = (0, react_1.useState)(false), isValidating = _b[0], setIsValidating = _b[1];
    var validate = (0, react_1.useCallback)(function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var result, errorMap;
        return __generator(this, function (_a) {
            setIsValidating(true);
            try {
                // Log validation attempt
                AuditLogService_1.auditLogService.logUserAction('form_validation', {
                    fields: Object.keys(data)
                });
                result = schema.parse(data);
                setErrors({}); // Clear errors on success
                return [2 /*return*/, { success: true, data: result }];
            }
            catch (error) {
                if (error instanceof validation_error_1.ValidationError) {
                    errorMap = error.fieldErrors ?
                        Object.entries(error.fieldErrors).reduce(function (acc, _a) {
                            var field = _a[0], messages = _a[1];
                            acc[field] = messages[0] || 'Validation error';
                            return acc;
                        }, {}) : {};
                    setErrors(errorMap);
                    // Log validation failure
                    AuditLogService_1.auditLogService.logSecurityEvent('validation_failed', {
                        errors: errorMap,
                        fieldCount: Object.keys(data).length
                    }, 'low');
                    return [2 /*return*/, { success: false, error: error }];
                }
                throw error;
            }
            finally {
                setIsValidating(false);
            }
            return [2 /*return*/];
        });
    }); }, [schema]);
    var clearErrors = (0, react_1.useCallback)(function () {
        setErrors({});
    }, []);
    var setFieldError = (0, react_1.useCallback)(function (field, error) {
        setErrors(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = error, _a)));
        });
    }, []);
    return {
        errors: errors,
        isValidating: isValidating,
        validate: validate,
        clearErrors: clearErrors,
        setFieldError: setFieldError,
        hasErrors: Object.keys(errors).length > 0
    };
};
exports.useSecureValidation = useSecureValidation;
/**
 * Hook for authentication state management
 * @deprecated Use useAuth from '@/auth/hooks' instead
 */
var useAuthLegacy = function () {
    var _a = (0, react_1.useState)(false), isAuthenticated = _a[0], setIsAuthenticated = _a[1];
    var _b = (0, react_1.useState)(null), user = _b[0], setUser = _b[1];
    var _c = (0, react_1.useState)(true), isLoading = _c[0], setIsLoading = _c[1];
    (0, react_1.useEffect)(function () {
        var token = AuthTokenService_1.authTokenService.getAccessToken();
        var payload = AuthTokenService_1.authTokenService.getTokenPayload();
        setIsAuthenticated(!!token);
        setUser(payload);
        setIsLoading(false);
        // Subscribe to token changes
        var callbackId = 'auth_hook';
        AuthTokenService_1.authTokenService.onTokenChange(callbackId, function (newToken) {
            var newPayload = newToken ? AuthTokenService_1.authTokenService.getTokenPayload() : null;
            setIsAuthenticated(!!newToken);
            setUser(newPayload);
        });
        return function () {
            AuthTokenService_1.authTokenService.offTokenChange(callbackId);
        };
    }, []);
    var login = (0, react_1.useCallback)(function (credentials) { return __awaiter(void 0, void 0, void 0, function () {
        var response, tokenPair, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    AuditLogService_1.auditLogService.logAuthentication('login_attempt', true, {
                        email: credentials.email
                    });
                    return [4 /*yield*/, fetch('/api/auth/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(credentials)
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Login failed');
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    tokenPair = _a.sent();
                    AuthTokenService_1.authTokenService.setTokens(tokenPair);
                    AuditLogService_1.auditLogService.logAuthentication('login_success', true, {
                        email: credentials.email
                    });
                    return [2 /*return*/, true];
                case 3:
                    error_1 = _a.sent();
                    AuditLogService_1.auditLogService.logAuthentication('login_failed', false, {
                        email: credentials.email,
                        error: error_1.message
                    });
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    }); }, []);
    var logout = (0, react_1.useCallback)(function () {
        AuditLogService_1.auditLogService.logAuthentication('logout', true, {
            userId: user === null || user === void 0 ? void 0 : user.userId
        });
        AuthTokenService_1.authTokenService.clearTokens();
    }, [user]);
    var hasPermission = (0, react_1.useCallback)(function (permission) {
        return AuthTokenService_1.authTokenService.hasPermission(permission);
    }, []);
    var hasRole = (0, react_1.useCallback)(function (role) {
        return AuthTokenService_1.authTokenService.hasRole(role);
    }, []);
    return {
        isAuthenticated: isAuthenticated,
        user: user,
        isLoading: isLoading,
        login: login,
        logout: logout,
        hasPermission: hasPermission,
        hasRole: hasRole
    };
};
exports.useAuthLegacy = useAuthLegacy;
/**
 * Hook for rate limiting
 */
var useRateLimit = function (endpoint, config) {
    var _a = (0, react_1.useState)(null), status = _a[0], setStatus = _a[1];
    var _b = (0, react_1.useState)(false), isBlocked = _b[0], setIsBlocked = _b[1];
    var checkRateLimit = (0, react_1.useCallback)(function () {
        var currentStatus = RateLimitService_1.rateLimitService.checkRateLimit(endpoint, config);
        setStatus(currentStatus);
        setIsBlocked(!currentStatus.allowed);
        if (!currentStatus.allowed) {
            AuditLogService_1.auditLogService.logSecurityEvent('rate_limit_exceeded', {
                endpoint: endpoint,
                remaining: currentStatus.remaining,
                retryAfter: currentStatus.retryAfter
            }, 'medium');
        }
        return currentStatus;
    }, [endpoint, config]);
    var executeWithRateLimit = (0, react_1.useCallback)(function (operation) { return __awaiter(void 0, void 0, void 0, function () {
        var rateLimitStatus, result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rateLimitStatus = checkRateLimit();
                    if (!rateLimitStatus.allowed) {
                        throw new Error("Rate limit exceeded. Try again in ".concat(rateLimitStatus.retryAfter, " seconds."));
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, operation()];
                case 2:
                    result = _a.sent();
                    RateLimitService_1.rateLimitService.recordRequest(endpoint);
                    return [2 /*return*/, result];
                case 3:
                    error_2 = _a.sent();
                    AuditLogService_1.auditLogService.logError(error_2, 'rate_limited_operation', {
                        endpoint: endpoint
                    });
                    throw error_2;
                case 4: return [2 /*return*/];
            }
        });
    }); }, [endpoint, checkRateLimit]);
    (0, react_1.useEffect)(function () {
        checkRateLimit();
    }, [checkRateLimit]);
    return {
        status: status,
        isBlocked: isBlocked,
        checkRateLimit: checkRateLimit,
        executeWithRateLimit: executeWithRateLimit
    };
};
exports.useRateLimit = useRateLimit;
/**
 * Hook for secure API requests
 */
var useSecureApi = function () {
    var makeSecureRequest = (0, react_1.useCallback)(function (url_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([url_1], args_1, true), void 0, function (url, options, rateLimitConfig) {
            var rateLimitStatus, error, authHeaders, headers, csrfToken, startTime, response, responseTime, error_3;
            var _a;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        rateLimitStatus = RateLimitService_1.rateLimitService.checkRateLimit(url, rateLimitConfig);
                        if (!rateLimitStatus.allowed) {
                            error = new Error("Rate limit exceeded for ".concat(url));
                            AuditLogService_1.auditLogService.logSecurityEvent('rate_limit_violation', {
                                url: url,
                                retryAfter: rateLimitStatus.retryAfter
                            }, 'medium');
                            throw error;
                        }
                        authHeaders = AuthTokenService_1.authTokenService.getAuthHeader();
                        headers = __assign(__assign({ 'Content-Type': 'application/json' }, authHeaders), options.headers);
                        csrfToken = (_a = document.querySelector('meta[name="csrf-token"]')) === null || _a === void 0 ? void 0 : _a.getAttribute('content');
                        if (csrfToken) {
                            headers['X-CSRF-Token'] = csrfToken;
                        }
                        startTime = Date.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch(url, __assign(__assign({}, options), { headers: headers }))];
                    case 2:
                        response = _b.sent();
                        responseTime = Date.now() - startTime;
                        // Log API request
                        AuditLogService_1.auditLogService.logApiRequest(url, options.method || 'GET', response.ok, {
                            statusCode: response.status,
                            responseTime: responseTime
                        });
                        // Record successful request for rate limiting
                        RateLimitService_1.rateLimitService.recordRequest(url);
                        if (!response.ok) {
                            throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                        }
                        return [2 /*return*/, response];
                    case 3:
                        error_3 = _b.sent();
                        AuditLogService_1.auditLogService.logError(error_3, 'secure_api_request', {
                            url: url,
                            method: options.method || 'GET'
                        });
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    }, []);
    return { makeSecureRequest: makeSecureRequest };
};
exports.useSecureApi = useSecureApi;
/**
 * Hook for input sanitization
 */
var useInputSanitization = function () {
    var sanitizeInput = (0, react_1.useCallback)(function (input, type) {
        if (type === void 0) { type = 'user'; }
        AuditLogService_1.auditLogService.logUserAction('input_sanitization', {
            type: type,
            inputLength: input.length
        });
        switch (type) {
            case 'html':
                return sanitizeHtml(input);
            case 'sql':
                return sanitizeSql(input);
            case 'user':
            default:
                return sanitizeUserInput(input);
        }
    }, []);
    var sanitizeObject = (0, react_1.useCallback)(function (obj) {
        var sanitized = {};
        for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (typeof value === 'string') {
                sanitized[key] = sanitizeInput(value);
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeObject(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }, [sanitizeInput]);
    return {
        sanitizeInput: sanitizeInput,
        sanitizeObject: sanitizeObject
    };
};
exports.useInputSanitization = useInputSanitization;
/**
 * Hook for security monitoring
 */
var useSecurityMonitoring = function () {
    var _a = (0, react_1.useState)([]), securityEvents = _a[0], setSecurityEvents = _a[1];
    var _b = (0, react_1.useState)(false), isMonitoring = _b[0], setIsMonitoring = _b[1];
    var intervalRef = (0, react_1.useRef)();
    var startMonitoring = (0, react_1.useCallback)(function () {
        if (isMonitoring)
            return;
        setIsMonitoring(true);
        var updateEvents = function () {
            var summary = AuditLogService_1.auditLogService.getSecuritySummary();
            setSecurityEvents(summary.recentEvents);
        };
        updateEvents();
        intervalRef.current = setInterval(updateEvents, 30000); // Update every 30 seconds
    }, [isMonitoring]);
    var stopMonitoring = (0, react_1.useCallback)(function () {
        if (!isMonitoring)
            return;
        setIsMonitoring(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    }, [isMonitoring]);
    var getSecuritySummary = (0, react_1.useCallback)(function () {
        return AuditLogService_1.auditLogService.getSecuritySummary();
    }, []);
    (0, react_1.useEffect)(function () {
        return function () {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);
    return {
        securityEvents: securityEvents,
        isMonitoring: isMonitoring,
        startMonitoring: startMonitoring,
        stopMonitoring: stopMonitoring,
        getSecuritySummary: getSecuritySummary
    };
};
exports.useSecurityMonitoring = useSecurityMonitoring;
