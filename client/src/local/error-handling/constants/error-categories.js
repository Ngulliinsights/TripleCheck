"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCategory = void 0;
// src/shared/error-handling/constants/error-categories.ts
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["VALIDATION"] = "VALIDATION";
    ErrorCategory["AUTHENTICATION"] = "AUTHENTICATION";
    ErrorCategory["AUTHORIZATION"] = "AUTHORIZATION";
    ErrorCategory["NOT_FOUND"] = "NOT_FOUND";
    ErrorCategory["CONFLICT"] = "CONFLICT";
    ErrorCategory["RATE_LIMIT"] = "RATE_LIMIT";
    ErrorCategory["EXTERNAL_SERVICE"] = "EXTERNAL_SERVICE";
    ErrorCategory["DATABASE"] = "DATABASE";
    ErrorCategory["BUSINESS_LOGIC"] = "BUSINESS_LOGIC";
    ErrorCategory["SYSTEM"] = "SYSTEM";
    ErrorCategory["SECURITY"] = "SECURITY";
    ErrorCategory["NETWORK"] = "NETWORK";
    ErrorCategory["PERFORMANCE"] = "PERFORMANCE";
    ErrorCategory["CONFIGURATION"] = "CONFIGURATION";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
