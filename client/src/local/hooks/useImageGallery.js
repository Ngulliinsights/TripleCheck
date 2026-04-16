"use strict";
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
exports.useImageGallery = useImageGallery;
var react_1 = require("react");
/**
 * Enhanced shared hook for managing image gallery functionality
 * Provides comprehensive image gallery management with preloading, analytics, and accessibility
 * Used by PropertyCard, EnhancedLandCard, and other image-displaying components
 *
 * @param options - Configuration options for the image gallery
 * @returns Gallery state and control functions
 */
function useImageGallery(_a) {
    var property = _a.property, images = _a.images, _b = _a.enableNavigation, enableNavigation = _b === void 0 ? true : _b, _c = _a.enableFullscreen, enableFullscreen = _c === void 0 ? true : _c, _d = _a.preloadAdjacent, preloadAdjacent = _d === void 0 ? true : _d, onImageChange = _a.onImageChange, onGalleryOpen = _a.onGalleryOpen, onGalleryClose = _a.onGalleryClose, _e = _a.placeholderImage, placeholderImage = _e === void 0 ? "/placeholder-property.jpg" : _e;
    // Clamp initial index to valid range to prevent out-of-bounds issues
    var _f = (0, react_1.useState)(function () {
        return Math.max(0, Math.min(0, images.length - 1));
    }), currentIndex = _f[0], setCurrentIndex = _f[1];
    var _g = (0, react_1.useState)(false), showGallery = _g[0], setShowGallery = _g[1];
    var _h = (0, react_1.useState)(new Set()), loadingImages = _h[0], setLoadingImages = _h[1];
    // Use ref to track preloaded images and prevent duplicate requests
    var preloadedImages = (0, react_1.useRef)(new Set());
    // Ensure current index stays within valid bounds when images array changes
    (0, react_1.useEffect)(function () {
        if (images.length === 0) {
            setCurrentIndex(0);
        }
        else if (currentIndex >= images.length) {
            // If current index is out of bounds, move to last available image
            var newIndex = images.length - 1;
            setCurrentIndex(newIndex);
            onImageChange === null || onImageChange === void 0 ? void 0 : onImageChange(newIndex, images[newIndex] || placeholderImage);
        }
    }, [images.length, currentIndex, onImageChange, placeholderImage]);
    // Memoized computed values for better performance
    var computedValues = (0, react_1.useMemo)(function () { return ({
        canNavigate: enableNavigation && images.length > 1,
        hasMultipleImages: images.length > 1,
        imageCount: images.length,
        hasNext: currentIndex < images.length - 1,
        hasPrevious: currentIndex > 0,
    }); }, [enableNavigation, images.length, currentIndex]);
    // Memoized gallery images with enhanced metadata generation
    var galleryImages = (0, react_1.useMemo)(function () {
        return images.map(function (src, index) { return ({
            id: "".concat(property.id, "-").concat(index),
            src: src,
            alt: "".concat(property.title, " - Image ").concat(index + 1, " of ").concat(images.length),
            category: property.type || property.category,
            caption: index === 0 ? "Primary view" : "View ".concat(index + 1),
        }); });
    }, [images, property.id, property.title, property.type, property.category]);
    // Get current image with enhanced error handling
    var currentImage = (0, react_1.useMemo)(function () {
        // Handle empty images array
        if (images.length === 0)
            return placeholderImage;
        // Clamp currentIndex to valid range as safety net
        var safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
        var image = images[safeIndex];
        // Return placeholder if image URL is falsy (empty string, null, undefined)
        return image || placeholderImage;
    }, [currentIndex, images, placeholderImage]);
    // Optimized image preloading with duplicate prevention and error handling
    var preloadImage = (0, react_1.useCallback)(function (index) {
        // Validate index bounds
        if (index < 0 || index >= images.length)
            return;
        var imageUrl = images[index];
        if (!imageUrl || preloadedImages.current.has(imageUrl))
            return;
        // Mark as being preloaded to prevent duplicates
        preloadedImages.current.add(imageUrl);
        setLoadingImages(function (prev) { return new Set(prev).add(index); });
        var img = new Image();
        var cleanup = function () {
            setLoadingImages(function (prev) {
                var newSet = new Set(prev);
                newSet.delete(index);
                return newSet;
            });
        };
        img.onload = cleanup;
        img.onerror = function () {
            // Remove from preloaded set on error so it can be retried
            preloadedImages.current.delete(imageUrl);
            cleanup();
        };
        img.src = imageUrl;
    }, [images]);
    // Memoized loading state checker
    var isImageLoading = (0, react_1.useCallback)(function (index) {
        return loadingImages.has(index);
    }, [loadingImages]);
    // Centralized index change handler for consistency
    var handleIndexChange = (0, react_1.useCallback)(function (newIndex, triggerCallback) {
        if (triggerCallback === void 0) { triggerCallback = true; }
        if (newIndex >= 0 && newIndex < images.length && newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
            if (triggerCallback) {
                onImageChange === null || onImageChange === void 0 ? void 0 : onImageChange(newIndex, images[newIndex] || placeholderImage);
            }
        }
    }, [images, currentIndex, onImageChange, placeholderImage]);
    // Enhanced navigation functions with improved logic
    var navigateToImage = (0, react_1.useCallback)(function (index) {
        if (computedValues.canNavigate) {
            handleIndexChange(index);
        }
    }, [computedValues.canNavigate, handleIndexChange]);
    var nextImage = (0, react_1.useCallback)(function () {
        if (computedValues.canNavigate && computedValues.hasNext) {
            handleIndexChange(currentIndex + 1);
        }
    }, [computedValues.canNavigate, computedValues.hasNext, currentIndex, handleIndexChange]);
    var previousImage = (0, react_1.useCallback)(function () {
        if (computedValues.canNavigate && computedValues.hasPrevious) {
            handleIndexChange(currentIndex - 1);
        }
    }, [computedValues.canNavigate, computedValues.hasPrevious, currentIndex, handleIndexChange]);
    // Preload adjacent images effect with improved dependency management
    (0, react_1.useEffect)(function () {
        if (!preloadAdjacent || !computedValues.canNavigate)
            return;
        // Preload current image first if not already loaded
        preloadImage(currentIndex);
        // Then preload adjacent images
        if (computedValues.hasNext) {
            preloadImage(currentIndex + 1);
        }
        if (computedValues.hasPrevious) {
            preloadImage(currentIndex - 1);
        }
    }, [currentIndex, preloadAdjacent, computedValues.canNavigate, computedValues.hasNext, computedValues.hasPrevious, preloadImage]);
    // Enhanced gallery modal controls
    var openGallery = (0, react_1.useCallback)(function () {
        if (enableFullscreen) {
            setShowGallery(true);
            onGalleryOpen === null || onGalleryOpen === void 0 ? void 0 : onGalleryOpen();
        }
    }, [enableFullscreen, onGalleryOpen]);
    var closeGallery = (0, react_1.useCallback)(function () {
        setShowGallery(false);
        onGalleryClose === null || onGalleryClose === void 0 ? void 0 : onGalleryClose();
    }, [onGalleryClose]);
    // Simplified setCurrentIndex that uses the centralized handler
    var setCurrentIndexSafe = (0, react_1.useCallback)(function (index) {
        handleIndexChange(index);
    }, [handleIndexChange]);
    // Clean up preloaded images ref when component unmounts or images change
    (0, react_1.useEffect)(function () {
        return function () {
            preloadedImages.current.clear();
        };
    }, [images]);
    return __assign(__assign({ currentIndex: currentIndex, currentImage: currentImage, galleryImages: galleryImages, showGallery: showGallery }, computedValues), { // Spread computed values for cleaner return
        navigateToImage: navigateToImage, nextImage: nextImage, previousImage: previousImage, openGallery: openGallery, closeGallery: closeGallery, setCurrentIndex: setCurrentIndexSafe, preloadImage: preloadImage, isImageLoading: isImageLoading });
}
exports.default = useImageGallery;
