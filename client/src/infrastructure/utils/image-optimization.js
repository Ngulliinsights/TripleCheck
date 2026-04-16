"use strict";
/**
 * IMAGE OPTIMIZATION UTILITIES
 * ============================
 *
 * Utilities for responsive image srcset generation, blur placeholder creation,
 * format detection, and advanced image optimization techniques.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BREAKPOINTS = void 0;
exports.generateResponsiveSrcSet = generateResponsiveSrcSet;
exports.generateBlurPlaceholder = generateBlurPlaceholder;
exports.detectImageFormat = detectImageFormat;
exports.calculateOptimalDimensions = calculateOptimalDimensions;
exports.generateSizesAttribute = generateSizesAttribute;
exports.preloadCriticalImages = preloadCriticalImages;
exports.createLazyImageLoader = createLazyImageLoader;
/**
 * Default responsive breakpoints for image optimization
 */
exports.DEFAULT_BREAKPOINTS = [
    { width: 320, condition: '(max-width: 320px)' },
    { width: 640, condition: '(max-width: 640px)' },
    { width: 768, condition: '(max-width: 768px)' },
    { width: 1024, condition: '(max-width: 1024px)' },
    { width: 1280, condition: '(max-width: 1280px)' },
    { width: 1536, condition: '(max-width: 1536px)' },
    { width: 1920 }
];
/**
 * Generate responsive srcSet for different screen sizes and densities
 */
function generateResponsiveSrcSet(baseSrc, options) {
    if (options === void 0) { options = {}; }
    var _a = options.breakpoints, breakpoints = _a === void 0 ? exports.DEFAULT_BREAKPOINTS : _a, _b = options.formats, formats = _b === void 0 ? ['webp', 'jpg'] : _b, _c = options.quality, quality = _c === void 0 ? 80 : _c, _d = options.baseUrl, baseUrl = _d === void 0 ? '' : _d;
    var sources = [];
    // Generate sources for each format
    formats.forEach(function (format) {
        var srcSetEntries = [];
        var sizesEntries = [];
        breakpoints.forEach(function (breakpoint) {
            var width = breakpoint.width, _a = breakpoint.density, density = _a === void 0 ? 1 : _a, condition = breakpoint.condition;
            // Generate URL with parameters
            var url = generateOptimizedUrl(baseSrc, {
                width: width * density,
                quality: quality,
                format: format,
                baseUrl: baseUrl
            });
            srcSetEntries.push("".concat(url, " ").concat(width, "w"));
            if (condition) {
                sizesEntries.push("".concat(condition, " ").concat(width, "px"));
            }
        });
        // Add default size
        sizesEntries.push('100vw');
        sources.push({
            srcSet: srcSetEntries.join(', '),
            type: getMimeType(format),
            sizes: sizesEntries.join(', ')
        });
    });
    // Generate fallback srcSet (usually JPG)
    var fallbackFormat = formats.includes('jpg') ? 'jpg' : formats[formats.length - 1];
    var fallbackSrcSet = breakpoints
        .map(function (bp) {
        var url = generateOptimizedUrl(baseSrc, {
            width: bp.width,
            quality: quality,
            format: fallbackFormat,
            baseUrl: baseUrl
        });
        return "".concat(url, " ").concat(bp.width, "w");
    })
        .join(', ');
    var sizes = breakpoints
        .filter(function (bp) { return bp.condition; })
        .map(function (bp) { return "".concat(bp.condition, " ").concat(bp.width, "px"); })
        .concat(['100vw'])
        .join(', ');
    return {
        srcSet: fallbackSrcSet,
        sizes: sizes,
        sources: sources
    };
}
/**
 * Generate optimized image URL with parameters
 */
function generateOptimizedUrl(baseSrc, options) {
    var width = options.width, height = options.height, quality = options.quality, format = options.format, _a = options.baseUrl, baseUrl = _a === void 0 ? '' : _a;
    // If using a CDN or image service, construct URL with parameters
    if (baseUrl && (baseUrl.includes('cloudinary') || baseUrl.includes('imagekit') || baseUrl.includes('vercel'))) {
        var params = new URLSearchParams();
        if (width)
            params.set('w', width.toString());
        if (height)
            params.set('h', height.toString());
        if (quality)
            params.set('q', quality.toString());
        if (format)
            params.set('f', format);
        return "".concat(baseUrl).concat(baseSrc, "?").concat(params.toString());
    }
    // For local images, return as-is (would need server-side processing)
    return baseSrc;
}
/**
 * Generate blur-up placeholder using canvas
 */
function generateBlurPlaceholder(imageSrc, options) {
    if (options === void 0) { options = {}; }
    var _a = options.width, width = _a === void 0 ? 40 : _a, _b = options.height, height = _b === void 0 ? 40 : _b, _c = options.quality, quality = _c === void 0 ? 10 : _c, _d = options.format, format = _d === void 0 ? 'webp' : _d;
    return new Promise(function (resolve, reject) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            try {
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }
                // Set small canvas size for blur effect
                canvas.width = width;
                canvas.height = height;
                // Draw image scaled down
                ctx.drawImage(img, 0, 0, width, height);
                // Apply blur filter
                ctx.filter = 'blur(2px)';
                ctx.drawImage(canvas, 0, 0);
                // Convert to base64 data URL
                var mimeType = getMimeType(format);
                var dataUrl = canvas.toDataURL(mimeType, quality / 100);
                resolve(dataUrl);
            }
            catch (error) {
                reject(error);
            }
        };
        img.onerror = function () {
            reject(new Error("Failed to load image for blur placeholder: ".concat(imageSrc)));
        };
        img.src = imageSrc;
    });
}
/**
 * Detect browser support for modern image formats
 */
function detectImageFormat() {
    return Promise.all([
        checkWebPSupport(),
        checkAVIFSupport(),
        checkHEICSupport()
    ]).then(function (_a) {
        var webp = _a[0], avif = _a[1], heic = _a[2];
        return ({
            webp: webp,
            avif: avif,
            heic: heic
        });
    });
}
/**
 * Check WebP support
 */
function checkWebPSupport() {
    return new Promise(function (resolve) {
        var webP = new Image();
        webP.onload = webP.onerror = function () {
            resolve(webP.height === 2);
        };
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
}
/**
 * Check AVIF support
 */
function checkAVIFSupport() {
    return new Promise(function (resolve) {
        var avif = new Image();
        avif.onload = avif.onerror = function () {
            resolve(avif.height === 2);
        };
        avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
}
/**
 * Check HEIC support (mainly for Safari)
 */
function checkHEICSupport() {
    return new Promise(function (resolve) {
        // HEIC support is mainly in Safari and requires specific conditions
        var isApple = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);
        var isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        // Simple heuristic - could be enhanced with actual format testing
        resolve(isApple && isSafari);
    });
}
/**
 * Get MIME type for image format
 */
function getMimeType(format) {
    var mimeTypes = {
        webp: 'image/webp',
        avif: 'image/avif',
        heic: 'image/heic',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        svg: 'image/svg+xml'
    };
    return mimeTypes[format.toLowerCase()] || 'image/jpeg';
}
/**
 * Calculate optimal image dimensions based on container and DPR
 */
function calculateOptimalDimensions(containerWidth, containerHeight, devicePixelRatio) {
    if (devicePixelRatio === void 0) { devicePixelRatio = window.devicePixelRatio || 1; }
    return {
        width: Math.ceil(containerWidth * devicePixelRatio),
        height: Math.ceil(containerHeight * devicePixelRatio)
    };
}
/**
 * Generate sizes attribute for responsive images
 */
function generateSizesAttribute(breakpoints) {
    return breakpoints
        .filter(function (bp) { return bp.condition; })
        .map(function (bp) { return "".concat(bp.condition, " ").concat(bp.width, "px"); })
        .concat(['100vw'])
        .join(', ');
}
/**
 * Preload critical images with resource hints
 */
function preloadCriticalImages(images) {
    if (typeof document === 'undefined')
        return;
    images.forEach(function (_a) {
        var src = _a.src, type = _a.type, media = _a.media, crossOrigin = _a.crossOrigin;
        var link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        if (type)
            link.type = type;
        if (media)
            link.media = media;
        if (crossOrigin)
            link.crossOrigin = crossOrigin;
        document.head.appendChild(link);
    });
}
/**
 * Lazy load image with intersection observer
 */
function createLazyImageLoader(threshold, rootMargin) {
    if (threshold === void 0) { threshold = 0.1; }
    if (rootMargin === void 0) { rootMargin = '50px'; }
    if (!(window === null || window === void 0 ? void 0 : window.IntersectionObserver)) {
        return null;
    }
    return new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var img = entry.target;
                var src = img.dataset.src;
                var srcSet = img.dataset.srcset;
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                }
                if (srcSet) {
                    img.srcset = srcSet;
                    img.removeAttribute('data-srcset');
                }
                img.classList.remove('lazy');
                img.classList.add('loaded');
            }
        });
    }, {
        threshold: threshold,
        rootMargin: rootMargin
    });
}
