import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Eye,
  MapPin,
  Shield,
  Square,
} from "lucide-react"
import {
  memo,
  useCallback,
  type MouseEvent,
  type KeyboardEvent,
} from "react"

import { ImageGallery } from "../../local/components/images"
import { Badge } from "../../local/components/ui/badge"
import { Button } from "../../local/components/ui/button"
import { Card, CardContent } from "../../local/components/ui/card"
import { cn } from "../../local/lib/utils"
import type { NormalizedProperty } from "@shared/types/property"
import {
  usePropertyCompare,
  usePropertyCompareActions,
} from "../contexts"
import { useImageGallery } from "../../local/hooks"
import {
  usePropertyCardActions,
  usePropertyFormatting,
  usePropertyCompareActions as useSharedCompareActions,
  usePropertyCardState,
} from "../hooks"
import { PropertyImageSection, PropertyFeatures } from "./shared"

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = "low" | "medium" | "high"
type TitleDeedStatus = "available" | "pending" | "missing"

/** Superset of NormalizedProperty with land-specific fields. */
interface ExtendedLandProperty extends NormalizedProperty {
  readonly originalPrice?: number
  readonly size?: string
  readonly riskLevel?: RiskLevel
  readonly titleDeedStatus?: TitleDeedStatus
  readonly lastVerified?: string
  readonly dateAdded?: Date
  readonly viewCount?: number
  readonly isNew?: boolean
  readonly isFeatured?: boolean
}

interface LandCardProps {
  readonly property: NormalizedProperty
  readonly className?: string
  readonly showQuickActions?: boolean
  readonly isInWishlist?: boolean
  readonly viewMode?: "grid" | "list"
  readonly onSave?: (id: string) => void
  readonly onShare?: (id: string) => void
  readonly onViewDetails?: (id: string) => void
  readonly onVerify?: (id: string) => void
  /**
   * When true, an `ImageGallery` is rendered as a document-level overlay
   * alongside the card (via a React fragment). Controlled internally by the
   * gallery hook — only visible once the user triggers fullscreen.
   */
  readonly showGallery?: boolean
  readonly onClick?: (property: NormalizedProperty) => void
}

// ─── Local type alias ─────────────────────────────────────────────────────────

type FormattedPrice = ReturnType<typeof usePropertyFormatting>["formattedPrice"]

// ─── Module-level formatters (instantiated once, not per render) ──────────────

const currencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

const formatCurrency = (amount: number): string => currencyFormatter.format(amount)

const formatDate = (date: Date | string, includeYear = false): string => {
  const d = typeof date === "string" ? new Date(date) : date
  return isNaN(d.getTime())
    ? "Unknown date"
    : includeYear
      ? longDateFormatter.format(d)
      : shortDateFormatter.format(d)
}

/** Returns undefined for invalid date strings, avoiding thrown exceptions. */
const safeISOString = (date: Date | string | undefined): string | undefined => {
  if (!date) return undefined
  const d = typeof date === "string" ? new Date(date) : date
  return isNaN(d.getTime()) ? undefined : d.toISOString()
}

// ─── Module-level config ──────────────────────────────────────────────────────

type AccessFeatureKey = "waterAccess" | "roadAccess" | "electricityAccess"

const ACCESS_FEATURES: ReadonlyArray<{
  key: AccessFeatureKey
  label: string
  emoji: string
  colorClass: string
}> = [
  { key: "waterAccess",       label: "Water Access", emoji: "💧", colorClass: "bg-blue-50 text-blue-700"   },
  { key: "roadAccess",        label: "Road Access",  emoji: "🛣️", colorClass: "bg-gray-50 text-gray-700"   },
  { key: "electricityAccess", label: "Electricity",  emoji: "⚡", colorClass: "bg-yellow-50 text-yellow-700" },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusIndicators = memo<{ property: ExtendedLandProperty }>(
  ({ property }) => {
    const { isNew, isFeatured } = property
    if (!isNew && !isFeatured) return null

    return (
      <div className="absolute top-0 left-0 z-20 flex flex-col">
        {isNew && (
          <div
            className={cn(
              "bg-green-500 text-white text-xs font-bold px-2 py-1",
              // Only round the bottom-right corner of the last visible badge
              isFeatured ? "rounded-none" : "rounded-br-lg"
            )}
          >
            NEW
          </div>
        )}
        {isFeatured && (
          <div className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-br-lg">
            FEATURED
          </div>
        )}
      </div>
    )
  }
)
StatusIndicators.displayName = "StatusIndicators"

const LandAccessFeatures = memo<{ features?: NormalizedProperty["features"] }>(
  ({ features }) => {
    if (!features) return null

    const available = ACCESS_FEATURES.filter(
      ({ key }) => Boolean(features[key as keyof typeof features])
    )

    if (available.length === 0) return null

    return (
      <div className="flex flex-wrap gap-2">
        {available.map(({ key, label, emoji, colorClass }) => (
          <Badge key={key} variant="outline" className={cn("text-xs", colorClass)}>
            <span role="img" aria-label={label.toLowerCase()}>
              {emoji}
            </span>{" "}
            {label}
          </Badge>
        ))}
      </div>
    )
  }
)
LandAccessFeatures.displayName = "LandAccessFeatures"

const PriceSection = memo<{
  property: ExtendedLandProperty
  formattedPrice: FormattedPrice
}>(({ property, formattedPrice }) => {
  const titleDeedStatus =
    property.titleDeedStatus ?? property.features?.titleDeedStatus ?? "available"

  return (
    <div className="space-y-1 flex-1">
      {formattedPrice.hasDiscount && property.originalPrice != null && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-muted-foreground line-through">
            {formatCurrency(property.originalPrice)}
          </span>
          <Badge variant="destructive" className="text-xs">
            -{formattedPrice.discountPercentage}%
          </Badge>
        </div>
      )}
      <div className="text-xl sm:text-2xl font-bold text-primary">
        {formattedPrice.primary}
      </div>
      <div className="text-xs text-muted-foreground">{formattedPrice.secondary}</div>
      <div className="text-xs text-muted-foreground">
        Title:{" "}
        <span className="capitalize font-medium text-foreground">
          {titleDeedStatus}
        </span>
      </div>
    </div>
  )
})
PriceSection.displayName = "PriceSection"

// ─── Main Component ───────────────────────────────────────────────────────────

export const LandCard = memo<LandCardProps>(
  ({
    property,
    className,
    showQuickActions = true,
    isInWishlist = false,
    viewMode = "grid",
    onSave,
    onShare,
    onViewDetails,
    onVerify,
    showGallery = false,
    onClick,
  }) => {
    const extendedProperty = property as ExtendedLandProperty

    const gallery = useImageGallery({
      property,
      images: property.images ?? [],
      enableNavigation: true,
      enableFullscreen: true,
    })

    // Normalise the two "view details" entry points into one handler for the hook.
    const resolvedOnViewDetails =
      onViewDetails ?? (onClick ? () => onClick(property) : undefined)

    const actions = usePropertyCardActions(property, {
      onSave,
      onShare,
      onViewDetails: resolvedOnViewDetails,
      onVerify,
    })

    const { formattedPrice, locationString, displayTitle, displayDescription } =
      usePropertyFormatting(property, {
        originalPrice: extendedProperty.originalPrice,
        showUSDConversion: true,
        exchangeRate: 130,
      })

    const { isHovered, handleMouseEnter, handleMouseLeave, handleKeyDown } =
      usePropertyCardState()

    const { selectedProperties, canAddMore } = usePropertyCompare()
    const { addToCompare, removeFromCompare } = usePropertyCompareActions()

    // Kept as an inline expression — the array is always tiny (≤4 items) and
    // the memoisation overhead would exceed the cost of the comparison itself.
    const isInCompare = selectedProperties.some((p) => p.id === property.id)

    const compareActions = useSharedCompareActions({
      property,
      isInCompare,
      canAddMore,
      addToCompare,
      removeFromCompare,
      locationString,
    })

    const handleCardClick = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest("button, a")) return
        onClick?.(property)
      },
      [onClick, property]
    )

    const handleCardKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => handleKeyDown(e, () => onClick?.(property)),
      [handleKeyDown, onClick, property]
    )

    const dateAddedISO = safeISOString(extendedProperty.dateAdded)
    const lastVerifiedISO = safeISOString(extendedProperty.lastVerified)

    return (
      <>
        <Card
          className={cn(
            "group relative bg-card rounded-xl overflow-hidden shadow-sm",
            "hover:shadow-lg transition-all duration-300 border border-gray-100",
            "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
            "w-full max-w-sm mx-auto sm:max-w-none md:hover:-translate-y-2",
            viewMode === "list" && "sm:flex sm:flex-row sm:max-w-4xl",
            className
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onKeyDown={handleCardKeyDown}
          onClick={handleCardClick}
          tabIndex={onClick ? 0 : undefined}
          role={onClick ? "button" : undefined}
          aria-label={onClick ? `View details for ${displayTitle}` : undefined}
        >
          <StatusIndicators property={extendedProperty} />

          <div
            className={cn(
              "relative overflow-hidden",
              viewMode === "grid"
                ? "aspect-[4/3] w-full"
                : "sm:w-80 sm:h-60 aspect-[4/3] sm:aspect-auto"
            )}
          >
            <PropertyImageSection
              property={property}
              gallery={gallery}
              actions={actions}
              isHovered={isHovered}
              showQuickActions={showQuickActions}
              isInWishlist={isInWishlist}
              priority={false}
              isInCompare={isInCompare}
              canAddMore={canAddMore}
              onCompareClick={compareActions.handleCompareClick}
              showVerificationBadge
              showTrustScore
              showImageCount
            />
          </div>

          <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1">
            {/* Title and date */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <Button
                  variant="ghost"
                  type="button"
                  className="font-bold text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors flex-1 mr-2 text-left p-0 h-auto justify-start"
                  onClick={actions.handleViewDetails}
                  aria-label={`View details for ${displayTitle}`}
                >
                  {displayTitle}
                </Button>

                {dateAddedISO && (
                  <div className="flex items-center text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded-full shrink-0">
                    <Calendar className="w-3 h-3 mr-1" aria-hidden />
                    <time dateTime={dateAddedISO}>
                      {formatDate(extendedProperty.dateAdded!)}
                    </time>
                  </div>
                )}
              </div>

              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2 text-primary shrink-0" aria-hidden />
                <span className="text-sm line-clamp-1 font-medium">{locationString}</span>
              </div>
            </div>

            {displayDescription && (
              <p className="text-muted-foreground text-sm line-clamp-2">
                {displayDescription}
              </p>
            )}

            <PropertyFeatures
              property={property}
              locationString={locationString}
              variant="land"
            />

            <LandAccessFeatures features={property.features} />

            {/* Price row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-gray-100 gap-3 sm:gap-0">
              <PriceSection property={extendedProperty} formattedPrice={formattedPrice} />

              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={actions.handleVerify}
                  className="flex items-center gap-1 text-xs sm:text-sm"
                  aria-label="Verify property"
                >
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden />
                  <span className="hidden sm:inline">Verify</span>
                  <span className="sm:hidden" aria-hidden>✓</span>
                </Button>
                <Button
                  size="sm"
                  onClick={actions.handleViewDetails}
                  className="flex items-center gap-1 text-xs sm:text-sm"
                  aria-label={`View details for ${displayTitle}`}
                >
                  <span className="hidden sm:inline">Details</span>
                  <span className="sm:hidden">View</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden />
                </Button>
              </div>
            </div>

            {/* Compare row */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 gap-2 sm:gap-0">
              <Button
                size="sm"
                variant={isInCompare ? "default" : "outline"}
                onClick={compareActions.handleCompareClick}
                disabled={!canAddMore && !isInCompare}
                className="flex items-center gap-1 w-full sm:w-auto text-xs sm:text-sm"
                aria-label={
                  isInCompare
                    ? "Remove from comparison"
                    : canAddMore
                      ? "Add to comparison"
                      : "Comparison list is full"
                }
              >
                {isInCompare ? (
                  <>
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden />
                    <span className="hidden sm:inline">In Comparison</span>
                    <span className="sm:hidden">Added</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden />
                    Compare
                  </>
                )}
              </Button>

              {lastVerifiedISO && (
                <div className="text-xs text-muted-foreground text-center sm:text-right">
                  Last verified:{" "}
                  <time dateTime={lastVerifiedISO}>
                    {formatDate(extendedProperty.lastVerified!, true)}
                  </time>
                </div>
              )}
            </div>

            {/* View count */}
            {extendedProperty.viewCount != null && (
              <div className="flex items-center text-xs text-muted-foreground pt-2 border-t border-gray-50">
                <Eye className="w-3 h-3 mr-1" aria-hidden />
                <span>Viewed {extendedProperty.viewCount.toLocaleString()} times</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/*
          ImageGallery renders as a document-level overlay (portal).
          Only mount it when both the feature flag and the hook's own
          readiness flag agree — avoids an empty portal on initial render.
        */}
        {showGallery && gallery.showGallery && (
          <ImageGallery
            images={gallery.galleryImages}
            enableSearch={false}
            enableFullscreen
            showImageCounter
            onImageClick={(_, index) => {
              if (typeof index === "number") gallery.navigateToImage(index)
            }}
          />
        )}
      </>
    )
  }
)

LandCard.displayName = "LandCard"

export default LandCard