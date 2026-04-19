/**
 * Main Image Gallery Component
 * Refactored to use modular architecture
 */

import React, { type FC, useCallback } from "react";
import type { GalleryProps, GalleryImage } from "./types";
import { SimpleGallery } from "./SimpleGallery";
import { AdvancedGallery } from "./AdvancedGallery";

const ImageGallery: FC<GalleryProps> = (props) => {
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

  // Use simple gallery for basic use cases
  if (!enableSearch && !enableFullscreen && !enableCollaboration) {
    return (
      <SimpleGallery
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

  // Use advanced gallery for feature-rich use cases
  return (
    <AdvancedGallery
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