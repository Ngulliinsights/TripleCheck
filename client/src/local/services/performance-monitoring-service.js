"use strict";
/**
 * Performance Monitoring Service
 *
 * Provides comprehensive performance monitoring, optimization recommendations,
 * and real-time performance analytics for the African Property Trust platform.
 *
 * Features:
 * - Core Web Vitals monitoring (LCP, FID, CLS)
 * - Resource timing and network performance
 * - Component render performance tracking
 * - Memory usage monitoring and leak detection
 * - Bundle size analysis and optimization suggestions
 * - Real-time performance alerts and recommendations
 */
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
exports.performanceMonitor = exports.performanceMonitoringService = exports.PerformanceMonitoringService = exports.MemoryMonitor = exports.ResourcePerformanceMonitor = exports.CoreWebVitalsMonitor = exports.PerformanceRating = exports.MetricType = void 0;
var events_1 = require("events");
var audit_trail_service_1 = require("./audit-trail-service");
var MetricType;
(function (MetricType) {
    MetricType["CORE_WEB_VITAL"] = "CORE_WEB_VITAL";
    MetricType["RESOURCE_TIMING"] = "RESOURCE_TIMING";
    MetricType["COMPONENT_RENDER"] = "COMPONENT_RENDER";
    MetricType["MEMORY_USAGE"] = "MEMORY_USAGE";
    MetricType["NETWORK_REQUEST"] = "NETWORK_REQUEST";
    MetricType["USER_INTERACTION"] = "USER_INTERACTION";
    MetricType["BUNDLE_SIZE"] = "BUNDLE_SIZE";
    MetricType["CUSTOM"] = "CUSTOM";
})(MetricType || (exports.MetricType = MetricType = {}));
var PerformanceRating;
(function (PerformanceRating) {
    PerformanceRating["GOOD"] = "GOOD";
    PerformanceRating["NEEDS_IMPROVEMENT"] = "NEEDS_IMPROVEMENT";
    PerformanceRating["POOR"] = "POOR";
})(PerformanceRating || (exports.PerformanceRating = PerformanceRating = {}));
// Core Web Vitals Monitor
var CoreWebVitalsMonitor = /** @class */ (function () {
    function CoreWebVitalsMonitor(onMetric) {
        this.onMetric = onMetric;
        this.vitals = new Map();
        this.observers = [];
        this.initializeObservers();
    }
    CoreWebVitalsMonitor.prototype.initializeObservers = function () {
        if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
            return;
        }
        // Largest Contentful Paint (LCP)
        this.observeLCP();
        // First Input Delay (FID)
        this.observeFID();
        // Cumulative Layout Shift (CLS)
        this.observeCLS();
        // First Contentful Paint (FCP)
        this.observeFCP();
        // Time to First Byte (TTFB)
        this.observeTTFB();
    };
    CoreWebVitalsMonitor.prototype.observeLCP = function () {
        var _this = this;
        try {
            var observer = new PerformanceObserver(function (list) {
                var entries = list.getEntries();
                var lastEntry = entries[entries.length - 1];
                if (lastEntry) {
                    var lcp = lastEntry.startTime;
                    _this.vitals.set('lcp', lcp);
                    _this.onMetric({
                        id: "lcp_".concat(Date.now()),
                        timestamp: new Date(),
                        type: MetricType.CORE_WEB_VITAL,
                        name: 'Largest Contentful Paint',
                        value: lcp,
                        unit: 'ms',
                        context: _this.getContext(),
                        threshold: { good: 2500, needsImprovement: 4000, poor: Infinity },
                        rating: _this.rateMetric(lcp, { good: 2500, needsImprovement: 4000, poor: Infinity })
                    });
                }
            });
            observer.observe({ type: 'largest-contentful-paint', buffered: true });
            this.observers.push(observer);
        }
        catch (error) {
            console.warn('LCP observation not supported:', error);
        }
    };
    CoreWebVitalsMonitor.prototype.observeFID = function () {
        var _this = this;
        try {
            var observer = new PerformanceObserver(function (list) {
                var entries = list.getEntries();
                for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                    var entry = entries_1[_i];
                    var fid = entry.processingStart - entry.startTime;
                    _this.vitals.set('fid', fid);
                    _this.onMetric({
                        id: "fid_".concat(Date.now()),
                        timestamp: new Date(),
                        type: MetricType.CORE_WEB_VITAL,
                        name: 'First Input Delay',
                        value: fid,
                        unit: 'ms',
                        context: _this.getContext(),
                        threshold: { good: 100, needsImprovement: 300, poor: Infinity },
                        rating: _this.rateMetric(fid, { good: 100, needsImprovement: 300, poor: Infinity })
                    });
                }
            });
            observer.observe({ type: 'first-input', buffered: true });
            this.observers.push(observer);
        }
        catch (error) {
            console.warn('FID observation not supported:', error);
        }
    };
    CoreWebVitalsMonitor.prototype.observeCLS = function () {
        var _this = this;
        try {
            var clsValue_1 = 0;
            var observer = new PerformanceObserver(function (list) {
                var entries = list.getEntries();
                for (var _i = 0, entries_2 = entries; _i < entries_2.length; _i++) {
                    var entry = entries_2[_i];
                    if (!entry.hadRecentInput) {
                        clsValue_1 += entry.value;
                    }
                }
                _this.vitals.set('cls', clsValue_1);
                _this.onMetric({
                    id: "cls_".concat(Date.now()),
                    timestamp: new Date(),
                    type: MetricType.CORE_WEB_VITAL,
                    name: 'Cumulative Layout Shift',
                    value: clsValue_1,
                    unit: 'score',
                    context: _this.getContext(),
                    threshold: { good: 0.1, needsImprovement: 0.25, poor: Infinity },
                    rating: _this.rateMetric(clsValue_1, { good: 0.1, needsImprovement: 0.25, poor: Infinity })
                });
            });
            observer.observe({ type: 'layout-shift', buffered: true });
            this.observers.push(observer);
        }
        catch (error) {
            console.warn('CLS observation not supported:', error);
        }
    };
    CoreWebVitalsMonitor.prototype.observeFCP = function () {
        var _this = this;
        try {
            var observer = new PerformanceObserver(function (list) {
                var entries = list.getEntries();
                for (var _i = 0, entries_3 = entries; _i < entries_3.length; _i++) {
                    var entry = entries_3[_i];
                    if (entry.name === 'first-contentful-paint') {
                        var fcp = entry.startTime;
                        _this.vitals.set('fcp', fcp);
                        _this.onMetric({
                            id: "fcp_".concat(Date.now()),
                            timestamp: new Date(),
                            type: MetricType.CORE_WEB_VITAL,
                            name: 'First Contentful Paint',
                            value: fcp,
                            unit: 'ms',
                            context: _this.getContext(),
                            threshold: { good: 1800, needsImprovement: 3000, poor: Infinity },
                            rating: _this.rateMetric(fcp, { good: 1800, needsImprovement: 3000, poor: Infinity })
                        });
                    }
                }
            });
            observer.observe({ type: 'paint', buffered: true });
            this.observers.push(observer);
        }
        catch (error) {
            console.warn('FCP observation not supported:', error);
        }
    };
    CoreWebVitalsMonitor.prototype.observeTTFB = function () {
        var _this = this;
        try {
            var observer = new PerformanceObserver(function (list) {
                var entries = list.getEntries();
                for (var _i = 0, entries_4 = entries; _i < entries_4.length; _i++) {
                    var entry = entries_4[_i];
                    if (entry.entryType === 'navigation') {
                        var navEntry = entry;
                        var ttfb = navEntry.responseStart - navEntry.requestStart;
                        _this.vitals.set('ttfb', ttfb);
                        _this.onMetric({
                            id: "ttfb_".concat(Date.now()),
                            timestamp: new Date(),
                            type: MetricType.CORE_WEB_VITAL,
                            name: 'Time to First Byte',
                            value: ttfb,
                            unit: 'ms',
                            context: _this.getContext(),
                            threshold: { good: 800, needsImprovement: 1800, poor: Infinity },
                            rating: _this.rateMetric(ttfb, { good: 800, needsImprovement: 1800, poor: Infinity })
                        });
                    }
                }
            });
            observer.observe({ type: 'navigation', buffered: true });
            this.observers.push(observer);
        }
        catch (error) {
            console.warn('TTFB observation not supported:', error);
        }
    };
    CoreWebVitalsMonitor.prototype.rateMetric = function (value, threshold) {
        if (value <= threshold.good)
            return PerformanceRating.GOOD;
        if (value <= threshold.needsImprovement)
            return PerformanceRating.NEEDS_IMPROVEMENT;
        return PerformanceRating.POOR;
    };
    CoreWebVitalsMonitor.prototype.getContext = function () {
        return {
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            viewport: typeof window !== 'undefined' ? {
                width: window.innerWidth,
                height: window.innerHeight
            } : undefined,
            deviceType: this.getDeviceType(),
            connectionType: this.getConnectionType()
        };
    };
    CoreWebVitalsMonitor.prototype.getDeviceType = function () {
        if (typeof window === 'undefined')
            return 'unknown';
        var width = window.innerWidth;
        if (width < 768)
            return 'mobile';
        if (width < 1024)
            return 'tablet';
        return 'desktop';
    };
    CoreWebVitalsMonitor.prototype.getConnectionType = function () {
        if (typeof navigator !== 'undefined' && 'connection' in navigator) {
            var connection = navigator.connection;
            return (connection === null || connection === void 0 ? void 0 : connection.effectiveType) || 'unknown';
        }
        return 'unknown';
    };
    CoreWebVitalsMonitor.prototype.getVitals = function () {
        return {
            lcp: this.vitals.get('lcp'),
            fid: this.vitals.get('fid'),
            cls: this.vitals.get('cls'),
            fcp: this.vitals.get('fcp'),
            ttfb: this.vitals.get('ttfb')
        };
    };
    CoreWebVitalsMonitor.prototype.destroy = function () {
        this.observers.forEach(function (observer) { return observer.disconnect(); });
        this.observers = [];
    };
    return CoreWebVitalsMonitor;
}());
exports.CoreWebVitalsMonitor = CoreWebVitalsMonitor;
// Resource Performance Monitor
var ResourcePerformanceMonitor = /** @class */ (function () {
    function ResourcePerformanceMonitor(onMetric) {
        this.onMetric = onMetric;
        this.resourceTimings = [];
        this.initializeObserver();
    }
    ResourcePerformanceMonitor.prototype.initializeObserver = function () {
        var _this = this;
        if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
            return;
        }
        try {
            var observer = new PerformanceObserver(function (list) {
                var entries = list.getEntries();
                for (var _i = 0, entries_5 = entries; _i < entries_5.length; _i++) {
                    var entry = entries_5[_i];
                    if (entry.entryType === 'resource') {
                        _this.processResourceEntry(entry);
                    }
                }
            });
            observer.observe({ type: 'resource', buffered: true });
        }
        catch (error) {
            console.warn('Resource timing observation not supported:', error);
        }
    };
    ResourcePerformanceMonitor.prototype.processResourceEntry = function (entry) {
        var resourceTiming = {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize || 0,
            type: this.getResourceType(entry.name),
            startTime: entry.startTime,
            endTime: entry.startTime + entry.duration,
            transferSize: entry.transferSize || 0,
            encodedBodySize: entry.encodedBodySize || 0,
            decodedBodySize: entry.decodedBodySize || 0
        };
        this.resourceTimings.push(resourceTiming);
        // Emit metric for slow resources
        if (entry.duration > 1000) { // Resources taking more than 1 second
            this.onMetric({
                id: "resource_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
                timestamp: new Date(),
                type: MetricType.RESOURCE_TIMING,
                name: "Slow Resource: ".concat(this.getResourceName(entry.name)),
                value: entry.duration,
                unit: 'ms',
                context: {
                    url: entry.name,
                    additionalData: {
                        resourceType: resourceTiming.type,
                        size: resourceTiming.size
                    }
                },
                threshold: { good: 500, needsImprovement: 1000, poor: Infinity },
                rating: entry.duration > 2000 ? PerformanceRating.POOR :
                    entry.duration > 1000 ? PerformanceRating.NEEDS_IMPROVEMENT :
                        PerformanceRating.GOOD
            });
        }
    };
    ResourcePerformanceMonitor.prototype.getResourceType = function (url) {
        if (url.includes('.js'))
            return 'script';
        if (url.includes('.css'))
            return 'stylesheet';
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i))
            return 'image';
        if (url.includes('.woff') || url.includes('.ttf'))
            return 'font';
        if (url.includes('/api/'))
            return 'api';
        return 'other';
    };
    ResourcePerformanceMonitor.prototype.getResourceName = function (url) {
        try {
            var urlObj = new URL(url);
            return urlObj.pathname.split('/').pop() || url;
        }
        catch (_a) {
            return url;
        }
    };
    ResourcePerformanceMonitor.prototype.getResourceTimings = function () {
        return __spreadArray([], this.resourceTimings, true);
    };
    ResourcePerformanceMonitor.prototype.getSlowResources = function (threshold) {
        if (threshold === void 0) { threshold = 1000; }
        return this.resourceTimings.filter(function (r) { return r.duration > threshold; });
    };
    ResourcePerformanceMonitor.prototype.getLargeResources = function (threshold) {
        if (threshold === void 0) { threshold = 100000; }
        return this.resourceTimings.filter(function (r) { return r.size > threshold; });
    };
    return ResourcePerformanceMonitor;
}());
exports.ResourcePerformanceMonitor = ResourcePerformanceMonitor;
// Memory Monitor
var MemoryMonitor = /** @class */ (function () {
    function MemoryMonitor(onMetric) {
        this.onMetric = onMetric;
        this.memoryUsage = [];
        this.startMonitoring();
    }
    MemoryMonitor.prototype.startMonitoring = function () {
        var _this = this;
        if (typeof window === 'undefined' || !('performance' in window) || !window.performance.memory) {
            return;
        }
        this.monitoringInterval = setInterval(function () {
            _this.collectMemoryUsage();
        }, 30000); // Every 30 seconds
        // Initial collection
        this.collectMemoryUsage();
    };
    MemoryMonitor.prototype.collectMemoryUsage = function () {
        if (typeof window === 'undefined' || !window.performance.memory) {
            return;
        }
        var memory = window.performance.memory;
        var usage = {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            timestamp: new Date()
        };
        this.memoryUsage.push(usage);
        // Keep only last 100 measurements
        if (this.memoryUsage.length > 100) {
            this.memoryUsage = this.memoryUsage.slice(-100);
        }
        // Check for memory issues
        var memoryUtilization = usage.usedJSHeapSize / usage.jsHeapSizeLimit;
        if (memoryUtilization > 0.8) { // 80% memory usage
            this.onMetric({
                id: "memory_".concat(Date.now()),
                timestamp: new Date(),
                type: MetricType.MEMORY_USAGE,
                name: 'High Memory Usage',
                value: memoryUtilization * 100,
                unit: '%',
                context: {
                    additionalData: {
                        usedJSHeapSize: usage.usedJSHeapSize,
                        totalJSHeapSize: usage.totalJSHeapSize,
                        jsHeapSizeLimit: usage.jsHeapSizeLimit
                    }
                },
                threshold: { good: 60, needsImprovement: 80, poor: Infinity },
                rating: memoryUtilization > 0.9 ? PerformanceRating.POOR : PerformanceRating.NEEDS_IMPROVEMENT
            });
        }
        // Detect potential memory leaks
        if (this.memoryUsage.length >= 10) {
            var recentUsage = this.memoryUsage.slice(-10);
            var trend = this.calculateMemoryTrend(recentUsage);
            if (trend > 1000000) { // 1MB increase trend
                this.onMetric({
                    id: "memory_leak_".concat(Date.now()),
                    timestamp: new Date(),
                    type: MetricType.MEMORY_USAGE,
                    name: 'Potential Memory Leak',
                    value: trend,
                    unit: 'bytes/measurement',
                    context: {
                        additionalData: {
                            trendOverMeasurements: 10,
                            currentUsage: usage.usedJSHeapSize
                        }
                    },
                    rating: PerformanceRating.POOR
                });
            }
        }
    };
    MemoryMonitor.prototype.calculateMemoryTrend = function (usage) {
        if (usage.length < 2)
            return 0;
        var first = usage[0].usedJSHeapSize;
        var last = usage[usage.length - 1].usedJSHeapSize;
        return (last - first) / usage.length;
    };
    MemoryMonitor.prototype.getMemoryUsage = function () {
        return __spreadArray([], this.memoryUsage, true);
    };
    MemoryMonitor.prototype.getCurrentMemoryUsage = function () {
        return this.memoryUsage.length > 0 ? this.memoryUsage[this.memoryUsage.length - 1] : null;
    };
    MemoryMonitor.prototype.destroy = function () {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
    };
    return MemoryMonitor;
}());
exports.MemoryMonitor = MemoryMonitor;
// Main Performance Monitoring Service
var PerformanceMonitoringService = /** @class */ (function (_super) {
    __extends(PerformanceMonitoringService, _super);
    function PerformanceMonitoringService() {
        var _this = _super.call(this) || this;
        _this.metrics = [];
        _this.alerts = [];
        _this.maxMetrics = 10000;
        _this.coreWebVitalsMonitor = new CoreWebVitalsMonitor(_this.handleMetric.bind(_this));
        _this.resourceMonitor = new ResourcePerformanceMonitor(_this.handleMetric.bind(_this));
        _this.memoryMonitor = new MemoryMonitor(_this.handleMetric.bind(_this));
        // Set up periodic cleanup
        setInterval(function () { return _this.cleanup(); }, 300000); // Every 5 minutes
        return _this;
    }
    PerformanceMonitoringService.prototype.handleMetric = function (metric) {
        var _a;
        this.metrics.push(metric);
        this.emit('metric', metric);
        // Check for performance alerts
        if (metric.rating === PerformanceRating.POOR) {
            this.createAlert(metric);
        }
        // Log significant performance issues to audit trail
        if (metric.rating === PerformanceRating.POOR ||
            (metric.type === MetricType.CORE_WEB_VITAL && metric.value > (((_a = metric.threshold) === null || _a === void 0 ? void 0 : _a.needsImprovement) || 0))) {
            this.logPerformanceIssue(metric);
        }
    };
    PerformanceMonitoringService.prototype.createAlert = function (metric) {
        var _a;
        var alert = {
            id: "alert_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
            timestamp: new Date(),
            severity: this.determineSeverity(metric),
            metric: metric.name,
            value: metric.value,
            threshold: ((_a = metric.threshold) === null || _a === void 0 ? void 0 : _a.needsImprovement) || 0,
            message: this.generateAlertMessage(metric),
            recommendations: this.generateRecommendations(metric),
            context: metric.context
        };
        this.alerts.push(alert);
        this.emit('alert', alert);
    };
    PerformanceMonitoringService.prototype.determineSeverity = function (metric) {
        if (metric.type === MetricType.CORE_WEB_VITAL) {
            if (metric.name.includes('Layout Shift') && metric.value > 0.25)
                return 'high';
            if (metric.name.includes('Input Delay') && metric.value > 300)
                return 'high';
            if (metric.name.includes('Contentful Paint') && metric.value > 4000)
                return 'high';
            return 'medium';
        }
        if (metric.type === MetricType.MEMORY_USAGE) {
            if (metric.name.includes('Memory Leak'))
                return 'critical';
            if (metric.value > 90)
                return 'high';
            return 'medium';
        }
        return 'low';
    };
    PerformanceMonitoringService.prototype.generateAlertMessage = function (metric) {
        switch (metric.type) {
            case MetricType.CORE_WEB_VITAL:
                return "".concat(metric.name, " is ").concat(metric.value).concat(metric.unit, ", which exceeds the recommended threshold");
            case MetricType.MEMORY_USAGE:
                return "Memory usage is at ".concat(metric.value).concat(metric.unit, ", indicating potential performance issues");
            case MetricType.RESOURCE_TIMING:
                return "Resource loading time of ".concat(metric.value).concat(metric.unit, " is slower than expected");
            default:
                return "Performance metric ".concat(metric.name, " is performing poorly");
        }
    };
    PerformanceMonitoringService.prototype.generateRecommendations = function (metric) {
        var recommendations = [];
        switch (metric.name) {
            case 'Largest Contentful Paint':
                recommendations.push('Optimize images and use modern formats (WebP, AVIF)');
                recommendations.push('Implement lazy loading for below-the-fold content');
                recommendations.push('Use a Content Delivery Network (CDN)');
                break;
            case 'First Input Delay':
                recommendations.push('Reduce JavaScript execution time');
                recommendations.push('Split large bundles and load code on demand');
                recommendations.push('Use web workers for heavy computations');
                break;
            case 'Cumulative Layout Shift':
                recommendations.push('Set explicit dimensions for images and videos');
                recommendations.push('Avoid inserting content above existing content');
                recommendations.push('Use CSS transforms instead of changing layout properties');
                break;
            case 'High Memory Usage':
                recommendations.push('Check for memory leaks in event listeners');
                recommendations.push('Properly clean up component subscriptions');
                recommendations.push('Optimize large data structures and caching');
                break;
            default:
                recommendations.push('Monitor performance metrics regularly');
                recommendations.push('Consider code splitting and lazy loading');
        }
        return recommendations;
    };
    PerformanceMonitoringService.prototype.logPerformanceIssue = function (metric) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, audit_trail_service_1.auditTrailService.logEvent(audit_trail_service_1.AuditEventType.PERFORMANCE_ISSUE, 'performance_degradation', {
                                metricName: metric.name,
                                metricValue: metric.value,
                                metricUnit: metric.unit,
                                rating: metric.rating,
                                component: metric.context.component,
                                url: metric.context.url
                            }, {
                                userId: metric.context.userId,
                                sessionId: metric.context.sessionId,
                                roles: [],
                                permissions: [],
                                isAuthenticated: !!metric.context.userId
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Failed to log performance issue to audit trail:', error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Record a custom performance metric
     */
    PerformanceMonitoringService.prototype.recordMetric = function (name, value, unit, context) {
        var metric = {
            id: "custom_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
            timestamp: new Date(),
            type: MetricType.CUSTOM,
            name: name,
            value: value,
            unit: unit,
            context: __assign({}, context),
            rating: PerformanceRating.GOOD // Default for custom metrics
        };
        this.handleMetric(metric);
    };
    /**
     * Record component render performance
     */
    PerformanceMonitoringService.prototype.recordComponentPerformance = function (componentPerf) {
        var metric = {
            id: "component_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
            timestamp: new Date(),
            type: MetricType.COMPONENT_RENDER,
            name: "Component Render: ".concat(componentPerf.componentName),
            value: componentPerf.renderTime,
            unit: 'ms',
            context: {
                component: componentPerf.componentName,
                additionalData: {
                    mountTime: componentPerf.mountTime,
                    updateCount: componentPerf.updateCount,
                    propsSize: componentPerf.propsSize,
                    stateSize: componentPerf.stateSize,
                    childrenCount: componentPerf.childrenCount
                }
            },
            threshold: { good: 16, needsImprovement: 50, poor: Infinity }, // 60fps = 16ms per frame
            rating: componentPerf.renderTime > 50 ? PerformanceRating.POOR :
                componentPerf.renderTime > 16 ? PerformanceRating.NEEDS_IMPROVEMENT :
                    PerformanceRating.GOOD
        };
        this.handleMetric(metric);
    };
    /**
     * Get performance report for a specific time range
     */
    PerformanceMonitoringService.prototype.getPerformanceReport = function (timeRange) {
        var metrics = this.metrics;
        var alerts = this.alerts;
        if (timeRange) {
            metrics = metrics.filter(function (m) {
                return m.timestamp >= timeRange.start && m.timestamp <= timeRange.end;
            });
            alerts = alerts.filter(function (a) {
                return a.timestamp >= timeRange.start && a.timestamp <= timeRange.end;
            });
        }
        var coreWebVitals = this.coreWebVitalsMonitor.getVitals();
        var resourceTimings = this.resourceMonitor.getResourceTimings();
        var memoryUsage = this.memoryMonitor.getMemoryUsage();
        // Calculate summary
        var renderMetrics = metrics.filter(function (m) { return m.type === MetricType.COMPONENT_RENDER; });
        var loadMetrics = metrics.filter(function (m) { return m.type === MetricType.CORE_WEB_VITAL; });
        var averageRenderTime = renderMetrics.length > 0
            ? renderMetrics.reduce(function (sum, m) { return sum + m.value; }, 0) / renderMetrics.length
            : 0;
        var averagePageLoadTime = coreWebVitals.lcp || 0;
        var memoryLeakDetected = metrics.some(function (m) {
            return m.type === MetricType.MEMORY_USAGE && m.name.includes('Memory Leak');
        });
        var performanceScore = this.calculatePerformanceScore(coreWebVitals, metrics);
        var topIssues = alerts
            .filter(function (a) { return a.severity === 'high' || a.severity === 'critical'; })
            .map(function (a) { return a.message; })
            .slice(0, 5);
        var summary = {
            totalMetrics: metrics.length,
            averagePageLoadTime: averagePageLoadTime,
            averageRenderTime: averageRenderTime,
            memoryLeakDetected: memoryLeakDetected,
            performanceScore: performanceScore,
            topIssues: topIssues
        };
        var recommendations = this.generatePerformanceRecommendations(metrics, coreWebVitals);
        return {
            summary: summary,
            coreWebVitals: coreWebVitals,
            resourceTimings: resourceTimings.slice(-50), // Last 50 resources
            componentPerformance: [], // Would be populated from component metrics
            memoryUsage: memoryUsage.slice(-20), // Last 20 measurements
            alerts: alerts.slice(-20), // Last 20 alerts
            recommendations: recommendations,
            timeRange: timeRange || {
                start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                end: new Date()
            }
        };
    };
    PerformanceMonitoringService.prototype.calculatePerformanceScore = function (vitals, metrics) {
        var score = 100;
        // Deduct points for poor Core Web Vitals
        if (vitals.lcp && vitals.lcp > 4000)
            score -= 20;
        else if (vitals.lcp && vitals.lcp > 2500)
            score -= 10;
        if (vitals.fid && vitals.fid > 300)
            score -= 20;
        else if (vitals.fid && vitals.fid > 100)
            score -= 10;
        if (vitals.cls && vitals.cls > 0.25)
            score -= 20;
        else if (vitals.cls && vitals.cls > 0.1)
            score -= 10;
        // Deduct points for performance issues
        var poorMetrics = metrics.filter(function (m) { return m.rating === PerformanceRating.POOR; });
        score -= poorMetrics.length * 5;
        var needsImprovementMetrics = metrics.filter(function (m) { return m.rating === PerformanceRating.NEEDS_IMPROVEMENT; });
        score -= needsImprovementMetrics.length * 2;
        return Math.max(0, Math.min(100, score));
    };
    PerformanceMonitoringService.prototype.generatePerformanceRecommendations = function (metrics, vitals) {
        var recommendations = [];
        // LCP recommendations
        if (vitals.lcp && vitals.lcp > 2500) {
            recommendations.push({
                id: 'lcp_optimization',
                priority: vitals.lcp > 4000 ? 'high' : 'medium',
                category: 'loading',
                title: 'Optimize Largest Contentful Paint',
                description: 'Your LCP is slower than recommended, affecting user experience',
                impact: 'Faster page loading and better user engagement',
                effort: 'medium',
                implementation: [
                    'Optimize and compress images',
                    'Use modern image formats (WebP, AVIF)',
                    'Implement lazy loading',
                    'Use a CDN for static assets'
                ],
                estimatedImprovement: "Reduce LCP by 20-40% (".concat(Math.round(vitals.lcp * 0.3), "ms)")
            });
        }
        // Memory recommendations
        var memoryIssues = metrics.filter(function (m) {
            return m.type === MetricType.MEMORY_USAGE && m.rating === PerformanceRating.POOR;
        });
        if (memoryIssues.length > 0) {
            recommendations.push({
                id: 'memory_optimization',
                priority: 'high',
                category: 'memory',
                title: 'Optimize Memory Usage',
                description: 'High memory usage detected, which may cause performance issues',
                impact: 'Improved application stability and performance',
                effort: 'high',
                implementation: [
                    'Audit for memory leaks',
                    'Optimize component lifecycle methods',
                    'Implement proper cleanup in useEffect hooks',
                    'Use React.memo for expensive components'
                ],
                estimatedImprovement: 'Reduce memory usage by 30-50%'
            });
        }
        // Bundle size recommendations
        var largeResources = this.resourceMonitor.getLargeResources(200000); // 200KB
        if (largeResources.length > 0) {
            recommendations.push({
                id: 'bundle_optimization',
                priority: 'medium',
                category: 'bundle',
                title: 'Optimize Bundle Size',
                description: 'Large JavaScript bundles detected',
                impact: 'Faster initial page load and reduced bandwidth usage',
                effort: 'medium',
                implementation: [
                    'Implement code splitting',
                    'Use dynamic imports for route-based splitting',
                    'Remove unused dependencies',
                    'Use tree shaking to eliminate dead code'
                ],
                estimatedImprovement: 'Reduce bundle size by 20-30%'
            });
        }
        return recommendations.sort(function (a, b) {
            var priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    };
    /**
     * Get current performance metrics
     */
    PerformanceMonitoringService.prototype.getCurrentMetrics = function () {
        return {
            coreWebVitals: this.coreWebVitalsMonitor.getVitals(),
            memoryUsage: this.memoryMonitor.getCurrentMemoryUsage(),
            recentAlerts: this.alerts.slice(-5)
        };
    };
    /**
     * Clear all performance data
     */
    PerformanceMonitoringService.prototype.clearData = function () {
        this.metrics = [];
        this.alerts = [];
    };
    PerformanceMonitoringService.prototype.cleanup = function () {
        // Remove old metrics (keep last 24 hours)
        var twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.metrics = this.metrics.filter(function (m) { return m.timestamp.getTime() > twentyFourHoursAgo; });
        this.alerts = this.alerts.filter(function (a) { return a.timestamp.getTime() > twentyFourHoursAgo; });
        // Limit memory usage
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
    };
    PerformanceMonitoringService.prototype.destroy = function () {
        this.coreWebVitalsMonitor.destroy();
        this.memoryMonitor.destroy();
    };
    return PerformanceMonitoringService;
}(events_1.EventEmitter));
exports.PerformanceMonitoringService = PerformanceMonitoringService;
// Singleton instance
exports.performanceMonitoringService = new PerformanceMonitoringService();
// Convenience functions
exports.performanceMonitor = {
    recordMetric: function (name, value, unit, context) {
        return exports.performanceMonitoringService.recordMetric(name, value, unit, context);
    },
    recordComponentPerformance: function (componentPerf) {
        return exports.performanceMonitoringService.recordComponentPerformance(componentPerf);
    },
    getReport: function (timeRange) {
        return exports.performanceMonitoringService.getPerformanceReport(timeRange);
    },
    getCurrentMetrics: function () {
        return exports.performanceMonitoringService.getCurrentMetrics();
    }
};
