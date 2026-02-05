import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Grid as GridIcon,
  List,
  Layers,
  Download,
  Share2,
  Archive,
  Star,
  FileImage,
  Eye,
  Users,
  MessageCircle,
  Bookmark,
  Heart,
  Filter,
  SortAsc,
  Upload,
  Trash2,
  Copy,
  Move,
  Tag,
  Calendar,
  AlertCircle,
} from "lucide-react"
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  memo,
  type FC,
  useRef,
} from "react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import type { ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch"

import { ImageUtils } from "../../utils/images/unified-utils"

/* ------------------------------------------------------------------ */
/* 1. TYPES AND INTERFACES                                           */
/* ------------------------------------------------------------------ */

// Lazy loading image component for performance optimization
const LazyImage = memo<{
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}>(({ src, alt, className, onLoad, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const image = entry.target as HTMLImageElement;
            if (image.dataset.src) {
              image.src = image.dataset.src;
              image.removeAttribute('data-src');
              observer.unobserve(image);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(img);
    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  return (
    <div className="relative">
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      {hasError ? (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
          <FileImage className="w-8 h-8" />
        </div>
      ) : (
        <img
          ref={imgRef}
          data-src={src}
          alt={alt}
          className={className}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

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

export interface EnterpriseImage extends BaseImage {
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
  comments?: Array<{
    id: string;
    user: string;
    text: string;
    timestamp: Date;
    x?: number;
    y?: number;
    resolved?: boolean;
  }>;
  annotations?: Array<{
    id: string;
    type: "rectangle" | "circle" | "arrow" | "text";
    data: Record<string, unknown>;
    user: string;
    timestamp: Date;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score?: number;
  suggestions?: string[];
}

export type GalleryImage = BaseImage | EnterpriseImage;
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
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center";
  fontSize?: number;
  color?: string;
}

export interface Props {
  images: GalleryImage[];
  className?: string;
  showImageCounter?: boolean;
  wrapInCard?: boolean;

  // Enterprise features
  enableSearch?: boolean;
  enableFullscreen?: boolean;
  enableCollaboration?: boolean;
  enableValidation?: boolean;
  enableWatermark?: boolean;
  watermarkConfig?: WatermarkConfig;

  // User permissions
  userRole?: "viewer" | "editor" | "admin";

  // Callbacks
  onImageClick?: (img: GalleryImage, idx: number) => void;
  onBatchOperation?: (op: string, ids: string[]) => void;
  onImageUpload?: (files: FileList) => void;
  onImageDelete?: (id: string) => void;
  onImageUpdate?: (id: string, updates: Partial<GalleryImage>) => void;
  onValidationComplete?: (id: string, result: ValidationResult) => void;
  onCommentAdd?: (
    imageId: string,
    comment: string,
    x?: number,
    y?: number
  ) => void;
  onAnnotationAdd?: (imageId: string, annotation: unknown) => void;
}

/* ------------------------------------------------------------------ */
/* 2. CONSTANTS AND CONFIGURATIONS                                   */
/* ------------------------------------------------------------------ */

const VIEW_MODES = {
  grid: {
    gridClass:
      "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
    icon: GridIcon,
    label: "Grid",
  },
  list: {
    gridClass: "grid grid-cols-1 gap-2",
    icon: List,
    label: "List",
  },
  masonry: {
    gridClass: "columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4",
    icon: Layers,
    label: "Masonry",
  },
} as const;

const BATCH_OPERATIONS = [
  { op: "download", icon: Download, label: "Download", color: "blue" },
  { op: "share", icon: Share2, label: "Share", color: "green" },
  { op: "archive", icon: Archive, label: "Archive", color: "yellow" },
  { op: "delete", icon: Trash2, label: "Delete", color: "red" },
  { op: "move", icon: Move, label: "Move", color: "purple" },
  { op: "copy", icon: Copy, label: "Copy", color: "indigo" },
  { op: "tag", icon: Tag, label: "Tag", color: "pink" },
] as const;

const SORT_OPTIONS = [
  { value: "name", label: "Name", icon: SortAsc },
  { value: "date", label: "Date", icon: Calendar },
  { value: "size", label: "Size", icon: FileImage },
  { value: "rating", label: "Rating", icon: Star },
  { value: "usage", label: "Usage", icon: Eye },
] as const;

/* ------------------------------------------------------------------ */
/* 3. UTILITY FUNCTIONS                                              */
/* ------------------------------------------------------------------ */

const isEnterpriseImage = (img: GalleryImage): img is EnterpriseImage => {
  return "approvalStatus" in img;
};

/* ------------------------------------------------------------------ */
/* 4. VALIDATION SERVICE                                             */
/* ------------------------------------------------------------------ */

class ImageValidationService {
  async validateUrl(url: string): Promise<ValidationResult> {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const validation = this.processResponse(response);

      return {
        isValid: validation.errors.length === 0,
        errors: validation.errors,
        warnings: validation.warnings,
        score: this.calculateValidationScore(
          validation.errors.length,
          validation.warnings.length
        ),
      };
    } catch (error) {
      console.error("Image validation failed:", error);
      return this.createErrorResult();
    }
  }

  private processResponse(response: Response): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/")) {
      errors.push("Invalid image format");
    }

    if (!response.ok) {
      errors.push("Image not accessible");
    }

    this.checkFileSize(response, warnings);

    return { errors, warnings };
  }

  private checkFileSize(response: Response, warnings: string[]): void {
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      warnings.push("Large file size may affect performance");
    }
  }

  private createErrorResult(): ValidationResult {
    return {
      isValid: false,
      errors: ["Failed to validate image"],
      warnings: [],
      score: 0,
    };
  }

  private calculateValidationScore(
    errorCount: number,
    warningCount: number
  ): number {
    if (errorCount > 0) return 0;
    if (warningCount === 0) return 100;
    return 80;
  }
}

/* ------------------------------------------------------------------ */
/* 5. SEARCH AND FILTERING LOGIC                                     */
/* ------------------------------------------------------------------ */

const matchesTextQuery = (img: GalleryImage, query: string): boolean => {
  const normalizedQuery = query.toLowerCase();
  const alt = ImageUtils.getAlt(img).toLowerCase();
  const category = img.category?.toLowerCase() ?? "";

  if (isEnterpriseImage(img)) {
    const tags = img.tags?.map((t) => t.toLowerCase()) ?? [];
    const aiTags = img.aiTags?.map((t) => t.toLowerCase()) ?? [];
    const collections = img.collections?.map((c) => c.toLowerCase()) ?? [];

    return (
      alt.includes(normalizedQuery) ||
      category.includes(normalizedQuery) ||
      tags.some((tag) => tag.includes(normalizedQuery)) ||
      aiTags.some((tag) => tag.includes(normalizedQuery)) ||
      collections.some((collection) => collection.includes(normalizedQuery))
    );
  }

  return alt.includes(normalizedQuery) || category.includes(normalizedQuery);
};

const matchesFacetFilter = (
  img: GalleryImage,
  facetType: keyof SelectedFacets,
  values: string[]
): boolean => {
  if (values.length === 0) return true;

  if (facetType === "categories") {
    return img.category ? values.includes(img.category) : false;
  }

  if (facetType === "approvalStatus") {
    return isEnterpriseImage(img) && img.approvalStatus ?
        values.includes(img.approvalStatus)
      : false;
  }

  if (facetType === "tags") {
    return isEnterpriseImage(img) && img.tags ?
        img.tags.some((tag) => values.includes(tag))
      : false;
  }

  if (facetType === "users") {
    return isEnterpriseImage(img) && img.assignedTo ?
        img.assignedTo.some((user) => values.includes(user))
      : false;
  }

  if (facetType === "collections") {
    return isEnterpriseImage(img) && img.collections ?
        img.collections.some((collection) => values.includes(collection))
      : false;
  }

  return true;
};

const buildFacetCounts = (images: GalleryImage[]): SearchFacets => {
  const facets: SearchFacets = {
    categories: new Map(),
    tags: new Map(),
    approvalStatus: new Map(),
    users: new Map(),
    collections: new Map(),
  };

  images.forEach((img) => {
    // Categories
    if (img.category) {
      const count = facets.categories.get(img.category) || 0;
      facets.categories.set(img.category, count + 1);
    }

    if (isEnterpriseImage(img)) {
      // Approval status
      if (img.approvalStatus) {
        const count = facets.approvalStatus.get(img.approvalStatus) || 0;
        facets.approvalStatus.set(img.approvalStatus, count + 1);
      }

      // Tags
      img.tags?.forEach((tag) => {
        const count = facets.tags.get(tag) || 0;
        facets.tags.set(tag, count + 1);
      });

      // Users
      img.assignedTo?.forEach((user) => {
        const count = facets.users.get(user) || 0;
        facets.users.set(user, count + 1);
      });

      // Collections
      img.collections?.forEach((collection) => {
        const count = facets.collections.get(collection) || 0;
        facets.collections.set(collection, count + 1);
      });
    }
  });

  return facets;
};

const sortImages = (
  images: GalleryImage[],
  sortMode: SortMode,
  ascending: boolean = true
): GalleryImage[] => {
  return [...images].sort((a, b) => {
    let comparison = 0;

    if (sortMode === "name") {
      comparison = ImageUtils.getAlt(a).localeCompare(ImageUtils.getAlt(b));
    } else if (sortMode === "date") {
      const dateA = isEnterpriseImage(a) ? a.uploadDate : undefined;
      const dateB = isEnterpriseImage(b) ? b.uploadDate : undefined;
      comparison = (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
    } else if (sortMode === "size") {
      const sizeA = isEnterpriseImage(a) ? a.fileSize : 0;
      const sizeB = isEnterpriseImage(b) ? b.fileSize : 0;
      comparison = (sizeA || 0) - (sizeB || 0);
    } else if (sortMode === "rating") {
      const ratingA = isEnterpriseImage(a) ? a.rating : 0;
      const ratingB = isEnterpriseImage(b) ? b.rating : 0;
      comparison = (ratingA || 0) - (ratingB || 0);
    } else if (sortMode === "usage") {
      const usageA = isEnterpriseImage(a) ? a.usage : 0;
      const usageB = isEnterpriseImage(b) ? b.usage : 0;
      comparison = (usageA || 0) - (usageB || 0);
    }

    return ascending ? comparison : -comparison;
  });
};

/* ------------------------------------------------------------------ */
/* 6. ENTERPRISE SEARCH HOOK                                         */
/* ------------------------------------------------------------------ */

interface SearchResult {
  filtered: GalleryImage[];
  facets: SearchFacets;
  total: number;
}

const useEnterpriseSearch = (
  images: GalleryImage[],
  query: string,
  selectedFacets: SelectedFacets,
  sortMode: SortMode,
  sortAscending: boolean
): SearchResult => {
  return useMemo(() => {
    let filtered = images;

    // Apply text search
    if (query.trim()) {
      filtered = filtered.filter((img) => matchesTextQuery(img, query));
    }

    // Apply facet filters
    (
      Object.entries(selectedFacets) as Array<[keyof SelectedFacets, string[]]>
    ).forEach(([facetType, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter((img) =>
          matchesFacetFilter(img, facetType, values)
        );
      }
    });

    // Apply sorting
    filtered = sortImages(filtered, sortMode, sortAscending);

    // Build facet counts from all images (not just filtered)
    const facets = buildFacetCounts(images);

    return {
      filtered,
      facets,
      total: filtered.length,
    };
  }, [images, query, selectedFacets, sortMode, sortAscending]);
};

/* ------------------------------------------------------------------ */
/* 7. ENTERPRISE IMAGE ENGINE COMPONENT                              */
/* ------------------------------------------------------------------ */

const EnterpriseImageEngine = memo<{
  src: string;
  alt: string;
  className?: string;
  enableWatermark?: boolean;
  watermarkConfig?: WatermarkConfig;
  enableValidation?: boolean;
  onValidationComplete?: (result: ValidationResult) => void;
  [key: string]: unknown;
}>(
  ({
    src,
    alt,
    className,
    enableWatermark = false,
    watermarkConfig,
    enableValidation = false,
    onValidationComplete,
    ...props
  }) => {
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      if (enableValidation && src) {
        const validationService = new ImageValidationService();
        validationService
          .validateUrl(src)
          .then((result) => {
            setValidation(result);
            onValidationComplete?.(result);
            return result;
          })
          .catch(() => {
            const errorResult: ValidationResult = {
              isValid: false,
              errors: ["Validation failed"],
              warnings: [],
            };
            setValidation(errorResult);
            onValidationComplete?.(errorResult);
          });
      }
    }, [src, enableValidation, onValidationComplete]);

    const handleLoad = useCallback(() => {
      setIsLoading(false);
      setHasError(false);
    }, []);

    const handleError = useCallback(() => {
      setIsLoading(false);
      setHasError(true);
    }, []);

    return (
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
        )}

        {hasError ?
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            <FileImage className="w-8 h-8" />
          </div>
        : <img
            src={src}
            alt={alt}
            className={className}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        }

        {enableWatermark && watermarkConfig && !hasError && (
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            style={
              {
                fontSize: watermarkConfig.fontSize || 16,
                color: watermarkConfig.color || "rgba(255, 255, 255, 0.7)",
                opacity: watermarkConfig.opacity,
              } as React.CSSProperties
            }
          >
            <span className="font-semibold text-shadow">
              {watermarkConfig.text}
            </span>
          </div>
        )}

        {validation && !validation.isValid && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Invalid
          </div>
        )}

        {validation && validation.isValid && validation.warnings.length > 0 && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Warning
          </div>
        )}
      </div>
    );
  }
);

EnterpriseImageEngine.displayName = "EnterpriseImageEngine";

/* ------------------------------------------------------------------ */
/* 8. IMAGE CARD COMPONENT                                           */
/* ------------------------------------------------------------------ */

const ImageCard = memo<{
  image: GalleryImage;
  index: number;
  viewMode: ViewMode;
  isSelected: boolean;
  enableSelection: boolean;
  enableCollaboration: boolean;
  enableWatermark: boolean;
  watermarkConfig?: WatermarkConfig;
  userRole: string;
  onToggleSelection: (id: string) => void;
  onImageClick: (index: number) => void;
  onImageUpdate?: (id: string, updates: Partial<GalleryImage>) => void;
}>(
  ({
    image,
    index,
    viewMode,
    isSelected,
    enableSelection,
    enableCollaboration,
    enableWatermark,
    watermarkConfig,
    userRole,
    onToggleSelection,
    onImageClick,
    onImageUpdate,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isEnterprise = isEnterpriseImage(image);

    const handleCardClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target instanceof HTMLInputElement) return;
        onImageClick(index);
      },
      [index, onImageClick]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onImageClick(index);
        }
      },
      [index, onImageClick]
    );

    const handleRatingChange = useCallback(
      (rating: number) => {
        if (isEnterprise && onImageUpdate) {
          onImageUpdate(image.id, { rating });
        }
      },
      [image.id, isEnterprise, onImageUpdate]
    );

    const cardClasses = useMemo(() => {
      const base =
        "relative group bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200";
      const hover = "hover:shadow-lg hover:scale-[1.02]";
      const selected = isSelected ? "ring-2 ring-blue-500 shadow-lg" : "";
      const cursor = "cursor-pointer";

      return `${base} ${hover} ${selected} ${cursor}`;
    }, [isSelected]);

    const imageClasses = useMemo(() => {
      if (viewMode === "list") {
        return "w-24 h-24 object-cover";
      }
      return "w-full h-48 object-cover transition-transform group-hover:scale-105";
    }, [viewMode]);

    if (viewMode === "list") {
      return (
        <div
          className={cardClasses}
          onClick={handleCardClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          tabIndex={0}
          role="button"
          aria-label={`View ${ImageUtils.getAlt(image)}`}
        >
          <div className="flex items-center p-4 gap-4">
            {enableSelection && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelection(image.id);
                }}
                className="w-4 h-4 rounded border-gray-300"
                aria-label={`Select ${ImageUtils.getAlt(image)}`}
              />
            )}

            <div className="flex-shrink-0">
              <EnterpriseImageEngine
                src={ImageUtils.getSrc(image)}
                alt={ImageUtils.getAlt(image)}
                className={imageClasses}
                enableWatermark={enableWatermark}
                {...(watermarkConfig && { watermarkConfig })}
                enableValidation={isEnterprise}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {ImageUtils.getAlt(image)}
              </h3>
              {image.category && (
                <p className="text-sm text-gray-500">{image.category}</p>
              )}
              {isEnterprise && (
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${ImageUtils.getApprovalStatusColor(image.approvalStatus)}`}
                  >
                    {image.approvalStatus.replace("_", " ")}
                  </span>
                  {image.rating && (
                    <div className="flex items-center">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs ml-1">{image.rating}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 text-right">
              {isEnterprise && (
                <>
                  <p className="text-sm text-gray-900">
                    {ImageUtils.formatFileSize(image.fileSize)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ImageUtils.formatDate(image.uploadDate)}
                  </p>
                  {image.usage !== undefined && (
                    <p className="text-xs text-gray-500">{image.usage} views</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cardClasses}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        tabIndex={0}
        role="button"
        aria-label={`View ${ImageUtils.getAlt(image)}`}
      >
        {/* Selection checkbox */}
        {enableSelection && (
          <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelection(image.id);
              }}
              className="w-4 h-4 rounded border-gray-300"
              aria-label={`Select ${ImageUtils.getAlt(image)}`}
            />
          </div>
        )}

        {/* Quick actions */}
        {isEnterprise && userRole !== "viewer" && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity space-y-1">
            <button
              className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                handleRatingChange(image.rating === 5 ? 0 : 5);
              }}
              aria-label="Toggle favorite"
            >
              <Heart
                className={`w-3 h-3 ${image.rating === 5 ? "text-red-500 fill-red-500" : "text-gray-600"}`}
              />
            </button>
            <button
              className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
              aria-label="Bookmark"
            >
              <Bookmark className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        )}

        {/* Status indicators */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
          {image.status && image.status !== "completed" && (
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${ImageUtils.getStatusColor(image.status)}`}
              />
              {image.status === "uploading" && image.progress !== undefined && (
                <div className="bg-black/60 text-white px-2 py-1 rounded text-xs">
                  {Math.round(image.progress)}%
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main image */}
        <div className="overflow-hidden">
          <EnterpriseImageEngine
            src={ImageUtils.getSrc(image)}
            alt={ImageUtils.getAlt(image)}
            className={imageClasses}
            enableWatermark={enableWatermark}
            {...(watermarkConfig && { watermarkConfig })}
            enableValidation={isEnterprise}
          />
        </div>

        {/* Metadata overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="text-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium truncate">
                {ImageUtils.getAlt(image)}
              </span>
              {isEnterprise && image.rating && (
                <div className="flex items-center">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs ml-1">{image.rating}</span>
                </div>
              )}
            </div>

            {isEnterprise && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${ImageUtils.getApprovalStatusColor(image.approvalStatus).replace("border-", "")}`}
                  >
                    {image.approvalStatus.replace("_", " ")}
                  </span>
                  {image.is360 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">
                      360°
                    </span>
                  )}
                </div>

                {enableCollaboration && image.assignedTo && (
                  <div className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    <span className="text-xs">{image.assignedTo.length}</span>
                  </div>
                )}
              </div>
            )}

            {isEnterprise && (
              <div className="flex items-center justify-between mt-1 text-xs">
                <span>{image.usage || 0} views</span>
                <span>{ImageUtils.formatFileSize(image.fileSize)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {isEnterprise && image.tags && image.tags.length > 0 && isHovered && (
          <div className="absolute top-12 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex flex-wrap gap-1 max-w-32">
              {image.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
              {image.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                  +{image.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

ImageCard.displayName = "ImageCard";

/* ------------------------------------------------------------------ */
/* 9. SEARCH INTERFACE COMPONENT                                     */
/* ------------------------------------------------------------------ */

const SearchInterface = memo<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  facets: SearchFacets;
  selectedFacets: SelectedFacets;
  onFacetChange: (
    type: keyof SelectedFacets,
    value: string,
    checked: boolean
  ) => void;
  totalResults: number;
  sortMode: SortMode;
  sortAscending: boolean;
  onSortChange: (mode: SortMode, ascending: boolean) => void;
  onClearFilters: () => void;
}>(
  ({
    searchQuery,
    onSearchChange,
    facets,
    selectedFacets,
    onFacetChange,
    totalResults,
    sortMode,
    sortAscending,
    onSortChange,
    onClearFilters,
  }) => {
    const [showFilters, setShowFilters] = useState(false);

    const hasActiveFilters = useMemo(() => {
      const facetValues = Object.values(selectedFacets) as string[][];
      return facetValues.some((values) => values.length > 0);
    }, [selectedFacets]);

    const renderFacetOption = useCallback(
      (value: string, count: number, facetType: keyof SelectedFacets) => (
        <label
          key={value}
          className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
        >
          <input
            type="checkbox"
            checked={(
              selectedFacets[facetType as keyof SelectedFacets] || []
            ).includes(value)}
            onChange={(e) => onFacetChange(facetType, value, e.target.checked)}
            className="mr-2 rounded border-gray-300"
          />
          <span className="flex-1 truncate">{value}</span>
          <span className="text-gray-500 text-xs">({count})</span>
        </label>
      ),
      [selectedFacets, onFacetChange]
    );

    const renderFacetSection = useCallback(
      (
        title: string,
        facetType: keyof SelectedFacets,
        facetMap: Map<string, number>
      ) => {
        if (facetMap.size === 0) return null;

        const sortedEntries = Array.from(facetMap.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10);

        return (
          <div key={facetType}>
            <h4 className="font-medium mb-2 text-sm">{title}</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {sortedEntries.map(([value, count]) =>
                renderFacetOption(value, count, facetType)
              )}
            </div>
          </div>
        );
      },
      [renderFacetOption]
    );

    return (
      <div className="space-y-4 mb-6">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search images... (⌘K for command palette)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search images"
          />
        </div>

        {/* Results and controls */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {totalResults} image{totalResults !== 1 ? "s" : ""} found
            </span>

            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort controls */}
            <select
              value={sortMode}
              onChange={(e) =>
                onSortChange(e.target.value as SortMode, sortAscending)
              }
              className="text-sm border border-gray-300 rounded px-2 py-1"
              aria-label="Sort images by"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => onSortChange(sortMode, !sortAscending)}
              className="p-1 border border-gray-300 rounded hover:bg-gray-50"
              title={sortAscending ? "Sort descending" : "Sort ascending"}
            >
              <SortAsc
                className={`w-4 h-4 ${sortAscending ? "" : "rotate-180"}`}
              />
            </button>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-50 ${
                showFilters ?
                  "bg-blue-50 border-blue-300 text-blue-700"
                : "border-gray-300"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                  {(Object.values(selectedFacets) as string[][]).reduce(
                    (sum, values) => sum + values.length,
                    0
                  )}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
            {renderFacetSection("Categories", "categories", facets.categories)}
            {renderFacetSection(
              "Status",
              "approvalStatus",
              facets.approvalStatus
            )}
            {renderFacetSection("Tags", "tags", facets.tags)}
            {renderFacetSection("Assigned Users", "users", facets.users)}
            {renderFacetSection(
              "Collections",
              "collections",
              facets.collections
            )}
          </div>
        )}
      </div>
    );
  }
);

SearchInterface.displayName = "SearchInterface";

/* ------------------------------------------------------------------ */
/* 10. BATCH OPERATIONS TOOLBAR                                      */
/* ------------------------------------------------------------------ */

const BatchOperationsToolbar = memo<{
  selectedCount: number;
  onBatchOperation: (operation: string) => void;
  onClearSelection: () => void;
  userRole: string;
}>(({ selectedCount, onBatchOperation, onClearSelection, userRole }) => {
  if (selectedCount === 0) return null;

  const allowedOperations = BATCH_OPERATIONS.filter((op) => {
    if (userRole === "viewer") {
      return ["download", "share"].includes(op.op);
    }
    if (userRole === "editor") {
      return !["delete"].includes(op.op);
    }
    return true;
  });

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-40">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedCount} image{selectedCount !== 1 ? "s" : ""} selected
        </span>

        <div className="flex items-center gap-2">
          {allowedOperations.map(({ op, icon: Icon, label, color }) => (
            <button
              key={op}
              onClick={() => onBatchOperation(op)}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-${color}-50 text-${color}-700 border border-${color}-200`}
              title={label}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={onClearSelection}
          className="p-1 text-gray-400 hover:text-gray-600"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

BatchOperationsToolbar.displayName = "BatchOperationsToolbar";

/* ------------------------------------------------------------------ */
/* 11. LIGHTBOX COMPONENT                                            */
/* ------------------------------------------------------------------ */

const Lightbox = memo<{
  isOpen: boolean;
  currentIndex: number;
  images: GalleryImage[];
  onClose: () => void;
  onNavigate: (index: number) => void;
  enableCollaboration: boolean;
  enableWatermark: boolean;
  watermarkConfig?: WatermarkConfig;
  userRole: string;
  onCommentAdd?: (
    imageId: string,
    comment: string,
    x?: number,
    y?: number
  ) => void;
  onAnnotationAdd?: (imageId: string, annotation: unknown) => void;
}>(
  ({
    isOpen,
    currentIndex,
    images,
    onClose,
    onNavigate,
    enableCollaboration,
    enableWatermark,
    watermarkConfig,
    userRole,
    onCommentAdd,
    onAnnotationAdd: _onAnnotationAdd,
  }) => {
    const [showInfo, setShowInfo] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [commentPosition, setCommentPosition] = useState<{
      x: number;
      y: number;
    } | null>(null);

    const currentImage = images[currentIndex];
    const isEnterprise = currentImage && isEnterpriseImage(currentImage);

    const handlePrevious = useCallback(() => {
      if (currentIndex > 0) onNavigate(currentIndex - 1);
    }, [currentIndex, onNavigate]);

    const handleNext = useCallback(() => {
      if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    }, [currentIndex, onNavigate, images.length]);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
          case "Escape":
            e.preventDefault();
            onClose();
            break;
          case "ArrowLeft":
            e.preventDefault();
            handlePrevious();
            break;
          case "ArrowRight":
            e.preventDefault();
            handleNext();
            break;
          case "i":
          case "I":
            e.preventDefault();
            setShowInfo(!showInfo);
            break;
        }
      },
      [isOpen, onClose, handlePrevious, handleNext, showInfo]
    );

    useEffect(() => {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const handleImageClick = useCallback(
      (e: React.MouseEvent) => {
        if (enableCollaboration && userRole !== "viewer" && onCommentAdd) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setCommentPosition({ x, y });
        }
      },
      [enableCollaboration, userRole, onCommentAdd]
    );

    const handleAddComment = useCallback(() => {
      if (newComment.trim() && currentImage && onCommentAdd) {
        onCommentAdd(
          currentImage.id,
          newComment.trim(),
          commentPosition?.x,
          commentPosition?.y
        );
        setNewComment("");
        setCommentPosition(null);
      }
    }, [newComment, currentImage, onCommentAdd, commentPosition]);

    if (!isOpen || !currentImage) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/95">
        <TransformWrapper>
          {({ zoomIn, zoomOut, resetTransform }: ReactZoomPanPinchContentRef) => (
            <>
              {/* Toolbar */}
              <div className="absolute top-4 left-4 z-40 flex flex-col gap-2">
                <button
                  onClick={() => zoomIn()}
                  className="p-2 bg-black/80 text-white rounded hover:bg-black/90 transition-colors"
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="p-2 bg-black/80 text-white rounded hover:bg-black/90 transition-colors"
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="p-2 bg-black/80 text-white rounded hover:bg-black/90 transition-colors"
                  aria-label="Reset zoom"
                  title="Reset zoom"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {isEnterprise && (
                  <>
                    <button
                      onClick={() => setShowInfo(!showInfo)}
                      className={`p-2 text-white rounded transition-colors ${
                        showInfo ?
                          "bg-blue-600 hover:bg-blue-700"
                        : "bg-black/80 hover:bg-black/90"
                      }`}
                      aria-label="Toggle info"
                      title="Toggle info (I)"
                    >
                      <FileImage className="w-4 h-4" />
                    </button>

                    {enableCollaboration && (
                      <button
                        onClick={() => setShowComments(!showComments)}
                        className={`p-2 text-white rounded transition-colors ${
                          showComments ?
                            "bg-blue-600 hover:bg-blue-700"
                          : "bg-black/80 hover:bg-black/90"
                        }`}
                        aria-label="Toggle comments"
                        title="Toggle comments"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Close button */}
              <div className="absolute top-12 xs:top-14 sm:top-16 md:top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="relative group">
                  <button
                    onClick={onClose}
                    className="p-2.5 xs:p-3 sm:p-4 bg-black/90 backdrop-blur-sm text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-xl border-2 border-white/20 hover:border-red-400 hover:shadow-red-400/25 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-black active:scale-95"
                    aria-label="Close lightbox"
                    title="Close (Esc)"
                  >
                    <X className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/90 backdrop-blur-sm text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-white/20">
                    <div className="text-center">
                      <div className="font-medium">Close Gallery</div>
                      <div className="text-white/70 text-[10px] mt-0.5">Press Esc or click</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-2 bg-black/80 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/90 transition-colors"
                    aria-label="Previous image"
                    title="Previous (←)"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === images.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-2 bg-black/80 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/90 transition-colors"
                    aria-label="Next image"
                    title="Next (→)"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {/* Image counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 text-white font-medium bg-black/60 px-3 py-1 rounded">
                    {currentIndex + 1} / {images.length}
                  </div>
                </>
              )}

              {/* Main image */}
              <TransformComponent wrapperClass="w-full h-full flex items-center justify-center">
                <div className="relative">
                  <EnterpriseImageEngine
                    src={ImageUtils.getSrc(currentImage)}
                    alt={ImageUtils.getAlt(currentImage)}
                    className="max-w-full max-h-full object-contain cursor-pointer"
                    enableWatermark={enableWatermark}
                    {...(watermarkConfig && { watermarkConfig })}
                    onClick={handleImageClick}
                  />

                  {/* Comment markers */}
                  {isEnterprise &&
                    currentImage.comments?.map((comment) => (
                      <div
                        key={comment.id}
                        className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white cursor-pointer"
                        style={{
                          left: `${comment.x || 0}%`,
                          top: `${comment.y || 0}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                        title={`${comment.user}: ${comment.text}`}
                      />
                    ))}

                  {/* New comment position */}
                  {commentPosition && (
                    <div
                      className="absolute w-4 h-4 bg-yellow-500 rounded-full border-2 border-white animate-pulse"
                      style={
                        {
                          left: `${commentPosition.x}%`,
                          top: `${commentPosition.y}%`,
                          transform: "translate(-50%, -50%)",
                        } as React.CSSProperties
                      }
                    />
                  )}
                </div>
              </TransformComponent>

              {/* Info panel */}
              {showInfo && isEnterprise && (
                <div className="absolute top-4 right-16 z-40 w-80 bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold mb-3">
                    {ImageUtils.getAlt(currentImage)}
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${ImageUtils.getApprovalStatusColor(currentImage.approvalStatus)}`}
                      >
                        {currentImage.approvalStatus.replace("_", " ")}
                      </span>
                    </div>

                    {currentImage.category && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span>{currentImage.category}</span>
                      </div>
                    )}

                    {currentImage.fileSize && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Size:</span>
                        <span>
                          {ImageUtils.formatFileSize(currentImage.fileSize)}
                        </span>
                      </div>
                    )}

                    {currentImage.dimensions && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dimensions:</span>
                        <span>
                          {currentImage.dimensions.width} ×{" "}
                          {currentImage.dimensions.height}
                        </span>
                      </div>
                    )}

                    {currentImage.uploadDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Uploaded:</span>
                        <span>
                          {ImageUtils.formatDate(currentImage.uploadDate)}
                        </span>
                      </div>
                    )}

                    {currentImage.rating && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rating:</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= (currentImage.rating || 0) ?
                                  "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {currentImage.tags && currentImage.tags.length > 0 && (
                      <div>
                        <span className="text-gray-600 block mb-1">Tags:</span>
                        <div className="flex flex-wrap gap-1">
                          {currentImage.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentImage.assignedTo &&
                      currentImage.assignedTo.length > 0 && (
                        <div>
                          <span className="text-gray-600 block mb-1">
                            Assigned to:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {currentImage.assignedTo.map((user) => (
                              <span
                                key={user}
                                className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs"
                              >
                                {user}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Comments panel */}
              {showComments && enableCollaboration && isEnterprise && (
                <div className="absolute bottom-4 right-4 z-40 w-80 bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold mb-3">Comments</h3>

                  <div className="space-y-3 mb-4">
                    {currentImage.comments?.map((comment) => (
                      <div
                        key={comment.id}
                        className="border-b border-gray-200 pb-2"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">
                            {comment.user}
                          </span>
                          <span className="text-xs text-gray-500">
                            {ImageUtils.formatDate(comment.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    ))}

                    {(!currentImage.comments ||
                      currentImage.comments.length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No comments yet. Click on the image to add one.
                      </p>
                    )}
                  </div>

                  {commentPosition && userRole !== "viewer" && (
                    <div className="border-t border-gray-200 pt-3">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => {
                            setCommentPosition(null);
                            setNewComment("");
                          }}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Comment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </TransformWrapper>
      </div>
    );
  }
);

Lightbox.displayName = "Lightbox";

/* ------------------------------------------------------------------ */
/* 12. MAIN IMAGE GALLERY COMPONENT                                  */
/* ------------------------------------------------------------------ */

const SimpleImageGallery = memo<{
  images: GalleryImage[];
  className: string;
  showImageCounter: boolean;
  wrapInCard: boolean;
  enableWatermark: boolean;
  watermarkConfig: WatermarkConfig | undefined;
  userRole: string;
  onImageClick: (index: number) => void;
  onImageUpdate:
    | ((id: string, updates: Partial<GalleryImage>) => void)
    | undefined;
}>(
  ({
    images,
    className,
    showImageCounter,
    wrapInCard,
    enableWatermark,
    watermarkConfig,
    userRole,
    onImageClick,
    onImageUpdate,
  }) => {
    if (images.length === 0) {
      return (
        <div className={`text-center p-8 bg-gray-50 rounded-lg ${className}`}>
          <div className="text-gray-400 text-4xl mb-2">📷</div>
          <p className="text-gray-500">No images available</p>
        </div>
      );
    }

    const content = (
      <div className={VIEW_MODES.grid.gridClass}>
        {images.map((image, index) => (
          <ImageCard
            key={image.id}
            image={image}
            index={index}
            viewMode="grid"
            isSelected={false}
            enableSelection={false}
            enableCollaboration={false}
            enableWatermark={enableWatermark}
            {...(watermarkConfig && { watermarkConfig })}
            userRole={userRole}
            onToggleSelection={() => {}}
            onImageClick={onImageClick}
            {...(onImageUpdate && { onImageUpdate })}
          />
        ))}
      </div>
    );

    if (wrapInCard) {
      return (
        <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
          {showImageCounter && (
            <div className="mb-4 text-sm text-gray-600">
              {images.length} image{images.length !== 1 ? "s" : ""}
            </div>
          )}
          {content}
        </div>
      );
    }

    return <div className={className}>{content}</div>;
  }
);

SimpleImageGallery.displayName = "SimpleImageGallery";

const EnterpriseImageGallery = memo<{
  images: GalleryImage[];
  className: string;
  showImageCounter: boolean;
  enableSearch: boolean;
  enableFullscreen: boolean;
  enableCollaboration: boolean;
  enableWatermark: boolean;
  watermarkConfig: WatermarkConfig | undefined;
  userRole: string;
  onImageClick: ((img: GalleryImage, idx: number) => void) | undefined;
  onBatchOperation: ((op: string, ids: string[]) => void) | undefined;
  onImageUpload: ((files: FileList) => void) | undefined;
  onImageUpdate:
    | ((id: string, updates: Partial<GalleryImage>) => void)
    | undefined;
  onCommentAdd:
    | ((imageId: string, comment: string, x?: number, y?: number) => void)
    | undefined;
  onAnnotationAdd: ((imageId: string, annotation: unknown) => void) | undefined;
}>(
  ({
    images,
    className,
    showImageCounter,
    enableSearch,
    enableFullscreen,
    enableCollaboration,
    enableWatermark,
    watermarkConfig,
    userRole,
    onImageClick,
    onBatchOperation,
    onImageUpload,
    onImageUpdate,
    onCommentAdd,
    onAnnotationAdd,
  }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFacets, setSelectedFacets] = useState<SelectedFacets>({
      categories: [],
      approvalStatus: [],
      tags: [],
      users: [],
      collections: [],
    });
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [sortMode, setSortMode] = useState<SortMode>("name");
    const [sortAscending, setSortAscending] = useState(true);
    const [selectedImages, setSelectedImages] = useState<Set<string>>(
      new Set()
    );
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [dragOver, setDragOver] = useState(false);

    const { filtered, facets, total } = useEnterpriseSearch(
      images,
      searchQuery,
      selectedFacets,
      sortMode,
      sortAscending
    );

    const handleImageClick = useCallback(
      (index: number) => {
        const image = filtered[index];
        if (image) {
          onImageClick?.(image, index);
          if (enableFullscreen) {
            setLightboxIndex(index);
          }
        }
      },
      [filtered, onImageClick, enableFullscreen]
    );

    const handleToggleSelection = useCallback((id: string) => {
      setSelectedImages((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    }, []);

    const handleFacetChange = useCallback(
      (type: keyof SelectedFacets, value: string, checked: boolean) => {
        setSelectedFacets((prev) => {
          const currentValues = prev[type] || [];
          return {
            ...prev,
            [type]:
              checked ?
                [...currentValues, value]
              : currentValues.filter((v) => v !== value),
          };
        });
      },
      []
    );

    const handleSortChange = useCallback(
      (mode: SortMode, ascending: boolean) => {
        setSortMode(mode);
        setSortAscending(ascending);
      },
      []
    );

    const handleClearFilters = useCallback(() => {
      setSearchQuery("");
      setSelectedFacets({
        categories: [],
        approvalStatus: [],
        tags: [],
        users: [],
        collections: [],
      });
    }, []);

    const handleBatchOperation = useCallback(
      (operation: string) => {
        onBatchOperation?.(operation, Array.from(selectedImages));
        setSelectedImages(new Set());
      },
      [onBatchOperation, selectedImages]
    );

    const handleClearSelection = useCallback(() => {
      setSelectedImages(new Set());
    }, []);

    const handleLightboxNavigate = useCallback((index: number) => {
      setLightboxIndex(index);
    }, []);

    const handleLightboxClose = useCallback(() => {
      setLightboxIndex(-1);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const { files } = e.dataTransfer;
        if (files.length > 0 && onImageUpload) {
          onImageUpload(files);
        }
      },
      [onImageUpload]
    );

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.metaKey || e.ctrlKey) {
          if (e.key === "k") {
            e.preventDefault();
            const searchInput = document.querySelector(
              'input[placeholder*="Search"]'
            ) as HTMLInputElement;
            searchInput?.focus();
          } else if (e.key === "a" && enableSearch) {
            e.preventDefault();
            const allIds = new Set(filtered.map((img) => img.id));
            setSelectedImages(allIds);
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [enableSearch, filtered]);

    const enableSelection = enableCollaboration || userRole !== "viewer";
    const showBatchOperations = enableSelection && selectedImages.size > 0;

    return (
      <div
        className={`relative ${className}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragOver && onImageUpload && (
          <div className="absolute inset-0 z-30 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-700 font-medium">
                Drop images here to upload
              </p>
            </div>
          </div>
        )}

        {enableSearch && (
          <SearchInterface
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            facets={facets}
            selectedFacets={selectedFacets}
            onFacetChange={handleFacetChange}
            totalResults={total}
            sortMode={sortMode}
            sortAscending={sortAscending}
            onSortChange={handleSortChange}
            onClearFilters={handleClearFilters}
          />
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {Object.entries(VIEW_MODES).map(([mode, config]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as ViewMode)}
                className={`p-2 rounded border ${
                  viewMode === mode ?
                    "bg-blue-50 border-blue-300 text-blue-700"
                  : "border-gray-300 hover:bg-gray-50"
                }`}
                title={config.label}
              >
                <config.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {showImageCounter && (
            <div className="text-sm text-gray-600">
              {total} image{total !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {filtered.length === 0 ?
          <div className="text-center p-12 bg-gray-50 rounded-lg">
            <FileImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No images found
            </h3>
            <p className="text-gray-500 mb-4">
              {(
                searchQuery ||
                (Object.values(selectedFacets) as string[][]).some(
                  (v) => v.length > 0
                )
              ) ?
                "Try adjusting your search or filters"
              : "Upload some images to get started"}
            </p>
            {onImageUpload && (
              <button
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.multiple = true;
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const { files } = e.target as HTMLInputElement;
                    if (files) onImageUpload(files);
                  };
                  input.click();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                Upload Images
              </button>
            )}
          </div>
        : <div
            className={
              viewMode === "masonry" ?
                VIEW_MODES.masonry.gridClass
              : (
                  VIEW_MODES[viewMode as keyof typeof VIEW_MODES] ||
                  VIEW_MODES.grid
                ).gridClass
            }
          >
            {filtered.map((image, index) => (
              <ImageCard
                key={image.id}
                image={image}
                index={index}
                viewMode={viewMode}
                isSelected={selectedImages.has(image.id)}
                enableSelection={enableSelection}
                enableCollaboration={enableCollaboration}
                enableWatermark={enableWatermark}
                {...(watermarkConfig && { watermarkConfig })}
                userRole={userRole}
                onToggleSelection={handleToggleSelection}
                onImageClick={handleImageClick}
                {...(onImageUpdate && { onImageUpdate })}
              />
            ))}
          </div>
        }

        {showBatchOperations && (
          <BatchOperationsToolbar
            selectedCount={selectedImages.size}
            onBatchOperation={handleBatchOperation}
            onClearSelection={handleClearSelection}
            userRole={userRole}
          />
        )}

        {enableFullscreen && (
          <Lightbox
            isOpen={lightboxIndex >= 0}
            currentIndex={lightboxIndex}
            images={filtered}
            onClose={handleLightboxClose}
            onNavigate={handleLightboxNavigate}
            enableCollaboration={enableCollaboration}
            enableWatermark={enableWatermark}
            {...(watermarkConfig && { watermarkConfig })}
            userRole={userRole}
            {...(onCommentAdd && { onCommentAdd })}
            {...(onAnnotationAdd && { onAnnotationAdd })}
          />
        )}
      </div>
    );
  }
);

EnterpriseImageGallery.displayName = "EnterpriseImageGallery";

const ImageGallery: FC<Props> = (props) => {
  const {
    images,
    className = "",
    showImageCounter = false,
    wrapInCard = false,
    enableSearch = false,
    enableFullscreen = false,
    enableCollaboration = false,
    enableWatermark = false,
    watermarkConfig,
    userRole = "viewer",
    onImageClick,
    onBatchOperation,
    onImageUpload,
    onImageUpdate,
    onCommentAdd,
    onAnnotationAdd,
  } = props;

  const handleSimpleImageClick = useCallback(
    (index: number) => {
      if (index >= 0 && index < images.length) {
        const image = images[index];
        if (image) {
          onImageClick?.(image, index);
        }
      }
    },
    [images, onImageClick]
  );

  if (!enableSearch && !enableFullscreen && !enableCollaboration) {
    return (
      <SimpleImageGallery
        images={images}
        className={className}
        showImageCounter={showImageCounter}
        wrapInCard={wrapInCard}
        enableWatermark={enableWatermark}
        watermarkConfig={watermarkConfig}
        userRole={userRole}
        onImageClick={handleSimpleImageClick}
        onImageUpdate={onImageUpdate}
      />
    );
  }

  return (
    <EnterpriseImageGallery
      images={images}
      className={className}
      showImageCounter={showImageCounter}
      enableSearch={enableSearch}
      enableFullscreen={enableFullscreen}
      enableCollaboration={enableCollaboration}
      enableWatermark={enableWatermark}
      watermarkConfig={watermarkConfig}
      userRole={userRole}
      onImageClick={onImageClick}
      onBatchOperation={onBatchOperation}
      onImageUpload={onImageUpload}
      onImageUpdate={onImageUpdate}
      onCommentAdd={onCommentAdd}
      onAnnotationAdd={onAnnotationAdd}
    />
  );
};

export default ImageGallery;