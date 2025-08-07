import {
  AlertTriangle,
  ArrowRight,
  Bath,
  Bed,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  MapPin,
  Maximize2,
  Share2,
  Shield,
  Square,
  Star
} from "lucide-react";
import React, { useState, useCallback, useMemo, memo } from "react";

import ImageGallery from "../../shared/components/images/ImageGallery";
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import { Card, CardContent } from "../../shared/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../shared/components/ui/tooltip";
import { cn } from "../../shared/lib/utils";
import { useCompare } from "../contexts/CompareContext";

/* ------------------------------------------------------------------ */
/* Enhanced Types for Land Properties                                */
/* ------------------------------------------------------------------ */

type LandType = "agricultural" | "residential" | "commercial" | "industrial";
type VerificationStatus = "verified" | "pending" | "unverified" | "flagged";
type RiskLevel = "low" | "medium" | "high";
type TitleDeedStatus = "available" | "pending" | "missing";

interface LandFeatures {
  soilType?: string;
  waterAccess?: boolean;
  roadAccess?: boolean;
  electricityAccess?: boolean;
  zoning?: string;
  developmentPotential?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
}

interface EnhancedLandProperty {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly location: string | { address: string };
  readonly price: number;
  readonly originalPrice?: number;
  readonly size: string;
  readonly images: readonly string[];
  readonly verificationStatus: VerificationStatus;
  readonly trustScore: number;
  readonly landType: LandType;
  readonly titleDeedStatus: TitleDeedStatus;
  readonly lastVerified?: string;
  readonly riskLevel: RiskLevel;
  readonly features?: LandFeatures;
  readonly dateAdded?: Date;
  readonly viewCount?: number;
  readonly isNew?: boolean;
  readonly isFeatured?: boolean;
  readonly type?: "commercial" | "residential";
}

interface EnhancedLandCardProps {
  readonly property: EnhancedLandProperty;
  readonly className?: string;
  readonly showQuickActions?: boolean;
  readonly isInWishlist?: boolean;
  readonly viewMode?: "grid" | "list";
  readonly onSave?: (id: string) => void;
  readonly onShare?: (id: string) => void;
  readonly onViewDetails?: (id: string) => void;
  readonly onVerify?: (id: string) => void;
  readonly showGallery?: boolean;
  // Removing unused priority prop to fix linting issue
}

/* ------------------------------------------------------------------ */
/* Configuration Constants                                           */
/* ------------------------------------------------------------------ */

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

const RISK_LEVEL_CONFIG = {
  low: { color: "text-emerald-600", label: "Low Risk", bgColor: "bg-emerald-50" },
  medium: { color: "text-amber-600", label: "Medium Risk", bgColor: "bg-amber-50" },
  high: { color: "text-red-600", label: "High Risk", bgColor: "bg-red-50" },
} as const;

const LAND_TYPE_CONFIG = {
  agricultural: { icon: "🌾", color: "text-green-600", bgColor: "bg-green-50" },
  residential: { icon: "🏠", color: "text-blue-600", bgColor: "bg-blue-50" },
  commercial: { icon: "🏢", color: "text-purple-600", bgColor: "bg-purple-50" },
  industrial: { icon: "🏭", color: "text-gray-600", bgColor: "bg-gray-50" },
} as const;

/* ------------------------------------------------------------------ */
/* Custom Hooks                                                      */
/* ------------------------------------------------------------------ */

function useEnhancedImageGallery(images: readonly string[], property: EnhancedLandProperty) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  const galleryImages = useMemo(() => 
    images.map((src, index) => ({
      id: `${property.id}-${index}`,
      src,
      alt: `${property.title} - View ${index + 1}`,
      category: property.landType,
      caption: index === 0 ? "Primary view" : `Additional view ${index}`,
    })), [images, property.id, property.title, property.landType]
  );

  const navigateToImage = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  }, [images.length]);

  const openGallery = useCallback(() => {
    setShowGallery(true);
  }, []);

  const closeGallery = useCallback(() => {
    setShowGallery(false);
  }, []);

  return {
    currentIndex,
    currentImage: images[currentIndex] || '/placeholder-property.jpg',
    galleryImages,
    showGallery,
    hasMultipleImages: images.length > 1,
    imageCount: images.length,
    navigateToImage,
    openGallery,
    closeGallery,
  };
}

function usePropertyActions(
  property: EnhancedLandProperty,
  callbacks: {
    onSave?: (id: string) => void;
    onShare?: (id: string) => void;
    onViewDetails?: (id: string) => void;
    onVerify?: (id: string) => void;
  }
) {
  const handleAction = useCallback(
    async (
      event: React.MouseEvent | undefined,
      action: () => Promise<void> | void,
      actionName: string
    ) => {
      event?.stopPropagation();
      try {
        await action();
      } catch (error) {
        // Using more specific console method to address linting rule
        console.warn(`${actionName} failed:`, error);
      }
    },
    []
  );

  const handleSave = useCallback(
    (event: React.MouseEvent) => {
      handleAction(event, () => callbacks.onSave?.(property.id), "Save");
    },
    [handleAction, callbacks, property.id]
  );

  const handleShare = useCallback(
    (event: React.MouseEvent) => {
      handleAction(
        event,
        async () => {
          if (navigator.share) {
            await navigator.share({
              title: property.title,
              text: `Check out this ${property.landType} land: ${property.title}`,
              url: `${window.location.origin}/land/${property.id}`,
            });
          } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(
              `${window.location.origin}/land/${property.id}`
            );
          } else {
            callbacks.onShare?.(property.id);
          }
        },
        "Share"
      );
    },
    [handleAction, callbacks, property.id, property.title, property.landType]
  );

  const handleViewDetails = useCallback(
    (event?: React.MouseEvent) => {
      handleAction(
        event,
        () => callbacks.onViewDetails?.(property.id),
        "ViewDetails"
      );
    },
    [handleAction, callbacks, property.id]
  );

  const handleVerify = useCallback(
    (event: React.MouseEvent) => {
      handleAction(
        event,
        () => callbacks.onVerify?.(property.id),
        "Verify"
      );
    },
    [handleAction, callbacks, property.id]
  );

  return { handleSave, handleShare, handleViewDetails, handleVerify };
}

/* ------------------------------------------------------------------ */
/* Utility Functions                                                 */
/* ------------------------------------------------------------------ */

const formatPrice = (price: number, originalPrice?: number) => {
  const kenyanPrice = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(price);

  const usdPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(Math.round(price / 130)); // Exchange rate

  return {
    primary: kenyanPrice,
    secondary: `~${usdPrice}`,
    hasDiscount: Boolean(originalPrice && originalPrice > price),
    discountPercentage:
      originalPrice && originalPrice > price ?
        Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0,
  };
};

const getLocationString = (location: string | { address: string }): string => {
  return typeof location === 'string' ? location : location.address;
};

/* ------------------------------------------------------------------ */
/* Sub-components                                                    */
/* ------------------------------------------------------------------ */

const LandImageSection = memo(({
  gallery,
  property,
  isHovered,
  onViewDetails,
  showQuickActions,
  isInWishlist,
  actions,
}: {
  gallery: ReturnType<typeof useEnhancedImageGallery>;
  property: EnhancedLandProperty;
  isHovered: boolean;
  onViewDetails: () => void;
  showQuickActions: boolean;
  isInWishlist: boolean;
  actions: ReturnType<typeof usePropertyActions>;
}) => {
  const statusConfig = VERIFICATION_STATUS_CONFIG[property.verificationStatus];
  const landConfig = LAND_TYPE_CONFIG[property.landType];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 aspect-[4/3]">
      {/* Main Image */}
      <button
        className="relative w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
        onClick={onViewDetails}
        aria-label={`View details for ${property.title}`}
        type="button"
      >
        <img
          src={gallery.currentImage}
          alt={`${property.title} - ${property.landType} land`}
          width={400}
          height={300}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            "group-hover:scale-110 group-hover:brightness-105"
          )}
          loading="lazy"
          // Removed invalid HTML attributes (landType and priority)
          // These were custom properties that don't belong on img elements
        />
      </button>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Status Badges - Mobile optimized */}
      <div className="absolute top-2 left-2 z-10 space-y-1">
        <Badge className={cn("flex items-center space-x-1 text-xs font-medium bg-white/95 backdrop-blur-md shadow-sm border-0", statusConfig.color)}>
          <StatusIcon className="w-3 h-3" />
          <span className="hidden sm:inline">{statusConfig.label}</span>
          <span className="sm:hidden">{statusConfig.label.split(' ')[0]}</span>
        </Badge>

        <Badge className={cn("flex items-center space-x-1 text-xs font-medium bg-white/95 backdrop-blur-md shadow-sm border-0", landConfig.bgColor, landConfig.color)}>
          <span>{landConfig.icon}</span>
          <span className="capitalize hidden sm:inline">{property.landType}</span>
        </Badge>
      </div>

      {/* Trust Score & Risk Level - Mobile optimized */}
      <div className="absolute top-2 right-2 z-10 space-y-1">
        <Badge className="bg-white/95 backdrop-blur-md shadow-sm border-0 text-primary text-xs">
          <Star className="w-3 h-3 mr-1 fill-current" />
          {property.trustScore}%
        </Badge>
        
        {(() => {
          const riskConfig = RISK_LEVEL_CONFIG[property.riskLevel];
          return (
            <Badge className={cn("bg-white/95 backdrop-blur-md shadow-sm border-0 text-xs", riskConfig.color)}>
              <span className="hidden sm:inline">{riskConfig.label}</span>
              <span className="sm:hidden">{riskConfig.label.split(' ')[0]}</span>
            </Badge>
          );
        })()}
      </div>

      {/* Image Count Indicator */}
      {gallery.hasMultipleImages && (
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
          <Camera className="w-3 h-3" />
          {gallery.imageCount}
        </div>
      )}

      {/* Quick Actions - Mobile responsive */}
      {showQuickActions && (
        <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 md:opacity-100 transition-all duration-300">
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
                  <Heart className={cn("w-3 h-3 sm:w-4 sm:h-4", isInWishlist && "fill-current")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isInWishlist ? "Remove from wishlist" : "Add to wishlist"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
        </div>
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
});

LandImageSection.displayName = "LandImageSection";

/* ------------------------------------------------------------------ */
/* Main Component                                                    */
/* ------------------------------------------------------------------ */

export const EnhancedLandCard = memo<EnhancedLandCardProps>(({
  property,
  className,
  showQuickActions = true,
  isInWishlist = false,
  viewMode = "grid",
  onSave,
  onShare,
  onViewDetails,
  onVerify,
  showGallery = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Custom hooks
  const gallery = useEnhancedImageGallery(property.images, property);
  const actions = usePropertyActions(property, {
    ...(onSave && { onSave }),
    ...(onShare && { onShare }),
    ...(onViewDetails && { onViewDetails }),
    ...(onVerify && { onVerify }),
  });

  // Compare functionality
  const { addToCompare, removeFromCompare, isSelected, canAddMore } = useCompare();
  const isInCompare = isSelected(property.id);

  // Memoized values
  const formattedPrice = useMemo(
    () => formatPrice(property.price, property.originalPrice),
    [property.price, property.originalPrice]
  );

  const locationString = useMemo(
    () => getLocationString(property.location),
    [property.location]
  );

  const handleCompareClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (isInCompare) {
        removeFromCompare(property.id);
      } else if (canAddMore) {
        // Fixed the features type mismatch by ensuring compatibility
        const compareProperty = {
          id: property.id,
          title: property.title,
          price: property.price,
          location: locationString,
          description: property.description,
          images: [...property.images],
          // Ensuring features matches the expected type by providing defaults
          features: property.features || {},
          verificationStatus: property.verificationStatus,
          trustScore: property.trustScore,
          type: property.type || 'residential' as const,
        };
        addToCompare(compareProperty);
      }
    },
    [isInCompare, canAddMore, addToCompare, removeFromCompare, property, locationString]
  );

  return (
    <>
      <Card
        className={cn(
          "group relative bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          // Mobile-first responsive design
          "w-full max-w-sm mx-auto sm:max-w-none",
          // Hover effects only on non-touch devices
          "md:hover:-translate-y-2",
          viewMode === "list" && "sm:flex sm:flex-row sm:max-w-4xl",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Status Indicators - Mobile optimized */}
        {(property.isNew || property.isFeatured) && (
          <div className="absolute top-0 left-0 z-20 flex flex-col gap-1">
            {property.isNew && (
              <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-br-lg shadow-md">
                NEW
              </div>
            )}
            {property.isFeatured && (
              <div className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-br-lg shadow-md">
                FEATURED
              </div>
            )}
          </div>
        )}

        {/* Image Section - Mobile responsive */}
        <div className={cn(
          "relative overflow-hidden",
          viewMode === "grid" ? "aspect-[4/3] w-full" : "sm:w-80 sm:h-60 aspect-[4/3] sm:aspect-auto"
        )}>
          <LandImageSection
            gallery={gallery}
            property={property}
            isHovered={isHovered}
            onViewDetails={actions.handleViewDetails}
            showQuickActions={showQuickActions}
            isInWishlist={isInWishlist}
            actions={actions}
          />
        </div>

        {/* Content Section - Mobile responsive padding */}
        <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1">
          {/* Title and Date */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              {/* Fixed accessibility issue by using button instead of h3 with role */}
              <button
                className="font-bold text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors flex-1 mr-2 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                onClick={actions.handleViewDetails}
                type="button"
              >
                {property.title}
              </button>
              {property.dateAdded && (
                <div className="flex items-center text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded-full">
                  <Calendar className="w-3 h-3 mr-1" />
                  <time dateTime={property.dateAdded.toISOString()}>
                    {property.dateAdded.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
              )}
            </div>

            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
              <span className="text-sm line-clamp-1 font-medium">{locationString}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm line-clamp-2">
            {property.description}
          </p>

          {/* Land Features */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-medium text-foreground">{property.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium text-foreground capitalize">{property.landType}</span>
            </div>
            {property.features?.bedrooms && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center">
                  <Bed className="w-3 h-3 mr-1" />
                  Beds:
                </span>
                <span className="font-medium text-foreground">{property.features.bedrooms}</span>
              </div>
            )}
            {property.features?.bathrooms && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center">
                  <Bath className="w-3 h-3 mr-1" />
                  Baths:
                </span>
                <span className="font-medium text-foreground">{property.features.bathrooms}</span>
              </div>
            )}
          </div>

          {/* Land Access Features */}
          {property.features && (
            <div className="flex flex-wrap gap-2">
              {property.features.waterAccess && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  💧 Water Access
                </Badge>
              )}
              {property.features.roadAccess && (
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700">
                  🛣️ Road Access
                </Badge>
              )}
              {property.features.electricityAccess && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                  ⚡ Electricity
                </Badge>
              )}
            </div>
          )}

          {/* Price and Actions - Mobile responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-gray-100 gap-3 sm:gap-0">
            <div className="space-y-1 flex-1">
              <div className="flex items-baseline space-x-2 flex-wrap">
                {formattedPrice.hasDiscount && property.originalPrice && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm text-muted-foreground line-through">
                      {new Intl.NumberFormat("en-KE", {
                        style: "currency",
                        currency: "KES",
                        minimumFractionDigits: 0,
                      }).format(property.originalPrice)}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      -{formattedPrice.discountPercentage}%
                    </Badge>
                  </div>
                )}
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {formattedPrice.primary}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {formattedPrice.secondary}
              </div>
              <div className="text-xs text-muted-foreground">
                Title: <span className="capitalize font-medium text-foreground">{property.titleDeedStatus}</span>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={actions.handleVerify}
                className="flex items-center gap-1 text-xs sm:text-sm"
              >
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Verify</span>
                <span className="sm:hidden">✓</span>
              </Button>
              <Button
                size="sm"
                onClick={actions.handleViewDetails}
                className="flex items-center gap-1 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Details</span>
                <span className="sm:hidden">View</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          {/* Compare Button - Mobile responsive */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 gap-2 sm:gap-0">
            <Button
              size="sm"
              variant={isInCompare ? "default" : "outline"}
              onClick={handleCompareClick}
              disabled={!canAddMore && !isInCompare}
              className="flex items-center gap-1 w-full sm:w-auto text-xs sm:text-sm"
            >
              {isInCompare ? (
                <>
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">In Comparison</span>
                  <span className="sm:hidden">Added</span>
                </>
              ) : (
                <>
                  <Square className="w-3 h-3 sm:w-4 sm:h-4" />
                  Compare
                </>
              )}
            </Button>

            {property.lastVerified && (
              <div className="text-xs text-muted-foreground text-center sm:text-right">
                Last verified: {new Date(property.lastVerified).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* View Count */}
          {property.viewCount && (
            <div className="flex items-center text-xs text-muted-foreground pt-2 border-t border-gray-50">
              <Eye className="w-3 h-3 mr-1" />
              <span>Viewed {property.viewCount} times</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Image Gallery Modal */}
      {showGallery && gallery.showGallery && (
        <ImageGallery
          images={gallery.galleryImages}
          enableSearch={false}
          enableFullscreen={true}
          showImageCounter={true}
          onImageClick={(img, index) => {
            if (typeof index === 'number') {
              gallery.navigateToImage(index);
            }
          }}
        />
      )}
    </>
  );
});

EnhancedLandCard.displayName = "EnhancedLandCard";

export default EnhancedLandCard;