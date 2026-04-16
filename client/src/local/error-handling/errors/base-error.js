"use strict";
/* ---------------------------------------------------------
   Base Error Classes
   Core application error system with categorization
--------------------------------------------------------- */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.AppError = exports.RecoveryStrategy = exports.ErrorSeverity = void 0;
var error_categories_1 = require("../constants/error-categories");
/**
 * Application error severity levels
 */
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "LOW";
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    ErrorSeverity["HIGH"] = "HIGH";
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
/**
 * Recovery strategies for client handling
 */
var RecoveryStrategy;
(function (RecoveryStrategy) {
    RecoveryStrategy["RETRY"] = "RETRY";
    RecoveryStrategy["FALLBACK"] = "FALLBACK";
    RecoveryStrategy["REDIRECT"] = "REDIRECT";
    RecoveryStrategy["REFRESH"] = "REFRESH";
    RecoveryStrategy["LOGOUT"] = "LOGOUT";
    RecoveryStrategy["CONTACT_SUPPORT"] = "CONTACT_SUPPORT";
    RecoveryStrategy["IGNORE"] = "IGNORE";
    RecoveryStrategy["MANUAL_INTERVENTION"] = "MANUAL_INTERVENTION";
})(RecoveryStrategy || (exports.RecoveryStrategy = RecoveryStrategy = {}));
/**
 * Main application error class
 */
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    function AppError(code, message, statusCode, category, options) {
        if (statusCode === void 0) { statusCode = 500; }
        if (category === void 0) { category = error_categories_1.ErrorCategory.SYSTEM; }
        if (options === void 0) { options = {}; }
        var _a;
        var _this = _super.call(this, message) || this;
        _this.name = _this.constructor.name;
        _this.code = code;
        _this.statusCode = statusCode;
        _this.category = category;
        _this.severity = options.severity || _this.getDefaultSeverity(category);
        _this.recoveryStrategies = options.recoveryStrategies || _this.getDefaultRecoveryStrategies(category);
        _this.details = options.details;
        _this.timestamp = new Date().toISOString();
        _this.correlationId = options.correlationId;
        _this.isOperational = (_a = options.isOperational) !== null && _a !== void 0 ? _a : true;
        _this.retryable = _this.isRetryableCategory(category);
        if (options.cause) {
            _this.cause = options.cause;
        }
        if (Error.captureStackTrace) {
            Error.captureStackTrace(_this, _this.constructor);
        }
        return _this;
    }
    AppError.prototype.getDefaultSeverity = function (category) {
        var _a;
        var severityMap = (_a = {},
            _a[error_categories_1.ErrorCategory.VALIDATION] = ErrorSeverity.LOW,
            _a[error_categories_1.ErrorCategory.AUTHENTICATION] = ErrorSeverity.HIGH,
            _a[error_categories_1.ErrorCategory.AUTHORIZATION] = ErrorSeverity.HIGH,
            _a[error_categories_1.ErrorCategory.NOT_FOUND] = ErrorSeverity.LOW,
            _a[error_categories_1.ErrorCategory.CONFLICT] = ErrorSeverity.MEDIUM,
            _a[error_categories_1.ErrorCategory.RATE_LIMIT] = ErrorSeverity.MEDIUM,
            _a[error_categories_1.ErrorCategory.EXTERNAL_SERVICE] = ErrorSeverity.MEDIUM,
            _a[error_categories_1.ErrorCategory.DATABASE] = ErrorSeverity.CRITICAL,
            _a[error_categories_1.ErrorCategory.BUSINESS_LOGIC] = ErrorSeverity.MEDIUM,
            _a[error_categories_1.ErrorCategory.SYSTEM] = ErrorSeverity.CRITICAL,
            _a[error_categories_1.ErrorCategory.SECURITY] = ErrorSeverity.CRITICAL,
            _a[error_categories_1.ErrorCategory.NETWORK] = ErrorSeverity.MEDIUM,
            _a[error_categories_1.ErrorCategory.PERFORMANCE] = ErrorSeverity.MEDIUM,
            _a[error_categories_1.ErrorCategory.CONFIGURATION] = ErrorSeverity.HIGH,
            _a);
        return severityMap[category] || ErrorSeverity.MEDIUM;
    };
    AppError.prototype.getDefaultRecoveryStrategies = function (category) {
        var _a;
        var strategyMap = (_a = {},
            _a[error_categories_1.ErrorCategory.VALIDATION] = [RecoveryStrategy.IGNORE],
            _a[error_categories_1.ErrorCategory.AUTHENTICATION] = [RecoveryStrategy.LOGOUT, RecoveryStrategy.REDIRECT],
            _a[error_categories_1.ErrorCategory.AUTHORIZATION] = [RecoveryStrategy.CONTACT_SUPPORT],
            _a[error_categories_1.ErrorCategory.NOT_FOUND] = [RecoveryStrategy.IGNORE],
            _a[error_categories_1.ErrorCategory.CONFLICT] = [RecoveryStrategy.REFRESH],
            _a[error_categories_1.ErrorCategory.RATE_LIMIT] = [RecoveryStrategy.RETRY],
            _a[error_categories_1.ErrorCategory.EXTERNAL_SERVICE] = [RecoveryStrategy.RETRY, RecoveryStrategy.FALLBACK],
            _a[error_categories_1.ErrorCategory.DATABASE] = [RecoveryStrategy.RETRY, RecoveryStrategy.CONTACT_SUPPORT],
            _a[error_categories_1.ErrorCategory.BUSINESS_LOGIC] = [RecoveryStrategy.CONTACT_SUPPORT],
            _a[error_categories_1.ErrorCategory.SYSTEM] = [RecoveryStrategy.CONTACT_SUPPORT],
            _a[error_categories_1.ErrorCategory.SECURITY] = [RecoveryStrategy.LOGOUT, RecoveryStrategy.CONTACT_SUPPORT],
            _a[error_categories_1.ErrorCategory.NETWORK] = [RecoveryStrategy.RETRY],
            _a[error_categories_1.ErrorCategory.PERFORMANCE] = [RecoveryStrategy.RETRY],
            _a[error_categories_1.ErrorCategory.CONFIGURATION] = [RecoveryStrategy.CONTACT_SUPPORT],
            _a);
        return strategyMap[category] || [RecoveryStrategy.CONTACT_SUPPORT];
    };
    AppError.prototype.isRetryableCategory = function (category) {
        return [
            error_categories_1.ErrorCategory.NETWORK,
            error_categories_1.ErrorCategory.EXTERNAL_SERVICE,
            error_categories_1.ErrorCategory.DATABASE,
            error_categories_1.ErrorCategory.RATE_LIMIT,
        ].includes(category);
    };
    AppError.prototype.toJSON = function () {
        return __assign(__assign({ code: this.code, message: this.message, timestamp: this.timestamp, category: this.category, severity: this.severity, recoveryStrategies: this.recoveryStrategies, retryable: this.retryable }, (this.details !== undefined && { details: this.details })), (this.correlationId !== undefined && { correlationId: this.correlationId }));
    };
    AppError.prototype.getUserMessage = function () {
        // Implementation for user-friendly messages
        return this.message;
    };
    return AppError;
}(Error));
exports.AppError = AppError;
