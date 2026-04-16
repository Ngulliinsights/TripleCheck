"use strict";
/**
 * Performance optimization utilities for Core Web Vitals improvement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.measureWebVitals = exports.initializePerformanceOptimizations = exports.preventLayoutShift = exports.optimizeImages = exports.prefetchDNS = exports.preloadCriticalResources = void 0;
// Critical resource preloading
var preloadCriticalResources = function () {
    var resources = [
        { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' },
        { href: '/images/logo.webp', as: 'image' },
    ];
    resources.forEach(function (resource) {
        var link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.href;
        link.as = resource.as;
        if (resource.type)
            link.type = resource.type;
        if (resource.as === 'font')
            link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    });
};
exports.preloadCriticalResources = preloadCriticalResources;
// DNS prefetch for external domains
var prefetchDNS = function () {
    var domains = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://api.example.com', // Replace with your API domain
    ];
    domains.forEach(function (domain) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
    });
};
exports.prefetchDNS = prefetchDNS;
// Optimize images for better LCP (non-intrusive approach)
var optimizeImages = function () {
    // Only add loading="lazy" to images that don't already have it set
    // and avoid modifying images that are already loaded to prevent flickering
    var images = document.querySelectorAll('img:not([loading]):not([data-optimized])');
    images.forEach(function (element, index) {
        var img = element;
        // Mark as optimized to prevent re-processing
        img.setAttribute('data-optimized', 'true');
        // First 3 images are likely above the fold - load immediately
        if (index > 2) {
            // Only set lazy loading if the image hasn't started loading yet
            if (!img.complete && !img.src) {
                img.setAttribute('loading', 'lazy');
            }
        }
    });
};
exports.optimizeImages = optimizeImages;
// Reduce layout shift by setting image dimensions (non-intrusive approach)
var preventLayoutShift = function () {
    // Only process images that haven't been processed yet and aren't already loaded
    var images = document.querySelectorAll('img:not([width]):not([height]):not([data-layout-optimized])');
    images.forEach(function (element) {
        var img = element;
        // Mark as processed to prevent re-processing
        img.setAttribute('data-layout-optimized', 'true');
        // Only apply aspect ratio if the image hasn't loaded yet to prevent flickering
        if (!img.complete && img.naturalWidth === 0) {
            // Use a more conservative approach - only set min-height to reserve space
            img.style.minHeight = '200px';
            img.style.backgroundColor = '#f3f4f6'; // Light gray placeholder
            // Remove placeholder styling once image loads
            img.addEventListener('load', function () {
                img.style.minHeight = '';
                img.style.backgroundColor = '';
            }, { once: true });
        }
    });
};
exports.preventLayoutShift = preventLayoutShift;
// Initialize all performance optimizations
var initializePerformanceOptimizations = function () {
    // Run immediately for critical resources
    (0, exports.preloadCriticalResources)();
    (0, exports.prefetchDNS)();
    // Run after DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            (0, exports.optimizeImages)();
            (0, exports.preventLayoutShift)();
        });
    }
    else {
        (0, exports.optimizeImages)();
        (0, exports.preventLayoutShift)();
    }
    // Run after page is fully loaded
    window.addEventListener('load', function () {
        // Additional optimizations after page load
        requestIdleCallback(function () {
            // Cleanup unused resources
            var unusedLinks = document.querySelectorAll('link[rel="preload"]:not([data-keep])');
            unusedLinks.forEach(function (link) {
                setTimeout(function () { return link.remove(); }, 5000); // Remove after 5 seconds
            });
        });
    });
};
exports.initializePerformanceOptimizations = initializePerformanceOptimizations;
// Web Vitals measurement and reporting (using basic implementation to avoid import issues)
var measureWebVitals = function () {
    if ('web-vitals' in window)
        return; // Already loaded
    // Use basic performance measurement to avoid import issues
    console.log('Using basic performance measurement (web-vitals package not required)');
    measureBasicWebVitals();
    // Mark as loaded to prevent multiple initializations
    window['web-vitals'] = true;
};
exports.measureWebVitals = measureWebVitals;
// Basic Web Vitals measurement without external dependencies
var measureBasicWebVitals = function () {
    if (!(window === null || window === void 0 ? void 0 : window.performance))
        return;
    // Measure basic performance metrics
    var sendBasicMetric = function (name, value) {
        console.log("Basic Web Vital - ".concat(name, ":"), value);
        // Send to Google Analytics if available
        if ('gtag' in window) {
            window.gtag('event', name, {
                event_category: 'Basic Web Vitals',
                value: Math.round(value),
                non_interaction: true,
            });
        }
    };
    // Measure First Contentful Paint (FCP)
    var paintEntries = performance.getEntriesByType('paint');
    var fcpEntry = paintEntries.find(function (entry) { return entry.name === 'first-contentful-paint'; });
    if (fcpEntry) {
        sendBasicMetric('FCP', fcpEntry.startTime);
    }
    // Measure Largest Contentful Paint (LCP) - basic approximation
    if ('PerformanceObserver' in window) {
        try {
            var observer_1 = new PerformanceObserver(function (list) {
                var entries = list.getEntries();
                var lastEntry = entries[entries.length - 1];
                if (lastEntry) {
                    sendBasicMetric('LCP', lastEntry.startTime);
                }
            });
            observer_1.observe({ entryTypes: ['largest-contentful-paint'] });
            // Stop observing after 10 seconds
            setTimeout(function () { return observer_1.disconnect(); }, 10000);
        }
        catch (error) {
            console.warn('Could not observe LCP:', error);
        }
    }
    // Measure Time to First Byte (TTFB)
    var navigationEntry = performance.getEntriesByType('navigation')[0];
    if (navigationEntry) {
        var ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        sendBasicMetric('TTFB', ttfb);
    }
    // Basic layout shift detection (simplified)
    if ('PerformanceObserver' in window) {
        try {
            var clsValue_1 = 0;
            var observer_2 = new PerformanceObserver(function (list) {
                for (var _i = 0, _a = list.getEntries(); _i < _a.length; _i++) {
                    var entry = _a[_i];
                    if (!entry.hadRecentInput) {
                        clsValue_1 += entry.value;
                    }
                }
            });
            observer_2.observe({ entryTypes: ['layout-shift'] });
            // Report CLS after 5 seconds
            setTimeout(function () {
                sendBasicMetric('CLS', clsValue_1);
                observer_2.disconnect();
            }, 5000);
        }
        catch (error) {
            console.warn('Could not observe CLS:', error);
        }
    }
};
