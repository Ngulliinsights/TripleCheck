"use strict";
// Enhanced API client with race condition protection
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
exports.createAuthenticatedApiClient = exports.createApiClient = exports.AuthenticatedApiClient = exports.apiClient = exports.ApiClient = void 0;
// Simple in-memory cache for client-side use (no server imports)
var simpleCache = new Map();
var cacheGet = function (key) { return __awaiter(void 0, void 0, void 0, function () {
    var item;
    return __generator(this, function (_a) {
        item = simpleCache.get(key);
        if (!item)
            return [2 /*return*/, null];
        if (Date.now() > item.expiry) {
            simpleCache.delete(key);
            return [2 /*return*/, null];
        }
        return [2 /*return*/, item.value];
    });
}); };
var cacheSet = function (key, value, ttlSeconds) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        simpleCache.set(key, {
            value: value,
            expiry: Date.now() + (ttlSeconds * 1000)
        });
        return [2 /*return*/];
    });
}); };
// Request cache for preventing duplicate requests
var requestCache = new Map();
// Default cache TTL (5 minutes)
var DEFAULT_CACHE_TTL = 5 * 60 * 1000;
// Retry configuration
var DEFAULT_RETRY_CONFIG = {
    retries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 30000,
};
// Request ID generator for better debugging
var generateRequestId = function () {
    var _a;
    // Use crypto API if available, otherwise fall back to timestamp-based ID
    if ((_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.crypto) === null || _a === void 0 ? void 0 : _a.randomUUID) {
        return "req_".concat(Date.now(), "_").concat(globalThis.crypto.randomUUID().substring(0, 8));
    }
    // Fallback for environments without crypto API
    return "req_".concat(Date.now(), "_").concat(Date.now().toString(36));
};
// Enhanced API client with race condition protection
var ApiClient = /** @class */ (function () {
    function ApiClient(config) {
        if (config === void 0) { config = {}; }
        this.baseUrl = config.baseUrl || "";
        this.defaultOptions = __assign({ timeout: 10000, retries: DEFAULT_RETRY_CONFIG.retries, retryDelay: DEFAULT_RETRY_CONFIG.retryDelay, useCache: false }, config.defaultOptions);
    }
    ApiClient.prototype.createAbortController = function (timeout, signal) {
        var controller = new AbortController();
        // Set timeout
        setTimeout(function () { return controller.abort(); }, timeout);
        // Forward external abort signal
        signal === null || signal === void 0 ? void 0 : signal.addEventListener("abort", function () {
            controller.abort();
        });
        return controller;
    };
    ApiClient.prototype.getCacheKey = function (url, options) {
        var method = options.method || "GET";
        var headers = JSON.stringify(options.headers || {});
        var body = options.body ? JSON.stringify(options.body) : "";
        return "".concat(method, ":").concat(url, ":").concat(headers, ":").concat(body);
    };
    ApiClient.prototype.getCachedResponse = function (cacheKey) {
        var item = simpleCache.get(cacheKey);
        if (!item)
            return null;
        if (Date.now() > item.expiry) {
            simpleCache.delete(cacheKey);
            return null;
        }
        return item.value;
    };
    ApiClient.prototype.setCachedResponse = function (cacheKey, data, ttl) {
        if (ttl === void 0) { ttl = DEFAULT_CACHE_TTL; }
        simpleCache.set(cacheKey, {
            value: data,
            expiry: Date.now() + ttl
        });
    };
    ApiClient.prototype.sleep = function (ms) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
            });
        });
    };
    ApiClient.prototype.calculateRetryDelay = function (attempt, baseDelay) {
        var _a, _b;
        var delay = baseDelay * Math.pow(DEFAULT_RETRY_CONFIG.backoffMultiplier, attempt);
        // Use secure random if available, otherwise use timestamp-based jitter
        var jitter;
        if ((_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.crypto) === null || _a === void 0 ? void 0 : _a.getRandomValues) {
            var randomArray = new Uint32Array(1);
            globalThis.crypto.getRandomValues(randomArray);
            jitter = (((_b = randomArray[0]) !== null && _b !== void 0 ? _b : 0) / Math.pow(2, 32)) * 0.1 * delay;
        }
        else {
            // Fallback: use timestamp-based pseudo-random for jitter
            jitter = ((Date.now() % 1000) / 1000) * 0.1 * delay;
        }
        return Math.min(delay + jitter, DEFAULT_RETRY_CONFIG.maxDelay);
    };
    ApiClient.prototype.buildRequestInit = function (options, signal) {
        var requestInit = { signal: signal };
        if (options.method)
            requestInit.method = options.method;
        if (options.headers)
            requestInit.headers = options.headers;
        if (options.body !== undefined)
            requestInit.body = options.body || null;
        if (options.mode)
            requestInit.mode = options.mode;
        if (options.credentials)
            requestInit.credentials = options.credentials;
        if (options.cache)
            requestInit.cache = options.cache;
        if (options.redirect)
            requestInit.redirect = options.redirect;
        if (options.referrer)
            requestInit.referrer = options.referrer;
        if (options.referrerPolicy)
            requestInit.referrerPolicy = options.referrerPolicy;
        if (options.integrity)
            requestInit.integrity = options.integrity;
        if (options.keepalive)
            requestInit.keepalive = options.keepalive;
        if (options.window !== undefined)
            requestInit.window = options.window;
        return requestInit;
    };
    ApiClient.prototype.processResponse = function (response, options, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, contentType;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contentType = response.headers.get("content-type");
                        if (!(contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/json"))) return [3 /*break*/, 2];
                        return [4 /*yield*/, response.json()];
                    case 1:
                        data = _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, response.text()];
                    case 3:
                        data = _a.sent();
                        _a.label = 4;
                    case 4:
                        // Apply transformation if provided
                        if (options.transform) {
                            data = options.transform(data);
                        }
                        return [2 /*return*/, {
                                data: data,
                                success: true,
                                message: data === null || data === void 0 ? void 0 : data.message,
                                status: response.status,
                                headers: Object.fromEntries(response.headers.entries()),
                                requestId: requestId,
                            }];
                }
            });
        });
    };
    ApiClient.prototype.executeWithRetry = function (fn, retries, retryDelay) {
        return __awaiter(this, void 0, void 0, function () {
            var lastError, attempt, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lastError = new Error("Request failed");
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= retries)) return [3 /*break*/, 8];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 7]);
                        return [4 /*yield*/, fn()];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_1 = _a.sent();
                        lastError = error_1;
                        // Don't retry on certain errors
                        if (error_1 instanceof TypeError ||
                            (error_1 === null || error_1 === void 0 ? void 0 : error_1.name) === "AbortError" ||
                            (error_1 === null || error_1 === void 0 ? void 0 : error_1.status) === 401 ||
                            (error_1 === null || error_1 === void 0 ? void 0 : error_1.status) === 403) {
                            throw error_1;
                        }
                        if (!(attempt < retries)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.sleep(this.calculateRetryDelay(attempt, retryDelay))];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 7];
                    case 7:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 8: throw lastError;
                }
            });
        });
    };
    ApiClient.prototype.request = function (url_1) {
        return __awaiter(this, arguments, void 0, function (url, options) {
            var mergedOptions, fullUrl, requestId, cacheKey, cached, existingRequest, controller, requestPromise, error_2, errorResult;
            var _this = this;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mergedOptions = __assign(__assign({}, this.defaultOptions), options);
                        fullUrl = url.startsWith("http") ? url : "".concat(this.baseUrl).concat(url);
                        requestId = generateRequestId();
                        cacheKey = mergedOptions.cacheKey || this.getCacheKey(fullUrl, mergedOptions);
                        // Check response cache first
                        if (mergedOptions.useCache) {
                            cached = this.getCachedResponse(cacheKey);
                            if (cached) {
                                return [2 /*return*/, __assign(__assign({}, cached), { cached: true, requestId: requestId })];
                            }
                        }
                        if (!requestCache.has(cacheKey)) return [3 /*break*/, 2];
                        existingRequest = requestCache.get(cacheKey);
                        if (!existingRequest) return [3 /*break*/, 2];
                        return [4 /*yield*/, existingRequest];
                    case 1: return [2 /*return*/, (_a.sent())];
                    case 2:
                        controller = this.createAbortController(mergedOptions.timeout || 10000, mergedOptions.signal);
                        requestPromise = this.executeWithRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                            var requestInit, response, errorMessage, error, result;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        requestInit = this.buildRequestInit(mergedOptions, controller.signal);
                                        return [4 /*yield*/, fetch(fullUrl, requestInit)];
                                    case 1:
                                        response = _a.sent();
                                        if (!response.ok) {
                                            errorMessage = "HTTP ".concat(response.status, ": ").concat(response.statusText);
                                            error = new Error(errorMessage);
                                            error.status = response.status;
                                            throw error;
                                        }
                                        return [4 /*yield*/, this.processResponse(response, mergedOptions, requestId)];
                                    case 2:
                                        result = _a.sent();
                                        // Cache successful responses
                                        if (mergedOptions.useCache) {
                                            this.setCachedResponse(cacheKey, result, mergedOptions.cacheTtl || DEFAULT_CACHE_TTL);
                                        }
                                        return [2 /*return*/, result];
                                }
                            });
                        }); }, mergedOptions.retries || 0, mergedOptions.retryDelay || 1000);
                        // Cache the request promise to prevent duplicate requests
                        requestCache.set(cacheKey, requestPromise);
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, 6, 7]);
                        return [4 /*yield*/, requestPromise];
                    case 4: return [2 /*return*/, _a.sent()];
                    case 5:
                        error_2 = _a.sent();
                        errorResult = {
                            data: null,
                            success: false,
                            error: error_2 instanceof Error ? error_2.message : "Unknown error",
                            status: (error_2 === null || error_2 === void 0 ? void 0 : error_2.status) || 0,
                            requestId: requestId,
                        };
                        return [2 /*return*/, errorResult];
                    case 6:
                        // Clean up request cache
                        requestCache.delete(cacheKey);
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    // Enhanced convenience methods with better type safety
    ApiClient.prototype.get = function (url_1) {
        return __awaiter(this, arguments, void 0, function (url, options) {
            var _a;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_b) {
                return [2 /*return*/, this.request(url, __assign(__assign({}, options), { method: "GET", useCache: (_a = options.useCache) !== null && _a !== void 0 ? _a : true }))];
            });
        });
    };
    ApiClient.prototype.post = function (url_1, data_1) {
        return __awaiter(this, arguments, void 0, function (url, data, options) {
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.request(url, __assign(__assign({}, options), { method: "POST", headers: __assign({ "Content-Type": "application/json" }, options.headers), body: data ? JSON.stringify(data) : null }))];
            });
        });
    };
    ApiClient.prototype.put = function (url_1, data_1) {
        return __awaiter(this, arguments, void 0, function (url, data, options) {
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.request(url, __assign(__assign({}, options), { method: "PUT", headers: __assign({ "Content-Type": "application/json" }, options.headers), body: data ? JSON.stringify(data) : null }))];
            });
        });
    };
    ApiClient.prototype.patch = function (url_1, data_1) {
        return __awaiter(this, arguments, void 0, function (url, data, options) {
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.request(url, __assign(__assign({}, options), { method: "PATCH", headers: __assign({ "Content-Type": "application/json" }, options.headers), body: data ? JSON.stringify(data) : null }))];
            });
        });
    };
    ApiClient.prototype.delete = function (url_1) {
        return __awaiter(this, arguments, void 0, function (url, options) {
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.request(url, __assign(__assign({}, options), { method: "DELETE" }))];
            });
        });
    };
    // Cache management methods
    ApiClient.prototype.clearCache = function () {
        requestCache.clear();
        simpleCache.clear();
    };
    ApiClient.prototype.clearCacheEntry = function (cacheKey) {
        requestCache.delete(cacheKey);
        simpleCache.delete(cacheKey);
    };
    // Get cache statistics
    ApiClient.prototype.getCacheStats = function () {
        return {
            size: simpleCache.size,
            keys: Array.from(simpleCache.keys())
        };
    };
    // Warm cache with data
    ApiClient.prototype.warmCache = function (entries) {
        var _this = this;
        entries.forEach(function (_a) {
            var key = _a.key, data = _a.data, ttl = _a.ttl;
            _this.setCachedResponse(key, data, ttl);
        });
    };
    return ApiClient;
}());
exports.ApiClient = ApiClient;
// Default API client instance
exports.apiClient = new ApiClient({ baseUrl: "/api" });
// Enhanced authenticated API client
var AuthenticatedApiClient = /** @class */ (function (_super) {
    __extends(AuthenticatedApiClient, _super);
    function AuthenticatedApiClient(config) {
        if (config === void 0) { config = {}; }
        var _this = this;
        var getAuthToken = config.getAuthToken, refreshToken = config.refreshToken, apiConfig = __rest(config, ["getAuthToken", "refreshToken"]);
        _this = _super.call(this, {
            baseUrl: apiConfig.baseUrl || "/api",
            defaultOptions: __assign({ headers: {
                    "Content-Type": "application/json",
                } }, apiConfig.defaultOptions),
        }) || this;
        if (getAuthToken)
            _this.getAuthToken = getAuthToken;
        if (refreshToken)
            _this.refreshToken = refreshToken;
        // Override request method to add authentication
        var originalRequest = _this.request.bind(_this);
        _this.request = function (url_1) {
            var args_1 = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args_1[_i - 1] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([url_1], args_1, true), void 0, function (url, options) {
                var token, response, newToken, refreshError_1;
                var _a, _b;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, ((_a = this.getAuthToken) === null || _a === void 0 ? void 0 : _a.call(this))];
                        case 1:
                            token = _c.sent();
                            if (token) {
                                options.headers = __assign(__assign({}, options.headers), { Authorization: "Bearer ".concat(token) });
                            }
                            return [4 /*yield*/, originalRequest(url, options)];
                        case 2:
                            response = _c.sent();
                            if (!(!response.success && response.status === 401 && this.refreshToken)) return [3 /*break*/, 7];
                            _c.label = 3;
                        case 3:
                            _c.trys.push([3, 6, , 7]);
                            return [4 /*yield*/, this.refreshToken()];
                        case 4:
                            _c.sent();
                            return [4 /*yield*/, ((_b = this.getAuthToken) === null || _b === void 0 ? void 0 : _b.call(this))];
                        case 5:
                            newToken = _c.sent();
                            if (newToken) {
                                options.headers = __assign(__assign({}, options.headers), { Authorization: "Bearer ".concat(newToken) });
                                return [2 /*return*/, originalRequest(url, options)];
                            }
                            return [3 /*break*/, 7];
                        case 6:
                            refreshError_1 = _c.sent();
                            // Token refresh failed, continue with original response
                            // In production, you might want to log this to your error tracking service
                            if (refreshError_1 instanceof Error &&
                                refreshError_1.message.includes("network")) {
                                // Handle network errors specifically if needed
                            }
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/, response];
                    }
                });
            });
        };
        return _this;
    }
    return AuthenticatedApiClient;
}(ApiClient));
exports.AuthenticatedApiClient = AuthenticatedApiClient;
// Export utility functions
var createApiClient = function (config) { return new ApiClient(config); };
exports.createApiClient = createApiClient;
var createAuthenticatedApiClient = function (config) { return new AuthenticatedApiClient(config); };
exports.createAuthenticatedApiClient = createAuthenticatedApiClient;
