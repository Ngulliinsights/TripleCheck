import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  MapPin,
  Shield,
  Square,
} from "lucide-react"
import { memo, useMemo, type MouseEvent, type KeyboardEvent } from "react"

import { ImageGallery } from "../../shared/components/images"
import { Badge } from "../../shared/components/ui/badge"
import { Button } from "../../shared/components/ui/button"
import { Card, CardContent } from "../../shared/components/ui/card"
import { cn } from "../../shared/lib/utils"
import type { NormalizedProperty } from "../../shared/types/property"
import {
  usePropertyCompare,
  usePropertyCompareActions as usePropertyCompareContext,
} from "../contexts"

// Shared hooks and components
import {
  useImageGallery,
  usePropertyCardActions,
  usePropertyFormatting,
  usePropertyCompareActions,
  usePropertyCardState,
} from "../../shared/hooks"
import {
  PropertyImageSection,
  PropertyFeatures,
} from "../../shared/components/property/shared"

/* ------------------------------------------------------------------ */
/* Enhanced Types for Land Properties                                */
/* ------------------------------------------------------------------ */

type RiskLevel = "low" | "medium" | "high";
type TitleDeedStatus = "available" | "pending" | "missing";

// Extended property interface for land-specific features - now uses const assertions for better type safety
interface ExtendedLandProperty extends NormalizedProperty {
  readonly originalPrice?: number;
  readonly size?: string;
  readonly riskLevel?: RiskLevel;
  readonly titleDeedStatus?: TitleDeedStatus;
  readonly lastVerified?: string;
  readonly dateAdded?: Date;
  readonly viewCount?: number;
  readonly isNew?: boolean;
  readonly isFeatured?: boolean;
}

interface EnhancedLandCardProps {
  readonly property: NormalizedProperty;
  readonly className?: string;
  readonly showQuickActions?: boolean;
  readonly isInWishlist?: boolean;
  readonly viewMode?: "grid" | "list";
  readonly onSave?: (id: string) => void;
  readonly onShare?: (id: string) => void;
  readonly onViewDetails?: (id: string) => void;
  readonly onVerify?: (id: string) => void;
  readonly showGallery?: boolean;
  readonly onClick?: (property: NormalizedProperty) => void;
}

/* ------------------------------------------------------------------ */
/* Configuration Constants - Optimized with const assertions        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Utility Functions - Optimized for performance                    */
/* ------------------------------------------------------------------ */

// Memoized utility for formatting currency to avoid repeated calculations
const formatCurrency = (amount: number, currency = "KES"): string => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Optimized date formatter with consistent options
const formatDate = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    ...options,
  };
  return dateObj.toLocaleDateString("en-US", defaultOptions);
};

/* ------------------------------------------------------------------ */
/* Sub-components - Optimized and memoized                          */
/* ------------------------------------------------------------------ */

// Memoized status indicators component for better performance
const StatusIndicators = memo<{ property: ExtendedLandProperty }>(
  ({ property }) => {
    // Early return if no status indicators to show
    if (!property.isNew && !property.isFeatured) {
      return null;
    }

    return (
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
    );
  }
);

StatusIndicators.displayName = "StatusIndicators";

// Optimized land features component with better accessibility
const LandAccessFeatures = memo<{ features?: NormalizedProperty["features"] }>(
  ({ features }) => {
    // Early return if no features to display
    if (!features) return null;

    const accessFeatures = [
      {
        key: "waterAccess",
        label: "Water Access",
        emoji: "💧",
        colorClass: "bg-blue-50 text-blue-700",
      },
      {
        key: "roadAccess",
        label: "Road Access",
        emoji: "🛣️",
        colorClass: "bg-gray-50 text-gray-700",
      },
      {
        key: "electricityAccess",
        label: "Electricity",
        emoji: "⚡",
        colorClass: "bg-yellow-50 text-yellow-700",
      },
    ] as const;

    const availableFeatures = accessFeatures.filter(
      (feature) => features[feature.key as keyof typeof features]
    );

    // Return null if no access features are available
    if (availableFeatures.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {availableFeatures.map(({ key, label, emoji, colorClass }) => (
          <Badge
            key={key}
            variant="outline"
            className={cn("text-xs", colorClass)}
          >
            <span role="img" aria-label={label.toLowerCase()}>
              {emoji}
            </span>{" "}
            {label}
          </Badge>
        ))}
      </div>
    );
  }
);

LandAccessFeatures.displayName = "LandAccessFeatures";

// Optimized price section with better discount handling
const PriceSection = memo<{
  property: ExtendedLandProperty;
  formattedPrice: ReturnType<typeof usePropertyFormatting>["formattedPrice"];
}>(({ property, formattedPrice }) => {
  const originalPrice = property.originalPrice;

  return (
    <div className="space-y-1 flex-1">
      <div className="flex items-baseline space-x-2 flex-wrap">
        {formattedPrice.hasDiscount && originalPrice && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(originalPrice)}
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
        Title:{" "}
        <span className="capitalize font-medium text-foreground">
          {property.titleDeedStatus ||
            property.features?.titleDeedStatus ||
            "available"}
        </span>
      </div>
    </div>
  );
});

PriceSection.displayName = "PriceSection";

/* ------------------------------------------------------------------ */
/* Main Component - Optimized with better performance patterns      */
/* ------------------------------------------------------------------ */

export const EnhancedLandCard = memo<EnhancedLandCardProps>(
  ({
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
    onClick,
  }) => {
    // Type assertion with better safety check
    const extendedProperty = property as ExtendedLandProperty;

    // Memoized gallery configuration for better performance
    const galleryConfig = useMemo(
      () => ({
        property,
        images: property.images || [],
        enableNavigation: true,
        enableFullscreen: true,
      }),
      [property]
    );

    // Shared hooks for consistent behavior
    const gallery = useImageGallery(galleryConfig);

    // Memoized actions configuration to prevent unnecessary re-renders
    const actionsConfig = useMemo(
      () => ({
        ...(onSave && { onSave }),
        ...(onShare && { onShare }),
        ...(onViewDetails && { onViewDetails }),
        ...(onVerify && { onVerify }),
        // Use onClick as fallback for onViewDetails if not provided
        ...(!onViewDetails && onClick && { onClick }),
      }),
      [onSave, onShare, onViewDetails, onVerify, onClick]
    );

    const actions = usePropertyCardActions(property, actionsConfig);

    // Memoized formatting configuration for better performance
    const formattingConfig = useMemo(
      () => ({
        ...(extendedProperty.originalPrice && {
          originalPrice: extendedProperty.originalPrice,
        }),
        showUSDConversion: true,
        exchangeRate: 130,
      }),
      [extendedProperty.originalPrice]
    );

    const { formattedPrice, locationString, displayTitle, displayDescription } =
      usePropertyFormatting(property, formattingConfig);

    const { isHovered, handleMouseEnter, handleMouseLeave, handleKeyDown } =
      usePropertyCardState();

    // Compare functionality using unified PropertyContext
    const { selectedProperties, canAddMore } = usePropertyCompare();
    const { addToCompare, removeFromCompare } = usePropertyCompareContext();

    // Memoized comparison state to prevent unnecessary re-calculations
    const isInCompare = useMemo(
      () => selectedProperties.some((p) => p.id === property.id),
      [selectedProperties, property.id]
    );

    // Memoized compare actions configuration
    const compareActionsConfig = useMemo(
      () => ({
        property,
        isInCompare,
        canAddMore,
        addToCompare,
        removeFromCompare,
        locationString,
      }),
      [
        property,
        isInCompare,
        canAddMore,
        addToCompare,
        removeFromCompare,
        locationString,
      ]
    );

    const compareActions = usePropertyCompareActions(compareActionsConfig);

    // Optimized event handlers with better type safety
    const handleCardClick = (e: MouseEvent<HTMLDivElement>) => {
      // Prevent card click when clicking on interactive elements
      if ((e.target as HTMLElement).closest("button, a")) {
        return;
      }
      onClick?.(property);
    };

    const handleCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      handleKeyDown(e, () => onClick?.(property));
    };

    // Memoized card classes for better performance
    const cardClasses = useMemo(
      () =>
        cn(
          "group relative bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          // Mobile-first responsive design
          "w-full max-w-sm mx-auto sm:max-w-none",
          // Hover effects only on non-touch devices
          "md:hover:-translate-y-2",
          viewMode === "list" && "sm:flex sm:flex-row sm:max-w-4xl",
          className
        ),
      [viewMode, className]
    );

    // Memoized image container classes
    const imageContainerClasses = useMemo(
      () =>
        cn(
          "relative overflow-hidden",
          viewMode === "grid" ?
            "aspect-[4/3] w-full"
          : "sm:w-80 sm:h-60 aspect-[4/3] sm:aspect-auto"
        ),
      [viewMode]
    );

    return (
      <>
        <Card
          className={cardClasses}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onKeyDown={handleCardKeyDown}
          onClick={handleCardClick}
          tabIndex={onClick ? 0 : undefined}
          role={onClick ? "button" : undefined}
          aria-label={onClick ? `View details for ${displayTitle}` : undefined}
        >
          {/* Status Indicators - Memoized component */}
          <StatusIndicators property={extendedProperty} />

          {/* Image Section - Mobile responsive */}
          <div className={imageContainerClasses}>
            <PropertyImageSection
              property={property}
              gallery={gallery}
              actions={actions}
              isHovered={isHovered}
              showQuickActions={showQuickActions}
              isInWishlist={isInWishlist}
              priority={false}
              isInCompare={isInCompare}
              canAddMore={canAddMore}
              onCompareClick={compareActions.handleCompareClick}
              showVerificationBadge={true}
              showTrustScore={true}
              showImageCount={true}
            />
          </div>

          {/* Content Section - Mobile responsive padding */}
          <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1">
            {/* Title and Date */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <Button
                  variant="ghost"
                  className="font-bold text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors flex-1 mr-2 text-left p-0 h-auto justify-start"
                  onClick={actions.handleViewDetails}
                  type="button"
                  aria-label={`View details for ${displayTitle}`}
                >
                  {displayTitle}
                </Button>
                {extendedProperty.dateAdded && (
                  <div className="flex items-center text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded-full">
                    <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
                    <time dateTime={extendedProperty.dateAdded.toISOString()}>
                      {formatDate(extendedProperty.dateAdded)}
                    </time>
                  </div>
                )}
              </div>

              <div className="flex items-center text-muted-foreground">
                <MapPin
                  className="w-4 h-4 mr-2 text-primary flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm line-clamp-1 font-medium">
                  {locationString}
                </span>
              </div>
            </div>

            {/* Description */}
            {displayDescription && (
              <p className="text-muted-foreground text-sm line-clamp-2">
                {displayDescription}
              </p>
            )}

            {/* Use shared PropertyFeatures component with land variant */}
            <PropertyFeatures
              property={property}
              locationString={locationString}
              variant="land"
            />

            {/* Land Access Features - Memoized component */}
            <LandAccessFeatures features={property.features} />

            {/* Price and Actions - Mobile responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-gray-100 gap-3 sm:gap-0">
              <PriceSection
                property={extendedProperty}
                formattedPrice={formattedPrice}
              />

              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={actions.handleVerify}
                  className="flex items-center gap-1 text-xs sm:text-sm"
                  aria-label="Verify property"
                >
                  <Shield
                    className="w-3 h-3 sm:w-4 sm:h-4"
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">Verify</span>
                  <span className="sm:hidden">✓</span>
                </Button>
                <Button
                  size="sm"
                  onClick={actions.handleViewDetails}
                  className="flex items-center gap-1 text-xs sm:text-sm"
                  aria-label={`View details for ${displayTitle}`}
                >
                  <span className="hidden sm:inline">Details</span>
                  <span className="sm:hidden">View</span>
                  <ArrowRight
                    className="w-3 h-3 sm:w-4 sm:h-4"
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </div>

            {/* Compare Button - Mobile responsive */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 gap-2 sm:gap-0">
              <Button
                size="sm"
                variant={isInCompare ? "default" : "outline"}
                onClick={compareActions.handleCompareClick}
                disabled={!canAddMore && !isInCompare}
                className="flex items-center gap-1 w-full sm:w-auto text-xs sm:text-sm"
                aria-label={
                  isInCompare ? "Remove from comparison"
                  : canAddMore ?
                    "Add to comparison"
                  : "Cannot add more properties to comparison"
                }
              >
                {isInCompare ?
                  <>
                    <CheckCircle
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline">In Comparison</span>
                    <span className="sm:hidden">Added</span>
                  </>
                : <>
                    <Square
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      aria-hidden="true"
                    />
                    Compare
                  </>
                }
              </Button>

              {extendedProperty.lastVerified && (
                <div className="text-xs text-muted-foreground text-center sm:text-right">
                  Last verified:{" "}
                  <time
                    dateTime={new Date(
                      extendedProperty.lastVerified
                    ).toISOString()}
                  >
                    {formatDate(extendedProperty.lastVerified, {
                      year: "numeric",
                    })}
                  </time>
                </div>
              )}
            </div>

            {/* View Count */}
            {extendedProperty.viewCount && (
              <div className="flex items-center text-xs text-muted-foreground pt-2 border-t border-gray-50">
                <Eye className="w-3 h-3 mr-1" aria-hidden="true" />
                <span>
                  Viewed {extendedProperty.viewCount.toLocaleString()} times
                </span>
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
            onImageClick={(_, index) => {
              if (typeof index === "number") {
                gallery.navigateToImage(index);
              }
            }}
          />
        )}
      </>
    );
  }
);

EnhancedLandCard.displayName = "EnhancedLandCard";

export default EnhancedLandCard;
