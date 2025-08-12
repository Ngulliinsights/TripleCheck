import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Image as ImageIcon, AlertTriangle, Zap } from "lucide-react";
import { useState, useCallback } from "react";

import { PropertyImageVault, ImageGallery, IMAGE_COMPONENT_PRESETS } from "../../shared/components/images";
import type { BaseImage } from "../../shared/components/images";
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card";
import { useToast } from "../../shared/hooks/use-toast";
import { useSafePropertiesQuery } from "../../shared/hooks/useSafeQuery";
import type { PropertyImage as VaultImage } from "../../shared/types/images";

// Simplified upload mutation parameters
interface UploadMutationParams {
  readonly propertyId: string;
  readonly images: ReadonlyArray<VaultImage>;
}

// Enhanced Property interface to match expected structure
interface PropertyWithImages {
  id: string;
  title: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  price: number;
  imageUrls?: string[];
}

// Photography tips for user guidance
const PHOTO_TIPS = [
  {
    icon: <Camera className="w-5 h-5 text-blue-500" />,
    title: "Use Natural Light",
    description: "Take photos during the day with plenty of natural light for the best results",
  },
  {
    icon: <Camera className="w-5 h-5 text-green-500" />,
    title: "Show Space", 
    description: "Capture wide angles to show the full room and make spaces appear larger",
  },
  {
    icon: <Camera className="w-5 h-5 text-yellow-500" />,
    title: "Highlight Features",
    description: "Focus on unique selling points like views, fixtures, or architectural details",
  },
  {
    icon: <Camera className="w-5 h-5 text-purple-500" />,
    title: "Stage the Space",
    description: "Clean, declutter, and arrange furniture to make rooms look inviting",
  },
] as const;

export default function PropertyPhotosPage() {
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [images, setImages] = useState<VaultImage[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's properties
  const {
    data: properties,
    isLoading,
    error,
  } = useSafePropertiesQuery(undefined, {
    context: "property-photos",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Upload mutation for final submission
  const uploadMutation = useMutation({
    mutationFn: async ({ propertyId, images }: UploadMutationParams) => {
      // Mock API call - replace with actual implementation
      return new Promise<{ success: boolean; uploadedImages: VaultImage[] }>(
        (resolve, reject) => {
          const shouldFail = Math.random() < 0.1; // 10% failure rate for testing
          setTimeout(() => {
            if (shouldFail) {
              reject(new Error("Upload failed due to network error"));
            } else {
              resolve({ success: true, uploadedImages: images as VaultImage[] });
            }
          }, 2000);
        }
      );
    },
    onSuccess: (data) => {
      toast({
        title: "Photos uploaded successfully",
        description: `${data.uploadedImages.length} photos have been uploaded to your property`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setImages([]);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle final upload to property
  const handleUpload = useCallback(() => {
    if (!selectedProperty) {
      toast({
        title: "Select a property",
        description: "Please select a property to upload photos to",
        variant: "destructive",
      });
      return;
    }

    const uploadableImages = images.filter((img) => img.status === "uploaded");
    if (uploadableImages.length === 0) {
      toast({
        title: "No photos ready",
        description: "Please wait for photos to finish uploading or add new photos",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      propertyId: selectedProperty,
      images: uploadableImages,
    });
  }, [selectedProperty, images, uploadMutation, toast]);

  // Format location string helper
  const formatLocation = useCallback(
    (location: PropertyWithImages["location"]): string => {
      return `${location.address}, ${location.city}, ${location.state}, ${location.country}`;
    },
    []
  );

  // Convert property images to BaseImage format for ImageViewer
  const convertToBaseImages = useCallback((property: PropertyWithImages): BaseImage[] => {
    if (!property.imageUrls || property.imageUrls.length === 0) return [];
    
    return property.imageUrls.map((url, index) => ({
      id: `${property.id}-${index}`,
      src: url,
      alt: `${property.title} - Image ${index + 1}`,
      caption: index === 0 ? 'Main photo' : undefined
    }));
  }, []);

  // Render property selection
  const renderPropertySelection = useCallback((): React.ReactNode => {
    if (isLoading) {
      return (
        <div className="col-span-full text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading properties...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="col-span-full text-center py-8">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to load properties</h3>
          <p className="text-muted-foreground">There was an error loading your properties. Please try again.</p>
        </div>
      );
    }

    if (!properties || properties.length === 0) {
      return (
        <div className="col-span-full text-center py-8">
          <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No properties found</h3>
          <p className="text-muted-foreground">You need to list a property before you can upload photos.</p>
        </div>
      );
    }

    return properties.map((property: PropertyWithImages) => (
      <Card
        key={property.id}
        className={`cursor-pointer transition-all hover:shadow-md ${
          selectedProperty === property.id ? "ring-2 ring-primary" : ""
        }`}
        onClick={() => setSelectedProperty(property.id)}
      >
        <CardContent className="p-4">
          <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
            {property.imageUrls && property.imageUrls.length > 0 ? (
              <ImageGallery
                images={convertToBaseImages(property)}
                {...IMAGE_COMPONENT_PRESETS.SIMPLE_VIEWER}
                showThumbnails={false}
                allowNavigation={property.imageUrls.length > 1}
                enableFullscreen={true}
                showImageCounter={property.imageUrls.length > 1}
                className="h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          <h3 className="font-medium mb-1">{property.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {formatLocation(property.location)}
          </p>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-primary">
              KES {property.price.toLocaleString()}
            </span>
            <Badge variant={(property.imageUrls?.length || 0) > 0 ? "default" : "secondary"}>
              {property.imageUrls?.length || 0} photos
            </Badge>
          </div>
        </CardContent>
      </Card>
    ));
  }, [isLoading, error, properties, selectedProperty, formatLocation, convertToBaseImages]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Property Photo Management</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload high-quality photos to showcase your properties. Great photos
            can increase inquiries by up to 300% and help your listings stand
            out.
          </p>
        </div>

        {/* Property Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Property</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderPropertySelection()}
            </div>
          </CardContent>
        </Card>

        {selectedProperty && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upload Photos</CardTitle>
              {images.length > 0 && (
                <Button 
                  onClick={handleUpload} 
                  disabled={!images.some(img => img.status === "uploaded") || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Upload to Property
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <PropertyImageVault
                maxFileSize={10 * 1024 * 1024} // 10MB
                acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                maxFiles={20}
                allowReorder={true}
                allowAnnotation={true}
                allowPrimaryFlag={true}
                onChange={setImages}
                onError={(error) => {
                  toast({
                    title: "Upload Error",
                    description: error,
                    variant: "destructive",
                  });
                }}
                defaultDocumentType="property_photo"
                showWorkflowProgress={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Photography Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Photography Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PHOTO_TIPS.map((tip, index) => (
                <div key={index} className="flex items-start gap-3">
                  {tip.icon}
                  <div>
                    <h3 className="font-medium mb-1">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tip.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
