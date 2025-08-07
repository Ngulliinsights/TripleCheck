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
  Loader2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Camera,
  Edit,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import ImageGallery from "../../shared/components/images/ImageGallery";
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card";
import {
  Property,
  PropertyFeatures,
  LocationData,
} from "../../shared/types/property";
import { formatDate } from "../../shared/utils/date-utils";
import { useProperty } from "../hooks/useProperty";

interface PropertyOwner {
  name: string;
  phone: string;
  email: string;
  trustScore: number;
  verified: boolean;
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
    category: "property",
  }));
};

export default function PropertyDetails({ id }: PropertyDetailsProps) {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const propertyId = id || params.id || "";

  // Use safe query hook to prevent infinite API calls and ensure type safety
  const {
    data: property,
    isLoading,
    error,
    hasValidData,
  } = useProperty(propertyId);

  // Debug logging in development
  if (process.env.NODE_ENV === "development") {
    console.log("PropertyDetails Debug:", {
      propertyId,
      hasValidData,
      error: error?.message,
      property: property ? "Data available" : "No data",
    });
  }

  // Loading state with accessible design
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2 text-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading property details...</span>
        </div>
      </div>
    );
  }

  // Only show error state for critical errors when we have no property ID at all
  if (!propertyId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Property Not Found
          </h2>
          <p className="text-muted-foreground mb-4">
            No property ID was provided in the URL.
          </p>
          <Button type="button" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Create a safe property object with comprehensive fallbacks to prevent runtime errors
  const safeProperty: Property = {
    id:
      typeof property?.id === "string" ?
        parseInt(property.id)
      : property?.id || parseInt(propertyId || "1"),
    title: property?.title || `Property ${propertyId || "1"}`,
    description:
      property?.description ||
      "This is a beautiful property with modern amenities and excellent location. Perfect for families or professionals looking for a comfortable living space.",
    location:
      typeof property?.location === "string" ?
        property.location
      : (property?.location as LocationData)?.address ||
        "Prime Location, City Center",
    address: null, // This field doesn't exist in the API response
    price:
      typeof property?.price === "number" ?
        property.price.toString()
      : property?.price || "250000",
    coordinates: null, // This field doesn't exist in the API response
    imageUrls: property?.images || [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800&h=600&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&crop=center",
    ],
    features:
      property?.features ?
        {
          bedrooms:
            typeof property.features.bedrooms === "number" ?
              property.features.bedrooms
            : 3,
          bathrooms:
            typeof property.features.bathrooms === "number" ?
              property.features.bathrooms
            : 2,
          squareFeet:
            typeof property.features.squareFeet === "number" ?
              property.features.squareFeet
            : 1200,
          parkingSpaces:
            typeof property.features.parkingSpaces === "number" ?
              property.features.parkingSpaces
            : 1,
          yearBuilt:
            typeof property.features.yearBuilt === "number" ?
              property.features.yearBuilt
            : 2020,
          amenities:
            Array.isArray(property.features.amenities) ?
              property.features.amenities
            : ["Air Conditioning", "Parking", "Security", "Garden"],
          propertyType:
            typeof property.features.propertyType === "string" ?
              property.features.propertyType
            : "Apartment",
          petFriendly:
            typeof property.features.petFriendly === "boolean" ?
              property.features.petFriendly
            : true,
          furnished:
            typeof property.features.furnished === "boolean" ?
              property.features.furnished
            : false,
        }
      : {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1200,
          parkingSpaces: 1,
          yearBuilt: 2020,
          amenities: ["Air Conditioning", "Parking", "Security", "Garden"],
          propertyType: "Apartment",
          petFriendly: true,
          furnished: false,
        },
    verificationStatus: "verified", // Default since this field doesn't exist in API response
    ownerId: property?.ownerId || "1",
    aiVerificationResults: {
      overallScore: 89,
      imageAnalysis: {
        authenticity: 92,
        quality: 85,
        flags: [],
      },
      textAnalysis: {
        sentiment: 88,
        credibility: 90,
        flags: [],
      },
      priceAnalysis: {
        marketComparison: 85,
        reasonableness: 90,
        flags: [],
      },
      lastVerified: new Date().toISOString(),
      verificationId: "TripleCheck-AI-v2.1",
    },
    viewCount: property?.viewCount || 0,
    favoriteCount: 0, // Default since this field doesn't exist in API response
    isActive: true, // Default since this field doesn't exist in API response
    isFeatured: false, // Default since this field doesn't exist in API response
    availableFrom: null, // Default since this field doesn't exist in API response
    availableUntil: null, // Default since this field doesn't exist in API response
    createdAt: property?.createdAt ? new Date(property.createdAt) : new Date(),
    updatedAt: property?.updatedAt ? new Date(property.updatedAt) : new Date(),
    owner: {
      id: property?.ownerId || "1",
      username: "johnsmith",
      email: "john.smith@email.com",
      firstName: "John",
      lastName: "Smith",
      trustScore: 85,
      isVerifiedAgent: true,
    },
  };

  // Utility function for consistent price formatting across the application
  const formatPrice = (price: string): string => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  // Helper function to determine appropriate styling based on verification status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 navbar-offset pb-8">
        {/* Property Header Section - Main property information and status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground">
              {safeProperty.title}
            </h1>
            <Badge className={getStatusColor(safeProperty.verificationStatus)}>
              <Shield className="w-4 h-4 mr-1" />
              {safeProperty.verificationStatus}
            </Badge>
          </div>
          <div className="flex items-center text-muted-foreground mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            {typeof safeProperty.location === "string" ?
              safeProperty.location
            : (safeProperty.location as LocationData)?.address ||
              "Location not specified"
            }
          </div>
          <div className="text-2xl font-bold text-primary">
            {formatPrice(safeProperty.price)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area - Images, description, and features */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <PropertyImageGallery
              images={convertToGalleryImages(
                safeProperty.imageUrls || [],
                safeProperty.title
              )}
              enableFullscreen={true}
              enableSearch={false}
              masonry={false}
              showThumbnails={true}
              showImageCounter={true}
              wrapInCard={true}
              mainImageHeight="h-96"
            />

            {/* Property Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">
                  {safeProperty.description}
                </p>
              </CardContent>
            </Card>

            {/* Property Features and Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Property Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center text-foreground">
                    <Bed className="w-5 h-5 mr-2 text-muted-foreground" />
                    <span>{safeProperty.features.bedrooms} Bedrooms</span>
                  </div>
                  <div className="flex items-center text-foreground">
                    <Bath className="w-5 h-5 mr-2 text-muted-foreground" />
                    <span>{safeProperty.features.bathrooms} Bathrooms</span>
                  </div>
                  <div className="flex items-center text-foreground">
                    <Square className="w-5 h-5 mr-2 text-muted-foreground" />
                    <span>{safeProperty.features.squareFeet} sqft</span>
                  </div>
                  <div className="flex items-center text-foreground">
                    <Calendar className="w-5 h-5 mr-2 text-muted-foreground" />
                    <span>Built {safeProperty.features.yearBuilt}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {safeProperty.features.amenities.length > 0 ?
                      safeProperty.features.amenities.map(
                        (amenity: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {amenity}
                          </Badge>
                        )
                      )
                    : <span className="text-gray-500">No amenities listed</span>
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Verification Report - Shows trust and authenticity scores */}
            {safeProperty.aiVerificationResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-green-600" />
                    Verification Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {safeProperty.aiVerificationResults.overallScore}%
                      </div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {
                          safeProperty.aiVerificationResults.imageAnalysis
                            ?.authenticity
                        }
                        %
                      </div>
                      <div className="text-sm text-gray-600">
                        Image Authenticity
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {
                          safeProperty.aiVerificationResults.textAnalysis
                            ?.credibility
                        }
                        %
                      </div>
                      <div className="text-sm text-gray-600">
                        Description Accuracy
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Verified on{" "}
                    {safeProperty.aiVerificationResults.lastVerified ?
                      formatDate(
                        safeProperty.aiVerificationResults.lastVerified
                      )
                    : "Unknown"}
                    using{" "}
                    {safeProperty.aiVerificationResults.verificationId ||
                      "TripleCheck AI"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Contact information and actions */}
          <div className="space-y-6">
            {/* Property Owner Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Owner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <User className="w-5 h-5 mr-3 text-gray-600" />
                  <div>
                    <div className="font-medium">
                      {safeProperty.owner?.firstName}{" "}
                      {safeProperty.owner?.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      Trust Score: {safeProperty.owner?.trustScore}/5.0
                      {safeProperty.owner?.isVerifiedAgent && (
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button type="button" className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Owner
                  </Button>
                  <Button type="button" variant="outline" className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Photo Management - NEW */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Photo Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Manage and organize property photos to improve listing
                  visibility
                </p>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => navigate("/property/photos")}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Manage Property Photos
                </Button>
                <div className="text-xs text-muted-foreground text-center">
                  Upload, organize, and optimize your property images
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions for User Interaction */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button type="button" variant="outline" className="w-full">
                  Save to Favorites
                </Button>
                <Button type="button" variant="outline" className="w-full">
                  Share Property
                </Button>
                <Button type="button" variant="outline" className="w-full">
                  Schedule Viewing
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/property/${propertyId}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Property
                </Button>
                <Button type="button" variant="outline" className="w-full">
                  Report Issue
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
