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
exports.PropertyDeleteContract = exports.PropertyUpdateContract = exports.PropertyCreateContract = exports.PropertyGetContract = exports.PropertyListContract = exports.PropertyUpdateRequestSchema = exports.PropertyCreateRequestSchema = exports.PropertyListRequestSchema = exports.PropertySchema = void 0;
var zod_1 = require("zod");
var api_contracts_1 = require("../api-contracts");
// Property Schemas
exports.PropertySchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(2000),
    price: zod_1.z.number().positive(),
    location: zod_1.z.string().min(1).max(100),
    type: zod_1.z.enum(['residential', 'commercial', 'land']),
    status: zod_1.z.enum(['available', 'sold', 'pending', 'withdrawn']),
    images: zod_1.z.array(zod_1.z.string().url()).default([]),
    features: zod_1.z.object({
        bedrooms: zod_1.z.number().int().nonnegative().optional(),
        bathrooms: zod_1.z.number().int().nonnegative().optional(),
        area: zod_1.z.number().positive().optional(),
        parking: zod_1.z.boolean().optional(),
        furnished: zod_1.z.boolean().optional(),
    }).optional(),
    verificationStatus: zod_1.z.enum(['pending', 'verified', 'rejected']),
    trustScore: zod_1.z.number().min(0).max(100),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    ownerId: zod_1.z.string(),
});
// Property List Request Schema
var PropertyListRequestSchemaBase = zod_1.z.object({
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().positive().max(100).default(20),
    type: zod_1.z.enum(['residential', 'commercial', 'land']).optional(),
    status: zod_1.z.enum(['available', 'sold', 'pending', 'withdrawn']).optional(),
    minPrice: zod_1.z.number().positive().optional(),
    maxPrice: zod_1.z.number().positive().optional(),
    location: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['price', 'createdAt', 'trustScore']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
exports.PropertyListRequestSchema = PropertyListRequestSchemaBase.transform(function (data) { return (__assign(__assign({}, data), { sortBy: data.sortBy || 'createdAt', sortOrder: data.sortOrder || 'desc', page: data.page || 1, limit: data.limit || 10 })); });
// Property Create Request Schema
exports.PropertyCreateRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(2000),
    price: zod_1.z.number().positive(),
    location: zod_1.z.string().min(1).max(100),
    type: zod_1.z.enum(['residential', 'commercial', 'land']),
    images: zod_1.z.array(zod_1.z.string().url()).default([]).transform(function (arr) { return arr.length > 0 ? arr : []; }),
    features: zod_1.z.object({
        bedrooms: zod_1.z.number().int().nonnegative().optional(),
        bathrooms: zod_1.z.number().int().nonnegative().optional(),
        area: zod_1.z.number().positive().optional(),
        parking: zod_1.z.boolean().optional(),
        furnished: zod_1.z.boolean().optional(),
    }).optional(),
});
// Transform for create request to ensure images is string[]
var PropertyCreateRequestTransformed = exports.PropertyCreateRequestSchema.transform(function (data) { return (__assign(__assign({}, data), { images: data.images })); });
// Property Update Request Schema
exports.PropertyUpdateRequestSchema = exports.PropertyCreateRequestSchema.extend({
    status: zod_1.z.enum(['available', 'sold', 'pending', 'withdrawn']).optional(),
}).partial();
// Property Contracts
exports.PropertyListContract = {
    method: 'GET',
    path: '/api/properties',
    requestSchema: PropertyListRequestSchemaBase,
    responseSchema: (0, api_contracts_1.PaginatedResponseSchema)(exports.PropertySchema),
    description: 'Get paginated list of properties',
    tags: ['properties'],
};
exports.PropertyGetContract = {
    method: 'GET',
    path: '/api/properties/:id',
    requestSchema: zod_1.z.object({ id: zod_1.z.string() }),
    responseSchema: (0, api_contracts_1.SuccessResponseSchema)(exports.PropertySchema),
    description: 'Get property by ID',
    tags: ['properties'],
};
exports.PropertyCreateContract = {
    method: 'POST',
    path: '/api/properties',
    requestSchema: PropertyCreateRequestTransformed,
    responseSchema: (0, api_contracts_1.SuccessResponseSchema)(exports.PropertySchema),
    description: 'Create new property',
    tags: ['properties'],
};
exports.PropertyUpdateContract = {
    method: 'PUT',
    path: '/api/properties/:id',
    requestSchema: exports.PropertyUpdateRequestSchema.extend({ id: zod_1.z.string() }),
    responseSchema: (0, api_contracts_1.SuccessResponseSchema)(exports.PropertySchema),
    description: 'Update property by ID',
    tags: ['properties'],
};
exports.PropertyDeleteContract = {
    method: 'DELETE',
    path: '/api/properties/:id',
    requestSchema: zod_1.z.object({ id: zod_1.z.string() }),
    responseSchema: (0, api_contracts_1.SuccessResponseSchema)(zod_1.z.object({ deleted: zod_1.z.boolean() })),
    description: 'Delete property by ID',
    tags: ['properties'],
};
// Register contracts
api_contracts_1.apiContractRegistry.register('property.list', exports.PropertyListContract);
api_contracts_1.apiContractRegistry.register('property.get', exports.PropertyGetContract);
api_contracts_1.apiContractRegistry.register('property.create', exports.PropertyCreateContract);
api_contracts_1.apiContractRegistry.register('property.update', exports.PropertyUpdateContract);
api_contracts_1.apiContractRegistry.register('property.delete', exports.PropertyDeleteContract);
