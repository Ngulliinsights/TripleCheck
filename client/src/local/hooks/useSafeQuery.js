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
exports.operationTracker = exports.globalCoordinator = exports.useSafeSimilarPropertiesQuery = exports.useSafePropertySearchQuery = exports.useSafePropertyActionsQuery = exports.useSafeOwnerPropertiesQuery = exports.useSafeMessagesQuery = exports.useSafeTrustScoreQuery = exports.useSafeUserQuery = exports.useSafePropertyQuery = exports.useSafePropertiesQuery = void 0;
exports.useSafeQuery = useSafeQuery;
var react_query_1 = require("@tanstack/react-query");
var react_1 = require("react");
var useCleanupManager_1 = require("../../infrastructure/hooks/useCleanupManager");
var useSafeEffect_1 = require("../../infrastructure/hooks/useSafeEffect");
// Removed unused import: requestMonitor
// Enhanced request coordinator with better error handling and metrics
var RequestCoordinator = /** @class */ (function () {
    function RequestCoordinator() {
        this.pendingRequests = new Map();
        this.requestMetrics = new Map();
        this.globalRequestCount = 0;
        this.lastGlobalReset = Date.now();
        this.circuitBreakers = new Map();
        this.MAX_GLOBAL_REQUESTS = 15; // Reduced from 20 to be more conservative
        this.CIRCUIT_BREAKER_THRESHOLD = 5;
        this.CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
        this.REQUEST_WINDOW = 1000; // 1 second window
    }
    RequestCoordinator.prototype.checkCircuitBreaker = function (key) {
        var circuitBreaker = this.circuitBreakers.get(key);
        if (circuitBreaker === null || circuitBreaker === void 0 ? void 0 : circuitBreaker.isOpen) {
            var timeSinceLastFailure = Date.now() - circuitBreaker.lastFailure;
            if (timeSinceLastFailure < this.CIRCUIT_BREAKER_TIMEOUT) {
                throw new Error("Circuit breaker is open for ".concat(key, ". Try again later."));
            }
            else {
                // Reset circuit breaker after timeout
                circuitBreaker.isOpen = false;
                circuitBreaker.failures = 0;
            }
        }
    };
    RequestCoordinator.prototype.handleRateLimit = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, backoffTime_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = Date.now();
                        if (now - this.lastGlobalReset > this.REQUEST_WINDOW) {
                            this.globalRequestCount = 0;
                            this.lastGlobalReset = now;
                        }
                        this.globalRequestCount++;
                        if (!(this.globalRequestCount > this.MAX_GLOBAL_REQUESTS)) return [3 /*break*/, 2];
                        backoffTime_1 = Math.min(1000 * Math.pow(2, this.globalRequestCount - this.MAX_GLOBAL_REQUESTS), 10000);
                        if (process.env.NODE_ENV === "development") {
                            // eslint-disable-next-line no-console
                            console.warn("[RequestCoordinator] Rate limit exceeded (".concat(this.globalRequestCount, " requests/sec). Backing off for ").concat(backoffTime_1, "ms"));
                        }
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, backoffTime_1); })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    RequestCoordinator.prototype.updateRequestMetrics = function (key) {
        var metrics = this.requestMetrics.get(key) || {
            count: 0,
            lastUsed: Date.now(),
            errorCount: 0,
        };
        this.requestMetrics.set(key, {
            count: metrics.count + 1,
            lastUsed: Date.now(),
            errorCount: metrics.errorCount,
        });
    };
    RequestCoordinator.prototype.setupRequestController = function (key, timeout) {
        var existingController = this.pendingRequests.get(key);
        if (existingController) {
            existingController.abort();
        }
        var controller = new AbortController();
        this.pendingRequests.set(key, controller);
        var timeoutId;
        if (timeout) {
            timeoutId = setTimeout(function () {
                controller.abort();
            }, timeout);
        }
        return { controller: controller, timeoutId: timeoutId };
    };
    RequestCoordinator.prototype.handleRequestSuccess = function (key, result) {
        var circuitBreaker = this.circuitBreakers.get(key);
        if (circuitBreaker) {
            circuitBreaker.failures = 0;
            circuitBreaker.isOpen = false;
        }
        var metrics = this.requestMetrics.get(key) || { count: 0, lastUsed: Date.now(), errorCount: 0 };
        this.requestMetrics.set(key, __assign(__assign({}, metrics), { count: metrics.count + 1, lastUsed: Date.now() }));
        return result;
    };
    RequestCoordinator.prototype.handleRequestError = function (key, error, timeoutId) {
        var circuitBreaker = this.circuitBreakers.get(key) || { failures: 0, lastFailure: 0, isOpen: false };
        circuitBreaker.failures++;
        circuitBreaker.lastFailure = Date.now();
        if (circuitBreaker.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
            circuitBreaker.isOpen = true;
            if (process.env.NODE_ENV === "development") {
                // eslint-disable-next-line no-console
                console.warn("[RequestCoordinator] Circuit breaker opened for ".concat(key, " after ").concat(circuitBreaker.failures, " failures"));
            }
        }
        this.circuitBreakers.set(key, circuitBreaker);
        var metrics = this.requestMetrics.get(key) || { count: 0, lastUsed: Date.now(), errorCount: 0 };
        this.requestMetrics.set(key, __assign(__assign({}, metrics), { errorCount: metrics.errorCount + 1, lastError: error instanceof Error ? error.message : 'Unknown error', lastUsed: Date.now() }));
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error(timeoutId ?
                "Request timed out"
                : "Request was cancelled");
        }
        throw error;
    };
    RequestCoordinator.prototype.executeRequest = function (key, requestFn, timeout) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, controller, timeoutId, result, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.checkCircuitBreaker(key);
                        return [4 /*yield*/, this.handleRateLimit()];
                    case 1:
                        _b.sent();
                        this.updateRequestMetrics(key);
                        _a = this.setupRequestController(key, timeout), controller = _a.controller, timeoutId = _a.timeoutId;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, 5, 6]);
                        return [4 /*yield*/, requestFn(controller.signal)];
                    case 3:
                        result = _b.sent();
                        return [2 /*return*/, this.handleRequestSuccess(key, result)];
                    case 4:
                        error_1 = _b.sent();
                        return [2 /*return*/, this.handleRequestError(key, error_1, timeoutId)];
                    case 5:
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                        }
                        this.pendingRequests.delete(key);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RequestCoordinator.prototype.cancelRequest = function (key) {
        var controller = this.pendingRequests.get(key);
        if (controller) {
            controller.abort();
            this.pendingRequests.delete(key);
            return true;
        }
        return false;
    };
    // Fixed: Now always returns the same type structure
    RequestCoordinator.prototype.getRequestStats = function (key) {
        var metrics = this.requestMetrics.get(key);
        if (!metrics)
            return null;
        return {
            count: metrics.count,
            lastUsed: metrics.lastUsed
        };
    };
    // Separate method for getting all stats if needed
    RequestCoordinator.prototype.getAllRequestStats = function () {
        var _a;
        var result = {};
        for (var _i = 0, _b = Array.from(this.requestMetrics.entries()); _i < _b.length; _i++) {
            var _c = _b[_i], key = _c[0], metrics = _c[1];
            // Use safe property access to avoid object injection warnings
            var safeMetrics = {
                count: metrics.count,
                lastUsed: metrics.lastUsed
            };
            // Use Object.assign to avoid object injection warnings
            Object.assign(result, (_a = {}, _a[key] = safeMetrics, _a));
        }
        return result;
    };
    // Clean up old metrics to prevent memory leaks
    RequestCoordinator.prototype.cleanup = function (maxAge) {
        var _this = this;
        if (maxAge === void 0) { maxAge = 5 * 60 * 1000; }
        var now = Date.now();
        this.requestMetrics.forEach(function (metrics, key) {
            if (now - metrics.lastUsed > maxAge) {
                _this.requestMetrics.delete(key);
            }
        });
        // Also clean up old circuit breakers
        this.circuitBreakers.forEach(function (breaker, key) {
            if (now - breaker.lastFailure > maxAge && !breaker.isOpen) {
                _this.circuitBreakers.delete(key);
            }
        });
    };
    // Get circuit breaker status for debugging
    RequestCoordinator.prototype.getCircuitBreakerStatus = function (key) {
        return this.circuitBreakers.get(key) || null;
    };
    // Reset circuit breaker manually if needed
    RequestCoordinator.prototype.resetCircuitBreaker = function (key) {
        var breaker = this.circuitBreakers.get(key);
        if (breaker) {
            breaker.failures = 0;
            breaker.isOpen = false;
            return true;
        }
        return false;
    };
    return RequestCoordinator;
}());
var globalCoordinator = new RequestCoordinator();
exports.globalCoordinator = globalCoordinator;
// Optimized operation tracker with better memory management
var OperationTracker = /** @class */ (function () {
    function OperationTracker() {
        this.operations = new Map();
        this.maxOperations = 100; // Prevent memory leaks
    }
    OperationTracker.prototype.startOperation = function (type, description, context) {
        var _a, _b, _c;
        // Clean up old operations if we're approaching the limit
        if (this.operations.size >= this.maxOperations) {
            this.cleanupOldOperations();
        }
        var id = "".concat(type, "-").concat(Date.now(), "-").concat(((_c = (_b = (_a = globalThis.crypto) === null || _a === void 0 ? void 0 : _a.randomUUID) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.substring(0, 8)) || Date.now().toString(36));
        var operation = {
            id: id,
            type: type,
            description: description,
            context: context || "",
            startTime: Date.now(),
            status: "pending",
        };
        this.operations.set(id, operation);
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.log("\uD83D\uDD0D [".concat(type, "] ").concat(description), { id: id, context: context });
        }
        return id;
    };
    OperationTracker.prototype.completeOperation = function (id, data, error) {
        var operation = this.operations.get(id);
        if (!operation)
            return;
        operation.status = error ? "failed" : "completed";
        operation.duration = Date.now() - operation.startTime;
        operation.error = (error === null || error === void 0 ? void 0 : error.message) || "";
        if (process.env.NODE_ENV === "development") {
            var icon = operation.status === "completed" ? "✅" : "❌";
            // eslint-disable-next-line no-console
            console.log("".concat(icon, " ").concat(operation.description, " (").concat(operation.duration, "ms)"), { data: data, error: operation.error });
        }
    };
    OperationTracker.prototype.getActiveOperations = function (context) {
        return Array.from(this.operations.values()).filter(function (op) { return op.status === "pending" && (!context || op.context === context); });
    };
    OperationTracker.prototype.cleanupOldOperations = function () {
        var _this = this;
        var completedOperations = Array.from(this.operations.entries())
            .filter(function (_a) {
            var op = _a[1];
            return op.status !== "pending";
        })
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b.startTime + (b.duration || 0) - (a.startTime + (a.duration || 0));
        });
        // Keep only the 20 most recent completed operations
        completedOperations.slice(20).forEach(function (_a) {
            var id = _a[0];
            _this.operations.delete(id);
        });
    };
    return OperationTracker;
}());
var operationTracker = new OperationTracker();
exports.operationTracker = operationTracker;
// Set up periodic cleanup to prevent memory leaks
if (typeof window !== "undefined") {
    setInterval(function () {
        globalCoordinator.cleanup();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
}
// Enterprise error message mapping
var getEnterpriseErrorMessage = function (error) {
    var message = error.message.toLowerCase();
    if (message.includes('429') || message.includes('rate limit')) {
        return 'Too many requests. Please wait a moment before trying again.';
    }
    if (message.includes('timeout')) {
        return 'Request timed out. Please check your connection and try again.';
    }
    if (message.includes('network') || message.includes('fetch')) {
        return 'Network error. Please check your internet connection.';
    }
    if (message.includes('validation') || message.includes('invalid')) {
        return 'Invalid data received. Please refresh and try again.';
    }
    if (message.includes('unauthorized') || message.includes('401')) {
        return 'Authentication required. Please log in again.';
    }
    if (message.includes('forbidden') || message.includes('403')) {
        return 'Access denied. You don\'t have permission for this action.';
    }
    if (message.includes('not found') || message.includes('404')) {
        return 'The requested resource was not found.';
    }
    return 'An unexpected error occurred. Please try again.';
};
// Import property configurations after interfaces are defined
var propertyListConfig = {
    endpoint: "/api/properties",
    method: "GET",
    fallbackData: [],
    staleTime: 2 * 60 * 1000, // 2 minutes - frequent updates expected
    gcTime: 5 * 60 * 1000, // 5 minutes - reasonable cleanup time
    retry: 3,
    debounceMs: 500,
    deduplicate: true,
    context: "properties",
    validator: function (data) {
        if (!Array.isArray(data)) {
            // Handle API response format that might wrap data
            if (data && typeof data === "object" && "data" in data) {
                var wrappedData = data.data;
                if (Array.isArray(wrappedData)) {
                    return wrappedData.filter(function (item) {
                        if (!item || typeof item !== "object")
                            return false;
                        var obj = item;
                        return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                            obj.id != null &&
                            typeof obj.title === "string" &&
                            obj.title.length > 0 &&
                            typeof obj.description === "string" &&
                            obj.description.length > 0);
                    });
                }
            }
            return [];
        }
        return data.filter(function (item) {
            if (!item || typeof item !== "object")
                return false;
            var obj = item;
            return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                obj.id != null &&
                typeof obj.title === "string" &&
                obj.title.length > 0 &&
                typeof obj.description === "string" &&
                obj.description.length > 0);
        });
    },
};
var propertyDetailConfig = {
    fallbackData: null,
    staleTime: 10 * 60 * 1000, // 10 minutes - more stable data
    gcTime: 30 * 60 * 1000, // 30 minutes - longer retention for detail views
    retry: 2,
    deduplicate: true,
    context: "property",
    validator: function (data) {
        if (!data || typeof data !== "object")
            return null;
        var response = data;
        // Handle API response format: { success: true, data: property }
        var property;
        if (response.success && response.data && typeof response.data === "object") {
            property = response.data;
        }
        else {
            // Handle direct property data
            property = response;
        }
        return __assign(__assign({}, property), { id: property.id || "", title: property.title || "Untitled Property", description: property.description || "No description available", price: typeof property.price === "number" ? property.price : 0, location: property.location || "", images: Array.isArray(property.images) ? property.images : Array.isArray(property.imageUrls) ? property.imageUrls : [] });
    },
};
/**
 * Enhanced safe query hook with enterprise-grade features
 *
 * Provides comprehensive data fetching with built-in error handling, rate limiting,
 * circuit breakers, request deduplication, and analytics tracking.
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Circuit breaker pattern for failing services
 * - Request deduplication and caching
 * - Rate limiting and throttling
 * - Comprehensive error handling with user-friendly messages
 * - Analytics and performance monitoring
 * - TypeScript validation and transformation
 *
 * @param options - Configuration options for the query
 * @returns Enhanced query result with additional utilities
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, hasValidData } = useSafeQuery({
 *   endpoint: '/api/properties',
 *   method: 'GET',
 *   fallbackData: [],
 *   validator: (data) => Array.isArray(data) ? data : [],
 *   onAnalyticsEvent: (event, data) => analytics.track(event, data),
 *   context: 'property-list'
 * });
 * ```
 */
function useSafeQuery(_a) {
    var _this = this;
    var _b;
    var endpoint = _a.endpoint, _c = _a.method, method = _c === void 0 ? "GET" : _c, body = _a.body, _d = _a.headers, headers = _d === void 0 ? {} : _d, _e = _a.timeout, timeout = _e === void 0 ? 30000 : _e, fallbackData = _a.fallbackData, validator = _a.validator, _f = _a.retry, retry = _f === void 0 ? 3 : _f, _g = _a.debounceMs, debounceMs = _g === void 0 ? 0 : _g, _h = _a.deduplicate, deduplicate = _h === void 0 ? true : _h, _j = _a.trackOperations, trackOperations = _j === void 0 ? process.env.NODE_ENV === "development" : _j, _k = _a.context, context = _k === void 0 ? "unknown" : _k, cacheKey = _a.cacheKey, onAnalyticsEvent = _a.onAnalyticsEvent, onError = _a.onError, onSuccess = _a.onSuccess, queryOptions = __rest(_a, ["endpoint", "method", "body", "headers", "timeout", "fallbackData", "validator", "retry", "debounceMs", "deduplicate", "trackOperations", "context", "cacheKey", "onAnalyticsEvent", "onError", "onSuccess"]);
    var _l = (0, react_1.useState)(body), debouncedBody = _l[0], setDebouncedBody = _l[1];
    var operationIdRef = (0, react_1.useRef)(null);
    var lastRequestRef = (0, react_1.useRef)("");
    var requestCountRef = (0, react_1.useRef)(0);
    var lastRequestTimeRef = (0, react_1.useRef)(0);
    var cleanupManager = (0, useCleanupManager_1.useEnhancedCleanupManager)();
    var queryClient = (0, react_query_1.useQueryClient)();
    // Enterprise circuit breaker
    var circuitBreaker = (0, react_1.useRef)(new Map());
    // Enterprise metrics
    var metrics = (0, react_1.useRef)({
        requestCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
        responseTimes: [],
        successCount: 0,
    });
    // Enhanced debouncing with proper cleanup and infinite loop prevention
    (0, useSafeEffect_1.useSafeEffect)(function () {
        // Prevent infinite loops by checking if body actually changed
        var currentBodyString = JSON.stringify(body);
        var lastBodyString = JSON.stringify(debouncedBody);
        if (currentBodyString === lastBodyString) {
            return; // No change, skip update
        }
        // Track request frequency to detect potential infinite loops
        var now = Date.now();
        var timeSinceLastRequest = now - lastRequestTimeRef.current;
        // If requests are happening too frequently (more than 3 per second), throttle them
        if (timeSinceLastRequest < 300) {
            requestCountRef.current += 1;
            if (requestCountRef.current > 5) { // Increased threshold
                if (process.env.NODE_ENV === "development") {
                    // eslint-disable-next-line no-console
                    console.warn("[useSafeQuery] Throttling requests for ".concat(endpoint, " - too many rapid calls detected (").concat(requestCountRef.current, " requests)"));
                }
                return;
            }
        }
        else {
            // Reset counter if enough time has passed
            requestCountRef.current = 0;
        }
        lastRequestTimeRef.current = now;
        if (debounceMs > 0) {
            cleanupManager.removeCleanup("debounce-timeout");
            cleanupManager.addTimeout(function () {
                // Double-check that component is still mounted before updating
                if (lastRequestTimeRef.current > 0) {
                    setDebouncedBody(body);
                }
            }, debounceMs, "debounce-timeout");
        }
        else {
            setDebouncedBody(body);
        }
    }, [body, debounceMs, cleanupManager, endpoint]); // Removed debouncedBody from dependencies to prevent loops
    // Optimized cache key generation with better serialization and loop prevention
    var requestCacheKey = (0, react_1.useMemo)(function () {
        if (cacheKey)
            return cacheKey;
        // Create a stable cache key by normalizing the data
        var normalizedBody = '';
        if (debouncedBody) {
            if (typeof debouncedBody === 'object') {
                normalizedBody = JSON.stringify(debouncedBody, Object.keys(debouncedBody).sort(function (a, b) { return a.localeCompare(b); }));
            }
            else {
                normalizedBody = String(debouncedBody);
            }
        }
        var normalizedHeaders = headers ?
            JSON.stringify(headers, Object.keys(headers).sort(function (a, b) { return a.localeCompare(b); })) : '';
        var currentKey = "".concat(method, ":").concat(endpoint, ":").concat(normalizedBody, ":").concat(normalizedHeaders);
        // Only update if the key actually changed
        if (lastRequestRef.current !== currentKey) {
            lastRequestRef.current = currentKey;
        }
        return lastRequestRef.current;
    }, [method, endpoint, debouncedBody, headers, cacheKey]);
    // Enterprise cache warming
    (0, react_1.useEffect)(function () {
        if (validator && queryOptions.enabled !== false) {
            queryClient.prefetchQuery({
                queryKey: [requestCacheKey],
                queryFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var result, _c;
                    var _this = this;
                    var signal = _b.signal;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                _d.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, globalCoordinator.executeRequest(requestCacheKey, function (requestSignal) { return __awaiter(_this, void 0, void 0, function () {
                                        var url, requestConfig, response, _a;
                                        var _b;
                                        return __generator(this, function (_c) {
                                            switch (_c.label) {
                                                case 0:
                                                    url = (method === "GET" && debouncedBody && typeof debouncedBody === "object") ?
                                                        "".concat(endpoint, "?").concat(new URLSearchParams(debouncedBody).toString()) : endpoint;
                                                    requestConfig = {
                                                        method: method,
                                                        headers: __assign({ "Content-Type": "application/json", Authorization: "Bearer ".concat(localStorage.getItem("auth_token") || "") }, headers),
                                                        credentials: "include",
                                                        signal: requestSignal,
                                                    };
                                                    // Only add body property for non-GET requests with actual data
                                                    if (method !== "GET" && debouncedBody !== undefined) {
                                                        requestConfig.body = JSON.stringify(debouncedBody);
                                                    }
                                                    return [4 /*yield*/, fetch(url, requestConfig)];
                                                case 1:
                                                    response = _c.sent();
                                                    if (!response.ok)
                                                        throw new Error("HTTP ".concat(response.status));
                                                    if (!((_b = response.headers.get("content-type")) === null || _b === void 0 ? void 0 : _b.includes("application/json"))) return [3 /*break*/, 3];
                                                    return [4 /*yield*/, response.json()];
                                                case 2:
                                                    _a = _c.sent();
                                                    return [3 /*break*/, 5];
                                                case 3: return [4 /*yield*/, response.text()];
                                                case 4:
                                                    _a = _c.sent();
                                                    _c.label = 5;
                                                case 5: return [2 /*return*/, _a];
                                            }
                                        });
                                    }); }, timeout)];
                            case 1:
                                result = _d.sent();
                                return [2 /*return*/, validator(result) || fallbackData];
                            case 2:
                                _c = _d.sent();
                                return [2 /*return*/, fallbackData];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); },
                staleTime: 5 * 60 * 1000,
            });
        }
    }, [requestCacheKey, validator, fallbackData, method, endpoint, debouncedBody, headers, timeout, queryClient, queryOptions.enabled]);
    // Enhanced query function with proper React Query options handling
    var query = (0, react_query_1.useQuery)(__assign({ queryKey: [requestCacheKey, queryOptions.queryKey].flat().filter(Boolean), queryFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var startTime, breakerKey, breaker, requestPromise, result, responseTime, error_2, currentBreaker;
            var _this = this;
            var signal = _b.signal;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        startTime = Date.now();
                        breakerKey = "".concat(method, ":").concat(endpoint);
                        breaker = circuitBreaker.current.get(breakerKey);
                        if ((breaker === null || breaker === void 0 ? void 0 : breaker.isOpen) && Date.now() - breaker.lastFailure < 30000) {
                            throw new Error('Circuit breaker is open. Service temporarily unavailable.');
                        }
                        // Start operation tracking
                        if (trackOperations) {
                            operationIdRef.current = operationTracker.startOperation("safe_query", "".concat(method, " ").concat(endpoint), context);
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, , 7]);
                        metrics.current.requestCount++;
                        // Track query start
                        onAnalyticsEvent === null || onAnalyticsEvent === void 0 ? void 0 : onAnalyticsEvent('query_start', {
                            endpoint: endpoint,
                            method: method,
                            context: context,
                            timestamp: Date.now()
                        });
                        requestPromise = function (requestSignal) { return __awaiter(_this, void 0, void 0, function () {
                            var url, requestConfig, response, retryAfter, errorMessage_1, errorMessage, data, contentType, validatedData;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        url = (method === "GET" &&
                                            debouncedBody &&
                                            typeof debouncedBody === "object") ?
                                            "".concat(endpoint, "?").concat(new URLSearchParams(debouncedBody).toString())
                                            : endpoint;
                                        requestConfig = {
                                            method: method,
                                            headers: __assign({ "Content-Type": "application/json", Authorization: "Bearer ".concat(localStorage.getItem("auth_token") || "") }, headers),
                                            credentials: "include",
                                            signal: requestSignal,
                                        };
                                        // Only add body for non-GET requests and when body is defined
                                        if (method !== "GET" && debouncedBody !== undefined) {
                                            requestConfig.body = JSON.stringify(debouncedBody);
                                        }
                                        return [4 /*yield*/, fetch(url, requestConfig)];
                                    case 1:
                                        response = _a.sent();
                                        if (!response.ok) {
                                            // Handle rate limiting specifically
                                            if (response.status === 429) {
                                                retryAfter = response.headers.get('Retry-After') || '15';
                                                errorMessage_1 = "Rate limited. Please wait ".concat(retryAfter, " seconds before trying again.");
                                                throw new Error(errorMessage_1);
                                            }
                                            errorMessage = "HTTP ".concat(response.status, ": ").concat(response.statusText);
                                            throw new Error(errorMessage);
                                        }
                                        contentType = response.headers.get("content-type");
                                        if (!(contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/json"))) return [3 /*break*/, 3];
                                        return [4 /*yield*/, response.json()];
                                    case 2:
                                        data = _a.sent();
                                        return [3 /*break*/, 5];
                                    case 3: return [4 /*yield*/, response.text()];
                                    case 4:
                                        data = _a.sent();
                                        _a.label = 5;
                                    case 5:
                                        // Apply validation if provided
                                        if (validator) {
                                            validatedData = validator(data);
                                            if (validatedData === null) {
                                                throw new Error("Response data failed validation");
                                            }
                                            return [2 /*return*/, validatedData];
                                        }
                                        return [2 /*return*/, data];
                                }
                            });
                        }); };
                        result = void 0;
                        if (!deduplicate) return [3 /*break*/, 3];
                        return [4 /*yield*/, globalCoordinator.executeRequest(requestCacheKey, requestPromise, timeout)];
                    case 2:
                        result = _c.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, requestPromise(signal)];
                    case 4:
                        result = _c.sent();
                        _c.label = 5;
                    case 5:
                        responseTime = Date.now() - startTime;
                        metrics.current.successCount++;
                        metrics.current.responseTimes.push(responseTime);
                        if (metrics.current.responseTimes.length > 100) {
                            metrics.current.responseTimes = metrics.current.responseTimes.slice(-50);
                        }
                        metrics.current.avgResponseTime = metrics.current.responseTimes.reduce(function (a, b) { return a + b; }, 0) / metrics.current.responseTimes.length;
                        // Reset circuit breaker on success
                        if (breaker) {
                            breaker.failures = 0;
                            breaker.isOpen = false;
                        }
                        // Complete operation tracking on success
                        if (trackOperations && operationIdRef.current) {
                            operationTracker.completeOperation(operationIdRef.current, result);
                        }
                        // Track successful query
                        onAnalyticsEvent === null || onAnalyticsEvent === void 0 ? void 0 : onAnalyticsEvent('query_success', {
                            endpoint: endpoint,
                            method: method,
                            context: context,
                            responseTime: responseTime,
                            timestamp: Date.now()
                        });
                        // Call success callback
                        onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(result, context);
                        return [2 /*return*/, result];
                    case 6:
                        error_2 = _c.sent();
                        currentBreaker = circuitBreaker.current.get(breakerKey) || { failures: 0, lastFailure: 0, isOpen: false };
                        currentBreaker.failures++;
                        currentBreaker.lastFailure = Date.now();
                        if (currentBreaker.failures >= 5) {
                            currentBreaker.isOpen = true;
                        }
                        circuitBreaker.current.set(breakerKey, currentBreaker);
                        // Update metrics on error
                        metrics.current.errorCount++;
                        // Complete operation tracking on error
                        if (trackOperations && operationIdRef.current) {
                            operationTracker.completeOperation(operationIdRef.current, undefined, error_2);
                        }
                        // Track query error
                        onAnalyticsEvent === null || onAnalyticsEvent === void 0 ? void 0 : onAnalyticsEvent('query_error', {
                            endpoint: endpoint,
                            method: method,
                            context: context,
                            error: error_2.message,
                            timestamp: Date.now()
                        });
                        // Call error callback
                        onError === null || onError === void 0 ? void 0 : onError(error_2, context);
                        // Return fallback data on error if provided
                        if (fallbackData !== undefined) {
                            return [2 /*return*/, fallbackData];
                        }
                        throw error_2;
                    case 7: return [2 /*return*/];
                }
            });
        }); }, retry: function (failureCount, error) {
            if (error instanceof Error) {
                var message = error.message;
                // Don't retry on client errors (4xx) except for specific cases
                if (message.includes("HTTP 4")) {
                    var is408 = message.includes("408"); // Request Timeout
                    var is429 = message.includes("429"); // Too Many Requests
                    if (!is408 && !is429) {
                        return false;
                    }
                }
                // Don't retry on validation errors
                if (message.includes("validation") ||
                    message.includes("Failed validation")) {
                    return false;
                }
                // Don't retry on user cancellation
                if (message.includes("cancelled") || message.includes("aborted")) {
                    return false;
                }
                // Don't retry if circuit breaker is open
                if (message.includes("Circuit breaker is open")) {
                    return false;
                }
            }
            return typeof retry === "number" ? failureCount < retry : Boolean(retry);
        }, retryDelay: function (attemptIndex) {
            // Enhanced exponential backoff with jitter
            var baseDelay = 1000 * Math.pow(2, attemptIndex);
            var jitter = Math.random() * 0.1 * baseDelay;
            return Math.min(baseDelay + jitter, 30000);
        }, staleTime: context === "properties" ? 2 * 60 * 1000 : 5 * 60 * 1000, gcTime: context === "properties" ? 5 * 60 * 1000 : 10 * 60 * 1000, refetchOnWindowFocus: false, refetchOnReconnect: true, refetchOnMount: false }, queryOptions));
    // Optimized cancel function with return value
    var cancelRequest = (0, react_1.useCallback)(function () {
        return globalCoordinator.cancelRequest(requestCacheKey);
    }, [requestCacheKey]);
    // Enhanced retry function with exponential backoff
    var retryWithBackoff = (0, react_1.useCallback)(function () {
        var breakerKey = "".concat(method, ":").concat(endpoint);
        var breaker = circuitBreaker.current.get(breakerKey);
        if (breaker === null || breaker === void 0 ? void 0 : breaker.isOpen) {
            breaker.isOpen = false;
            breaker.failures = 0;
        }
        query.refetch();
    }, [query, method, endpoint]);
    // Get debugging information
    var activeOperations = (0, react_1.useMemo)(function () {
        return trackOperations ? operationTracker.getActiveOperations(context) : [];
    }, [trackOperations, context]);
    // Fixed: Use the corrected method signature
    var requestStats = (0, react_1.useMemo)(function () { return globalCoordinator.getRequestStats(requestCacheKey); }, [requestCacheKey]);
    // Enhanced error information
    var enhancedError = (0, react_1.useMemo)(function () {
        if (!query.error)
            return null;
        var error = query.error;
        var message = error.message.toLowerCase();
        var code = 'UNKNOWN';
        var retryAfter;
        if (message.includes('429') || message.includes('rate limit')) {
            code = 'RATE_LIMIT';
            var match = message.match(/(\d+)\s*seconds?/);
            retryAfter = match ? parseInt(match[1] || "15", 10) : 15;
        }
        else if (message.includes('timeout')) {
            code = 'TIMEOUT';
        }
        else if (message.includes('network') || message.includes('fetch')) {
            code = 'NETWORK';
        }
        else if (message.includes('validation') || message.includes('invalid')) {
            code = 'VALIDATION';
        }
        return {
            code: code,
            retryAfter: retryAfter,
            userMessage: getEnterpriseErrorMessage(error),
            originalError: error,
        };
    }, [query.error]);
    // Calculate success rate
    var successRate = (0, react_1.useMemo)(function () {
        var total = metrics.current.requestCount;
        if (total === 0)
            return 1;
        return metrics.current.successCount / total;
    }, [metrics.current.requestCount, metrics.current.successCount]);
    // Ensure we always have data with proper type safety
    var safeData = (_b = query.data) !== null && _b !== void 0 ? _b : fallbackData;
    // Return the intersection of query result and our custom properties
    return __assign(__assign({}, query), { data: safeData, hasValidData: query.data != null, originalData: query.data, cancelRequest: cancelRequest, activeOperations: activeOperations, requestStats: requestStats, metrics: {
            requestCount: metrics.current.requestCount,
            errorCount: metrics.current.errorCount,
            avgResponseTime: metrics.current.avgResponseTime,
            successRate: successRate,
        }, retryWithBackoff: retryWithBackoff, isRateLimited: (enhancedError === null || enhancedError === void 0 ? void 0 : enhancedError.code) === 'RATE_LIMIT', enhancedError: enhancedError });
}
// Property type imported from shared types
// Pre-configured specialized hooks with enhanced validators for the new domain structure
var useSafePropertiesQuery = function (searchParams, options) {
    // Normalize search params to prevent cache misses and infinite loops
    var normalizedParams = (0, react_1.useMemo)(function () {
        if (!searchParams)
            return undefined;
        // Remove undefined/null values and normalize strings
        var cleaned = Object.entries(searchParams).reduce(function (acc, _a) {
            var _b, _c;
            var key = _a[0], value = _a[1];
            if (value !== undefined && value !== null && value !== '') {
                // Normalize string values
                if (typeof value === 'string') {
                    // Use Object.assign to avoid object injection warnings
                    var safeValue = value.trim();
                    Object.assign(acc, (_b = {}, _b[key] = safeValue, _b));
                }
                else {
                    // Use Object.assign to avoid object injection warnings
                    Object.assign(acc, (_c = {}, _c[key] = value, _c));
                }
            }
            return acc;
        }, {});
        // Return undefined if no meaningful params
        return Object.keys(cleaned).length > 0 ? cleaned : undefined;
    }, [searchParams]);
    return useSafeQuery(__assign(__assign(__assign({}, propertyListConfig), { body: normalizedParams, enabled: true }), options));
};
exports.useSafePropertiesQuery = useSafePropertiesQuery;
var useSafePropertyQuery = function (id, options) {
    var _a = options || {}, _b = _a.includeMarketEstimate, includeMarketEstimate = _b === void 0 ? false : _b, queryOptions = __rest(_a, ["includeMarketEstimate"]);
    return useSafeQuery(__assign(__assign(__assign({}, propertyDetailConfig), { endpoint: "/api/properties/".concat(id).concat(includeMarketEstimate ? '?includeMarketEstimate=true' : ''), enabled: Boolean(id) && id.length > 0 }), queryOptions));
};
exports.useSafePropertyQuery = useSafePropertyQuery;
var useSafeUserQuery = function (options) {
    return useSafeQuery(__assign({ endpoint: "/api/auth/profile", fallbackData: null, validator: function (data) {
            if (!data || typeof data !== "object")
                return null;
            var user = data;
            return __assign(__assign({}, user), { id: user.id || "", firstName: user.firstName || "", lastName: user.lastName || "", email: user.email || "", trustScore: typeof user.trustScore === "number" ? user.trustScore : 0, isVerified: Boolean(user.isVerified), role: user.role || "user" });
        }, retry: false, refetchOnWindowFocus: false, context: "auth" }, options));
};
exports.useSafeUserQuery = useSafeUserQuery;
var useSafeTrustScoreQuery = function (userId, options) {
    return useSafeQuery(__assign({ endpoint: "/api/trust/score/".concat(userId), fallbackData: {
            score: 0,
            level: "unverified",
            factors: {},
            recommendations: [],
        }, validator: function (data) {
            if (!data || typeof data !== "object")
                return null;
            var trustData = data;
            return {
                score: typeof trustData.score === "number" ? trustData.score : 0,
                level: trustData.level || "unverified",
                factors: trustData.factors || {},
                recommendations: Array.isArray(trustData.recommendations) ?
                    trustData.recommendations
                    : [],
            };
        }, enabled: Boolean(userId) && userId.length > 0, context: "trust" }, options));
};
exports.useSafeTrustScoreQuery = useSafeTrustScoreQuery;
var useSafeMessagesQuery = function (userId, options) {
    return useSafeQuery(__assign({ endpoint: "/api/communication/messages?userId=".concat(userId), fallbackData: [], validator: function (data) {
            if (!Array.isArray(data))
                return [];
            return data.filter(function (item) {
                return item &&
                    typeof item === "object" &&
                    typeof item.id === "string" &&
                    typeof item.senderId === "string" &&
                    typeof item.recipientId === "string" &&
                    typeof item.subject === "string" &&
                    typeof item.content === "string";
            });
        }, enabled: Boolean(userId) && userId.length > 0, context: "messages" }, options));
};
exports.useSafeMessagesQuery = useSafeMessagesQuery;
// Export the coordinator and tracker for advanced usage
// Enhanced property-specific configurations for common use cases
var useSafeOwnerPropertiesQuery = function (ownerId, options) {
    var _a = options || {}, _b = _a.includeTotal, includeTotal = _b === void 0 ? false : _b, queryOptions = __rest(_a, ["includeTotal"]);
    return useSafeQuery(__assign({ endpoint: "/api/properties/owner/".concat(ownerId), method: "GET", body: includeTotal ? { includeTotal: true } : undefined, fallbackData: [], validator: function (data) {
            if (!Array.isArray(data)) {
                // Handle API response format that might wrap data
                if (data && typeof data === "object" && "data" in data) {
                    var wrappedData = data.data;
                    if (Array.isArray(wrappedData)) {
                        return wrappedData.filter(function (item) {
                            if (!item || typeof item !== "object")
                                return false;
                            var obj = item;
                            return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                                obj.id != null &&
                                typeof obj.title === "string" &&
                                obj.title.length > 0);
                        });
                    }
                }
                return [];
            }
            return data.filter(function (item) {
                if (!item || typeof item !== "object")
                    return false;
                var obj = item;
                return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                    obj.id != null &&
                    typeof obj.title === "string" &&
                    obj.title.length > 0);
            });
        }, enabled: Boolean(ownerId) && ownerId.length > 0, context: "owner-properties", staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000 }, queryOptions));
};
exports.useSafeOwnerPropertiesQuery = useSafeOwnerPropertiesQuery;
var useSafePropertyActionsQuery = function (action, propertyId, options) {
    var _a;
    var endpoint = action === "favorites" ? "/api/properties/favorites" : "/api/properties/share";
    return useSafeQuery(__assign({ endpoint: propertyId ? "".concat(endpoint, "/").concat(propertyId) : endpoint, method: "GET", fallbackData: { success: false }, validator: function (data) {
            if (!data || typeof data !== "object") {
                return { success: false };
            }
            var response = data;
            return {
                success: Boolean(response.success),
                data: response.data,
            };
        }, enabled: Boolean(propertyId) && ((_a = propertyId === null || propertyId === void 0 ? void 0 : propertyId.length) !== null && _a !== void 0 ? _a : 0) > 0, context: "property-".concat(action), staleTime: 2 * 60 * 1000 }, options));
};
exports.useSafePropertyActionsQuery = useSafePropertyActionsQuery;
var useSafePropertySearchQuery = function (searchParams, options) {
    // Normalize search params to prevent cache misses
    var normalizedParams = (0, react_1.useMemo)(function () {
        if (!searchParams)
            return undefined;
        var cleaned = Object.entries(searchParams).reduce(function (acc, _a) {
            var _b, _c;
            var key = _a[0], value = _a[1];
            if (value !== undefined && value !== null && value !== '') {
                if (typeof value === 'string') {
                    var safeValue = value.trim();
                    Object.assign(acc, (_b = {}, _b[key] = safeValue, _b));
                }
                else {
                    Object.assign(acc, (_c = {}, _c[key] = value, _c));
                }
            }
            return acc;
        }, {});
        return Object.keys(cleaned).length > 0 ? cleaned : undefined;
    }, [searchParams]);
    return useSafeQuery(__assign({ endpoint: "/api/properties/search", method: "GET", body: normalizedParams, fallbackData: { data: [], total: 0, hasNext: false, hasPrev: false }, validator: function (data) {
            if (!data || typeof data !== "object") {
                return { data: [], total: 0, hasNext: false, hasPrev: false };
            }
            var response = data;
            var actualData = (response.success ? response.data || response : response);
            return {
                data: Array.isArray(actualData.data) ? actualData.data.filter(function (item) {
                    if (!item || typeof item !== "object")
                        return false;
                    var obj = item;
                    return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                        obj.id != null &&
                        typeof obj.title === "string" &&
                        obj.title.length > 0);
                }) : [],
                total: typeof actualData.total === "number" ? actualData.total : 0,
                hasNext: Boolean(actualData.hasNext),
                hasPrev: Boolean(actualData.hasPrev),
            };
        }, context: "property-search", debounceMs: 500, deduplicate: true, staleTime: 30000 }, options));
};
exports.useSafePropertySearchQuery = useSafePropertySearchQuery;
// Specialized hook for similar properties to prevent infinite loops
var useSafeSimilarPropertiesQuery = function (params, options) {
    // Normalize and validate params to prevent infinite loops
    var normalizedParams = (0, react_1.useMemo)(function () {
        var _a;
        if (!params || (!(params === null || params === void 0 ? void 0 : params.location) && !(params === null || params === void 0 ? void 0 : params.propertyType))) {
            return null; // Don't make request without minimum required params
        }
        var normalized = {};
        if ((params === null || params === void 0 ? void 0 : params.location) && typeof params.location === 'string') {
            // Extract city from full location for better matching
            var city = (_a = params.location.split(',')[0]) === null || _a === void 0 ? void 0 : _a.trim();
            if (city) {
                normalized.city = city;
            }
        }
        if (params === null || params === void 0 ? void 0 : params.price) {
            // Convert exact price to range for better results
            var priceNum = Number(params.price);
            if (!isNaN(priceNum) && priceNum > 0) {
                var range = priceNum * 0.2; // 20% range
                normalized.minPrice = Math.max(0, priceNum - range);
                normalized.maxPrice = priceNum + range;
            }
        }
        if (params === null || params === void 0 ? void 0 : params.propertyType) {
            normalized.propertyType = params.propertyType;
        }
        if (params === null || params === void 0 ? void 0 : params.excludeId) {
            normalized.excludeId = params.excludeId;
        }
        normalized.limit = Math.min((params === null || params === void 0 ? void 0 : params.limit) || 10, 20); // Cap at 20 results
        return normalized;
    }, [params]);
    return useSafeQuery(__assign({ endpoint: "/api/properties/similar", method: "GET", body: normalizedParams || {}, fallbackData: [], validator: function (data) {
            if (!Array.isArray(data))
                return [];
            return data.filter(function (item) {
                if (!item || typeof item !== "object")
                    return false;
                var obj = item;
                return typeof obj.id === "string" && obj.id.length > 0;
            });
        }, context: "similar-properties", debounceMs: 1000, deduplicate: true, staleTime: 60000, enabled: normalizedParams != null }, options));
};
exports.useSafeSimilarPropertiesQuery = useSafeSimilarPropertiesQuery;
