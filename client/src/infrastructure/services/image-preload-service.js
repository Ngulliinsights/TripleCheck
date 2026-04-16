"use strict";
/**
 * IMAGE PRELOAD SERVICE
 * =====================
 *
 * Service for preloading critical above-fold images and managing image loading priorities.
 * Provides intelligent preloading strategies based on viewport and user behavior.
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
exports.preloadCriticalImages = exports.ImagePreloadServiceClass = exports.ImagePreloadService = void 0;
exports.useImagePreload = useImagePreload;
var ImagePreloadServiceClass = /** @class */ (function () {
    function ImagePreloadServiceClass() {
        this.preloadedImages = new Map();
        this.preloadQueue = [];
        this.isProcessingQueue = false;
        this.maxConcurrentPreloads = 3;
        this.currentPreloads = 0;
    }
    /**
     * Preload a single image with specified options
     */
    ImagePreloadServiceClass.prototype.preload = function (src_1) {
        return __awaiter(this, arguments, void 0, function (src, options) {
            var existing;
            var _this = this;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                existing = this.preloadedImages.get(src);
                if ((existing === null || existing === void 0 ? void 0 : existing.loaded) && existing.element) {
                    return [2 /*return*/, existing.element];
                }
                // Add to queue if we're at max concurrent preloads
                if (this.currentPreloads >= this.maxConcurrentPreloads) {
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            _this.preloadQueue.push({ src: src, options: options });
                            _this.processQueue();
                        })];
                }
                return [2 /*return*/, this.loadImage(src, options)];
            });
        });
    };
    /**
     * Preload multiple images with priority handling
     */
    ImagePreloadServiceClass.prototype.preloadBatch = function (images) {
        return __awaiter(this, void 0, void 0, function () {
            var sortedImages, promises;
            var _this = this;
            return __generator(this, function (_a) {
                sortedImages = images.sort(function (a, b) {
                    var _a, _b;
                    var priorityOrder = { high: 0, medium: 1, low: 2 };
                    var aPriority = priorityOrder[((_a = a.options) === null || _a === void 0 ? void 0 : _a.priority) || 'medium'];
                    var bPriority = priorityOrder[((_b = b.options) === null || _b === void 0 ? void 0 : _b.priority) || 'medium'];
                    return aPriority - bPriority;
                });
                promises = sortedImages.map(function (_a) {
                    var src = _a.src, _b = _a.options, options = _b === void 0 ? {} : _b;
                    return _this.preload(src, options);
                });
                return [2 /*return*/, Promise.all(promises)];
            });
        });
    };
    /**
     * Preload critical above-fold images
     */
    ImagePreloadServiceClass.prototype.preloadCritical = function (images) {
        var _this = this;
        images.forEach(function (src) {
            _this.preload(src, { priority: 'high' });
        });
    };
    /**
     * Check if an image is already preloaded
     */
    ImagePreloadServiceClass.prototype.isPreloaded = function (src) {
        var preloaded = this.preloadedImages.get(src);
        return (preloaded === null || preloaded === void 0 ? void 0 : preloaded.loaded) === true;
    };
    /**
     * Get preloaded image element
     */
    ImagePreloadServiceClass.prototype.getPreloadedImage = function (src) {
        var preloaded = this.preloadedImages.get(src);
        return (preloaded === null || preloaded === void 0 ? void 0 : preloaded.element) || null;
    };
    /**
     * Clear preload cache
     */
    ImagePreloadServiceClass.prototype.clearCache = function () {
        this.preloadedImages.clear();
        this.preloadQueue = [];
    };
    /**
     * Get preload statistics
     */
    ImagePreloadServiceClass.prototype.getStats = function () {
        var preloaded = Array.from(this.preloadedImages.values());
        return {
            totalPreloaded: preloaded.length,
            successfulPreloads: preloaded.filter(function (img) { return img.loaded; }).length,
            failedPreloads: preloaded.filter(function (img) { return img.error; }).length,
            queueLength: this.preloadQueue.length
        };
    };
    /**
     * Load a single image
     */
    ImagePreloadServiceClass.prototype.loadImage = function (src, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.currentPreloads++;
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var img = new Image();
                        // Set up image properties
                        if (options.crossOrigin) {
                            img.crossOrigin = options.crossOrigin;
                        }
                        if (options.sizes) {
                            img.sizes = options.sizes;
                        }
                        // Handle load success
                        img.onload = function () {
                            _this.preloadedImages.set(src, {
                                src: src,
                                loaded: true,
                                error: false,
                                element: img,
                                timestamp: Date.now()
                            });
                            _this.currentPreloads--;
                            _this.processQueue();
                            resolve(img);
                        };
                        // Handle load error
                        img.onerror = function () {
                            _this.preloadedImages.set(src, {
                                src: src,
                                loaded: false,
                                error: true,
                                timestamp: Date.now()
                            });
                            _this.currentPreloads--;
                            _this.processQueue();
                            reject(new Error("Failed to preload image: ".concat(src)));
                        };
                        // Start loading
                        img.src = src;
                    })];
            });
        });
    };
    /**
     * Process the preload queue
     */
    ImagePreloadServiceClass.prototype.processQueue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, src, options, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.isProcessingQueue || this.preloadQueue.length === 0) {
                            return [2 /*return*/];
                        }
                        this.isProcessingQueue = true;
                        _b.label = 1;
                    case 1:
                        if (!(this.preloadQueue.length > 0 && this.currentPreloads < this.maxConcurrentPreloads)) return [3 /*break*/, 6];
                        _a = this.preloadQueue.shift(), src = _a.src, options = _a.options;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.loadImage(src, options)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        console.warn('Image preload failed:', src, error_1);
                        return [3 /*break*/, 5];
                    case 5: return [3 /*break*/, 1];
                    case 6:
                        this.isProcessingQueue = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create resource hint link elements for preloading
     */
    ImagePreloadServiceClass.prototype.createResourceHints = function (images) {
        if (typeof document === 'undefined')
            return;
        images.forEach(function (_a) {
            var src = _a.src, _b = _a.options, options = _b === void 0 ? {} : _b;
            var link = document.createElement('link');
            link.rel = 'preload';
            link.as = options.as || 'image';
            link.href = src;
            if (options.type) {
                link.type = options.type;
            }
            if (options.crossOrigin) {
                link.crossOrigin = options.crossOrigin;
            }
            if (options.media) {
                link.media = options.media;
            }
            document.head.appendChild(link);
        });
    };
    /**
     * Preload critical images with resource hints
     * Consolidated from image-optimization.ts for better organization
     */
    ImagePreloadServiceClass.prototype.preloadCriticalImages = function (images) {
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
    };
    /**
     * Preload images based on viewport and connection speed
     */
    ImagePreloadServiceClass.prototype.intelligentPreload = function (images) {
        var _this = this;
        if (typeof navigator === 'undefined')
            return;
        // Check connection speed
        var connection = navigator.connection;
        var isSlowConnection = connection && (connection.effectiveType === 'slow-2g' ||
            connection.effectiveType === '2g' ||
            connection.saveData);
        // Reduce preloading on slow connections
        var imagesToPreload = isSlowConnection ? images.slice(0, 2) : images;
        imagesToPreload.forEach(function (src) {
            _this.preload(src, {
                priority: isSlowConnection ? 'low' : 'medium'
            });
        });
    };
    return ImagePreloadServiceClass;
}());
exports.ImagePreloadServiceClass = ImagePreloadServiceClass;
// Export singleton instance
exports.ImagePreloadService = new ImagePreloadServiceClass();
// Export standalone function for backward compatibility
exports.preloadCriticalImages = exports.ImagePreloadService.preloadCriticalImages.bind(exports.ImagePreloadService);
/**
 * React hook for using the image preload service
 */
function useImagePreload() {
    return {
        preload: exports.ImagePreloadService.preload.bind(exports.ImagePreloadService),
        preloadBatch: exports.ImagePreloadService.preloadBatch.bind(exports.ImagePreloadService),
        preloadCritical: exports.ImagePreloadService.preloadCritical.bind(exports.ImagePreloadService),
        isPreloaded: exports.ImagePreloadService.isPreloaded.bind(exports.ImagePreloadService),
        getPreloadedImage: exports.ImagePreloadService.getPreloadedImage.bind(exports.ImagePreloadService),
        getStats: exports.ImagePreloadService.getStats.bind(exports.ImagePreloadService)
    };
}
