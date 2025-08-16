import React, { memo } from "react";
import { Camera, CheckCircle, Clock, Eye, AlertTriangle, Shield, Star } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { cn } from "../../../lib/utils";
import type { NormalizedProperty } from "../../../types/property";
import type { UseImageGalleryReturn } from "../../../hooks/useImageGallery";
import type { UsePropertyCardActionsReturn } from "../../../hooks/usePropertyCardActions";
import { QuickActionsOverlay } from "./QuickActionsOverlay";

export interface PropertyImageSectionProps {
  property: NormalizedProperty;
  gallery: UseImageGalleryReturn;
  actions: UsePropertyCardActionsReturn;
  isHovered: boolean;
  showQuickActions: boolean;
  isInWishlist: boolean;
  priority?: boolean;
  className?: string;
  // Compare functionality
  isInCompare: boolean;
  canAddMore: boolean;
  onCompareClick: (event: React.MouseEvent) => void;
  // Optional customization
  showVerificationBadge?: boolean;
  showTrustScore?: boolean;
  showImageCount?: boolean;
}

const VERIFICATION_STATUS_CONFIG = {
  verified: {
    label: "Verified",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
    description: "Fully verified and safe to purchase",
  },
  pending: {
    label: "Verification Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
    description: "Verification in progress",
  },
  unverified: {
    label: "Unverified",
    color: "bg-gray-50 text-gray-700 border-gray-200",
    icon: Eye,
    description: "Not yet verified",
  },
  flagged: {
    label: "Flagged",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: AlertTriangle,
    description: "Potential issues detected",
  },
} as const;

/**
 * Shared PropertyImageSection component
 * Used by both PropertyCard and EnhancedLandCard components
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
    const statusConfig = VERIFICATION_STATUS_CONFIG[property.verificationStatus || 'pending'];
    const StatusIcon = statusConfig.icon;

    return (
      <div className={cn(
        "relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 aspect-video",
        className
      )}>
        {/* Main Image */}
        <button
          className="relative w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
          onClick={actions.handleViewDetails}
          aria-label={`View details for ${property.title}`}
          type="button"
        >
          <img
            src={gallery.currentImage}
            alt={`${property.title} - ${property.type || property.category} property`}
            width={400}
            height={300}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              "group-hover:scale-110 group-hover:brightness-105"
            )}
            loading={priority ? "eager" : "lazy"}
          />
        </button>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Status Badges - Top Left */}
        {showVerificationBadge && (
          <div className="absolute top-2 left-2 z-10 space-y-1">
            <Badge
              className={cn(
                "flex items-center space-x-1 text-xs font-medium bg-white/95 backdrop-blur-md shadow-sm border-0",
                statusConfig.color
              )}
            >
              <StatusIcon className="w-3 h-3" />
              <span className="hidden sm:inline">{statusConfig.label}</span>
              <span className="sm:hidden">
                {statusConfig.label.split(" ")[0]}
              </span>
            </Badge>

            <Badge
              className={cn(
                "flex items-center space-x-1 text-xs font-medium bg-white/95 backdrop-blur-md shadow-sm border-0",
                "bg-blue-50 text-blue-700"
              )}
            >
              <span className="capitalize">{property.type || property.category}</span>
            </Badge>
          </div>
        )}

        {/* Trust Score - Top Right */}
        {showTrustScore && property.trustScore && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-white/95 backdrop-blur-md shadow-sm border-0 text-primary text-xs">
              <Star className="w-3 h-3 mr-1 fill-current" />
              {property.trustScore}%
            </Badge>
          </div>
        )}

        {/* Image Count Indicator */}
        {showImageCount && gallery.hasMultipleImages && (
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <Camera className="w-3 h-3" />
            {gallery.imageCount}
          </div>
        )}

        {/* Quick Actions Overlay */}
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

        {/* Hover Overlay for Gallery */}
        {gallery.hasMultipleImages && isHovered && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Eye className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>
        )}
      </div>
    );
  }
);

PropertyImageSection.displayName = "PropertyImageSection";

export default PropertyImageSection;