"use strict";
/**
 * RequestManager - Centralized request coordination and cancellation
 *
 * This class provides coordinated request management to prevent race conditions
 * and ensure proper cleanup of API requests.
 */
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
exports.requestManager = exports.RequestManager = void 0;
var RequestManager = /** @class */ (function () {
    function RequestManager() {
        this.activeRequests = new Map();
        this.requestQueue = [];
        this.maxConcurrentRequests = 10;
        this.defaultTimeout = 30000; // 30 seconds
    }
    /**
     * Make a coordinated request with cancellation support
     */
    RequestManager.prototype.makeRequest = function (requestFn_1) {
        return __awaiter(this, arguments, void 0, function (requestFn, options) {
            var _a, key, _b, timeout, _c, cancelPrevious, externalSignal, _d, priority, retry, controller, combinedSignal, timeoutId, metadata, result, error_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _a = options.key, key = _a === void 0 ? this.generateRequestKey() : _a, _b = options.timeout, timeout = _b === void 0 ? this.defaultTimeout : _b, _c = options.cancelPrevious, cancelPrevious = _c === void 0 ? true : _c, externalSignal = options.signal, _d = options.priority, priority = _d === void 0 ? 'normal' : _d, retry = options.retry;
                        // Cancel previous request with same key if requested
                        if (cancelPrevious && this.activeRequests.has(key)) {
                            this.cancelRequest(key);
                        }
                        controller = new AbortController();
                        combinedSignal = this.combineSignals([controller.signal, externalSignal].filter(Boolean));
                        timeoutId = setTimeout(function () {
                            controller.abort(new Error("Request timeout after ".concat(timeout, "ms")));
                        }, timeout);
                        metadata = {
                            key: key,
                            startTime: Date.now(),
                            priority: priority,
                            controller: controller,
                            promise: this.executeRequest(requestFn, combinedSignal, retry),
                            retryCount: 0
                        };
                        this.activeRequests.set(key, metadata);
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, metadata.promise];
                    case 2:
                        result = _e.sent();
                        clearTimeout(timeoutId);
                        this.activeRequests.delete(key);
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _e.sent();
                        clearTimeout(timeoutId);
                        this.activeRequests.delete(key);
                        if (error_1 instanceof Error && error_1.name === 'AbortError') {
                            throw new Error("Request cancelled: ".concat(key));
                        }
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute request with retry logic
     */
    RequestManager.prototype.executeRequest = function (requestFn, signal, retryConfig) {
        return __awaiter(this, void 0, void 0, function () {
            var lastError, maxAttempts, attempt, error_2, baseDelay, delay;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        maxAttempts = (_a = retryConfig === null || retryConfig === void 0 ? void 0 : retryConfig.attempts) !== null && _a !== void 0 ? _a : 1;
                        attempt = 0;
                        _c.label = 1;
                    case 1:
                        if (!(attempt < maxAttempts)) return [3 /*break*/, 7];
                        if (signal.aborted) {
                            throw new Error('Request aborted');
                        }
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, requestFn(signal)];
                    case 3: return [2 /*return*/, _c.sent()];
                    case 4:
                        error_2 = _c.sent();
                        lastError = error_2 instanceof Error ? error_2 : new Error(String(error_2));
                        // Don't retry if request was aborted or on last attempt
                        if (signal.aborted || attempt === maxAttempts - 1) {
                            return [3 /*break*/, 7];
                        }
                        baseDelay = (_b = retryConfig === null || retryConfig === void 0 ? void 0 : retryConfig.delay) !== null && _b !== void 0 ? _b : 1000;
                        delay = (retryConfig === null || retryConfig === void 0 ? void 0 : retryConfig.backoff) === 'exponential'
                            ? baseDelay * Math.pow(2, attempt)
                            : baseDelay * (attempt + 1);
                        return [4 /*yield*/, this.delay(delay)];
                    case 5:
                        _c.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 7: throw lastError;
                }
            });
        });
    };
    /**
     * Cancel a specific request by key
     */
    RequestManager.prototype.cancelRequest = function (key) {
        var request = this.activeRequests.get(key);
        if (request) {
            request.controller.abort(new Error("Request cancelled: ".concat(key)));
            this.activeRequests.delete(key);
            return true;
        }
        return false;
    };
    /**
     * Cancel all active requests
     */
    RequestManager.prototype.cancelAllRequests = function () {
        for (var _i = 0, _a = Array.from(this.activeRequests); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], request = _b[1];
            request.controller.abort(new Error('All requests cancelled'));
        }
        this.activeRequests.clear();
    };
    /**
     * Cancel requests by pattern
     */
    RequestManager.prototype.cancelRequestsByPattern = function (pattern) {
        var cancelled = 0;
        for (var _i = 0, _a = Array.from(this.activeRequests); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], request = _b[1];
            if (pattern.test(key)) {
                request.controller.abort(new Error("Request cancelled by pattern: ".concat(key)));
                this.activeRequests.delete(key);
                cancelled++;
            }
        }
        return cancelled;
    };
    /**
     * Get active request information
     */
    RequestManager.prototype.getActiveRequests = function () {
        var now = Date.now();
        return Array.from(this.activeRequests.entries()).map(function (_a) {
            var key = _a[0], metadata = _a[1];
            return ({
                key: key,
                duration: now - metadata.startTime,
                priority: metadata.priority
            });
        });
    };
    /**
     * Check if a request is active
     */
    RequestManager.prototype.isRequestActive = function (key) {
        return this.activeRequests.has(key);
    };
    /**
     * Get request statistics
     */
    RequestManager.prototype.getStats = function () {
        var active = this.activeRequests.size;
        var now = Date.now();
        var durations = Array.from(this.activeRequests.values())
            .map(function (req) { return now - req.startTime; });
        return {
            activeRequests: active,
            totalRequests: active, // This would be tracked over time in a real implementation
            averageDuration: durations.length > 0
                ? durations.reduce(function (sum, d) { return sum + d; }, 0) / durations.length
                : 0
        };
    };
    /**
     * Combine multiple abort signals into one
     */
    RequestManager.prototype.combineSignals = function (signals) {
        if (signals.length === 0) {
            return new AbortController().signal;
        }
        if (signals.length === 1) {
            return signals[0];
        }
        var controller = new AbortController();
        var onAbort = function () {
            controller.abort();
        };
        signals.forEach(function (signal) {
            if (signal.aborted) {
                controller.abort();
            }
            else {
                signal.addEventListener('abort', onAbort, { once: true });
            }
        });
        return controller.signal;
    };
    /**
     * Generate a unique request key
     */
    RequestManager.prototype.generateRequestKey = function () {
        return "req_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    /**
     * Utility delay function
     */
    RequestManager.prototype.delay = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    /**
     * Clean up resources
     */
    RequestManager.prototype.dispose = function () {
        this.cancelAllRequests();
    };
    return RequestManager;
}());
exports.RequestManager = RequestManager;
// Singleton instance for global use
exports.requestManager = new RequestManager();
// Types are already exported above as interfaces
