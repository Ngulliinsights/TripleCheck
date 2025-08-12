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
} from "lucide-react";
import React, { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Import shared components and utilities
import {
  PropertyDetailsSkeleton,
  EnhancedPhotoManagementButton,
  normalizeProperty,
} from "../../shared";
import { PropertyImageGallery } from "../../shared/components/images";
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card";
import { useProperty } from "../hooks/useProperty";

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

// Helper function to render error states
const renderErrorState = (
  propertyId: string,
  error: any,
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
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
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
  const { data: property, isLoading, error } = useProperty(propertyId);

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
  const handleShare = useCallback(async () => {
    if (navigator.share && property) {
      try {
        const shareData: ShareData = {
          title: property.title,
          url: window.location.href,
        };
        
        if (property.description) {
          shareData.text = property.description;
        }
        
        await navigator.share(shareData);
      } catch (error) {
        // Handle share cancellation or errors
        if (error instanceof Error && error.name !== 'AbortError') {
          console.warn('Share failed:', error.message);
        }
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification when toast system is implemented
    }
  }, [property]);

  // Normalize property data for consistent rendering
  const normalizedProperty = useMemo(() => {
    if (!property) return null;

    // Determine property type based on available data
    const propertyType = typeof property.features?.propertyType === 'string' 
      ? property.features.propertyType.toLowerCase() 
      : "residential";
    
    const type = ["commercial", "land"].includes(propertyType) 
      ? propertyType as "commercial" | "residential"
      : "residential";

    return normalizeProperty(property, type);
  }, [property]);

  // Format price utility
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  }, []);

  // Format date utility
  const formatDate = useCallback((date: string | Date): string => {
    return new Intl.DateTimeFormat("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  }, []);

  // Early returns for different states
  if (isLoading) return renderLoadingState();
  if (error || !propertyId) return renderErrorState(propertyId, error, handleBack);
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
                  {typeof normalizedProperty.location === 'string' 
                    ? normalizedProperty.location 
                    : normalizedProperty.location?.address || 'Location not specified'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-2">
                {formatPrice(typeof normalizedProperty.price === 'number' 
                  ? normalizedProperty.price 
                  : parseFloat(String(normalizedProperty.price)) || 0)}
              </div>
              {normalizedProperty.verificationStatus === 'verified' && (
                <Badge className="bg-green-100 text-green-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>

          {/* Property Features */}
          <div className="flex flex-wrap gap-4 text-sm">
            {normalizedProperty.type === "residential" && normalizedProperty.features && (
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
                    <span>
                      {normalizedProperty.features.bathrooms} Bathrooms
                    </span>
                  </div>
                )}
              </>
            )}

            {normalizedProperty.features?.area ? (
              <div className="flex items-center gap-1">
                <Square className="w-4 h-4" />
                <span>
                  {typeof normalizedProperty.features.area === 'number' 
                    ? normalizedProperty.features.area.toLocaleString()
                    : String(normalizedProperty.features.area)}{" "}
                  {normalizedProperty.type === "land" ? "acres" : "sqm"}
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                Listed {formatDate(normalizedProperty.createdAt || new Date())}
              </span>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-8">
          <PropertyImageGallery
            images={galleryImages}
            className="rounded-lg overflow-hidden"
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
                <CardTitle>Features & Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {normalizedProperty.features && Object.entries(normalizedProperty.features).map(
                    ([key, value]) => {
                      if (typeof value === "boolean" && value) {
                        return (
                          <div key={key} className="flex items-center gap-2">
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
              </CardContent>
            </Card>

            {/* Photo Management */}
            <Card>
              <CardHeader>
                <CardTitle>Property Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedPhotoManagementButton
                  propertyId={String(normalizedProperty.id)}
                  propertyType={normalizedProperty.type as "residential" | "commercial" | "land"}
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
                          {normalizedProperty.owner.firstName && normalizedProperty.owner.lastName 
                            ? `${normalizedProperty.owner.firstName} ${normalizedProperty.owner.lastName}`
                            : normalizedProperty.owner.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Property Agent
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="w-full flex items-center gap-2"
                        onClick={() => {/* Contact functionality to be implemented */}}
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
                    {normalizedProperty.status || 'available'}
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
            {normalizedProperty.verificationStatus === 'verified' && (
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
