/**
 * Unified Image Gallery
 * ├─ Simple Mode (legacy PropertyImageGallery API)
 * └─ Enterprise Mode  (search, facets, multi-select, zoom, 360°, comments, …)
 *
 * Usage:
 *   <ImageGallery images={…} />                    // simple
 *   <ImageGallery images={…} enableSearch />       // enterprise
 *   <ImageGallery images={…} enableCollaboration />// enterprise + comments
 */
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Grid,
  List,
  Layers,
  Download,
  Share2,
  Archive,
  Star,
  FileImage,
} from "lucide-react";
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type FC,
  type KeyboardEventHandler,
} from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

/* ------------------------------------------------------------------ */
/* 1. TYPES                                                           */
/* ------------------------------------------------------------------ */
export interface SimpleImage {
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

export interface EnterpriseImage extends SimpleImage {
  is360?: boolean;
  tags?: string[];
  uploadDate?: Date;
  fileSize?: number;
  dimensions?: { width: number; height: number };
  approvalStatus: "pending" | "approved" | "rejected" | "needs_revision";
  assignedTo?: string[];
  rating?: number;
  comments?: number;
  annotations?: number;
}

type GalleryImage = SimpleImage | EnterpriseImage;
type ViewMode = "grid" | "list" | "masonry";

export interface Props {
  images: GalleryImage[];
  className?: string;
  showImageCounter?: boolean;
  wrapInCard?: boolean;
  /* enterprise toggles */
  enableSearch?: boolean;
  enableFullscreen?: boolean;
  enableCollaboration?: boolean;
  userRole?: "viewer" | "editor" | "admin";
  onImageClick?: (img: GalleryImage, idx: number) => void;
  onBatchOperation?: (op: string, ids: string[]) => void;
}

/* ------------------------------------------------------------------ */
/* 2. CONSTANTS                                                       */
/* ------------------------------------------------------------------ */
const STATUS_COLORS = {
  pending: "bg-yellow-500",
  uploading: "bg-blue-500",
  completed: "bg-green-500",
  error: "bg-red-500",
} as const;

const VIEW_MODES = {
  grid: { gridClass: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4", icon: Grid },
  list: { gridClass: "grid-cols-1", icon: List },
  masonry: {
    gridClass: "columns-2 sm:columns-3 lg:columns-4 gap-4",
    icon: Layers,
  },
} as const;

const BATCH_OPERATIONS = [
  { op: "download", icon: Download, label: "Download" },
  { op: "share", icon: Share2, label: "Share" },
  { op: "archive", icon: Archive, label: "Archive" },
] as const;

/* ------------------------------------------------------------------ */
/* 3. UTILITY FUNCTIONS                                               */
/* ------------------------------------------------------------------ */
const getSrc = (img: GalleryImage): string =>
  img.src ??
  img.preview ??
  (img.file && URL.createObjectURL(img.file)) ??
  "/placeholder-property.jpg";

const getAlt = (img: GalleryImage): string =>
  img.alt ?? img.file?.name ?? "Property image";

const getStatusColor = (status?: string): string => {
  switch (status) {
    case "pending":
      return STATUS_COLORS.pending;
    case "uploading":
      return STATUS_COLORS.uploading;
    case "completed":
      return STATUS_COLORS.completed;
    case "error":
      return STATUS_COLORS.error;
    default:
      return "bg-gray-500";
  }
};

const getViewModeConfig = (mode: ViewMode) => {
  switch (mode) {
    case "grid":
      return VIEW_MODES.grid;
    case "list":
      return VIEW_MODES.list;
    case "masonry":
      return VIEW_MODES.masonry;
    default:
      return VIEW_MODES.grid;
  }
};

/* ------------------------------------------------------------------ */
/* 4. ENTERPRISE SEARCH TYPES AND LOGIC                              */
/* ------------------------------------------------------------------ */
interface FacetCounts {
  categories: Map<string, number>;
  approvalStatus: Map<string, number>;
  tags: Map<string, number>;
}

interface SelectedFacets {
  categories: string[];
  approvalStatus: string[];
  tags: string[];
}

interface EnterpriseSearchResult {
  filtered: GalleryImage[];
  facets: FacetCounts;
}

// Helper function to check if image matches text query
const matchesTextQuery = (
  img: GalleryImage,
  normalizedQuery: string
): boolean => {
  const alt = getAlt(img).toLowerCase();
  const category = img.category?.toLowerCase() ?? "";
  const tags = (img as EnterpriseImage).tags?.map((t) => t.toLowerCase()) ?? [];

  return (
    alt.includes(normalizedQuery) ||
    category.includes(normalizedQuery) ||
    tags.some((tag) => tag.includes(normalizedQuery))
  );
};

// Safe facet matching without object injection
const matchesFacetFilter = (
  img: GalleryImage,
  facetType: string,
  values: string[]
): boolean => {
  if (facetType === "categories" && img.category) {
    return values.includes(img.category);
  }
  
  if (facetType === "approvalStatus") {
    const enterpriseImg = img as EnterpriseImage;
    return enterpriseImg.approvalStatus ? values.includes(enterpriseImg.approvalStatus) : false;
  }
  
  if (facetType === "tags") {
    const enterpriseImg = img as EnterpriseImage;
    return enterpriseImg.tags?.some((tag) => values.includes(tag)) ?? false;
  }
  
  return true;
};

// Safe facet counting function using Maps
const buildFacetCounts = (images: GalleryImage[]): FacetCounts => {
  const facetCounts: FacetCounts = {
    categories: new Map(),
    approvalStatus: new Map(),
    tags: new Map(),
  };

  images.forEach((img) => {
    // Count categories safely
    if (img.category) {
      const currentCount = facetCounts.categories.get(img.category) || 0;
      facetCounts.categories.set(img.category, currentCount + 1);
    }

    // Count approval status safely
    const enterpriseImg = img as EnterpriseImage;
    if (enterpriseImg.approvalStatus) {
      const currentCount = facetCounts.approvalStatus.get(enterpriseImg.approvalStatus) || 0;
      facetCounts.approvalStatus.set(enterpriseImg.approvalStatus, currentCount + 1);
    }

    // Count tags safely
    if (enterpriseImg.tags) {
      enterpriseImg.tags.forEach((tag) => {
        const currentCount = facetCounts.tags.get(tag) || 0;
        facetCounts.tags.set(tag, currentCount + 1);
      });
    }
  });

  return facetCounts;
};

// Helper to get facet values safely
const getFacetValues = (facets: SelectedFacets, facetType: string): string[] => {
  switch (facetType) {
    case "categories":
      return facets.categories;
    case "approvalStatus":
      return facets.approvalStatus;
    case "tags":
      return facets.tags;
    default:
      return [];
  }
};

// Main enterprise search hook with consistent return type
const useEnterprise = (
  images: GalleryImage[],
  query: string,
  facets: SelectedFacets
): EnterpriseSearchResult => {
  return useMemo(() => {
    let filteredImages = images;

    // Apply text search filter
    if (query.trim()) {
      const normalizedQuery = query.toLowerCase();
      filteredImages = filteredImages.filter((img) =>
        matchesTextQuery(img, normalizedQuery)
      );
    }

    // Apply facet filters safely
    const facetTypes = ["categories", "approvalStatus", "tags"];
    facetTypes.forEach((facetType) => {
      const values = getFacetValues(facets, facetType);
      if (values.length > 0) {
        filteredImages = filteredImages.filter((img) =>
          matchesFacetFilter(img, facetType, values)
        );
      }
    });

    // Build facet counts from filtered results
    const facetData = buildFacetCounts(filteredImages);

    return { filtered: filteredImages, facets: facetData };
  }, [images, query, facets]);
};

/* ------------------------------------------------------------------ */
/* 5. LIGHTBOX COMPONENT                                              */
/* ------------------------------------------------------------------ */
const Lightbox: FC<{
  open: boolean;
  idx: number;
  images: GalleryImage[];
  onClose: () => void;
  onNav: (i: number) => void;
}> = ({ open, idx, images, onClose, onNav }) => {
  // Handle keyboard navigation for lightbox
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (idx > 0) onNav(idx - 1);
          break;
        case "ArrowRight":
          if (idx < images.length - 1) onNav(idx + 1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, idx, images.length, onClose, onNav]);

  if (!open || !images[idx]) return null;

  const currentImage = images[idx];
  const hasPrevious = idx > 0;
  const hasNext = idx < images.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <TransformWrapper>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom controls - extracted to reduce nesting */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <button
                onClick={() => zoomIn()}
                className="p-2 bg-black/60 text-white rounded hover:bg-black/80 transition-colors"
                aria-label="Zoom in"
                title="Zoom in"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={() => zoomOut()}
                className="p-2 bg-black/60 text-white rounded hover:bg-black/80 transition-colors"
                aria-label="Zoom out"
                title="Zoom out"
              >
                <ZoomOut size={18} />
              </button>
              <button
                onClick={() => resetTransform()}
                className="p-2 bg-black/60 text-white rounded hover:bg-black/80 transition-colors"
                aria-label="Reset zoom"
                title="Reset zoom"
              >
                <RotateCw size={18} />
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
              aria-label="Close lightbox"
              title="Close (Esc)"
            >
              <X size={24} />
            </button>

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => onNav(idx - 1)}
                  disabled={!hasPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/80 transition-colors"
                  aria-label="Previous image"
                  title="Previous (←)"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => onNav(idx + 1)}
                  disabled={!hasNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/80 transition-colors"
                  aria-label="Next image"
                  title="Next (→)"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-medium">
                  {idx + 1} / {images.length}
                </div>
              </>
            )}

            {/* Main image */}
            <TransformComponent wrapperClass="w-full h-full flex items-center justify-center">
              <img
                src={getSrc(currentImage)}
                alt={getAlt(currentImage)}
                className="max-w-full max-h-full object-contain"
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 6. MAIN COMPONENT                                                  */
/* ------------------------------------------------------------------ */
const ImageGallery: FC<Props> = ({
  images,
  className = "",
  showImageCounter = false,
  wrapInCard = false,
  enableSearch = false,
  enableFullscreen = false,
  enableCollaboration = false,
  onImageClick,
  onBatchOperation,
}) => {
  const [query, setQuery] = useState("");
  const [facets, setFacets] = useState<SelectedFacets>({
    categories: [],
    approvalStatus: [],
    tags: [],
  });
  const [view, setView] = useState<ViewMode>("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState(-1);

  const { filtered, facets: facetData } = useEnterprise(images, query, facets);

  // Memoized callbacks to prevent unnecessary re-renders
  const handleImageClick = useCallback((img: GalleryImage, index: number) => {
    onImageClick?.(img, index);
  }, [onImageClick]);

  const handleKeyPress: KeyboardEventHandler<HTMLButtonElement> = useCallback((e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const indexStr = e.currentTarget.dataset.index;
      if (indexStr) {
        const index = parseInt(indexStr, 10);
        const img = images[index];
        if (img) {
          handleImageClick(img, index);
        }
      }
    }
  }, [images, handleImageClick]);

  const toggleSelection = useCallback((id: string) => {
    setSelected((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const updateFacets = useCallback((
    facetType: string,
    value: string,
    checked: boolean
  ) => {
    setFacets((prevFacets) => {
      const newFacets = { ...prevFacets };
      
      if (facetType === "categories") {
        newFacets.categories = checked 
          ? [...prevFacets.categories, value]
          : prevFacets.categories.filter((x) => x !== value);
      } else if (facetType === "approvalStatus") {
        newFacets.approvalStatus = checked 
          ? [...prevFacets.approvalStatus, value]
          : prevFacets.approvalStatus.filter((x) => x !== value);
      } else if (facetType === "tags") {
        newFacets.tags = checked 
          ? [...prevFacets.tags, value]
          : prevFacets.tags.filter((x) => x !== value);
      }
      
      return newFacets;
    });
  }, []);

  const handleBatchAction = useCallback((operation: string) => {
    onBatchOperation?.(operation, Array.from(selected));
  }, [onBatchOperation, selected]);

  const getProgressBarWidth = useCallback((progress: number): string => 
    `${Math.max(0, Math.min(100, progress))}%`
  , []);

  // Safe facet checking function
  const isFacetChecked = useCallback((facetType: string, value: string): boolean => {
    switch (facetType) {
      case "categories":
        return facets.categories.includes(value);
      case "approvalStatus":
        return facets.approvalStatus.includes(value);
      case "tags":
        return facets.tags.includes(value);
      default:
        return false;
    }
  }, [facets]);

  /* Simple mode fast-path ------------------------------------------------ */
  if (!enableSearch && !enableFullscreen && !enableCollaboration) {
    if (images.length === 0) {
      return (
        <div className={`text-center p-8 bg-gray-50 rounded-lg ${className}`}>
          <div className="text-gray-400 text-4xl mb-2">📷</div>
          <p className="text-gray-500">No images available</p>
        </div>
      );
    }

    const content = (
      <div
        className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}
      >
        {images.map((img, i) => (
          <button
            key={img.id}
            data-index={i}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            onClick={() => handleImageClick(img, i)}
            onKeyDown={handleKeyPress}
            aria-label={`View ${getAlt(img)}`}
          >
            <img
              src={getSrc(img)}
              alt={getAlt(img)}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Status indicator */}
            {img.status && (
              <div
                className={`absolute top-2 right-2 w-3 h-3 rounded-full bg-opacity-80 border border-white ${getStatusColor(img.status)}`}
                title={`Status: ${img.status}`}
              />
            )}

            {/* Upload progress */}
            {img.status === "uploading" && typeof img.progress === "number" && (
              <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1">
                <div className="bg-gray-300 rounded-full h-1">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all"
                    style={{ width: getProgressBarWidth(img.progress) }}
                  />
                </div>
              </div>
            )}

            {/* Image counter */}
            {showImageCounter && (
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {i + 1} / {images.length}
              </div>
            )}
          </button>
        ))}
      </div>
    );

    return wrapInCard ? (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        {content}
      </div>
    ) : content;
  }

  /* Enterprise mode ------------------------------------------------------ */
  const currentViewConfig = getViewModeConfig(view);

  return (
    <div className="w-full">
      {/* Search and filters */}
      {enableSearch && (
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search images…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Search images"
            />
          </div>

          {/* Facet filters with safe property access */}
          <div className="flex flex-wrap gap-2 text-sm">
            {/* Categories facet */}
            {Array.from(facetData.categories.entries())
              .sort(([, a], [, b]) => b - a)
              .map(([value, count]) => (
                <label
                  key={`categories-${value}`}
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={isFacetChecked("categories", value)}
                    onChange={(e) =>
                      updateFacets("categories", value, e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  <span>
                    {value} ({count})
                  </span>
                </label>
              ))}
            
            {/* Approval Status facet */}
            {Array.from(facetData.approvalStatus.entries())
              .sort(([, a], [, b]) => b - a)
              .map(([value, count]) => (
                <label
                  key={`approvalStatus-${value}`}
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={isFacetChecked("approvalStatus", value)}
                    onChange={(e) =>
                      updateFacets("approvalStatus", value, e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  <span>
                    {value} ({count})
                  </span>
                </label>
              ))}
            
            {/* Tags facet */}
            {Array.from(facetData.tags.entries())
              .sort(([, a], [, b]) => b - a)
              .map(([value, count]) => (
                <label
                  key={`tags-${value}`}
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={isFacetChecked("tags", value)}
                    onChange={(e) =>
                      updateFacets("tags", value, e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  <span>
                    {value} ({count})
                  </span>
                </label>
              ))}
          </div>
        </div>
      )}

      {/* View controls and batch operations */}
      <div className="flex items-center justify-between mb-4">
        {/* View mode selector */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded">
          {(["grid", "list", "masonry"] as ViewMode[]).map((viewMode) => {
            const config = getViewModeConfig(viewMode);
            const IconComponent = config.icon;
            return (
              <button
                key={viewMode}
                onClick={() => setView(viewMode)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  view === viewMode ? "bg-white shadow" : "hover:bg-gray-200"
                }`}
                aria-label={`Switch to ${viewMode} view`}
                title={`${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view`}
              >
                <IconComponent size={16} className="inline" />
              </button>
            );
          })}
        </div>

        {/* Batch operations */}
        {selected.size > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium">
              {selected.size} selected
            </span>
            {BATCH_OPERATIONS.map(({ op, icon: IconComponent, label }) => (
              <button
                key={op}
                onClick={() => handleBatchAction(op)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                title={`${label} selected images`}
              >
                <IconComponent size={14} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gallery grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No images found</p>
        </div>
      ) : (
        <div className={`${currentViewConfig.gridClass} gap-4`}>
          {filtered.map((img, i) => {
            const enterpriseImg = img as EnterpriseImage;
            const isSelected = selected.has(img.id);

            return (
              <div key={img.id} className="relative group">
                {/* Selection checkbox for collaboration mode */}
                {enableCollaboration && (
                  <label className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(img.id)}
                      className="rounded border-gray-300"
                      aria-label={`Select ${getAlt(img)}`}
                    />
                  </label>
                )}

                {/* Image container */}
                <button
                  className="w-full cursor-pointer overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => {
                    if (enableFullscreen) {
                      setLightbox(i);
                    } else {
                      onImageClick?.(img, i);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (enableFullscreen) {
                        setLightbox(i);
                      } else {
                        onImageClick?.(img, i);
                      }
                    }
                  }}
                  aria-label={`View ${getAlt(img)}`}
                >
                  <img
                    src={getSrc(img)}
                    alt={getAlt(img)}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />

                  {/* Image overlay with metadata */}
                  {enterpriseImg.approvalStatus && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-2 text-white text-sm">
                      <div className="flex justify-between items-center">
                        <span className="truncate">{getAlt(img)}</span>
                        {enterpriseImg.rating && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Star size={14} className="text-yellow-400" />
                            {enterpriseImg.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox modal */}
      {enableFullscreen && (
        <Lightbox
          open={lightbox >= 0}
          idx={lightbox}
          images={filtered}
          onClose={() => setLightbox(-1)}
          onNav={setLightbox}
        />
      )}
    </div>
  );
};

export default ImageGallery;