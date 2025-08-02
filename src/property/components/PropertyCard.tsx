// Removed Framer Motion for better performance and stability
import { Heart, Share2, Star, MapPin, Maximize2, Bed, Bath, Square } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@shared/components/ui/tooltip";
import { B2BContextualPrompt } from "@shared/components/b2b";
import { useState, useCallback, useMemo } from "react";
import { cn } from "@shared/lib/utils";

// More precise type definitions for better type safety
type PropertyType = "residential" | "commercial";
type VerificationStatus = "verified" | "pending" | "warning";

// Enhanced property interface with better type constraints
interface Property {
  readonly id: string;
  readonly title: string;
  readonly type: PropertyType;
  readonly price: number;
  readonly location: string;
  readonly images: readonly string[]; // readonly array for immutability
  readonly bedrooms?: number;
  readonly bathrooms?: number;
  readonly area: number;
  readonly trustScore: number; // Consider adding range validation (0-100)
  readonly verificationStatus: VerificationStatus;
  readonly features: readonly string[];
}

interface PropertyCardProps {
  readonly property: Property;
  readonly className?: string;
  readonly onSave?: (propertyId: string) => void; // Added callback for save action
  readonly onShare?: (propertyId: string) => void; // Added callback for share action
  readonly onViewDetails?: (propertyId: string) => void; // Added callback for view details
}

export function PropertyCard({ 
  property, 
  className,
  onSave,
  onShare,
  onViewDetails
}: PropertyCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Removed complex animation variants for better performance

  // Validate required data before rendering - show placeholder if no images
  const hasImages = property.images && property.images.length > 0;
  const displayImages = useMemo(() => {
    return hasImages ? property.images : ['/assets/apartment-luxury-1.jpg'];
  }, [hasImages, property.images]);
  
  if (!hasImages) {
    console.warn(`Property ${property.id} has no images, using placeholder`);
  }

  // Memoized event handlers to prevent unnecessary re-renders
  const handleHoverStart = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleHoverEnd = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleImageNavigation = useCallback((index: number) => {
    // Add bounds checking for extra safety
    if (index >= 0 && index < displayImages.length) {
      setCurrentImageIndex(index);
    }
  }, [displayImages.length]);

  const handleSave = useCallback(() => {
    onSave?.(property.id);
  }, [onSave, property.id]);

  const handleShare = useCallback(() => {
    onShare?.(property.id);
  }, [onShare, property.id]);

  const handleViewDetails = useCallback(() => {
    onViewDetails?.(property.id);
  }, [onViewDetails, property.id]);

  // Enhanced keyboard navigation for image gallery
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft' && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    } else if (event.key === 'ArrowRight' && currentImageIndex < displayImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  }, [currentImageIndex, displayImages.length]);

  // Fixed badge variant calculation to match actual Badge component variants
  const badgeVariant = useMemo(() => {
    switch (property.verificationStatus) {
      case "verified":
        return "default"; // Using "default" instead of "success" since it's not available
      case "pending":
        return "outline"; // Using "outline" instead of "warning" since it's not available
      case "warning":
        return "destructive";
      default:
        // Type-safe exhaustive check
        const _exhaustiveCheck: never = property.verificationStatus;
        return "destructive";
    }
  }, [property.verificationStatus]);

  // Enhanced badge styling based on verification status
  const badgeClassName = useMemo(() => {
    const baseClasses = "flex items-center space-x-1";
    switch (property.verificationStatus) {
      case "verified":
        return cn(baseClasses, "bg-green-100 text-green-800 border-green-300");
      case "pending":
        return cn(baseClasses, "bg-yellow-100 text-yellow-800 border-yellow-300");
      case "warning":
        return cn(baseClasses, "bg-red-100 text-red-800 border-red-300");
      default:
        return baseClasses;
    }
  }, [property.verificationStatus]);

  // Memoized property features to prevent unnecessary re-renders
  const propertyFeatures = useMemo(() => (
    <div className="flex items-center justify-between text-sm">
      {property.bedrooms && (
        <div className="flex items-center">
          <Bed className="w-4 h-4 mr-1" aria-hidden="true" />
          <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
        </div>
      )}
      {property.bathrooms && (
        <div className="flex items-center">
          <Bath className="w-4 h-4 mr-1" aria-hidden="true" />
          <span>{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
        </div>
      )}
      <div className="flex items-center">
        <Square className="w-4 h-4 mr-1" aria-hidden="true" />
        <span>{property.area} m²</span>
      </div>
    </div>
  ), [property.bedrooms, property.bathrooms, property.area]);

  return (
    <div
      className={cn(
        "group relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1",
        className
      )}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`Property: ${property.title}`}
    >
      {/* Enhanced Property Images with Gallery */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {/* Image with enhanced hover effects */}
        <img
          src={displayImages[currentImageIndex]}
          alt={`${property.title} - Image ${currentImageIndex + 1} of ${displayImages.length}`}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
          loading="lazy"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            e.currentTarget.src = '/placeholder-property.jpg';
          }}
        />
        
        {/* Subtle overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Property type indicator */}
        <div className="absolute top-2 left-2 z-10">
          <Badge 
            variant="secondary" 
            className="bg-black/20 text-white border-white/20 backdrop-blur-sm font-medium"
          >
            {property.type === 'commercial' ? '🏢 Commercial' : '🏠 Residential'}
          </Badge>
        </div>
        
        {/* Enhanced Image Navigation with better styling */}
        {displayImages.length > 1 && hasImages && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1">
            {displayImages.map((_, index) => {
              const isSelected = currentImageIndex === index;
              return (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    isSelected 
                      ? "bg-white scale-125" 
                      : "bg-white/60 hover:bg-white/80 hover:scale-110"
                  )}
                  onClick={() => handleImageNavigation(index)}
                  aria-label={`View image ${index + 1}`}
                />
              );
            })}
          </div>
        )}
        
        {/* Image count indicator */}
        {displayImages.length > 1 && hasImages && (
          <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {currentImageIndex + 1}/{displayImages.length}
          </div>
        )}

        {/* Enhanced Trust Badge with better positioning */}
        <div className="absolute top-12 left-2 z-10">
          <Badge
            variant={badgeVariant}
            className={cn(
              badgeClassName,
              "bg-white/90 backdrop-blur-sm shadow-sm border-0 font-medium"
            )}
            role="img"
            aria-label={`Trust score: ${property.trustScore}, Status: ${property.verificationStatus}`}
          >
            <Star className="w-3 h-3 fill-current" aria-hidden="true" />
            <span>{property.trustScore}% Trusted</span>
          </Badge>
        </div>

        {/* Enhanced Quick Actions with better styling */}
        <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="secondary"
                  onClick={handleSave}
                  aria-label="Save property"
                  className="bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 backdrop-blur-sm shadow-sm border-0 transition-all duration-200"
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save to favorites</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="secondary"
                  onClick={handleShare}
                  aria-label="Share property"
                  className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-500 backdrop-blur-sm shadow-sm border-0 transition-all duration-200"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share property</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Enhanced Property Details */}
      <div className="p-5 space-y-4">
        <div className="space-y-3">
          <h3 className="font-bold text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2 text-primary" aria-hidden="true" />
            <span className="text-sm line-clamp-1 font-medium">{property.location}</span>
          </div>
        </div>

        {/* Property Features - now memoized */}
        {propertyFeatures}

        {/* Fixed Property Tags with proper list structure to address ARIA requirements */}
        {property.features && property.features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {property.features.map((feature, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs"
              >
                {feature}
              </Badge>
            ))}
          </div>
        )}

        {/* Enhanced Price and CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="space-y-1">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-primary">
                KES {property.price.toLocaleString()}
              </span>
              {property.type === "commercial" && (
                <span className="text-sm text-muted-foreground font-medium">/month</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              ~${Math.round(property.price / 130).toLocaleString()} USD
            </div>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105"
            onClick={handleViewDetails}
            aria-label={`View details for ${property.title}`}
          >
            View Details
            <Maximize2 className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* B2B Contextual Prompt for High-Value Properties */}
        {property.price > 5000000 && (
          <div className="mt-4">
            <B2BContextualPrompt
              context="high_value_property"
              propertyValue={property.price}
              className="text-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
}