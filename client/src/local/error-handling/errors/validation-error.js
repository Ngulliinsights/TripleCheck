"use strict";
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
exports.ValidationError = void 0;
var base_error_1 = require("./base-error");
var error_categories_1 = require("../constants/error-categories");
var http_status_1 = require("../constants/http-status");
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message, fieldErrors, correlationId) {
        if (message === void 0) { message = 'Validation failed'; }
        if (fieldErrors === void 0) { fieldErrors = {}; }
        var _this = _super.call(this, 'VALIDATION_FAILED', message, http_status_1.HttpStatusCode.BAD_REQUEST, error_categories_1.ErrorCategory.VALIDATION, __assign({ severity: base_error_1.ErrorSeverity.LOW, recoveryStrategies: [base_error_1.RecoveryStrategy.IGNORE], details: { fieldErrors: fieldErrors } }, (correlationId && { correlationId: correlationId }))) || this;
        _this.fieldErrors = fieldErrors;
        return _this;
    }
    ValidationError.fromZod = function (zodError, correlationId) {
        var _a;
        var fieldErrors = {};
        if ((zodError === null || zodError === void 0 ? void 0 : zodError.errors) && Array.isArray(zodError.errors)) {
            for (var _i = 0, _b = zodError.errors; _i < _b.length; _i++) {
                var error = _b[_i];
                var fieldPath = Array.isArray(error.path) ? error.path.join('.') : 'unknown';
                if (!fieldErrors[fieldPath])
                    fieldErrors[fieldPath] = [];
                (_a = fieldErrors[fieldPath]) === null || _a === void 0 ? void 0 : _a.push(error.message || 'Validation error');
            }
        }
        return new ValidationError('Input validation failed', fieldErrors, correlationId);
    };
    return ValidationError;
}(base_error_1.AppError));
exports.ValidationError = ValidationError;
