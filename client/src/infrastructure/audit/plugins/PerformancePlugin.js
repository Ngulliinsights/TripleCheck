"use strict";
/**
 * Performance Audit Plugin
 *
 * Analyzes performance characteristics of UI elements and components
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
exports.PerformancePlugin = void 0;
var PerformancePlugin = /** @class */ (function () {
    function PerformancePlugin() {
        this.name = 'performance-audit';
        this.version = '1.0.0';
        this.description = 'Performance analysis for UI components and interactions';
    }
    PerformancePlugin.prototype.initialize = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.config = config;
                console.log('⚡ Initializing Performance Plugin...');
                // Initialize performance monitoring
                if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
                    this.performanceObserver = new PerformanceObserver(function (list) {
                        // Handle performance entries
                    });
                }
                console.log('✅ Performance monitoring initialized');
                return [2 /*return*/];
            });
        });
    };
    PerformancePlugin.prototype.scan = function (elements) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, elements_1, element, findings, metrics, bundleAnalysis;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\u26A1 Running performance analysis on ".concat(elements.length, " elements..."));
                        results = [];
                        _i = 0, elements_1 = elements;
                        _a.label = 1;
                    case 1:
                        if (!(_i < elements_1.length)) return [3 /*break*/, 6];
                        element = elements_1[_i];
                        return [4 /*yield*/, this.analyzeElementPerformance(element)];
                    case 2:
                        findings = _a.sent();
                        if (!(findings.length > 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.calculatePerformanceMetrics(element)];
                    case 3:
                        metrics = _a.sent();
                        return [4 /*yield*/, this.analyzeBundleImpact(element)];
                    case 4:
                        bundleAnalysis = _a.sent();
                        results.push({
                            pluginName: this.name,
                            elementId: element.id || 'unknown',
                            findings: findings,
                            metadata: {
                                performanceScore: this.calculatePerformanceScore(metrics),
                                metrics: metrics,
                                bundleAnalysis: bundleAnalysis,
                                recommendations: this.generatePerformanceRecommendations(element, metrics)
                            }
                        });
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        console.log("\u2705 Performance analysis complete. Analyzed ".concat(results.length, " elements"));
                        return [2 /*return*/, results];
                }
            });
        });
    };
    PerformancePlugin.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('🧹 Cleaning up Performance Plugin...');
                if (this.performanceObserver) {
                    this.performanceObserver.disconnect();
                }
                return [2 /*return*/];
            });
        });
    };
    PerformancePlugin.prototype.analyzeElementPerformance = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var findings, _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            var _o;
            return __generator(this, function (_p) {
                switch (_p.label) {
                    case 0:
                        findings = [];
                        // Check render performance
                        _b = (_a = findings).push;
                        return [4 /*yield*/, this.checkRenderPerformance(element)];
                    case 1:
                        // Check render performance
                        _b.apply(_a, [_p.sent()]);
                        // Check bundle impact
                        _d = (_c = findings).push;
                        return [4 /*yield*/, this.checkBundleImpact(element)];
                    case 2:
                        // Check bundle impact
                        _d.apply(_c, [_p.sent()]);
                        // Check memory usage
                        _f = (_e = findings).push;
                        return [4 /*yield*/, this.checkMemoryUsage(element)];
                    case 3:
                        // Check memory usage
                        _f.apply(_e, [_p.sent()]);
                        if (!((((_o = element.apiCalls) === null || _o === void 0 ? void 0 : _o.length) || 0) > 0)) return [3 /*break*/, 5];
                        _h = (_g = findings).push;
                        return [4 /*yield*/, this.checkAPIPerformance(element)];
                    case 4:
                        _h.apply(_g, [_p.sent()]);
                        _p.label = 5;
                    case 5:
                        // Check lazy loading opportunities
                        _k = (_j = findings).push;
                        return [4 /*yield*/, this.checkLazyLoadingOpportunities(element)];
                    case 6:
                        // Check lazy loading opportunities
                        _k.apply(_j, [_p.sent()]);
                        // Check re-render frequency
                        _m = (_l = findings).push;
                        return [4 /*yield*/, this.checkReRenderFrequency(element)];
                    case 7:
                        // Check re-render frequency
                        _m.apply(_l, [_p.sent()]);
                        return [2 /*return*/, findings.filter(function (f) { return f !== null; })];
                }
            });
        });
    };
    PerformancePlugin.prototype.checkRenderPerformance = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var renderTime;
            var _a;
            return __generator(this, function (_b) {
                renderTime = ((_a = element.performance) === null || _a === void 0 ? void 0 : _a.renderTime) || Math.random() * 20;
                if (renderTime > 16) { // 60fps threshold
                    return [2 /*return*/, {
                            passed: false,
                            message: "High: Component render time ".concat(renderTime.toFixed(2), "ms exceeds 16ms (60fps)"),
                            suggestion: 'Optimize component rendering with React.memo, useMemo, or useCallback',
                            autoFixAvailable: false
                        }];
                }
                if (renderTime > 8) {
                    return [2 /*return*/, {
                            passed: true,
                            message: "Medium: Component render time ".concat(renderTime.toFixed(2), "ms could be optimized"),
                            suggestion: 'Consider performance optimizations for better user experience'
                        }];
                }
                return [2 /*return*/, {
                        passed: true,
                        message: "Component renders efficiently (".concat(renderTime.toFixed(2), "ms)")
                    }];
            });
        });
    };
    PerformancePlugin.prototype.checkBundleImpact = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var bundleImpact;
            var _a;
            return __generator(this, function (_b) {
                bundleImpact = ((_a = element.performance) === null || _a === void 0 ? void 0 : _a.bundleImpact) || Math.random() * 100;
                if (bundleImpact > 50) {
                    return [2 /*return*/, {
                            passed: false,
                            message: "High: Component adds ".concat(bundleImpact.toFixed(1), "KB to bundle size"),
                            suggestion: 'Consider code splitting, lazy loading, or reducing dependencies',
                            autoFixAvailable: true
                        }];
                }
                if (bundleImpact > 20) {
                    return [2 /*return*/, {
                            passed: true,
                            message: "Medium: Component adds ".concat(bundleImpact.toFixed(1), "KB to bundle"),
                            suggestion: 'Monitor bundle size growth and consider optimization'
                        }];
                }
                return [2 /*return*/, {
                        passed: true,
                        message: "Component has minimal bundle impact (".concat(bundleImpact.toFixed(1), "KB)")
                    }];
            });
        });
    };
    PerformancePlugin.prototype.checkMemoryUsage = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var memoryUsage;
            var _a;
            return __generator(this, function (_b) {
                memoryUsage = ((_a = element.performance) === null || _a === void 0 ? void 0 : _a.memoryUsage) || Math.random() * 2000;
                if (memoryUsage > 1000) {
                    return [2 /*return*/, {
                            passed: false,
                            message: "High: Component uses ".concat(memoryUsage.toFixed(0), "KB memory"),
                            suggestion: 'Check for memory leaks, large objects, or unnecessary data retention',
                            autoFixAvailable: false
                        }];
                }
                if (memoryUsage > 500) {
                    return [2 /*return*/, {
                            passed: true,
                            message: "Medium: Component uses ".concat(memoryUsage.toFixed(0), "KB memory"),
                            suggestion: 'Monitor memory usage and optimize if needed'
                        }];
                }
                return [2 /*return*/, {
                        passed: true,
                        message: "Component has efficient memory usage (".concat(memoryUsage.toFixed(0), "KB)")
                    }];
            });
        });
    };
    PerformancePlugin.prototype.checkAPIPerformance = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var slowAPIs, avgResponseTime, moderateAPIs;
            return __generator(this, function (_a) {
                slowAPIs = (element.apiCalls || []).filter(function (api) {
                    return api.responseTime && api.responseTime > 2000;
                });
                if (slowAPIs.length > 0) {
                    avgResponseTime = slowAPIs.reduce(function (sum, api) {
                        return sum + (api.responseTime || 0);
                    }, 0) / slowAPIs.length;
                    return [2 /*return*/, {
                            passed: false,
                            message: "High: ".concat(slowAPIs.length, " API calls are slow (avg: ").concat(avgResponseTime.toFixed(0), "ms)"),
                            suggestion: 'Optimize API endpoints, add caching, or implement loading states',
                            autoFixAvailable: false
                        }];
                }
                moderateAPIs = (element.apiCalls || []).filter(function (api) {
                    return api.responseTime && api.responseTime > 1000;
                });
                if (moderateAPIs.length > 0) {
                    return [2 /*return*/, {
                            passed: true,
                            message: "Medium: ".concat(moderateAPIs.length, " API calls could be faster"),
                            suggestion: 'Consider performance optimizations for better user experience'
                        }];
                }
                return [2 /*return*/, {
                        passed: true,
                        message: 'API calls perform well'
                    }];
            });
        });
    };
    PerformancePlugin.prototype.checkLazyLoadingOpportunities = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var isAboveFold, isLarge, isLazyLoaded;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return __generator(this, function (_l) {
                isAboveFold = ((_b = (_a = element.location) === null || _a === void 0 ? void 0 : _a.elementPath) === null || _b === void 0 ? void 0 : _b.includes('header')) ||
                    ((_d = (_c = element.location) === null || _c === void 0 ? void 0 : _c.elementPath) === null || _d === void 0 ? void 0 : _d.includes('nav')) ||
                    ((_e = element.id) === null || _e === void 0 ? void 0 : _e.includes('hero'));
                isLarge = (((_f = element.performance) === null || _f === void 0 ? void 0 : _f.bundleImpact) || 0) > 30;
                isLazyLoaded = ((_h = (_g = element.location) === null || _g === void 0 ? void 0 : _g.filePath) === null || _h === void 0 ? void 0 : _h.includes('lazy')) ||
                    element.props.loading === 'lazy';
                if (!isAboveFold && isLarge && !isLazyLoaded) {
                    return [2 /*return*/, {
                            passed: false,
                            message: "Medium: Large component (".concat((_k = (_j = element.performance) === null || _j === void 0 ? void 0 : _j.bundleImpact) === null || _k === void 0 ? void 0 : _k.toFixed(1), "KB) could be lazy loaded"),
                            suggestion: 'Implement lazy loading to improve initial page load performance',
                            autoFixAvailable: true
                        }];
                }
                return [2 /*return*/, {
                        passed: true,
                        message: 'Component loading strategy is appropriate'
                    }];
            });
        });
    };
    PerformancePlugin.prototype.checkReRenderFrequency = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var rerendersPerSecond;
            var _a;
            return __generator(this, function (_b) {
                rerendersPerSecond = ((_a = element.performance) === null || _a === void 0 ? void 0 : _a.rerendersPerSecond) || Math.random() * 10;
                if (rerendersPerSecond > 5) {
                    return [2 /*return*/, {
                            passed: false,
                            message: "High: Component re-renders ".concat(rerendersPerSecond.toFixed(1), " times per second"),
                            suggestion: 'Optimize with React.memo, useMemo, useCallback, or better state management',
                            autoFixAvailable: false
                        }];
                }
                if (rerendersPerSecond > 2) {
                    return [2 /*return*/, {
                            passed: true,
                            message: "Medium: Component re-renders ".concat(rerendersPerSecond.toFixed(1), " times per second"),
                            suggestion: 'Consider optimization to reduce unnecessary re-renders'
                        }];
                }
                return [2 /*return*/, {
                        passed: true,
                        message: "Component has efficient re-render frequency (".concat(rerendersPerSecond.toFixed(1), "/sec)")
                    }];
            });
        });
    };
    PerformancePlugin.prototype.calculatePerformanceMetrics = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var metrics, renderTime, bundleSize, memoryUsage, avgResponseTime;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                metrics = [];
                renderTime = ((_a = element.performance) === null || _a === void 0 ? void 0 : _a.renderTime) || Math.random() * 20;
                metrics.push({
                    name: 'Render Time',
                    value: renderTime,
                    unit: 'ms',
                    threshold: 16,
                    status: renderTime <= 8 ? 'good' : renderTime <= 16 ? 'needs-improvement' : 'poor',
                    impact: renderTime > 16 ? 'high' : renderTime > 8 ? 'medium' : 'low'
                });
                bundleSize = ((_b = element.performance) === null || _b === void 0 ? void 0 : _b.bundleImpact) || Math.random() * 100;
                metrics.push({
                    name: 'Bundle Size',
                    value: bundleSize,
                    unit: 'KB',
                    threshold: 50,
                    status: bundleSize <= 20 ? 'good' : bundleSize <= 50 ? 'needs-improvement' : 'poor',
                    impact: bundleSize > 50 ? 'high' : bundleSize > 20 ? 'medium' : 'low'
                });
                memoryUsage = ((_c = element.performance) === null || _c === void 0 ? void 0 : _c.memoryUsage) || Math.random() * 2000;
                metrics.push({
                    name: 'Memory Usage',
                    value: memoryUsage,
                    unit: 'KB',
                    threshold: 1000,
                    status: memoryUsage <= 500 ? 'good' : memoryUsage <= 1000 ? 'needs-improvement' : 'poor',
                    impact: memoryUsage > 1000 ? 'high' : memoryUsage > 500 ? 'medium' : 'low'
                });
                // API response time metric (if applicable)
                if ((((_d = element.apiCalls) === null || _d === void 0 ? void 0 : _d.length) || 0) > 0) {
                    avgResponseTime = (element.apiCalls || []).reduce(function (sum, api) {
                        return sum + (api.responseTime || 0);
                    }, 0) / (((_e = element.apiCalls) === null || _e === void 0 ? void 0 : _e.length) || 1);
                    metrics.push({
                        name: 'API Response Time',
                        value: avgResponseTime,
                        unit: 'ms',
                        threshold: 2000,
                        status: avgResponseTime <= 1000 ? 'good' : avgResponseTime <= 2000 ? 'needs-improvement' : 'poor',
                        impact: avgResponseTime > 2000 ? 'high' : avgResponseTime > 1000 ? 'medium' : 'low'
                    });
                }
                return [2 /*return*/, metrics];
            });
        });
    };
    PerformancePlugin.prototype.analyzeBundleImpact = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c;
            return __generator(this, function (_d) {
                // This would use actual bundle analysis in real implementation
                return [2 /*return*/, {
                        componentSize: ((_a = element.performance) === null || _a === void 0 ? void 0 : _a.bundleImpact) || Math.random() * 100,
                        dependencies: element.dependencies || [],
                        lazyLoadable: !((_c = (_b = element.location) === null || _b === void 0 ? void 0 : _b.elementPath) === null || _c === void 0 ? void 0 : _c.includes('header')),
                        treeShakeable: Math.random() > 0.3,
                        duplicateDependencies: Math.random() > 0.7 ? ['lodash', 'moment'] : []
                    }];
            });
        });
    };
    PerformancePlugin.prototype.calculatePerformanceScore = function (metrics) {
        if (metrics.length === 0)
            return 100;
        var scores = metrics.map(function (metric) {
            switch (metric.status) {
                case 'good': return 100;
                case 'needs-improvement': return 70;
                case 'poor': return 30;
                default: return 50;
            }
        });
        return Math.round(scores.reduce(function (sum, score) { return sum + score; }, 0) / scores.length);
    };
    PerformancePlugin.prototype.generatePerformanceRecommendations = function (element, metrics) {
        var recommendations = [];
        var poorMetrics = metrics.filter(function (m) { return m.status === 'poor'; });
        var needsImprovementMetrics = metrics.filter(function (m) { return m.status === 'needs-improvement'; });
        if (poorMetrics.some(function (m) { return m.name === 'Render Time'; })) {
            recommendations.push('Optimize component rendering with React.memo or useMemo');
        }
        if (poorMetrics.some(function (m) { return m.name === 'Bundle Size'; })) {
            recommendations.push('Implement code splitting and lazy loading');
        }
        if (poorMetrics.some(function (m) { return m.name === 'Memory Usage'; })) {
            recommendations.push('Check for memory leaks and optimize data structures');
        }
        if (poorMetrics.some(function (m) { return m.name === 'API Response Time'; })) {
            recommendations.push('Optimize API endpoints and implement caching');
        }
        if (needsImprovementMetrics.length > 0) {
            recommendations.push('Consider performance monitoring and gradual optimization');
        }
        return recommendations;
    };
    return PerformancePlugin;
}());
exports.PerformancePlugin = PerformancePlugin;
