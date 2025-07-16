import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Property, PropertyFeatures } from "@shared/schema";
import VerificationBadge from "@/components/verification-badge";
import TrustScore from "@/components/trust-score";
import PropertyReviews from "@/components/property-reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  Car,
  Wifi,
  Shield,
  Heart,
  Share2,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  TrendingUp,
  FileText,
  Camera,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

interface PropertyPageProps {
  id: string;
}

interface VerificationReport {
  status: "verified" | "pending" | "failed";
  score: number;
  checks: {
    ownership: boolean;
    documents: boolean;
    location: boolean;
    pricing: boolean;
  };
  lastUpdated: string;
}

export default function PropertyPage({ id }: PropertyPageProps) {
  const [, setLocation] = useLocation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: property, isLoading: isLoadingProperty } = useQuery<Property>({
    queryKey: [`/api/properties/${id}`],
    enabled: !!id,
  });

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Mock verification report - in real app, this would come from API
  const verificationReport: VerificationReport = {
    status: "verified",
    score: 85,
    checks: {
      ownership: true,
      documents: true,
      location: true,
      pricing: false,
    },
    lastUpdated: "2024-01-15",
  };

  const favoriteMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/properties/${id}/favorite`),
    onSuccess: () => {
      toast({
        title: "Added to favorites",
        description: "Property saved to your favorites list",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${id}`] });
    },
  });

  const contactMutation = useMutation({
    mutationFn: (data: { message: string; phone?: string }) =>
      apiRequest("POST", `/api/properties/${id}/contact`, data),
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your inquiry has been sent to the property owner",
      });
      setShowContactDialog(false);
    },
  });

  const handleFavorite = useCallback(() => {
    if (!user) {
      setLocation("/auth/login");
      return;
    }
    favoriteMutation.mutate();
  }, [user, favoriteMutation, setLocation]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title,
          text: property?.description,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Property link copied to clipboard",
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Property link copied to clipboard",
      });
    }
  }, [property, toast]);

  const handleVerifyProperty = useCallback(() => {
    if (!user) {
      setLocation("/auth/login");
      return;
    }
    setLocation("/services/basic-checks");
  }, [user, setLocation]);

  if (isLoadingProperty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-96 w-full rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Property not found</h1>
          <p className="text-muted-foreground mb-6">
            The property you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  const features = property.features as PropertyFeatures;
  const amenities = features?.amenities || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Properties
        </Button>
        <span>/</span>
        <span>{property.location}</span>
        <span>/</span>
        <span className="text-foreground">{property.title}</span>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="lg:col-span-3">
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <img
              src={
                property.imageUrls[selectedImageIndex] || property.imageUrls[0]
              }
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <VerificationBadge status={property.verificationStatus} />
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={handleFavorite}>
                <Heart className="w-4 h-4" />
              </Button>
            </div>
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
              <Camera className="w-4 h-4 inline mr-1" />
              {selectedImageIndex + 1} / {property.imageUrls.length}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {property.imageUrls.slice(0, 4).map((url, index) => (
            <div
              key={index}
              className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                selectedImageIndex === index ? "border-primary" : (
                  "border-transparent"
                )
              }`}
              onClick={() => setSelectedImageIndex(index)}
            >
              <img
                src={url}
                alt={`${property.title} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {property.imageUrls.length > 4 && (
            <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-sm text-muted-foreground">
              +{property.imageUrls.length - 4} more
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Property Header */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{property.location}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-primary">
                    KES {property.price.toLocaleString()}
                  </span>
                  <TrustScore score={verificationReport.score} />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 mb-6">
              {features?.bedrooms && (
                <div className="flex items-center gap-1">
                  <Bed className="w-4 h-4 text-muted-foreground" />
                  <span>{features.bedrooms} beds</span>
                </div>
              )}
              {features?.bathrooms && (
                <div className="flex items-center gap-1">
                  <Bath className="w-4 h-4 text-muted-foreground" />
                  <span>{features.bathrooms} baths</span>
                </div>
              )}
              {features?.squareFeet && (
                <div className="flex items-center gap-1">
                  <Square className="w-4 h-4 text-muted-foreground" />
                  <span>{features.squareFeet.toLocaleString()} sq ft</span>
                </div>
              )}
              {features?.parkingSpaces && (
                <div className="flex items-center gap-1">
                  <Car className="w-4 h-4 text-muted-foreground" />
                  <span>{features.parkingSpaces} parking</span>
                </div>
              )}
              {features?.yearBuilt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Built {features.yearBuilt}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {property.description}
                  </p>
                </CardContent>
              </Card>

              {amenities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="font-medium mb-1">Property Type</p>
                      <p className="text-muted-foreground">
                        {features?.propertyType || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Bedrooms</p>
                      <p className="text-muted-foreground">
                        {features?.bedrooms || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Bathrooms</p>
                      <p className="text-muted-foreground">
                        {features?.bathrooms || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Square Feet</p>
                      <p className="text-muted-foreground">
                        {features?.squareFeet?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Year Built</p>
                      <p className="text-muted-foreground">
                        {features?.yearBuilt || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Parking Spaces</p>
                      <p className="text-muted-foreground">
                        {features?.parkingSpaces || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Pet Friendly</p>
                      <p className="text-muted-foreground">
                        {features?.petFriendly ? "Yes" : "No"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Furnished</p>
                      <p className="text-muted-foreground">
                        {features?.furnished ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verification" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Verification Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Overall Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${verificationReport.score}%` }}
                        />
                      </div>
                      <span className="font-medium">
                        {verificationReport.score}%
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {Object.entries(verificationReport.checks).map(
                      ([key, passed]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <span className="capitalize">
                            {key.replace(/([A-Z])/g, " $1")}
                          </span>
                          {passed ?
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          : <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          }
                        </div>
                      )
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Last updated: {verificationReport.lastUpdated}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVerificationDialog(true)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View Full Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <PropertyReviews propertyId={Number(id)} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Property Owner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                onClick={() => setShowContactDialog(true)}
                disabled={!user}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" className="w-full">
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
              {!user && (
                <p className="text-sm text-muted-foreground text-center">
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => setLocation("/auth/login")}
                  >
                    Login
                  </Button>{" "}
                  to contact property owner
                </p>
              )}
            </CardContent>
          </Card>

          {/* Verification Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Property Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleVerifyProperty}
              >
                <Shield className="w-4 h-4 mr-2" />
                Verify This Property
              </Button>
              <Button variant="outline" className="w-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                Market Analysis
              </Button>
              <Button variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Compare Similar
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Property Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Views</span>
                <span className="font-medium">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Favorites</span>
                <span className="font-medium">89</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Listed</span>
                <span className="font-medium">2 weeks ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price/sq ft</span>
                <span className="font-medium">
                  KES{" "}
                  {features?.squareFeet ?
                    Math.round(
                      property.price / features.squareFeet
                    ).toLocaleString()
                  : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Property Owner</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              contactMutation.mutate({
                message: formData.get("message") as string,
                phone: formData.get("phone") as string,
              });
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  name="message"
                  className="w-full mt-1 p-2 border rounded-md"
                  rows={4}
                  placeholder="I'm interested in this property..."
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Your Phone (Optional)
                </label>
                <input
                  name="phone"
                  type="tel"
                  className="w-full mt-1 p-2 border rounded-md"
                  placeholder="+254 700 000 000"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={contactMutation.isPending}
              >
                {contactMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Verification Report Dialog */}
      <Dialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Full Verification Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">
                  Property Verified
                </span>
              </div>
              <p className="text-green-700 text-sm">
                This property has passed our comprehensive verification process.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries(verificationReport.checks).map(
                ([key, passed]) => (
                  <div key={key} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {passed ?
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      : <Clock className="w-4 h-4 text-yellow-500" />}
                      <span className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {passed ?
                        "Verification completed"
                      : "Verification in progress"}
                    </p>
                  </div>
                )
              )}
            </div>

            <Button
              className="w-full"
              onClick={() => setLocation("/services/basic-checks")}
            >
              Request New Verification
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
