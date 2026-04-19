import {
  Home,
  X,
  BarChart3,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Maximize,
} from "lucide-react"
import React, { useState, useMemo, useCallback, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { useCompareError } from "../../local/hooks/useCompareError"
import type { Property } from "@shared/types/property"
import {
  normalizePropertyForComparison,
  formatComparePrice,
  getVerificationBadge,
} from "../../local/utils/compare-utils"
import { usePropertyCompare, usePropertyCompareActions } from "../contexts"

// ---------------------------------------------------------------------------
// Derived types — avoids importing sub-types that may not be public exports
// ---------------------------------------------------------------------------

/** Inferred from the context hook so we never import CompareProperty directly. */
type CompareProperty = ReturnType<typeof usePropertyCompare>["selectedProperties"][number]

/**
 * The widest possible features shape, defined inline rather than intersecting
 * the three sub-types (Residential/Commercial/LandFeatures). Every field is
 * optional so we can safely optional-chain regardless of property category.
 */
interface AnyFeatures {
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
  parkingSpaces?: number
  yearBuilt?: number
  amenities?: string[]
  // Land-specific size aliases that may appear at runtime
  size?: number
  landSize?: number
}

// ---------------------------------------------------------------------------
// Feature accessor helpers
// ---------------------------------------------------------------------------

/** Cast any features value to the widest safe shape. */
function feat(features: unknown): AnyFeatures {
  return (features ?? {}) as AnyFeatures
}

/** Derive a flat display snapshot from any Property's features. */
function getDisplayFields(features: unknown) {
  const f = feat(features)
  return {
    bedrooms:      f.bedrooms      ?? null,
    bathrooms:     f.bathrooms     ?? null,
    squareFeet:    f.squareFeet    ?? f.size ?? f.landSize ?? 0,
    parkingSpaces: f.parkingSpaces ?? 0,
    yearBuilt:     f.yearBuilt     ?? null,
    amenities:     f.amenities     ?? [],
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear()

const STATUS_STYLES = {
  verified:   "bg-green-100 text-green-800",
  pending:    "bg-yellow-100 text-yellow-800",
  unverified: "bg-gray-100 text-gray-800",
} as const

type KnownStatus = keyof typeof STATUS_STYLES

function statusStyle(status: string | undefined): string {
  const s = (status ?? "unverified") as KnownStatus
  return STATUS_STYLES[s in STATUS_STYLES ? s : "unverified"]
}

// ---------------------------------------------------------------------------
// Sample / fallback data
//
// Cast via `unknown` — these objects intentionally omit subtype-specific
// required fields (e.g. LandProperty.category). This is the correct escape
// hatch for mock data that will be replaced by a real API.
// ---------------------------------------------------------------------------

const sampleProperties = [
  {
    id: "1",
    title: "Modern Apartment in Westlands",
    price: 15_000_000,
    location: "Westlands, Nairobi",
    description: "A beautiful modern apartment with stunning city views.",
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"],
    verificationStatus: "verified",
    category: "residential",
    status: "active",
    verified: true,
    trustScore: 95,
    createdAt: "2024-01-15",
    type: "residential",
    features: {
      bedrooms: 3, bathrooms: 2, squareFeet: 1200, parkingSpaces: 2, yearBuilt: 2020,
      amenities: ["Swimming Pool", "Gym", "Security", "Backup Generator"],
    },
  },
  {
    id: "2",
    title: "Spacious Villa in Karen",
    price: 45_000_000,
    location: "Karen, Nairobi",
    description: "Luxury villa with large gardens and premium finishes.",
    images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400"],
    verificationStatus: "verified",
    category: "residential",
    status: "active",
    verified: true,
    trustScore: 98,
    createdAt: "2024-01-10",
    type: "residential",
    features: {
      bedrooms: 5, bathrooms: 4, squareFeet: 3500, parkingSpaces: 4, yearBuilt: 2018,
      amenities: ["Garden", "Swimming Pool", "Staff Quarters", "Solar Power", "CCTV"],
    },
  },
  {
    id: "3",
    title: "Cozy Townhouse in Kilimani",
    price: 8_500_000,
    location: "Kilimani, Nairobi",
    description: "Perfect starter home in a quiet neighbourhood.",
    images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400"],
    verificationStatus: "pending",
    category: "residential",
    status: "active",
    verified: false,
    trustScore: 70,
    createdAt: "2024-01-20",
    type: "residential",
    features: {
      bedrooms: 2, bathrooms: 2, squareFeet: 900, parkingSpaces: 1, yearBuilt: 2015,
      amenities: ["Security", "Water Backup", "Fiber Internet"],
    },
  },
  {
    id: "4",
    title: "Executive Office Space in Upper Hill",
    price: 28_000_000,
    location: "Upper Hill, Nairobi",
    description: "Premium office space in the business district.",
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400"],
    verificationStatus: "verified",
    category: "commercial",
    status: "active",
    verified: true,
    trustScore: 92,
    createdAt: "2024-01-05",
    type: "commercial",
    features: { squareFeet: 1800, parkingSpaces: 6, yearBuilt: 2019 },
  },
] as unknown as Property[]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PropertyValidation {
  isValid: boolean
  warnings: string[]
  errors: string[]
}

interface PropertyCompareProps {
  properties?: Property[]
  onComparisonChange?: (selected: CompareProperty[]) => void
  onSelectionLimitReached?: (attempted: Property) => void
  showAdvancedStats?: boolean
  allowMixedTypes?: boolean
}

interface ComparisonStats {
  basic: {
    averagePrice: number
    priceRange: { min: number; max: number }
    averageBedrooms: number
    averageSquareFeet: number
  }
  advanced: {
    pricePerSquareFoot: number[]
    bestValue: string | null
    newestProperty: string | null
    mostSpaciousPerPrice: string | null
    verificationScore: number
  }
  warnings: string[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PropertyCompare: React.FC<PropertyCompareProps> = ({
  properties = sampleProperties,
  onComparisonChange,
  onSelectionLimitReached,
  showAdvancedStats = true,
  allowMixedTypes = false,
}) => {
  const { selectedProperties, maxProperties, isSelected, canAddMore } = usePropertyCompare()
  const { toggleProperty, removeFromCompare, clearCompare, replaceProperty } = usePropertyCompareActions()
  const [searchParams] = useSearchParams()
  const { error, handleError, clearError } = useCompareError()

  const [showReplacementDialog, setShowReplacementDialog] = useState(false)
  const [pendingProperty, setPendingProperty]             = useState<Property | null>(null)
  const [validationWarnings, setValidationWarnings]       = useState<string[]>([])

  // ------------------------------------------------------------------
  // Utilities
  // ------------------------------------------------------------------

  const locationStr = (loc: any): string =>
    typeof loc === "string" ? loc : (loc?.address || "")

  const numericPrice = (price: number | string): number =>
    typeof price === "string" ? parseFloat(price) : price

  /**
   * Build the normalized features object that normalizePropertyForComparison
   * expects, sourcing values from whatever shape the incoming Property carries.
   */
  const buildNormalizedFeatures = useCallback((property: Property) => {
    const { squareFeet, parkingSpaces, yearBuilt, amenities, bedrooms, bathrooms } =
      getDisplayFields(property.features)
    return {
      bedrooms:      bedrooms   ?? 0,
      bathrooms:     bathrooms  ?? 0,
      squareFeet,
      parkingSpaces,
      yearBuilt:     yearBuilt  ?? CURRENT_YEAR,
      amenities,
    }
  }, [])

  const buildCompareProperty = useCallback(
    (property: Property) =>
      normalizePropertyForComparison({ ...property, features: buildNormalizedFeatures(property) }),
    [buildNormalizedFeatures]
  )

  // ------------------------------------------------------------------
  // URL param initialisation
  // ------------------------------------------------------------------

  useEffect(() => {
    const ids = searchParams.get("properties")?.split(",").filter(Boolean) ?? []
    if (ids.length === 0) return

    properties
      .filter((p) => ids.includes(String(p.id)) && !isSelected(String(p.id)))
      .forEach((p) => {
        const cp = buildCompareProperty(p)
        if (cp) toggleProperty(cp)
      })
  }, [searchParams, properties, isSelected, buildCompareProperty, toggleProperty])

  // ------------------------------------------------------------------
  // Validation
  // ------------------------------------------------------------------

  const validateProperty = useCallback((property: Property): PropertyValidation => {
    const warnings: string[] = []
    const errors:   string[] = []
    const price = numericPrice(property.price)
    const { squareFeet, yearBuilt, bedrooms, bathrooms } = getDisplayFields(property.features)

    if (!price || price <= 0)
      errors.push(`${property.title}: Invalid or missing price`)
    if (!squareFeet || squareFeet <= 0)
      errors.push(`${property.title}: Invalid or missing square footage`)
    if ((bedrooms ?? 0) < 0)
      errors.push(`${property.title}: Invalid bedroom count`)
    if ((bathrooms ?? 0) <= 0)
      errors.push(`${property.title}: Invalid bathroom count`)
    if (property.verificationStatus !== "verified")
      warnings.push(`${property.title}: Property is not verified`)
    if (yearBuilt !== null && (yearBuilt < 1900 || yearBuilt > CURRENT_YEAR))
      warnings.push(`${property.title}: Unusual year built (${yearBuilt})`)
    if (price && squareFeet && price / squareFeet > 25_000)
      warnings.push(
        `${property.title}: Price per sq ft seems high (KES ${Math.round(price / squareFeet).toLocaleString()})`
      )

    return { isValid: errors.length === 0, warnings, errors }
  }, [])

  const validatedProperties = useMemo(
    () => properties.filter((p) => validateProperty(p).isValid),
    [properties, validateProperty]
  )

  // ------------------------------------------------------------------
  // Selection handlers
  // ------------------------------------------------------------------

  const handlePropertySelect = useCallback(
    (property: Property) => {
      try {
        clearError()
        const validation = validateProperty(property)
        if (!validation.isValid) { setValidationWarnings(validation.errors); return }

        // Mixed-type guard
        if (!allowMixedTypes && selectedProperties.length > 0) {
          const existingType = selectedProperties[0]?.type
          if (property.type !== existingType) {
            setValidationWarnings([
              `Cannot compare ${property.type} with ${existingType}. Clear selection or enable mixed-type comparison.`,
            ])
            return
          }
        }

        // Selection limit — open replacement dialog
        if (!canAddMore && !isSelected(String(property.id))) {
          setPendingProperty(property)
          setShowReplacementDialog(true)
          onSelectionLimitReached?.(property)
          return
        }

        const cp = buildCompareProperty(property)
        if (!cp) { handleError("Failed to normalize property data", "handlePropertySelect"); return }

        toggleProperty(cp)
        setValidationWarnings(validation.warnings)

        const updated = isSelected(String(property.id))
          ? selectedProperties.filter((p) => p.id !== String(property.id))
          : [...selectedProperties, cp]
        onComparisonChange?.(updated)
      } catch (err) {
        handleError(err, "handlePropertySelect")
      }
    },
    [
      clearError, validateProperty, allowMixedTypes, selectedProperties,
      canAddMore, isSelected, buildCompareProperty, toggleProperty,
      onComparisonChange, onSelectionLimitReached, handleError,
    ]
  )

  const handleReplaceProperty = useCallback(
    (indexToReplace: number) => {
      if (!pendingProperty || indexToReplace < 0 || indexToReplace >= selectedProperties.length) return
      const oldId = selectedProperties[indexToReplace]?.id
      const cp    = oldId ? buildCompareProperty(pendingProperty) : null
      if (!oldId || !cp) return

      replaceProperty(oldId, cp)
      onComparisonChange?.(selectedProperties.map((p, i) => (i === indexToReplace ? cp : p)))
      setPendingProperty(null)
      setShowReplacementDialog(false)
    },
    [selectedProperties, pendingProperty, buildCompareProperty, replaceProperty, onComparisonChange]
  )

  // ------------------------------------------------------------------
  // Statistics
  // ------------------------------------------------------------------

  const statistics = useMemo((): ComparisonStats | null => {
    if (selectedProperties.length < 2) return null

    const prices   = selectedProperties.map((p) => p.price)
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const count    = selectedProperties.length

    const avgBedrooms = selectedProperties.reduce((s, p) => s + (feat(p.features).bedrooms ?? 0), 0) / count
    const avgSqFt     = selectedProperties.reduce((s, p) => s + (feat(p.features).squareFeet ?? 0), 0) / count

    const pricePerSqFt = selectedProperties.map((p) => p.price / (feat(p.features).squareFeet || 1))

    const bestValue =
      selectedProperties[pricePerSqFt.indexOf(Math.min(...pricePerSqFt))]?.id ?? null

    const newestIndex = selectedProperties.reduce((best, curr, i) => {
      const bestYr = feat(selectedProperties[best]?.features).yearBuilt ?? 0
      const currYr = feat(curr.features).yearBuilt ?? 0
      return currYr > bestYr ? i : best
    }, 0)
    const newestProperty = selectedProperties[newestIndex]?.id ?? null

    const spaciousPerPrice = selectedProperties.map(
      (p) => (feat(p.features).squareFeet ?? 0) / p.price
    )
    const mostSpaciousPerPrice =
      selectedProperties[spaciousPerPrice.indexOf(Math.max(...spaciousPerPrice))]?.id ?? null

    const verifiedCount     = selectedProperties.filter((p) => p.verificationStatus === "verified").length
    const verificationScore = (verifiedCount / count) * 100

    const warnings: string[] = []
    if (verificationScore < 50)  warnings.push("More than half of selected properties are not verified")
    if (maxPrice / minPrice > 5) warnings.push("Large price variation — ensure properties are comparable")
    if (new Set(selectedProperties.map((p) => p.type)).size > 1)
      warnings.push("Comparing different property types — results may not be meaningful")

    return {
      basic: {
        averagePrice:      avgPrice,
        priceRange:        { min: minPrice, max: maxPrice },
        averageBedrooms:   Math.round(avgBedrooms * 10) / 10,
        averageSquareFeet: Math.round(avgSqFt),
      },
      advanced: {
        pricePerSquareFoot: pricePerSqFt.map(Math.round),
        bestValue,
        newestProperty,
        mostSpaciousPerPrice,
        verificationScore:  Math.round(verificationScore),
      },
      warnings,
    }
  }, [selectedProperties])

  const getHighlights = (id: string): string[] => {
    if (!statistics) return []
    return [
      statistics.advanced.bestValue            === id && "Best Value",
      statistics.advanced.newestProperty       === id && "Newest",
      statistics.advanced.mostSpaciousPerPrice === id && "Most Space/Price",
    ].filter(Boolean) as string[]
  }

  // ------------------------------------------------------------------
  // Table row definitions — data-driven to eliminate 10× repeated <tr>
  // ------------------------------------------------------------------

  const tableRows: Array<{ label: string; render: (p: CompareProperty) => React.ReactNode }> = useMemo(
    () => [
      {
        label: "Price",
        render: (p) => (
          <span className="text-2xl font-bold text-blue-600">KES {p.price.toLocaleString()}</span>
        ),
      },
      {
        label: "Price per Sq Ft",
        render: (p) => (
          <span className="text-lg font-semibold text-green-600">
            KES {Math.round(p.price / (feat(p.features).squareFeet || 1)).toLocaleString()}
          </span>
        ),
      },
      { label: "Bedrooms",       render: (p) => feat(p.features).bedrooms      ?? "N/A" },
      { label: "Bathrooms",      render: (p) => feat(p.features).bathrooms     ?? 0 },
      { label: "Square Feet",    render: (p) => (feat(p.features).squareFeet ?? 0).toLocaleString() },
      { label: "Parking Spaces", render: (p) => feat(p.features).parkingSpaces ?? 0 },
      { label: "Year Built",     render: (p) => feat(p.features).yearBuilt     ?? "N/A" },
      {
        label: "Property Age",
        render: (p) => {
          const yr = feat(p.features).yearBuilt
          return yr ? `${CURRENT_YEAR - yr} years` : "N/A"
        },
      },
      {
        label: "Verification",
        render: (p) => (
          <span className={`px-2 py-1 rounded text-sm font-medium ${statusStyle(p.verificationStatus)}`}>
            {p.verificationStatus ?? "unverified"}
          </span>
        ),
      },
      {
        label: "Amenities",
        render: (p) => {
          const list = feat(p.features).amenities ?? []
          return list.length > 0
            ? list.map((a) => (
                <span key={a} className="inline-block text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1 mb-1">
                  {a}
                </span>
              ))
            : <span className="text-gray-400 text-sm">None listed</span>
        },
      },
    ],
    // tableRows is pure — no reactive deps; useMemo prevents re-allocation on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">

      {/* ── Header ── */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Property Comparison</h1>
        <p className="text-lg text-gray-600">
          Compare up to {maxProperties} properties with advanced analytics and validation
        </p>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-medium text-red-800">Error</h3>
          </div>
          <p className="text-sm text-red-700">{error.message}</p>
          <button onClick={clearError} className="mt-2 text-sm text-red-600 hover:text-red-800 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* ── Validation warnings ── */}
      {validationWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-medium text-yellow-800">Validation Warnings</h3>
          </div>
          {validationWarnings.map((w, i) => (
            <p key={i} className="text-sm text-yellow-700">{w}</p>
          ))}
        </div>
      )}

      {/* ── Property grid ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">Available Properties</h2>
          <span className="text-sm text-gray-600">
            {validatedProperties.length} available ({properties.length - validatedProperties.length} filtered out)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {validatedProperties.map((property) => {
            const selected   = selectedProperties.some((p) => p.id === String(property.id))
            const highlights = getHighlights(String(property.id))
            const price      = numericPrice(property.price)
            const { squareFeet, parkingSpaces, yearBuilt, bedrooms, bathrooms } =
              getDisplayFields(property.features)

            return (
              <div
                key={property.id}
                className={`border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                  selected
                    ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
                onClick={() => handlePropertySelect(property)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handlePropertySelect(property) }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${selected ? "Remove" : "Add"} ${property.title} ${selected ? "from" : "to"} comparison`}
              >
                {/* Thumbnail */}
                <div className="h-48 bg-gray-100 overflow-hidden relative">
                  {property.images?.[0]
                    ? <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Home className="w-12 h-12 text-gray-400" /></div>
                  }
                  {selected && (
                    <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      ✓
                    </div>
                  )}
                  {highlights.length > 0 && (
                    <div className="absolute top-3 left-3 space-y-1">
                      {highlights.map((h) => (
                        <div key={h} className="bg-green-500 text-white text-xs px-2 py-1 rounded font-medium">{h}</div>
                      ))}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3">
                    {getVerificationBadge(property.verificationStatus)}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">{property.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{locationStr(property.location)}</p>
                  <div className="text-2xl font-bold text-blue-600 mb-1">{formatComparePrice(price)}</div>
                  <div className="text-sm text-gray-600 mb-3">
                    {formatComparePrice(Math.round(price / (squareFeet || 1)))}/sq ft
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                    <div>{bedrooms ?? "N/A"} bed</div>
                    <div>{bathrooms ?? 0} bath</div>
                    <div>{squareFeet.toLocaleString()} sq ft</div>
                    <div>{parkingSpaces} parking</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">Built {yearBuilt ?? "N/A"}</div>
                    <Link
                      to={`/property/${String(property.id)}`}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" /> Details
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Replacement dialog ── */}
      {showReplacementDialog && pendingProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Replace Property</h3>
            <p className="text-gray-600 mb-4">
              You&apos;ve reached the maximum of {maxProperties} properties. Which would you like to
              replace with &quot;{pendingProperty.title}&quot;?
            </p>
            <div className="space-y-2 mb-6">
              {selectedProperties.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => handleReplaceProperty(i)}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-gray-600">{locationStr(p.location)}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowReplacementDialog(false); setPendingProperty(null) }}
              className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Statistics panel ── */}
      {statistics && (
        <div className="space-y-6">

          {statistics.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-medium text-amber-800">Comparison Insights</h3>
              </div>
              {statistics.warnings.map((w, i) => (
                <p key={i} className="text-sm text-amber-700">{w}</p>
              ))}
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Comparison Statistics</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {([
                { label: "Average Price",  value: formatComparePrice(statistics.basic.averagePrice),  color: "text-blue-600" },
                { label: "Price Range",    value: `${formatComparePrice(statistics.basic.priceRange.min)} – ${formatComparePrice(statistics.basic.priceRange.max)}`, color: "text-green-600" },
                { label: "Avg Bedrooms",   value: String(statistics.basic.averageBedrooms),            color: "text-purple-600" },
                { label: "Avg Sq Ft",      value: statistics.basic.averageSquareFeet.toLocaleString(),  color: "text-orange-600" },
              ] as const).map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-lg p-4 text-center">
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-sm text-gray-600">{label}</div>
                </div>
              ))}
            </div>

            {showAdvancedStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-bold text-green-600">{statistics.advanced.verificationScore}%</span>
                  </div>
                  <div className="text-sm text-gray-600">Verified Properties</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span className="text-lg font-bold text-blue-600">
                      KES {Math.round(
                        statistics.advanced.pricePerSquareFoot.reduce((a, b) => a + b, 0) /
                        statistics.advanced.pricePerSquareFoot.length
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">Avg Price/Sq Ft</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Maximize className="w-5 h-5 text-purple-600" />
                    <span className="text-lg font-bold text-purple-600">
                      {Math.round(
                        ((statistics.basic.priceRange.max - statistics.basic.priceRange.min) /
                          statistics.basic.priceRange.min) * 100
                      )}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">Price Variation</div>
                </div>
              </div>
            )}
          </div>

          {/* Data-driven comparison table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-900">Detailed Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-semibold text-gray-900">Feature</th>
                    {selectedProperties.map((p) => (
                      <th key={p.id} className="text-left p-4 font-semibold text-gray-900 min-w-48">
                        <div className="truncate">{p.title}</div>
                        <div className="text-xs text-gray-600 font-normal">{locationStr(p.location)}</div>
                        {getHighlights(p.id).map((h) => (
                          <div key={h} className="mt-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                            {h}
                          </div>
                        ))}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map(({ label, render }) => (
                    <tr key={label} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900 align-top">{label}</td>
                      {selectedProperties.map((p) => (
                        <td key={p.id} className="p-4 text-lg align-top">{render(p)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Selected properties tray ── */}
      {selectedProperties.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">
              Selected for Comparison ({selectedProperties.length})
            </h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.alert("Export functionality would be implemented here")}
                className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
              >
                Export
              </button>
              <button
                type="button"
                onClick={() => { clearCompare(); setValidationWarnings([]); onComparisonChange?.([]) }}
                className="text-red-600 hover:text-red-800 font-medium px-3 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {selectedProperties.map((p) => (
              <div key={p.id} className="bg-white border rounded-lg p-3 flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Home className="w-6 h-6 text-gray-400" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{p.title}</div>
                  <div className="text-gray-600 text-xs truncate">{locationStr(p.location)}</div>
                  <div className="text-blue-600 text-xs font-medium">
                    KES {Math.round(p.price / (feat(p.features).squareFeet || 1)).toLocaleString()}/sq ft
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromCompare(p.id)
                    onComparisonChange?.(selectedProperties.filter((s) => s.id !== p.id))
                  }}
                  className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"
                  aria-label={`Remove ${p.title} from comparison`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {selectedProperties.length >= 2 && (
            <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 text-sm items-center">
              <span className="text-gray-600">Quick insights:</span>
              {statistics?.advanced.bestValue && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  Best value: {selectedProperties.find((p) => p.id === statistics.advanced.bestValue)?.title}
                </span>
              )}
              {statistics?.advanced.newestProperty && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Newest: {selectedProperties.find((p) => p.id === statistics.advanced.newestProperty)?.title}
                </span>
              )}
              {statistics?.advanced.verificationScore === 100 && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  All properties verified ✓
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {selectedProperties.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <Home className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-2xl font-medium text-gray-900 mb-3">No Properties Selected</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Click on properties above to add them to your comparison. You can compare up to{" "}
            {maxProperties} properties at once{!allowMixedTypes && " of the same type"}.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm text-gray-600">
            {(["bg-blue-500", "bg-green-500", "bg-purple-500"] as const).map((color, i) => (
              <div key={i} className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 ${color} rounded-full`} />
                <span>{["Side-by-side comparison", "Advanced analytics", "Property validation"][i]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-sm text-gray-500">
        Properties are automatically validated for data quality.
        {!allowMixedTypes && " Only properties of the same type can be compared."}
        {" "}Verified properties are recommended for accurate comparisons.
      </p>
    </div>
  )
}

export default PropertyCompare