/**
 * Simple Gallery Component
 * Basic image gallery without advanced features.
 *
 * Changes vs original:
 * - `showImageCounter` was only rendered inside the `wrapInCard` branch;
 *   moved to the shared `content` block so it works in both render paths.
 */

import React, { memo } from "react";
import { VIEW_MODES } from "./constants";
import { ImageCard } from "./ImageCard";
import type { GalleryImage, WatermarkConfig } from "./types";

interface SimpleGalleryProps {
  images: GalleryImage[];
  className: string;
  showImageCounter: boolean;
  wrapInCard: boolean;
  enableWatermark: boolean;
  watermarkConfig: WatermarkConfig | undefined;
  userRole: string;
  onImageClick: (index: number) => void;
  onImageUpdate?: (id: string, updates: Partial<GalleryImage>) => void;
}

export const SimpleGallery = memo<SimpleGalleryProps>(
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
      <>
        {showImageCounter && (
          <div className="mb-4 text-sm text-gray-600">
            {images.length} image{images.length !== 1 ? "s" : ""}
          </div>
        )}

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
              watermarkConfig={watermarkConfig}
              userRole={userRole}
              onToggleSelection={() => {}}
              onImageClick={onImageClick}
              onImageUpdate={onImageUpdate}
            />
          ))}
        </div>
      </>
    );

    if (wrapInCard) {
      return (
        <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
          {content}
        </div>
      );
    }

    return <div className={className}>{content}</div>;
  }
);

SimpleGallery.displayName = "SimpleGallery";