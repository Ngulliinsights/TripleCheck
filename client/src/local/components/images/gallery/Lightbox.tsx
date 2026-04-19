/**
 * Lightbox Component
 * Fullscreen image viewer with navigation, zoom, rotate, comments.
 *
 * Changes vs original:
 * - The keyboard `useEffect` referenced `handlePrevious` / `handleNext` via
 *   closure but listed only `isOpen` and `currentIndex` as deps. On every
 *   re-render those callbacks were stale, making arrow-key navigation skip
 *   steps or not fire. Fixed by including the navigation callbacks in deps
 *   (they are already memoised with `useCallback`).
 * - Keyboard handler also guards against firing when focus is in a text input
 *   (comment textarea), so typing ArrowLeft/Right doesn't navigate images.
 * - Moved `handlePrevious` / `handleNext` definitions above the keyboard
 *   `useEffect` that consumes them.
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

    // Reset view state when lightbox closes or image changes
    useEffect(() => {
      if (!isOpen) {
        setZoom(1);
        setRotation(0);
        setShowComments(false);
        setNewComment("");
      }
    }, [isOpen]);

    useEffect(() => {
      setZoom(1);
      setRotation(0);
    }, [currentIndex]);

    // ---------------------------------------------------------------------------
    // Navigation — defined before the keyboard effect that references them
    // ---------------------------------------------------------------------------

    const handlePrevious = useCallback(() => {
      if (currentIndex > 0) onNavigate(currentIndex - 1);
    }, [currentIndex, onNavigate]);

    const handleNext = useCallback(() => {
      if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    }, [currentIndex, images.length, onNavigate]);

    // Keyboard handler — deps include the memoised nav callbacks so it's never stale
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        // Don't hijack keys when the user is typing in the comment textarea
        if (
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLInputElement
        )
          return;

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
    }, [isOpen, onClose, handlePrevious, handleNext]);

    // ---------------------------------------------------------------------------
    // Image controls
    // ---------------------------------------------------------------------------

    const handleZoomIn  = useCallback(() => setZoom((z) => Math.min(z + 0.25, 3)),   []);
    const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.5)), []);
    const handleRotate  = useCallback(() => setRotation((r) => (r + 90) % 360),      []);

    const handleDownload = useCallback(() => {
      if (!currentImage?.src) return;
      const link = document.createElement("a");
      link.href = currentImage.src;
      link.download = currentImage.alt ?? "image";
      link.click();
    }, [currentImage]);

    const handleShare = useCallback(() => {
      if (currentImage?.src && typeof navigator.share === "function") {
        navigator.share({ title: currentImage.alt ?? "Image", url: currentImage.src });
      }
    }, [currentImage]);

    const handleAddComment = useCallback(() => {
      const text = newComment.trim();
      if (text && currentImage && onCommentAdd) {
        onCommentAdd(currentImage.id, text);
        setNewComment("");
      }
    }, [newComment, currentImage, onCommentAdd]);

    if (!isOpen || !currentImage) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-white">
            <h3 className="font-medium">{currentImage.alt ?? "Untitled"}</h3>
            <p className="text-sm text-gray-300">
              {currentIndex + 1} / {images.length}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <ToolbarButton onClick={handleZoomOut}  title="Zoom out"><ZoomOut  className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton onClick={handleZoomIn}   title="Zoom in" ><ZoomIn   className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton onClick={handleRotate}   title="Rotate"  ><RotateCw className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton onClick={handleDownload} title="Download"><Download className="w-5 h-5" /></ToolbarButton>
            {typeof navigator.share === "function" && (
              <ToolbarButton onClick={handleShare} title="Share"><Share2 className="w-5 h-5" /></ToolbarButton>
            )}
            {enableCollaboration && (
              <ToolbarButton
                onClick={() => setShowComments((v) => !v)}
                title="Comments"
                active={showComments}
              >
                <MessageSquare className="w-5 h-5" />
              </ToolbarButton>
            )}
            <ToolbarButton onClick={onClose} title="Close"><X className="w-5 h-5" /></ToolbarButton>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Navigation arrows                                                */}
        {/* ---------------------------------------------------------------- */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {currentIndex < images.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Image                                                            */}
        {/* ---------------------------------------------------------------- */}
        <div
          className="max-w-7xl max-h-[80vh] transition-transform duration-200"
          style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
        >
          <ImageEngine
            image={currentImage}
            enableWatermark={enableWatermark}
            watermarkConfig={watermarkConfig}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Comments sidebar                                                 */}
        {/* ---------------------------------------------------------------- */}
        {showComments && enableCollaboration && isAdvancedImage(currentImage) && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Comments</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentImage.comments?.length ? (
                currentImage.comments.map((comment: ImageComment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-sm">{comment.user}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No comments yet</p>
              )}
            </div>

            {(userRole === "editor" || userRole === "admin") && (
              <div className="p-4 border-t border-gray-200 space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  rows={3}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Add Comment
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

Lightbox.displayName = "Lightbox";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}

const ToolbarButton = memo<ToolbarButtonProps>(({ onClick, title, active, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-lg text-white transition-colors ${
      active ? "bg-white/20" : "hover:bg-white/10"
    }`}
  >
    {children}
  </button>
));
ToolbarButton.displayName = "ToolbarButton";