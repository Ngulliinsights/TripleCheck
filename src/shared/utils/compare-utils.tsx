/**
 * Unified Compare Utilities
 * 
 * Shared utility functions for all comparison functionality
 * to ensure consistency across components.
 */

import { CheckCircle, XCircle, Minus, AlertCircle } from "lucide-react";
import React from "react";

import { Badge } from "../components/ui/badge";
import type { 
  CompareProperty, 
  VerificationStatus, 
  LocationData, 
  PropertyFeatures,
  ComparisonValueResult 
} from "../types/compare";

// Constants
export const CURRENCY_CODE = "KES";
export const LOCATION_NOT_SPECIFIED = "Location not specified";
export const PRICE_DISPLAY_FALLBACK = "—";
export const DEFAULT_DESCRIPTION = "No description available";

/**
 * Unified price formatting for all compare components
 */
export const formatComparePrice = (price: number | string | undefined): string => {
  if (price == null) return PRICE_DISPLAY_FALLBACK;

  try {
    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    if (typeof numericPrice !== "number" || isNaN(numericPrice) || numericPrice < 0) {
      return PRICE_DISPLAY_FALLBACK;
    }

    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: CURRENCY_CODE,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericPrice);
  } catch (error) {
    console.warn("Failed to format price:", error);
    return `${CURRENCY_CODE} ${price}`;
  }
};

/**
 * Unified location formatting
 */
export const formatCompareLocation = (location: string | LocationData | unknown): string => {
  try {
    if (typeof location === "string" && location.trim()) {
      return location.trim();
    }
    
    if (location && typeof location === "object") {
      const locationObj = location as LocationData;
      return (
        locationObj.name ||
        locationObj.address ||
        locationObj.city ||
        LOCATION_NOT_SPECIFIED
      );
    }
  } catch (error) {
    console.warn("Failed to format location:", error);
  }
  return LOCATION_NOT_SPECIFIED;
};

/**
 * Unified property image handling
 */
export const safeGetPropertyImage = (property: CompareProperty): string | undefined => {
  try {
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      return property.images[0];
    }
  } catch (error) {
    console.warn("Failed to get property image:", error);
  }
  return undefined;
};

/**
 * Unified property title handling
 */
export const getComparePropertyTitle = (property?: CompareProperty): string => {
  try {
    return property?.title && String(property.title).trim() 
      ? String(property.title).trim()
      : "Untitled Property";
  } catch (error) {
    console.warn("Failed to get property title:", error);
    return "Untitled Property";
  }
};

/**
 * Unified verification badge component
 */
export const getVerificationBadge = (status: VerificationStatus | unknown): React.ReactElement => {
  try {
    const safeStatus = isValidVerificationStatus(status) ? status : undefined;
    
    const config = {
      verified: {
        className: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle,
        label: "Verified",
      },
      pending: {
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: AlertCircle,
        label: "Pending",
      },
      unverified: {
        className: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
        label: "Unverified",
      },
      draft: {
        className: "bg-gray-100 text-gray-800 border-gray-300",
        icon: Minus,
        label: "Draft",
      },
    };

    const finalConfig = config[safeStatus as keyof typeof config] ?? {
      className: "bg-gray-100 text-gray-800 border-gray-300",
      icon: Minus,
      label: "Unknown",
    };

    const Icon = finalConfig.icon;
    return (
      <Badge className={`flex items-center gap-1 ${finalConfig.className}`}>
        <Icon className="w-3 h-3" />
        {finalConfig.label}
      </Badge>
    );
  } catch (error) {
    console.warn("Failed to get verification badge:", error);
    return (
      <Badge className="bg-gray-100 text-gray-800 border-gray-300 flex items-center gap-1">
        <Minus className="w-3 h-3" />
        Unknown
      </Badge>
    );
  }
};

/**
 * Validation helpers
 */
export const isValidVerificationStatus = (status: unknown): status is VerificationStatus => {
  return (
    status === undefined ||
    ["verified", "pending", "unverified", "draft"].includes(status as string)
  );
};

export const isValidCompareProperty = (property: unknown): property is CompareProperty => {
  return (
    typeof property === "object" &&
    property !== null &&
    "id" in property &&
    "title" in property &&
    "price" in property
  );
};/*
*
 * Property feature accessors
 */
export const getPropertyFeatures = (property: CompareProperty | undefined): PropertyFeatures | null => {
  try {
    return property?.features || null;
  } catch (error) {
    console.warn("Failed to get property features:", error);
    return null;
  }
};

export const getFeatureValue = <K extends keyof PropertyFeatures>(
  property: CompareProperty | undefined,
  feature: K
): PropertyFeatures[K] | undefined => {
  try {
    const features = getPropertyFeatures(property);
    if (!features) return undefined;
    
    const allowedFeatures: ReadonlyArray<keyof PropertyFeatures> = [
      "bedrooms",
      "bathrooms", 
      "squareFeet",
      "parkingSpaces",
      "yearBuilt",
      "amenities",
    ];
    
    return allowedFeatures.includes(feature) ? features[feature] : undefined;
  } catch (error) {
    console.warn(`Failed to get feature value for ${String(feature)}:`, error);
    return undefined;
  }
};

/**
 * Property comparison utilities
 */
export const comparePropertyValues = (
  p1: CompareProperty | undefined,
  p2: CompareProperty | undefined,
  key: keyof CompareProperty
): ComparisonValueResult => {
  try {
    const v1 = p1?.[key];
    const v2 = p2?.[key];

    if (v1 === v2) return "equal";
    if (v1 == null || v2 == null) return "different";

    if (typeof v1 === "number" && typeof v2 === "number") {
      return v1 > v2 ? "higher" : "lower";
    }
    return "different";
  } catch (error) {
    console.warn(`Failed to compare property values for key ${String(key)}:`, error);
    return "different";
  }
};

export const compareFeatureValues = (
  p1: CompareProperty | undefined,
  p2: CompareProperty | undefined,
  feature: keyof PropertyFeatures
): ComparisonValueResult => {
  try {
    const v1 = getFeatureValue(p1, feature);
    const v2 = getFeatureValue(p2, feature);

    if (v1 === v2) return "equal";
    if (v1 == null || v2 == null) return "different";

    if (typeof v1 === "number" && typeof v2 === "number") {
      return v1 > v2 ? "higher" : "lower";
    }
    return "different";
  } catch (error) {
    console.warn(`Failed to compare feature values for ${String(feature)}:`, error);
    return "different";
  }
};

/**
 * Safe amenities accessor
 */
export const safeGetAmenities = (amenities: unknown): string[] => {
  if (Array.isArray(amenities)) {
    return amenities.filter((item): item is string => typeof item === "string");
  }
  return [];
};

/**
 * Property data normalization
 */
export const normalizePropertyForComparison = (property: unknown): CompareProperty | null => {
  try {
    if (!isValidCompareProperty(property)) {
      return null;
    }

    return {
      ...property,
      id: String(property.id),
      title: String(property.title || "Untitled Property"),
      price: typeof property.price === "string" ? parseFloat(property.price) : property.price,
      description: property.description || DEFAULT_DESCRIPTION,
    } as CompareProperty;
  } catch (error) {
    console.warn("Failed to normalize property for comparison:", error);
    return null;
  }
};

/**
 * URL parameter utilities for comparison
 */
export const getCompareUrlParams = (): string[] => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("properties")?.split(",").filter(Boolean) || [];
  } catch (error) {
    console.warn("Failed to parse URL parameters:", error);
    return [];
  }
};

export const updateCompareUrlParams = (propertyIds: string[]): void => {
  try {
    const params = new URLSearchParams(window.location.search);
    
    if (propertyIds.length > 0) {
      params.set("properties", propertyIds.join(","));
    } else {
      params.delete("properties");
    }

    const queryString = params.toString();
    const queryPart = queryString ? `?${queryString}` : "";
    const newUrl = `${window.location.pathname}${queryPart}`;
    window.history.replaceState({}, "", newUrl);
  } catch (error) {
    console.warn("Failed to update URL parameters:", error);
    // Don't break functionality if URL update fails
  }
};