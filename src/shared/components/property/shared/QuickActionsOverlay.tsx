import React, { memo } from "react"
import { Heart, Share2, Maximize2, Plus, Check } from "lucide-react"
import { Button } from "../../ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip"
import { cn } from "../../../lib/utils"
import type { UseImageGalleryReturn } from "../../../hooks/useImageGallery"
import type { UsePropertyCardActionsReturn } from "../../../hooks/usePropertyCardActions"

export interface QuickActionsOverlayProps {
  actions: UsePropertyCardActionsReturn;
  isInWishlist: boolean;
  gallery: UseImageGalleryReturn;
  isInCompare: boolean;
  canAddMore: boolean;
  onCompareClick: (event: React.MouseEvent) => void;
  className?: string;
}

/**
 * Shared QuickActionsOverlay component
 * Displays action buttons on property card hover
 * Used by both PropertyCard and EnhancedLandCard components
 */
export const QuickActionsOverlay = memo<QuickActionsOverlayProps>(
  ({
    actions,
    isInWishlist,
    gallery,
    isInCompare,
    canAddMore,
    onCompareClick,
    className,
  }) => {
    return (
      <div className={cn(
        "absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 md:opacity-100 transition-all duration-300",
        className
      )}>
        {/* Save/Wishlist Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                onClick={actions.handleSave}
                className={cn(
                  "bg-white/95 backdrop-blur-md shadow-sm border-0 transition-all duration-200 w-8 h-8 sm:w-10 sm:h-10 md:hover:scale-110",
                  isInWishlist ? "text-red-500" : "text-gray-600 hover:text-red-500"
                )}
                type="button"
              >
                <Heart
                  className={cn(
                    "w-3 h-3 sm:w-4 sm:h-4",
                    isInWishlist && "fill-current"
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Share Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                onClick={actions.handleShare}
                className="bg-white/95 backdrop-blur-md shadow-sm border-0 transition-all duration-200 w-8 h-8 sm:w-10 sm:h-10 md:hover:scale-110 text-gray-600 hover:text-blue-500"
                type="button"
              >
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share property</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Gallery Button */}
        {gallery.hasMultipleImages && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    gallery.openGallery();
                  }}
                  className="bg-white/95 backdrop-blur-md shadow-sm border-0 transition-all duration-200 w-8 h-8 sm:w-10 sm:h-10 md:hover:scale-110 text-gray-600 hover:text-purple-500"
                  type="button"
                >
                  <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View gallery</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Compare Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={isInCompare ? "default" : "secondary"}
                className={cn(
                  "bg-white/95 backdrop-blur-md shadow-sm border-0 transition-all duration-200 w-8 h-8 sm:w-10 sm:h-10 md:hover:scale-110",
                  !canAddMore && !isInCompare && "opacity-50 cursor-not-allowed"
                )}
                onClick={onCompareClick}
                disabled={!canAddMore && !isInCompare}
                type="button"
              >
                {isInCompare ? (
                  <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isInCompare ? "Remove from comparison" : "Add to comparison"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
);

QuickActionsOverlay.displayName = "QuickActionsOverlay";

export default QuickActionsOverlay;