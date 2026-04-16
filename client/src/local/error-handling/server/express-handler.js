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
exports.asyncHandler = exports.requestTimeoutHandler = exports.notFoundHandler = exports.errorHandler = exports.correlationIdMiddleware = void 0;
var error_factory_1 = require("../utilities/error-factory");
var error_utils_1 = require("../utilities/error-utils");
var error_utils_2 = require("../utilities/error-utils");
var correlationIdMiddleware = function (req, res, next) {
    var id = req.headers['x-correlation-id'] || (0, error_utils_1.generateCorrelationId)();
    req.correlationId = id;
    res.setHeader('X-Correlation-ID', id);
    next();
};
exports.correlationIdMiddleware = correlationIdMiddleware;
var errorHandler = function (err, req, res, _next) {
    var _a;
    var appErr = error_factory_1.ErrorFactory.fromUnknown(err, req.correlationId);
    var log = __assign({ timestamp: new Date().toISOString(), correlationId: req.correlationId, method: req.method, url: req.originalUrl, userAgent: req.headers['user-agent'], userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, error: appErr.toJSON() }, (req.method !== 'GET' && { body: (0, error_utils_1.redactSensitiveData)(req.body) }));
    if ((0, error_utils_2.shouldAlert)(appErr)) {
        console.error('🚨 Application Error:', log);
    }
    else {
        console.warn('⚠️ Application Warning:', log);
    }
    if (res.headersSent)
        return;
    res.status(appErr.statusCode).json(appErr.toJSON());
};
exports.errorHandler = errorHandler;
var notFoundHandler = function (req, res) {
    res.status(404).json({
        success: false,
        error: "Route ".concat(req.method, " ").concat(req.path, " not found")
    });
};
exports.notFoundHandler = notFoundHandler;
var requestTimeoutHandler = function (ms) {
    if (ms === void 0) { ms = 30000; }
    return function (req, res, next) {
        var t = setTimeout(function () {
            if (!res.headersSent) {
                res.status(408).json({ success: false, error: 'Request timeout' });
            }
        }, ms);
        res.on('finish', function () { return clearTimeout(t); });
        res.on('close', function () { return clearTimeout(t); });
        next();
    };
};
exports.requestTimeoutHandler = requestTimeoutHandler;
var asyncHandler = function (fn) { return function (req, res, next) {
    return Promise.resolve(fn(req, res, next)).catch(next);
}; };
exports.asyncHandler = asyncHandler;
