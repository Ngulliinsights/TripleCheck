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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClientErrorHandler = void 0;
var base_error_1 = require("../errors/base-error");
var error_categories_1 = require("../constants/error-categories");
var error_factory_1 = require("../utilities/error-factory");
var createClientErrorHandler = function () { return ({
    toClientError: function (error) { return ({
        success: false,
        error: __assign(__assign({ code: error.code, message: error.getUserMessage(), category: error.category, severity: error.severity, recoveryStrategies: error.recoveryStrategies, retryable: error.retryable }, (error.details && { details: error.details })), (error.correlationId && { correlationId: error.correlationId })),
    }); },
    handleApiError: function (response, correlationId) { return __awaiter(void 0, void 0, void 0, function () {
        var errorData, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, response.json()];
                case 1:
                    errorData = _b.sent();
                    if (errorData.code && errorData.message) {
                        return [2 /*return*/, new base_error_1.AppError(errorData.code, errorData.message, response.status, errorData.category || error_categories_1.ErrorCategory.EXTERNAL_SERVICE, {
                                severity: errorData.severity,
                                recoveryStrategies: errorData.recoveryStrategies,
                                details: errorData.details,
                                correlationId: errorData.correlationId || correlationId,
                            })];
                    }
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3:
                    switch (response.status) {
                        case 401:
                            return [2 /*return*/, new base_error_1.AppError('INVALID_CREDENTIALS', 'Authentication required', 401, error_categories_1.ErrorCategory.AUTHENTICATION, correlationId ? { correlationId: correlationId } : {})];
                        case 403:
                            return [2 /*return*/, new base_error_1.AppError('INSUFFICIENT_PERMISSIONS', 'Access denied', 403, error_categories_1.ErrorCategory.AUTHORIZATION, correlationId ? { correlationId: correlationId } : {})];
                        case 404:
                            return [2 /*return*/, new base_error_1.AppError('NOT_FOUND', 'Resource not found', 404, error_categories_1.ErrorCategory.NOT_FOUND, correlationId ? { correlationId: correlationId } : {})];
                        case 409:
                            return [2 /*return*/, new base_error_1.AppError('RESOURCE_CONFLICT', 'Resource conflict', 409, error_categories_1.ErrorCategory.CONFLICT, correlationId ? { correlationId: correlationId } : {})];
                        case 429:
                            return [2 /*return*/, new base_error_1.AppError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429, error_categories_1.ErrorCategory.RATE_LIMIT, correlationId ? { correlationId: correlationId } : {})];
                        default:
                            return [2 /*return*/, new base_error_1.AppError('EXTERNAL_SERVICE_ERROR', "HTTP ".concat(response.status, ": ").concat(response.statusText), response.status, error_categories_1.ErrorCategory.EXTERNAL_SERVICE, correlationId ? { correlationId: correlationId } : {})];
                    }
                    return [2 /*return*/];
            }
        });
    }); },
    handleGlobalError: function (error, correlationId) {
        return error_factory_1.ErrorFactory.fromUnknown(error, correlationId);
    },
}); };
exports.createClientErrorHandler = createClientErrorHandler;
