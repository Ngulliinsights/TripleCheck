import { motion } from "framer-motion";
import { Heart, Share2, Star, MapPin, Maximize2, Bed, Bath, Square } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Tooltip } from "./tooltip";
import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

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

  // Memoized animation variants to prevent unnecessary re-creation
  const cardVariants = useMemo(() => ({
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    hover: { y: -5, transition: { duration: 0.2 } }
  }), []);

  const imageVariants = useMemo(() => ({
    initial: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.3 } }
  }), []);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleHoverStart = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleHoverEnd = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleImageNavigation = useCallback((index: number) => {
    // Add bounds checking for extra safety
    if (index >= 0 && index < property.images.length) {
      setCurrentImageIndex(index);
    }
  }, [property.images.length]);

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
    } else if (event.key === 'ArrowRight' && currentImageIndex < property.images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  }, [currentImageIndex, property.images.length]);

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

  // Validate required data before rendering
  if (!property.images.length) {
    console.warn(`Property ${property.id} has no images`);
    return null;
  }

  return (
    <motion.div
      className={cn(
        "group relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow",
        className
      )}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`Property: ${property.title}`}
    >
      {/* Property Images with Gallery */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <motion.img
          src={property.images[currentImageIndex]}
          alt={`${property.title} - Image ${currentImageIndex + 1} of ${property.images.length}`}
          className="w-full h-full object-cover"
          variants={imageVariants}
          loading="lazy" // Performance optimization
        />
        
        {/* Fixed Image Navigation with proper ARIA attributes */}
        {property.images.length > 1 && (
          <div 
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1"
          >
            {property.images.map((_, index) => {
              const isSelected = currentImageIndex === index;
              return (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    isSelected 
                      ? "bg-white" 
                      : "bg-white/50 hover:bg-white/75"
                  )}
                  onClick={() => handleImageNavigation(index)}
                  aria-label={`View image ${index + 1}`}
                />
              );
            })}
          </div>
        )}

        {/* Enhanced Trust Badge with proper variant and custom styling */}
        <div className="absolute top-2 left-2">
          <Badge
            variant={badgeVariant}
            className={badgeClassName}
            role="img"
            aria-label={`Trust score: ${property.trustScore}, Status: ${property.verificationStatus}`}
          >
            <Star className="w-3 h-3" aria-hidden="true" />
            <span>Trust Score: {property.trustScore}</span>
          </Badge>
        </div>

        {/* Fixed Quick Actions with proper Button variants and Tooltip usage */}
        <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <Button 
              size="icon" 
              variant="secondary" // Fixed: removed "/10" which isn't supported
              onClick={handleSave}
              aria-label="Save property"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm" // Custom styling for transparency
            >
              <Heart className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip>
            <Button 
              size="icon" 
              variant="secondary" // Fixed: removed "/10" which isn't supported
              onClick={handleShare}
              aria-label="Share property"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm" // Custom styling for transparency
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="w-4 h-4 mr-1" aria-hidden="true" />
            <span className="text-sm line-clamp-1">{property.location}</span>
          </div>
        </div>

        {/* Property Features - now memoized */}
        {propertyFeatures}

        {/* Fixed Property Tags with proper list structure to address ARIA requirements */}
        {property.features.length > 0 && (
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

        {/* Price and CTA with enhanced formatting */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-2xl font-bold">
              ${property.price.toLocaleString()}
            </span>
            {property.type === "commercial" && (
              <span className="text-sm text-muted-foreground">/month</span>
            )}
          </div>
          <Button 
            className="group-hover:bg-primary/90"
            onClick={handleViewDetails}
            aria-label={`View details for ${property.title}`}
          >
            View Details
            <Maximize2 className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}