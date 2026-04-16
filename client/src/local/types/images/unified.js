"use strict";
/**
 * Unified Image Type System - Optimized Version
 * Consolidates BaseImage, GalleryImage, PropertyImage, and EnterpriseImage
 * with improved type safety and performance optimizations
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
exports.createBaseImage = createBaseImage;
exports.createPropertyImage = createPropertyImage;
exports.createEnterpriseImage = createEnterpriseImage;
exports.hasUploadCapabilities = hasUploadCapabilities;
exports.hasEnterpriseFeatures = hasEnterpriseFeatures;
exports.hasCollaborationFeatures = hasCollaborationFeatures;
exports.isPropertyImage = isPropertyImage;
exports.isUploading = isUploading;
exports.isProcessing = isProcessing;
exports.isComplete = isComplete;
exports.isFailed = isFailed;
exports.toBaseImage = toBaseImage;
exports.toPropertyImage = toPropertyImage;
exports.toEnterpriseImage = toEnterpriseImage;
exports.validateUnifiedImage = validateUnifiedImage;
exports.convertBaseImageToUnified = convertBaseImageToUnified;
exports.convertPropertyImageToUnified = convertPropertyImageToUnified;
exports.convertEnterpriseImageToUnified = convertEnterpriseImageToUnified;
exports.getImageSrc = getImageSrc;
exports.getImageAlt = getImageAlt;
exports.getImageDisplayName = getImageDisplayName;
exports.isImageUploading = isImageUploading;
exports.isImageProcessing = isImageProcessing;
exports.isImageComplete = isImageComplete;
exports.isImageFailed = isImageFailed;
exports.getImageStatusColor = getImageStatusColor;
exports.getApprovalStatusColor = getApprovalStatusColor;
exports.hasWorkflowFeatures = hasWorkflowFeatures;
// Improved ID generation using crypto.randomUUID when available
function generateImageId() {
    // Use crypto.randomUUID if available (more secure than Math.random)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return "img_".concat(crypto.randomUUID());
    }
    // Fallback to timestamp + random string (avoiding deprecated substr)
    var timestamp = Date.now();
    var randomStr = Math.random().toString(36).substring(2, 11); // Fixed: using substring instead of substr
    return "img_".concat(timestamp, "_").concat(randomStr);
}
// Factory functions for creating different image types
function createBaseImage(input) {
    var _a, _b, _c, _d, _e, _f;
    var id = (_a = input.id) !== null && _a !== void 0 ? _a : generateImageId();
    return {
        id: id,
        src: (_b = input.src) !== null && _b !== void 0 ? _b : undefined, // Explicit undefined for exactOptionalPropertyTypes
        alt: (_c = input.alt) !== null && _c !== void 0 ? _c : undefined,
        category: (_d = input.category) !== null && _d !== void 0 ? _d : undefined,
        caption: (_e = input.caption) !== null && _e !== void 0 ? _e : undefined,
        file: (_f = input.file) !== null && _f !== void 0 ? _f : undefined,
        preview: input.file ? URL.createObjectURL(input.file) : undefined,
        status: "pending",
        progress: 0,
    }; // Using satisfies for better type checking
}
function createPropertyImage(input) {
    var _a, _b, _c, _d;
    var baseImage = createBaseImage(input);
    return __assign(__assign({}, baseImage), { documentType: (_a = input.documentType) !== null && _a !== void 0 ? _a : "property_photo", landVerificationId: (_b = input.landVerificationId) !== null && _b !== void 0 ? _b : undefined, uploadDate: new Date(), fileSize: (_d = (_c = input.file) === null || _c === void 0 ? void 0 : _c.size) !== null && _d !== void 0 ? _d : undefined, dimensions: undefined, approvalStatus: "pending", workflowStatus: "draft" });
}
function createEnterpriseImage(input) {
    var _a, _b;
    var propertyImage = createPropertyImage(input);
    return __assign(__assign({}, propertyImage), { tags: (_a = input.tags) !== null && _a !== void 0 ? _a : [], collections: (_b = input.collections) !== null && _b !== void 0 ? _b : [], usage: 0, rating: 0, version: 1, comments: [], annotations: [], aiTags: [] });
}
// Type guards with improved performance
function hasUploadCapabilities(image) {
    return Boolean(image.file) || Boolean(image.chunks);
}
function hasEnterpriseFeatures(image) {
    return Boolean(image.approvalStatus ||
        image.tags ||
        image.collections);
}
function hasCollaborationFeatures(image) {
    return Boolean(image.comments ||
        image.annotations ||
        image.assignedTo);
}
function isPropertyImage(image) {
    return Boolean(image.documentType || image.landVerificationId);
}
function isUploading(image) {
    return image.status === "uploading";
}
function isProcessing(image) {
    return image.status === "pending" || image.status === "uploading";
}
function isComplete(image) {
    return image.status === "completed";
}
function isFailed(image) {
    return image.status === "error";
}
// Conversion utilities for backward compatibility
function toBaseImage(image) {
    var id = image.id, src = image.src, alt = image.alt, category = image.category, caption = image.caption, file = image.file, preview = image.preview, status = image.status, progress = image.progress;
    return { id: id, src: src, alt: alt, category: category, caption: caption, file: file, preview: preview, status: status, progress: progress };
}
function toPropertyImage(image) {
    return image; // PropertyImage is now just UnifiedImage
}
function toEnterpriseImage(image) {
    return image; // EnterpriseImage is now just UnifiedImage
}
// Optimized validation with reduced cognitive complexity
function validateUnifiedImage(image) {
    var validationState = {
        errors: [],
        warnings: [],
    };
    // Split validation into smaller functions for better maintainability
    validateRequiredFields(image, validationState);
    validateSourceFields(image, validationState);
    validateFileProperties(image, validationState);
    validateAccessibility(image, validationState);
    validateEnterpriseFeatures(image, validationState);
    var errors = validationState.errors, warnings = validationState.warnings;
    // Simplified score calculation
    var score = calculateValidationScore(errors.length, warnings.length);
    return {
        isValid: errors.length === 0,
        errors: Object.freeze(errors), // Make immutable
        warnings: Object.freeze(warnings),
        score: score,
    };
}
// Helper functions for validation (reduces cognitive complexity)
function validateRequiredFields(image, state) {
    if (!image.id) {
        state.errors.push("Image ID is required");
    }
}
function validateSourceFields(image, state) {
    if (!image.src && !image.file && !image.preview) {
        state.errors.push("Image must have a source (src, file, or preview)");
    }
}
function validateFileProperties(image, state) {
    var MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB constant
    if (image.file && image.file.size > MAX_FILE_SIZE) {
        state.warnings.push("Large file size may affect performance");
    }
}
function validateAccessibility(image, state) {
    var _a;
    if (!image.alt && !((_a = image.file) === null || _a === void 0 ? void 0 : _a.name)) {
        state.warnings.push("Alt text is recommended for accessibility");
    }
}
function validateEnterpriseFeatures(image, state) {
    if (!hasEnterpriseFeatures(image))
        return;
    var validApprovalStatuses = ["pending", "approved", "rejected", "needs_revision"];
    if (image.approvalStatus && !validApprovalStatuses.includes(image.approvalStatus)) {
        state.errors.push("Invalid approval status");
    }
    if (image.rating !== undefined && (image.rating < 0 || image.rating > 5)) {
        state.errors.push("Rating must be between 0 and 5");
    }
}
// Extracted score calculation (removes nested ternary)
function calculateValidationScore(errorCount, warningCount) {
    if (errorCount > 0)
        return 0;
    if (warningCount === 0)
        return 100;
    return 80;
}
// Conversion utilities for backward compatibility
function convertBaseImageToUnified(image) {
    return image; // BaseImage is now just UnifiedImage
}
function convertPropertyImageToUnified(image) {
    return image; // PropertyImage is now just UnifiedImage
}
function convertEnterpriseImageToUnified(image) {
    return image; // EnterpriseImage is now just UnifiedImage
}
// Utility function aliases for convenience
function getImageSrc(image) {
    var _a, _b, _c;
    return ((_c = (_b = (_a = image.src) !== null && _a !== void 0 ? _a : image.preview) !== null && _b !== void 0 ? _b : (image.file && URL.createObjectURL(image.file))) !== null && _c !== void 0 ? _c : "/placeholder-property.jpg");
}
function getImageAlt(image) {
    var _a, _b, _c;
    return (_c = (_a = image.alt) !== null && _a !== void 0 ? _a : (_b = image.file) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : "Gallery image";
}
function getImageDisplayName(image) {
    var _a, _b, _c, _d;
    return (_d = (_b = (_a = image.caption) !== null && _a !== void 0 ? _a : image.alt) !== null && _b !== void 0 ? _b : (_c = image.file) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : "Image ".concat(image.id);
}
function isImageUploading(image) {
    return image.status === "uploading";
}
function isImageProcessing(image) {
    return image.status === "pending" || image.status === "uploading";
}
function isImageComplete(image) {
    return image.status === "completed";
}
function isImageFailed(image) {
    return image.status === "error";
}
// Improved status color mapping with type safety
var STATUS_COLORS = {
    pending: "bg-yellow-500",
    uploading: "bg-blue-500",
    completed: "bg-green-500",
    error: "bg-red-500",
    processing: "bg-purple-500",
    paused: "bg-orange-500",
};
function getImageStatusColor(status) {
    var _a;
    if (!status)
        return "bg-gray-500";
    return (_a = STATUS_COLORS[status]) !== null && _a !== void 0 ? _a : "bg-gray-500"; // Safe object access
}
var APPROVAL_STATUS_COLORS = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    needs_revision: "bg-orange-100 text-orange-800 border-orange-200",
};
function getApprovalStatusColor(status) {
    var _a;
    var defaultColor = "bg-gray-100 text-gray-800 border-gray-200";
    if (!status)
        return defaultColor;
    return (_a = APPROVAL_STATUS_COLORS[status]) !== null && _a !== void 0 ? _a : defaultColor; // Safe object access
}
function hasWorkflowFeatures(image) {
    return Boolean(image.workflowStatus ||
        image.chunks ||
        image.sessionId);
}
