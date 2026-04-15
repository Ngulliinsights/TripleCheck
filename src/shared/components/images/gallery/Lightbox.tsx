/**
 * Lightbox Component
 * Fullscreen image viewer with navigation
 */

import React, { memo, useCallback, useEffect, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Share2,
  MessageSquare,
} from "lucide-react";
import { ImageEngine } from "./ImageEngine";
import { isAdvancedImage } from "./utils";
import type { GalleryImage, WatermarkConfig, ImageComment } from "./types";

interface LightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  enableWatermark: boolean;
  watermarkConfig?: WatermarkConfig;
  enableCollaboration: boolean;
  userRole: string;
  onCommentAdd?: (imageId: string, comment: string, x?: number, y?: number) => void;
}

export const Lightbox = memo<LightboxProps>(
  ({
    images,
    currentIndex,
    isOpen,
    onClose,
    onNavigate,
    enableWatermark,
    watermarkConfig,
    enableCollaboration,
    userRole,
    onCommentAdd,
  }) => {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");

    const currentImage = images[currentIndex];

    useEffect(() => {
      if (!isOpen) {
        setZoom(1);
        setRotation(0);
        setShowComments(false);
      }
    }, [isOpen]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
          case "Escape":
            onClose();
            break;
          case "ArrowLeft":
            handlePrevious();
            break;
          case "ArrowRight":
            handleNext();
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, currentIndex]);

    const handlePrevious = useCallback(() => {
      if (currentIndex > 0) {
        onNavigate(currentIndex - 1);
      }
    }, [currentIndex, onNavigate]);

    const handleNext = useCallback(() => {
      if (currentIndex < images.length - 1) {
        onNavigate(currentIndex + 1);
      }
    }, [currentIndex, images.length, onNavigate]);

    const handleZoomIn = useCallback(() => {
      setZoom((prev) => Math.min(prev + 0.25, 3));
    }, []);

    const handleZoomOut = useCallback(() => {
      setZoom((prev) => Math.max(prev - 0.25, 0.5));
    }, []);

    const handleRotate = useCallback(() => {
      setRotation((prev) => (prev + 90) % 360);
    }, []);

    const handleDownload = useCallback(() => {
      if (currentImage?.src) {
        const link = document.createElement("a");
        link.href = currentImage.src;
        link.download = currentImage.alt || "image";
        link.click();
      }
    }, [currentImage]);

    const handleShare = useCallback(() => {
      if (currentImage?.src && navigator.share) {
        navigator.share({
          title: currentImage.alt || "Image",
          url: currentImage.src,
        });
      }
    }, [currentImage]);

    const handleAddComment = useCallback(() => {
      if (newComment.trim() && currentImage && onCommentAdd) {
        onCommentAdd(currentImage.id, newComment.trim());
        setNewComment("");
      }
    }, [newComment, currentImage, onCommentAdd]);

    if (!isOpen || !currentImage) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-white">
            <h3 className="font-medium">{currentImage.alt || "Untitled"}</h3>
            <p className="text-sm text-gray-300">
              {currentIndex + 1} / {images.length}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toolbar */}
            <button
              onClick={handleZoomOut}
              className="p-2 text-white hover:bg-white/10 rounded-lg"
              title="Zoom out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 text-white hover:bg-white/10 rounded-lg"
              title="Zoom in"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 text-white hover:bg-white/10 rounded-lg"
              title="Rotate"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-white hover:bg-white/10 rounded-lg"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            {navigator.share && (
              <button
                onClick={handleShare}
                className="p-2 text-white hover:bg-white/10 rounded-lg"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}
            {enableCollaboration && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="p-2 text-white hover:bg-white/10 rounded-lg"
                title="Comments"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/10 rounded-lg"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {currentIndex < images.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Image */}
        <div
          className="max-w-7xl max-h-[80vh] transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
        >
          <ImageEngine
            image={currentImage}
            enableWatermark={enableWatermark}
            watermarkConfig={watermarkConfig}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Comments sidebar */}
        {showComments && enableCollaboration && isAdvancedImage(currentImage) && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium mb-4">Comments</h3>

              {/* Existing comments */}
              <div className="space-y-3 mb-4">
                {currentImage.comments?.map((comment: ImageComment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-sm">{comment.user}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                ))}
                {(!currentImage.comments || currentImage.comments.length === 0) && (
                  <p className="text-sm text-gray-500">No comments yet</p>
                )}
              </div>

              {/* Add comment */}
              {(userRole === "editor" || userRole === "admin") && (
                <div className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Comment
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Lightbox.displayName = "Lightbox";
