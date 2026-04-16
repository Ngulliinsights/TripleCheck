"use strict";
/**
 * Centralized Image Types
 *
 * This file consolidates all image-related types to ensure consistency
 * across the image management system and prevent circular dependencies.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.DOCUMENT_VALIDATION_PROFILES = exports.PROCESSING_STEPS_ORDER = exports.ImageProcessingError = void 0;
// Export unified types (new consolidated approach)
__exportStar(require("./unified"), exports);
// Error classes
var ImageProcessingError = /** @class */ (function (_super) {
    __extends(ImageProcessingError, _super);
    function ImageProcessingError(message, code, imageId, step, retryable) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.imageId = imageId;
        _this.step = step;
        _this.retryable = retryable;
        _this.name = 'ImageProcessingError';
        return _this;
    }
    return ImageProcessingError;
}(Error));
exports.ImageProcessingError = ImageProcessingError;
// Constants
exports.PROCESSING_STEPS_ORDER = [
    'validation',
    'virus_scan',
    'metadata_extraction',
    'compliance_check',
    'document_auth',
    'fraud_detection',
    'image_optimization',
    'thumbnail_generation'
];
exports.DOCUMENT_VALIDATION_PROFILES = {
    property_photo: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
        minWidth: 800,
        minHeight: 600,
        requireGeoLocation: true,
    },
    title_deed: {
        maxFileSize: 20 * 1024 * 1024, // 20MB
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        minWidth: 1200,
        minHeight: 1600,
    },
    survey_plan: {
        maxFileSize: 30 * 1024 * 1024, // 30MB
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png', 'tiff'],
        minWidth: 1500,
        minHeight: 1000,
    },
    valuation_report: {
        maxFileSize: 15 * 1024 * 1024, // 15MB
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    },
    identification_document: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
        minWidth: 600,
        minHeight: 400,
    },
    other_document: {
        maxFileSize: 25 * 1024 * 1024, // 25MB
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png', 'tiff'],
    },
};
