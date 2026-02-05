// Import order: external packages first (alphabetically), then internal imports by path depth
import { Star, Upload } from "lucide-react"
import React, { useCallback, memo, useState } from "react"

// Internal imports: deepest paths first, then utilities, types, and UI components
import {
  usePropertyCompare,
  usePropertyCompareActions as usePropertyCompareContext,
} from "../../../property/contexts"
import { usePerformanceMonitor } from "../../hooks/useComponentPerformance"
import { cn } from "../../lib/utils"
import type { DocumentType, ImageProcessingError } from "../../types/images"
import { ImageProcessingError as ImageProcessingErrorClass } from "../../types/images"
import type { NormalizedProperty } from "../../types/property"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"

// Shared hooks and components
import {
  useImageGallery,
  usePropertyCardActions,
  usePropertyFormatting,
  usePropertyCompareActions,
  usePropertyCardState,
} from "../../hooks"
import { PropertyImageSection, PropertyFeatures } from "./shared"

interface PropertyCardProps {
  readonly property: NormalizedProperty;
  readonly className?: string;
  readonly onClick?: ((property: NormalizedProperty) => void) | undefined;
  readonly viewMode?: "grid" | "list" | "adaptive";
  readonly showQuickActions?: boolean;
  readonly isInWishlist?: boolean;
  readonly onSave?: ((id: string) => void) | undefined;
  readonly onShare?: ((id: string) => void) | undefined;
  readonly priority?: boolean;
  // Image management props
  readonly enableImageManagement?: boolean;
  readonly onImagesUpdate?:
    | ((propertyId: string, images: string[]) => void)
    | undefined;
  readonly onImageUploadComplete?:
    | ((propertyId: string, imageId: string) => void)
    | undefined;
  readonly onImageUploadError?:
    | ((propertyId: string, error: ImageProcessingError) => void)
    | undefined;
  readonly maxImages?: number;
  readonly allowedDocumentTypes?: DocumentType[];
}

// These utility functions are now handled by shared hooks
// formatPriceWithFallback -> usePropertyFormatting
// getLocationString -> usePropertyFormatting
// createCompareProperty -> usePropertyCompareActions

// Simplified Image Management Component for PropertyCard integration
interface PropertyImageManagerProps {
  propertyId: string;
  currentImages: string[];
  onImagesUpdate?: (images: string[]) => void;
  onUploadComplete?: (imageId: string) => void;
  onUploadError?: (error: ImageProcessingError) => void;
  maxImages?: number;
  allowedDocumentTypes?: DocumentType[];
}

const PropertyImageManager = memo<PropertyImageManagerProps>(
  ({
    propertyId,
    currentImages,
    onImagesUpdate,
    onUploadComplete,
    onUploadError,
    maxImages = 10,
    allowedDocumentTypes = ["property_photo"], // Reserved for future document type filtering
  }) => {
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<
      Record<string, number>
    >({});

    const handleFileChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
          setSelectedFiles(event.target.files);
        }
      },
      []
    );

    const handleUpload = useCallback(async () => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      setIsUploading(true);
      const files = Array.from(selectedFiles);

      try {
        // Simulate upload process - in real implementation, this would use PropertyImageVault services
        for (const file of files) {
          // Note: Math.random() is used here only for demo file ID generation, not for security purposes
          const fileId = `${propertyId}-${Date.now()}-${window.crypto?.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * 1000000)}`;

          // Simulate progress updates
          for (let progress = 0; progress <= 100; progress += 20) {
            setUploadProgress((prev) => ({ ...prev, [fileId]: progress }));
            await new Promise((resolve) => setTimeout(resolve, 200));
          }

          // Create object URL for preview
          const imageUrl = URL.createObjectURL(file);
          const updatedImages = [...currentImages, imageUrl];

          onImagesUpdate?.(updatedImages);
          onUploadComplete?.(fileId);
        }

        setSelectedFiles(null);
        setUploadProgress({});
      } catch (error) {
        const uploadError = new ImageProcessingErrorClass(
          error instanceof Error ? error.message : "Upload failed",
          "UPLOAD_ERROR"
        );
        onUploadError?.(uploadError);
      } finally {
        setIsUploading(false);
      }
    }, [
      selectedFiles,
      propertyId,
      currentImages,
      onImagesUpdate,
      onUploadComplete,
      onUploadError,
    ]);

    const canUploadMore = currentImages.length < maxImages;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Property Images</h3>
          <Badge variant="secondary">
            {currentImages.length} / {maxImages}
          </Badge>
        </div>

        {/* Current Images Grid */}
        {currentImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {currentImages.map((image, index) => (
              <div
                key={index}
                className="relative aspect-video rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  src={image}
                  alt={`Property view ${index + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 right-1">
                  <Badge variant="secondary" className="text-xs">
                    {index + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Section */}
        {canUploadMore && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <div className="space-y-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  title={`Upload ${allowedDocumentTypes.join(", ")} files`}
                  aria-label={`Upload ${allowedDocumentTypes.join(", ")} files`}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {selectedFiles.length} file(s) selected
                    </p>
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      size="sm"
                      className="w-full"
                    >
                      {isUploading ? "Uploading..." : "Upload Images"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="mt-4 space-y-2">
                {Object.entries(uploadProgress).map(([fileId, progress]) => (
                  <div key={fileId} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ${getProgressWidthClass(progress)}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!canUploadMore && (
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

// Helper function to get progress width class
const getProgressWidthClass = (progress: number): string => {
  if (progress >= 100) return "w-full";
  if (progress >= 75) return "w-3/4";
  if (progress >= 50) return "w-1/2";
  if (progress >= 25) return "w-1/4";
  if (progress > 0) return "w-1/12";
  return "w-0";
};

// Old PropertyImageSection component removed - now using shared component from ./shared

/**
 * Unified PropertyCard component with comprehensive type safety and performance optimization
 *
 * This component demonstrates several important React and TypeScript patterns:
 *
 * 1. Proper import organization following ESLint rules
 * 2. Type-safe optional property handling with exactOptionalPropertyTypes
 * 3. Performance optimization through memoization and conditional rendering
 * 4. Accessible design with proper ARIA labels and keyboard navigation
 * 5. Robust error handling for potentially missing data
 *
 * The component works with normalized property data and gracefully handles
 * missing or malformed information while maintaining full functionality.
 *
 * ViewMode options:
 * - "grid": Standard grid layout with full quick actions
 * - "list": Horizontal list layout with full quick actions
 * - "adaptive": Simplified grid layout without quick actions (replaces AdaptivePropertyCard)
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
    // Performance monitoring
    usePerformanceMonitor({ componentName: "PropertyCard" });

    // Handle adaptive mode by defaulting to grid behavior with simplified quick actions
    const effectiveViewMode = viewMode === "adaptive" ? "grid" : viewMode;
    const effectiveShowQuickActions =
      viewMode === "adaptive" ? false : showQuickActions;

    // Shared hooks for consistent behavior
    const gallery = useImageGallery({
      property,
      images: property.images || [],
      enableNavigation: true,
      enableFullscreen: true,
    });

    const actions = usePropertyCardActions(property, {
      ...(onSave && { onSave }),
      ...(onShare && { onShare }),
      ...(onClick && { onClick }),
    });

    const { formattedPrice, locationString, displayTitle, displayDescription } =
      usePropertyFormatting(property, {
        showUSDConversion: true,
        exchangeRate: 130,
      });

    const { isHovered, handleMouseEnter, handleMouseLeave, handleKeyDown } =
      usePropertyCardState();
    // Context integration for compare functionality using unified PropertyContext
    const { selectedProperties, canAddMore } = usePropertyCompare();
    const { addToCompare, removeFromCompare } = usePropertyCompareContext();
    const propertyId = String(property.id);
    const isInCompare = selectedProperties.some((p) => p.id === propertyId);

    // Compare actions using shared hook
    const compareActions = usePropertyCompareActions({
      property,
      isInCompare,
      canAddMore,
      addToCompare,
      removeFromCompare,
      locationString,
    });

    // Image management state
    const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
    const [currentImages, setCurrentImages] = useState<string[]>(
      property.images || []
    );

    // Image management handlers
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
      (imageId: string) => {
        onImageUploadComplete?.(propertyId, imageId);
      },
      [propertyId, onImageUploadComplete]
    );

    const handleImageUploadError = useCallback(
      (error: ImageProcessingError) => {
        onImageUploadError?.(propertyId, error);
      },
      [propertyId, onImageUploadError]
    );

    const isInteractive = Boolean(onClick);

    return (
      <Card
        className={cn(
          "property-card overflow-hidden transition-all duration-300 group",
          effectiveViewMode === "grid" ?
            "property-card--grid-mode"
          : "property-card--list-mode flex flex-row",
          isInteractive &&
            "cursor-pointer hover:shadow-lg hover:-translate-y-1",
          className
        )}
        onClick={isInteractive ? actions.handleCardClick : undefined}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={
          isInteractive ?
            (e) => handleKeyDown(e, () => onClick?.(property))
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
          showVerificationBadge={true}
          showTrustScore={true}
          showImageCount={true}
        />

        <CardContent className="p-4 space-y-3 flex-1">
          {/* Property title with interactive styling */}
          <h3
            className={cn(
              "font-semibold text-lg leading-tight line-clamp-2",
              isInteractive && "group-hover:text-primary transition-colors"
            )}
          >
            {displayTitle}
          </h3>

          {/* Use shared PropertyFeatures component */}
          <PropertyFeatures
            property={property}
            locationString={locationString}
            variant="compact"
          />

          {/* Property description with text truncation for consistent layout */}
          {displayDescription && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {displayDescription}
            </p>
          )}

          {/* Price display and trust metrics */}
          <div className="flex items-center justify-between pt-1">
            <p
              className="text-xl font-bold text-primary"
              aria-label={`Price: ${formattedPrice.primary}`}
            >
              {formattedPrice.primary}
            </p>

            {/* Secondary price and trust score */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {formattedPrice.secondary && (
                <span>{formattedPrice.secondary}</span>
              )}
              {property.trustScore &&
                typeof property.trustScore === "number" && (
                  <div className="flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-current text-yellow-500" />
                    <span>{property.trustScore}%</span>
                  </div>
                )}
            </div>
          </div>
        </CardContent>

        {/* Image Management Dialog */}
        {enableImageManagement && (
          <Dialog
            open={isImageManagerOpen}
            onOpenChange={setIsImageManagerOpen}
          >
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Manage Property Images - {property.title}
                </DialogTitle>
              </DialogHeader>
              <PropertyImageManager
                propertyId={propertyId}
                currentImages={currentImages}
                onImagesUpdate={handleImagesUpdate}
                onUploadComplete={handleImageUploadComplete}
                onUploadError={handleImageUploadError}
                maxImages={maxImages}
                allowedDocumentTypes={allowedDocumentTypes}
              />
            </DialogContent>
          </Dialog>
        )}
      </Card>
    );
  }
);

PropertyCard.displayName = "PropertyCard";

/**
 * AdaptivePropertyCard - Backward compatibility alias
 *
 * This is now handled by PropertyCard with viewMode="adaptive"
 * Provides the same simplified interface without quick actions
 */
export const AdaptivePropertyCard = memo<{
  readonly property: NormalizedProperty;
  readonly onClick?: ((property: NormalizedProperty) => void) | undefined;
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
