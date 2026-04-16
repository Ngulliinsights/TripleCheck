"use strict";
/**
 * Bundle size optimization utilities
 * Helps reduce the initial bundle size and improve loading performance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeBundleOptimizations = exports.removeUnusedCode = exports.optimizeImages = exports.optimizeFonts = exports.optimizeImports = exports.loadHeavyLibraries = void 0;
// Dynamic imports for heavy libraries (only import what exists)
exports.loadHeavyLibraries = {
    // Load chart libraries only when needed
    charts: function () { return Promise.resolve().then(function () { return require('recharts'); }).catch(function () { return null; }); },
    // Load date libraries only when needed
    dateFns: function () { return Promise.resolve().then(function () { return require('date-fns'); }).catch(function () { return null; }); },
    // Load animation libraries only when needed
    framerMotion: function () { return Promise.resolve().then(function () { return require('framer-motion'); }).catch(function () { return null; }); },
    // These are commented out since they're not installed
    // richTextEditor: () => import('@tiptap/react').catch(() => null),
    // pdfViewer: () => import('react-pdf').catch(() => null),
};
// Tree-shake unused utilities
var optimizeImports = function () {
    // Remove unused CSS classes at runtime (development only)
    if (process.env.NODE_ENV === 'development') {
        var unusedClasses = findUnusedCSSClasses();
        console.log('Unused CSS classes detected:', unusedClasses.length);
    }
};
exports.optimizeImports = optimizeImports;
// Find unused CSS classes (development helper)
var findUnusedCSSClasses = function () {
    var allClasses = Array.from(document.styleSheets)
        .flatMap(function (sheet) {
        try {
            return Array.from(sheet.cssRules);
        }
        catch (_a) {
            return [];
        }
    })
        .filter(function (rule) { return rule.type === CSSRule.STYLE_RULE; })
        .map(function (rule) { return rule.selectorText; })
        .filter(Boolean);
    var usedClasses = Array.from(document.querySelectorAll('*'))
        .flatMap(function (el) { return Array.from(el.classList); });
    return allClasses.filter(function (className) {
        return !usedClasses.some(function (used) { return className.includes(used); });
    });
};
// Optimize font loading
var optimizeFonts = function () {
    // Preload critical fonts
    var criticalFonts = [
        '/fonts/inter-var.woff2',
    ];
    criticalFonts.forEach(function (fontUrl) {
        var link = document.createElement('link');
        link.rel = 'preload';
        link.href = fontUrl;
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    });
    // Use font-display: swap for better performance
    var style = document.createElement('style');
    style.textContent = "\n    @font-face {\n      font-family: 'Inter';\n      font-style: normal;\n      font-weight: 100 900;\n      font-display: swap;\n      src: url('/fonts/inter-var.woff2') format('woff2');\n    }\n  ";
    document.head.appendChild(style);
};
exports.optimizeFonts = optimizeFonts;
// Optimize images (disabled dynamic WebP conversion to prevent flickering)
var optimizeImages = function () {
    // Add loading="lazy" to images below the fold to improve performance
    var images = document.querySelectorAll('img:not([loading])');
    images.forEach(function (img, index) {
        // First 3 images are likely above the fold - load immediately
        if (index > 2) {
            img.setAttribute('loading', 'lazy');
        }
        // Add proper alt text if missing (accessibility)
        if (!img.getAttribute('alt')) {
            img.setAttribute('alt', 'Property image');
        }
    });
    // Note: WebP conversion disabled to prevent image flickering
    // Instead, serve WebP images directly from your image pipeline/CDN
};
exports.optimizeImages = optimizeImages;
// Remove unused code (development helper)
var removeUnusedCode = function () {
    if (process.env.NODE_ENV !== 'development')
        return;
    // Log potential optimizations
    console.group('Bundle Optimization Suggestions');
    // Check for unused imports
    var scripts = Array.from(document.querySelectorAll('script[src]'));
    var unusedScripts = scripts.filter(function (script) {
        var src = script.getAttribute('src');
        return src && !src.includes('main') && !src.includes('vendor');
    });
    if (unusedScripts.length > 0) {
        console.log('Potentially unused scripts:', unusedScripts.length);
    }
    // Check bundle size
    var totalScriptSize = scripts.reduce(function (total, script) {
        var src = script.getAttribute('src');
        if (src && src.startsWith('/')) {
            // Estimate size based on filename patterns
            if (src.includes('vendor'))
                return total + 100; // ~100KB
            if (src.includes('main'))
                return total + 50; // ~50KB
            return total + 10; // ~10KB for other scripts
        }
        return total;
    }, 0);
    console.log("Estimated total bundle size: ~".concat(totalScriptSize, "KB"));
    if (totalScriptSize > 200) {
        console.warn('Bundle size is large. Consider code splitting.');
    }
    console.groupEnd();
};
exports.removeUnusedCode = removeUnusedCode;
// Initialize all bundle optimizations
var initializeBundleOptimizations = function () {
    // Run immediately
    (0, exports.optimizeFonts)();
    // Run after DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            (0, exports.optimizeImages)();
            (0, exports.optimizeImports)();
            (0, exports.removeUnusedCode)();
        });
    }
    else {
        (0, exports.optimizeImages)();
        (0, exports.optimizeImports)();
        (0, exports.removeUnusedCode)();
    }
};
exports.initializeBundleOptimizations = initializeBundleOptimizations;
