"use strict";
/**
 * Image Gallery - Main Export
 *
 * This file now re-exports from the refactored modular gallery system.
 * The monolithic implementation has been split into maintainable modules:
 *
 * - gallery/types.ts - Type definitions
 * - gallery/constants.ts - Configuration constants
 * - gallery/utils.ts - Utility functions
 * - gallery/ValidationService.ts - Image validation logic
 * - gallery/useImageSearch.ts - Search and filtering hook
 * - gallery/LazyImage.tsx - Lazy loading component
 * - gallery/ImageGallery.tsx - Main component
 * - gallery/SimpleGallery.tsx - Basic gallery view
 * - gallery/AdvancedGallery.tsx - Feature-rich gallery view
 *
 * For implementation details, see the gallery/ subdirectory.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageGallery = exports.default = void 0;
__exportStar(require("./gallery"), exports);
var ImageGallery_1 = require("./gallery/ImageGallery");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return ImageGallery_1.default; } });
// Backward compatibility
var ImageGallery_2 = require("./gallery/ImageGallery");
Object.defineProperty(exports, "ImageGallery", { enumerable: true, get: function () { return ImageGallery_2.default; } });
