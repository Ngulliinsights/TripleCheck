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
exports.errorMetrics = exports.ErrorMetricsCollector = void 0;
var ErrorMetricsCollector = /** @class */ (function () {
    function ErrorMetricsCollector() {
        this.metrics = new Map();
    }
    ErrorMetricsCollector.prototype.record = function (error, responseTime) {
        var key = "".concat(error.category, ":").concat(error.code);
        var existing = this.metrics.get(key);
        if (existing) {
            existing.count += 1;
            existing.lastOccurred = new Date();
            if (responseTime && existing.avgResponseTime) {
                existing.avgResponseTime = (existing.avgResponseTime + responseTime) / 2;
            }
        }
        else {
            this.metrics.set(key, __assign({ count: 1, category: error.category, severity: error.severity, lastOccurred: new Date() }, (responseTime !== undefined && { avgResponseTime: responseTime })));
        }
    };
    ErrorMetricsCollector.prototype.getMetrics = function () {
        return Object.fromEntries(this.metrics);
    };
    ErrorMetricsCollector.prototype.clear = function () {
        this.metrics.clear();
    };
    return ErrorMetricsCollector;
}());
exports.ErrorMetricsCollector = ErrorMetricsCollector;
exports.errorMetrics = new ErrorMetricsCollector();
