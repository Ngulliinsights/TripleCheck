import { B2BContextualPrompt } from "@shared/components/b2b";
import { ImageGallery, IMAGE_COMPONENT_PRESETS } from "@shared/components/images";
import type { BaseImage } from "@shared/components/images";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/components/ui/tooltip";
import { cn } from "@shared/lib/utils";
import {
  Heart,
  Share2,
  Star,
  MapPin,
  Maximize2,
  Bed,
  Bath,
  Square,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  AlertCircle,
} from "lucide-react";
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  memo,
  createContext,
  useContext,
} from "react";

/* ------------------------------------------------------------------ */
/* Configuration and Constants                                        */
/* ------------------------------------------------------------------ */

// Centralized configuration that can be easily modified or moved to context
const CONFIG = {
  EXCHANGE_RATE: 130, // KES to USD - should come from API in production
  HIGH_VALUE_THRESHOLD: 5_000_000, // KES threshold for B2B prompts
  IMAGE_PRELOAD_COUNT: 2, // Number of images to preload ahead
  MAX_VISIBLE_FEATURES: 3, // Maximum feature tags to show
  PLACEHOLDER_IMAGE: "/assets/placeholder-property.jpg",
} as const;

// Error boundary context for better error handling
const ErrorContext = createContext<{
  reportError: (error: Error, context: string) => void;
} | null>(null);

/* ------------------------------------------------------------------ */
/* Enhanced Types with Branded IDs                                   */
/* ------------------------------------------------------------------ */

// Branded types prevent accidentally passing wrong string types
type PropertyId = string & { readonly __brand: unique symbol };
type ImageUrl = string & { readonly __brand: unique symbol };

type PropertyType = "residential" | "commercial";
type VerificationStatus = "verified" | "pending" | "warning";
type PriceType = "sale" | "rent" | "lease";

interface Property {
  readonly id: PropertyId;
  readonly title: string;
  readonly type: PropertyType;
  readonly priceType?: PriceType;
  readonly price: number;
  readonly originalPrice?: number;
  readonly location: string;
  readonly images: readonly ImageUrl[];
  readonly bedrooms?: number;
  readonly bathrooms?: number;
  readonly area: number;
  readonly trustScore: number;
  readonly verificationStatus: VerificationStatus;
  readonly features: readonly string[];
  readonly dateAdded?: Date;
  readonly viewCount?: number;
  readonly isNew?: boolean;
  readonly isFeatured?: boolean;
}

interface PropertyCardProps {
  readonly property: Property;
  readonly className?: string;
  readonly showQuickActions?: boolean;
  readonly isInWishlist?: boolean;
  readonly viewMode?: "grid" | "list";
  readonly onSave?: (id: PropertyId) => void;
  readonly onShare?: (id: PropertyId) => void;
  readonly onViewDetails?: (id: PropertyId) => void;
  readonly priority?: boolean; // For above-the-fold images
}

/* ------------------------------------------------------------------ */
/* Custom Hooks for Business Logic Separation                        */
/* ------------------------------------------------------------------ */

/**
 * Convert property images to BaseImage format for ImageGallery
 * Replaces the complex useImageGallery hook with simple conversion
 */
function convertToBaseImages(images: readonly ImageUrl[], propertyTitle: string): BaseImage[] {
  const validImages = images.filter(
    (img): img is ImageUrl => typeof img === "string" && img.trim() !== ""
  );
  
  if (validImages.length === 0) {
    return [{
      id: 'placeholder',
      src: CONFIG.PLACEHOLDER_IMAGE,
      alt: `${propertyTitle} - No image available`
    }];
  }

  return validImages.map((img, index) => ({
    id: `${propertyTitle}-${index}`,
    src: img,
    alt: `${propertyTitle} - Image ${index + 1}`,
    caption: index === 0 ? 'Main photo' : undefined
  }));
}

/**
 * Hook for managing property actions with enhanced error handling
 * Centralizes all user interaction logic
 */
function usePropertyActions(
  property: Property,
  callbacks: {
    onSave?: (id: PropertyId) => void;
    onShare?: (id: PropertyId) => void;
    onViewDetails?: (id: PropertyId) => void;
  }
) {
  const errorContext = useContext(ErrorContext);

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
        const errorObj =
          error instanceof Error ? error : new Error(`${actionName} failed`);
        errorContext?.reportError(errorObj, `PropertyCard.${actionName}`);

        // User-facing error notification could go here
        // Note: Console usage for development debugging only
        if (process.env.NODE_ENV === 'development') {
          console.warn('PropertyCard error:', errorContext);
        }
      }
    },
    [errorContext]
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
          // Enhanced sharing with Web Share API and fallback
          if (navigator.share) {
            await navigator.share({
              title: property.title,
              text: `Check out this property: ${property.title}`,
              url: `${window.location.origin}/property/${property.id}`,
            });
          } else if (navigator.clipboard) {
            // Fallback to clipboard
            await navigator.clipboard.writeText(
              `${window.location.origin}/property/${property.id}`
            );
            // Show toast notification here in real app
          } else {
            callbacks.onShare?.(property.id);
          }
        },
        "Share"
      );
    },
    [handleAction, callbacks, property.id, property.title]
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

  return { handleSave, handleShare, handleViewDetails };
}

/**
 * Hook for intersection observer-based visibility detection
 * Optimizes rendering for cards not in viewport
 */
function useIntersectionObserver(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;
        
        const visible = entry.isIntersecting;
        setIsVisible(visible);

        // Once visible, stay rendered for better UX
        if (visible && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, hasBeenVisible]);

  return { elementRef, isVisible, hasBeenVisible };
}

/* ------------------------------------------------------------------ */
/* Utility Functions with Enhanced Logic                             */
/* ------------------------------------------------------------------ */

/**
 * Enhanced price formatting with proper currency handling
 * Now supports multiple currencies and proper localization
 */
const formatPropertyPrice = (
  price: number,
  originalPrice?: number,
  priceType?: PriceType
) => {
  // Use proper number formatting for locale
  const kenyanPrice = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(price);

  const usdPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(Math.round(price / CONFIG.EXCHANGE_RATE));

  // More readable price type labels
  const priceLabels: Record<PriceType, string> = {
    rent: "/month",
    lease: "/year",
    sale: "",
  };

  return {
    primary: kenyanPrice,
    secondary: `~${usdPrice}`,
    label: priceType ? (priceLabels[priceType as keyof typeof priceLabels] ?? "") : "",
    hasDiscount: Boolean(originalPrice && originalPrice > price),
    discountPercentage:
      originalPrice && originalPrice > price ?
        Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0,
  };
};

/**
 * Enhanced badge variant logic with better type safety
 */
const getVerificationBadgeConfig = (status: VerificationStatus) => {
  const configs = {
    verified: {
      variant: "default" as const,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: "✓",
      label: "Verified",
    },
    pending: {
      variant: "outline" as const,
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: "⏳",
      label: "Pending",
    },
    warning: {
      variant: "destructive" as const,
      className: "bg-red-50 text-red-700 border-red-200",
      icon: "⚠️",
      label: "Warning",
    },
  } as const;

  return configs[status as keyof typeof configs] ?? configs.pending;
};

/* ------------------------------------------------------------------ */
/* Sub-components for Better Organization                            */
/* ------------------------------------------------------------------ */

/**
 * Skeleton loader component for better loading states
 */
const PropertyCardSkeleton = memo(() => (
  <div className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
    <div className="aspect-[4/3] bg-gray-200" />
    <div className="p-6 space-y-4">
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="h-10 bg-gray-200 rounded w-24" />
      </div>
    </div>
  </div>
));

PropertyCardSkeleton.displayName = "PropertyCardSkeleton";

/**
 * Image gallery component with enhanced accessibility
 */
const PropertyImageGallery = memo(
  ({
    images,
    property,
    isHovered,
    onViewDetails,
  }: {
    images: BaseImage[];
    property: Property;
    isHovered: boolean;
    onViewDetails: () => void;
  }) => {

    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 aspect-[4/3]">
        {/* Use ImageGallery for simplified image handling */}
        <div 
          className="w-full h-full cursor-pointer"
          onClick={onViewDetails}
        >
          <ImageGallery
            images={images}
            {...IMAGE_COMPONENT_PRESETS.SIMPLE_VIEWER}
            showThumbnails={false}
            allowNavigation={images.length > 1}
            enableFullscreen={false}
            showImageCounter={images.length > 1}
            className="w-full h-full"
            onImageClick={onViewDetails}
          />
        </div>

        {/* Enhanced Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Property Badges with Enhanced Design */}
        <div className="absolute top-3 left-3 z-10 space-y-2">
          <Badge
            variant="secondary"
            className="bg-black/40 text-white border-white/20 backdrop-blur-md font-medium"
          >
            {property.type === "commercial" ?
              "🏢 Commercial"
            : "🏠 Residential"}
          </Badge>

          {(() => {
            const badgeConfig = getVerificationBadgeConfig(
              property.verificationStatus
            );
            return (
              <Badge
                variant={badgeConfig.variant}
                className={cn(
                  "flex items-center space-x-1 font-medium bg-white/95 backdrop-blur-md shadow-sm border-0",
                  badgeConfig.className
                )}
                role="img"
                aria-label={`Trust score: ${property.trustScore}%, Status: ${badgeConfig.label}`}
              >
                <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                <span>{property.trustScore}%</span>
              </Badge>
            );
          })()}
        </div>
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Viewing image {currentIndex + 1} of {processedImages.length}
        </div>
      </div>
    );
  }
);

ImageGallery.displayName = "ImageGallery";

/* ------------------------------------------------------------------ */
/* Main Component with Enhanced Architecture                          */
/* ------------------------------------------------------------------ */

export const PropertyCard = memo<PropertyCardProps>(
  ({
    property,
    className,
    showQuickActions = true,
    isInWishlist = false,
    viewMode = "grid",
    onSave,
    onShare,
    onViewDetails,
    priority = false,
  }) => {
    // Intersection observer for performance optimization
    const { elementRef, hasBeenVisible } = useIntersectionObserver(0.1);

    // Convert images to BaseImage format for ImageGallery
    const images = useMemo(() => convertToBaseImages(property.images, property.title), [property.images, property.title]);
    const actions = usePropertyActions(property, {
      ...(onSave && { onSave }),
      ...(onShare && { onShare }),
      ...(onViewDetails && { onViewDetails }),
    });

    // Local state for interactions
    const [isHovered, setIsHovered] = useState(false);

    // Memoized computed values for better performance
    const formattedPrice = useMemo(
      () =>
        formatPropertyPrice(
          property.price,
          property.originalPrice,
          property.priceType
        ),
      [property.price, property.originalPrice, property.priceType]
    );

    const propertyFeatures = useMemo(
      () => (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {property.bedrooms && (
            <div
              className="flex items-center"
              title={`${property.bedrooms} bedroom${property.bedrooms !== 1 ? "s" : ""}`}
            >
              <Bed className="w-4 h-4 mr-1" aria-hidden="true" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms && (
            <div
              className="flex items-center"
              title={`${property.bathrooms} bathroom${property.bathrooms !== 1 ? "s" : ""}`}
            >
              <Bath className="w-4 h-4 mr-1" aria-hidden="true" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          <div
            className="flex items-center"
            title={`${property.area} square meters`}
          >
            <Square className="w-4 h-4 mr-1" aria-hidden="true" />
            <span>{property.area} m²</span>
          </div>
          {property.viewCount && (
            <div
              className="flex items-center text-xs"
              title={`Viewed ${property.viewCount} times`}
            >
              <Eye className="w-3 h-3 mr-1" aria-hidden="true" />
              <span>{property.viewCount}</span>
            </div>
          )}
        </div>
      ),
      [property.bedrooms, property.bathrooms, property.area, property.viewCount]
    );

    // Enhanced keyboard navigation for the entire card
    const handleCardKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          actions.handleViewDetails();
        } else {
          gallery.handleKeyNavigation(event);
        }
      },
      [actions, gallery]
    );

    // Return skeleton if not yet visible (performance optimization)
    if (!hasBeenVisible && !priority) {
      return (
        <div ref={elementRef}>
          <PropertyCardSkeleton />
        </div>
      );
    }

    return (
      <div
        ref={elementRef}
        className={cn(
          "group relative bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border border-gray-100 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          viewMode === "list" && "flex flex-row max-w-4xl",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={handleCardKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Property: ${property.title} in ${property.location}. Press Enter to view details.`}
      >
        {/* Enhanced Status Indicators */}
        {(property.isNew || property.isFeatured) && (
          <div className="absolute top-0 left-0 z-20">
            {property.isNew && (
              <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg shadow-md">
                NEW
              </div>
            )}
            {property.isFeatured && (
              <div
                className={cn(
                  "bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg shadow-md",
                  property.isNew && "mt-8"
                )}
              >
                FEATURED
              </div>
            )}
          </div>
        )}

        {/* Image Gallery Section */}
        <div
          className={cn(
            "relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200",
            viewMode === "grid" ? "aspect-[4/3]" : "w-80 h-60"
          )}
        >
          <PropertyImageGallery
            images={images}
            property={property}
            isHovered={isHovered}
            onViewDetails={actions.handleViewDetails}
          />

          {/* Enhanced Quick Action Buttons */}
          {showQuickActions && (
            <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={actions.handleSave}
                      aria-label={
                        isInWishlist ?
                          "Remove from wishlist"
                        : "Add to wishlist"
                      }
                      className={cn(
                        "bg-white/95 backdrop-blur-md shadow-sm border-0 transition-all duration-200 hover:scale-110",
                        isInWishlist ?
                          "text-red-500 hover:text-red-600"
                        : "text-gray-600 hover:text-red-500"
                      )}
                      type="button"
                    >
                      <Heart
                        className={cn(
                          "w-4 h-4",
                          isInWishlist && "fill-current"
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isInWishlist ?
                        "Remove from wishlist"
                      : "Add to wishlist"}
                    </p>
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
                      aria-label="Share property"
                      className="bg-white/95 hover:bg-white text-gray-600 hover:text-blue-500 backdrop-blur-md shadow-sm border-0 transition-all duration-200 hover:scale-110"
                      type="button"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share property (supports Web Share API)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Enhanced Property Details Section */}
        <div className="p-6 space-y-4 flex-1">
          {/* Title and Date with Better Typography */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors flex-1 mr-2">
                {property.title}
              </h3>
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
              <MapPin
                className="w-4 h-4 mr-2 text-primary flex-shrink-0"
                aria-hidden="true"
              />
              <span className="text-sm line-clamp-1 font-medium">
                {property.location}
              </span>
            </div>
          </div>

          {/* Enhanced Property Features */}
          {propertyFeatures}

          {/* Enhanced Feature Tags with Better UX */}
          {property.features && property.features.length > 0 && (
            <div className="space-y-2">
              <ul
                className="flex flex-wrap gap-2"
                aria-label="Property features"
              >
                {property.features
                  .slice(0, CONFIG.MAX_VISIBLE_FEATURES)
                  .map((feature, index) => (
                    <li key={index}>
                      <Badge
                        variant="outline"
                        className="text-xs bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        {feature}
                      </Badge>
                    </li>
                  ))}
                {property.features.length > CONFIG.MAX_VISIBLE_FEATURES && (
                  <li>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="text-xs bg-gray-50 hover:bg-gray-100 transition-colors cursor-help"
                          >
                            +
                            {property.features.length -
                              CONFIG.MAX_VISIBLE_FEATURES}{" "}
                            more
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs">
                            <p className="font-medium mb-2">
                              Additional features:
                            </p>
                            <ul className="text-sm space-y-1">
                              {property.features
                                .slice(CONFIG.MAX_VISIBLE_FEATURES)
                                .map((feature, index) => (
                                  <li key={index}>• {feature}</li>
                                ))}
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Enhanced Price and Action Section */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="space-y-1">
              <div className="flex items-baseline space-x-2 flex-wrap">
                {formattedPrice.hasDiscount && property.originalPrice && (
                  <div className="flex items-center space-x-2">
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
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-primary">
                    {formattedPrice.primary}
                  </span>
                  {formattedPrice.label && (
                    <span className="text-sm text-muted-foreground font-medium">
                      {formattedPrice.label}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {formattedPrice.secondary}
              </div>
            </div>

            <Button
              className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={actions.handleViewDetails}
              aria-label={`View details for ${property.title}`}
              type="button"
            >
              View Details
              <Maximize2 className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Enhanced B2B Contextual Prompt */}
          {property.price > CONFIG.HIGH_VALUE_THRESHOLD && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <B2BContextualPrompt
                context="high_value_property"
                propertyValue={property.price}
                className="text-xs bg-blue-50 p-3 rounded-lg border border-blue-200"
              />
            </div>
          )}

          {/* Enhanced Accessibility Information */}
          <div className="sr-only">
            Property summary: {property.title} located in {property.location}.
            {property.bedrooms && ` ${property.bedrooms} bedrooms,`}
            {property.bathrooms && ` ${property.bathrooms} bathrooms,`}
            {` ${property.area} square meters.`}
            {` Price: ${formattedPrice.primary}${formattedPrice.label}.`}
            {` Trust score: ${property.trustScore}%.`}
            {` Status: ${property.verificationStatus}.`}
            {gallery.hasMultipleImages &&
              ` Has ${gallery.processedImages.length} images. Use arrow keys or number keys to navigate images.`}
          </div>
        </div>
      </div>
    );
  }
);

PropertyCard.displayName = "PropertyCard";

/* ------------------------------------------------------------------ */
/* Enhanced Error Boundary for Production Use                        */
/* ------------------------------------------------------------------ */

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class PropertyCardErrorBoundary extends React.Component<
  React.PropsWithChildren<Record<string, never>>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<Record<string, never>>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // Log error to monitoring service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'development') {
      
    }
    // In production, send to error monitoring service
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-red-200 p-6">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <div>
              <h3 className="font-medium text-gray-900">
                Unable to load property
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                There was an error displaying this property card.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false })}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/* Usage Examples and Type Helpers                                   */
/* ------------------------------------------------------------------ */

// Helper function to create properly typed Property objects
export const createProperty = (
  data: Omit<Property, "id"> & { id: string }
): Property => ({
  ...data,
  id: data.id as PropertyId,
  images: data.images as ImageUrl[],
});

// Example usage with error boundary:
/*
<PropertyCardErrorBoundary>
  <PropertyCard
    property={propertyData}
    onSave={(id) => console.log('Save:', id)}
    onShare={(id) => console.log('Share:', id)}
    onViewDetails={(id) => console.log('View:', id)}
    priority={index < 3} // Mark first 3 cards as priority
  />
</PropertyCardErrorBoundary>
*/

export default PropertyCard;
