/**
 * Advanced Gallery Component
 * Feature-rich gallery with search, collaboration, and batch operations.
 *
 * Changes vs original:
 * - Removed unused `useMemo` import.
 */

import React, { memo, useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { VIEW_MODES } from "./constants";
import { useImageSearch } from "./useImageSearch";
import { SearchInterface } from "./SearchInterface";
import { ImageCard } from "./ImageCard";
import { BatchOperationsToolbar } from "./BatchOperationsToolbar";
import { Lightbox } from "./Lightbox";
import type {
  GalleryImage,
  GalleryProps,
  SelectedFacets,
  SortMode,
  ViewMode,
} from "./types";

export const AdvancedGallery = memo<GalleryProps>(
  ({
    images,
    className = "",
    showImageCounter = false,
    enableSearch = true,
    enableFullscreen = true,
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
  }) => {
    // -----------------------------------------------------------------------
    // Search / filter state
    // -----------------------------------------------------------------------

    const [query, setQuery] = useState("");
    const [selectedFacets, setSelectedFacets] = useState<SelectedFacets>({
      categories:     [],
      approvalStatus: [],
      tags:           [],
      users:          [],
      collections:    [],
    });
    const [sortMode, setSortMode]           = useState<SortMode>("date");
    const [sortAscending, setSortAscending] = useState(false);
    const [showFacets, setShowFacets]       = useState(false);

    // -----------------------------------------------------------------------
    // View state
    // -----------------------------------------------------------------------

    const [viewMode, setViewMode]             = useState<ViewMode>("grid");
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

    // -----------------------------------------------------------------------
    // Lightbox state
    // -----------------------------------------------------------------------

    const [lightboxOpen, setLightboxOpen]   = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // -----------------------------------------------------------------------
    // Derived data
    // -----------------------------------------------------------------------

    const { filtered, facets, total } = useImageSearch(
      images,
      query,
      selectedFacets,
      sortMode,
      sortAscending
    );

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------

    const handleFacetToggle = useCallback(
      (facetType: keyof SelectedFacets, value: string) => {
        setSelectedFacets((prev) => {
          const current = prev[facetType];
          const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
          return { ...prev, [facetType]: updated };
        });
      },
      []
    );

    const handleToggleSelection = useCallback((id: string) => {
      setSelectedImages((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }, []);

    const handleClearSelection = useCallback(() => setSelectedImages(new Set()), []);

    const handleSelectAll = useCallback(
      () => setSelectedImages(new Set(filtered.map((img) => img.id))),
      [filtered]
    );

    const handleBatchOperation = useCallback(
      (operation: string) => {
        onBatchOperation?.(operation, Array.from(selectedImages));
        setSelectedImages(new Set());
      },
      [selectedImages, onBatchOperation]
    );

    const handleImageClick = useCallback(
      (index: number) => {
        if (enableFullscreen) {
          setLightboxIndex(index);
          setLightboxOpen(true);
        }
        const image = filtered[index];
        if (image) onImageClick?.(image, index);
      },
      [filtered, enableFullscreen, onImageClick]
    );

    const handleFileUpload = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && onImageUpload) onImageUpload(e.target.files);
      },
      [onImageUpload]
    );

    // Ctrl/Cmd + A → select all
    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "a") {
          e.preventDefault();
          handleSelectAll();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleSelectAll]);

    // -----------------------------------------------------------------------
    // Empty state
    // -----------------------------------------------------------------------

    if (images.length === 0) {
      return (
        <div className={`text-center p-12 bg-gray-50 rounded-lg ${className}`}>
          <div className="text-gray-400 text-5xl mb-4">📷</div>
          <p className="text-gray-500 text-lg mb-4">No images available</p>
          {onImageUpload && (userRole === "editor" || userRole === "admin") && (
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
              <Upload className="w-5 h-5" />
              <span>Upload Images</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    const canUpload =
      !!onImageUpload && (userRole === "editor" || userRole === "admin");

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Search interface */}
        {enableSearch && (
          <SearchInterface
            query={query}
            onQueryChange={setQuery}
            facets={facets}
            selectedFacets={selectedFacets}
            onFacetToggle={handleFacetToggle}
            sortMode={sortMode}
            onSortChange={setSortMode}
            sortAscending={sortAscending}
            onSortDirectionToggle={() => setSortAscending((prev) => !prev)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showFacets={showFacets}
            onToggleFacets={() => setShowFacets((prev) => !prev)}
          />
        )}

        {/* Toolbar row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showImageCounter && (
              <div className="text-sm text-gray-600">
                {total} image{total !== 1 ? "s" : ""}
                {total !== images.length && ` (${images.length} total)`}
              </div>
            )}
            {selectedImages.size > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Select all {filtered.length}
              </button>
            )}
          </div>

          {canUpload && (
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Image grid */}
        {filtered.length === 0 ? (
          <div className="text-center p-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No images match your filters</p>
          </div>
        ) : (
          <div className={VIEW_MODES[viewMode].gridClass}>
            {filtered.map((image, index) => (
              <ImageCard
                key={image.id}
                image={image}
                index={index}
                viewMode={viewMode}
                isSelected={selectedImages.has(image.id)}
                enableSelection
                enableCollaboration={enableCollaboration}
                enableWatermark={enableWatermark}
                watermarkConfig={watermarkConfig}
                userRole={userRole}
                onToggleSelection={handleToggleSelection}
                onImageClick={handleImageClick}
                onImageUpdate={onImageUpdate}
              />
            ))}
          </div>
        )}

        {/* Batch operations toolbar */}
        {onBatchOperation && (
          <BatchOperationsToolbar
            selectedCount={selectedImages.size}
            onClearSelection={handleClearSelection}
            onBatchOperation={handleBatchOperation}
            userRole={userRole}
          />
        )}

        {/* Lightbox */}
        {enableFullscreen && (
          <Lightbox
            images={filtered}
            currentIndex={lightboxIndex}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            onNavigate={setLightboxIndex}
            enableWatermark={enableWatermark}
            watermarkConfig={watermarkConfig}
            enableCollaboration={enableCollaboration}
            userRole={userRole}
            onCommentAdd={onCommentAdd}
          />
        )}
      </div>
    );
  }
);

AdvancedGallery.displayName = "AdvancedGallery";