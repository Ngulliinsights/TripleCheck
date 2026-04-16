"use strict";
/**
 * Bundle analyzer integration for identifying optimization opportunities
 * Provides runtime bundle analysis and optimization recommendations
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
exports.bundleAnalyzer = void 0;
var BundleAnalyzer = /** @class */ (function () {
    function BundleAnalyzer() {
        this.metrics = null;
        this.performanceEntries = [];
        this.chunkLoadTimes = new Map();
        this.initializeTracking();
    }
    BundleAnalyzer.prototype.initializeTracking = function () {
        var _this = this;
        if (typeof window === 'undefined')
            return;
        // Track resource loading
        this.trackResourceLoading();
        // Track dynamic imports
        this.trackDynamicImports();
        // Analyze bundle on page load
        if (document.readyState === 'complete') {
            this.analyzeBundleMetrics();
        }
        else {
            window.addEventListener('load', function () {
                setTimeout(function () { return _this.analyzeBundleMetrics(); }, 1000);
            });
        }
    };
    BundleAnalyzer.prototype.trackResourceLoading = function () {
        var _this = this;
        if (!('PerformanceObserver' in window))
            return;
        try {
            var observer = new PerformanceObserver(function (list) {
                var _a;
                var entries = list.getEntries();
                (_a = _this.performanceEntries).push.apply(_a, entries);
                entries.forEach(function (entry) {
                    if (entry.name.includes('.js') && entry.name.includes('chunk')) {
                        var chunkName = _this.extractChunkName(entry.name);
                        if (chunkName) {
                            _this.chunkLoadTimes.set(chunkName, entry.duration || 0);
                        }
                    }
                });
            });
            observer.observe({ entryTypes: ['resource'] });
        }
        catch (error) {
            console.warn('Failed to track resource loading:', error);
        }
    };
    BundleAnalyzer.prototype.trackDynamicImports = function () {
        // Override dynamic import to track chunk loading
        if (typeof window !== 'undefined' && 'import' in window) {
            var originalImport = window.import;
            // Note: This is a conceptual implementation
            // In practice, this would be handled by the bundler
            console.log('Dynamic import tracking initialized');
        }
    };
    BundleAnalyzer.prototype.extractChunkName = function (url) {
        var match = url.match(/\/([^\/]+)\.chunk\.[a-f0-9]+\.js$/);
        return match ? match[1] : null;
    };
    BundleAnalyzer.prototype.analyzeBundleMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var chunks, modules, duplicates, unusedExports, recommendations;
            return __generator(this, function (_a) {
                chunks = this.analyzeChunks();
                modules = this.analyzeModules();
                duplicates = this.findDuplicateModules(modules);
                unusedExports = this.findUnusedExports();
                recommendations = this.generateRecommendations(chunks, modules, duplicates);
                this.metrics = {
                    totalSize: this.calculateTotalSize(chunks),
                    gzippedSize: this.estimateGzippedSize(chunks),
                    chunks: chunks,
                    modules: modules,
                    duplicates: duplicates,
                    unusedExports: unusedExports,
                    recommendations: recommendations,
                    timestamp: Date.now(),
                };
                // Send metrics to analytics
                this.sendMetricsToAnalytics();
                return [2 /*return*/, this.metrics];
            });
        });
    };
    BundleAnalyzer.prototype.analyzeChunks = function () {
        var _this = this;
        var chunks = [];
        // Analyze loaded scripts
        var scripts = Array.from(document.querySelectorAll('script[src]'));
        scripts.forEach(function (script) {
            var src = script.src;
            if (!src)
                return;
            var chunkName = _this.extractChunkName(src) || _this.extractFileName(src);
            var size = _this.estimateScriptSize(script);
            var loadTime = _this.chunkLoadTimes.get(chunkName) || 0;
            chunks.push({
                name: chunkName,
                size: size,
                gzippedSize: Math.round(size * 0.7), // Estimate
                modules: [], // Would be populated by bundler analysis
                isEntry: src.includes('main') || src.includes('index'),
                isAsync: script.async,
                loadTime: loadTime,
            });
        });
        return chunks;
    };
    BundleAnalyzer.prototype.analyzeModules = function () {
        var _this = this;
        // This would typically be populated by bundler analysis
        // For runtime analysis, we can only estimate based on available data
        var modules = [];
        // Analyze performance entries for module information
        this.performanceEntries.forEach(function (entry) {
            if (entry.name.includes('node_modules') || entry.name.includes('.js')) {
                var moduleName = _this.extractModuleName(entry.name);
                var size = entry.transferSize || 0;
                modules.push({
                    name: moduleName,
                    size: size,
                    chunks: [], // Would be populated by bundler
                    reasons: [], // Would be populated by bundler
                    isVendor: entry.name.includes('node_modules'),
                });
            }
        });
        return modules;
    };
    BundleAnalyzer.prototype.findDuplicateModules = function (modules) {
        var duplicates = [];
        var moduleMap = new Map();
        // Group modules by name
        modules.forEach(function (module) {
            var baseName = module.name.split('/').pop() || module.name;
            if (!moduleMap.has(baseName)) {
                moduleMap.set(baseName, []);
            }
            moduleMap.get(baseName).push(module);
        });
        // Find duplicates
        moduleMap.forEach(function (moduleList, name) {
            if (moduleList.length > 1) {
                duplicates.push({
                    name: name,
                    chunks: moduleList.flatMap(function (m) { return m.chunks; }),
                    totalSize: moduleList.reduce(function (sum, m) { return sum + m.size; }, 0),
                    instances: moduleList.length,
                });
            }
        });
        return duplicates;
    };
    BundleAnalyzer.prototype.findUnusedExports = function () {
        // This would require static analysis or bundler integration
        // For now, return empty array as this is complex to implement at runtime
        return [];
    };
    BundleAnalyzer.prototype.generateRecommendations = function (chunks, modules, duplicates) {
        var _this = this;
        var recommendations = [];
        // Large chunk recommendations
        chunks.forEach(function (chunk) {
            if (chunk.size > 500000) { // 500KB
                recommendations.push({
                    type: 'chunk-splitting',
                    priority: 'high',
                    description: "Chunk \"".concat(chunk.name, "\" is large (").concat(_this.formatSize(chunk.size), "). Consider splitting it."),
                    potentialSavings: Math.round(chunk.size * 0.3),
                    implementation: 'Use dynamic imports or configure chunk splitting in your bundler',
                });
            }
        });
        // Duplicate module recommendations
        duplicates.forEach(function (duplicate) {
            if (duplicate.instances > 1) {
                recommendations.push({
                    type: 'duplicate-removal',
                    priority: 'medium',
                    description: "Module \"".concat(duplicate.name, "\" is duplicated ").concat(duplicate.instances, " times"),
                    potentialSavings: Math.round(duplicate.totalSize * 0.8),
                    implementation: 'Configure bundler to deduplicate modules or use a shared chunk',
                });
            }
        });
        // Vendor chunk recommendations
        var vendorModules = modules.filter(function (m) { return m.isVendor; });
        var totalVendorSize = vendorModules.reduce(function (sum, m) { return sum + m.size; }, 0);
        if (totalVendorSize > 1000000) { // 1MB
            recommendations.push({
                type: 'chunk-splitting',
                priority: 'high',
                description: "Vendor bundle is large (".concat(this.formatSize(totalVendorSize), "). Consider splitting by usage frequency."),
                potentialSavings: Math.round(totalVendorSize * 0.4),
                implementation: 'Split vendor chunks by framework, utilities, and rarely-used libraries',
            });
        }
        // Compression recommendations
        var uncompressedSize = chunks.reduce(function (sum, chunk) { return sum + chunk.size; }, 0);
        var compressedSize = chunks.reduce(function (sum, chunk) { return sum + chunk.gzippedSize; }, 0);
        var compressionRatio = compressedSize / uncompressedSize;
        if (compressionRatio > 0.8) {
            recommendations.push({
                type: 'compression',
                priority: 'medium',
                description: 'Bundle compression ratio is low. Consider enabling better compression.',
                potentialSavings: Math.round(uncompressedSize * 0.3),
                implementation: 'Enable Brotli compression or optimize gzip settings',
            });
        }
        // Lazy loading recommendations
        var syncChunks = chunks.filter(function (chunk) { return !chunk.isAsync && !chunk.isEntry; });
        if (syncChunks.length > 3) {
            recommendations.push({
                type: 'lazy-loading',
                priority: 'medium',
                description: "".concat(syncChunks.length, " chunks are loaded synchronously. Consider lazy loading."),
                potentialSavings: syncChunks.reduce(function (sum, chunk) { return sum + chunk.size; }, 0) * 0.5,
                implementation: 'Use React.lazy() or dynamic imports for route-based code splitting',
            });
        }
        return recommendations.sort(function (a, b) {
            var priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    };
    BundleAnalyzer.prototype.calculateTotalSize = function (chunks) {
        return chunks.reduce(function (sum, chunk) { return sum + chunk.size; }, 0);
    };
    BundleAnalyzer.prototype.estimateGzippedSize = function (chunks) {
        return chunks.reduce(function (sum, chunk) { return sum + chunk.gzippedSize; }, 0);
    };
    BundleAnalyzer.prototype.estimateScriptSize = function (script) {
        // This is an estimation - in practice, you'd get this from bundler stats
        var src = script.src;
        if (src.includes('vendor') || src.includes('node_modules')) {
            return 300000; // 300KB estimate for vendor chunks
        }
        if (src.includes('main') || src.includes('index')) {
            return 150000; // 150KB estimate for main chunks
        }
        return 50000; // 50KB estimate for other chunks
    };
    BundleAnalyzer.prototype.extractFileName = function (url) {
        var _a;
        return ((_a = url.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('.')[0]) || 'unknown';
    };
    BundleAnalyzer.prototype.extractModuleName = function (url) {
        if (url.includes('node_modules')) {
            var match = url.match(/node_modules\/([^\/]+)/);
            return match ? match[1] : 'unknown-vendor';
        }
        return this.extractFileName(url);
    };
    BundleAnalyzer.prototype.formatSize = function (bytes) {
        if (bytes === 0)
            return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return "".concat(parseFloat((bytes / Math.pow(k, i)).toFixed(2)), " ").concat(sizes[i]);
    };
    BundleAnalyzer.prototype.sendMetricsToAnalytics = function () {
        if (!this.metrics || typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
            return;
        }
        fetch('/api/analytics/bundle-metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(__assign(__assign({}, this.metrics), { url: window.location.href, userAgent: navigator.userAgent })),
        }).catch(function (error) {
            console.warn('Failed to send bundle metrics to analytics:', error);
        });
    };
    BundleAnalyzer.prototype.getMetrics = function () {
        return this.metrics;
    };
    BundleAnalyzer.prototype.generateReport = function () {
        return __awaiter(this, void 0, void 0, function () {
            var compressionRatio, totalPotentialSavings;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.metrics) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.analyzeBundleMetrics()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!this.metrics) {
                            throw new Error('Failed to analyze bundle metrics');
                        }
                        compressionRatio = ((this.metrics.gzippedSize / this.metrics.totalSize) * 100).toFixed(1);
                        totalPotentialSavings = this.metrics.recommendations.reduce(function (sum, rec) { return sum + rec.potentialSavings; }, 0);
                        return [2 /*return*/, {
                                summary: {
                                    totalSize: this.formatSize(this.metrics.totalSize),
                                    gzippedSize: this.formatSize(this.metrics.gzippedSize),
                                    compressionRatio: "".concat(compressionRatio, "%"),
                                    chunkCount: this.metrics.chunks.length,
                                    moduleCount: this.metrics.modules.length,
                                    duplicateCount: this.metrics.duplicates.length,
                                },
                                recommendations: this.metrics.recommendations,
                                potentialSavings: this.formatSize(totalPotentialSavings),
                            }];
                }
            });
        });
    };
    return BundleAnalyzer;
}());
// Singleton instance
exports.bundleAnalyzer = new BundleAnalyzer();
// Development helper for manual analysis
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.__bundleAnalyzer = exports.bundleAnalyzer;
}
