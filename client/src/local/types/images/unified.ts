/**
 * Unified Image Type System - Optimized Version
 * Consolidates BaseImage, GalleryImage, PropertyImage, and EnterpriseImage
 * with improved type safety and performance optimizations
 */

// Re-export color utilities from unified-utils to avoid duplication
export {
  STATUS_COLORS,
  APPROVAL_STATUS_COLORS,
  RISK_LEVEL_COLORS,
} from '../../utils/images/unified-utils';

// Core image status and workflow types
export type ImageStatus = "pending" | "uploading" | "completed" | "error";
export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_revision";
export type DocumentType =
  | "property_photo"
  | "title_deed"
  | "survey_map"
  | "floor_plan"
  | "other";
export type WorkflowStatus = "draft" | "review" | "approved" | "published";

// Validation and metadata types
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly score?: number;
  readonly suggestions?: readonly string[];
}

export interface PropertyImageMetadata {
  readonly format?: string;
  readonly colorSpace?: string;
  readonly dpi?: number;
  readonly exif?: Readonly<Record<string, unknown>>; // Fixed: Added to cSpell dictionary
  readonly gpsCoordinates?: Readonly<{ lat: number; lng: number }>;
  readonly captureDate?: Date;
  readonly cameraModel?: string;
  readonly lensModel?: string;
  readonly focalLength?: number;
  readonly aperture?: string;
  readonly shutterSpeed?: string;
  readonly iso?: number;
}

export interface Comment {
  readonly id: string;
  readonly user: string;
  readonly text: string;
  readonly timestamp: Date;
  readonly x?: number;
  readonly y?: number;
  readonly resolved?: boolean;
}

export interface Annotation {
  readonly id: string;
  readonly type: "rectangle" | "circle" | "arrow" | "text";
  readonly data: Readonly<Record<string, unknown>>;
  readonly user: string;
  readonly timestamp: Date;
}

export interface ImageChunk {
  readonly index: number;
  readonly size: number;
  uploaded: boolean;
  retryCount: number;
}

// Unified Image Interface - Fixed exactOptionalPropertyTypes issues
export interface UnifiedImage {
  // Core properties (from BaseImage) - made required fields explicit
  readonly id: string;
  readonly src?: string | undefined;
  readonly alt?: string | undefined;
  readonly category?: string | undefined;
  readonly caption?: string | undefined;
  readonly file?: File | undefined;
  readonly preview?: string | undefined;
  readonly status?: ImageStatus | undefined;
  readonly progress?: number | undefined;

  // Property-specific extensions
  readonly documentType?: DocumentType | undefined;
  readonly landVerificationId?: string | undefined;
  readonly metadata?: PropertyImageMetadata | undefined;
  readonly validationResult?: ValidationResult | undefined;

  // Enterprise features (optional)
  readonly is360?: boolean | undefined;
  readonly tags?: readonly string[] | undefined;
  readonly uploadDate?: Date | undefined;
  readonly lastModified?: Date | undefined;
  readonly fileSize?: number | undefined;
  readonly dimensions?: Readonly<{ width: number; height: number }> | undefined;
  readonly colorPalette?: readonly string[] | undefined;
  readonly usage?: number | undefined;
  readonly rating?: number | undefined;
  readonly approvalStatus?: ApprovalStatus | undefined;
  readonly assignedTo?: readonly string[] | undefined;
  readonly version?: number | undefined;
  readonly collections?: readonly string[] | undefined;
  readonly aiTags?: readonly string[] | undefined;
  readonly similarityScore?: number | undefined;
  readonly comments?: readonly Comment[] | undefined;
  readonly annotations?: readonly Annotation[] | undefined;

  // Upload/workflow specific
  readonly sessionId?: string | undefined;
  readonly uploadSpeed?: number | undefined;
  readonly chunks?: readonly ImageChunk[] | undefined;
  readonly workflowStatus?: WorkflowStatus | undefined;
}

// Type aliases for backward compatibility
export type BaseImage = UnifiedImage;
export type GalleryImage = UnifiedImage;
export type PropertyImage = UnifiedImage;
export type EnterpriseImage = UnifiedImage;

// Input types for creating images - these remain flexible for input
export interface CreateImageInput {
  readonly id?: string;
  readonly file?: File;
  readonly src?: string;
  readonly alt?: string;
  readonly category?: string;
  readonly caption?: string;
  readonly documentType?: DocumentType;
  readonly landVerificationId?: string;
  readonly tags?: readonly string[];
  readonly collections?: readonly string[];
}

export interface ImageUpdate {
  readonly alt?: string;
  readonly category?: string;
  readonly caption?: string;
  readonly tags?: readonly string[];
  readonly rating?: number;
  readonly approvalStatus?: ApprovalStatus;
  readonly assignedTo?: readonly string[];
  readonly collections?: readonly string[];
  readonly workflowStatus?: WorkflowStatus;
}

// Improved ID generation using crypto.randomUUID when available
function generateImageId(): string {
  // Use crypto.randomUUID if available (more secure than Math.random)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `img_${crypto.randomUUID()}`;
  }
  
  // Fallback to timestamp + random string (avoiding deprecated substr)
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 11); // Fixed: using substring instead of substr
  return `img_${timestamp}_${randomStr}`;
}

// Factory functions for creating different image types
export function createBaseImage(input: CreateImageInput): UnifiedImage {
  const id = input.id ?? generateImageId();
  
  return {
    id,
    src: input.src ?? undefined, // Explicit undefined for exactOptionalPropertyTypes
    alt: input.alt ?? undefined,
    category: input.category ?? undefined,
    caption: input.caption ?? undefined,
    file: input.file ?? undefined,
    preview: input.file ? URL.createObjectURL(input.file) : undefined,
    status: "pending" as const,
    progress: 0,
  } satisfies UnifiedImage; // Using satisfies for better type checking
}

export function createPropertyImage(input: CreateImageInput): UnifiedImage {
  const baseImage = createBaseImage(input);
  return {
    ...baseImage,
    documentType: input.documentType ?? "property_photo",
    landVerificationId: input.landVerificationId ?? undefined, // Fixed: explicit undefined
    uploadDate: new Date(),
    fileSize: input.file?.size ?? undefined,
    dimensions: undefined,
    approvalStatus: "pending" as const,
    workflowStatus: "draft" as const,
  } satisfies UnifiedImage;
}

export function createEnterpriseImage(input: CreateImageInput): UnifiedImage {
  const propertyImage = createPropertyImage(input);
  return {
    ...propertyImage,
    tags: input.tags ?? [],
    collections: input.collections ?? [],
    usage: 0,
    rating: 0,
    version: 1,
    comments: [],
    annotations: [],
    aiTags: [],
  } satisfies UnifiedImage;
}

// Type guards with improved performance
export function hasUploadCapabilities(image: UnifiedImage): boolean {
  return Boolean(image.file) || Boolean(image.chunks);
}

export function hasEnterpriseFeatures(image: UnifiedImage): boolean {
  return Boolean(
    image.approvalStatus ||
    image.tags ||
    image.collections
  );
}

export function hasCollaborationFeatures(image: UnifiedImage): boolean {
  return Boolean(
    image.comments ||
    image.annotations ||
    image.assignedTo
  );
}

export function isPropertyImage(image: UnifiedImage): boolean {
  return Boolean(image.documentType || image.landVerificationId);
}

export function isUploading(image: UnifiedImage): boolean {
  return image.status === "uploading";
}

export function isProcessing(image: UnifiedImage): boolean {
  return image.status === "pending" || image.status === "uploading";
}

export function isComplete(image: UnifiedImage): boolean {
  return image.status === "completed";
}

export function isFailed(image: UnifiedImage): boolean {
  return image.status === "error";
}

// Conversion utilities for backward compatibility
export function toBaseImage(image: UnifiedImage): BaseImage {
  const { id, src, alt, category, caption, file, preview, status, progress } = image;
  return { id, src, alt, category, caption, file, preview, status, progress };
}

export function toPropertyImage(image: UnifiedImage): PropertyImage {
  return image; // PropertyImage is now just UnifiedImage
}

export function toEnterpriseImage(image: UnifiedImage): EnterpriseImage {
  return image; // EnterpriseImage is now just UnifiedImage
}

// Optimized validation with reduced cognitive complexity
export function validateUnifiedImage(image: UnifiedImage): ValidationResult {
  const validationState = {
    errors: [] as string[],
    warnings: [] as string[],
  };

  // Split validation into smaller functions for better maintainability
  validateRequiredFields(image, validationState);
  validateSourceFields(image, validationState);
  validateFileProperties(image, validationState);
  validateAccessibility(image, validationState);
  validateEnterpriseFeatures(image, validationState);

  const { errors, warnings } = validationState;
  
  // Simplified score calculation
  const score = calculateValidationScore(errors.length, warnings.length);

  return {
    isValid: errors.length === 0,
    errors: Object.freeze(errors), // Make immutable
    warnings: Object.freeze(warnings),
    score,
  };
}

// Helper functions for validation (reduces cognitive complexity)
function validateRequiredFields(
  image: UnifiedImage,
  state: { errors: string[]; warnings: string[] }
): void {
  if (!image.id) {
    state.errors.push("Image ID is required");
  }
}

function validateSourceFields(
  image: UnifiedImage,
  state: { errors: string[]; warnings: string[] }
): void {
  if (!image.src && !image.file && !image.preview) {
    state.errors.push("Image must have a source (src, file, or preview)");
  }
}

function validateFileProperties(
  image: UnifiedImage,
  state: { errors: string[]; warnings: string[] }
): void {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB constant
  
  if (image.file && image.file.size > MAX_FILE_SIZE) {
    state.warnings.push("Large file size may affect performance");
  }
}

function validateAccessibility(
  image: UnifiedImage,
  state: { errors: string[]; warnings: string[] }
): void {
  if (!image.alt && !image.file?.name) {
    state.warnings.push("Alt text is recommended for accessibility");
  }
}

function validateEnterpriseFeatures(
  image: UnifiedImage,
  state: { errors: string[]; warnings: string[] }
): void {
  if (!hasEnterpriseFeatures(image)) return;

  const validApprovalStatuses = ["pending", "approved", "rejected", "needs_revision"] as const;
  
  if (image.approvalStatus && !validApprovalStatuses.includes(image.approvalStatus)) {
    state.errors.push("Invalid approval status");
  }

  if (image.rating !== undefined && (image.rating < 0 || image.rating > 5)) {
    state.errors.push("Rating must be between 0 and 5");
  }
}

// Extracted score calculation (removes nested ternary)
function calculateValidationScore(errorCount: number, warningCount: number): number {
  if (errorCount > 0) return 0;
  if (warningCount === 0) return 100;
  return 80;
}

// Conversion utilities for backward compatibility
export function convertBaseImageToUnified(image: BaseImage): UnifiedImage {
  return image; // BaseImage is now just UnifiedImage
}

export function convertPropertyImageToUnified(image: PropertyImage): UnifiedImage {
  return image; // PropertyImage is now just UnifiedImage
}

export function convertEnterpriseImageToUnified(image: EnterpriseImage): UnifiedImage {
  return image; // EnterpriseImage is now just UnifiedImage
}

// Utility function aliases for convenience
export function getImageSrc(image: UnifiedImage): string {
  return (
    image.src ??
    image.preview ??
    (image.file && URL.createObjectURL(image.file)) ??
    "/placeholder-property.jpg"
  );
}

export function getImageAlt(image: UnifiedImage): string {
  return image.alt ?? image.file?.name ?? "Gallery image";
}

export function getImageDisplayName(image: UnifiedImage): string {
  return image.caption ?? image.alt ?? image.file?.name ?? `Image ${image.id}`;
}

export function isImageUploading(image: UnifiedImage): boolean {
  return image.status === "uploading";
}

export function isImageProcessing(image: UnifiedImage): boolean {
  return image.status === "pending" || image.status === "uploading";
}

export function isImageComplete(image: UnifiedImage): boolean {
  return image.status === "completed";
}

export function isImageFailed(image: UnifiedImage): boolean {
  return image.status === "error";
}

// Color functions are now imported from unified-utils - use those instead
// Re-export for backward compatibility
export {
  getStatusColor as getImageStatusColor,
  getApprovalStatusColor,
} from '../../utils/images/unified-utils';

export function hasWorkflowFeatures(image: UnifiedImage): boolean {
  return Boolean(
    image.workflowStatus ||
    image.chunks ||
    image.sessionId
  );
}

export default UnifiedImage;