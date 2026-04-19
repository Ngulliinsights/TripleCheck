import React, { memo } from 'react'
import { Heart, Share2, Maximize2, Plus, Check } from 'lucide-react'
import { Button } from '../../../local/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../local/components/ui/tooltip'
import { cn } from '../../../local/lib/utils'
import type { UseImageGalleryReturn } from '../../../local/hooks/useImageGallery'
import type { UsePropertyCardActionsReturn } from '../../hooks/usePropertyCardActions'

export interface QuickActionsOverlayProps {
  actions: UsePropertyCardActionsReturn
  isInWishlist: boolean
  gallery: UseImageGalleryReturn
  isInCompare: boolean
  canAddMore: boolean
  onCompareClick: (event: React.MouseEvent) => void
  className?: string
}

// ---------------------------------------------------------------------------
// ActionButton — removes the repetitive TooltipProvider / Trigger pattern
// ---------------------------------------------------------------------------

interface ActionButtonProps {
  tooltip: string
  onClick: (e: React.MouseEvent) => void
  disabled?: boolean
  variant?: 'secondary' | 'default'
  className?: string
  children: React.ReactNode
}

function ActionButton({
  tooltip,
  onClick,
  disabled = false,
  variant = 'secondary',
  className,
  children,
}: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant={variant}
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'bg-white/95 backdrop-blur-md shadow-sm border-0',
            'w-8 h-8 sm:w-10 sm:h-10',
            'transition-all duration-200 md:hover:scale-110',
            className,
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

const ICON_SIZE = 'w-3 h-3 sm:w-4 sm:h-4'

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Shared QuickActionsOverlay.
 * Renders wishlist, share, gallery, and compare buttons on property card hover.
 * Used by both PropertyCard and EnhancedLandCard.
 */
export const QuickActionsOverlay = memo<QuickActionsOverlayProps>(
  ({ actions, isInWishlist, gallery, isInCompare, canAddMore, onCompareClick, className }) => {
    const compareDisabled = !canAddMore && !isInCompare

    return (
      // A single TooltipProvider wraps all tooltips — mounting one per button is wasteful
      <TooltipProvider>
        <div
          className={cn(
            'absolute bottom-2 right-2 flex space-x-1',
            'opacity-0 group-hover:opacity-100 md:opacity-100',
            'transition-all duration-300',
            className,
          )}
        >
          {/* Wishlist */}
          <ActionButton
            tooltip={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={actions.handleSave}
            className={isInWishlist ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}
          >
            <Heart className={cn(ICON_SIZE, isInWishlist && 'fill-current')} />
          </ActionButton>

          {/* Share */}
          <ActionButton
            tooltip="Share property"
            onClick={actions.handleShare}
            className="text-gray-600 hover:text-blue-500"
          >
            <Share2 className={ICON_SIZE} />
          </ActionButton>

          {/* Gallery — only shown when multiple images exist */}
          {gallery.hasMultipleImages && (
            <ActionButton
              tooltip="View gallery"
              onClick={(e) => {
                e.stopPropagation()
                gallery.openGallery()
              }}
              className="text-gray-600 hover:text-purple-500"
            >
              <Maximize2 className={ICON_SIZE} />
            </ActionButton>
          )}

          {/* Compare */}
          <ActionButton
            tooltip={isInCompare ? 'Remove from comparison' : 'Add to comparison'}
            onClick={onCompareClick}
            disabled={compareDisabled}
            variant={isInCompare ? 'default' : 'secondary'}
            className={cn(compareDisabled && 'opacity-50 cursor-not-allowed')}
          >
            {isInCompare ? <Check className={ICON_SIZE} /> : <Plus className={ICON_SIZE} />}
          </ActionButton>
        </div>
      </TooltipProvider>
    )
  },
)

QuickActionsOverlay.displayName = 'QuickActionsOverlay'

export default QuickActionsOverlay