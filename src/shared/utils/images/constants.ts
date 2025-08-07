/**
 * Constants for Property Image Management
 * Centralized constants for consistent styling and behavior
 */

// Status color mappings for UI components
export const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  uploading: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  uploaded: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  paused: 'bg-gray-100 text-gray-800',
} as const;

// Approval status color mappings
export const APPROVAL_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  requires_review: 'bg-orange-100 text-orange-800',
  compliance_hold: 'bg-purple-100 text-purple-800',
} as const;

// Risk level color mappings
export const RISK_LEVEL_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
} as const;

// Document type icons
export const DOCUMENT_TYPE_ICONS = {
  property_photo: '📷',
  title_deed: '📄',
  survey_plan: '🗺️',
  valuation_report: '📊',
  identification_document: '🆔',
  other_document: '📋',
} as const;

// Processing step icons
export const PROCESSING_STEP_ICONS = {
  validation: '✅',
  virus_scan: '🛡️',
  metadata_extraction: '🔍',
  compliance_check: '⚖️',
  document_auth: '🔐',
  fraud_detection: '🚨',
  image_optimization: '⚡',
  thumbnail_generation: '🖼️',
} as const;

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  property_photo: 50 * 1024 * 1024, // 50MB
  title_deed: 20 * 1024 * 1024, // 20MB
  survey_plan: 30 * 1024 * 1024, // 30MB
  valuation_report: 15 * 1024 * 1024, // 15MB
  identification_document: 10 * 1024 * 1024, // 10MB
  other_document: 25 * 1024 * 1024, // 25MB
} as const;

// Supported file formats
export const SUPPORTED_FORMATS = {
  property_photo: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
  title_deed: ['pdf', 'jpg', 'jpeg', 'png'],
  survey_plan: ['pdf', 'jpg', 'jpeg', 'png', 'tiff'],
  valuation_report: ['pdf', 'jpg', 'jpeg', 'png'],
  identification_document: ['jpg', 'jpeg', 'png', 'pdf'],
  other_document: ['pdf', 'jpg', 'jpeg', 'png', 'tiff'],
} as const;

// Upload configuration
export const UPLOAD_CONFIG = {
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
  MAX_CONCURRENT_UPLOADS: 3,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  TIMEOUT: 30000, // 30 seconds
} as const;

// Validation thresholds
export const VALIDATION_THRESHOLDS = {
  MIN_IMAGE_WIDTH: 800,
  MIN_IMAGE_HEIGHT: 600,
  MAX_IMAGE_WIDTH: 8000,
  MAX_IMAGE_HEIGHT: 8000,
  MIN_DOCUMENT_WIDTH: 600,
  MIN_DOCUMENT_HEIGHT: 400,
  MAX_ASPECT_RATIO_DEVIATION: 0.1,
} as const;

// Fraud detection thresholds
export const FRAUD_THRESHOLDS = {
  LOW_RISK: 0.3,
  MEDIUM_RISK: 0.6,
  HIGH_RISK: 0.8,
  CRITICAL_RISK: 0.9,
} as const;

// Document authentication confidence thresholds
export const AUTH_CONFIDENCE_THRESHOLDS = {
  MINIMUM_ACCEPTABLE: 0.7,
  HIGH_CONFIDENCE: 0.9,
  VERY_HIGH_CONFIDENCE: 0.95,
} as const;

// Storage classes
export const STORAGE_CLASSES = {
  HOT: 'hot',
  WARM: 'warm',
  COLD: 'cold',
  ARCHIVE: 'archive',
} as const;

// Thumbnail sizes
export const THUMBNAIL_SIZES = [150, 300, 600, 1200] as const;

// Image optimization quality levels
export const OPTIMIZATION_QUALITY = {
  LOW: 60,
  MEDIUM: 80,
  HIGH: 90,
  LOSSLESS: 100,
} as const;

// Audit event types
export const AUDIT_EVENTS = {
  UPLOAD_INITIATED: 'upload_initiated',
  UPLOAD_COMPLETED: 'upload_completed',
  VALIDATION_PASSED: 'validation_passed',
  VALIDATION_FAILED: 'validation_failed',
  VIRUS_SCAN_CLEAN: 'virus_scan_clean',
  VIRUS_SCAN_THREAT: 'virus_scan_threat',
  DOCUMENT_AUTHENTICATED: 'document_authenticated',
  DOCUMENT_AUTH_FAILED: 'document_auth_failed',
  FRAUD_CHECK_PASSED: 'fraud_check_passed',
  FRAUD_RISK_DETECTED: 'fraud_risk_detected',
  COMPLIANCE_APPROVED: 'compliance_approved',
  COMPLIANCE_FLAGGED: 'compliance_flagged',
  IMAGE_APPROVED: 'image_approved',
  IMAGE_REJECTED: 'image_rejected',
  METADATA_UPDATED: 'metadata_updated',
  ACCESS_GRANTED: 'access_granted',
  ACCESS_DENIED: 'access_denied',
} as const;

// Kenya-specific location constants
export const KENYA_REGIONS = {
  NAIROBI: { name: 'Nairobi County', bounds: { lat: [-1.5, -1.0], lng: [36.5, 37.0] } },
  MOMBASA: { name: 'Mombasa County', bounds: { lat: [-4.5, -3.5], lng: [39.0, 40.0] } },
  KISUMU: { name: 'Kisumu County', bounds: { lat: [-0.5, 0.5], lng: [34.5, 35.5] } },
  NYERI: { name: 'Nyeri County', bounds: { lat: [-1.0, 0.0], lng: [37.0, 38.0] } },
} as const;

// Error codes
export const ERROR_CODES = {
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VIRUS_DETECTED: 'VIRUS_DETECTED',
  DOCUMENT_AUTH_FAILED: 'DOCUMENT_AUTH_FAILED',
  FRAUD_DETECTED: 'FRAUD_DETECTED',
  COMPLIANCE_VIOLATION: 'COMPLIANCE_VIOLATION',
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  STORAGE_FAILED: 'STORAGE_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  UPLOAD_COMPLETED: 'Image uploaded successfully',
  VALIDATION_PASSED: 'Image validation passed',
  DOCUMENT_AUTHENTICATED: 'Document authenticated successfully',
  FRAUD_CHECK_PASSED: 'Fraud check passed',
  COMPLIANCE_APPROVED: 'Compliance check approved',
  PROCESSING_COMPLETED: 'Image processing completed',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UPLOAD_FAILED: 'Failed to upload image',
  VALIDATION_FAILED: 'Image validation failed',
  VIRUS_DETECTED: 'Virus detected in image',
  DOCUMENT_AUTH_FAILED: 'Document authentication failed',
  FRAUD_DETECTED: 'Fraud risk detected',
  COMPLIANCE_VIOLATION: 'Compliance violation detected',
  PROCESSING_FAILED: 'Image processing failed',
  STORAGE_FAILED: 'Failed to store image',
  NETWORK_ERROR: 'Network error occurred',
  TIMEOUT_ERROR: 'Request timed out',
  QUOTA_EXCEEDED: 'Storage quota exceeded',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Image not found',
  CONFLICT: 'Conflict with existing image',
  INTERNAL_ERROR: 'Internal server error',
} as const;