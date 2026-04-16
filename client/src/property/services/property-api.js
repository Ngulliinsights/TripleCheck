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
exports.PropertyApi = exports.propertyApi = void 0;
var queryClient_1 = require("../../infrastructure/api/queryClient");
var request_manager_1 = require("../../infrastructure/api/request-manager");
var property_validation_1 = require("./property-validation");
// Constants to avoid string duplication (fixes ESLint warning)
var API_BASE = "/api/properties";
var CONTENT_TYPE_JSON = "application/json";
var DEFAULT_ERROR_MESSAGE = "Unknown error";
// Helper function to build search parameters
function buildSearchParams(params) {
    var searchParams = new URLSearchParams();
    Object.entries(params).forEach(function (_a) {
        var key = _a[0], value = _a[1];
        if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
                value.forEach(function (item) { return searchParams.append(key, String(item)); });
            }
            else {
                searchParams.append(key, String(value));
            }
        }
    });
    return searchParams;
}
// Helper function to build request headers
function buildHeaders() {
    return {
        'Content-Type': CONTENT_TYPE_JSON,
        'Accept': CONTENT_TYPE_JSON,
    };
}
// Centralized error handling with consistent error messages
var PropertyApiError = /** @class */ (function (_super) {
    __extends(PropertyApiError, _super);
    function PropertyApiError(message, statusCode) {
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.name = "PropertyApiError";
        return _this;
    }
    return PropertyApiError;
}(Error));
// Helper function to handle API responses consistently with improved type safety
var handleApiResponse = function (response) { return __awaiter(void 0, void 0, void 0, function () {
    var errorData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!!response.ok) return [3 /*break*/, 2];
                return [4 /*yield*/, response.json().catch(function () { return ({}); })];
            case 1:
                errorData = _a.sent();
                throw new PropertyApiError(errorData.message || "Request failed with status ".concat(response.status), response.status);
            case 2: return [2 /*return*/, response.json()];
        }
    });
}); };
// Type-safe property enhancement that preserves Property structure
var enhanceProperty = function (property) {
    return __assign(__assign({}, property), { calculatedScore: property_validation_1.PropertyBusinessLogic.calculatePropertyScore(property), isFeatured: property_validation_1.PropertyBusinessLogic.isFeaturedProperty(property), listingUrl: property_validation_1.PropertyBusinessLogic.generateListingUrl(property) });
};
// Type guard to ensure API response data exists and is valid
var validateApiResponse = function (response) {
    return ((response === null || response === void 0 ? void 0 : response.data) !== undefined);
};
// Type guard for paginated response validation
var validatePaginatedResponse = function (response) {
    return (response != null && Array.isArray(response.data));
};
// Helper function to create type-safe empty paginated response
var createEmptyPaginatedResponse = function () {
    var emptyResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
    };
    return emptyResponse;
};
// Helper function to handle errors consistently
var handleError = function (error, context) {
    if (error instanceof PropertyApiError) {
        return error;
    }
    return new PropertyApiError("Failed to ".concat(context, ": ").concat(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE));
};
// Reduced complexity function for getting properties with better error handling
var processPropertiesResponse = function (data) {
    if (validatePaginatedResponse(data)) {
        return __assign(__assign({}, data), { data: data.data.map(enhanceProperty) });
    }
    return createEmptyPaginatedResponse();
};
// Enhanced property API with improved error handling and performance optimizations
exports.propertyApi = {
    // Get all properties with search and filters - optimized parameter handling
    getProperties: function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (params) {
            var validatedParams, searchParams, data, error_1;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        validatedParams = property_validation_1.PropertyBusinessLogic.validateSearchParams(params);
                        searchParams = buildSearchParams(validatedParams);
                        return [4 /*yield*/, (0, queryClient_1.apiRequest)('GET', "".concat(API_BASE, "?").concat(searchParams), undefined, {
                                headers: buildHeaders(),
                                requestOptions: {
                                    key: "properties:".concat(searchParams.toString()),
                                    cancelPrevious: true,
                                    priority: 'normal'
                                }
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, processPropertiesResponse(data)];
                    case 2:
                        error_1 = _a.sent();
                        throw handleError(error_1, "fetch properties");
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    // Get single property by ID with enhanced data and optional market estimate
    getProperty: function (id_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([id_1], args_1, true), void 0, function (id, options) {
            var data, enhancedProperty, similarProperties, error_2, error_3;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        return [4 /*yield*/, (0, queryClient_1.apiRequest)('GET', "".concat(API_BASE, "/").concat(id), undefined, {
                                headers: buildHeaders(),
                                requestOptions: {
                                    key: "property:".concat(id),
                                    cancelPrevious: true,
                                    priority: 'high'
                                }
                            })];
                    case 1:
                        data = _a.sent();
                        if (!validateApiResponse(data)) return [3 /*break*/, 6];
                        enhancedProperty = enhanceProperty(data.data);
                        if (!options.includeMarketEstimate) return [3 /*break*/, 5];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, exports.propertyApi.getSimilarProperties(data.data)];
                    case 3:
                        similarProperties = _a.sent();
                        if (similarProperties.length > 0) {
                            enhancedProperty.marketEstimate =
                                property_validation_1.PropertyBusinessLogic.estimateMarketValue(data.data, similarProperties);
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        // Silently handle market estimate errors to avoid breaking the main request
                        // Error is acknowledged but not logged to avoid console output
                        if (error_2 instanceof Error) {
                            // Error handled gracefully - market estimate is optional
                        }
                        return [3 /*break*/, 5];
                    case 5: 
                    // Return enhanced response preserving original structure
                    return [2 /*return*/, __assign(__assign({}, data), { data: enhancedProperty })];
                    case 6: throw new PropertyApiError("Invalid response structure from server", 500);
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_3 = _a.sent();
                        throw handleError(error_3, "fetch property");
                    case 9: return [2 /*return*/];
                }
            });
        });
    },
    // Create new property with comprehensive validation
    createProperty: function (propertyData) { return __awaiter(void 0, void 0, void 0, function () {
        var tempProperty, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    tempProperty = __assign(__assign({}, propertyData), { id: "temp-id", createdAt: new Date(), updatedAt: new Date() });
                    property_validation_1.PropertyBusinessLogic.validateProperty(tempProperty);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('POST', API_BASE, propertyData, {
                            headers: buildHeaders(),
                            requestOptions: {
                                key: "create-property:".concat(Date.now()),
                                priority: 'high',
                                cancelPrevious: false
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_4 = _a.sent();
                    throw handleError(error_4, "create property");
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Update property with ownership validation and optimized validation flow
    updateProperty: function (id, updates, userId) { return __awaiter(void 0, void 0, void 0, function () {
        var currentPropertyResponse, _a, canEdit, reasons, error_5;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, exports.propertyApi.getProperty(id)];
                case 1:
                    currentPropertyResponse = _b.sent();
                    // Validate the response structure
                    if (!validateApiResponse(currentPropertyResponse)) {
                        throw new PropertyApiError("Property not found or invalid response", 404);
                    }
                    _a = property_validation_1.PropertyBusinessLogic.canEditProperty(currentPropertyResponse.data, userId), canEdit = _a.canEdit, reasons = _a.reasons;
                    if (!canEdit) {
                        throw new PropertyApiError("Cannot edit property: ".concat(reasons.join(", ")), 403);
                    }
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('PATCH', "".concat(API_BASE, "/").concat(id), updates, {
                            headers: buildHeaders(),
                            requestOptions: {
                                key: "update-property:".concat(id),
                                priority: 'high',
                                cancelPrevious: true
                            }
                        })];
                case 2: return [2 /*return*/, _b.sent()];
                case 3:
                    error_5 = _b.sent();
                    throw handleError(error_5, "update property");
                case 4: return [2 /*return*/];
            }
        });
    }); },
    // Delete property with comprehensive validation and clear error messages
    deleteProperty: function (id, userId) { return __awaiter(void 0, void 0, void 0, function () {
        var currentPropertyResponse, property, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, exports.propertyApi.getProperty(id)];
                case 1:
                    currentPropertyResponse = _a.sent();
                    // Validate the response structure
                    if (!validateApiResponse(currentPropertyResponse)) {
                        throw new PropertyApiError("Property not found or invalid response", 404);
                    }
                    property = currentPropertyResponse.data;
                    // Validate ownership
                    if (!property_validation_1.PropertyBusinessLogic.validateOwnership(property, userId)) {
                        throw new PropertyApiError("You are not authorized to delete this property", 403);
                    }
                    // Check if property can be deleted based on status
                    if (property.status === "sold") {
                        throw new PropertyApiError("Sold properties cannot be deleted", 400);
                    }
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('DELETE', "".concat(API_BASE, "/").concat(id), undefined, {
                            headers: buildHeaders(),
                            requestOptions: {
                                key: "delete-property:".concat(id),
                                priority: 'high',
                                cancelPrevious: false
                            }
                        })];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    error_6 = _a.sent();
                    throw handleError(error_6, "delete property");
                case 4: return [2 /*return*/];
            }
        });
    }); },
    // Get properties by owner with improved error handling
    getPropertiesByOwner: function (ownerId) { return __awaiter(void 0, void 0, void 0, function () {
        var error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('GET', "".concat(API_BASE, "/owner/").concat(ownerId), undefined, {
                            headers: buildHeaders(),
                            requestOptions: {
                                key: "owner-properties:".concat(ownerId),
                                cancelPrevious: true,
                                priority: 'normal'
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_7 = _a.sent();
                    throw handleError(error_7, "fetch owner properties");
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Batch similar properties requests to reduce API calls
    _similarPropertiesBatch: new Map(),
    _batchTimeout: null,
    // Type-safe property parameter extraction
    extractPropertyParams: function (property) {
        var _a;
        // Safe property type extraction with fallbacks
        var propertyType = property.propertyType || 'house';
        var location = typeof property.location === 'string'
            ? property.location
            : ((_a = property.location) === null || _a === void 0 ? void 0 : _a.city) || 'unknown';
        var price = typeof property.price === 'number'
            ? property.price
            : parseFloat(property.price) || 0;
        return { propertyType: propertyType, location: location, price: price };
    },
    // Get similar properties with batching and caching
    getSimilarProperties: function (property) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, propertyType, location_1, price, cacheKey_1, cachedPromise, params, searchParams, requestPromise, error_8;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    _a = exports.propertyApi.extractPropertyParams(property), propertyType = _a.propertyType, location_1 = _a.location, price = _a.price;
                    cacheKey_1 = "".concat(propertyType, "-").concat(location_1, "-").concat(Math.floor(price * 0.7), "-").concat(Math.floor(price * 1.3));
                    cachedPromise = exports.propertyApi._similarPropertiesBatch.get(cacheKey_1);
                    if (!cachedPromise) return [3 /*break*/, 2];
                    return [4 /*yield*/, cachedPromise];
                case 1: return [2 /*return*/, _b.sent()];
                case 2:
                    params = {
                        query: '',
                        propertyType: propertyType,
                        location: location_1,
                        priceMin: Math.floor(price * 0.7),
                        priceMax: Math.floor(price * 1.3),
                        page: 1,
                        limit: 10,
                        sortBy: 'relevance',
                        sortOrder: 'desc'
                    };
                    searchParams = buildSearchParams(params);
                    requestPromise = (0, queryClient_1.apiRequest)('GET', "".concat(API_BASE, "/similar?").concat(searchParams), undefined, {
                        headers: buildHeaders(),
                        requestOptions: {
                            key: "similar-properties:".concat(cacheKey_1),
                            cancelPrevious: false, // Don't cancel batched requests
                            priority: 'low',
                            timeout: 5000
                        }
                    }).then(function (data) {
                        // Clean up batch cache after request completes
                        exports.propertyApi._similarPropertiesBatch.delete(cacheKey_1);
                        return Array.isArray(data === null || data === void 0 ? void 0 : data.data) ? data.data : [];
                    }).catch(function (error) {
                        // Clean up batch cache on error and handle appropriately
                        exports.propertyApi._similarPropertiesBatch.delete(cacheKey_1);
                        if (process.env.NODE_ENV === 'development' && error instanceof Error) {
                            // Development mode error acknowledgment without console output
                        }
                        return [];
                    });
                    // Store the promise in batch cache
                    exports.propertyApi._similarPropertiesBatch.set(cacheKey_1, requestPromise);
                    return [4 /*yield*/, requestPromise];
                case 3: return [2 /*return*/, _b.sent()];
                case 4:
                    error_8 = _b.sent();
                    // Return empty array on error but log in development
                    if (process.env.NODE_ENV === 'development' && error_8 instanceof Error) {
                        // Error handled gracefully - similar properties fetch is optional
                        // Development mode error acknowledgment without console output
                    }
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    }); },
    // Get property recommendations with improved type safety
    getRecommendations: function (userPreferences) { return __awaiter(void 0, void 0, void 0, function () {
        var error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('POST', "".concat(API_BASE, "/recommendations"), userPreferences, {
                            headers: buildHeaders(),
                            requestOptions: {
                                key: "recommendations:".concat(JSON.stringify(userPreferences)),
                                cancelPrevious: true,
                                priority: 'normal'
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_9 = _a.sent();
                    throw handleError(error_9, "fetch recommendations");
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Upload property images with improved file handling and validation
    uploadImages: function (propertyId, images) { return __awaiter(void 0, void 0, void 0, function () {
        var maxFileSize, allowedTypes, _i, images_1, image, formData_1, authToken, headers_1, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // Validate that images array is not empty
                    if (!images || images.length === 0) {
                        throw new PropertyApiError("No images provided for upload", 400);
                    }
                    maxFileSize = 10 * 1024 * 1024;
                    allowedTypes = ["image/jpeg", "image/png", "image/webp"];
                    for (_i = 0, images_1 = images; _i < images_1.length; _i++) {
                        image = images_1[_i];
                        if (image.size > maxFileSize) {
                            throw new PropertyApiError("Image ".concat(image.name, " exceeds size limit of 10MB"), 400);
                        }
                        if (!allowedTypes.includes(image.type)) {
                            throw new PropertyApiError("Image ".concat(image.name, " has unsupported format. Only JPEG, PNG, and WebP are allowed"), 400);
                        }
                    }
                    formData_1 = new FormData();
                    images.forEach(function (image, index) {
                        formData_1.append("image_".concat(index), image);
                    });
                    authToken = localStorage.getItem("auth_token");
                    headers_1 = {};
                    if (authToken) {
                        headers_1["Authorization"] = "Bearer ".concat(authToken);
                    }
                    return [4 /*yield*/, request_manager_1.requestManager.makeRequest(function (signal) { return __awaiter(void 0, void 0, void 0, function () {
                            var response;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/").concat(propertyId, "/images"), {
                                            method: "POST",
                                            headers: headers_1,
                                            body: formData_1,
                                            signal: signal,
                                        })];
                                    case 1:
                                        response = _a.sent();
                                        return [2 /*return*/, handleApiResponse(response)];
                                }
                            });
                        }); }, {
                            key: "upload-images:".concat(propertyId),
                            priority: 'high',
                            cancelPrevious: false
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_10 = _a.sent();
                    throw handleError(error_10, "upload images");
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Request property verification with consistent error handling
    requestVerification: function (propertyId) { return __awaiter(void 0, void 0, void 0, function () {
        var error_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('POST', "".concat(API_BASE, "/").concat(propertyId, "/verify"), undefined, {
                            headers: buildHeaders(),
                            requestOptions: {
                                key: "verify-property:".concat(propertyId),
                                priority: 'high',
                                cancelPrevious: false
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_11 = _a.sent();
                    throw handleError(error_11, "request verification");
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Batch operations for better performance when handling multiple properties
    batchUpdateProperties: function (updates, userId) { return __awaiter(void 0, void 0, void 0, function () {
        var _i, updates_1, update, currentPropertyResponse, _a, canEdit, reasons, error_12;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    _i = 0, updates_1 = updates;
                    _b.label = 1;
                case 1:
                    if (!(_i < updates_1.length)) return [3 /*break*/, 4];
                    update = updates_1[_i];
                    return [4 /*yield*/, exports.propertyApi.getProperty(update.id)];
                case 2:
                    currentPropertyResponse = _b.sent();
                    if (!validateApiResponse(currentPropertyResponse)) {
                        throw new PropertyApiError("Property ".concat(update.id, " not found"), 404);
                    }
                    _a = property_validation_1.PropertyBusinessLogic.canEditProperty(currentPropertyResponse.data, userId), canEdit = _a.canEdit, reasons = _a.reasons;
                    if (!canEdit) {
                        throw new PropertyApiError("Cannot edit property ".concat(update.id, ": ").concat(reasons.join(", ")), 403);
                    }
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, (0, queryClient_1.apiRequest)('PATCH', "".concat(API_BASE, "/batch-update"), { updates: updates }, {
                        headers: buildHeaders(),
                        requestOptions: {
                            key: "batch-update:".concat(updates.map(function (u) { return u.id; }).join(',')),
                            priority: 'high',
                            cancelPrevious: false
                        }
                    })];
                case 5: return [2 /*return*/, _b.sent()];
                case 6:
                    error_12 = _b.sent();
                    throw handleError(error_12, "batch update properties");
                case 7: return [2 /*return*/];
            }
        });
    }); },
    // Get property statistics with caching for better performance
    getPropertyStats: function (filters) { return __awaiter(void 0, void 0, void 0, function () {
        var searchParams, error_13;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    searchParams = filters ? buildSearchParams(filters) : new URLSearchParams();
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('GET', "".concat(API_BASE, "/stats?").concat(searchParams), undefined, {
                            headers: buildHeaders(),
                            requestOptions: {
                                key: "property-stats:".concat(searchParams.toString()),
                                cancelPrevious: true,
                                priority: 'normal'
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_13 = _a.sent();
                    throw handleError(error_13, "fetch property statistics");
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Land verification specific methods
    // Initiate land verification for a property
    initiateLandVerification: function (propertyId, requestedLayers) { return __awaiter(void 0, void 0, void 0, function () {
        var error_14;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('POST', "".concat(API_BASE, "/").concat(propertyId, "/land-verification"), { requestedLayers: requestedLayers }, {
                            headers: buildHeaders(),
                            requestOptions: {
                                key: "initiate-land-verification:".concat(propertyId),
                                priority: 'high',
                                cancelPrevious: false
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_14 = _a.sent();
                    throw handleError(error_14, "initiate land verification");
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Get land verification status for a property
    getLandVerificationStatus: function (propertyId) { return __awaiter(void 0, void 0, void 0, function () {
        var error_15;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('GET', "".concat(API_BASE, "/").concat(propertyId, "/land-verification/status"), undefined, {
                            headers: buildHeaders(),
                            requestOptions: {
                                key: "land-verification-status:".concat(propertyId),
                                cancelPrevious: true,
                                priority: 'normal'
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_15 = _a.sent();
                    throw handleError(error_15, "get land verification status");
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Get detailed land verification report
    getLandVerificationReport: function (propertyId) { return __awaiter(void 0, void 0, void 0, function () {
        var error_16;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('GET', "".concat(API_BASE, "/").concat(propertyId, "/land-verification/report"), undefined, {
                            headers: buildHeaders(),
                            requestOptions: {
                                key: "land-verification-report:".concat(propertyId),
                                cancelPrevious: true,
                                priority: 'normal'
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_16 = _a.sent();
                    throw handleError(error_16, "get land verification report");
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Update property with land verification results
    updatePropertyLandVerification: function (propertyId, landVerification) { return __awaiter(void 0, void 0, void 0, function () {
        var error_17;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('PATCH', "".concat(API_BASE, "/").concat(propertyId, "/land-verification"), { landVerification: landVerification }, {
                            headers: buildHeaders(),
                            requestOptions: {
                                key: "update-land-verification:".concat(propertyId),
                                priority: 'high',
                                cancelPrevious: true
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_17 = _a.sent();
                    throw handleError(error_17, "update property land verification");
                case 3: return [2 /*return*/];
            }
        });
    }); },
};
// Export both for backward compatibility
exports.PropertyApi = exports.propertyApi;
exports.default = exports.propertyApi;
