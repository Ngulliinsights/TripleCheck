/**
 * Image Engine Component
 * Handles image rendering with optional watermark overlay.
 *
 * Changes vs original:
 * - Removed the per-mount HEAD-request validation. HEAD requests are
 *   frequently blocked by CORS, generate unnecessary traffic, and duplicate
 *   what the browser's own image loader already does. Broken URLs are caught
 *   by the `onError` callback from LazyImage instead.
 * - Image source is derived synchronously where possible; FileReader is only
 *   used as a fallback for File objects.
 * - Loading state is handled entirely by LazyImage's built-in skeleton.
 */

import React, { memo, useEffect, useState, useCallback } from "react";
import { LazyImage } from "./LazyImage";
import type { GalleryImage, WatermarkConfig } from "./types";

interface ImageEngineProps {
  image: GalleryImage;
  enableWatermark: boolean;
  watermarkConfig?: WatermarkConfig;
  className?: string;
  onError?: () => void;
}

export const ImageEngine = memo<ImageEngineProps>(
  ({ image, enableWatermark, watermarkConfig, className, onError }) => {
    const [imageSrc, setImageSrc] = useState<string>(() => {
      // Prefer preview → src; File objects are handled in useEffect below
      return image.preview ?? image.src ?? "";
    });

    useEffect(() => {
      // Fast paths: preview or remote src are already strings
      if (image.preview) {
        setImageSrc(image.preview);
        return;
      }
      if (image.src) {
        setImageSrc(image.src);
        return;
      }
      // Slow path: local File that needs a data-URL
      if (image.file) {
        let cancelled = false;
        const reader = new FileReader();
        reader.onload = (e) => {
          if (!cancelled && typeof e.target?.result === "string") {
            setImageSrc(e.target.result);
          }
        };
        reader.readAsDataURL(image.file);
        return () => {
          cancelled = true;
        };
      }
      setImageSrc("");
    }, [image.preview, image.src, image.file]);

    const handleError = useCallback(() => {
      onError?.();
    }, [onError]);

    if (!imageSrc) {
      return (
        <div className={`bg-gray-200 animate-pulse ${className ?? ""}`} />
      );
    }

    return (
      <div className="relative w-full h-full">
        <LazyImage
          src={imageSrc}
          alt={image.alt ?? "Image"}
          className={className}
          onError={handleError}
        />

        {/* Watermark overlay */}
        {enableWatermark && watermarkConfig && (
          <div
            className={`absolute pointer-events-none select-none ${getWatermarkPositionClass(
              watermarkConfig.position
            )}`}
            style={{
              opacity: watermarkConfig.opacity,
              fontSize: watermarkConfig.fontSize ?? 14,
              color: watermarkConfig.color ?? "white",
              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
            }}
          >
            {watermarkConfig.text}
          </div>
        )}
      </div>
    );
  }
);

ImageEngine.displayName = "ImageEngine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getWatermarkPositionClass = (
  position: WatermarkConfig["position"]
): string => {
  const map: Record<WatermarkConfig["position"], string> = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };
  return map[position] ?? "bottom-2 right-2";
};