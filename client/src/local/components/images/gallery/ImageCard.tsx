/**
 * Image Card Component
 * Displays individual images in grid or list view.
 *
 * Changes vs original:
 * - `handleRatingChange` was defined but never wired to any UI. It is now
 *   connected to an interactive star-rating row shown in list view.
 * - Star rating in grid overlay remains display-only (space constraints).
 * - Minor: consolidated duplicate approval-status badge logic into a helper.
 */

import React, { memo, useCallback, useState } from "react";
import { Check, Star, Eye, Calendar, FileImage, AlertCircle } from "lucide-react";
import { LazyImage } from "./LazyImage";
import { ImageEngine } from "./ImageEngine";
import { isAdvancedImage } from "./utils";
import type { GalleryImage, WatermarkConfig, ViewMode } from "./types";

interface ImageCardProps {
  image: GalleryImage;
  index: number;
  viewMode: ViewMode;
  isSelected: boolean;
  enableSelection: boolean;
  enableCollaboration: boolean;
  enableWatermark: boolean;
  watermarkConfig: WatermarkConfig | undefined;
  userRole: string;
  onToggleSelection: (id: string) => void;
  onImageClick: (index: number) => void;
  onImageUpdate?: (id: string, updates: Partial<GalleryImage>) => void;
}

export const ImageCard = memo<ImageCardProps>(
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
    const [imageError, setImageError] = useState(false);

    const handleClick = useCallback(() => {
      onImageClick(index);
    }, [index, onImageClick]);

    const handleSelectionToggle = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleSelection(image.id);
      },
      [image.id, onToggleSelection]
    );

    const handleRatingChange = useCallback(
      (e: React.MouseEvent, rating: number) => {
        e.stopPropagation();
        if (isAdvancedImage(image) && onImageUpdate) {
          onImageUpdate(image.id, { rating });
        }
      },
      [image, onImageUpdate]
    );

    const canRate =
      isAdvancedImage(image) &&
      !!onImageUpdate &&
      (userRole === "editor" || userRole === "admin");

    // ------------------------------------------------------------------
    // Grid view
    // ------------------------------------------------------------------

    const renderGridView = () => (
      <div
        className={`relative group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow ${
          isSelected ? "ring-4 ring-blue-500" : ""
        }`}
        onClick={handleClick}
      >
        {/* Selection checkbox */}
        {enableSelection && (
          <div
            className="absolute top-2 left-2 z-10"
            onClick={handleSelectionToggle}
          >
            <div
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                isSelected
                  ? "bg-blue-500 border-blue-500"
                  : "bg-white/90 border-gray-300"
              }`}
            >
              {isSelected && <Check className="w-4 h-4 text-white" />}
            </div>
          </div>
        )}

        {/* Image */}
        <div className="aspect-square bg-gray-100">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <AlertCircle className="w-12 h-12" />
            </div>
          ) : (
            <ImageEngine
              image={image}
              enableWatermark={enableWatermark}
              watermarkConfig={watermarkConfig}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <p className="text-sm font-medium truncate">{image.alt ?? "Untitled"}</p>
            {isAdvancedImage(image) && (
              <div className="flex items-center gap-2 mt-1 text-xs">
                {image.rating !== undefined && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{image.rating.toFixed(1)}</span>
                  </div>
                )}
                {image.usage !== undefined && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{image.usage}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status badge */}
        {image.status && image.status !== "completed" && (
          <div className="absolute top-2 right-2">
            <StatusBadge status={image.status} />
          </div>
        )}

        {/* Approval badge */}
        {isAdvancedImage(image) && enableCollaboration && (
          <div className="absolute top-2 right-2">
            <ApprovalBadge status={image.approvalStatus} />
          </div>
        )}
      </div>
    );

    // ------------------------------------------------------------------
    // List view
    // ------------------------------------------------------------------

    const renderListView = () => (
      <div
        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? "bg-blue-50 ring-2 ring-blue-500"
            : "bg-white hover:bg-gray-50"
        }`}
        onClick={handleClick}
      >
        {/* Selection checkbox */}
        {enableSelection && (
          <div onClick={handleSelectionToggle}>
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                isSelected
                  ? "bg-blue-500 border-blue-500"
                  : "bg-white border-gray-300"
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
        )}

        {/* Thumbnail */}
        <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <AlertCircle className="w-6 h-6" />
            </div>
          ) : (
            <ImageEngine
              image={image}
              enableWatermark={false}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* Metadata */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{image.alt ?? "Untitled"}</p>

          {isAdvancedImage(image) && (
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
              {image.uploadDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(image.uploadDate).toLocaleDateString()}</span>
                </div>
              )}
              {image.fileSize !== undefined && (
                <div className="flex items-center gap-1">
                  <FileImage className="w-3 h-3" />
                  <span>{(image.fileSize / 1024).toFixed(0)} KB</span>
                </div>
              )}

              {/* Interactive star rating in list view */}
              <StarRating
                rating={image.rating}
                interactive={canRate}
                onChange={(r, e) => handleRatingChange(e, r)}
              />
            </div>
          )}
        </div>

        {/* Approval badge */}
        {isAdvancedImage(image) && enableCollaboration && (
          <ApprovalBadge status={image.approvalStatus} outline />
        )}
      </div>
    );

    return viewMode === "list" ? renderListView() : renderGridView();
  }
);

ImageCard.displayName = "ImageCard";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StarRatingProps {
  rating?: number;
  interactive: boolean;
  onChange?: (rating: number, e: React.MouseEvent) => void;
}

const StarRating = memo<StarRatingProps>(({ rating, interactive, onChange }) => {
  if (rating === undefined && !interactive) return null;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 transition-colors ${
            (rating ?? 0) >= star
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
          onClick={interactive && onChange ? (e) => onChange(star, e) : undefined}
        />
      ))}
      {rating !== undefined && (
        <span className="ml-1 text-xs">{rating.toFixed(1)}</span>
      )}
    </div>
  );
});

StarRating.displayName = "StarRating";

// ---------------------------------------------------------------------------

type ApprovalStatus = "pending" | "approved" | "rejected" | "needs_revision";

const APPROVAL_CLASSES: Record<ApprovalStatus, { filled: string; outline: string }> = {
  approved:       { filled: "bg-green-500 text-white",  outline: "bg-green-100 text-green-800" },
  rejected:       { filled: "bg-red-500 text-white",    outline: "bg-red-100 text-red-800" },
  needs_revision: { filled: "bg-yellow-500 text-white", outline: "bg-yellow-100 text-yellow-800" },
  pending:        { filled: "bg-gray-500 text-white",   outline: "bg-gray-100 text-gray-800" },
};

const ApprovalBadge = memo<{ status: ApprovalStatus; outline?: boolean }>(
  ({ status, outline = false }) => {
    const cls = APPROVAL_CLASSES[status] ?? APPROVAL_CLASSES.pending;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${outline ? cls.outline : cls.filled}`}>
        {status}
      </span>
    );
  }
);
ApprovalBadge.displayName = "ApprovalBadge";

// ---------------------------------------------------------------------------

const STATUS_CLASSES: Record<string, string> = {
  uploading: "bg-blue-500 text-white",
  error:     "bg-red-500 text-white",
};

const StatusBadge = memo<{ status: string }>(({ status }) => (
  <span className={`px-2 py-1 text-xs rounded-full ${STATUS_CLASSES[status] ?? "bg-yellow-500 text-white"}`}>
    {status}
  </span>
));
StatusBadge.displayName = "StatusBadge";