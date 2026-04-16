/**
 * Image Engine Component
 * Handles image rendering with watermark and validation
 */

import React, { memo, useEffect, useState, useCallback } from "react";
import { LazyImage } from "./LazyImage";
import { ImageValidationService } from "./ValidationService";
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
    const [validationStatus, setValidationStatus] = useState<
      "pending" | "valid" | "invalid"
    >("pending");
    const [imageSrc, setImageSrc] = useState<string>("");

    useEffect(() => {
      // Determine image source
      if (image.preview) {
        setImageSrc(image.preview);
      } else if (image.src) {
        setImageSrc(image.src);
      } else if (image.file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImageSrc(e.target.result as string);
          }
        };
        reader.readAsDataURL(image.file);
      }
    }, [image]);

    useEffect(() => {
      // Validate image if URL is available
      if (image.src) {
        const validator = new ImageValidationService();
        validator
          .validateUrl(image.src)
          .then((result) => {
            setValidationStatus(result.isValid ? "valid" : "invalid");
          })
          .catch(() => {
            setValidationStatus("invalid");
          });
      }
    }, [image.src]);

    const handleError = useCallback(() => {
      setValidationStatus("invalid");
      onError?.();
    }, [onError]);

    if (!imageSrc) {
      return (
        <div className={`bg-gray-200 animate-pulse ${className}`}>
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Loading...
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        <LazyImage
          src={imageSrc}
          alt={image.alt || "Image"}
          className={className}
          onError={handleError}
        />

        {/* Watermark overlay */}
        {enableWatermark && watermarkConfig && (
          <div
            className={`absolute pointer-events-none ${getWatermarkPositionClass(
              watermarkConfig.position
            )}`}
            style={{
              opacity: watermarkConfig.opacity,
              fontSize: watermarkConfig.fontSize || 14,
              color: watermarkConfig.color || "white",
              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
            }}
          >
            {watermarkConfig.text}
          </div>
        )}

        {/* Validation indicator */}
        {validationStatus === "invalid" && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Invalid
          </div>
        )}
      </div>
    );
  }
);

ImageEngine.displayName = "ImageEngine";

const getWatermarkPositionClass = (
  position: WatermarkConfig["position"]
): string => {
  switch (position) {
    case "top-left":
      return "top-2 left-2";
    case "top-right":
      return "top-2 right-2";
    case "bottom-left":
      return "bottom-2 left-2";
    case "bottom-right":
      return "bottom-2 right-2";
    case "center":
      return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
    default:
      return "bottom-2 right-2";
  }
};
