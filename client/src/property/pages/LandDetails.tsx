import {
  ArrowLeft,
  Droplets,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Shield,
  TreePine,
  User,
} from "lucide-react"
import React, { useCallback, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { Badge } from "../../local/components/ui/badge"
import { Button } from "../../local/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../local/components/ui/card"
// Unified import — formatDate lives in date-utils, formatPrice in formatters
import { formatDate } from "../../local/utils/date-utils"
import { formatPrice } from "../../local/utils/formatters"
import { EnhancedImageShowcase } from "../../local/components/images/ImageShowcase"
import { useProperty } from "../hooks/useProperty"
import { PropertyErrorState, PropertyLoadingState } from "../components/shared/components"
import {
  LandFeaturesSection,
  LandVerificationSection,
} from "../components/shared/LandSections"
import { CarouselShell, useCarousel } from "../components/shared/CarouselShell"
import type { GalleryImage } from "../../local/components/images/gallery/types"
import {
  convertToGalleryImages,
  getTrustScoreColor,
  getVerificationBadgeVariant,
  NOT_SPECIFIED,
} from "../utils/ui-utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LandDetailsProps {
  readonly id?: string
}

interface RelatedLandProperty {
  id: string
  title: string
  image: string
  price: number
  size: string
  landUse: string
  location: string
}

// ---------------------------------------------------------------------------
// Mock data — TODO: replace with a useRelatedLands(id) API hook
// ---------------------------------------------------------------------------

const RELATED_LANDS: RelatedLandProperty[] = [
  {
    id: "land-1",
    title: "Agricultural Land in Nakuru",
    image: "/assets/Land/agricultural-land-1.jpg",
    price: 5_000_000,
    size: "5 acres",
    landUse: "agricultural",
    location: "Nakuru County",
  },
  {
    id: "land-2",
    title: "Residential Plot in Kiambu",
    image: "/assets/Land/residential-plot-1.jpg",
    price: 8_000_000,
    size: "0.5 acres",
    landUse: "residential",
    location: "Kiambu County",
  },
  {
    id: "land-3",
    title: "Commercial Land in Mombasa",
    image: "/assets/Land/commercial-land-1.jpg",
    price: 15_000_000,
    size: "2 acres",
    landUse: "commercial",
    location: "Mombasa County",
  },
  {
    id: "land-4",
    title: "Mixed Use Land in Eldoret",
    image: "/assets/Land/mixed-use-land-1.jpg",
    price: 12_000_000,
    size: "3 acres",
    landUse: "mixed",
    location: "Uasin Gishu County",
  },
]

// ---------------------------------------------------------------------------
// RelatedLandsCarousel
// ---------------------------------------------------------------------------

interface RelatedLandsCarouselProps {
  currentLandId: string
}

const RelatedLandsCarousel: React.FC<RelatedLandsCarouselProps> = ({
  currentLandId,
}) => {
  const navigate = useNavigate()

  const relatedLands = useMemo(
    () => RELATED_LANDS.filter(l => l.id !== currentLandId),
    [currentLandId]
  )

  const {
    currentSlide,
    totalSlides,
    isAutoPlaying,
    currentSliceRange,
    handlePrev,
    handleNext,
    handleSlideChange,
    handleToggleAutoPlay,
    handleMouseEnter,
    handleMouseLeave,
  } = useCarousel({ totalItems: relatedLands.length, autoPlayInterval: 5000 })

  const handleLandClick = useCallback(
    (landId: string) => navigate(`/property/${landId}`),
    [navigate]
  )

  if (relatedLands.length === 0) return null

  const visibleLands = relatedLands.slice(...currentSliceRange)

  return (
    <CarouselShell
      title={
        <>
          <TreePine className="w-5 h-5 text-green-600" />
          Related Land Properties
        </>
      }
      subtitle="Similar land properties you might be interested in"
      totalSlides={totalSlides}
      currentSlide={currentSlide}
      isAutoPlaying={isAutoPlaying}
      onSlideChange={handleSlideChange}
      onPrev={handlePrev}
      onNext={handleNext}
      onToggleAutoPlay={handleToggleAutoPlay}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      activeDotClass="bg-green-600"
      navButtonClass="bg-green-50 hover:bg-green-100 text-green-600"
    >
      {visibleLands.map((land: RelatedLandProperty) => (
        <div
          key={land.id}
          onClick={() => handleLandClick(land.id)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              handleLandClick(land.id)
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
    </CarouselShell>
  )
}

// ---------------------------------------------------------------------------
// LandDetails
// ---------------------------------------------------------------------------

export default function LandDetails({ id }: LandDetailsProps) {
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()
  const landId = id ?? params.id ?? ""

  const { useLandProperty } = useProperty()
  const { data: land, isLoading, error } = useLandProperty(landId)

  if (isLoading) {
    return <PropertyLoadingState message="Loading land details..." />
  }

  if (error || !land) {
    return (
      <PropertyErrorState
        title="Land Property Not Found"
        message="The land property you're looking for does not exist or has been removed."
        onBack={() => window.history.back()}
      />
    )
  }

  const galleryImages = convertToGalleryImages(
    land.images ?? [],
    land.title,
    "land"
  )

  return (
    <div className="container mx-auto px-4 navbar-offset pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Main content ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Page header */}
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
                <Badge
                  variant={getVerificationBadgeVariant(
                    land.verificationStatus
                  )}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {land.verificationStatus}
                </Badge>
                <Badge variant={getVerificationBadgeVariant(land.riskLevel)}>
                  Risk: {land.riskLevel}
                </Badge>
              </div>
            </div>
          </div>

          {/* Gallery */}
          <EnhancedImageShowcase
            images={galleryImages.map((img: GalleryImage) => img.src).filter((src): src is string => !!src)}
            title={land.title}
          />

          {/* Related lands carousel */}
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

          {/* Land features — shared component (also used by PropertyDetails) */}
          {land.landFeatures && (
            <LandFeaturesSection features={land.landFeatures} />
          )}

          {/* Land verification — shared component */}
          {land.verification && (
            <LandVerificationSection verification={land.verification} />
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          {/* Price & CTA */}
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

          {/* Owner information */}
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
              <div className="pt-2 border-t flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Owner Trust Score:
                </span>
                <span
                  className={`font-medium ${getTrustScoreColor(land.owner.trustScore)}`}
                >
                  {land.owner.trustScore}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Land photo management */}
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
              <p className="text-xs text-muted-foreground text-center">
                Upload aerial views, boundary markers, and land features
              </p>
            </CardContent>
          </Card>

          {/* Property details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(
                [
                  ["Listed", formatDate(land.createdAt)],
                  ["Updated", formatDate(land.updatedAt)],
                  ["Property ID", land.id],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}:</span>
                  <span className={label === "Property ID" ? "font-mono" : ""}>
                    {value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}