"use strict";
/**
 * React hook for comprehensive performance monitoring integration
 * Combines Core Web Vitals, bundle analysis, and resource hints
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
exports.PerformanceMonitoringContext = void 0;
exports.usePerformanceMonitoring = usePerformanceMonitoring;
exports.usePerformanceMonitoringContext = usePerformanceMonitoringContext;
var react_1 = require("react");
var bundle_analyzer_1 = require("./bundle-analyzer");
var core_web_vitals_1 = require("./core-web-vitals");
var resource_hints_1 = require("./resource-hints");
function usePerformanceMonitoring() {
    var _this = this;
    var _a = (0, react_1.useState)({
        coreWebVitals: {},
        bundleMetrics: null,
        resourceHints: {
            preloaded: 0,
            prefetched: 0,
            preconnected: 0,
            hitRate: 0,
            loadTimeImprovement: 0,
            timestamp: Date.now(),
        },
        isLoading: true,
        lastUpdated: null,
    }), state = _a[0], setState = _a[1];
    // Initialize monitoring
    (0, react_1.useEffect)(function () {
        var unsubscribeCWV = null;
        var initializeMonitoring = function () { return __awaiter(_this, void 0, void 0, function () {
            var initialCWV_1, initialResourceHints_1;
            var _this = this;
            return __generator(this, function (_a) {
                try {
                    // Start Core Web Vitals tracking
                    core_web_vitals_1.coreWebVitalsTracker.startTracking();
                    // Subscribe to Core Web Vitals updates
                    unsubscribeCWV = core_web_vitals_1.coreWebVitalsTracker.onMetricsUpdate(function (metrics) {
                        setState(function (prev) { return (__assign(__assign({}, prev), { coreWebVitals: metrics, lastUpdated: new Date() })); });
                    });
                    initialCWV_1 = core_web_vitals_1.coreWebVitalsTracker.getMetrics();
                    initialResourceHints_1 = resource_hints_1.resourceHintsManager.getMetrics();
                    setState(function (prev) { return (__assign(__assign({}, prev), { coreWebVitals: initialCWV_1, resourceHints: initialResourceHints_1, isLoading: false, lastUpdated: new Date() })); });
                    // Analyze bundle metrics (this might take a moment)
                    setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        var bundleMetrics_1, error_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, bundle_analyzer_1.bundleAnalyzer.analyzeBundleMetrics()];
                                case 1:
                                    bundleMetrics_1 = _a.sent();
                                    setState(function (prev) { return (__assign(__assign({}, prev), { bundleMetrics: bundleMetrics_1, lastUpdated: new Date() })); });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_1 = _a.sent();
                                    console.warn('Failed to analyze bundle metrics:', error_1);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); }, 2000);
                }
                catch (error) {
                    console.error('Failed to initialize performance monitoring:', error);
                    setState(function (prev) { return (__assign(__assign({}, prev), { isLoading: false })); });
                }
                return [2 /*return*/];
            });
        }); };
        initializeMonitoring();
        // Cleanup
        return function () {
            if (unsubscribeCWV) {
                unsubscribeCWV();
            }
            core_web_vitals_1.coreWebVitalsTracker.stopTracking();
        };
    }, []);
    // Update resource hints metrics periodically
    (0, react_1.useEffect)(function () {
        var updateResourceHints = function () {
            var metrics = resource_hints_1.resourceHintsManager.getMetrics();
            setState(function (prev) { return (__assign(__assign({}, prev), { resourceHints: metrics, lastUpdated: new Date() })); });
        };
        var interval = setInterval(updateResourceHints, 30000); // Every 30 seconds
        return function () { return clearInterval(interval); };
    }, []);
    // Generate comprehensive performance report
    var generateReport = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var cwvReport, bundleReport, _a, resourceHintsReport, totalScore, scoreCount, bundleScore, resourceHintsScore, overallScore;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    cwvReport = core_web_vitals_1.coreWebVitalsTracker.generateReport();
                    if (!state.bundleMetrics) return [3 /*break*/, 2];
                    return [4 /*yield*/, bundle_analyzer_1.bundleAnalyzer.generateReport()];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = null;
                    _b.label = 3;
                case 3:
                    bundleReport = _a;
                    resourceHintsReport = resource_hints_1.resourceHintsManager.generateReport();
                    totalScore = 0;
                    scoreCount = 0;
                    // Core Web Vitals score (weighted heavily)
                    totalScore += cwvReport.score * 0.5;
                    scoreCount += 0.5;
                    // Bundle optimization score
                    if (bundleReport) {
                        bundleScore = calculateBundleScore(bundleReport);
                        totalScore += bundleScore * 0.3;
                        scoreCount += 0.3;
                    }
                    resourceHintsScore = calculateResourceHintsScore(resourceHintsReport);
                    totalScore += resourceHintsScore * 0.2;
                    scoreCount += 0.2;
                    overallScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
                    return [2 /*return*/, {
                            overallScore: overallScore,
                            coreWebVitals: {
                                metrics: core_web_vitals_1.coreWebVitalsTracker.getMetricsWithRatings(),
                                score: cwvReport.score,
                                recommendations: cwvReport.recommendations,
                            },
                            bundleAnalysis: bundleReport,
                            resourceHints: resourceHintsReport,
                        }];
            }
        });
    }); }, [state.bundleMetrics]);
    // Preload critical resources for a route
    var preloadRouteAssets = (0, react_1.useCallback)(function (route) {
        resource_hints_1.resourceHintsManager.preloadRouteAssets(route);
    }, []);
    // Setup preconnections for external domains
    var setupPreconnections = (0, react_1.useCallback)(function (origins) {
        resource_hints_1.resourceHintsManager.setupPreconnections({
            origins: origins,
            dns: [],
        });
    }, []);
    // Preload critical assets
    var preloadCriticalAssets = (0, react_1.useCallback)(function (config) {
        resource_hints_1.resourceHintsManager.preloadCriticalAssets({
            fonts: config.fonts || [],
            images: config.images || [],
            scripts: config.scripts || [],
            styles: config.styles || [],
            critical: config.critical || [],
        });
    }, []);
    // Get performance budget violations
    var checkPerformanceBudget = (0, react_1.useCallback)(function () {
        return core_web_vitals_1.coreWebVitalsTracker.generateReport();
    }, []);
    // Force refresh of all metrics
    var refreshMetrics = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var cwvMetrics_1, resourceHintsMetrics_1, bundleMetrics_2, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setState(function (prev) { return (__assign(__assign({}, prev), { isLoading: true })); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    cwvMetrics_1 = core_web_vitals_1.coreWebVitalsTracker.getMetrics();
                    resourceHintsMetrics_1 = resource_hints_1.resourceHintsManager.getMetrics();
                    return [4 /*yield*/, bundle_analyzer_1.bundleAnalyzer.analyzeBundleMetrics()];
                case 2:
                    bundleMetrics_2 = _a.sent();
                    setState(function (prev) { return (__assign(__assign({}, prev), { coreWebVitals: cwvMetrics_1, resourceHints: resourceHintsMetrics_1, bundleMetrics: bundleMetrics_2, isLoading: false, lastUpdated: new Date() })); });
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Failed to refresh metrics:', error_2);
                    setState(function (prev) { return (__assign(__assign({}, prev), { isLoading: false })); });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, []);
    return __assign(__assign({}, state), { 
        // Actions
        generateReport: generateReport, preloadRouteAssets: preloadRouteAssets, setupPreconnections: setupPreconnections, preloadCriticalAssets: preloadCriticalAssets, checkPerformanceBudget: checkPerformanceBudget, refreshMetrics: refreshMetrics, 
        // Utilities
        isPerformanceGood: state.coreWebVitals && Object.values(core_web_vitals_1.coreWebVitalsTracker.getMetricsWithRatings()).every(function (metric) { return metric.rating === 'good'; }) });
}
// Helper function to calculate bundle optimization score
function calculateBundleScore(bundleReport) {
    var score = 100;
    // Deduct points for large bundle size
    var totalSizeKB = parseFloat(bundleReport.summary.totalSize.replace(/[^\d.]/g, ''));
    if (totalSizeKB > 1000)
        score -= 20; // > 1MB
    if (totalSizeKB > 2000)
        score -= 20; // > 2MB
    // Deduct points for poor compression
    var compressionRatio = parseFloat(bundleReport.summary.compressionRatio.replace('%', ''));
    if (compressionRatio > 80)
        score -= 15; // Poor compression
    // Deduct points for duplicates
    if (bundleReport.summary.duplicateCount > 0) {
        score -= Math.min(bundleReport.summary.duplicateCount * 5, 20);
    }
    // Deduct points for high-priority recommendations
    var highPriorityRecs = bundleReport.recommendations.filter(function (rec) { return rec.priority === 'high'; }).length;
    score -= highPriorityRecs * 10;
    return Math.max(score, 0);
}
// Helper function to calculate resource hints score
function calculateResourceHintsScore(resourceHintsReport) {
    var score = 100;
    // Deduct points for low hit rate
    var hitRate = parseFloat(resourceHintsReport.summary.hitRate.replace('%', ''));
    if (hitRate < 50)
        score -= 30;
    if (hitRate < 25)
        score -= 20;
    // Deduct points for no preloading
    if (resourceHintsReport.summary.preloadedCount === 0)
        score -= 20;
    // Deduct points for no preconnections
    if (resourceHintsReport.summary.preconnectedCount === 0)
        score -= 10;
    // Deduct points for recommendations
    score -= Math.min(resourceHintsReport.summary.recommendations.length * 5, 20);
    return Math.max(score, 0);
}
// Performance monitoring context for app-wide usage
exports.PerformanceMonitoringContext = (0, react_1.createContext)(null);
function usePerformanceMonitoringContext() {
    var context = (0, react_1.useContext)(exports.PerformanceMonitoringContext);
    if (!context) {
        throw new Error('usePerformanceMonitoringContext must be used within a PerformanceMonitoringProvider');
    }
    return context;
}
