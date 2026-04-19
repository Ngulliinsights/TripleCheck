import { useCallback } from "react"
import type { NormalizedProperty } from '@shared/types/property'
import type { CompareProperty } from "../../local/types/compare"

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
 * Shared hook for managing property comparison actions.
 * Handles adding/removing properties from comparison with error handling and analytics.
 * Used by PropertyCard, EnhancedLandCard, and other property components.
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
  onAnalyticsEvent,
}: UsePropertyCompareActionsOptions): UsePropertyCompareActionsReturn {

  const handleCompareClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();

      try {
        if (isInCompare) {
          removeFromCompare(property.id);
          onAnalyticsEvent?.('remove', property.id);
        } else if (canAddMore) {
          const compareProperty: CompareProperty = {
            id: property.id,
            title: property.title || 'Untitled Property',
            price: typeof property.price === 'string'
              ? parseFloat(property.price) || 0
              : property.price || 0,
            location: locationString || 'Location not specified',
            description: property.description || '',
            images: Array.isArray(property.images) ? [...property.images] : [],
            features: property.features || {},
            verificationStatus: property.verificationStatus || 'pending',
            // Clamp trust score between 0–100
            trustScore: Math.max(0, Math.min(100, property.trustScore || 0)),
            type: mapPropertyTypeForComparison(property),
          };

          addToCompare(compareProperty);
          onAnalyticsEvent?.('add', property.id);
        } else {
          onAnalyticsEvent?.('limit_reached', property.id);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Error handling comparison action:', error);
        }
      }
    },
    [isInCompare, canAddMore, addToCompare, removeFromCompare, property, locationString, onAnalyticsEvent]
  );

  return {
    handleCompareClick,
    isInCompare,
    canAddMore,
    isComparisonAvailable: Boolean(property?.id && (isInCompare || canAddMore)),
  };
}

/**
 * Maps various property types to the two-value set expected by the comparison system.
 * Defaults to "residential" for land and any unrecognised type so all properties remain comparable.
 */
function mapPropertyTypeForComparison(property: NormalizedProperty): 'residential' | 'commercial' {
  const type = property.type || property.category;

  if (typeof type === 'string') {
    const normalised = type.toLowerCase().trim();
    if (normalised === 'commercial' || normalised === 'office' || normalised === 'retail') {
      return 'commercial';
    }
  }

  return 'residential';
}

export default usePropertyCompareActions;