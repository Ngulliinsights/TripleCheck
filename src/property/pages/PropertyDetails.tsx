import {
  MapPin,
  Bed,
  Bath,
  Square,
  Shield,
  Calendar,
  User,
  Phone,
  Mail,
  ArrowLeft,
  Heart,
  Share2,
  TreePine,
  Droplets,
  Zap,
  Car,
  ZoomIn,
  X,
  Play,
  Pause,
} from "lucide-react";
import React, { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Import shared components and utilities
import { normalizeProperty } from "../../shared";
import { EnhancedPhotoManagementButton } from "../../shared/components/property/PhotoManagementButton";
import PropertyDetailsSkeleton from "../../shared/components/skeletons/PropertyDetailsSkeleton";
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card";
import { useSafePropertyQuery } from "../../shared/hooks/useSafeQuery";
import { Property } from "../../shared/types/property";
import { formatPrice, formatDate } from "../../shared/utils/formatters";

// Constants
const NOT_SPECIFIED = "Not specified";

// Land-specific types for unified property handling
interface LandFeatures {
  size: string;
  soilType: string;
  waterAccess: boolean;
  roadAccess: boolean;
  electricity: boolean;
  landUse:
    | "agricultural"
    | "residential"
    | "commercial"
    | "industrial"
    | "mixed";
  topography: "flat" | "hilly" | "mountainous" | "valley";
  drainage: "excellent" | "good" | "fair" | "poor";
  vegetation: string;
  nearbyAmenities: string[];
}

interface LandVerificationData {
  titleDeedStatus: "verified" | "pending" | "missing" | "disputed";
  surveyStatus: "completed" | "pending" | "required";
  boundaryStatus: "clear" | "disputed" | "unmarked";
  landRights: "freehold" | "leasehold" | "customary" | "government";
  encumbrances: string[];
  lastSurveyDate?: string;
  surveyorName?: string;
  registrationNumber?: string;
}

// Extended property type for land properties
interface PropertyWithLandFeatures extends Property {
  landFeatures?: LandFeatures;
  verification?: LandVerificationData;
}

interface PropertyDetailsProps {
  readonly id?: string;
}

// Convert images to ImageGallery format
const convertToGalleryImages = (images: string[], title: string) => {
  return images.map((url, index) => ({
    id: `property-${index}`,
    src: url,
    alt: `${title} - View ${index + 1}`,
    category: "property" as const,
  }));
};

// Enhanced Property Image Gallery Component
interface PropertyImageGalleryProps {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    category: string;
  }>;
  propertyTitle: string;
}

const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  images,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const handleImageClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    setShowFullscreen(!showFullscreen);
  }, [showFullscreen]);

  const handlePrevious = useCallback(() => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Keyboard navigation for fullscreen
  React.useEffect(() => {
    if (!showFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          setShowFullscreen(false);
          break;
        case "ArrowLeft":
          handlePrevious();
          break;
        case "ArrowRight":
          handleNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showFullscreen, handlePrevious, handleNext]);

  if (images.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 text-4xl mb-2">📷</div>
        <p className="text-gray-500">No images available</p>
      </Card>
    );
  }

  const selectedImage = images[selectedImageIndex];

  if (!selectedImage) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 text-4xl mb-2">📷</div>
        <p className="text-gray-500">No images available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-gray-100">
          <img
            src={selectedImage.src}
            alt={selectedImage.alt}
            className="w-full h-full object-cover"
          />

          {/* Image Navigation Overlay */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                aria-label="Previous image"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                aria-label="Next image"
              >
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </>
          )}

          {/* Image Counter and Fullscreen Button */}
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {selectedImageIndex + 1} of {images.length}
          </div>

          <button
            onClick={handleFullscreenToggle}
            className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
            aria-label="View fullscreen"
            title="View fullscreen"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </Card>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleImageClick(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedImageIndex ?
                  "border-primary shadow-md"
                : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-12 left-1/2 -translate-x-1/2 z-50 p-3 bg-black/90 backdrop-blur-sm text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-xl border-2 border-white/20 hover:border-red-400"
              aria-label="Close fullscreen"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Main fullscreen image */}
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-full object-contain"
            />

            {/* Navigation in fullscreen */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                  aria-label="Previous image"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                  aria-label="Next image"
                >
                  <ArrowLeft className="w-6 h-6 rotate-180" />
                </button>
              </>
            )}

            {/* Image counter in fullscreen */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
              {selectedImageIndex + 1} of {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Related Properties Carousel Component
interface RelatedPropertiesCarouselProps {
  currentPropertyId: string;
}

const RelatedPropertiesCarousel: React.FC<RelatedPropertiesCarouselProps> = ({
  currentPropertyId,
}) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Mock related properties data - replace with actual API call
  const relatedProperties = useMemo(() => {
    const mockRelated = [
      {
        id: "related-1",
        title: "Similar Property in Westlands",
        image:
          // cspell:disable-next-line
          "/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg",
        price: 12000000,
        type: "apartment",
        location: "Westlands, Nairobi",
      },
      {
        id: "related-2",
        title: "Nearby Villa in Karen",
        // cspell:disable-next-line
        image: "/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg",
        price: 38000000,
        type: "house",
        location: "Karen, Nairobi",
      },
      {
        id: "related-3",
        title: "Modern Apartment Complex",
        image:
          "/assets/Residential/frames-for-your-heart-2d4lAQAlbDA-unsplash.jpg",
        price: 18000000,
        type: "apartment",
        location: "Kilimani, Nairobi",
      },
      {
        id: "related-4",
        title: "Executive Townhouse",
        image:
          // cspell:disable-next-line
          "/assets/Residential/etienne-beauregard-riverin-B0aCvAVSX8E-unsplash.jpg",
        price: 25000000,
        type: "house",
        // cspell:disable-next-line - Lavington is a real location in Nairobi
        location: "Lavington, Nairobi",
      },
      {
        id: "related-5",
        title: "Luxury Penthouse",
        image: "/assets/Commercial/ash-lab-ka4HDVIti78-unsplash.jpg",
        price: 55000000,
        type: "apartment",
        location: "Westlands, Nairobi",
      },
    ];

    // Filter out current property and return related ones
    return mockRelated.filter((prop) => prop.id !== currentPropertyId);
  }, [currentPropertyId]);

  const itemsPerSlide = 3;
  const totalSlides = Math.ceil(relatedProperties.length / itemsPerSlide);

  const handleSlideChange = useCallback((newSlide: number) => {
    setCurrentSlide(newSlide);
    setIsAutoPlaying(false); // Stop auto-play when user manually navigates
  }, []);

  const handlePrevSlide = useCallback(() => {
    const newSlide = currentSlide > 0 ? currentSlide - 1 : totalSlides - 1;
    handleSlideChange(newSlide);
  }, [currentSlide, totalSlides, handleSlideChange]);

  const handleNextSlide = useCallback(() => {
    const newSlide = currentSlide < totalSlides - 1 ? currentSlide + 1 : 0;
    handleSlideChange(newSlide);
  }, [currentSlide, totalSlides, handleSlideChange]);

  const handlePropertyClick = useCallback(
    (propertyId: string) => {
      navigate(`/property/${propertyId}`);
    },
    [navigate]
  );

  // Auto-play functionality
  React.useEffect(() => {
    if (!isAutoPlaying || totalSlides <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalSlides]);

  if (relatedProperties.length === 0) {
    return null;
  }

  const currentSlideProperties = relatedProperties.slice(
    currentSlide * itemsPerSlide,
    (currentSlide + 1) * itemsPerSlide
  );

  return (
    <div className="mt-8">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Related Properties
          </h3>

          {totalSlides > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label={
                  isAutoPlaying ? "Pause slideshow" : "Play slideshow"
                }
                title={isAutoPlaying ? "Pause" : "Play"}
              >
                {isAutoPlaying ?
                  <Pause className="w-4 h-4" />
                : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={handlePrevSlide}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label="Previous slide"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500">
                {currentSlide + 1} / {totalSlides}
              </span>
              <button
                onClick={handleNextSlide}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label="Next slide"
              >
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          )}
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {currentSlideProperties.map((property) => (
            <div
              key={property.id}
              onClick={() => handlePropertyClick(property.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handlePropertyClick(property.id);
                }
              }}
              role="button"
              tabIndex={0}
              className="group cursor-pointer bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-primary/50"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                  {property.type}
                </div>
              </div>

              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-1 group-hover:text-primary transition-colors">
                  {property.title}
                </h4>
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {property.location}
                </p>
                <p className="text-lg font-bold text-primary">
                  {formatPrice(property.price)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Slide indicators */}
        {totalSlides > 1 && (
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => handleSlideChange(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? "bg-primary" : "bg-gray-300"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// Helper function to render error states
const renderErrorState = (
  propertyId: string,
  error: Error | null,
  handleBack: () => void
) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Card className="p-8 text-center max-w-md">
      <CardContent>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {!propertyId ? "Property Not Found" : "Error Loading Property"}
        </h2>
        <p className="text-muted-foreground mb-4">
          {!propertyId ?
            "No property ID was provided in the URL."
          : "Failed to load property details. Please try again."}
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={handleBack} variant="outline">
            Go Back
          </Button>
          {error && (
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Helper function to render loading state
const renderLoadingState = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8">
      <PropertyDetailsSkeleton />
    </div>
  </div>
);

// Helper function to create share data
const createShareData = (
  property: Pick<Property, "title" | "description">
): ShareData => {
  const shareData: ShareData = {
    title: property.title || "Property Details",
    url: window.location.href,
  };

  if (property.description) {
    shareData.text = property.description;
  }

  return shareData;
};

// Helper function to get badge variant for verification status
const getVerificationBadgeVariant = (
  status: string
): "default" | "secondary" | "destructive" => {
  if (status === "verified") return "default";
  if (status === "pending") return "secondary";
  return "destructive";
};

// Helper function to render property features header
const renderPropertyFeaturesHeader = (
  isLandProperty: boolean,
  landFeatures: LandFeatures | undefined,
  normalizedProperty: any
) => {
  if (isLandProperty && landFeatures) {
    return (
      <>
        {landFeatures.size && (
          <div className="flex items-center gap-1">
            <Square className="w-4 h-4" />
            <span>{landFeatures.size}</span>
          </div>
        )}
        {landFeatures.landUse && (
          <div className="flex items-center gap-1">
            <TreePine className="w-4 h-4" />
            <span className="capitalize">{landFeatures.landUse}</span>
          </div>
        )}
        {landFeatures.waterAccess && (
          <div className="flex items-center gap-1">
            <Droplets className="w-4 h-4" />
            <span>Water Access</span>
          </div>
        )}
        {landFeatures.electricity && (
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span>Electricity</span>
          </div>
        )}
      </>
    );
  }

  // Regular property features
  return (
    <>
      {normalizedProperty.type === "residential" &&
        normalizedProperty.features && (
          <>
            {normalizedProperty.features.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span>{normalizedProperty.features.bedrooms} Bedrooms</span>
              </div>
            )}
            {normalizedProperty.features.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span>{normalizedProperty.features.bathrooms} Bathrooms</span>
              </div>
            )}
          </>
        )}
      {normalizedProperty.features?.area && (
        <div className="flex items-center gap-1">
          <Square className="w-4 h-4" />
          <span>
            {typeof normalizedProperty.features.area === "number" ?
              normalizedProperty.features.area.toLocaleString()
            : String(normalizedProperty.features.area)}{" "}
            {normalizedProperty.type === "land" ? "acres" : "sqm"}
          </span>
        </div>
      )}
    </>
  );
};

// Helper function to handle share functionality
const handleShareAction = async (
  property: Pick<Property, "title" | "description">
) => {
  if (navigator.share && property) {
    try {
      const shareData = createShareData(property);
      await navigator.share(shareData);
    } catch (error) {
      // Handle share cancellation or errors
      if (
        error instanceof Error &&
        error.name !== "AbortError" &&
        process.env.NODE_ENV === "development"
      ) {
        console.error("Share failed:", error);
      }
    }
  } else {
    // Fallback to clipboard
    navigator.clipboard.writeText(window.location.href);
    // Show toast notification when toast system is implemented
  }
};

// Helper function to normalize property data
const useNormalizedProperty = (property: Property | null) => {
  return useMemo(() => {
    if (!property) return null;

    // Determine property type based on available data
    const propertyType =
      typeof property.features?.propertyType === "string" ?
        property.features.propertyType.toLowerCase()
      : "residential";

    const type =
      ["commercial", "land"].includes(propertyType) ?
        (propertyType as "commercial" | "residential")
      : "residential";

    return normalizeProperty(property, type);
  }, [property]);
};

/**
 * Migrated PropertyDetails page using shared architecture
 * This version uses shared components and utilities for consistency
 */
export default function PropertyDetails({
  id,
}: PropertyDetailsProps): React.ReactElement {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const propertyId = id || params.id || "";

  // State for interactions
  const [isFavorited, setIsFavorited] = useState(false);

  // Use property hook for data fetching
  const { data: property, isLoading, error } = useSafePropertyQuery(propertyId);

  // Debug logging
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("PropertyDetails Debug:", {
      propertyId,
      isLoading,
      error: error?.message,
      hasProperty: !!property,
      propertyData: property,
    });
  }

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(() => {
    setIsFavorited((prev) => !prev);
    // Implement favorite API call when backend is ready
  }, []);

  // Handle share functionality
  const handleShare = useCallback(
    () => property && handleShareAction(property),
    [property]
  );

  // Normalize property data for consistent rendering
  const normalizedProperty = useNormalizedProperty(property);

  // Detect if this is a land property
  const isLandProperty = useMemo(() => {
    const landProperty = property as PropertyWithLandFeatures;
    return (
      property?.type === "land" ||
      property?.propertyType === "land" ||
      landProperty?.landFeatures !== undefined
    );
  }, [property]);

  // Get land-specific features if available
  const landFeatures = useMemo(() => {
    return (property as PropertyWithLandFeatures)?.landFeatures;
  }, [property]);

  // Get land verification data if available
  const landVerification = useMemo(() => {
    return (property as PropertyWithLandFeatures)?.verification;
  }, [property]);

  // Early returns for different states
  if (isLoading) return renderLoadingState();
  if (error || !propertyId)
    return renderErrorState(propertyId, error, handleBack);
  if (!normalizedProperty) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CardContent>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Property Not Available
            </h2>
            <p className="text-muted-foreground mb-4">
              This property is no longer available or has been removed.
            </p>
            <Button onClick={handleBack} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const galleryImages = convertToGalleryImages(
    normalizedProperty.images || [],
    normalizedProperty.title
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header with navigation */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavoriteToggle}
                className={`flex items-center gap-2 ${isFavorited ? "text-red-500" : ""}`}
              >
                <Heart
                  className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`}
                />
                {isFavorited ? "Favorited" : "Favorite"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Property Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {normalizedProperty.title}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                <span>
                  {typeof normalizedProperty.location === "string" ?
                    normalizedProperty.location
                  : (normalizedProperty.location as { address?: string })
                      ?.address || `Location ${NOT_SPECIFIED.toLowerCase()}`
                  }
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-2">
                {formatPrice(
                  typeof normalizedProperty.price === "number" ?
                    normalizedProperty.price
                  : parseFloat(String(normalizedProperty.price)) || 0
                )}
              </div>
              {normalizedProperty.verificationStatus === "verified" && (
                <Badge className="bg-green-100 text-green-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>

          {/* Property Features */}
          <div className="flex flex-wrap gap-4 text-sm">
            {renderPropertyFeaturesHeader(
              isLandProperty,
              landFeatures,
              normalizedProperty
            )}

            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                Listed {formatDate(normalizedProperty.createdAt || new Date())}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Image Gallery with Expanded View */}
        <div className="mb-8">
          <PropertyImageGallery
            images={galleryImages}
            propertyTitle={normalizedProperty.title}
          />

          {/* Related Properties Carousel */}
          <RelatedPropertiesCarousel
            currentPropertyId={String(normalizedProperty.id)}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {normalizedProperty.description}
                </p>
              </CardContent>
            </Card>

            {/* Features & Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {isLandProperty ? "Land Features" : "Features & Amenities"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {
                  isLandProperty && landFeatures ?
                    // Land-specific features
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Size:</span>
                          <span className="font-medium">
                            {landFeatures.size || NOT_SPECIFIED}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Soil Type:
                          </span>
                          <span className="font-medium">
                            {landFeatures.soilType || NOT_SPECIFIED}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Land Use:
                          </span>
                          <span className="font-medium capitalize">
                            {landFeatures.landUse || NOT_SPECIFIED}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Topography:
                          </span>
                          <span className="font-medium capitalize">
                            {landFeatures.topography || NOT_SPECIFIED}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Water Access:
                          </span>
                          <div className="flex items-center gap-1">
                            <Droplets className="h-4 w-4" />
                            <span className="font-medium">
                              {landFeatures.waterAccess ?
                                "Available"
                              : "Not Available"}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Road Access:
                          </span>
                          <div className="flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            <span className="font-medium">
                              {landFeatures.roadAccess ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Electricity:
                          </span>
                          <div className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            <span className="font-medium">
                              {landFeatures.electricity ?
                                "Available"
                              : "Not Available"}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Drainage:
                          </span>
                          <span className="font-medium capitalize">
                            {landFeatures.drainage || NOT_SPECIFIED}
                          </span>
                        </div>
                      </div>
                      {landFeatures.vegetation && (
                        <div className="col-span-full mt-4 pt-4 border-t">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Vegetation:
                            </span>
                            <span className="font-medium">
                              {landFeatures.vegetation}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    // Regular property features
                  : <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {normalizedProperty.features &&
                        Object.entries(normalizedProperty.features).map(
                          ([key, value]) => {
                            if (typeof value === "boolean" && value) {
                              return (
                                <div
                                  key={key}
                                  className="flex items-center gap-2"
                                >
                                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                                  <span className="text-sm capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          }
                        )}
                    </div>

                }
              </CardContent>
            </Card>

            {/* Land Verification Section (only for land properties) */}
            {isLandProperty && landVerification && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Land Verification Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Title Deed:
                        </span>
                        <Badge
                          variant={getVerificationBadgeVariant(
                            landVerification.titleDeedStatus
                          )}
                        >
                          {landVerification.titleDeedStatus}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Survey Status:
                        </span>
                        <Badge
                          variant={
                            landVerification.surveyStatus === "completed" ?
                              "default"
                            : "secondary"
                          }
                        >
                          {landVerification.surveyStatus}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Boundary Status:
                        </span>
                        <Badge
                          variant={
                            landVerification.boundaryStatus === "clear" ?
                              "default"
                            : "destructive"
                          }
                        >
                          {landVerification.boundaryStatus}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Land Rights:
                        </span>
                        <span className="font-medium capitalize">
                          {landVerification.landRights || NOT_SPECIFIED}
                        </span>
                      </div>
                      {landVerification.registrationNumber && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Registration #:
                          </span>
                          <span className="font-medium">
                            {landVerification.registrationNumber}
                          </span>
                        </div>
                      )}
                      {landVerification.lastSurveyDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Last Survey:
                          </span>
                          <span className="font-medium">
                            {formatDate(landVerification.lastSurveyDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {landVerification.encumbrances &&
                    landVerification.encumbrances.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-2">Encumbrances:</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {landVerification.encumbrances.map(
                            (encumbrance, index) => (
                              <li key={index}>{encumbrance}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Photo Management */}
            <Card>
              <CardHeader>
                <CardTitle>Property Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedPhotoManagementButton
                  propertyId={String(normalizedProperty.id)}
                  propertyType={
                    normalizedProperty.type as
                      | "residential"
                      | "commercial"
                      | "land"
                  }
                  photoCount={normalizedProperty.images?.length || 0}
                  maxPhotos={20}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Agent */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {normalizedProperty.owner ?
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {normalizedProperty.owner.name || "Unknown Agent"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Property Agent
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="w-full flex items-center gap-2"
                        onClick={() => {
                          /* Contact functionality to be implemented */
                        }}
                      >
                        <Phone className="w-4 h-4" />
                        Call Agent
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                : <div className="text-center text-muted-foreground">
                    <p>Contact information not available</p>
                  </div>
                }
              </CardContent>
            </Card>

            {/* Property Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Property Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Views</span>
                  <span className="font-medium">
                    {property?.viewCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trust Score</span>
                  <span className="font-medium">
                    {normalizedProperty.trustScore || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">
                    {normalizedProperty.status || "available"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {formatDate(normalizedProperty.updatedAt || new Date())}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Verification Status */}
            {normalizedProperty.verificationStatus === "verified" && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-400">
                        Verified Property
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        This property has been verified by TripleCheck
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export display name for debugging
PropertyDetails.displayName = "PropertyDetails";
