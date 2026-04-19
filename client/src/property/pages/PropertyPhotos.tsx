import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Camera, Image as ImageIcon, AlertTriangle, Zap } from "lucide-react"
import { useState, useCallback } from "react"

import { ImageGallery, IMAGE_COMPONENT_PRESETS } from "../../local/components/images"
import { PropertyImageVault } from "../components/images"
import type { BaseImage } from "../../local/components/images"
import { Badge } from "../../local/components/ui/badge"
import { Button } from "../../local/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../local/components/ui/card"
import { useToast } from "../../local/hooks/use-toast"
import { useSafePropertiesQuery } from "../../local/hooks/useSafeQuery"
import { apiClient } from "../../local/services/unified-api-client"
import type { PropertyImage as VaultImage } from "../../local/types/images"
import type { Property } from "@shared/types/property"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UploadResult {
  success: boolean
  uploadedImages: VaultImage[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHOTO_TIPS = [
  {
    icon: Camera,
    color: "text-blue-500",
    title: "Use Natural Light",
    description: "Take photos during the day with plenty of natural light for the best results.",
  },
  {
    icon: Camera,
    color: "text-green-500",
    title: "Show Space",
    description: "Capture wide angles to show the full room and make spaces appear larger.",
  },
  {
    icon: Camera,
    color: "text-yellow-500",
    title: "Highlight Features",
    description: "Focus on unique selling points like views, fixtures, or architectural details.",
  },
  {
    icon: Camera,
    color: "text-purple-500",
    title: "Stage the Space",
    description: "Clean, de-clutter, and arrange furniture to make rooms look inviting.",
  },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function uploadPropertyImages(
  propertyId: string,
  images: ReadonlyArray<VaultImage>
): Promise<UploadResult> {
  // Strip non-serializable fields before sending
  const payload = images.map(({ file: _f, preview: _p, chunks: _c, ...rest }) => rest)

  const response = await apiClient.post<UploadResult>(
    `/properties/${propertyId}/images`,
    { images: payload }
  )

  return response.data
}

function formatLocation(location: Property["location"]): string {
  if (typeof location === "string") return location
  return [location.address, location.city, location.state, location.country].join(", ")
}

function toBaseImages(property: Property): BaseImage[] {
  return (property.imageUrls ?? []).map((src, index) => ({
    id: `${property.id}-${index}`,
    src,
    alt: `${property.title} - Image ${index + 1}`,
    ...(index === 0 && { caption: "Main photo" }),
  }))
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PropertyGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  )
}

interface PropertyCardProps {
  property: Property
  isSelected: boolean
  onSelect: (id: string) => void
}

function PropertyCard({ property, isSelected, onSelect }: PropertyCardProps) {
  const baseImages = toBaseImages(property)
  const photoCount = property.imageUrls?.length ?? 0

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={() => onSelect(String(property.id))}
    >
      <CardContent className="p-4">
        <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
          {baseImages.length > 0 ? (
            <ImageGallery
              images={baseImages}
              {...IMAGE_COMPONENT_PRESETS.SIMPLE_VIEWER}
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
          <Badge variant={photoCount > 0 ? "default" : "secondary"}>
            {photoCount} photos
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// PropertyPhotosPage
// ---------------------------------------------------------------------------

export default function PropertyPhotosPage() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
  const [images, setImages] = useState<VaultImage[]>([])
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: properties, isLoading, error } = useSafePropertiesQuery(undefined, {
    context: "property-photos",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const uploadMutation = useMutation({
    mutationFn: ({ propertyId, images }: { propertyId: string; images: VaultImage[] }) =>
      uploadPropertyImages(propertyId, images),
    onSuccess: ({ uploadedImages }) => {
      toast({
        title: "Photos uploaded successfully",
        description: `${uploadedImages.length} photos have been added to your property.`,
      })
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] })
      setImages([])
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photos. Please try again.",
        variant: "destructive",
      })
    },
  })

  const uploadableImages = images.filter(img => img.status === "uploaded")

  const handleUpload = useCallback(() => {
    if (!selectedPropertyId) {
      toast({
        title: "Select a property",
        description: "Please select a property to upload photos to.",
        variant: "destructive",
      })
      return
    }

    if (uploadableImages.length === 0) {
      toast({
        title: "No photos ready",
        description: "Please wait for photos to finish processing or add new photos.",
        variant: "destructive",
      })
      return
    }

    uploadMutation.mutate({ propertyId: selectedPropertyId, images: uploadableImages })
  }, [selectedPropertyId, uploadableImages, uploadMutation, toast])

  const renderProperties = () => {
    if (isLoading) {
      return (
        <div className="col-span-full text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading properties…</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="col-span-full text-center py-8">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to load properties</h3>
          <p className="text-muted-foreground">
            There was an error loading your properties. Please try again.
          </p>
        </div>
      )
    }

    if (!properties?.length) {
      return (
        <div className="col-span-full text-center py-8">
          <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No properties found</h3>
          <p className="text-muted-foreground">
            You need to list a property before you can upload photos.
          </p>
        </div>
      )
    }

    return properties.map(property => (
      <PropertyCard
        key={property.id}
        property={property}
        isSelected={selectedPropertyId === String(property.id)}
        onSelect={setSelectedPropertyId}
      />
    ))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Property Photo Management</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload high-quality photos to showcase your properties. Great photos can
            increase inquiries by up to 300% and help your listings stand out.
          </p>
        </div>

        {/* Property selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Property</CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyGrid>{renderProperties()}</PropertyGrid>
          </CardContent>
        </Card>

        {/* Upload panel — shown only once a property is selected */}
        {selectedPropertyId && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upload Photos</CardTitle>
              {images.length > 0 && (
                <Button
                  onClick={handleUpload}
                  disabled={uploadableImages.length === 0 || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Uploading…
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
                maxFileSize={10 * 1024 * 1024}
                acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                maxFiles={20}
                allowReorder
                allowAnnotation
                allowPrimaryFlag
                defaultDocumentType="property_photo"
                showWorkflowProgress
                onChange={setImages}
                onError={message =>
                  toast({ title: "Upload Error", description: message, variant: "destructive" })
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Photography tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Photography Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PHOTO_TIPS.map(({ icon: Icon, color, title, description }) => (
                <div key={title} className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${color}`} />
                  <div>
                    <h3 className="font-medium mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}