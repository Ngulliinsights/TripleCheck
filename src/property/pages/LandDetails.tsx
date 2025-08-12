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
} from "lucide-react";
import { useParams } from "react-router-dom";

import { ImageGallery } from "../../shared/components/images";
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

// Constants
const NOT_SPECIFIED = "Not specified";

/**
 * Land Details Page
 *
 * Specialized page for displaying detailed information about land properties
 * Includes land-specific features like soil type, water access, land use, etc.
 * Integrates with Kenya land verification system
 */

// Define land-specific types (used by the hook)
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

// Convert images to ImageGallery format for land properties
const convertToLandGalleryImages = (images: string[], title: string) => {
  return images.map((url, index) => ({
    id: `land-${index}`,
    src: url,
    alt: `${title} - View ${index + 1}`,
    category: 'land'
  }));
};

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
            The land property you&apos;re looking for doesn&apos;t exist or has been
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

          {/* Land Image Gallery */}
          <ImageGallery 
            images={convertToLandGalleryImages(land.images || [], land.title)}
            enableFullscreen={true}
            enableSearch={false}
            showImageCounter={true}
            wrapInCard={true}
          />

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
                Showcase your land with high-quality photos to attract serious buyers
              </p>
              <Button 
                type="button" 
                className="w-full"
                onClick={() => window.location.href = '/property/photos'}
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
