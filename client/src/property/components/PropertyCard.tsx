// Import order: external packages first (alphabetically), then internal imports by path depth
import { Star, Upload } from "lucide-react";
import React, { useCallback, useEffect, memo, useRef, useState } from "react";

// Internal imports: deepest paths first, then utilities, types, and UI components
import {
  usePropertyCompare,
  usePropertyCompareActions as usePropertyCompareContext,
} from "../contexts";
import { usePerformanceMonitor } from "../../local/hooks/useComponentPerformance";
import { cn } from "../../local/lib/utils";
import type { DocumentType, ImageProcessingError } from "../../local/types/images";
import { ImageProcessingError as ImageProcessingErrorClass } from "../../local/types/images";
import type { NormalizedProperty } from "@shared/types/property";
import { Badge } from "../../local/components/ui/badge";
import { Button } from "../../local/components/ui/button";
import { Card, CardContent } from "../../local/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../local/components/ui/dialog";

// Shared hooks and components
import { useImageGallery } from "../../local/hooks";
import { usePropertyCardActions } from "../hooks/usePropertyCardActions";
import { usePropertyFormatting } from "../hooks/usePropertyFormatting";
import { usePropertyCompareActions } from "../hooks/usePropertyCompareActions";
import { usePropertyCardState } from "../hooks/usePropertyCardState";
import { PropertyImageSection, PropertyFeatures } from "./shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PropertyCardProps {
  readonly property: NormalizedProperty;
  readonly className?: string;
  readonly onClick?: (property: NormalizedProperty) => void;
  readonly viewMode?: "grid" | "list" | "adaptive";
  readonly showQuickActions?: boolean;
  readonly isInWishlist?: boolean;
  readonly onSave?: (id: string) => void;
  readonly onShare?: (id: string) => void;
  readonly priority?: boolean;
  // Image management
  readonly enableImageManagement?: boolean;
  readonly onImagesUpdate?: (propertyId: string, images: string[]) => void;
  readonly onImageUploadComplete?: (propertyId: string, imageId: string) => void;
  readonly onImageUploadError?: (propertyId: string, error: ImageProcessingError) => void;
  readonly maxImages?: number;
  /** Accepted document categories. Defaults to ["property_photo"]. */
  readonly allowedDocumentTypes?: DocumentType[];
}

interface PropertyImageManagerProps {
  propertyId: string;
  currentImages: string[];
  onImagesUpdate?: (images: string[]) => void;
  onUploadComplete?: (imageId: string) => void;
  onUploadError?: (error: ImageProcessingError) => void;
  maxImages?: number;
}

// ---------------------------------------------------------------------------
// PropertyImageManager
// ---------------------------------------------------------------------------

const PropertyImageManager = memo<PropertyImageManagerProps>(
  ({
    propertyId,
    currentImages,
    onImagesUpdate,
    onUploadComplete,
    onUploadError,
    maxImages = 10,
  }) => {
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

    // Track object URLs created during this session so we can revoke them on unmount.
    const objectUrlsRef = useRef<string[]>([]);
    useEffect(() => {
      return () => {
        objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      };
    }, []);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedFiles(event.target.files);
    }, []);

    const handleUpload = useCallback(async () => {
      if (!selectedFiles?.length) return;

      setIsUploading(true);

      try {
        for (const file of Array.from(selectedFiles)) {
          const fileId = `${propertyId}-${crypto.randomUUID()}`;

          // Simulate upload progress in 20 % increments.
          for (let progress = 20; progress <= 100; progress += 20) {
            await new Promise<void>((resolve) => setTimeout(resolve, 200));
            setUploadProgress((prev) => ({ ...prev, [fileId]: progress }));
          }

          const imageUrl = URL.createObjectURL(file);
          objectUrlsRef.current.push(imageUrl);

          onImagesUpdate?.([...currentImages, imageUrl]);
          onUploadComplete?.(fileId);
        }
      } catch (error) {
        onUploadError?.(
          new ImageProcessingErrorClass(
            error instanceof Error ? error.message : "Upload failed",
            "UPLOAD_ERROR"
          )
        );
      } finally {
        setIsUploading(false);
        setSelectedFiles(null);
        setUploadProgress({});
      }
    }, [selectedFiles, propertyId, currentImages, onImagesUpdate, onUploadComplete, onUploadError]);

    const canUploadMore = currentImages.length < maxImages;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Property Images</h3>
          <Badge variant="secondary">
            {currentImages.length} / {maxImages}
          </Badge>
        </div>

        {/* Current image grid */}
        {currentImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {currentImages.map((image, index) => (
              <div
                key={image}
                className="relative aspect-video rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  src={image}
                  alt={`Property view ${index + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <Badge variant="secondary" className="absolute top-1 right-1 text-xs">
                  {index + 1}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Upload section */}
        {canUploadMore ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center space-y-2">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                aria-label="Upload property images"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {!!selectedFiles?.length && (
                <>
                  <p className="text-sm text-gray-600">
                    {selectedFiles.length} file(s) selected
                  </p>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    size="sm"
                    className="w-full"
                  >
                    {isUploading ? "Uploading…" : "Upload Images"}
                  </Button>
                </>
              )}
            </div>

            {/* Upload progress bars — use inline style for dynamic width */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="mt-4 space-y-2">
                {Object.entries(uploadProgress).map(([fileId, progress]) => (
                  <div key={fileId} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Uploading…</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Maximum number of images reached ({maxImages})
            </p>
          </div>
        )}
      </div>
    );
  }
);

PropertyImageManager.displayName = "PropertyImageManager";

// ---------------------------------------------------------------------------
// PropertyCard
// ---------------------------------------------------------------------------

/**
 * Unified PropertyCard component with comprehensive type safety and performance
 * optimization.
 *
 * Patterns demonstrated:
 * - Import organisation following project ESLint rules
 * - Type-safe optional property handling (exactOptionalPropertyTypes)
 * - Performance optimisation via memoisation and conditional rendering
 * - Accessible design with proper ARIA labels and keyboard navigation
 * - Robust error handling for potentially missing data
 *
 * ViewMode options:
 * - "grid"     — standard grid layout with full quick actions
 * - "list"     — horizontal list layout with full quick actions
 * - "adaptive" — simplified grid layout without quick actions
 *               (backwards-compatible replacement for AdaptivePropertyCard)
 */
export const PropertyCard = memo<PropertyCardProps>(
  ({
    property,
    className = "",
    onClick,
    viewMode = "grid",
    showQuickActions = true,
    isInWishlist = false,
    onSave,
    onShare,
    priority = false,
    enableImageManagement = false,
    onImagesUpdate,
    onImageUploadComplete,
    onImageUploadError,
    maxImages = 10,
    allowedDocumentTypes = ["property_photo"],
  }) => {
    usePerformanceMonitor({ componentName: "PropertyCard" });

    const isAdaptive = viewMode === "adaptive";
    const effectiveViewMode = isAdaptive ? "grid" : viewMode;
    const effectiveShowQuickActions = isAdaptive ? false : showQuickActions;

    const gallery = useImageGallery({
      property,
      images: property.images ?? [],
      enableNavigation: true,
      enableFullscreen: true,
    });

    const actions = usePropertyCardActions(property, {
      onSave,
      onShare,
      onClick,
    });

    const { formattedPrice, locationString, displayTitle, displayDescription } =
      usePropertyFormatting(property, { showUSDConversion: true, exchangeRate: 130 });

    const { isHovered, handleMouseEnter, handleMouseLeave, handleKeyDown } =
      usePropertyCardState();

    const { selectedProperties, canAddMore } = usePropertyCompare();
    const { addToCompare, removeFromCompare } = usePropertyCompareContext();
    const propertyId = String(property.id);
    const isInCompare = selectedProperties.some((p) => p.id === propertyId);

    const compareActions = usePropertyCompareActions({
      property,
      isInCompare,
      canAddMore,
      addToCompare,
      removeFromCompare,
      locationString,
    });

    // Image management
    const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
    const [currentImages, setCurrentImages] = useState<string[]>(property.images ?? []);

    // Keep local image list in sync when the property prop changes externally.
    useEffect(() => {
      setCurrentImages(property.images ?? []);
    }, [property.images]);

    const handleOpenImageManager = useCallback((event: React.MouseEvent) => {
      event.stopPropagation();
      setIsImageManagerOpen(true);
    }, []);

    const handleImagesUpdate = useCallback(
      (images: string[]) => {
        setCurrentImages(images);
        onImagesUpdate?.(propertyId, images);
      },
      [propertyId, onImagesUpdate]
    );

    const handleImageUploadComplete = useCallback(
      (imageId: string) => onImageUploadComplete?.(propertyId, imageId),
      [propertyId, onImageUploadComplete]
    );

    const handleImageUploadError = useCallback(
      (error: ImageProcessingError) => onImageUploadError?.(propertyId, error),
      [propertyId, onImageUploadError]
    );

    const isInteractive = Boolean(onClick);

    return (
      <Card
        className={cn(
          "property-card overflow-hidden transition-all duration-300 group",
          effectiveViewMode === "grid"
            ? "property-card--grid-mode"
            : "property-card--list-mode flex flex-row",
          isInteractive && "cursor-pointer hover:shadow-lg hover:-translate-y-1",
          className
        )}
        onClick={isInteractive ? actions.handleCardClick : undefined}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={
          isInteractive
            ? (e) => handleKeyDown(e, () => onClick?.(property))
            : undefined
        }
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={isInteractive ? `View property ${displayTitle}` : undefined}
      >
        <PropertyImageSection
          property={property}
          gallery={gallery}
          actions={actions}
          isHovered={isHovered}
          showQuickActions={effectiveShowQuickActions}
          isInWishlist={isInWishlist}
          priority={priority}
          isInCompare={isInCompare}
          canAddMore={canAddMore}
          onCompareClick={compareActions.handleCompareClick}
          showVerificationBadge
          showTrustScore
          showImageCount
        />

        <CardContent className="p-4 space-y-3 flex-1">
          <h3
            className={cn(
              "font-semibold text-lg leading-tight line-clamp-2",
              isInteractive && "group-hover:text-primary transition-colors"
            )}
          >
            {displayTitle}
          </h3>

          <PropertyFeatures
            property={property}
            locationString={locationString}
            variant="compact"
          />

          {displayDescription && (
            <p className="text-gray-600 text-sm line-clamp-2">{displayDescription}</p>
          )}

          <div className="flex items-center justify-between pt-1">
            <p
              className="text-xl font-bold text-primary"
              aria-label={`Price: ${formattedPrice.primary}`}
            >
              {formattedPrice.primary}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              {formattedPrice.secondary && <span>{formattedPrice.secondary}</span>}
              {typeof property.trustScore === "number" && (
                <div className="flex items-center">
                  <Star className="w-3 h-3 mr-1 fill-current text-yellow-500" />
                  <span>{property.trustScore}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Manage images trigger — only rendered when feature is enabled */}
          {enableImageManagement && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={handleOpenImageManager}
              aria-label="Manage property images"
            >
              <Upload className="w-3 h-3 mr-2" />
              Manage Images
            </Button>
          )}
        </CardContent>

        {/* Image management dialog */}
        {enableImageManagement && (
          <Dialog open={isImageManagerOpen} onOpenChange={setIsImageManagerOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage Property Images — {property.title}</DialogTitle>
              </DialogHeader>
              <PropertyImageManager
                propertyId={propertyId}
                currentImages={currentImages}
                onImagesUpdate={handleImagesUpdate}
                onUploadComplete={handleImageUploadComplete}
                onUploadError={handleImageUploadError}
                maxImages={maxImages}
              />
            </DialogContent>
          </Dialog>
        )}
      </Card>
    );
  }
);

PropertyCard.displayName = "PropertyCard";

// ---------------------------------------------------------------------------
// AdaptivePropertyCard — backwards-compatibility alias
// ---------------------------------------------------------------------------

/**
 * Thin wrapper around PropertyCard with viewMode="adaptive".
 * Prefer passing viewMode="adaptive" directly to PropertyCard in new code.
 */
export const AdaptivePropertyCard = memo<{
  readonly property: NormalizedProperty;
  readonly onClick?: (property: NormalizedProperty) => void;
  readonly className?: string;
}>(({ property, onClick, className = "" }) => (
  <PropertyCard
    property={property}
    onClick={onClick}
    className={className}
    viewMode="adaptive"
  />
));

AdaptivePropertyCard.displayName = "AdaptivePropertyCard";

export default PropertyCard;