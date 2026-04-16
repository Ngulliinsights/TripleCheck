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
exports.shouldAlert = exports.getRetryDelay = exports.isRetryEligible = exports.redactSensitiveData = exports.generateCorrelationId = void 0;
var base_error_1 = require("../errors/base-error");
/**
 * Utility functions for error handling
 */
var generateCorrelationId = function () {
    var _a;
    if (typeof globalThis !== 'undefined' && ((_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.crypto) === null || _a === void 0 ? void 0 : _a.randomUUID)) {
        return globalThis.crypto.randomUUID();
    }
    var timestamp = Date.now().toString(36);
    var randomPart = Math.random().toString(36).slice(2, 11);
    return "".concat(timestamp, "-").concat(randomPart);
};
exports.generateCorrelationId = generateCorrelationId;
var redactSensitiveData = function (data) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    var sensitiveFields = [
        'password', 'token', 'secret', 'key', 'authorization', 'auth',
        'credit_card', 'credit_card_number', 'ssn', 'social_security',
        'api_key', 'api_secret', 'private_key', 'access_token', 'refresh_token',
        'session_id', 'cookie', 'csrf_token'
    ];
    var redacted = Array.isArray(data) ? __spreadArray([], data, true) : __assign({}, data);
    for (var _i = 0, sensitiveFields_1 = sensitiveFields; _i < sensitiveFields_1.length; _i++) {
        var field = sensitiveFields_1[_i];
        if (field in redacted) {
            redacted[field] = '[REDACTED]';
        }
    }
    for (var key in redacted) {
        if (typeof redacted[key] === 'object' && redacted[key] !== null) {
            redacted[key] = (0, exports.redactSensitiveData)(redacted[key]);
        }
    }
    return redacted;
};
exports.redactSensitiveData = redactSensitiveData;
var isRetryEligible = function (error) {
    return error.retryable && [
        503, 502, 504, 429
    ].includes(error.statusCode);
};
exports.isRetryEligible = isRetryEligible;
var getRetryDelay = function (attempt, baseDelay, maxDelay) {
    if (baseDelay === void 0) { baseDelay = 1000; }
    if (maxDelay === void 0) { maxDelay = 30000; }
    var delay = baseDelay * Math.pow(2, attempt - 1);
    var jitter = Math.random() * 0.1 * delay;
    return Math.min(delay + jitter, maxDelay);
};
exports.getRetryDelay = getRetryDelay;
var shouldAlert = function (error) {
    return error.severity === base_error_1.ErrorSeverity.CRITICAL ||
        error.severity === base_error_1.ErrorSeverity.HIGH ||
        !error.isOperational;
};
exports.shouldAlert = shouldAlert;
