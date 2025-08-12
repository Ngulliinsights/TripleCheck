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

import type {
  UnifiedImage,
  ImageStatus,
  ApprovalStatus,
  DocumentType,
  WorkflowStatus,
} from "../../types/images/unified";

// Import configuration conditionally to handle missing module
interface ImageServiceConfig {
  upload: {
    maxFileSize: number;
    allowedFormats: string[];
  };
}

let imageServiceConfig: ImageServiceConfig;
try {
  imageServiceConfig = require("../../config/image-service.config");
} catch {
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
const DEFAULT_GRAY_STYLE = "bg-gray-100 text-gray-800 border-gray-200";

/**
 * Risk level type definition to replace inline union types
 */
type RiskLevel = "low" | "medium" | "high" | "critical";

/**
 * Maps image processing status to Tailwind CSS classes for consistent UI feedback.
 * These colors provide immediate visual context about upload and processing states.
 */
export const STATUS_COLORS = {
  pending: "bg-yellow-500", // Waiting to start processing
  uploading: "bg-blue-500", // Currently uploading
  completed: "bg-green-500", // Successfully completed
  error: "bg-red-500", // Failed with error
  processing: "bg-purple-500", // Currently processing
  paused: "bg-orange-500", // Temporarily paused
} as const;

/**
 * Enterprise approval workflow status colors with full styling classes.
 * Includes background, text, and border colors for complete component styling.
 */
export const APPROVAL_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  needs_revision: "bg-orange-100 text-orange-800 border-orange-200",
} as const;

/**
 * Risk assessment level colors for fraud detection and compliance features.
 * Critical levels use stronger colors to draw immediate attention.
 */
export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-red-100 text-red-800 border-red-200",
  critical: "bg-red-200 text-red-900 border-red-300",
} as const;

// ============================================================================
// MAIN UTILITY CLASS
// ============================================================================

/**
 * ImageUtils provides a comprehensive set of static methods for working with images
 * across all contexts in the application. This includes basic image operations,
 * file processing, enterprise workflows, and domain-specific formatting.
 */
export class ImageUtils {
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
  static getSrc(image: UnifiedImage): string {
    // Priority order: direct src, preview URL, blob from file, fallback placeholder
    return (
      image.src ??
      image.preview ??
      (image.file && URL.createObjectURL(image.file)) ??
      "/placeholder-property.jpg"
    );
  }

  /**
   * Provides accessible alt text for screen readers and SEO.
   * Falls back through available text sources to ensure accessibility compliance.
   */
  static getAlt(image: UnifiedImage): string {
    return image.alt ?? image.file?.name ?? "Gallery image";
  }

  /**
   * Generates human-readable display names for images in UI components.
   * Prioritizes user-provided captions over system-generated names.
   */
  static getDisplayName(image: UnifiedImage): string {
    return (
      image.caption ?? image.alt ?? image.file?.name ?? `Image ${image.id}`
    );
  }

  // ==========================================================================
  // STATUS AND COLOR UTILITIES
  // ==========================================================================

  /**
   * Maps processing status to appropriate CSS classes for visual feedback.
   * Handles undefined statuses gracefully with neutral gray styling.
   */
  static getStatusColor(status?: ImageStatus): string {
    if (!status) return "bg-gray-500";
    // Using bracket notation to satisfy security linting while maintaining type safety
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "bg-gray-500";
  }

  /**
   * Returns complete styling classes for approval status badges.
   * Includes background, text, and border styling for consistent appearance.
   */
  static getApprovalStatusColor(status?: ApprovalStatus): string {
    if (!status) return DEFAULT_GRAY_STYLE;
    return (
      APPROVAL_STATUS_COLORS[status as keyof typeof APPROVAL_STATUS_COLORS] ||
      DEFAULT_GRAY_STYLE
    );
  }

  /**
   * Maps risk assessment levels to appropriate warning colors.
   * Critical risks use more prominent styling to ensure they're noticed.
   */
  static getRiskLevelColor(level: RiskLevel): string {
    return Object.prototype.hasOwnProperty.call(RISK_LEVEL_COLORS, level) ?
        RISK_LEVEL_COLORS[level]
      : DEFAULT_GRAY_STYLE;
  }

  // ==========================================================================
  // FILE SIZE AND TRANSFER FORMATTING
  // ==========================================================================

  /**
   * Converts raw bytes to human-readable file sizes with appropriate units.
   * Uses binary (1024) calculation which is standard for file systems.
   */
  static formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    const size = bytes / Math.pow(1024, i);
    return `${Math.round(size * 100) / 100} ${sizes[i]}`;
  }

  /**
   * Formats network transfer speeds for upload progress indicators.
   * Provides real-time feedback during file uploads.
   */
  static formatSpeed(bytesPerSecond?: number): string {
    if (!bytesPerSecond || bytesPerSecond === 0) return "0 B/s";
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.min(Math.floor(Math.log(bytesPerSecond) / Math.log(1024)), sizes.length - 1);
    const speed = bytesPerSecond / Math.pow(1024, i);
    return `${Math.round(speed * 100) / 100} ${sizes[i]}`;
  }

  /**
   * Converts estimated completion time from seconds to readable format.
   * Handles edge cases like infinite or undefined times gracefully.
   */
  static formatETA(seconds?: number): string {
    if (!seconds || seconds === Infinity || seconds < 0) return "Unknown";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  }

  // ==========================================================================
  // DATE AND TIME FORMATTING
  // ==========================================================================

  /**
   * Formats dates consistently across the application using US locale standards.
   * Handles both Date objects and Unix timestamps.
   */
  static formatDate(date?: Date | number): string {
    if (!date) return "Unknown";
    const dateObj = typeof date === "number" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(dateObj);
  }

  /**
   * Flexible timestamp formatting with short and long variants.
   * Short format is ideal for lists, long format for detailed views.
   */
  static formatTimestamp(
    timestamp?: number,
    format: "short" | "long" = "long"
  ): string {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);

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
  }

  // ==========================================================================
  // DOCUMENT AND WORKFLOW FORMATTING
  // ==========================================================================

  /**
   * Converts document type enums to user-friendly display text.
   * Handles snake_case to Title Case conversion consistently.
   */
  static formatDocumentType(type?: DocumentType): string {
    if (!type) return "Unknown";
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Formats approval status for enterprise workflow displays.
   * Maintains consistency with document type formatting.
   */
  static formatApprovalStatus(status?: ApprovalStatus): string {
    if (!status) return "Unknown";
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Formats processing pipeline step names for progress indicators.
   * Useful for showing users where their uploads are in the processing queue.
   */
  static formatProcessingStep(step?: string): string {
    if (!step) return "Unknown";
    return step.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Formats workflow status for enterprise approval processes.
   * Provides consistent formatting across all workflow-related displays.
   */
  static formatWorkflowStatus(status?: WorkflowStatus): string {
    if (!status) return "Unknown";
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  // ==========================================================================
  // RISK AND CONFIDENCE ASSESSMENT
  // ==========================================================================

  /**
   * Converts numeric risk scores to categorical levels with percentages.
   * This supports fraud detection and compliance features by providing
   * both machine-readable levels and human-readable percentages.
   */
  static formatRiskScore(score?: number): { level: RiskLevel; text: string } {
    if (!score || score < 0) return { level: "low", text: "0%" };

    // Ensure score is between 0 and 1, then convert to percentage
    const normalizedScore = Math.min(Math.max(score, 0), 1);
    const percentage = Math.round(normalizedScore * 100);

    let level: RiskLevel;
    if (percentage < 25) level = "low";
    else if (percentage < 50) level = "medium";
    else if (percentage < 80) level = "high";
    else level = "critical";

    return { level, text: `${percentage}%` };
  }

  /**
   * Formats confidence scores for AI/ML processing results.
   * Helps users understand how certain the system is about its assessments.
   */
  static formatConfidence(confidence?: number): string {
    if (!confidence || confidence < 0) return "0%";
    const normalizedConfidence = Math.min(confidence, 1);
    return `${Math.round(normalizedConfidence * 100)}%`;
  }

  // ==========================================================================
  // DIMENSIONAL AND SPATIAL FORMATTING
  // ==========================================================================

  /**
   * Formats image dimensions for display in metadata panels.
   * Uses the × symbol for professional appearance.
   */
  static formatDimensions(width?: number, height?: number): string {
    if (!width || !height) return "Unknown";
    return `${width} × ${height}`;
  }

  /**
   * Calculates and formats aspect ratios in simplified form.
   * Uses greatest common divisor to reduce ratios to lowest terms.
   */
  static formatAspectRatio(width?: number, height?: number): string {
    if (!width || !height) return "Unknown";
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  }

  /**
   * Formats GPS coordinates with appropriate precision for property mapping.
   * Six decimal places provide meter-level accuracy for property boundaries.
   */
  static formatCoordinates(lat?: number, lng?: number): string {
    if (lat === undefined || lng === undefined) return "Unknown";
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  /**
   * Domain-specific location formatting for Kenyan property management.
   * Provides city-level location detection for major urban centers.
   * This feature adds significant value for property listing displays.
   */
  static formatPropertyLocation(lat?: number, lng?: number): string {
    if (lat === undefined || lng === undefined) return "Unknown Location";

    // Check if coordinates fall within Kenya's boundaries
    if (lat >= -4.678 && lat <= 5.019 && lng >= 33.908 && lng <= 41.899) {
      // Major city detection using approximate bounding boxes
      if (lat >= -1.4 && lat <= -1.2 && lng >= 36.7 && lng <= 36.9) {
        return "Nairobi, Kenya";
      } else if (lat >= -4.1 && lat <= -3.9 && lng >= 39.6 && lng <= 39.7) {
        return "Mombasa, Kenya";
      } else if (lat >= -0.1 && lat <= 0.1 && lng >= 34.7 && lng <= 34.8) {
        return "Kisumu, Kenya";
      }
      return "Kenya";
    }

    return "Unknown Location";
  }

  // ==========================================================================
  // IMAGE STATE CHECKING UTILITIES
  // ==========================================================================

  /**
   * Type guard functions for checking image processing states.
   * These methods improve code readability and provide centralized state logic.
   */

  static isUploading(image: UnifiedImage): boolean {
    return image.status === "uploading";
  }

  static isProcessing(image: UnifiedImage): boolean {
    return image.status === "pending" || image.status === "uploading";
  }

  static isComplete(image: UnifiedImage): boolean {
    return image.status === "completed";
  }

  static isFailed(image: UnifiedImage): boolean {
    return image.status === "error";
  }

  // Note: Removed isPaused method as 'paused' is not a valid ImageStatus according to types

  // ==========================================================================
  // FEATURE AVAILABILITY CHECKING
  // ==========================================================================

  /**
   * Feature detection methods help components conditionally render UI elements
   * based on what capabilities are available for specific images.
   */

  static hasEnterpriseFeatures(image: UnifiedImage): boolean {
    return (
      image.approvalStatus !== undefined ||
      image.tags !== undefined ||
      image.collections !== undefined
    );
  }

  static hasCollaborationFeatures(image: UnifiedImage): boolean {
    return (
      image.comments !== undefined ||
      image.annotations !== undefined ||
      image.assignedTo !== undefined
    );
  }

  static hasUploadCapabilities(image: UnifiedImage): boolean {
    return image.file !== undefined || image.chunks !== undefined;
  }

  static hasValidationResult(image: UnifiedImage): boolean {
    return image.validationResult !== undefined;
  }

  static hasMetadata(image: UnifiedImage): boolean {
    return image.metadata !== undefined;
  }

  // ==========================================================================
  // BATCH OPERATIONS AND FILTERING
  // ==========================================================================

  /**
   * Collection manipulation methods for working with arrays of images.
   * All methods return new arrays to maintain functional programming principles.
   */

  static filterByStatus(
    images: UnifiedImage[],
    status: ImageStatus
  ): UnifiedImage[] {
    return images.filter((img) => img.status === status);
  }

  static filterByApprovalStatus(
    images: UnifiedImage[],
    status: ApprovalStatus
  ): UnifiedImage[] {
    return images.filter((img) => img.approvalStatus === status);
  }

  static filterByDocumentType(
    images: UnifiedImage[],
    type: DocumentType
  ): UnifiedImage[] {
    return images.filter((img) => img.documentType === type);
  }

  static sortByUploadDate(
    images: UnifiedImage[],
    ascending: boolean = true
  ): UnifiedImage[] {
    return [...images].sort((a, b) => {
      const dateA = a.uploadDate?.getTime() || 0;
      const dateB = b.uploadDate?.getTime() || 0;
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  static sortByFileSize(
    images: UnifiedImage[],
    ascending: boolean = true
  ): UnifiedImage[] {
    return [...images].sort((a, b) => {
      const sizeA = a.fileSize || a.file?.size || 0;
      const sizeB = b.fileSize || b.file?.size || 0;
      return ascending ? sizeA - sizeB : sizeB - sizeA;
    });
  }

  static sortByRating(
    images: UnifiedImage[],
    ascending: boolean = true
  ): UnifiedImage[] {
    return [...images].sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ascending ? ratingA - ratingB : ratingB - ratingA;
    });
  }

  // ==========================================================================
  // STATISTICAL ANALYSIS
  // ==========================================================================

  /**
   * Statistical analysis methods provide insights into image collections.
   * These are particularly useful for dashboard displays and progress tracking.
   */

  static getUploadStats(images: UnifiedImage[]): {
    total: number;
    completed: number;
    uploading: number;
    failed: number;
    pending: number;
    successRate: number;
  } {
    const stats = {
      total: images.length,
      completed: images.filter((img) => img.status === "completed").length,
      uploading: images.filter((img) => img.status === "uploading").length,
      failed: images.filter((img) => img.status === "error").length,
      pending: images.filter((img) => img.status === "pending").length,
      successRate: 0,
    };

    // Calculate success rate for completed uploads
    const processedImages = stats.completed + stats.failed;
    stats.successRate =
      processedImages > 0 ? (stats.completed / processedImages) * 100 : 0;

    return stats;
  }

  static getApprovalStats(images: UnifiedImage[]): {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    needsRevision: number;
    approvalRate: number;
  } {
    const enterpriseImages = images.filter((img) => img.approvalStatus);
    const stats = {
      total: enterpriseImages.length,
      approved: enterpriseImages.filter(
        (img) => img.approvalStatus === "approved"
      ).length,
      pending: enterpriseImages.filter(
        (img) => img.approvalStatus === "pending"
      ).length,
      rejected: enterpriseImages.filter(
        (img) => img.approvalStatus === "rejected"
      ).length,
      needsRevision: enterpriseImages.filter(
        (img) => img.approvalStatus === "needs_revision"
      ).length,
      approvalRate: 0,
    };

    // Calculate approval rate for processed items
    const processedApprovals =
      stats.approved + stats.rejected + stats.needsRevision;
    stats.approvalRate =
      processedApprovals > 0 ? (stats.approved / processedApprovals) * 100 : 0;

    return stats;
  }

  // ==========================================================================
  // CONFIGURATION-AWARE VALIDATION
  // ==========================================================================

  /**
   * Configuration-aware validation methods that integrate with your app's settings.
   * These ensure consistency between your utility functions and system constraints.
   */

  static isValidFileSize(fileSize: number): boolean {
    return fileSize > 0 && fileSize <= imageServiceConfig.upload.maxFileSize;
  }

  static isValidFormat(fileName: string): boolean {
    const extension = fileName.split(".").pop()?.toLowerCase();
    return extension ?
        imageServiceConfig.upload.allowedFormats.includes(extension)
      : false;
  }

  static getMaxFileSize(): number {
    return imageServiceConfig.upload.maxFileSize;
  }

  static getAllowedFormats(): string[] {
    return imageServiceConfig.upload.allowedFormats;
  }

  // ==========================================================================
  // FILE PROCESSING UTILITIES
  // ==========================================================================

  /**
   * File processing and manipulation utilities for handling various file operations.
   */

  static generateThumbnailUrl(image: UnifiedImage, size: number = 150): string {
    const src = this.getSrc(image);
    if (src.startsWith("data:") || src.startsWith("blob:")) {
      return src; // Cannot generate thumbnail URL for data/blob URLs
    }
    return `${src}?w=${size}&h=${size}&fit=crop`;
  }

  static getFileExtension(fileName: string): string {
    return fileName.split(".").pop()?.toLowerCase() || "";
  }

  static isImageFile(fileName: string): boolean {
    const imageExtensions = [
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
  }

  static isDocumentFile(fileName: string): boolean {
    const docExtensions = ["pdf", "doc", "docx", "txt", "rtf"];
    return docExtensions.includes(this.getFileExtension(fileName));
  }

  // ==========================================================================
  // UTILITY AND HELPER FUNCTIONS
  // ==========================================================================

  /**
   * General-purpose utility functions that support the main image operations.
   */

  static generateUniqueId(): string {
    const timestamp = Date.now().toString(36);
    // Using crypto.getRandomValues for better security if available, fallback to Math.random
    const randomPart = globalThis?.crypto?.getRandomValues
      ? Array.from(globalThis.crypto.getRandomValues(new Uint8Array(4)))
          .map((b) => b.toString(36))
          .join("")
      : Math.random().toString(36).substring(2, 8);
    return `img_${timestamp}_${randomPart}`;
  }

  static async calculateHash(data: Blob): Promise<string> {
    // Check if crypto.subtle is available (modern browsers/Node.js)
    if (globalThis?.crypto?.subtle) {
      const arrayBuffer = await data.arrayBuffer();
      const hashBuffer = await globalThis.crypto.subtle.digest(
        "SHA-256",
        arrayBuffer
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    // Fallback for environments without crypto.subtle
    return `fallback_hash_${Date.now()}_${Math.random().toString(36)}`;
  }

  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace invalid characters with underscores
      .replace(/_{2,}/g, "_") // Collapse multiple underscores
      .replace(/(^_|_$)/g, "") // Remove leading/trailing underscores
      .toLowerCase();
  }

  static generateThumbnailFilename(
    originalFilename: string,
    size: number
  ): string {
    const extension = this.getFileExtension(originalFilename);
    const baseName = originalFilename.substring(
      0,
      originalFilename.lastIndexOf(".")
    );
    return `${this.sanitizeFilename(baseName)}_thumb_${size}.${extension}`;
  }

  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength - 3)}...`;
  }

  // ==========================================================================
  // KENYAN LOCALIZATION UTILITIES
  // ==========================================================================

  /**
   * Domain-specific formatting functions customized for the Kenyan market.
   * These functions add significant value by handling local conventions.
   */

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");

    // Handle international format starting with 254
    if (cleaned.startsWith("254")) {
      return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    }
    // Handle local format starting with 0
    else if (cleaned.startsWith("0")) {
      return `${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
    }

    return phone; // Return original if format is unrecognized
  }

  // ==========================================================================
  // STORAGE AND AUDIT FORMATTING
  // ==========================================================================

  /**
   * Enterprise-level formatting for storage classes and audit events.
   * These support compliance and operational visibility requirements.
   */

  static formatStorageClass(storageClass: string): string {
    const classMap: Record<string, string> = {
      hot: "Hot Storage",
      warm: "Warm Storage",
      cold: "Cold Storage",
      archive: "Archive Storage",
    };

    return Object.prototype.hasOwnProperty.call(classMap, storageClass) 
      ? classMap[storageClass]! 
      : storageClass.replace(/\b\w/g, (l) => l.toUpperCase());
  }

  static formatAuditEvent(action: string): string {
    const actionMap: Record<string, string> = {
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
      ? actionMap[action]! 
      : action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

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
export const getSrc = ImageUtils.getSrc.bind(ImageUtils);
export const getAlt = ImageUtils.getAlt.bind(ImageUtils);
export const getDisplayName = ImageUtils.getDisplayName.bind(ImageUtils);

// Status and color utilities
export const getStatusColor = ImageUtils.getStatusColor.bind(ImageUtils);
export const getApprovalStatusColor =
  ImageUtils.getApprovalStatusColor.bind(ImageUtils);
export const getRiskLevelColor = ImageUtils.getRiskLevelColor.bind(ImageUtils);

// Formatting utilities
export const formatFileSize = ImageUtils.formatFileSize.bind(ImageUtils);
export const formatSpeed = ImageUtils.formatSpeed.bind(ImageUtils);
export const formatETA = ImageUtils.formatETA.bind(ImageUtils);
export const formatDate = ImageUtils.formatDate.bind(ImageUtils);
export const formatTimestamp = ImageUtils.formatTimestamp.bind(ImageUtils);

// Document and workflow formatting
export const formatDocumentType =
  ImageUtils.formatDocumentType.bind(ImageUtils);
export const formatApprovalStatus =
  ImageUtils.formatApprovalStatus.bind(ImageUtils);
export const formatProcessingStep =
  ImageUtils.formatProcessingStep.bind(ImageUtils);
export const formatWorkflowStatus =
  ImageUtils.formatWorkflowStatus.bind(ImageUtils);

// Risk and confidence formatting
export const formatRiskScore = ImageUtils.formatRiskScore.bind(ImageUtils);
export const formatConfidence = ImageUtils.formatConfidence.bind(ImageUtils);

// Dimensional utilities
export const formatDimensions = ImageUtils.formatDimensions.bind(ImageUtils);
export const formatAspectRatio = ImageUtils.formatAspectRatio.bind(ImageUtils);
export const formatCoordinates = ImageUtils.formatCoordinates.bind(ImageUtils);
export const formatPropertyLocation =
  ImageUtils.formatPropertyLocation.bind(ImageUtils);

// State checking utilities
export const isUploading = ImageUtils.isUploading.bind(ImageUtils);
export const isProcessing = ImageUtils.isProcessing.bind(ImageUtils);
export const isComplete = ImageUtils.isComplete.bind(ImageUtils);
export const isFailed = ImageUtils.isFailed.bind(ImageUtils);

// Feature checking utilities
export const hasEnterpriseFeatures =
  ImageUtils.hasEnterpriseFeatures.bind(ImageUtils);
export const hasCollaborationFeatures =
  ImageUtils.hasCollaborationFeatures.bind(ImageUtils);
export const hasUploadCapabilities =
  ImageUtils.hasUploadCapabilities.bind(ImageUtils);

// Batch operations
export const filterByStatus = ImageUtils.filterByStatus.bind(ImageUtils);
export const sortByUploadDate = ImageUtils.sortByUploadDate.bind(ImageUtils);

// Statistics
export const getUploadStats = ImageUtils.getUploadStats.bind(ImageUtils);
export const getApprovalStats = ImageUtils.getApprovalStats.bind(ImageUtils);

// Validation utilities
export const isValidFileSize = ImageUtils.isValidFileSize.bind(ImageUtils);
export const isValidFormat = ImageUtils.isValidFormat.bind(ImageUtils);
export const getMaxFileSize = ImageUtils.getMaxFileSize.bind(ImageUtils);
export const getAllowedFormats = ImageUtils.getAllowedFormats.bind(ImageUtils);

// File processing utilities
export const generateThumbnailUrl =
  ImageUtils.generateThumbnailUrl.bind(ImageUtils);
export const getFileExtension = ImageUtils.getFileExtension.bind(ImageUtils);
export const isImageFile = ImageUtils.isImageFile.bind(ImageUtils);
export const isDocumentFile = ImageUtils.isDocumentFile.bind(ImageUtils);
export const generateUniqueId = ImageUtils.generateUniqueId.bind(ImageUtils);
export const calculateHash = ImageUtils.calculateHash.bind(ImageUtils);
export const sanitizeFilename = ImageUtils.sanitizeFilename.bind(ImageUtils);
export const generateThumbnailFilename =
  ImageUtils.generateThumbnailFilename.bind(ImageUtils);
export const truncateText = ImageUtils.truncateText.bind(ImageUtils);

// Localization utilities
export const formatCurrency = ImageUtils.formatCurrency.bind(ImageUtils);
export const formatPhoneNumber = ImageUtils.formatPhoneNumber.bind(ImageUtils);

// Enterprise utilities
export const formatStorageClass =
  ImageUtils.formatStorageClass.bind(ImageUtils);
export const formatAuditEvent = ImageUtils.formatAuditEvent.bind(ImageUtils);

// Additional batch operations
export const filterByApprovalStatus =
  ImageUtils.filterByApprovalStatus.bind(ImageUtils);
export const filterByDocumentType =
  ImageUtils.filterByDocumentType.bind(ImageUtils);
export const sortByFileSize = ImageUtils.sortByFileSize.bind(ImageUtils);
export const sortByRating = ImageUtils.sortByRating.bind(ImageUtils);

// Additional feature detection utilities
export const hasValidationResult =
  ImageUtils.hasValidationResult.bind(ImageUtils);
export const hasMetadata = ImageUtils.hasMetadata.bind(ImageUtils);

// Default export for class-based usage
export default ImageUtils;
