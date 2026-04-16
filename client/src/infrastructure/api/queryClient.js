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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cachePresets = exports.queryKeys = exports.queryClient = exports.getQueryFn = exports.APIError = void 0;
exports.apiRequest = apiRequest;
var react_query_1 = require("@tanstack/react-query");
var request_manager_1 = require("./request-manager");
// Simple API Error class
var APIError = /** @class */ (function (_super) {
    __extends(APIError, _super);
    function APIError(message, status, code, data) {
        var _this = _super.call(this, message) || this;
        _this.status = status;
        _this.code = code;
        _this.data = data;
        _this.name = 'APIError';
        return _this;
    }
    return APIError;
}(Error));
exports.APIError = APIError;
// Simple error handling utilities
function parseError(error) {
    if (error instanceof APIError)
        return error;
    if (error instanceof Error) {
        return new APIError(error.message, 500);
    }
    return new APIError(String(error), 500);
}
function isRetryableError(error) {
    return error.status >= 500 || error.status === 429;
}
function logError(error, context) {
    console.error("[".concat(context, "] ").concat(error.message), error);
}
function throwIfResNotOk(res) {
    return __awaiter(this, void 0, void 0, function () {
        var text, errorData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!res.ok) return [3 /*break*/, 2];
                    return [4 /*yield*/, res.text()];
                case 1:
                    text = (_a.sent()) || res.statusText;
                    errorData = void 0;
                    try {
                        errorData = JSON.parse(text);
                    }
                    catch (_b) {
                        errorData = { message: text };
                    }
                    throw new APIError(errorData.message || res.statusText, res.status, errorData.code, errorData);
                case 2: return [2 /*return*/];
            }
        });
    });
}
/**
 * Enhanced API request function with coordinated request management
 * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param url API endpoint URL
 * @param data Optional request payload (for POST, PUT, etc.)
 * @param options Additional fetch options and request management options
 * @returns JSON parsed response or null for empty responses
 */
function apiRequest(method_1, url_1, data_1) {
    return __awaiter(this, arguments, void 0, function (method, url, data, options) {
        var normalizedUrl, requestOptions, fetchOptions, requestKey;
        var _this = this;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            normalizedUrl = url.startsWith('/') ? url : "/".concat(url);
            requestOptions = options.requestOptions, fetchOptions = __rest(options, ["requestOptions"]);
            requestKey = (requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.key) || "".concat(method, ":").concat(normalizedUrl);
            // Use RequestManager for coordinated request handling
            return [2 /*return*/, request_manager_1.requestManager.makeRequest(function (signal) { return __awaiter(_this, void 0, void 0, function () {
                    var headers, body, res, error_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                headers = {};
                                // Safely add headers from options
                                if (fetchOptions.headers && typeof fetchOptions.headers === 'object') {
                                    if (fetchOptions.headers instanceof Headers) {
                                        fetchOptions.headers.forEach(function (value, key) {
                                            if (headers instanceof Headers) {
                                                headers.append(key, value);
                                            }
                                            else if (typeof headers === 'object') {
                                                headers[key] = value;
                                            }
                                        });
                                    }
                                    else {
                                        headers = __assign({}, fetchOptions.headers);
                                    }
                                }
                                body = undefined;
                                // Handle various data types appropriately
                                if (data) {
                                    if (data instanceof FormData) {
                                        // FormData should not set Content-Type as browser will set it with boundary
                                        body = data;
                                    }
                                    else if (typeof data === 'object') {
                                        headers['Content-Type'] = 'application/json';
                                        body = JSON.stringify(data);
                                    }
                                    else {
                                        body = data;
                                    }
                                }
                                return [4 /*yield*/, fetch(normalizedUrl, __assign({ method: method, headers: headers, body: body, credentials: "include", signal: signal }, fetchOptions))];
                            case 1:
                                res = _a.sent();
                                return [4 /*yield*/, throwIfResNotOk(res)];
                            case 2:
                                _a.sent();
                                // For empty responses or non-JSON responses
                                if (res.status === 204 || res.headers.get('content-length') === '0') {
                                    return [2 /*return*/, null];
                                }
                                _a.label = 3;
                            case 3:
                                _a.trys.push([3, 5, , 6]);
                                return [4 /*yield*/, res.json()];
                            case 4: return [2 /*return*/, _a.sent()];
                            case 5:
                                error_1 = _a.sent();
                                console.warn("Response could not be parsed as JSON from ".concat(normalizedUrl));
                                return [2 /*return*/, null];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); }, __assign({ key: requestKey, cancelPrevious: method === 'GET', retry: {
                        attempts: 3,
                        delay: 1000,
                        backoff: 'exponential'
                    } }, requestOptions))];
        });
    });
}
var getQueryFn = function (options) {
    return function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var unauthorizedBehavior;
        var queryKey = _b.queryKey, signal = _b.signal;
        return __generator(this, function (_c) {
            unauthorizedBehavior = options.on401;
            // Use RequestManager for coordinated query requests
            return [2 /*return*/, request_manager_1.requestManager.makeRequest(function (coordinatedSignal) { return __awaiter(void 0, void 0, void 0, function () {
                    var res;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, fetch(queryKey[0], {
                                    credentials: "include",
                                    signal: coordinatedSignal,
                                })];
                            case 1:
                                res = _a.sent();
                                if (unauthorizedBehavior === "returnNull" && res.status === 401) {
                                    return [2 /*return*/, null];
                                }
                                return [4 /*yield*/, throwIfResNotOk(res)];
                            case 2:
                                _a.sent();
                                return [4 /*yield*/, res.json()];
                            case 3: return [2 /*return*/, _a.sent()];
                        }
                    });
                }); }, {
                    key: "query:".concat(queryKey.join(':')),
                    signal: signal, // Pass through the query's abort signal
                    cancelPrevious: true, // Cancel previous queries with same key
                    priority: 'normal'
                })];
        });
    }); };
};
exports.getQueryFn = getQueryFn;
exports.queryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            queryFn: (0, exports.getQueryFn)({ on401: "throw" }),
            refetchInterval: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            // Enhanced caching strategy based on data type
            staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
            gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for offline access
            retry: function (failureCount, error) {
                var parsedError = parseError(error);
                logError(parsedError, 'React Query Retry');
                // Use the new error handling system
                if (!isRetryableError(parsedError)) {
                    return false;
                }
                return failureCount < 3;
            },
            retryDelay: function (attemptIndex) { return Math.min(1000 * Math.pow(2, attemptIndex), 30000); },
        },
        mutations: {
            retry: function (failureCount, error) {
                var parsedError = parseError(error);
                logError(parsedError, 'React Query Mutation Retry');
                // Use the new error handling system
                if (!isRetryableError(parsedError)) {
                    return false;
                }
                return failureCount < 2;
            },
            retryDelay: function (attemptIndex) { return Math.min(1000 * Math.pow(2, attemptIndex), 10000); },
        },
    },
});
// Enhanced query key factories with caching strategies
exports.queryKeys = {
    // Static/reference data - cache for 1 hour
    static: {
        propertyTypes: ['property-types'],
        locations: ['locations'],
        amenities: ['amenities'],
    },
    // User-specific data - cache for 10 minutes
    user: {
        profile: function (userId) { return ['user', 'profile', userId]; },
        preferences: function (userId) { return ['user', 'preferences', userId]; },
        notifications: function (userId) { return ['user', 'notifications', userId]; },
    },
    // Property data - cache for 5 minutes
    properties: {
        list: function (filters) { return ['properties', 'list', filters]; },
        detail: function (id) { return ['properties', 'detail', id]; },
        similar: function (id) { return ['properties', 'similar', id]; },
        stats: function (filters) { return ['properties', 'stats', filters]; },
        owner: function (ownerId) { return ['properties', 'owner', ownerId]; },
    },
    // Trust/verification data - cache for 2 minutes (more dynamic)
    trust: {
        score: function (userId) { return ['trust', 'score', userId]; },
        verification: function (userId) { return ['trust', 'verification', userId]; },
        community: function (userId) { return ['trust', 'community', userId]; },
    },
    // Analytics data - cache for 15 minutes
    analytics: {
        metrics: function (filters) { return ['analytics', 'metrics', filters]; },
        timeSeries: function (filters) { return ['analytics', 'timeSeries', filters]; },
    }
};
// Cache configuration presets
exports.cachePresets = {
    // Static reference data
    static: {
        staleTime: 60 * 60 * 1000, // 1 hour
        gcTime: 24 * 60 * 60 * 1000, // 24 hours
    },
    // User profile data
    profile: {
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 60 * 60 * 1000, // 1 hour
    },
    // Property listings
    listings: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    },
    // Real-time data
    realtime: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
    },
    // Analytics data
    analytics: {
        staleTime: 15 * 60 * 1000, // 15 minutes
        gcTime: 2 * 60 * 60 * 1000, // 2 hours
    }
};
