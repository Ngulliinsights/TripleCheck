/**
 * Type definitions for the image gallery system
 */

export interface BaseImage {
  id: string;
  src?: string;
  alt?: string;
  category?: string;
  caption?: string;
  file?: File;
  preview?: string;
  status?: "pending" | "uploading" | "completed" | "error";
  progress?: number;
}

export interface AdvancedImage extends BaseImage {
  is360?: boolean;
  tags?: string[];
  uploadDate?: Date;
  lastModified?: Date;
  fileSize?: number;
  dimensions?: { width: number; height: number };
  colorPalette?: string[];
  usage?: number;
  rating?: number;
  approvalStatus: "pending" | "approved" | "rejected" | "needs_revision";
  assignedTo?: string[];
  version?: number;
  collections?: string[];
  aiTags?: string[];
  similarityScore?: number;
  validationResult?: ValidationResult;
  metadata?: {
    format?: string;
    colorSpace?: string;
    dpi?: number;
    exif?: Record<string, unknown>;
  };
  comments?: ImageComment[];
  annotations?: ImageAnnotation[];
}

export interface ImageComment {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
  x?: number;
  y?: number;
  resolved?: boolean;
}

export interface ImageAnnotation {
  id: string;
  type: "rectangle" | "circle" | "arrow" | "text";
  data: Record<string, unknown>;
  user: string;
  timestamp: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score?: number;
  suggestions?: string[];
}

export type GalleryImage = BaseImage | AdvancedImage;
export type ViewMode = "grid" | "list" | "masonry";
export type SortMode = "name" | "date" | "size" | "rating" | "usage";

export interface SearchFacets {
  categories: Map<string, number>;
  tags: Map<string, number>;
  approvalStatus: Map<string, number>;
  users: Map<string, number>;
  collections: Map<string, number>;
}

export interface SelectedFacets {
  categories: string[];
  approvalStatus: string[];
  tags: string[];
  users: string[];
  collections: string[];
}

export interface WatermarkConfig {
  text: string;
  opacity: number;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  fontSize?: number;
  color?: string;
}

export interface GalleryProps {
  images: GalleryImage[];
  className?: string;
  showImageCounter?: boolean;
  wrapInCard?: boolean;
  enableSearch?: boolean;
  enableFullscreen?: boolean;
  enableCollaboration?: boolean;
  enableValidation?: boolean;
  enableWatermark?: boolean;
  watermarkConfig?: WatermarkConfig;
  userRole?: "viewer" | "editor" | "admin";
  onImageClick?: (img: GalleryImage, idx: number) => void;
  onBatchOperation?: (op: string, ids: string[]) => void;
  onImageUpload?: (files: FileList) => void;
  onImageDelete?: (id: string) => void;
  onImageUpdate?: (id: string, updates: Partial<GalleryImage>) => void;
  onValidationComplete?: (id: string, result: ValidationResult) => void;
  onCommentAdd?: (imageId: string, comment: string, x?: number, y?: number) => void;
  onAnnotationAdd?: (imageId: string, annotation: unknown) => void;
}
