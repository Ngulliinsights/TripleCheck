"use strict";
/**
 * Unified Image Utilities - Enhanced and Optimized
 *
 * This class consolidates all image-related utility functions from across your application.
 * It's designed as a comprehensive toolkit that handles everything from basic image display
 * to complex enterprise workflows, file processing, and data formatting.
 *
 * Key Design Principles:
 * - Static methods for stateless operations
 * - Defensive programming with null-safe operations
 * - Consistent formatting across the application
 * - Backward compatibility through individual exports
 * - Domain-specific customizations for Kenyan property management
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = exports.truncateText = exports.generateThumbnailFilename = exports.sanitizeFilename = exports.calculateHash = exports.generateUniqueId = exports.isDocumentFile = exports.isImageFile = exports.getFileExtension = exports.generateThumbnailUrl = exports.getAllowedFormats = exports.getMaxFileSize = exports.isValidFormat = exports.isValidFileSize = exports.getApprovalStats = exports.getUploadStats = exports.sortByUploadDate = exports.filterByStatus = exports.hasUploadCapabilities = exports.hasCollaborationFeatures = exports.hasEnterpriseFeatures = exports.isFailed = exports.isComplete = exports.isProcessing = exports.isUploading = exports.formatPropertyLocation = exports.formatCoordinates = exports.formatAspectRatio = exports.formatDimensions = exports.formatConfidence = exports.formatRiskScore = exports.formatWorkflowStatus = exports.formatProcessingStep = exports.formatApprovalStatus = exports.formatDocumentType = exports.formatTimestamp = exports.formatDate = exports.formatETA = exports.formatSpeed = exports.formatFileSize = exports.getRiskLevelColor = exports.getApprovalStatusColor = exports.getStatusColor = exports.getDisplayName = exports.getAlt = exports.getSrc = exports.ImageUtils = exports.RISK_LEVEL_COLORS = exports.APPROVAL_STATUS_COLORS = exports.STATUS_COLORS = void 0;
exports.hasMetadata = exports.hasValidationResult = exports.sortByRating = exports.sortByFileSize = exports.filterByDocumentType = exports.filterByApprovalStatus = exports.formatAuditEvent = exports.formatStorageClass = exports.formatPhoneNumber = void 0;
var imageServiceConfig;
try {
    imageServiceConfig = require("../../config/image-service.config");
}
catch (_a) {
    // Fallback configuration if module is not available
    imageServiceConfig = {
        upload: {
            maxFileSize: 10 * 1024 * 1024, // 10MB default
            allowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
        },
    };
}
// ============================================================================
// CONSTANTS AND TYPE DEFINITIONS
// ============================================================================
/**
 * Common default styling class used throughout the application for consistency
 */
var DEFAULT_GRAY_STYLE = "bg-gray-100 text-gray-800 border-gray-200";
/**
 * Maps image processing status to Tailwind CSS classes for consistent UI feedback.
 * These colors provide immediate visual context about upload and processing states.
 */
exports.STATUS_COLORS = {
    pending: "bg-yellow-500", // Waiting to start processing
    uploading: "bg-blue-500", // Currently uploading
    completed: "bg-green-500", // Successfully completed
    error: "bg-red-500", // Failed with error
    processing: "bg-purple-500", // Currently processing
    paused: "bg-orange-500", // Temporarily paused
};
/**
 * Enterprise approval workflow status colors with full styling classes.
 * Includes background, text, and border colors for complete component styling.
 */
exports.APPROVAL_STATUS_COLORS = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    needs_revision: "bg-orange-100 text-orange-800 border-orange-200",
};
/**
 * Risk assessment level colors for fraud detection and compliance features.
 * Critical levels use stronger colors to draw immediate attention.
 */
exports.RISK_LEVEL_COLORS = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-red-100 text-red-800 border-red-200",
    critical: "bg-red-200 text-red-900 border-red-300",
};
// ============================================================================
// MAIN UTILITY CLASS
// ============================================================================
/**
 * ImageUtils provides a comprehensive set of static methods for working with images
 * across all contexts in the application. This includes basic image operations,
 * file processing, enterprise workflows, and domain-specific formatting.
 */
var ImageUtils = /** @class */ (function () {
    function ImageUtils() {
    }
    // ==========================================================================
    // CORE IMAGE SOURCE MANAGEMENT
    // ==========================================================================
    /**
     * Intelligently determines the best source URL for displaying an image.
     * Falls back through multiple possible sources to ensure something is always displayed.
     *
     * @param image - The unified image object
     * @returns A valid URL string for image display
     */
    ImageUtils.getSrc = function (image) {
        var _a, _b, _c;
        // Priority order: direct src, preview URL, blob from file, fallback placeholder
        return ((_c = (_b = (_a = image.src) !== null && _a !== void 0 ? _a : image.preview) !== null && _b !== void 0 ? _b : (image.file && URL.createObjectURL(image.file))) !== null && _c !== void 0 ? _c : "/placeholder-property.jpg");
    };
    /**
     * Provides accessible alt text for screen readers and SEO.
     * Falls back through available text sources to ensure accessibility compliance.
     */
    ImageUtils.getAlt = function (image) {
        var _a, _b, _c;
        return (_c = (_a = image.alt) !== null && _a !== void 0 ? _a : (_b = image.file) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : "Gallery image";
    };
    /**
     * Generates human-readable display names for images in UI components.
     * Prioritizes user-provided captions over system-generated names.
     */
    ImageUtils.getDisplayName = function (image) {
        var _a, _b, _c, _d;
        return ((_d = (_b = (_a = image.caption) !== null && _a !== void 0 ? _a : image.alt) !== null && _b !== void 0 ? _b : (_c = image.file) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : "Image ".concat(image.id));
    };
    // ==========================================================================
    // STATUS AND COLOR UTILITIES
    // ==========================================================================
    /**
     * Maps processing status to appropriate CSS classes for visual feedback.
     * Handles undefined statuses gracefully with neutral gray styling.
     */
    ImageUtils.getStatusColor = function (status) {
        if (!status)
            return "bg-gray-500";
        // Using bracket notation to satisfy security linting while maintaining type safety
        return exports.STATUS_COLORS[status] || "bg-gray-500";
    };
    /**
     * Returns complete styling classes for approval status badges.
     * Includes background, text, and border styling for consistent appearance.
     */
    ImageUtils.getApprovalStatusColor = function (status) {
        if (!status)
            return DEFAULT_GRAY_STYLE;
        return (exports.APPROVAL_STATUS_COLORS[status] ||
            DEFAULT_GRAY_STYLE);
    };
    /**
     * Maps risk assessment levels to appropriate warning colors.
     * Critical risks use more prominent styling to ensure they're noticed.
     */
    ImageUtils.getRiskLevelColor = function (level) {
        return Object.prototype.hasOwnProperty.call(exports.RISK_LEVEL_COLORS, level) ?
            exports.RISK_LEVEL_COLORS[level]
            : DEFAULT_GRAY_STYLE;
    };
    // ==========================================================================
    // FILE SIZE AND TRANSFER FORMATTING
    // ==========================================================================
    /**
     * Converts raw bytes to human-readable file sizes with appropriate units.
     * Uses binary (1024) calculation which is standard for file systems.
     */
    ImageUtils.formatFileSize = function (bytes) {
        if (!bytes || bytes === 0)
            return "0 B";
        var sizes = ["B", "KB", "MB", "GB", "TB"];
        var i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
        var size = bytes / Math.pow(1024, i);
        return "".concat(Math.round(size * 100) / 100, " ").concat(sizes[i]);
    };
    /**
     * Formats network transfer speeds for upload progress indicators.
     * Provides real-time feedback during file uploads.
     */
    ImageUtils.formatSpeed = function (bytesPerSecond) {
        if (!bytesPerSecond || bytesPerSecond === 0)
            return "0 B/s";
        var sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
        var i = Math.min(Math.floor(Math.log(bytesPerSecond) / Math.log(1024)), sizes.length - 1);
        var speed = bytesPerSecond / Math.pow(1024, i);
        return "".concat(Math.round(speed * 100) / 100, " ").concat(sizes[i]);
    };
    /**
     * Converts estimated completion time from seconds to readable format.
     * Handles edge cases like infinite or undefined times gracefully.
     */
    ImageUtils.formatETA = function (seconds) {
        if (!seconds || seconds === Infinity || seconds < 0)
            return "Unknown";
        if (seconds < 60)
            return "".concat(Math.round(seconds), "s");
        if (seconds < 3600)
            return "".concat(Math.round(seconds / 60), "m");
        return "".concat(Math.round(seconds / 3600), "h");
    };
    // ==========================================================================
    // DATE AND TIME FORMATTING
    // ==========================================================================
    /**
     * Formats dates consistently across the application using US locale standards.
     * Handles both Date objects and Unix timestamps.
     */
    ImageUtils.formatDate = function (date) {
        if (!date)
            return "Unknown";
        var dateObj = typeof date === "number" ? new Date(date) : date;
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        }).format(dateObj);
    };
    /**
     * Flexible timestamp formatting with short and long variants.
     * Short format is ideal for lists, long format for detailed views.
     */
    ImageUtils.formatTimestamp = function (timestamp, format) {
        if (format === void 0) { format = "long"; }
        if (!timestamp)
            return "Unknown";
        var date = new Date(timestamp);
        if (format === "short") {
            return new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }).format(date);
        }
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(date);
    };
    // ==========================================================================
    // DOCUMENT AND WORKFLOW FORMATTING
    // ==========================================================================
    /**
     * Converts document type enums to user-friendly display text.
     * Handles snake_case to Title Case conversion consistently.
     */
    ImageUtils.formatDocumentType = function (type) {
        if (!type)
            return "Unknown";
        return type.replace(/_/g, " ").replace(/\b\w/g, function (l) { return l.toUpperCase(); });
    };
    /**
     * Formats approval status for enterprise workflow displays.
     * Maintains consistency with document type formatting.
     */
    ImageUtils.formatApprovalStatus = function (status) {
        if (!status)
            return "Unknown";
        return status.replace(/_/g, " ").replace(/\b\w/g, function (l) { return l.toUpperCase(); });
    };
    /**
     * Formats processing pipeline step names for progress indicators.
     * Useful for showing users where their uploads are in the processing queue.
     */
    ImageUtils.formatProcessingStep = function (step) {
        if (!step)
            return "Unknown";
        return step.replace(/_/g, " ").replace(/\b\w/g, function (l) { return l.toUpperCase(); });
    };
    /**
     * Formats workflow status for enterprise approval processes.
     * Provides consistent formatting across all workflow-related displays.
     */
    ImageUtils.formatWorkflowStatus = function (status) {
        if (!status)
            return "Unknown";
        return status.replace(/_/g, " ").replace(/\b\w/g, function (l) { return l.toUpperCase(); });
    };
    // ==========================================================================
    // RISK AND CONFIDENCE ASSESSMENT
    // ==========================================================================
    /**
     * Converts numeric risk scores to categorical levels with percentages.
     * This supports fraud detection and compliance features by providing
     * both machine-readable levels and human-readable percentages.
     */
    ImageUtils.formatRiskScore = function (score) {
        if (!score || score < 0)
            return { level: "low", text: "0%" };
        // Ensure score is between 0 and 1, then convert to percentage
        var normalizedScore = Math.min(Math.max(score, 0), 1);
        var percentage = Math.round(normalizedScore * 100);
        var level;
        if (percentage < 25)
            level = "low";
        else if (percentage < 50)
            level = "medium";
        else if (percentage < 80)
            level = "high";
        else
            level = "critical";
        return { level: level, text: "".concat(percentage, "%") };
    };
    /**
     * Formats confidence scores for AI/ML processing results.
     * Helps users understand how certain the system is about its assessments.
     */
    ImageUtils.formatConfidence = function (confidence) {
        if (!confidence || confidence < 0)
            return "0%";
        var normalizedConfidence = Math.min(confidence, 1);
        return "".concat(Math.round(normalizedConfidence * 100), "%");
    };
    // ==========================================================================
    // DIMENSIONAL AND SPATIAL FORMATTING
    // ==========================================================================
    /**
     * Formats image dimensions for display in metadata panels.
     * Uses the × symbol for professional appearance.
     */
    ImageUtils.formatDimensions = function (width, height) {
        if (!width || !height)
            return "Unknown";
        return "".concat(width, " \u00D7 ").concat(height);
    };
    /**
     * Calculates and formats aspect ratios in simplified form.
     * Uses greatest common divisor to reduce ratios to lowest terms.
     */
    ImageUtils.formatAspectRatio = function (width, height) {
        if (!width || !height)
            return "Unknown";
        var gcd = function (a, b) { return (b === 0 ? a : gcd(b, a % b)); };
        var divisor = gcd(width, height);
        return "".concat(width / divisor, ":").concat(height / divisor);
    };
    /**
     * Formats GPS coordinates with appropriate precision for property mapping.
     * Six decimal places provide meter-level accuracy for property boundaries.
     */
    ImageUtils.formatCoordinates = function (lat, lng) {
        if (lat === undefined || lng === undefined)
            return "Unknown";
        return "".concat(lat.toFixed(6), ", ").concat(lng.toFixed(6));
    };
    /**
     * Domain-specific location formatting for Kenyan property management.
     * Provides city-level location detection for major urban centers.
     * This feature adds significant value for property listing displays.
     */
    ImageUtils.formatPropertyLocation = function (lat, lng) {
        if (lat === undefined || lng === undefined)
            return "Unknown Location";
        // Check if coordinates fall within Kenya's boundaries
        if (lat >= -4.678 && lat <= 5.019 && lng >= 33.908 && lng <= 41.899) {
            // Major city detection using approximate bounding boxes
            if (lat >= -1.4 && lat <= -1.2 && lng >= 36.7 && lng <= 36.9) {
                return "Nairobi, Kenya";
            }
            else if (lat >= -4.1 && lat <= -3.9 && lng >= 39.6 && lng <= 39.7) {
                return "Mombasa, Kenya";
            }
            else if (lat >= -0.1 && lat <= 0.1 && lng >= 34.7 && lng <= 34.8) {
                return "Kisumu, Kenya";
            }
            return "Kenya";
        }
        return "Unknown Location";
    };
    // ==========================================================================
    // IMAGE STATE CHECKING UTILITIES
    // ==========================================================================
    /**
     * Type guard functions for checking image processing states.
     * These methods improve code readability and provide centralized state logic.
     */
    ImageUtils.isUploading = function (image) {
        return image.status === "uploading";
    };
    ImageUtils.isProcessing = function (image) {
        return image.status === "pending" || image.status === "uploading";
    };
    ImageUtils.isComplete = function (image) {
        return image.status === "completed";
    };
    ImageUtils.isFailed = function (image) {
        return image.status === "error";
    };
    // Note: Removed isPaused method as 'paused' is not a valid ImageStatus according to types
    // ==========================================================================
    // FEATURE AVAILABILITY CHECKING
    // ==========================================================================
    /**
     * Feature detection methods help components conditionally render UI elements
     * based on what capabilities are available for specific images.
     */
    ImageUtils.hasEnterpriseFeatures = function (image) {
        return (image.approvalStatus !== undefined ||
            image.tags !== undefined ||
            image.collections !== undefined);
    };
    ImageUtils.hasCollaborationFeatures = function (image) {
        return (image.comments !== undefined ||
            image.annotations !== undefined ||
            image.assignedTo !== undefined);
    };
    ImageUtils.hasUploadCapabilities = function (image) {
        return image.file !== undefined || image.chunks !== undefined;
    };
    ImageUtils.hasValidationResult = function (image) {
        return image.validationResult !== undefined;
    };
    ImageUtils.hasMetadata = function (image) {
        return image.metadata !== undefined;
    };
    // ==========================================================================
    // BATCH OPERATIONS AND FILTERING
    // ==========================================================================
    /**
     * Collection manipulation methods for working with arrays of images.
     * All methods return new arrays to maintain functional programming principles.
     */
    ImageUtils.filterByStatus = function (images, status) {
        return images.filter(function (img) { return img.status === status; });
    };
    ImageUtils.filterByApprovalStatus = function (images, status) {
        return images.filter(function (img) { return img.approvalStatus === status; });
    };
    ImageUtils.filterByDocumentType = function (images, type) {
        return images.filter(function (img) { return img.documentType === type; });
    };
    ImageUtils.sortByUploadDate = function (images, ascending) {
        if (ascending === void 0) { ascending = true; }
        return __spreadArray([], images, true).sort(function (a, b) {
            var _a, _b;
            var dateA = ((_a = a.uploadDate) === null || _a === void 0 ? void 0 : _a.getTime()) || 0;
            var dateB = ((_b = b.uploadDate) === null || _b === void 0 ? void 0 : _b.getTime()) || 0;
            return ascending ? dateA - dateB : dateB - dateA;
        });
    };
    ImageUtils.sortByFileSize = function (images, ascending) {
        if (ascending === void 0) { ascending = true; }
        return __spreadArray([], images, true).sort(function (a, b) {
            var _a, _b;
            var sizeA = a.fileSize || ((_a = a.file) === null || _a === void 0 ? void 0 : _a.size) || 0;
            var sizeB = b.fileSize || ((_b = b.file) === null || _b === void 0 ? void 0 : _b.size) || 0;
            return ascending ? sizeA - sizeB : sizeB - sizeA;
        });
    };
    ImageUtils.sortByRating = function (images, ascending) {
        if (ascending === void 0) { ascending = true; }
        return __spreadArray([], images, true).sort(function (a, b) {
            var ratingA = a.rating || 0;
            var ratingB = b.rating || 0;
            return ascending ? ratingA - ratingB : ratingB - ratingA;
        });
    };
    // ==========================================================================
    // STATISTICAL ANALYSIS
    // ==========================================================================
    /**
     * Statistical analysis methods provide insights into image collections.
     * These are particularly useful for dashboard displays and progress tracking.
     */
    ImageUtils.getUploadStats = function (images) {
        var stats = {
            total: images.length,
            completed: images.filter(function (img) { return img.status === "completed"; }).length,
            uploading: images.filter(function (img) { return img.status === "uploading"; }).length,
            failed: images.filter(function (img) { return img.status === "error"; }).length,
            pending: images.filter(function (img) { return img.status === "pending"; }).length,
            successRate: 0,
        };
        // Calculate success rate for completed uploads
        var processedImages = stats.completed + stats.failed;
        stats.successRate =
            processedImages > 0 ? (stats.completed / processedImages) * 100 : 0;
        return stats;
    };
    ImageUtils.getApprovalStats = function (images) {
        var enterpriseImages = images.filter(function (img) { return img.approvalStatus; });
        var stats = {
            total: enterpriseImages.length,
            approved: enterpriseImages.filter(function (img) { return img.approvalStatus === "approved"; }).length,
            pending: enterpriseImages.filter(function (img) { return img.approvalStatus === "pending"; }).length,
            rejected: enterpriseImages.filter(function (img) { return img.approvalStatus === "rejected"; }).length,
            needsRevision: enterpriseImages.filter(function (img) { return img.approvalStatus === "needs_revision"; }).length,
            approvalRate: 0,
        };
        // Calculate approval rate for processed items
        var processedApprovals = stats.approved + stats.rejected + stats.needsRevision;
        stats.approvalRate =
            processedApprovals > 0 ? (stats.approved / processedApprovals) * 100 : 0;
        return stats;
    };
    // ==========================================================================
    // CONFIGURATION-AWARE VALIDATION
    // ==========================================================================
    /**
     * Configuration-aware validation methods that integrate with your app's settings.
     * These ensure consistency between your utility functions and system constraints.
     */
    ImageUtils.isValidFileSize = function (fileSize) {
        return fileSize > 0 && fileSize <= imageServiceConfig.upload.maxFileSize;
    };
    ImageUtils.isValidFormat = function (fileName) {
        var _a;
        var extension = (_a = fileName.split(".").pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        return extension ?
            imageServiceConfig.upload.allowedFormats.includes(extension)
            : false;
    };
    ImageUtils.getMaxFileSize = function () {
        return imageServiceConfig.upload.maxFileSize;
    };
    ImageUtils.getAllowedFormats = function () {
        return imageServiceConfig.upload.allowedFormats;
    };
    // ==========================================================================
    // FILE PROCESSING UTILITIES
    // ==========================================================================
    /**
     * File processing and manipulation utilities for handling various file operations.
     */
    ImageUtils.generateThumbnailUrl = function (image, size) {
        if (size === void 0) { size = 150; }
        var src = this.getSrc(image);
        if (src.startsWith("data:") || src.startsWith("blob:")) {
            return src; // Cannot generate thumbnail URL for data/blob URLs
        }
        return "".concat(src, "?w=").concat(size, "&h=").concat(size, "&fit=crop");
    };
    ImageUtils.getFileExtension = function (fileName) {
        var _a;
        return ((_a = fileName.split(".").pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "";
    };
    ImageUtils.isImageFile = function (fileName) {
        var imageExtensions = [
            "jpg",
            "jpeg",
            "png",
            "gif",
            "webp",
            "svg",
            "bmp",
            "tiff",
        ];
        return imageExtensions.includes(this.getFileExtension(fileName));
    };
    ImageUtils.isDocumentFile = function (fileName) {
        var docExtensions = ["pdf", "doc", "docx", "txt", "rtf"];
        return docExtensions.includes(this.getFileExtension(fileName));
    };
    // ==========================================================================
    // UTILITY AND HELPER FUNCTIONS
    // ==========================================================================
    /**
     * General-purpose utility functions that support the main image operations.
     */
    ImageUtils.generateUniqueId = function () {
        var _a;
        var timestamp = Date.now().toString(36);
        // Using crypto.getRandomValues for better security if available, fallback to Math.random
        var randomPart = ((_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.crypto) === null || _a === void 0 ? void 0 : _a.getRandomValues)
            ? Array.from(globalThis.crypto.getRandomValues(new Uint8Array(4)))
                .map(function (b) { return b.toString(36); })
                .join("")
            : Math.random().toString(36).substring(2, 8);
        return "img_".concat(timestamp, "_").concat(randomPart);
    };
    ImageUtils.calculateHash = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var arrayBuffer, hashBuffer, hashArray;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.crypto) === null || _a === void 0 ? void 0 : _a.subtle)) return [3 /*break*/, 3];
                        return [4 /*yield*/, data.arrayBuffer()];
                    case 1:
                        arrayBuffer = _b.sent();
                        return [4 /*yield*/, globalThis.crypto.subtle.digest("SHA-256", arrayBuffer)];
                    case 2:
                        hashBuffer = _b.sent();
                        hashArray = Array.from(new Uint8Array(hashBuffer));
                        return [2 /*return*/, hashArray.map(function (b) { return b.toString(16).padStart(2, "0"); }).join("")];
                    case 3: 
                    // Fallback for environments without crypto.subtle
                    return [2 /*return*/, "fallback_hash_".concat(Date.now(), "_").concat(Math.random().toString(36))];
                }
            });
        });
    };
    ImageUtils.sanitizeFilename = function (filename) {
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace invalid characters with underscores
            .replace(/_{2,}/g, "_") // Collapse multiple underscores
            .replace(/(^_|_$)/g, "") // Remove leading/trailing underscores
            .toLowerCase();
    };
    ImageUtils.generateThumbnailFilename = function (originalFilename, size) {
        var extension = this.getFileExtension(originalFilename);
        var baseName = originalFilename.substring(0, originalFilename.lastIndexOf("."));
        return "".concat(this.sanitizeFilename(baseName), "_thumb_").concat(size, ".").concat(extension);
    };
    ImageUtils.truncateText = function (text, maxLength) {
        if (text.length <= maxLength)
            return text;
        return "".concat(text.substring(0, maxLength - 3), "...");
    };
    // ==========================================================================
    // KENYAN LOCALIZATION UTILITIES
    // ==========================================================================
    /**
     * Domain-specific formatting functions customized for the Kenyan market.
     * These functions add significant value by handling local conventions.
     */
    ImageUtils.formatCurrency = function (amount) {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };
    ImageUtils.formatPhoneNumber = function (phone) {
        var cleaned = phone.replace(/\D/g, "");
        // Handle international format starting with 254
        if (cleaned.startsWith("254")) {
            return "+".concat(cleaned.substring(0, 3), " ").concat(cleaned.substring(3, 6), " ").concat(cleaned.substring(6));
        }
        // Handle local format starting with 0
        else if (cleaned.startsWith("0")) {
            return "".concat(cleaned.substring(0, 4), " ").concat(cleaned.substring(4));
        }
        return phone; // Return original if format is unrecognized
    };
    // ==========================================================================
    // STORAGE AND AUDIT FORMATTING
    // ==========================================================================
    /**
     * Enterprise-level formatting for storage classes and audit events.
     * These support compliance and operational visibility requirements.
     */
    ImageUtils.formatStorageClass = function (storageClass) {
        var classMap = {
            hot: "Hot Storage",
            warm: "Warm Storage",
            cold: "Cold Storage",
            archive: "Archive Storage",
        };
        return Object.prototype.hasOwnProperty.call(classMap, storageClass)
            ? classMap[storageClass]
            : storageClass.replace(/\b\w/g, function (l) { return l.toUpperCase(); });
    };
    ImageUtils.formatAuditEvent = function (action) {
        var actionMap = {
            upload_initiated: "Upload Started",
            upload_completed: "Upload Completed",
            validation_passed: "Validation Passed",
            validation_failed: "Validation Failed",
            virus_scan_clean: "Virus Scan Clean",
            virus_scan_threat: "Virus Threat Detected",
            document_authenticated: "Document Authenticated",
            document_auth_failed: "Document Authentication Failed",
            fraud_check_passed: "Fraud Check Passed",
            fraud_risk_detected: "Fraud Risk Detected",
            compliance_approved: "Compliance Approved",
            compliance_flagged: "Compliance Flagged",
            image_approved: "Image Approved",
            image_rejected: "Image Rejected",
            metadata_updated: "Metadata Updated",
            access_granted: "Access Granted",
            access_denied: "Access Denied",
        };
        return Object.prototype.hasOwnProperty.call(actionMap, action)
            ? actionMap[action]
            : action.replace(/_/g, " ").replace(/\b\w/g, function (l) { return l.toUpperCase(); });
    };
    return ImageUtils;
}());
exports.ImageUtils = ImageUtils;
// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================================
/**
 * Individual function exports for backward compatibility.
 * This allows gradual migration from individual imports to class-based usage.
 * Teams can continue using existing import patterns while benefiting from
 * the centralized implementation and improved error handling.
 */
// Core image utilities
exports.getSrc = ImageUtils.getSrc.bind(ImageUtils);
exports.getAlt = ImageUtils.getAlt.bind(ImageUtils);
exports.getDisplayName = ImageUtils.getDisplayName.bind(ImageUtils);
// Status and color utilities
exports.getStatusColor = ImageUtils.getStatusColor.bind(ImageUtils);
exports.getApprovalStatusColor = ImageUtils.getApprovalStatusColor.bind(ImageUtils);
exports.getRiskLevelColor = ImageUtils.getRiskLevelColor.bind(ImageUtils);
// Formatting utilities
exports.formatFileSize = ImageUtils.formatFileSize.bind(ImageUtils);
exports.formatSpeed = ImageUtils.formatSpeed.bind(ImageUtils);
exports.formatETA = ImageUtils.formatETA.bind(ImageUtils);
exports.formatDate = ImageUtils.formatDate.bind(ImageUtils);
exports.formatTimestamp = ImageUtils.formatTimestamp.bind(ImageUtils);
// Document and workflow formatting
exports.formatDocumentType = ImageUtils.formatDocumentType.bind(ImageUtils);
exports.formatApprovalStatus = ImageUtils.formatApprovalStatus.bind(ImageUtils);
exports.formatProcessingStep = ImageUtils.formatProcessingStep.bind(ImageUtils);
exports.formatWorkflowStatus = ImageUtils.formatWorkflowStatus.bind(ImageUtils);
// Risk and confidence formatting
exports.formatRiskScore = ImageUtils.formatRiskScore.bind(ImageUtils);
exports.formatConfidence = ImageUtils.formatConfidence.bind(ImageUtils);
// Dimensional utilities
exports.formatDimensions = ImageUtils.formatDimensions.bind(ImageUtils);
exports.formatAspectRatio = ImageUtils.formatAspectRatio.bind(ImageUtils);
exports.formatCoordinates = ImageUtils.formatCoordinates.bind(ImageUtils);
exports.formatPropertyLocation = ImageUtils.formatPropertyLocation.bind(ImageUtils);
// State checking utilities
exports.isUploading = ImageUtils.isUploading.bind(ImageUtils);
exports.isProcessing = ImageUtils.isProcessing.bind(ImageUtils);
exports.isComplete = ImageUtils.isComplete.bind(ImageUtils);
exports.isFailed = ImageUtils.isFailed.bind(ImageUtils);
// Feature checking utilities
exports.hasEnterpriseFeatures = ImageUtils.hasEnterpriseFeatures.bind(ImageUtils);
exports.hasCollaborationFeatures = ImageUtils.hasCollaborationFeatures.bind(ImageUtils);
exports.hasUploadCapabilities = ImageUtils.hasUploadCapabilities.bind(ImageUtils);
// Batch operations
exports.filterByStatus = ImageUtils.filterByStatus.bind(ImageUtils);
exports.sortByUploadDate = ImageUtils.sortByUploadDate.bind(ImageUtils);
// Statistics
exports.getUploadStats = ImageUtils.getUploadStats.bind(ImageUtils);
exports.getApprovalStats = ImageUtils.getApprovalStats.bind(ImageUtils);
// Validation utilities
exports.isValidFileSize = ImageUtils.isValidFileSize.bind(ImageUtils);
exports.isValidFormat = ImageUtils.isValidFormat.bind(ImageUtils);
exports.getMaxFileSize = ImageUtils.getMaxFileSize.bind(ImageUtils);
exports.getAllowedFormats = ImageUtils.getAllowedFormats.bind(ImageUtils);
// File processing utilities
exports.generateThumbnailUrl = ImageUtils.generateThumbnailUrl.bind(ImageUtils);
exports.getFileExtension = ImageUtils.getFileExtension.bind(ImageUtils);
exports.isImageFile = ImageUtils.isImageFile.bind(ImageUtils);
exports.isDocumentFile = ImageUtils.isDocumentFile.bind(ImageUtils);
exports.generateUniqueId = ImageUtils.generateUniqueId.bind(ImageUtils);
exports.calculateHash = ImageUtils.calculateHash.bind(ImageUtils);
exports.sanitizeFilename = ImageUtils.sanitizeFilename.bind(ImageUtils);
exports.generateThumbnailFilename = ImageUtils.generateThumbnailFilename.bind(ImageUtils);
exports.truncateText = ImageUtils.truncateText.bind(ImageUtils);
// Localization utilities
exports.formatCurrency = ImageUtils.formatCurrency.bind(ImageUtils);
exports.formatPhoneNumber = ImageUtils.formatPhoneNumber.bind(ImageUtils);
// Enterprise utilities
exports.formatStorageClass = ImageUtils.formatStorageClass.bind(ImageUtils);
exports.formatAuditEvent = ImageUtils.formatAuditEvent.bind(ImageUtils);
// Additional batch operations
exports.filterByApprovalStatus = ImageUtils.filterByApprovalStatus.bind(ImageUtils);
exports.filterByDocumentType = ImageUtils.filterByDocumentType.bind(ImageUtils);
exports.sortByFileSize = ImageUtils.sortByFileSize.bind(ImageUtils);
exports.sortByRating = ImageUtils.sortByRating.bind(ImageUtils);
// Additional feature detection utilities
exports.hasValidationResult = ImageUtils.hasValidationResult.bind(ImageUtils);
exports.hasMetadata = ImageUtils.hasMetadata.bind(ImageUtils);
// Default export for class-based usage
exports.default = ImageUtils;
