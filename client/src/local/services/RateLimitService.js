"use strict";
/**
 * Rate Limiting Service
 * Client-side rate limiting and request throttling
 */
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
exports.rateLimitService = void 0;
var RateLimitService = /** @class */ (function () {
    function RateLimitService() {
        this.requestRecords = new Map();
        this.defaultConfig = {
            maxRequests: 100,
            windowMs: 60000 // 1 minute
        };
    }
    RateLimitService.getInstance = function () {
        if (!RateLimitService.instance) {
            RateLimitService.instance = new RateLimitService();
        }
        return RateLimitService.instance;
    };
    /**
     * Check if request is allowed under rate limit
     */
    RateLimitService.prototype.checkRateLimit = function (endpoint, config) {
        if (config === void 0) { config = {}; }
        var finalConfig = __assign(__assign({}, this.defaultConfig), config);
        var identifier = config.identifier || this.getClientIdentifier();
        var key = "".concat(identifier, ":").concat(endpoint);
        var now = Date.now();
        var windowStart = now - finalConfig.windowMs;
        // Get or create request record
        var record = this.requestRecords.get(key);
        if (!record) {
            record = { timestamps: [], blocked: false };
            this.requestRecords.set(key, record);
        }
        // Check if currently blocked
        if (record.blocked && record.blockedUntil && now < record.blockedUntil) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: record.blockedUntil,
                retryAfter: Math.ceil((record.blockedUntil - now) / 1000)
            };
        }
        // Clean old timestamps
        record.timestamps = record.timestamps.filter(function (timestamp) { return timestamp > windowStart; });
        // Check if limit exceeded
        if (record.timestamps.length >= finalConfig.maxRequests) {
            // Block for the remaining window time
            var oldestRequest = Math.min.apply(Math, record.timestamps);
            var blockedUntil = oldestRequest + finalConfig.windowMs;
            record.blocked = true;
            record.blockedUntil = blockedUntil;
            return {
                allowed: false,
                remaining: 0,
                resetTime: blockedUntil,
                retryAfter: Math.ceil((blockedUntil - now) / 1000)
            };
        }
        // Request is allowed
        record.timestamps.push(now);
        record.blocked = false;
        record.blockedUntil = undefined;
        return {
            allowed: true,
            remaining: finalConfig.maxRequests - record.timestamps.length,
            resetTime: windowStart + finalConfig.windowMs
        };
    };
    /**
     * Record a request attempt
     */
    RateLimitService.prototype.recordRequest = function (endpoint, identifier) {
        var key = "".concat(identifier || this.getClientIdentifier(), ":").concat(endpoint);
        var record = this.requestRecords.get(key);
        if (record) {
            record.timestamps.push(Date.now());
        }
    };
    /**
     * Get rate limit status without recording a request
     */
    RateLimitService.prototype.getRateLimitStatus = function (endpoint, config) {
        if (config === void 0) { config = {}; }
        var finalConfig = __assign(__assign({}, this.defaultConfig), config);
        var identifier = config.identifier || this.getClientIdentifier();
        var key = "".concat(identifier, ":").concat(endpoint);
        var now = Date.now();
        var windowStart = now - finalConfig.windowMs;
        var record = this.requestRecords.get(key);
        if (!record) {
            return {
                allowed: true,
                remaining: finalConfig.maxRequests,
                resetTime: now + finalConfig.windowMs
            };
        }
        // Check if currently blocked
        if (record.blocked && record.blockedUntil && now < record.blockedUntil) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: record.blockedUntil,
                retryAfter: Math.ceil((record.blockedUntil - now) / 1000)
            };
        }
        // Count recent requests
        var recentRequests = record.timestamps.filter(function (timestamp) { return timestamp > windowStart; });
        return {
            allowed: recentRequests.length < finalConfig.maxRequests,
            remaining: Math.max(0, finalConfig.maxRequests - recentRequests.length),
            resetTime: windowStart + finalConfig.windowMs
        };
    };
    /**
     * Clear rate limit for specific endpoint
     */
    RateLimitService.prototype.clearRateLimit = function (endpoint, identifier) {
        var key = "".concat(identifier || this.getClientIdentifier(), ":").concat(endpoint);
        this.requestRecords.delete(key);
    };
    /**
     * Clear all rate limits
     */
    RateLimitService.prototype.clearAllRateLimits = function () {
        this.requestRecords.clear();
    };
    /**
     * Get client identifier
     */
    RateLimitService.prototype.getClientIdentifier = function () {
        // Use a combination of factors to identify the client
        var factors = [
            navigator.userAgent,
            screen.width,
            screen.height,
            new Date().getTimezoneOffset()
        ];
        // Simple hash function
        var hash = 0;
        var str = factors.join('|');
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    };
    /**
     * Cleanup old records
     */
    RateLimitService.prototype.cleanup = function () {
        var now = Date.now();
        var maxAge = 24 * 60 * 60 * 1000; // 24 hours
        for (var _i = 0, _a = this.requestRecords.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], record = _b[1];
            // Remove records with no recent activity
            var hasRecentActivity = record.timestamps.some(function (timestamp) {
                return now - timestamp < maxAge;
            });
            if (!hasRecentActivity && (!record.blockedUntil || now > record.blockedUntil)) {
                this.requestRecords.delete(key);
            }
        }
    };
    /**
     * Get all rate limit statuses
     */
    RateLimitService.prototype.getAllRateLimitStatuses = function () {
        var statuses = new Map();
        for (var _i = 0, _a = this.requestRecords.entries(); _i < _a.length; _i++) {
            var key = _a[_i][0];
            var _b = key.split(':'), endpoint = _b[1];
            if (endpoint) {
                statuses.set(endpoint, this.getRateLimitStatus(endpoint));
            }
        }
        return statuses;
    };
    /**
     * Set default rate limit configuration
     */
    RateLimitService.prototype.setDefaultConfig = function (config) {
        this.defaultConfig = __assign(__assign({}, this.defaultConfig), config);
    };
    /**
     * Get default configuration
     */
    RateLimitService.prototype.getDefaultConfig = function () {
        return __assign({}, this.defaultConfig);
    };
    return RateLimitService;
}());
// Start cleanup interval
var rateLimitService = RateLimitService.getInstance();
exports.rateLimitService = rateLimitService;
// Cleanup old records every hour
setInterval(function () {
    rateLimitService.cleanup();
}, 60 * 60 * 1000);
exports.default = rateLimitService;
