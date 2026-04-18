import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Camera, Image as ImageIcon, AlertTriangle, Zap } from "lucide-react"
import { useState, useCallback } from "react"

import {
  PropertyImageVault,
  ImageGallery,
  IMAGE_COMPONENT_PRESETS,
} from "../../local/components/images"
import type { BaseImage } from "../../local/components/images"
import { Badge } from "../../local/components/ui/badge"
import { Button } from "../../local/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../local/components/ui/card"
import { useToast } from "../../local/hooks/use-toast"
import { useSafePropertiesQuery } from "../../local/hooks/useSafeQuery"
import type { PropertyImage as VaultImage } from "../../local/types/images"
import type { Property } from "@shared/types/property"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UploadMutationParams {
  readonly propertyId: string
  readonly images: ReadonlyArray<VaultImage>
}

// Use the unified Property interface
type PropertyWithImages = Property

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHOTO_TIPS = [
  {
    icon: <Camera className="w-5 h-5 text-blue-500" />,
    title: "Use Natural Light",
    description:
      "Take photos during the day with plenty of natural light for the best results",
  },
  {
    icon: <Camera className="w-5 h-5 text-green-500" />,
    title: "Show Space",
    description:
      "Capture wide angles to show the full room and make spaces appear larger",
  },
  {
    icon: <Camera className="w-5 h-5 text-yellow-500" />,
    title: "Highlight Features",
    description:
      "Focus on unique selling points like views, fixtures, or architectural details",
  },
  {
    icon: <Camera className="w-5 h-5 text-purple-500" />,
    title: "Stage the Space",
    description:
      "Clean, de-clutter, and arrange furniture to make rooms look inviting",
  },
] as const

// ---------------------------------------------------------------------------
// Upload function
// ---------------------------------------------------------------------------

/**
 * Calls the real upload API.
 *
 * TODO: replace the stub below with `apiClient.post('/api/properties/:id/images', ...)`
 * The dev-only simulation block is intentionally separated so it is easy to
 * delete once the endpoint is ready.
 */
async function uploadPropertyImages(
  propertyId: string,
  images: ReadonlyArray<VaultImage>
): Promise<{ success: boolean; uploadedImages: VaultImage[] }> {
  if (process.env.NODE_ENV === "development") {
    // Simulated network delay for local development only
    await new Promise(resolve => setTimeout(resolve, 1500))
    return { success: true, uploadedImages: images as VaultImage[] }
  }

  // Production: replace with actual API call
  const response = await fetch(`/api/properties/${propertyId}/images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images }),
  })
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }
  return response.json() as Promise<{
    success: boolean
    uploadedImages: VaultImage[]
  }>
}

// ---------------------------------------------------------------------------
// PropertyPhotosPage
// ---------------------------------------------------------------------------

export default function PropertyPhotosPage() {
  const [selectedProperty, setSelectedProperty] = useState<string>("")
  const [images, setImages] = useState<VaultImage[]>([])
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: properties,
    isLoading,
    error,
  } = useSafePropertiesQuery(undefined, {
    context: "property-photos",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const uploadMutation = useMutation({
    mutationFn: ({ propertyId, images }: UploadMutationParams) =>
      uploadPropertyImages(propertyId, images),
    onSuccess: data => {
      toast({
        title: "Photos uploaded successfully",
        description: `${data.uploadedImages.length} photos have been added to your property`,
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

  const handleUpload = useCallback(() => {
    if (!selectedProperty) {
      toast({
        title: "Select a property",
        description: "Please select a property to upload photos to",
        variant: "destructive",
      })
      return
    }

    const uploadableImages = images.filter(img => img.status === "uploaded")
    if (uploadableImages.length === 0) {
      toast({
        title: "No photos ready",
        description:
          "Please wait for photos to finish uploading or add new photos",
        variant: "destructive",
      })
      return
    }

    uploadMutation.mutate({ propertyId: selectedProperty, images: uploadableImages })
  }, [selectedProperty, images, uploadMutation, toast])

  const formatLocation = useCallback(
    (location: PropertyWithImages["location"]): string => {
      if (typeof location === "string") return location
      return `${location.address}, ${location.city}, ${location.state}, ${location.country}`
    },
    []
  )

  const convertToBaseImages = useCallback(
    (property: PropertyWithImages): BaseImage[] => {
      if (!property.imageUrls || property.imageUrls.length === 0) return []
      return property.imageUrls.map((url, index) => {
        const baseImage: BaseImage = {
          id: `${property.id}-${index}`,
          src: url,
          alt: `${property.title} - Image ${index + 1}`,
        }
        if (index === 0) baseImage.caption = "Main photo"
        return baseImage
      })
    },
    []
  )

  const renderPropertySelection = useCallback((): JSX.Element => {
    if (isLoading) {
      return (
        <div className="col-span-full text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading properties...</p>
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

    if (!properties || properties.length === 0) {
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

    return (
      <div className="contents">
        {properties.map(property => {
          const typed = property as PropertyWithImages
          return (
            <Card
              key={typed.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedProperty === typed.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedProperty(String(typed.id))}
            >
              <CardContent className="p-4">
                <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  {typed.imageUrls && typed.imageUrls.length > 0 ? (
                    <ImageGallery
                      images={convertToBaseImages(typed)}
                      {...IMAGE_COMPONENT_PRESETS.SIMPLE_VIEWER}
                      className="h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <h3 className="font-medium mb-1">{typed.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {formatLocation(typed.location)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">
                    KES {typed.price.toLocaleString()}
                  </span>
                  <Badge
                    variant={
                      (typed.imageUrls?.length || 0) > 0 ? "default" : "secondary"
                    }
                  >
                    {typed.imageUrls?.length || 0} photos
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }, [isLoading, error, properties, selectedProperty, formatLocation, convertToBaseImages])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Property Photo Management</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload high-quality photos to showcase your properties. Great photos
            can increase inquiries by up to 300% and help your listings stand out.
          </p>
        </div>

        {/* Property selection */}
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

        {/* Upload panel — only shown once a property is selected */}
        {selectedProperty && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upload Photos</CardTitle>
              {images.length > 0 && (
                <Button
                  onClick={handleUpload}
                  disabled={
                    !images.some(img => img.status === "uploaded") ||
                    uploadMutation.isPending
                  }
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
                maxFileSize={10 * 1024 * 1024}
                acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                maxFiles={20}
                allowReorder
                allowAnnotation
                allowPrimaryFlag
                onChange={setImages}
                onError={error => {
                  toast({
                    title: "Upload Error",
                    description: error,
                    variant: "destructive",
                  })
                }}
                defaultDocumentType="property_photo"
                showWorkflowProgress
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
  )
}