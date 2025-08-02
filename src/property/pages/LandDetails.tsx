import {
  MapPin,
  TreePine,
  Droplets,
  Shield,
  User,
  Phone,
  Mail,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card";
import { formatDate } from "../../shared/utils/date-utils";
import { useLandProperty } from "../hooks/useLandProperty";
import type { MockLandProperty } from "../services/mock-land-data";

// Constants
const NOT_SPECIFIED = "Not specified";

/**
 * Land Details Page
 *
 * Specialized page for displaying detailed information about land properties
 * Includes land-specific features like soil type, water access, land use, etc.
 * Integrates with Kenya land verification system
 */

// Define land-specific types
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



interface LandDetailsProps {
  readonly id?: string;
}

// Image Showcase Component
interface ImageShowcaseProps {
  images: string[];
  landTitle: string;
}

function ImageShowcase({ images, landTitle }: Readonly<ImageShowcaseProps>) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxImage(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const nextLightboxImage = () => {
    setLightboxImage((prev) => (prev + 1) % images.length);
  };

  const prevLightboxImage = () => {
    setLightboxImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  // Handle keyboard events for lightbox - moved before early return
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowLeft":
          prevLightboxImage();
          break;
        case "ArrowRight":
          nextLightboxImage();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, nextLightboxImage, prevLightboxImage]);

  if (!images || images.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
            <div className="text-center">
              <TreePine className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No images available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {/* Main Image Display */}
          <div className="relative">
            <div
              className="relative h-96 cursor-pointer group"
              onClick={() => openLightbox(selectedImage)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openLightbox(selectedImage);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View full size image ${selectedImage + 1} of ${images.length}`}
            >
              <img
                src={images[selectedImage] || ""}
                alt={`${landTitle} - View ${selectedImage + 1}`}
                className="w-full h-full object-cover rounded-t-lg transition-transform group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/assets/placeholder-land.jpg";
                }}
              />

              {/* Image Counter */}
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                {selectedImage + 1} / {images.length}
              </div>

              {/* Expand Icon */}
              <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="h-4 w-4" />
              </div>
            </div>

            {/* Navigation Arrows - moved outside clickable div */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
                  aria-label="Previous image"
                  title="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
                  aria-label="Next image"
                  title="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="p-4 bg-muted/30">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 relative ${
                        selectedImage === index ?
                          "ring-2 ring-primary ring-offset-2"
                        : "hover:ring-2 hover:ring-primary/50 hover:ring-offset-2"
                      } transition-all rounded-lg overflow-hidden`}
                    >
                      <img
                        src={image || ""}
                        alt={`${landTitle} - Thumbnail ${index + 1}`}
                        className="w-20 h-16 object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/assets/placeholder-land.jpg";
                        }}
                      />
                      {selectedImage === index && (
                        <div className="absolute inset-0 bg-primary/20" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <div
            className="absolute inset-0"
            onClick={closeLightbox}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                closeLightbox();
              } else if (e.key === "ArrowLeft") {
                prevLightboxImage();
              } else if (e.key === "ArrowRight") {
                nextLightboxImage();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close lightbox by clicking background"
          />
          <div className="relative max-w-7xl max-h-full z-10">
            {/* Close Button */}
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors"
              aria-label="Close lightbox"
              title="Close lightbox"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Main Lightbox Image */}
            <img
              src={images[lightboxImage] || ""}
              alt={`${landTitle} - Full view ${lightboxImage + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/assets/placeholder-land.jpg";
              }}
            />

            {/* Lightbox Navigation */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevLightboxImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-3 rounded-full hover:bg-black/90 transition-colors"
                  aria-label="Previous image in lightbox"
                  title="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={nextLightboxImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-3 rounded-full hover:bg-black/90 transition-colors"
                  aria-label="Next image in lightbox"
                  title="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Lightbox Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full">
              {lightboxImage + 1} of {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function LandDetails({ id }: LandDetailsProps) {
  const params = useParams<{ id: string }>();
  const landId = id || params.id || "";

  // Use the land-specific hook with mock data support
  const {
    data: land,
    isLoading,
    error,
    hasValidData,
  } = useLandProperty(landId);

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
            The land property you're looking for doesn't exist or has been
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

          {/* Image Showcase */}
          <ImageShowcase images={land.images || []} landTitle={land.title} />

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
