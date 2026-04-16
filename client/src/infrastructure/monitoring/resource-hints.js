"use strict";
/**
 * Resource hints system for preload, prefetch, and preconnect optimization
 * Implements intelligent resource loading strategies for critical assets
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
exports.resourceHintsManager = void 0;
var ResourceHintsManager = /** @class */ (function () {
    function ResourceHintsManager() {
        this.preloadedResources = new Set();
        this.prefetchedResources = new Set();
        this.preconnectedOrigins = new Set();
        this.resourceLoadTimes = new Map();
        this.hintMetrics = {
            preloaded: 0,
            prefetched: 0,
            preconnected: 0,
            hitRate: 0,
            loadTimeImprovement: 0,
            timestamp: Date.now(),
        };
        this.initializeTracking();
    }
    ResourceHintsManager.prototype.initializeTracking = function () {
        if (typeof window === 'undefined')
            return;
        // Track resource loading performance
        this.trackResourcePerformance();
        // Auto-detect and preload critical resources
        this.autoDetectCriticalResources();
    };
    ResourceHintsManager.prototype.trackResourcePerformance = function () {
        var _this = this;
        if (!('PerformanceObserver' in window))
            return;
        try {
            var observer = new PerformanceObserver(function (list) {
                list.getEntries().forEach(function (entry) {
                    _this.resourceLoadTimes.set(entry.name, entry.duration || 0);
                });
            });
            observer.observe({ entryTypes: ['resource'] });
        }
        catch (error) {
            console.warn('Failed to track resource performance:', error);
        }
    };
    ResourceHintsManager.prototype.autoDetectCriticalResources = function () {
        var _this = this;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                _this.detectCriticalImages();
                _this.detectCriticalFonts();
            });
        }
        else {
            this.detectCriticalImages();
            this.detectCriticalFonts();
        }
    };
    ResourceHintsManager.prototype.detectCriticalImages = function () {
        var _this = this;
        // Detect above-the-fold images
        var images = Array.from(document.querySelectorAll('img'));
        var viewportHeight = window.innerHeight;
        images.forEach(function (img) {
            var rect = img.getBoundingClientRect();
            if (rect.top < viewportHeight && img.src && !_this.preloadedResources.has(img.src)) {
                _this.preloadResource({
                    href: img.src,
                    as: 'image',
                    priority: 'high',
                });
            }
        });
    };
    ResourceHintsManager.prototype.detectCriticalFonts = function () {
        var _this = this;
        // Detect fonts used in critical CSS
        var stylesheets = Array.from(document.styleSheets);
        var fontUrls = new Set();
        try {
            stylesheets.forEach(function (stylesheet) {
                if (stylesheet.cssRules) {
                    Array.from(stylesheet.cssRules).forEach(function (rule) {
                        if (rule instanceof CSSFontFaceRule) {
                            var src = rule.style.getPropertyValue('src');
                            var urlMatch = src.match(/url\(['"]?([^'"]+)['"]?\)/);
                            if (urlMatch) {
                                fontUrls.add(urlMatch[1]);
                            }
                        }
                    });
                }
            });
            fontUrls.forEach(function (url) {
                if (!_this.preloadedResources.has(url)) {
                    _this.preloadResource({
                        href: url,
                        as: 'font',
                        type: 'font/woff2',
                        crossorigin: 'anonymous',
                        priority: 'high',
                    });
                }
            });
        }
        catch (error) {
            console.warn('Failed to detect critical fonts:', error);
        }
    };
    ResourceHintsManager.prototype.preloadResource = function (hint) {
        if (this.preloadedResources.has(hint.href))
            return;
        var link = document.createElement('link');
        link.rel = 'preload';
        link.href = hint.href;
        if (hint.as)
            link.as = hint.as;
        if (hint.type)
            link.type = hint.type;
        if (hint.crossorigin)
            link.crossOrigin = hint.crossorigin;
        if (hint.media)
            link.media = hint.media;
        // Set fetchpriority if supported
        if ('fetchPriority' in link && hint.priority) {
            link.fetchPriority = hint.priority;
        }
        document.head.appendChild(link);
        this.preloadedResources.add(hint.href);
        this.hintMetrics.preloaded++;
        console.log("Preloaded resource: ".concat(hint.href));
    };
    ResourceHintsManager.prototype.prefetchResource = function (href, as) {
        if (this.prefetchedResources.has(href))
            return;
        var link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        if (as)
            link.as = as;
        document.head.appendChild(link);
        this.prefetchedResources.add(href);
        this.hintMetrics.prefetched++;
        console.log("Prefetched resource: ".concat(href));
    };
    ResourceHintsManager.prototype.preconnectOrigin = function (origin, crossorigin) {
        if (this.preconnectedOrigins.has(origin))
            return;
        var link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        if (crossorigin)
            link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
        this.preconnectedOrigins.add(origin);
        this.hintMetrics.preconnected++;
        console.log("Preconnected to origin: ".concat(origin));
    };
    ResourceHintsManager.prototype.dnsPrefetch = function (hostname) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = hostname;
        document.head.appendChild(link);
        console.log("DNS prefetched: ".concat(hostname));
    };
    ResourceHintsManager.prototype.preloadCriticalAssets = function (config) {
        var _this = this;
        // Preload fonts
        config.fonts.forEach(function (font) {
            _this.preloadResource({
                href: font,
                as: 'font',
                type: 'font/woff2',
                crossorigin: 'anonymous',
                priority: 'high',
            });
        });
        // Preload critical images
        config.images.forEach(function (image) {
            _this.preloadResource({
                href: image,
                as: 'image',
                priority: 'high',
            });
        });
        // Preload critical scripts
        config.scripts.forEach(function (script) {
            _this.preloadResource({
                href: script,
                as: 'script',
                priority: 'high',
            });
        });
        // Preload critical styles
        config.styles.forEach(function (style) {
            _this.preloadResource({
                href: style,
                as: 'style',
                priority: 'high',
            });
        });
        // Preload other critical resources
        config.critical.forEach(function (resource) {
            _this.preloadResource({
                href: resource,
                priority: 'high',
            });
        });
    };
    ResourceHintsManager.prototype.prefetchNextPageAssets = function (config) {
        var _this = this;
        // Prefetch route assets
        config.routes.forEach(function (route) {
            _this.prefetchResource(route, 'document');
        });
        // Prefetch assets
        config.assets.forEach(function (asset) {
            _this.prefetchResource(asset);
        });
        // Prefetch data
        config.data.forEach(function (dataUrl) {
            _this.prefetchResource(dataUrl, 'fetch');
        });
    };
    ResourceHintsManager.prototype.setupPreconnections = function (config) {
        var _this = this;
        // Preconnect to origins
        config.origins.forEach(function (origin) {
            _this.preconnectOrigin(origin, true);
        });
        // DNS prefetch
        config.dns.forEach(function (hostname) {
            _this.dnsPrefetch(hostname);
        });
    };
    ResourceHintsManager.prototype.preloadRouteAssets = function (route) {
        var _this = this;
        // Intelligent route-based preloading
        var routeAssets = this.getRouteAssets(route);
        routeAssets.forEach(function (asset) {
            _this.preloadResource({
                href: asset.href,
                as: asset.as,
                priority: 'low',
            });
        });
    };
    ResourceHintsManager.prototype.getRouteAssets = function (route) {
        // This would be configured based on your routing structure
        var routeAssetMap = {
            '/property': [
                { href: '/api/properties', as: 'fetch' },
                { href: '/images/property-placeholder.webp', as: 'image' },
            ],
            '/search': [
                { href: '/api/search', as: 'fetch' },
                { href: '/js/search-worker.js', as: 'script' },
            ],
            '/trust': [
                { href: '/api/trust-scores', as: 'fetch' },
                { href: '/images/trust-badges.webp', as: 'image' },
            ],
        };
        return routeAssetMap[route] || [];
    };
    ResourceHintsManager.prototype.optimizeForUserBehavior = function () {
        // Track user interactions to predict next actions
        this.trackUserInteractions();
        // Preload based on hover intentions
        this.setupHoverPreloading();
        // Preload based on scroll behavior
        this.setupScrollPreloading();
    };
    ResourceHintsManager.prototype.trackUserInteractions = function () {
        var _this = this;
        // Track link hovers for predictive preloading
        document.addEventListener('mouseover', function (event) {
            var target = event.target;
            var link = target.closest('a');
            if (link && link.href && !_this.prefetchedResources.has(link.href)) {
                // Debounce to avoid excessive prefetching
                setTimeout(function () {
                    if (link.matches(':hover')) {
                        _this.prefetchResource(link.href, 'document');
                    }
                }, 100);
            }
        });
    };
    ResourceHintsManager.prototype.setupHoverPreloading = function () {
        var _this = this;
        // Preload on hover with delay to avoid false positives
        var hoverTimeout;
        document.addEventListener('mouseenter', function (event) {
            var target = event.target;
            if (!target || !(target instanceof HTMLElement))
                return;
            var link = target.closest('a[href]');
            if (link && link.href.startsWith(window.location.origin)) {
                hoverTimeout = window.setTimeout(function () {
                    _this.prefetchResource(link.href, 'document');
                }, 200);
            }
        }, true);
        document.addEventListener('mouseleave', function () {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
            }
        }, true);
    };
    ResourceHintsManager.prototype.setupScrollPreloading = function () {
        var _this = this;
        // Preload resources as they come into viewport
        if ('IntersectionObserver' in window) {
            var observer_1 = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var element = entry.target;
                        var preloadHref = element.dataset.preload;
                        if (preloadHref && !_this.preloadedResources.has(preloadHref)) {
                            _this.preloadResource({
                                href: preloadHref,
                                as: element.dataset.preloadAs || 'image',
                            });
                        }
                    }
                });
            }, {
                rootMargin: '50px',
            });
            // Observe elements with data-preload attribute
            document.querySelectorAll('[data-preload]').forEach(function (element) {
                observer_1.observe(element);
            });
        }
    };
    ResourceHintsManager.prototype.calculateHitRate = function () {
        var _this = this;
        var totalHints = this.hintMetrics.preloaded + this.hintMetrics.prefetched;
        if (totalHints === 0)
            return 0;
        var hits = 0;
        // Check how many preloaded/prefetched resources were actually used
        this.preloadedResources.forEach(function (resource) {
            if (_this.resourceLoadTimes.has(resource)) {
                hits++;
            }
        });
        this.prefetchedResources.forEach(function (resource) {
            if (_this.resourceLoadTimes.has(resource)) {
                hits++;
            }
        });
        var hitRate = (hits / totalHints) * 100;
        this.hintMetrics.hitRate = hitRate;
        return hitRate;
    };
    ResourceHintsManager.prototype.getMetrics = function () {
        this.hintMetrics.hitRate = this.calculateHitRate();
        this.hintMetrics.timestamp = Date.now();
        return __assign({}, this.hintMetrics);
    };
    ResourceHintsManager.prototype.generateReport = function () {
        var metrics = this.getMetrics();
        var recommendations = [];
        // Generate recommendations based on metrics
        if (metrics.hitRate < 50) {
            recommendations.push('Hit rate is low. Review preloading strategy to focus on actually used resources.');
        }
        if (metrics.preloaded === 0) {
            recommendations.push('No resources are being preloaded. Consider preloading critical fonts and images.');
        }
        if (metrics.preconnected === 0) {
            recommendations.push('No origins are preconnected. Consider preconnecting to external domains.');
        }
        if (this.preloadedResources.size > 10) {
            recommendations.push('Many resources are preloaded. Ensure only critical resources are preloaded.');
        }
        return {
            summary: {
                preloadedCount: metrics.preloaded,
                prefetchedCount: metrics.prefetched,
                preconnectedCount: metrics.preconnected,
                hitRate: "".concat(metrics.hitRate.toFixed(1), "%"),
                recommendations: recommendations,
            },
            details: {
                preloadedResources: Array.from(this.preloadedResources),
                prefetchedResources: Array.from(this.prefetchedResources),
                preconnectedOrigins: Array.from(this.preconnectedOrigins),
            },
        };
    };
    ResourceHintsManager.prototype.sendMetricsToAnalytics = function () {
        if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
            return;
        }
        var metrics = this.getMetrics();
        fetch('/api/analytics/resource-hints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(__assign(__assign({}, metrics), { url: window.location.href, userAgent: navigator.userAgent })),
        }).catch(function (error) {
            console.warn('Failed to send resource hints metrics:', error);
        });
    };
    return ResourceHintsManager;
}());
// Singleton instance
exports.resourceHintsManager = new ResourceHintsManager();
// Auto-optimize for user behavior
if (typeof window !== 'undefined') {
    exports.resourceHintsManager.optimizeForUserBehavior();
    // Send metrics periodically
    setInterval(function () {
        exports.resourceHintsManager.sendMetricsToAnalytics();
    }, 60000); // Every minute
}
// Development helper
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.__resourceHints = exports.resourceHintsManager;
}
