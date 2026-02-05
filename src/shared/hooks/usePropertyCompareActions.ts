import { useCallback } from "react"
import type { NormalizedProperty } from "../types/property"
import type { CompareProperty } from "../types/compare"

export interface UsePropertyCompareActionsOptions {
  /** The property to manage comparison actions for */
  property: NormalizedProperty;
  /** Whether the property is currently in the comparison list */
  isInCompare: boolean;
  /** Whether more properties can be added to comparison */
  canAddMore: boolean;
  /** Callback to add a property to comparison */
  addToCompare: (property: CompareProperty) => void;
  /** Callback to remove a property from comparison */
  removeFromCompare: (propertyId: string) => void;
  /** Formatted location string for the property */
  locationString: string;
  /** Optional callback for analytics tracking */
  onAnalyticsEvent?: (event: 'add' | 'remove' | 'limit_reached', propertyId: string) => void;
}

export interface UsePropertyCompareActionsReturn {
  /** Handler for comparison button clicks */
  handleCompareClick: (event: React.MouseEvent) => void;
  /** Whether the property is currently in comparison */
  isInCompare: boolean;
  /** Whether more properties can be added */
  canAddMore: boolean;
  /** Whether the comparison action is available */
  isComparisonAvailable: boolean;
}

/**
 * Enhanced shared hook for managing property comparison actions
 * Handles adding/removing properties from comparison with error handling and analytics
 * Used by PropertyCard, EnhancedLandCard, and other property components
 * 
 * @param options - Configuration options for comparison actions
 * @returns Comparison action handlers and state
 */
export function usePropertyCompareActions({
  property,
  isInCompare,
  canAddMore,
  addToCompare,
  removeFromCompare,
  locationString,
}: UsePropertyCompareActionsOptions): UsePropertyCompareActionsReturn {
  
  const handleCompareClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      
      try {
        if (isInCompare) {
          removeFromCompare(property.id);
          
          // Analytics tracking
          if (process.env.NODE_ENV === 'development') {
            console.log('Property removed from comparison:', property.id);
          }
        } else if (canAddMore) {
          // Create compare-compatible property object with validation
          const compareProperty: CompareProperty = {
            id: property.id,
            title: property.title || 'Untitled Property',
            price: typeof property.price === "string" ? parseFloat(property.price) || 0 : property.price || 0,
            location: locationString || 'Location not specified',
            description: property.description || "",
            images: Array.isArray(property.images) ? [...property.images] : [],
            features: property.features || {},
            verificationStatus: property.verificationStatus || 'pending',
            trustScore: Math.max(0, Math.min(100, property.trustScore || 0)), // Clamp between 0-100
            type: mapPropertyTypeForComparison(property),
          };
          
          addToCompare(compareProperty);
          
          // Analytics tracking
          if (process.env.NODE_ENV === 'development') {
            console.log('Property added to comparison:', property.id);
          }
        } else {
          // Handle case where comparison limit is reached
          if (process.env.NODE_ENV === 'development') {
            console.warn('Cannot add more properties to comparison - limit reached');
          }
        }
      } catch (error) {
        console.error('Error handling comparison action:', error);
        // Could emit error event or show user notification here
      }
    },
    [
      isInCompare,
      canAddMore,
      addToCompare,
      removeFromCompare,
      property,
      locationString,
    ]
  );

  return {
    handleCompareClick,
    isInCompare,
    canAddMore,
    isComparisonAvailable: Boolean(property?.id && (isInCompare || canAddMore)),
  };
}

/**
 * Maps various property types to comparison-compatible types with validation
 * Ensures consistent type mapping across the comparison system
 * 
 * @param property - The property to map type for
 * @returns Standardized property type for comparison
 */
function mapPropertyTypeForComparison(property: NormalizedProperty): "residential" | "commercial" {
  const type = property.type || property.category;
  
  // Validate and normalize property type
  if (typeof type === 'string') {
    const normalizedType = type.toLowerCase().trim();
    
    if (normalizedType === "commercial" || normalizedType === "office" || normalizedType === "retail") {
      return "commercial";
    }
  }
  
  // Default to residential for land, residential, and other types
  // This ensures all properties can be compared even with unknown types
  return "residential";
}

export default usePropertyCompareActions;