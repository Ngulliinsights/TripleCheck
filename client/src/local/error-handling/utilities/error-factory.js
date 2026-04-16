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
exports.ErrorFactory = void 0;
var base_error_1 = require("../errors/base-error");
var validation_error_1 = require("../errors/validation-error");
var database_error_1 = require("../errors/database-error");
var error_categories_1 = require("../constants/error-categories");
var ErrorFactory = /** @class */ (function () {
    function ErrorFactory() {
    }
    ErrorFactory.fromUnknown = function (error, correlationId) {
        var _a;
        if (error instanceof base_error_1.AppError) {
            return error;
        }
        if ((error === null || error === void 0 ? void 0 : error.name) === 'ZodError') {
            return validation_error_1.ValidationError.fromZod(error, correlationId);
        }
        if ((error === null || error === void 0 ? void 0 : error.code) && /^\d{5}$/.test(String(error.code))) {
            return database_error_1.DatabaseError.fromPostgres(error, correlationId);
        }
        if ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status) {
            var status_1 = error.response.status;
            var message = error.response.statusText || error.message;
            return new base_error_1.AppError('EXTERNAL_SERVICE_ERROR', "HTTP ".concat(status_1, ": ").concat(message), status_1, error_categories_1.ErrorCategory.EXTERNAL_SERVICE, correlationId ? { correlationId: correlationId } : {});
        }
        if (error instanceof Error) {
            return new base_error_1.AppError('INTERNAL_SERVER_ERROR', error.message, 500, error_categories_1.ErrorCategory.SYSTEM, __assign({ severity: base_error_1.ErrorSeverity.CRITICAL, details: { originalError: error.message, stack: error.stack }, isOperational: false, cause: error }, (correlationId && { correlationId: correlationId })));
        }
        return new base_error_1.AppError('UNKNOWN_ERROR', 'An unexpected error occurred', 500, error_categories_1.ErrorCategory.SYSTEM, __assign({ severity: base_error_1.ErrorSeverity.CRITICAL, details: { originalError: String(error) }, isOperational: false }, (correlationId && { correlationId: correlationId })));
    };
    ErrorFactory.createValidationError = function (fieldErrors, correlationId) {
        var normalizedErrors = {};
        for (var _i = 0, _a = Object.entries(fieldErrors); _i < _a.length; _i++) {
            var _b = _a[_i], field = _b[0], errors = _b[1];
            normalizedErrors[field] = Array.isArray(errors) ? errors : [errors];
        }
        return new validation_error_1.ValidationError('Validation failed', normalizedErrors, correlationId);
    };
    return ErrorFactory;
}());
exports.ErrorFactory = ErrorFactory;
