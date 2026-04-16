"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiErrorCode = exports.HttpStatusCode = exports.apiContractRegistry = exports.ApiContractRegistry = exports.PaginatedResponseSchema = exports.PaginationSchema = exports.SuccessResponseSchema = exports.ErrorResponseSchema = exports.ApiResponseSchema = void 0;
var zod_1 = require("zod");
// Base API Response Schema
exports.ApiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.unknown().optional(),
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.unknown().optional(),
    }).optional(),
    meta: zod_1.z.object({
        timestamp: zod_1.z.string(),
        requestId: zod_1.z.string(),
        version: zod_1.z.string().default('1.0'),
    }),
});
// Error Response Schema
exports.ErrorResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(false),
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.unknown().optional(),
    }),
    meta: zod_1.z.object({
        timestamp: zod_1.z.string(),
        requestId: zod_1.z.string(),
        version: zod_1.z.string().default('1.0'),
    }),
});
// Success Response Schema
var SuccessResponseSchema = function (dataSchema) {
    return zod_1.z.object({
        success: zod_1.z.literal(true),
        data: dataSchema,
        meta: zod_1.z.object({
            timestamp: zod_1.z.string(),
            requestId: zod_1.z.string(),
            version: zod_1.z.string().default('1.0'),
        }),
    });
};
exports.SuccessResponseSchema = SuccessResponseSchema;
// Pagination Schema
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().positive().max(100).default(20),
    total: zod_1.z.number().int().nonnegative(),
    totalPages: zod_1.z.number().int().nonnegative(),
    hasNext: zod_1.z.boolean(),
    hasPrev: zod_1.z.boolean(),
});
// Paginated Response Schema
var PaginatedResponseSchema = function (itemSchema) {
    return zod_1.z.object({
        success: zod_1.z.literal(true),
        data: zod_1.z.object({
            items: zod_1.z.array(itemSchema),
            pagination: exports.PaginationSchema,
        }),
        meta: zod_1.z.object({
            timestamp: zod_1.z.string(),
            requestId: zod_1.z.string(),
            version: zod_1.z.string().default('1.0'),
        }),
    });
};
exports.PaginatedResponseSchema = PaginatedResponseSchema;
// Contract Registry
var ApiContractRegistry = /** @class */ (function () {
    function ApiContractRegistry() {
        this.contracts = new Map();
    }
    ApiContractRegistry.prototype.register = function (name, contract) {
        this.contracts.set(name, contract);
    };
    ApiContractRegistry.prototype.get = function (name) {
        return this.contracts.get(name);
    };
    ApiContractRegistry.prototype.getAll = function () {
        return new Map(this.contracts);
    };
    ApiContractRegistry.prototype.validateRequest = function (contractName, data) {
        var contract = this.contracts.get(contractName);
        if (!(contract === null || contract === void 0 ? void 0 : contract.requestSchema)) {
            throw new Error("Contract ".concat(contractName, " not found or has no request schema"));
        }
        var result = contract.requestSchema.safeParse(data);
        if (!result.success) {
            throw new Error("Request validation failed: ".concat(result.error.message));
        }
        return result.data;
    };
    ApiContractRegistry.prototype.validateResponse = function (contractName, data) {
        var contract = this.contracts.get(contractName);
        if (!contract) {
            throw new Error("Contract ".concat(contractName, " not found"));
        }
        var result = contract.responseSchema.safeParse(data);
        if (!result.success) {
            throw new Error("Response validation failed: ".concat(result.error.message));
        }
        return result.data;
    };
    return ApiContractRegistry;
}());
exports.ApiContractRegistry = ApiContractRegistry;
// Global contract registry instance
exports.apiContractRegistry = new ApiContractRegistry();
// Common HTTP Status Codes
var HttpStatusCode;
(function (HttpStatusCode) {
    HttpStatusCode[HttpStatusCode["OK"] = 200] = "OK";
    HttpStatusCode[HttpStatusCode["CREATED"] = 201] = "CREATED";
    HttpStatusCode[HttpStatusCode["NO_CONTENT"] = 204] = "NO_CONTENT";
    HttpStatusCode[HttpStatusCode["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HttpStatusCode[HttpStatusCode["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HttpStatusCode[HttpStatusCode["FORBIDDEN"] = 403] = "FORBIDDEN";
    HttpStatusCode[HttpStatusCode["NOT_FOUND"] = 404] = "NOT_FOUND";
    HttpStatusCode[HttpStatusCode["CONFLICT"] = 409] = "CONFLICT";
    HttpStatusCode[HttpStatusCode["UNPROCESSABLE_ENTITY"] = 422] = "UNPROCESSABLE_ENTITY";
    HttpStatusCode[HttpStatusCode["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    HttpStatusCode[HttpStatusCode["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
})(HttpStatusCode || (exports.HttpStatusCode = HttpStatusCode = {}));
// Error Codes
var ApiErrorCode;
(function (ApiErrorCode) {
    ApiErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ApiErrorCode["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    ApiErrorCode["AUTHORIZATION_ERROR"] = "AUTHORIZATION_ERROR";
    ApiErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ApiErrorCode["CONFLICT"] = "CONFLICT";
    ApiErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ApiErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ApiErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
})(ApiErrorCode || (exports.ApiErrorCode = ApiErrorCode = {}));
