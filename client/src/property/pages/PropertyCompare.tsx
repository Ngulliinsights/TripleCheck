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

// Validation result interface
interface PropertyValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

// Enhanced component props
interface PropertyCompareProps {
  properties?: Property[];
  onComparisonChange?: (selectedProperties: Property[]) => void;
  onSelectionLimitReached?: (attemptedProperty: Property) => void;
  showAdvancedStats?: boolean;
  allowMixedTypes?: boolean;
}

// Enhanced statistics interface
interface ComparisonStats {
  basic: {
    averagePrice: number;
    priceRange: { min: number; max: number };
    averageBedrooms: number;
    averageSquareFeet: number;
  };
  advanced: {
    pricePerSquareFoot: number[];
    bestValue: string | null;
    newestProperty: string | null;
    mostSpaciousPerPrice: string | null;
    verificationScore: number;
  };
  warnings: string[];
}

// Constants to avoid duplicate strings
const PROPERTY_TYPE_RESIDENTIAL = "residential";
const PROPERTY_TYPE_COMMERCIAL = "commercial";

// Sample properties with more realistic data
const sampleProperties = [
  {
    id: "1",
    title: "Modern Apartment in Westlands",
    price: 15000000,
    location: "Westlands, Nairobi",
    description: "A beautiful modern apartment with stunning city views.",
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"],
    bedrooms: 3,
    bathrooms: 2,
    area: 1200,
    amenities: ["Swimming Pool", "Gym", "Security", "Backup Generator"],
    verificationStatus: "verified" as const,
    type: PROPERTY_TYPE_RESIDENTIAL,
    features: {
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1200,
      parkingSpaces: 2,
      yearBuilt: 2020,
      amenities: ["Swimming Pool", "Gym", "Security", "Backup Generator"],
    },
    listingDate: "2024-01-15",
  },
  {
    id: "2",
    title: "Spacious Villa in Karen",
    price: 45000000,
    location: "Karen, Nairobi",
    description: "Luxury villa with large gardens and premium finishes.",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
    ],
    bedrooms: 5,
    bathrooms: 4,
    area: 3500,
    amenities: [
      "Garden",
      "Swimming Pool",
      "Staff Quarters",
      "Solar Power",
      "CCTV",
    ],
    verificationStatus: "verified" as const,
    type: PROPERTY_TYPE_RESIDENTIAL,
    features: {
      bedrooms: 5,
      bathrooms: 4,
      squareFeet: 3500,
      parkingSpaces: 4,
      yearBuilt: 2018,
      amenities: [
        "Garden",
        "Swimming Pool",
        "Staff Quarters",
        "Solar Power",
        "CCTV",
      ],
    },
    listingDate: "2024-01-10",
  },
  {
    id: "3",
    title: "Cozy Townhouse in Kilimani",
    price: 8500000,
    location: "Kilimani, Nairobi",
    description: "Perfect starter home in a quiet neighborhood.",
    images: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400",
    ],
    bedrooms: 2,
    bathrooms: 2,
    area: 900,
    amenities: ["Security", "Water Backup", "Fiber Internet"],
    verificationStatus: "pending" as const,
    type: PROPERTY_TYPE_RESIDENTIAL,
    features: {
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 900,
      parkingSpaces: 1,
      yearBuilt: 2015,
      amenities: ["Security", "Water Backup", "Fiber Internet"],
    },
    listingDate: "2024-01-20",
  },
  {
    id: "4",
    title: "Executive Office Space in Upper Hill",
    price: 28000000,
    location: "Upper Hill, Nairobi",
    description: "Premium office space in the business district.",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400",
    ],
    bedrooms: 0, // Office space has no bedrooms
    bathrooms: 3,
    area: 1800,
    amenities: [
      "Rooftop Terrace",
      "Concierge",
      "Business Center",
      "High Speed Internet",
    ],
    verificationStatus: "verified" as const,
    type: PROPERTY_TYPE_COMMERCIAL,
    features: {
      bedrooms: 0,
      bathrooms: 3,
      squareFeet: 1800,
      parkingSpaces: 6,
      yearBuilt: 2019,
      amenities: [
        "Rooftop Terrace",
        "Concierge",
        "Business Center",
        "High Speed Internet",
      ],
    },
    listingDate: "2024-01-05",
  },
];

const PropertyCompareInner: React.FC<PropertyCompareProps> = ({
  properties = sampleProperties,
  onComparisonChange,
  onSelectionLimitReached,
  showAdvancedStats = true,
  allowMixedTypes = false,
}) => {
  // Use unified PropertyContext for comparison functionality
  const { selectedProperties, maxProperties, isSelected, canAddMore } =
    usePropertyCompare();
  const { toggleProperty, removeFromCompare, clearCompare, replaceProperty } =
    usePropertyCompareActions();
  const [searchParams] = useSearchParams();
  const { error, handleError, clearError } = useCompareError();

  // Local UI state only
  const [showReplacementDialog, setShowReplacementDialog] = useState(false);
  const [pendingProperty, setPendingProperty] = useState<Property | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Convert CompareProperty back to Property format for display
  const displayProperties = useMemo(() => {
    return selectedProperties.map((p) => ({
      ...p,
      bedrooms: p.features?.bedrooms || 0,
      bathrooms: p.features?.bathrooms || 0,
      area: p.features?.squareFeet || 0,
      size: p.features?.squareFeet || 0,
      amenities: p.features?.amenities || [],
      verificationStatus: p.verificationStatus || "unverified",
      type: p.type || PROPERTY_TYPE_RESIDENTIAL,
      images: p.images || [],
      features: {
        ...p.features,
        parkingSpaces: p.features?.parkingSpaces || 0,
        yearBuilt: p.features?.yearBuilt || new Date().getFullYear(),
      },
    })) as Property[];
  }, [selectedProperties]);

  // Load properties from URL params on mount
  useEffect(() => {
    const propertyIds =
      searchParams.get("properties")?.split(",").filter(Boolean) || [];
    if (propertyIds.length > 0) {
      const urlProperties = properties.filter((p) =>
        propertyIds.includes(String(p.id))
      );
      if (urlProperties.length > 0) {
        // Convert to CompareProperty format and add to unified context
        urlProperties.forEach((property) => {
          const compareProperty = normalizePropertyForComparison({
            ...property,
            features: {
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              squareFeet: property.area || property.features?.squareFeet || 0,
              parkingSpaces: property.features?.parkingSpaces || 0,
              yearBuilt:
                property.features?.yearBuilt || new Date().getFullYear(),
              amenities:
                property.amenities || property.features?.amenities || [],
            },
          });
          if (compareProperty && !isSelected(String(property.id))) {
            toggleProperty(compareProperty);
          }
        });
      }
    }
  }, [searchParams, properties, isSelected, toggleProperty]);

  // Comprehensive property validation
  const validateProperty = useCallback(
    (property: Property): PropertyValidation => {
      const warnings: string[] = [];
      const errors: string[] = [];

      // Check for missing or invalid required fields
      const price =
        typeof property.price === "string" ?
          parseFloat(property.price)
        : property.price;
      if (!price || price <= 0) {
        errors.push(`${property.title}: Invalid or missing price`);
      }
      const squareFeet = property.area || property.features?.squareFeet || 0;
      if (!squareFeet || squareFeet <= 0) {
        errors.push(`${property.title}: Invalid or missing square footage`);
      }
      if ((property.bedrooms || 0) < 0) {
        errors.push(`${property.title}: Invalid bedroom count`);
      }
      if ((property.bathrooms || 0) <= 0) {
        errors.push(`${property.title}: Invalid bathroom count`);
      }

      // Business logic warnings
      if (property.verificationStatus !== "verified") {
        warnings.push(`${property.title}: Property is not verified`);
      }
      const yearBuilt =
        property.features?.yearBuilt || new Date().getFullYear();
      if (yearBuilt < 1900 || yearBuilt > new Date().getFullYear()) {
        warnings.push(`${property.title}: Unusual year built (${yearBuilt})`);
      }
      if (price && squareFeet && price / squareFeet > 25000) {
        warnings.push(
          `${property.title}: Price per sq ft seems high (KES ${Math.round(price / squareFeet).toLocaleString()})`
        );
      }

      return {
        isValid: errors.length === 0,
        warnings,
        errors,
      };
    },
    []
  );

  // Validate properties on load and selection
  const validatedProperties = useMemo(() => {
    return properties.filter((property) => {
      const validation = validateProperty(property);
      return validation.isValid;
    });
  }, [properties, validateProperty]);

  // Unified property selection handler using PropertyContext
  const handlePropertySelection = useCallback(
    (property: Property, validation: PropertyValidation) => {
      const compareProperty = normalizePropertyForComparison({
        ...property,
        features: {
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          squareFeet: property.area || property.size || 0,
          parkingSpaces: property.features?.parkingSpaces || 0,
          yearBuilt: property.features?.yearBuilt || new Date().getFullYear(),
          amenities: property.amenities || property.features?.amenities || [],
        },
      });

      if (!compareProperty) {
        handleError(
          "Failed to normalize property data",
          "handlePropertySelect"
        );
        return;
      }

      // Check for mixed property types if not allowed
      if (!allowMixedTypes && displayProperties.length > 0) {
        const existingType = displayProperties[0]?.type;
        if (property.type !== existingType) {
          setValidationWarnings([
            `Cannot compare ${property.type} properties with ${existingType} properties. Clear selection or enable mixed type comparison.`,
          ]);
          return;
        }
      }

      // Handle selection limit
      if (!canAddMore && !isSelected(String(property.id))) {
        setPendingProperty(property);
        setShowReplacementDialog(true);
        onSelectionLimitReached?.(property);
        return;
      }

      // Toggle property in unified context
      toggleProperty(compareProperty);
      setValidationWarnings(validation.warnings);

      // Notify parent component of changes
      const updatedProperties =
        isSelected(String(property.id)) ?
          displayProperties.filter((p) => p.id !== property.id)
        : [...displayProperties, property];
      onComparisonChange?.(updatedProperties);
    },
    [
      allowMixedTypes,
      displayProperties,
      canAddMore,
      isSelected,
      toggleProperty,
      onComparisonChange,
      onSelectionLimitReached,
      handleError,
    ]
  );

  // Enhanced selection logic with proper business rules
  const handlePropertySelect = useCallback(
    (property: Property) => {
      try {
        clearError();
        const validation = validateProperty(property);

        if (!validation.isValid) {
          setValidationWarnings(validation.errors);
          return;
        }

        handlePropertySelection(property, validation);
      } catch (error) {
        handleError(error, "handlePropertySelect");
      }
    },
    [clearError, validateProperty, handlePropertySelection, handleError]
  );

  // Handle property replacement
  const handleReplaceProperty = useCallback(
    (indexToReplace: number) => {
      if (
        !pendingProperty ||
        indexToReplace < 0 ||
        indexToReplace >= selectedProperties.length
      )
        return;

      const propertyAtIndex = selectedProperties[indexToReplace];
      const oldPropertyId = propertyAtIndex?.id;
      if (oldPropertyId && pendingProperty) {
        const compareProperty = normalizePropertyForComparison({
          ...pendingProperty,
          features: {
            bedrooms: pendingProperty.bedrooms,
            bathrooms: pendingProperty.bathrooms,
            squareFeet:
              pendingProperty.area || pendingProperty.features?.squareFeet || 0,
            parkingSpaces: pendingProperty.features?.parkingSpaces || 0,
            yearBuilt:
              pendingProperty.features?.yearBuilt || new Date().getFullYear(),
            amenities:
              pendingProperty.amenities ||
              pendingProperty.features?.amenities ||
              [],
          },
        });

        if (compareProperty) {
          replaceProperty(oldPropertyId, compareProperty);
          setPendingProperty(null);
          setShowReplacementDialog(false);
          onComparisonChange?.(
            displayProperties.map((p, i) =>
              i === indexToReplace ? pendingProperty : p
            )
          );
        }
      }
    },
    [selectedProperties, pendingProperty, onComparisonChange, replaceProperty, displayProperties]
  );

  // Enhanced statistics with business insights
  const statistics = useMemo((): ComparisonStats | null => {
    if (selectedProperties.length < 2) return null;

    const prices = selectedProperties.map((p) => p.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const avgBedrooms =
      selectedProperties.reduce(
        (sum, p) => sum + (p.features?.bedrooms || 0),
        0
      ) / selectedProperties.length;
    const avgSquareFeet =
      selectedProperties.reduce(
        (sum, p) => sum + (p.features?.squareFeet || 0),
        0
      ) / selectedProperties.length;

    // Advanced calculations
    const pricePerSquareFoot = selectedProperties.map(
      (p) => p.price / (p.features?.squareFeet || 1)
    );

    // Find best value (lowest price per square foot)
    const bestValueIndex = pricePerSquareFoot.indexOf(
      Math.min(...pricePerSquareFoot)
    );
    const bestValueProperty = bestValueIndex >= 0 && bestValueIndex < selectedProperties.length ? 
      selectedProperties[bestValueIndex] : null;
    const bestValue = bestValueProperty?.id || null;

    // Find newest property
    const newestIndex = selectedProperties.reduce((newest, current, index) => {
      const newestPropertyAtIndex = selectedProperties[newest];
      const currentYear = current.features?.yearBuilt || 0;
      const newestYear = newestPropertyAtIndex?.features?.yearBuilt || 0;
      return newestPropertyAtIndex && currentYear > newestYear ? index : newest;
    }, 0);
    const newestPropertyAtIndex = newestIndex >= 0 && newestIndex < selectedProperties.length ?
      selectedProperties[newestIndex] : null;
    const newestProperty = newestPropertyAtIndex?.id || null;

    // Find most spacious per price
    const spaciousPerPriceValues = selectedProperties.map(
      (p) => (p.features?.squareFeet || 0) / p.price
    );
    const mostSpaciousIndex = spaciousPerPriceValues.indexOf(
      Math.max(...spaciousPerPriceValues)
    );
    const mostSpaciousPropertyAtIndex = mostSpaciousIndex >= 0 && mostSpaciousIndex < selectedProperties.length ?
      selectedProperties[mostSpaciousIndex] : null;
    const mostSpaciousPerPrice = mostSpaciousPropertyAtIndex?.id || null;

    // Verification score (percentage of verified properties)
    const verifiedCount = selectedProperties.filter(
      (p) => p.verificationStatus === "verified"
    ).length;
    const verificationScore = (verifiedCount / selectedProperties.length) * 100;

    // Generate warnings
    const warnings: string[] = [];
    if (verificationScore < 50) {
      warnings.push("More than half of selected properties are not verified");
    }
    if (maxPrice / minPrice > 5) {
      warnings.push(
        "Large price variation detected - ensure properties are comparable"
      );
    }

    const typeVariety = new Set(selectedProperties.map((p) => p.type)).size;
    if (typeVariety > 1) {
      warnings.push(
        "Comparing different property types - results may not be meaningful"
      );
    }

    return {
      basic: {
        averagePrice: avgPrice,
        priceRange: { min: minPrice, max: maxPrice },
        averageBedrooms: Math.round(avgBedrooms * 10) / 10,
        averageSquareFeet: Math.round(avgSquareFeet),
      },
      advanced: {
        pricePerSquareFoot: pricePerSquareFoot.map((p) => Math.round(p)),
        bestValue,
        newestProperty,
        mostSpaciousPerPrice,
        verificationScore: Math.round(verificationScore),
      },
      warnings,
    };
  }, [selectedProperties]);

  // Status styling helper
  const getStatusStyle = (status: string) => {
    const styles = {
      verified: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      unverified: "bg-gray-100 text-gray-800",
    } as const;

    const validStatuses = ["verified", "pending", "unverified"] as const;
    const safeStatus =
      validStatuses.includes(status as (typeof validStatuses)[number]) ?
        (status as keyof typeof styles)
      : "unverified";

    return styles[safeStatus];
  };

  // Property highlight helper
  const getPropertyHighlight = (propertyId: string) => {
    if (!statistics) return null;

    const highlights = [];
    if (statistics.advanced.bestValue === propertyId)
      highlights.push("Best Value");
    if (statistics.advanced.newestProperty === propertyId)
      highlights.push("Newest");
    if (statistics.advanced.mostSpaciousPerPrice === propertyId)
      highlights.push("Most Space/Price");

    return highlights;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Enhanced Property Comparison Tool
        </h1>
        <p className="text-lg text-gray-600">
          Compare up to {maxProperties} properties with advanced analytics and
          validation
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-medium text-red-800">Error</h3>
          </div>
          <p className="text-sm text-red-700">{error.message}</p>
          <button
            onClick={clearError}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-medium text-yellow-800">Validation Warnings</h3>
          </div>
          <div className="space-y-1">
            {validationWarnings.map((warning, index) => (
              <p key={index} className="text-sm text-yellow-700">
                {warning}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Property Selection Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            Available Properties
          </h2>
          <div className="text-sm text-gray-600">
            {validatedProperties.length} properties available (
            {properties.length - validatedProperties.length} filtered out)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {validatedProperties.map((property) => {
            const isSelected = selectedProperties.some(
              (p) => p.id === String(property.id)
            );
            const highlights = getPropertyHighlight(String(property.id));
            const price =
              typeof property.price === "string" ?
                parseFloat(property.price)
              : property.price;
            const sqFt = property.area || property.features?.squareFeet || 1;
            const pricePerSqFt = Math.round(price / sqFt);

            return (
              <div
                key={property.id}
                className={`border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                  isSelected ?
                    "border-blue-500 bg-blue-50 shadow-lg transform scale-105"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
                onClick={() => handlePropertySelect(property)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handlePropertySelect(property);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${isSelected ? "Remove" : "Add"} ${property.title} ${isSelected ? "from" : "to"} comparison`}
              >
                {/* Property Image */}
                <div className="h-48 bg-gray-100 overflow-hidden relative">
                  {property.images?.[0] ?
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  : <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-12 h-12 text-gray-400" />
                    </div>
                  }

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      âœ“
                    </div>
                  )}

                  {/* Highlights */}
                  {highlights && highlights.length > 0 && (
                    <div className="absolute top-3 left-3 space-y-1">
                      {highlights.map((highlight) => (
                        <div
                          key={highlight}
                          className="bg-green-500 text-white text-xs px-2 py-1 rounded font-medium"
                        >
                          {highlight}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Verification Status */}
                  <div className="absolute bottom-3 left-3">
                    {getVerificationBadge(property.verificationStatus)}
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">
                    {property.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {typeof property.location === "string" ?
                      property.location
                    : property.location.address}
                  </p>

                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {formatComparePrice(
                      typeof property.price === "string" ?
                        parseFloat(property.price)
                      : property.price
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {formatComparePrice(pricePerSqFt)}/sq ft
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                    <div>{property.bedrooms || "N/A"} bed</div>
                    <div>{property.bathrooms || 0} bath</div>
                    <div>
                      {(
                        property.area ||
                        property.features?.squareFeet ||
                        0
                      ).toLocaleString()}{" "}
                      sq ft
                    </div>
                    <div>{property.features?.parkingSpaces || 0} parking</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Built {property.features?.yearBuilt || "N/A"}
                    </div>
                    <Link
                      to={`/property/${String(property.id)}`}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Replacement Dialog */}
      {showReplacementDialog && pendingProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Replace Property</h3>
            <p className="text-gray-600 mb-4">
              You&apos;ve reached the maximum of {maxProperties} properties.
              Which property would you like to replace with &quot;
              {pendingProperty.title}&quot;?
            </p>

            <div className="space-y-2 mb-6">
              {selectedProperties.map((property, index) => (
                <button
                  key={property.id}
                  onClick={() => handleReplaceProperty(index)}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{property.title}</div>
                  <div className="text-sm text-gray-600">
                    {typeof property.location === "string" ?
                      property.location
                    : property.location.address}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReplacementDialog(false);
                  setPendingProperty(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Statistics */}
      {statistics && (
        <div className="space-y-6">
          {/* Comparison Warnings */}
          {statistics.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-medium text-amber-800">
                  Comparison Insights
                </h3>
              </div>
              <div className="space-y-1">
                {statistics.warnings.map((warning, index) => (
                  <p key={index} className="text-sm text-amber-700">
                    {warning}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Basic Statistics */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                Comparison Statistics
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatComparePrice(statistics.basic.averagePrice)}
                </div>
                <div className="text-sm text-gray-600">Average Price</div>
              </div>

              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-green-600">
                  {formatComparePrice(statistics.basic.priceRange.min)} -{" "}
                  {formatComparePrice(statistics.basic.priceRange.max)}
                </div>
                <div className="text-sm text-gray-600">Price Range</div>
              </div>

              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {statistics.basic.averageBedrooms}
                </div>
                <div className="text-sm text-gray-600">Avg Bedrooms</div>
              </div>

              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {statistics.basic.averageSquareFeet.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Avg Square Feet</div>
              </div>
            </div>

            {/* Advanced Statistics */}
            {showAdvancedStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div className="text-lg font-bold text-green-600">
                      {statistics.advanced.verificationScore}%
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Verified Properties
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <div className="text-lg font-bold text-blue-600">
                      KES{" "}
                      {Math.round(
                        statistics.advanced.pricePerSquareFoot.reduce(
                          (a, b) => a + b,
                          0
                        ) / statistics.advanced.pricePerSquareFoot.length
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">Avg Price/Sq Ft</div>
                </div>

                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Maximize className="w-5 h-5 text-purple-600" />
                    <div className="text-lg font-bold text-purple-600">
                      {Math.round(
                        ((statistics.basic.priceRange.max -
                          statistics.basic.priceRange.min) /
                          statistics.basic.priceRange.min) *
                          100
                      )}
                      %
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">Price Variation</div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Comparison Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-900">
                Detailed Comparison
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-semibold text-gray-900">
                      Feature
                    </th>
                    {selectedProperties.map((property) => {
                      const highlights = getPropertyHighlight(property.id);
                      return (
                        <th
                          key={property.id}
                          className="text-left p-4 font-semibold text-gray-900 min-w-48"
                        >
                          <div className="truncate">{property.title}</div>
                          <div className="text-xs text-gray-600 font-normal">
                            {typeof property.location === "string" ?
                              property.location
                            : property.location.address}
                          </div>
                          {highlights && highlights.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {highlights.map((highlight) => (
                                <div
                                  key={highlight}
                                  className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium"
                                >
                                  {highlight}
                                </div>
                              ))}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">Price</td>
                    {selectedProperties.map((property) => (
                      <td
                        key={property.id}
                        className="p-4 text-2xl font-bold text-blue-600"
                      >
                        KES {property.price.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      Price per Sq Ft
                    </td>
                    {selectedProperties.map((property) => (
                      <td
                        key={property.id}
                        className="p-4 text-lg font-semibold text-green-600"
                      >
                        KES{" "}
                        {Math.round(
                          property.price / (property.features?.squareFeet || 1)
                        ).toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">Bedrooms</td>
                    {selectedProperties.map((property) => (
                      <td key={property.id} className="p-4 text-lg">
                        {property.features?.bedrooms || "N/A"}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">Bathrooms</td>
                    {selectedProperties.map((property) => (
                      <td key={property.id} className="p-4 text-lg">
                        {property.features?.bathrooms || 0}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      Square Feet
                    </td>
                    {selectedProperties.map((property) => (
                      <td key={property.id} className="p-4 text-lg">
                        {(property.features?.squareFeet || 0).toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      Parking Spaces
                    </td>
                    {selectedProperties.map((property) => (
                      <td key={property.id} className="p-4 text-lg">
                        {property.features?.parkingSpaces || 0}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      Year Built
                    </td>
                    {selectedProperties.map((property) => (
                      <td key={property.id} className="p-4 text-lg">
                        {property.features?.yearBuilt || "N/A"}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      Property Age
                    </td>
                    {selectedProperties.map((property) => (
                      <td key={property.id} className="p-4 text-lg">
                        {property.features?.yearBuilt ?
                          new Date().getFullYear() - property.features.yearBuilt
                        : "N/A"}{" "}
                        years
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      Verification Status
                    </td>
                    {selectedProperties.map((property) => (
                      <td key={property.id} className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${getStatusStyle(property.verificationStatus || "unverified")}`}
                        >
                          {property.verificationStatus || "unverified"}
                        </span>
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900 align-top">
                      Amenities
                    </td>
                    {selectedProperties.map((property) => (
                      <td key={property.id} className="p-4">
                        <div className="space-y-1">
                          {(property.features?.amenities || []).length > 0 ?
                            (property.features?.amenities || []).map(
                              (amenity: string) => (
                                <div
                                  key={amenity}
                                  className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block mr-1 mb-1"
                                >
                                  {amenity}
                                </div>
                              )
                            )
                          : <span className="text-gray-400 text-sm">
                              None listed
                            </span>
                          }
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Selected Properties Summary */}
      {selectedProperties.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">
              Selected for Comparison ({selectedProperties.length})
            </h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  // Export functionality would be implemented here
                  // const exportData = {
                  //   properties: selectedProperties,
                  //   statistics: statistics,
                  //   exportDate: new Date().toISOString(),
                  // };
                  window.alert(
                    "Export functionality would be implemented here"
                  );
                }}
                className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
              >
                Export Comparison
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCompare();
                  setValidationWarnings([]);
                  onComparisonChange?.([]);
                }}
                className="text-red-600 hover:text-red-800 font-medium px-3 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {selectedProperties.map((property) => (
              <div
                key={property.id}
                className="bg-white border rounded-lg p-3 flex items-center gap-3 min-w-0"
              >
                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {property.images?.[0] ?
                    <img
                      src={property.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  : <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-6 h-6 text-gray-400" />
                    </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {property.title}
                  </div>
                  <div className="text-gray-600 text-xs truncate">
                    {typeof property.location === "string" ?
                      property.location
                    : property.location.address}
                  </div>
                  <div className="text-blue-600 text-xs font-medium">
                    KES{" "}
                    {Math.round(
                      property.price / (property.features?.squareFeet || 1)
                    ).toLocaleString()}
                    /sq ft
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromCompare(property.id);
                    onComparisonChange?.(
                      displayProperties.filter((p) => p.id !== property.id)
                    );
                  }}
                  className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"
                  aria-label={`Remove ${property.title} from comparison`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          {selectedProperties.length >= 2 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2 text-sm">
                <div className="text-gray-600">Quick insights:</div>
                {statistics?.advanced.bestValue && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    Best value:{" "}
                    {
                      selectedProperties.find(
                        (p) => p.id === statistics.advanced.bestValue
                      )?.title
                    }
                  </span>
                )}
                {statistics?.advanced.newestProperty && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Newest:{" "}
                    {
                      selectedProperties.find(
                        (p) => p.id == statistics.advanced.newestProperty
                      )?.title
                    }
                  </span>
                )}
                {statistics &&
                  statistics.advanced.verificationScore === 100 && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      All properties verified âœ“
                    </span>
                  )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Empty State */}
      {selectedProperties.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <Home className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-2xl font-medium text-gray-900 mb-3">
            No Properties Selected
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Click on properties above to add them to your comparison. You can
            compare up to {maxProperties} properties at once
            {!allowMixedTypes && " of the same type"}.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Side-by-side comparison</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Advanced analytics</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Property validation</span>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Properties are automatically validated for data quality.
          {!allowMixedTypes &&
            " Only properties of the same type can be compared together."}{" "}
          Verified properties are recommended for accurate comparisons.
        </p>
      </div>
    </div>
  );
};

// Main component export
const PropertyCompare: React.FC<PropertyCompareProps> = (props) => {
  return <PropertyCompareInner {...props} />;
};

export default PropertyCompare;
