import React, { memo } from 'react'
import { Camera, CheckCircle, Clock, Eye, AlertTriangle, Star } from 'lucide-react'
import { Badge } from '../../ui/badge'
import { cn } from '../../../lib/utils'
import type { NormalizedProperty } from '../../../types/property'
import type { UseImageGalleryReturn } from '../../../hooks/useImageGallery'
import type { UsePropertyCardActionsReturn } from '../../../hooks/usePropertyCardActions'
import { QuickActionsOverlay } from './QuickActionsOverlay'

export interface PropertyImageSectionProps {
  property: NormalizedProperty
  gallery: UseImageGalleryReturn
  actions: UsePropertyCardActionsReturn
  isHovered: boolean
  showQuickActions: boolean
  isInWishlist: boolean
  priority?: boolean
  className?: string
  isInCompare: boolean
  canAddMore: boolean
  onCompareClick: (event: React.MouseEvent) => void
  showVerificationBadge?: boolean
  showTrustScore?: boolean
  showImageCount?: boolean
}

// ---------------------------------------------------------------------------
// Verification badge configuration
// ---------------------------------------------------------------------------

type VerificationStatus = NonNullable<NormalizedProperty['verificationStatus']>

const VERIFICATION_CONFIG: Record<
  VerificationStatus,
  { label: string; color: string; Icon: React.ElementType }
> = {
  verified: {
    label: 'Verified',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Icon: CheckCircle,
  },
  pending: {
    label: 'Verification Pending',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    Icon: Clock,
  },
  unverified: {
    label: 'Unverified',
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    Icon: Eye,
  },
  flagged: {
    label: 'Flagged',
    color: 'bg-red-50 text-red-700 border-red-200',
    Icon: AlertTriangle,
  },
}

const FALLBACK_STATUS: VerificationStatus = 'pending'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Shared PropertyImageSection.
 * Renders the image, overlaid badges, and quick-action buttons for a property card.
 * Used by both PropertyCard and EnhancedLandCard.
 */
export const PropertyImageSection = memo<PropertyImageSectionProps>(
  ({
    property,
    gallery,
    actions,
    isHovered,
    showQuickActions,
    isInWishlist,
    priority = false,
    className,
    isInCompare,
    canAddMore,
    onCompareClick,
    showVerificationBadge = true,
    showTrustScore = true,
    showImageCount = true,
  }) => {
    const statusConfig = VERIFICATION_CONFIG[property.verificationStatus ?? FALLBACK_STATUS]
    const { Icon: StatusIcon } = statusConfig
    const propertyLabel = property.type ?? property.category

    return (
      <div
        className={cn(
          'relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 aspect-video',
          className,
        )}
      >
        {/* Main image — wrapped in a button for keyboard / screen-reader accessibility */}
        <button
          type="button"
          className="relative w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
          onClick={actions.handleViewDetails}
          aria-label={`View details for ${property.title}`}
        >
          <img
            src={gallery.currentImage}
            alt={`${property.title} — ${propertyLabel} property`}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-105"
            loading={priority ? 'eager' : 'lazy'}
          />
        </button>

        {/* Dark gradient revealed on hover */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        />

        {/* Top-left: verification + type badges */}
        {showVerificationBadge && (
          <div className="absolute top-2 left-2 z-10 space-y-1 pointer-events-none">
            <Badge
              className={cn(
                'flex items-center gap-1 text-xs font-medium bg-white/95 backdrop-blur-md shadow-sm border-0',
                statusConfig.color,
              )}
            >
              <StatusIcon className="w-3 h-3" />
              {/* Full label on sm+, first word on xs */}
              <span className="hidden sm:inline">{statusConfig.label}</span>
              <span className="sm:hidden">{statusConfig.label.split(' ')[0]}</span>
            </Badge>

            <Badge className="flex items-center text-xs font-medium bg-white/95 backdrop-blur-md shadow-sm border-0 bg-blue-50 text-blue-700">
              <span className="capitalize">{propertyLabel}</span>
            </Badge>
          </div>
        )}

        {/* Top-right: trust score */}
        {showTrustScore && property.trustScore != null && (
          <div className="absolute top-2 right-2 z-10 pointer-events-none">
            <Badge className="bg-white/95 backdrop-blur-md shadow-sm border-0 text-primary text-xs">
              <Star className="w-3 h-3 mr-1 fill-current" />
              {property.trustScore}%
            </Badge>
          </div>
        )}

        {/* Bottom-left: image count */}
        {showImageCount && gallery.hasMultipleImages && (
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 pointer-events-none">
            <Camera className="w-3 h-3" />
            {gallery.imageCount}
          </div>
        )}

        {/* Quick actions (wishlist, share, gallery, compare) */}
        {showQuickActions && (
          <QuickActionsOverlay
            actions={actions}
            isInWishlist={isInWishlist}
            gallery={gallery}
            isInCompare={isInCompare}
            canAddMore={canAddMore}
            onCompareClick={onCompareClick}
          />
        )}

        {/* Gallery hint on hover */}
        {gallery.hasMultipleImages && isHovered && (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Eye className="w-8 h-8 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}
      </div>
    )
  },
)

PropertyImageSection.displayName = 'PropertyImageSection'

export default PropertyImageSection