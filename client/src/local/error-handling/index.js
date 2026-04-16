"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMetrics = exports.ErrorFactory = exports.AppError = exports.ErrorCategory = void 0;
// Errors
__exportStar(require("./errors/base-error"), exports);
__exportStar(require("./errors/validation-error"), exports);
__exportStar(require("./errors/database-error"), exports);
// Constants
__exportStar(require("./constants/error-codes"), exports);
var error_categories_1 = require("./constants/error-categories");
Object.defineProperty(exports, "ErrorCategory", { enumerable: true, get: function () { return error_categories_1.ErrorCategory; } });
__exportStar(require("./constants/http-status"), exports);
__exportStar(require("./constants/postgres-codes"), exports);
// export * from './constants/error-messages' // File doesn't exist
// Utilities
__exportStar(require("./utilities/error-factory"), exports);
__exportStar(require("./utilities/error-utils"), exports);
__exportStar(require("./utilities/error-metrics"), exports);
// Server
__exportStar(require("./server/express-handler"), exports);
// Client
__exportStar(require("./client/error-handler"), exports);
// Convenience exports
var base_error_1 = require("./errors/base-error");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return base_error_1.AppError; } });
var error_factory_1 = require("./utilities/error-factory");
Object.defineProperty(exports, "ErrorFactory", { enumerable: true, get: function () { return error_factory_1.ErrorFactory; } });
// export { ERROR_MESSAGES } from './constants/error-messages' // File doesn't exist
var error_metrics_1 = require("./utilities/error-metrics");
Object.defineProperty(exports, "errorMetrics", { enumerable: true, get: function () { return error_metrics_1.errorMetrics; } });
