"use strict";
/**
 * Performance Monitoring Provider Component
 * Provides performance monitoring context to the entire application
 *
 * This component serves as the central hub for performance monitoring,
 * handling initialization, configuration, and development-time debugging.
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
exports.PerformanceMonitoringProvider = PerformanceMonitoringProvider;
exports.PerformanceDebugger = PerformanceDebugger;
var react_1 = require("react");
var usePerformanceMonitoring_1 = require("./usePerformanceMonitoring");
// Constants moved outside component to prevent recreation on each render
var DEFAULT_PERFORMANCE_THRESHOLD = 70;
var DEFAULT_PROCESSING_TIME_THRESHOLD = 5000;
var DEFAULT_ERROR_RATE_THRESHOLD = 0.05;
var PERFORMANCE_CHECK_DELAY = 5000;
// Common external origins that most applications will benefit from preconnecting to
var COMMON_PRECONNECT_ORIGINS = [
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
    "https://api.openai.com",
    "https://maps.googleapis.com",
];
// Type-safe asset keys to prevent object injection vulnerabilities
/**
 * Transforms readonly critical assets config into a mutable format
 * This function uses explicit property access to prevent security issues
 */
var transformCriticalAssets = function (criticalAssets) {
    var mutableAssets = {};
    // Using explicit property checks instead of dynamic access for security
    if (criticalAssets.fonts && criticalAssets.fonts.length > 0) {
        mutableAssets.fonts = __spreadArray([], criticalAssets.fonts, true);
    }
    if (criticalAssets.images && criticalAssets.images.length > 0) {
        mutableAssets.images = __spreadArray([], criticalAssets.images, true);
    }
    if (criticalAssets.scripts && criticalAssets.scripts.length > 0) {
        mutableAssets.scripts = __spreadArray([], criticalAssets.scripts, true);
    }
    if (criticalAssets.styles && criticalAssets.styles.length > 0) {
        mutableAssets.styles = __spreadArray([], criticalAssets.styles, true);
    }
    return mutableAssets;
};
function PerformanceMonitoringProvider(_a) {
    var _this = this;
    var children = _a.children, _b = _a.config, config = _b === void 0 ? {} : _b;
    var performanceMonitoring = (0, usePerformanceMonitoring_1.usePerformanceMonitoring)();
    // Memoize configuration values to prevent unnecessary re-initialization
    var _c = (0, react_1.useMemo)(function () { return config; }, [config]), _d = _c.preconnectOrigins, preconnectOrigins = _d === void 0 ? [] : _d, _e = _c.criticalAssets, criticalAssets = _e === void 0 ? {} : _e, _f = _c.performanceThreshold, performanceThreshold = _f === void 0 ? DEFAULT_PERFORMANCE_THRESHOLD : _f, _g = _c.documentIntelligenceThreshold, documentIntelligenceThreshold = _g === void 0 ? {} : _g;
    var _h = documentIntelligenceThreshold.maxProcessingTime, maxProcessingTime = _h === void 0 ? DEFAULT_PROCESSING_TIME_THRESHOLD : _h, _j = documentIntelligenceThreshold.maxErrorRate, maxErrorRate = _j === void 0 ? DEFAULT_ERROR_RATE_THRESHOLD : _j;
    // Initialize performance optimizations based on configuration
    (0, react_1.useEffect)(function () {
        // Setup preconnections for user-specified external origins
        if (preconnectOrigins.length > 0) {
            performanceMonitoring.setupPreconnections(__spreadArray([], preconnectOrigins, true));
        }
        // Preload critical assets if any are specified
        if (Object.keys(criticalAssets).length > 0) {
            var mutableAssets = transformCriticalAssets(criticalAssets);
            performanceMonitoring.preloadCriticalAssets(mutableAssets);
        }
        // Setup common preconnections that benefit most applications
        // This is done separately so user-specified origins take priority
        performanceMonitoring.setupPreconnections(__spreadArray([], COMMON_PRECONNECT_ORIGINS, true));
    }, [performanceMonitoring, preconnectOrigins, criticalAssets]);
    // Development-only performance monitoring with configurable thresholds
    (0, react_1.useEffect)(function () {
        // Early return if not in development mode
        if (import.meta.env.MODE !== "development") {
            return;
        }
        var checkPerformance = function () { return __awaiter(_this, void 0, void 0, function () {
            var report, documentIntelligence, averageProcessingTime, errorRate, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, performanceMonitoring.generateReport()];
                    case 1:
                        report = (_a.sent());
                        // Log performance warnings based on configurable threshold
                        if (report.overallScore < performanceThreshold) {
                            devLogger.warn("🚨 Performance Score Low:", report.overallScore);
                            // Check Core Web Vitals performance
                            if (report.coreWebVitals.score < performanceThreshold) {
                                devLogger.warn("Core Web Vitals Issues:", report.coreWebVitals.recommendations);
                            }
                            // Check bundle optimization opportunities
                            if (report.bundleAnalysis &&
                                report.bundleAnalysis.recommendations.length > 0) {
                                devLogger.warn("Bundle Optimization Opportunities:", report.bundleAnalysis.recommendations);
                            }
                            // Check resource hints performance
                            if (report.resourceHints.summary.recommendations.length > 0) {
                                devLogger.warn("Resource Hints Recommendations:", report.resourceHints.summary.recommendations);
                            }
                        }
                        else {
                            devLogger.log("✅ Performance Score Good:", report.overallScore);
                        }
                        documentIntelligence = report.documentIntelligence;
                        if (documentIntelligence) {
                            averageProcessingTime = documentIntelligence.averageProcessingTime, errorRate = documentIntelligence.errorRate;
                            if (averageProcessingTime > maxProcessingTime) {
                                devLogger.warn("⚠️ Document processing slow:", "".concat(averageProcessingTime, "ms (threshold: ").concat(maxProcessingTime, "ms)"));
                            }
                            if (errorRate > maxErrorRate) {
                                devLogger.warn("⚠️ Document processing error rate high:", "".concat((errorRate * 100).toFixed(1), "% (threshold: ").concat((maxErrorRate * 100).toFixed(1), "%)"));
                            }
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        devLogger.warn("Failed to generate performance report:", error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        // Check performance after initial load with cleanup
        var timer = setTimeout(checkPerformance, PERFORMANCE_CHECK_DELAY);
        return function () { return clearTimeout(timer); };
    }, [
        performanceMonitoring,
        performanceThreshold,
        maxProcessingTime,
        maxErrorRate,
    ]);
    return (<usePerformanceMonitoring_1.PerformanceMonitoringContext.Provider value={performanceMonitoring}>
      {children}
    </usePerformanceMonitoring_1.PerformanceMonitoringContext.Provider>);
}
/**
 * Development-only logger with consistent interface
 * Centralizes all console operations and provides type safety
 */
var devLogger = {
    warn: function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (import.meta.env.MODE === "development") {
            // eslint-disable-next-line no-console
            console.warn.apply(console, __spreadArray([message], args, false));
        }
    },
    log: function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (import.meta.env.MODE === "development") {
            // eslint-disable-next-line no-console
            console.log.apply(console, __spreadArray([message], args, false));
        }
    },
    error: function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (import.meta.env.MODE === "development") {
            // eslint-disable-next-line no-console
            console.error.apply(console, __spreadArray([message], args, false));
        }
    },
};
/**
 * Determines the appropriate color class based on performance score
 * Uses a clear scoring system that matches web performance standards
 */
var getScoreColorClass = function (score) {
    if (score >= 80)
        return "text-green-600"; // Good performance
    if (score >= 60)
        return "text-orange-600"; // Needs improvement
    return "text-red-600"; // Poor performance
};
/**
 * Maps metric ratings to their corresponding color classes
 * Provides visual consistency across all performance metrics
 */
var getRatingColorClass = function (rating) {
    // Using explicit switch statement instead of object access for security
    switch (rating) {
        case "good":
            return "text-green-600";
        case "needs-improvement":
            return "text-orange-600";
        case "poor":
            return "text-red-600";
        default:
            return "text-gray-600";
    }
};
/**
 * Performance debugging component for development environments
 *
 * This component provides a floating debug interface that allows developers
 * to generate and view performance reports in real-time during development.
 * It automatically hides itself in production builds.
 *
 * Note: All hooks are called before any conditional returns to comply with Rules of Hooks
 */
function PerformanceDebugger() {
    var _this = this;
    var performanceMonitoring = (0, react_1.useContext)(usePerformanceMonitoring_1.PerformanceMonitoringContext);
    var _a = (0, react_1.useState)(null), report = _a[0], setReport = _a[1];
    var _b = (0, react_1.useState)(false), isVisible = _b[0], setIsVisible = _b[1];
    var _c = (0, react_1.useState)(false), isLoading = _c[0], setIsLoading = _c[1];
    /**
     * Generates a new performance report with loading state management
     * This hook is called unconditionally to comply with Rules of Hooks
     */
    var generateReport = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var newReport, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!performanceMonitoring) {
                        devLogger.error("Performance monitoring is not available");
                        return [2 /*return*/];
                    }
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, performanceMonitoring.generateReport()];
                case 2:
                    newReport = _a.sent();
                    setReport(newReport);
                    setIsVisible(true);
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    devLogger.error("Failed to generate performance report:", error_2);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [performanceMonitoring]);
    /**
     * Closes the performance report panel
     * This hook is called unconditionally to comply with Rules of Hooks
     */
    var closeReport = (0, react_1.useCallback)(function () {
        setIsVisible(false);
    }, []);
    // Early return AFTER all hooks have been called
    // This ensures compliance with the Rules of Hooks
    if (!performanceMonitoring || process.env.NODE_ENV !== "development") {
        return null;
    }
    // Render floating action button when report is not visible
    if (!isVisible) {
        return (<div className="fixed bottom-5 right-5 z-[9999]">
        <button type="button" onClick={generateReport} disabled={isLoading} className={"\n            border-0 rounded-full w-16 h-16 text-2xl cursor-pointer shadow-lg \n            transition-all duration-200 flex items-center justify-center\n            ".concat(isLoading ?
                "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105", "\n          ")} title={isLoading ? "Generating Report..." : "Performance Report"} aria-label={isLoading ?
                "Generating Performance Report"
                : "Generate Performance Report"}>
          {isLoading ? "⏳" : "⚡"}
        </button>
      </div>);
    }
    return (<div className="fixed top-5 right-5 w-96 max-h-[80vh] bg-white border border-gray-300 rounded-lg shadow-xl z-[9999] overflow-hidden text-sm">
      {/* Header with close button */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="m-0 font-semibold text-gray-800">Performance Report</h3>
        <button type="button" onClick={closeReport} className="bg-transparent border-0 text-xl cursor-pointer text-gray-500 hover:text-gray-700 transition-colors" aria-label="Close Performance Report">
          ×
        </button>
      </div>

      {/* Report content with scrollable area */}
      <div className="p-4 overflow-auto max-h-[calc(80vh-4rem)]">
        {report && (<div className="space-y-4">
            {/* Overall Score Section */}
            <div>
              <strong>Overall Score: </strong>
              <span className={"font-bold ".concat(getScoreColorClass(report.overallScore))}>
                {report.overallScore}/100
              </span>
            </div>

            {/* Core Web Vitals Section */}
            <div>
              <h4 className="font-semibold mb-2 text-gray-800">
                Core Web Vitals
              </h4>
              <div className="space-y-1 text-xs">
                {Object.entries(report.coreWebVitals.metrics).map(function (_a) {
                var key = _a[0], metric = _a[1];
                return (<div key={key} className="flex justify-between items-center">
                      <span>
                        <strong>{key.toUpperCase()}:</strong>{" "}
                        {metric.value !== null ? metric.value : "N/A"}
                      </span>
                      <span className={"ml-2 font-medium ".concat(getRatingColorClass(metric.rating))}>
                        ({metric.rating})
                      </span>
                    </div>);
            })}
              </div>
            </div>

            {/* Bundle Analysis Section */}
            {report.bundleAnalysis && (<div>
                <h4 className="font-semibold mb-2 text-gray-800">
                  Bundle Analysis
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Total Size:</span>
                    <span className="font-mono">
                      {report.bundleAnalysis.summary.totalSize}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gzipped:</span>
                    <span className="font-mono">
                      {report.bundleAnalysis.summary.gzippedSize}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chunks:</span>
                    <span className="font-mono">
                      {report.bundleAnalysis.summary.chunkCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potential Savings:</span>
                    <span className="font-mono text-orange-600">
                      {report.bundleAnalysis.potentialSavings}
                    </span>
                  </div>
                </div>
              </div>)}

            {/* Resource Hints Section */}
            <div>
              <h4 className="font-semibold mb-2 text-gray-800">
                Resource Hints
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Preloaded:</span>
                  <span className="font-mono">
                    {report.resourceHints.summary.preloadedCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Prefetched:</span>
                  <span className="font-mono">
                    {report.resourceHints.summary.prefetchedCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Hit Rate:</span>
                  <span className="font-mono text-green-600">
                    {report.resourceHints.summary.hitRate}
                  </span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-2 border-t border-gray-200">
              <button type="button" onClick={generateReport} disabled={isLoading} className={"\n                  w-full border-0 rounded px-4 py-2 cursor-pointer text-xs \n                  transition-colors duration-200\n                  ".concat(isLoading ?
                "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700", "\n                ")}>
                {isLoading ? "Generating..." : "Refresh Report"}
              </button>
            </div>
          </div>)}
      </div>
    </div>);
}
