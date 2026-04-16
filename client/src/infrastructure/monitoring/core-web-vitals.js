"use strict";
/**
 * Core Web Vitals tracking with real-time performance metrics
 * Implements comprehensive tracking for LCP, FID, CLS, FCP, and TTFB
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
exports.coreWebVitalsTracker = void 0;
// Performance thresholds based on Core Web Vitals standards
var DEFAULT_THRESHOLDS = {
    lcp: { good: 2500, needsImprovement: 4000 },
    fid: { good: 100, needsImprovement: 300 },
    cls: { good: 0.1, needsImprovement: 0.25 },
    fcp: { good: 1800, needsImprovement: 3000 },
    ttfb: { good: 800, needsImprovement: 1800 },
};
var CoreWebVitalsTracker = /** @class */ (function () {
    function CoreWebVitalsTracker(thresholds) {
        if (thresholds === void 0) { thresholds = DEFAULT_THRESHOLDS; }
        this.metrics = {};
        this.observers = [];
        this.callbacks = [];
        this.isTracking = false;
        this.thresholds = thresholds;
        this.initializeMetrics();
    }
    CoreWebVitalsTracker.prototype.initializeMetrics = function () {
        this.metrics = {
            lcp: null,
            fid: null,
            cls: null,
            fcp: null,
            ttfb: null,
            inp: null,
            timestamp: Date.now(),
            url: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            connectionType: this.getConnectionType(),
            deviceMemory: this.getDeviceMemory(),
        };
    };
    CoreWebVitalsTracker.prototype.getConnectionType = function () {
        if (typeof navigator === 'undefined')
            return 'unknown';
        var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return connection ? connection.effectiveType || 'unknown' : 'unknown';
    };
    CoreWebVitalsTracker.prototype.getDeviceMemory = function () {
        if (typeof navigator === 'undefined')
            return null;
        return navigator.deviceMemory || null;
    };
    CoreWebVitalsTracker.prototype.startTracking = function () {
        if (this.isTracking || typeof window === 'undefined')
            return;
        this.isTracking = true;
        this.trackTTFB();
        this.trackFCP();
        this.trackLCP();
        this.trackFID();
        this.trackCLS();
        this.trackINP();
    };
    CoreWebVitalsTracker.prototype.stopTracking = function () {
        this.isTracking = false;
        this.observers.forEach(function (observer) { return observer.disconnect(); });
        this.observers = [];
    };
    CoreWebVitalsTracker.prototype.trackTTFB = function () {
        // Track Time to First Byte using Navigation Timing API
        if ('performance' in window && 'getEntriesByType' in performance) {
            var navigationEntries = performance.getEntriesByType('navigation');
            if (navigationEntries.length > 0) {
                var entry = navigationEntries[0];
                this.updateMetric('ttfb', entry.responseStart - entry.requestStart);
            }
        }
    };
    CoreWebVitalsTracker.prototype.trackFCP = function () {
        var _this = this;
        this.observePerformanceEntries('paint', function (entries) {
            entries.forEach(function (entry) {
                if (entry.name === 'first-contentful-paint') {
                    _this.updateMetric('fcp', entry.startTime);
                }
            });
        });
    };
    CoreWebVitalsTracker.prototype.trackLCP = function () {
        var _this = this;
        this.observePerformanceEntries('largest-contentful-paint', function (entries) {
            entries.forEach(function (entry) {
                _this.updateMetric('lcp', entry.startTime);
            });
        });
    };
    CoreWebVitalsTracker.prototype.trackFID = function () {
        var _this = this;
        this.observePerformanceEntries('first-input', function (entries) {
            entries.forEach(function (entry) {
                _this.updateMetric('fid', entry.processingStart - entry.startTime);
            });
        });
    };
    CoreWebVitalsTracker.prototype.trackCLS = function () {
        var _this = this;
        var clsValue = 0;
        var sessionValue = 0;
        var sessionEntries = [];
        this.observePerformanceEntries('layout-shift', function (entries) {
            entries.forEach(function (entry) {
                // Only count layout shifts without recent input
                if (!entry.hadRecentInput) {
                    var firstSessionEntry = sessionEntries[0];
                    var lastSessionEntry = sessionEntries[sessionEntries.length - 1];
                    // If the entry occurred less than 1 second after the previous entry and
                    // less than 5 seconds after the first entry in the session, include it
                    if (sessionValue &&
                        entry.startTime - lastSessionEntry.startTime < 1000 &&
                        entry.startTime - firstSessionEntry.startTime < 5000) {
                        sessionValue += entry.value;
                        sessionEntries.push(entry);
                    }
                    else {
                        sessionValue = entry.value;
                        sessionEntries = [entry];
                    }
                    // If the current session value is larger than the current CLS value,
                    // update CLS and the entries contributing to it.
                    if (sessionValue > clsValue) {
                        clsValue = sessionValue;
                        _this.updateMetric('cls', clsValue);
                    }
                }
            });
        });
    };
    CoreWebVitalsTracker.prototype.trackINP = function () {
        var _this = this;
        // Track Interaction to Next Paint (experimental)
        if ('PerformanceEventTiming' in window) {
            this.observePerformanceEntries('event', function (entries) {
                entries.forEach(function (entry) {
                    if (entry.interactionId) {
                        var inp = entry.processingEnd - entry.startTime;
                        _this.updateMetric('inp', inp);
                    }
                });
            });
        }
    };
    CoreWebVitalsTracker.prototype.observePerformanceEntries = function (entryType, callback) {
        try {
            var observer = new PerformanceObserver(function (list) {
                callback(list.getEntries());
            });
            observer.observe({ type: entryType, buffered: true });
            this.observers.push(observer);
        }
        catch (error) {
            console.warn("Failed to observe ".concat(entryType, " entries:"), error);
        }
    };
    CoreWebVitalsTracker.prototype.updateMetric = function (key, value) {
        var _this = this;
        this.metrics[key] = value;
        this.metrics.timestamp = Date.now();
        // Notify callbacks
        this.callbacks.forEach(function (callback) {
            try {
                callback(_this.metrics);
            }
            catch (error) {
                console.error('Error in Core Web Vitals callback:', error);
            }
        });
        // Send to analytics
        this.sendToAnalytics(key, value);
    };
    CoreWebVitalsTracker.prototype.sendToAnalytics = function (metric, value) {
        if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
            return;
        }
        // Send to analytics service
        fetch('/api/analytics/core-web-vitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                metric: metric,
                value: value,
                rating: this.getMetricRating(metric, value),
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                connectionType: this.getConnectionType(),
                deviceMemory: this.getDeviceMemory(),
            }),
        }).catch(function (error) {
            console.warn('Failed to send Core Web Vitals to analytics:', error);
        });
    };
    CoreWebVitalsTracker.prototype.getMetricRating = function (metric, value) {
        var threshold = this.thresholds[metric];
        if (value <= threshold.good)
            return 'good';
        if (value <= threshold.needsImprovement)
            return 'needs-improvement';
        return 'poor';
    };
    CoreWebVitalsTracker.prototype.getMetrics = function () {
        return __assign({}, this.metrics);
    };
    CoreWebVitalsTracker.prototype.getMetricsWithRatings = function () {
        var _this = this;
        var metrics = this.getMetrics();
        var result = {};
        ['lcp', 'fid', 'cls', 'fcp', 'ttfb'].forEach(function (key) {
            var _a;
            var value = (_a = metrics[key]) !== null && _a !== void 0 ? _a : null;
            result[key] = {
                value: value,
                rating: value !== null ? _this.getMetricRating(key, value) : 'good',
            };
        });
        return result;
    };
    CoreWebVitalsTracker.prototype.onMetricsUpdate = function (callback) {
        var _this = this;
        this.callbacks.push(callback);
        // Return unsubscribe function
        return function () {
            var index = _this.callbacks.indexOf(callback);
            if (index > -1) {
                _this.callbacks.splice(index, 1);
            }
        };
    };
    CoreWebVitalsTracker.prototype.generateReport = function () {
        var _this = this;
        var metricsWithRatings = this.getMetricsWithRatings();
        var recommendations = [];
        var totalScore = 0;
        var metricCount = 0;
        var summary = {};
        Object.entries(metricsWithRatings).forEach(function (_a) {
            var key = _a[0], _b = _a[1], value = _b.value, rating = _b.rating;
            if (key in _this.thresholds) {
                var threshold = _this.thresholds[key];
                summary[key] = { value: value, rating: rating, threshold: threshold };
                if (value !== null) {
                    // Calculate score (0-100)
                    var score = 100;
                    if (rating === 'needs-improvement')
                        score = 50;
                    if (rating === 'poor')
                        score = 0;
                    totalScore += score;
                    metricCount++;
                    // Generate recommendations
                    if (rating !== 'good') {
                        recommendations.push.apply(recommendations, _this.getRecommendations(key, value, rating));
                    }
                }
            }
        });
        var overallScore = metricCount > 0 ? Math.round(totalScore / metricCount) : 0;
        return {
            summary: summary,
            recommendations: recommendations,
            score: overallScore,
        };
    };
    CoreWebVitalsTracker.prototype.getRecommendations = function (metric, value, rating) {
        var recommendations = {
            lcp: [
                'Optimize server response times',
                'Use a Content Delivery Network (CDN)',
                'Optimize and compress images',
                'Preload critical resources',
                'Remove unused JavaScript and CSS',
            ],
            fid: [
                'Minimize JavaScript execution time',
                'Remove unused JavaScript',
                'Break up long tasks',
                'Use web workers for heavy computations',
                'Optimize third-party scripts',
            ],
            cls: [
                'Include size attributes on images and video elements',
                'Reserve space for ad slots',
                'Add new UI elements below the fold',
                'Use CSS aspect-ratio for dynamic content',
                'Avoid inserting content above existing content',
            ],
            fcp: [
                'Eliminate render-blocking resources',
                'Minify CSS and JavaScript',
                'Remove unused CSS',
                'Use efficient cache policies',
                'Minimize critical request depth',
            ],
            ttfb: [
                'Optimize server performance',
                'Use a CDN',
                'Cache resources',
                'Use service workers',
                'Minimize redirects',
            ],
        };
        return recommendations[metric] || [];
    };
    return CoreWebVitalsTracker;
}());
// Singleton instance
exports.coreWebVitalsTracker = new CoreWebVitalsTracker();
// Auto-start tracking when module loads
if (typeof window !== 'undefined') {
    // Start tracking after page load
    if (document.readyState === 'complete') {
        exports.coreWebVitalsTracker.startTracking();
    }
    else {
        window.addEventListener('load', function () {
            exports.coreWebVitalsTracker.startTracking();
        });
    }
}
