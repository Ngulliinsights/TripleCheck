import {
  MapPin,
  TreePine,
  Droplets,
  Shield,
  User,
  Phone,
  Mail,
  FileCheck,
  Loader2,
  ZoomIn,
  X,
  ArrowLeft,
  Play,
  Pause,
} from "lucide-react"
import React, { useState, useCallback, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"

import { Badge } from "../../shared/components/ui/badge"
import { Button } from "../../shared/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card"
import { formatDate } from "../../shared/utils/date-utils"
import { formatPrice } from "../../shared/utils/formatters"
import { useUnifiedProperty } from "../hooks/useUnifiedProperty"

// Constants
const NOT_SPECIFIED = "Not specified";

/**
 * Land Details Page
 *
 * Specialized page for displaying detailed information about land properties
 * Includes land-specific features like soil type, water access, land use, etc.
 * Integrates with Kenya land verification system
 */

interface LandDetailsProps {
  readonly id?: string;
}

// Convert images to ImageGallery format for land properties
const convertToLandGalleryImages = (images: string[], title: string) => {
  return images.map((url, index) => ({
    id: `land-${index}`,
    src: url,
    alt: `${title} - View ${index + 1}`,
    category: "land",
  }));
};

// Enhanced Land Image Gallery Component
interface LandImageGalleryProps {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    category: string;
  }>;
  landTitle: string;
}

const LandImageGallery: React.FC<LandImageGalleryProps> = ({ images }) => {
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
        <div className="text-gray-400 text-4xl mb-2">🏞️</div>
        <p className="text-gray-500">No land images available</p>
      </Card>
    );
  }

  const selectedImage = images[selectedImageIndex];

  if (!selectedImage) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 text-4xl mb-2">🏞️</div>
        <p className="text-gray-500">No land images available</p>
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
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <TreePine className="w-4 h-4" />
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
                  "border-green-500 shadow-md"
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
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <TreePine className="w-4 h-4" />
              {selectedImageIndex + 1} of {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Related Lands Carousel Component
interface RelatedLandProperty {
  id: string;
  title: string;
  image: string;
  price: number;
  size: string;
  landUse: string;
  location: string;
}

interface RelatedLandsCarouselProps {
  currentLandId: string;
}

const RelatedLandsCarousel: React.FC<RelatedLandsCarouselProps> = ({
  currentLandId,
}) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Mock related lands data - replace with actual API call
  const relatedLands = useMemo(
    () =>
      [
        {
          id: "land-1",
          title: "Agricultural Land in Nakuru",
          image: "/assets/Land/agricultural-land-1.jpg",
          price: 5000000,
          size: "5 acres",
          landUse: "agricultural",
          location: "Nakuru County",
        },
        {
          id: "land-2",
          title: "Residential Plot in Kiambu",
          image: "/assets/Land/residential-plot-1.jpg",
          price: 8000000,
          size: "0.5 acres",
          landUse: "residential",
          location: "Kiambu County",
        },
        {
          id: "land-3",
          title: "Commercial Land in Mombasa",
          image: "/assets/Land/commercial-land-1.jpg",
          price: 15000000,
          size: "2 acres",
          landUse: "commercial",
          location: "Mombasa County",
        },
        {
          id: "land-4",
          title: "Mixed Use Land in Eldoret",
          image: "/assets/Land/mixed-use-land-1.jpg",
          price: 12000000,
          size: "3 acres",
          landUse: "mixed",
          location: "Uasin Gishu County",
        },
      ].filter((land) => land.id !== currentLandId),
    [currentLandId]
  );

  const itemsPerSlide = 3;
  const totalSlides = Math.ceil(relatedLands.length / itemsPerSlide);

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

  const handleLandClick = useCallback((landId: string) => {
    navigate(`/property/${landId}`);
  }, [navigate]);

  // Auto-play functionality
  React.useEffect(() => {
    if (!isAutoPlaying || totalSlides <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalSlides]);

  if (relatedLands.length === 0) {
    return null;
  }

  const currentSlideProperties = relatedLands.slice(
    currentSlide * itemsPerSlide,
    (currentSlide + 1) * itemsPerSlide
  );

  return (
    <div className="mt-8">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TreePine className="w-5 h-5 text-green-600" />
              Related Land Properties
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Similar land properties you might be interested in
            </p>
          </div>

          {totalSlides > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="p-2 rounded-full bg-green-50 hover:bg-green-100 transition-colors"
                aria-label={
                  isAutoPlaying ? "Pause slideshow" : "Play slideshow"
                }
                title={isAutoPlaying ? "Pause" : "Play"}
              >
                {isAutoPlaying ?
                  <Pause className="w-4 h-4 text-green-600" />
                : <Play className="w-4 h-4 text-green-600" />}
              </button>
              <button
                onClick={handlePrevSlide}
                className="p-2 rounded-full bg-green-50 hover:bg-green-100 transition-colors"
                aria-label="Previous slide"
              >
                <ArrowLeft className="w-4 h-4 text-green-600" />
              </button>
              <span className="text-sm text-gray-500">
                {currentSlide + 1} / {totalSlides}
              </span>
              <button
                onClick={handleNextSlide}
                className="p-2 rounded-full bg-green-50 hover:bg-green-100 transition-colors"
                aria-label="Next slide"
              >
                <ArrowLeft className="w-4 h-4 rotate-180 text-green-600" />
              </button>
            </div>
          )}
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {currentSlideProperties.map((land: RelatedLandProperty) => (
            <div
              key={land.id}
              onClick={() => handleLandClick(land.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleLandClick(land.id);
                }
              }}
              role="button"
              tabIndex={0}
              className="group cursor-pointer bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-green-500/50"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={land.image}
                  alt={land.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                <div className="absolute top-2 right-2 bg-green-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <TreePine className="w-3 h-3" />
                  {land.size}
                </div>
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium capitalize">
                  {land.landUse}
                </div>
              </div>

              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                  {land.title}
                </h4>
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {land.location}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-green-600">
                    {formatPrice(land.price)}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Droplets className="w-3 h-3" />
                    <span>Water access</span>
                  </div>
                </div>
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
                  index === currentSlide ? "bg-green-600" : "bg-gray-300"
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

export default function LandDetails({ id }: LandDetailsProps) {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const landId = id || params.id || "";

  // Use the unified property hook for land properties
  const { useLandProperty } = useUnifiedProperty();
  const { data: land, isLoading, error } = useLandProperty(landId);

  const hasValidData = Boolean(land);

  // Loading state with accessible design
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading land details...</span>
        </div>
      </div>
    );
  }

  // Error state with helpful messaging and navigation
  if (error || !hasValidData || !land) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Land Property Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The land property you&apos;re looking for does not exist or has been
            removed.
          </p>
          <Button type="button" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Utility functions for consistent styling and formatting
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getVerificationBadge = (status: string) => {
    const variants = {
      verified: "default",
      pending: "secondary",
      unverified: "outline",
      flagged: "destructive",
    } as const;

    return variants[status as keyof typeof variants] || "outline";
  };

  const getRiskBadge = (level: string) => {
    const variants = {
      low: "default",
      medium: "secondary",
      high: "destructive",
    } as const;

    return variants[level as keyof typeof variants] || "outline";
  };

  return (
    <div className="container mx-auto px-4 navbar-offset pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{land.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>
                  {land.location.address}, {land.location.city}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getVerificationBadge(land.verificationStatus)}>
                  <Shield className="h-3 w-3 mr-1" />
                  {land.verificationStatus}
                </Badge>
                <Badge variant={getRiskBadge(land.riskLevel)}>
                  Risk: {land.riskLevel}
                </Badge>
              </div>
            </div>
          </div>

          {/* Enhanced Land Image Gallery */}
          <LandImageGallery
            images={convertToLandGalleryImages(land.images || [], land.title)}
            landTitle={land.title}
          />

          {/* Related Lands Carousel */}
          <RelatedLandsCarousel currentLandId={String(land.id)} />

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {land.description}
              </p>
            </CardContent>
          </Card>

          {/* Land Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5" />
                Land Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-medium">
                      {land.landFeatures?.size || NOT_SPECIFIED}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Soil Type:</span>
                    <span className="font-medium">
                      {land.landFeatures?.soilType || NOT_SPECIFIED}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Land Use:</span>
                    <span className="font-medium capitalize">
                      {land.landFeatures?.landUse || NOT_SPECIFIED}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Topography:</span>
                    <span className="font-medium capitalize">
                      {land.landFeatures?.topography || NOT_SPECIFIED}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Water Access:</span>
                    <div className="flex items-center gap-1">
                      <Droplets className="h-4 w-4" />
                      <span className="font-medium">
                        {land.landFeatures?.waterAccess ?
                          "Available"
                        : "Not Available"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Road Access:</span>
                    <span className="font-medium">
                      {land.landFeatures?.roadAccess ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Electricity:</span>
                    <span className="font-medium">
                      {land.landFeatures?.electricity ?
                        "Available"
                      : "Not Available"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Drainage:</span>
                    <span className="font-medium capitalize">
                      {land.landFeatures?.drainage || NOT_SPECIFIED}
                    </span>
                  </div>
                </div>
              </div>

              {land.landFeatures?.vegetation && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vegetation:</span>
                    <span className="font-medium">
                      {land.landFeatures.vegetation}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Land Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Land Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title Deed:</span>
                    <Badge
                      variant={getVerificationBadge(
                        land.verification?.titleDeedStatus || "unverified"
                      )}
                    >
                      {land.verification?.titleDeedStatus || "unverified"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Survey Status:
                    </span>
                    <Badge
                      variant={
                        land.verification?.surveyStatus === "completed" ?
                          "default"
                        : "secondary"
                      }
                    >
                      {land.verification?.surveyStatus || "pending"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Boundary Status:
                    </span>
                    <Badge
                      variant={
                        land.verification?.boundaryStatus === "clear" ?
                          "default"
                        : "destructive"
                      }
                    >
                      {land.verification?.boundaryStatus || "unmarked"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Land Rights:</span>
                    <span className="font-medium capitalize">
                      {land.verification?.landRights || NOT_SPECIFIED}
                    </span>
                  </div>
                  {land.verification?.registrationNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Registration #:
                      </span>
                      <span className="font-medium">
                        {land.verification.registrationNumber}
                      </span>
                    </div>
                  )}
                  {land.verification?.lastSurveyDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Last Survey:
                      </span>
                      <span className="font-medium">
                        {formatDate(land.verification.lastSurveyDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {land.verification?.encumbrances &&
                land.verification.encumbrances.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2">Encumbrances:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {land.verification.encumbrances.map(
                        (encumbrance, index) => (
                          <li key={index}>{encumbrance}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price & Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-4">
                {formatPrice(land.price)}
              </div>
              <div className="space-y-3">
                <Button type="button" className="w-full" size="lg">
                  Contact Owner
                </Button>
                <Button type="button" variant="outline" className="w-full">
                  Schedule Viewing
                </Button>
                <Button type="button" variant="outline" className="w-full">
                  Request Verification
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trust Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Trust Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div
                  className={`text-4xl font-bold ${getTrustScoreColor(land.trustScore)}`}
                >
                  {land.trustScore}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Based on verification status, owner reputation, and community
                  feedback
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium">{land.owner.name}</div>
                {land.owner.verified && (
                  <Badge variant="default" className="mt-1">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Owner
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  <span>{land.owner.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  <span>{land.owner.email}</span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Owner Trust Score:
                  </span>
                  <span
                    className={`font-medium ${getTrustScoreColor(land.owner.trustScore)}`}
                  >
                    {land.owner.trustScore}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Land Photo Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="w-5 h-5" />
                Land Photo Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Showcase your land with high-quality photos to attract serious
                buyers
              </p>
              <Button
                type="button"
                className="w-full"
                onClick={() => navigate("/property/photos")}
              >
                <TreePine className="w-4 h-4 mr-2" />
                Manage Land Photos
              </Button>
              <div className="text-xs text-muted-foreground text-center">
                Upload aerial views, boundary markers, and land features
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Listed:</span>
                <span>{formatDate(land.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated:</span>
                <span>{formatDate(land.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property ID:</span>
                <span className="font-mono">{land.id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
