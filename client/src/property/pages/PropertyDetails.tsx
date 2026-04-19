import {
  ArrowLeft,
  Bath,
  Bed,
  Calendar,
  Car,
  Droplets,
  Heart,
  Mail,
  MapPin,
  Phone,
  Share2,
  Shield,
  Square,
  TreePine,
  User,
  Zap,
} from "lucide-react"
import React, { useCallback, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { normalizeProperty } from "../utils/normalizeProperty"
import { EnhancedPhotoManagementButton } from "../components/PhotoManagementButton"
import { Badge } from "../../local/components/ui/badge"
import { Button } from "../../local/components/ui/button"
import { EnhancedImageShowcase } from "../../local/components/images/ImageShowcase"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../local/components/ui/card"
import { useSafePropertyQuery } from "../../local/hooks/useSafeQuery"
import { Property } from "@shared/types/property"
// Canonical location for both helpers
import { formatDate, formatPrice } from "../../local/utils/formatters"
import { PropertyErrorState, PropertyLoadingState } from "../components/shared/components"
import {
  LandFeaturesSection,
  LandVerificationSection,
} from "../components/shared/LandSections"
import type { LandFeatures, LandVerificationData } from "../components/shared/LandSections"
import {
  convertToGalleryImages,
  getVerificationBadgeVariant,
  getTrustScoreColor,
  NOT_SPECIFIED,
} from "../utils/ui-utils"
import { CarouselShell, useCarousel } from "../components/shared/CarouselShell"
import type { GalleryImage } from "../../local/components/images/gallery/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Augments the shared Property with optional land-specific fields. */
interface PropertyWithLandFeatures extends Property {
  landFeatures?: LandFeatures
  verification?: LandVerificationData
}

interface PropertyDetailsProps {
  readonly id?: string
}

interface RelatedProperty {
  id: string
  title: string
  image: string
  price: number
  type: string
  location: string
}

// ---------------------------------------------------------------------------
// Module-level helpers (stable, never recreated)
// ---------------------------------------------------------------------------

function createShareData(
  property: Pick<Property, "title" | "description">
): ShareData {
  const data: ShareData = {
    title: property.title || "Property Details",
    url: window.location.href,
  }
  if (property.description) data.text = property.description
  return data
}

async function shareProperty(
  property: Pick<Property, "title" | "description">
): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share(createShareData(property))
    } catch (error) {
      if (
        error instanceof Error &&
        error.name !== "AbortError" &&
        process.env.NODE_ENV === "development"
      ) {
        console.error("Share failed:", error)
      }
    }
  } else {
    navigator.clipboard.writeText(window.location.href)
  }
}

// ---------------------------------------------------------------------------
// Mock data — TODO: replace with a useRelatedProperties(id) API hook
// ---------------------------------------------------------------------------

const RELATED_PROPERTIES: RelatedProperty[] = [
  {
    id: "related-1",
    title: "Similar Property in Westlands",
    // cspell:disable-next-line
    image: "/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg",
    price: 12_000_000,
    type: "apartment",
    location: "Westlands, Nairobi",
  },
  {
    id: "related-2",
    title: "Nearby Villa in Karen",
    // cspell:disable-next-line
    image: "/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg",
    price: 38_000_000,
    type: "house",
    location: "Karen, Nairobi",
  },
  {
    id: "related-3",
    title: "Modern Apartment Complex",
    image: "/assets/Residential/frames-for-your-heart-2d4lAQAlbDA-unsplash.jpg",
    price: 18_000_000,
    type: "apartment",
    location: "Kilimani, Nairobi",
  },
  {
    id: "related-4",
    title: "Executive Townhouse",
    // cspell:disable-next-line
    image: "/assets/Residential/etienne-beauregard-riverin-B0aCvAVSX8E-unsplash.jpg",
    price: 25_000_000,
    type: "house",
    // cspell:disable-next-line
    location: "Lavington, Nairobi",
  },
  {
    id: "related-5",
    title: "Luxury Penthouse",
    image: "/assets/Commercial/ash-lab-ka4HDVIti78-unsplash.jpg",
    price: 55_000_000,
    type: "apartment",
    location: "Westlands, Nairobi",
  },
]

// ---------------------------------------------------------------------------
// RelatedPropertiesCarousel
// ---------------------------------------------------------------------------

interface RelatedPropertiesCarouselProps {
  currentPropertyId: string
}

const RelatedPropertiesCarousel: React.FC<RelatedPropertiesCarouselProps> = ({
  currentPropertyId,
}) => {
  const navigate = useNavigate()

  const relatedProperties = useMemo(
    () => RELATED_PROPERTIES.filter(p => p.id !== currentPropertyId),
    [currentPropertyId]
  )

  const {
    currentSlide,
    totalSlides,
    isAutoPlaying,
    currentSliceRange,
    handlePrev,
    handleNext,
    handleSlideChange,
    setIsAutoPlaying,
  } = useCarousel({ totalItems: relatedProperties.length, autoPlayInterval: 4000 })

  const handlePropertyClick = useCallback(
    (propertyId: string) => navigate(`/property/${propertyId}`),
    [navigate]
  )

  if (relatedProperties.length === 0) return null

  const visibleProperties = relatedProperties.slice(...currentSliceRange)

  return (
    <CarouselShell
      title={<><Heart className="w-5 h-5 text-primary" /> Related Properties</>}
      totalSlides={totalSlides}
      currentSlide={currentSlide}
      isAutoPlaying={isAutoPlaying}
      onSlideChange={handleSlideChange}
      onPrev={handlePrev}
      onNext={handleNext}
      onToggleAutoPlay={() => setIsAutoPlaying((prev: boolean) => !prev)}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      activeDotClass="bg-primary"
      navButtonClass="bg-gray-100 hover:bg-gray-200"
    >
      {visibleProperties.map(property => (
        <div
          key={property.id}
          onClick={() => handlePropertyClick(property.id)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              handlePropertyClick(property.id)
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
    </CarouselShell>
  )
}

// ---------------------------------------------------------------------------
// PropertyFeaturesHeader — inline summary chips shown above the gallery
// ---------------------------------------------------------------------------

function PropertyFeaturesHeader({
  isLandProperty,
  landFeatures,
  normalizedProperty,
}: {
  isLandProperty: boolean
  landFeatures: LandFeatures | undefined
  normalizedProperty: ReturnType<typeof normalizeProperty>
}) {
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
    )
  }

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
            {typeof normalizedProperty.features.area === "number"
              ? normalizedProperty.features.area.toLocaleString()
              : String(normalizedProperty.features.area)}{" "}
            {normalizedProperty.type === "land" ? "acres" : "sqm"}
          </span>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Custom hook
// ---------------------------------------------------------------------------

function useNormalizedProperty(property: Property | null) {
  return useMemo(() => {
    if (!property) return null
    const propertyType =
      typeof property.features?.propertyType === "string"
        ? property.features.propertyType.toLowerCase()
        : "residential"
    const type =
      ["commercial", "land"].includes(propertyType)
        ? (propertyType as "commercial" | "residential")
        : "residential"
    return normalizeProperty(property, type)
  }, [property])
}

// ---------------------------------------------------------------------------
// PropertyDetails
// ---------------------------------------------------------------------------

export default function PropertyDetails({
  id,
}: PropertyDetailsProps): React.ReactElement {
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()
  const propertyId = id ?? params.id ?? ""

  const [isFavorited, setIsFavorited] = useState(false)

  const { data: property, isLoading, error } = useSafePropertyQuery(propertyId)

  const handleBack = useCallback(() => navigate(-1), [navigate])
  const handleFavoriteToggle = useCallback(
    () => setIsFavorited(prev => !prev),
    []
  )
  const handleShare = useCallback(
    () => property && shareProperty(property),
    [property]
  )

  const normalizedProperty = useNormalizedProperty(property ?? null)

  const isLandProperty = useMemo(() => {
    const landProperty = property as PropertyWithLandFeatures | undefined
    return (
      property?.type === "land" ||
      property?.propertyType === "land" ||
      landProperty?.landFeatures !== undefined
    )
  }, [property])

  const landFeatures = useMemo(
    () => (property as PropertyWithLandFeatures | undefined)?.landFeatures,
    [property]
  )

  const landVerification = useMemo(
    () => (property as PropertyWithLandFeatures | undefined)?.verification,
    [property]
  )

  // ── Early returns ─────────────────────────────────────────────────────────

  if (isLoading) {
    return <PropertyLoadingState message="Loading property details..." />
  }
  if (error || !propertyId) {
    return (
      <PropertyErrorState
        title={!propertyId ? "Property Not Found" : "Error Loading Property"}
        message={
          !propertyId
            ? "No property ID was provided in the URL."
            : "Failed to load property details. Please try again."
        }
        onBack={handleBack}
        onRetry={error ? () => window.location.reload() : undefined}
      />
    )
  }
  if (!normalizedProperty) {
    return (
      <PropertyErrorState
        title="Property Not Available"
        message="This property is no longer available or has been removed."
        onBack={handleBack}
      />
    )
  }

  // ── Derived display values ────────────────────────────────────────────────

  const galleryImages = convertToGalleryImages(
    normalizedProperty.images ?? [],
    normalizedProperty.title
  )

  const locationText =
    typeof normalizedProperty.location === "string"
      ? normalizedProperty.location
      : (normalizedProperty.location as { address?: string })?.address ??
        `Location ${NOT_SPECIFIED.toLowerCase()}`

  const numericPrice =
    typeof normalizedProperty.price === "number"
      ? normalizedProperty.price
      : parseFloat(String(normalizedProperty.price)) || 0

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
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
        {/* Property header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {normalizedProperty.title}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                <span>{locationText}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-2">
                {formatPrice(numericPrice)}
              </div>
              {normalizedProperty.verificationStatus === "verified" && (
                <Badge className="bg-green-100 text-green-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <PropertyFeaturesHeader
              isLandProperty={isLandProperty}
              landFeatures={landFeatures}
              normalizedProperty={normalizedProperty}
            />
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                Listed {formatDate(normalizedProperty.createdAt ?? new Date())}
              </span>
            </div>
          </div>
        </div>

        {/* Gallery + related carousel */}
        <div className="mb-8">
          <EnhancedImageShowcase 
            images={galleryImages.map((img: GalleryImage) => img.src).filter((src): src is string => !!src)} 
            title={normalizedProperty.title} 
          />
          <RelatedPropertiesCarousel
            currentPropertyId={String(normalizedProperty.id)}
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left column ── */}
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

            {/* Land features/verification (shared components) */}
            {isLandProperty && landFeatures && (
              <LandFeaturesSection features={landFeatures} />
            )}
            {isLandProperty && landVerification && (
              <LandVerificationSection verification={landVerification} />
            )}

            {/* Non-land features & amenities */}
            {!isLandProperty && (
              <Card>
                <CardHeader>
                  <CardTitle>Features & Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {normalizedProperty.features &&
                      Object.entries(normalizedProperty.features).map(
                        ([key, value]) =>
                          typeof value === "boolean" && value ? (
                            <div key={key} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span className="text-sm capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </span>
                            </div>
                          ) : null
                      )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Photo management */}
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
                  photoCount={normalizedProperty.images?.length ?? 0}
                  maxPhotos={20}
                />
              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            {/* Contact agent */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {normalizedProperty.owner ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {normalizedProperty.owner.name ?? "Unknown Agent"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Property Agent
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button className="w-full flex items-center gap-2">
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
                ) : (
                  <p className="text-center text-muted-foreground">
                    Contact information not available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Property stats */}
            <Card>
              <CardHeader>
                <CardTitle>Property Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(
                  [
                    ["Views", property?.viewCount ?? 0],
                    ["Trust Score", normalizedProperty.trustScore ?? 0],
                    ["Status", normalizedProperty.status ?? "available"],
                    [
                      "Last Updated",
                      formatDate(
                        new Date(
                          normalizedProperty.updatedAt ?? new Date()
                        ).toISOString()
                      ),
                    ],
                  ] as [string, string | number][]
                ).map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium capitalize">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Verification badge */}
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
  )
}

PropertyDetails.displayName = "PropertyDetails"