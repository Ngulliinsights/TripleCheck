import React, { forwardRef, memo, useMemo, useCallback } from "react"

import type { NormalizedProperty } from "../types/property"

import { PropertyCard } from "./property/PropertyCard"

import {
  EnterpriseVirtualizedList,
  EnterpriseVirtualizedListHandle,
} from "./VirtualizedList"

// Define specific analytics event properties type for better type safety
// Note: id can be string or number to match Property type flexibility
interface PropertyAnalyticsEventProperties {
  id: string | number;
  variant: string;
  timestamp: number;
  [key: string]: string | number | boolean;
}

// Analytics tracking function type - more specific than Record<string, any>
type AnalyticsTracker = (
  eventName: string,
  properties: PropertyAnalyticsEventProperties
) => void;

// Props interface for the property-specific list component
// This extends the generic virtualized list with property-specific features
export interface EnterprisePropertyListProps {
  properties: readonly NormalizedProperty[];
  height: number | string;
  width?: number | string;
  itemHeight?: number; // Defaults to 280px for property cards
  overscanCount?: number;
  onPropertyClick?: (property: NormalizedProperty) => void;
  onEndReached?: () => void;
  loading?: boolean;
  className?: string | undefined;
  scrollToIndex?: number;
  scrollToAlignment?: "auto" | "smart" | "center" | "start" | "end";
  // Performance optimizations
  enableAnalytics?: boolean; // Toggle analytics tracking
  viewMode?: "grid" | "list"; // Layout mode for proper styling
}

// Props interface for PropertyRow - explicitly handling optional properties
interface PropertyRowProps {
  property: NormalizedProperty;
  index: number;
  style: React.CSSProperties; // Positioning styles from react-window
  onPropertyClick: ((property: NormalizedProperty) => void) | undefined; // Explicitly allow undefined
  onAnalyticsTrack: AnalyticsTracker;
  viewMode?: "grid" | "list"; // Layout mode for proper styling
}

// Memoized property row component - this is where each property gets rendered
// Memoization is critical here because without it, every property card would
// re-render whenever any part of the list changes
const PropertyRow = memo<PropertyRowProps>(
  ({
    property,
    style,
    onPropertyClick,
    onAnalyticsTrack,
    viewMode = "grid",
  }) => {
    // Memoized click handler that combines user action with analytics
    // This prevents creating a new function on every render
    const handleViewDetails = useCallback(() => {
      // Only call onPropertyClick if it's defined - this handles the optional nature safely
      if (onPropertyClick) {
        onPropertyClick(property);
      }

      // Track the interaction for business intelligence
      onAnalyticsTrack("property_card_click", {
        id: property.id,
        variant: "list",
        timestamp: Date.now(),
      });
    }, [property, onPropertyClick, onAnalyticsTrack]);

    // Create a positioned wrapper that applies the react-window positioning
    const PositionedWrapper = ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      style: React.CSSProperties;
      className?: string;
    }) => <div {...props}>{children}</div>;

    return (
      <PositionedWrapper style={style} className="property-row-container">
        <div
          className="px-2 py-2 cursor-pointer property-grid-item"
          onClick={handleViewDetails}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleViewDetails();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`View details for ${property.title}`}
        >
          <PropertyCard
            property={property}
            {...(onPropertyClick && { onClick: onPropertyClick })}
            viewMode={viewMode}
            showQuickActions={false}
          />
        </div>
      </PositionedWrapper>
    );
  }
);

PropertyRow.displayName = "PropertyRow";

// Main component using forwardRef to allow parent components to control scrolling
export const EnterprisePropertyList = memo(
  forwardRef<EnterpriseVirtualizedListHandle, EnterprisePropertyListProps>(
    (
      {
        properties,
        height,
        width,
        itemHeight = 280, // Standard height for property cards
        overscanCount = 5, // Render 5 extra items above/below visible area
        onPropertyClick,
        onEndReached,
        loading = false,
        className,
        scrollToIndex,
        scrollToAlignment = "auto",
        enableAnalytics = true,
        viewMode = "grid",
      },
      ref // This ref gets passed through to the underlying virtualized list
    ) => {
      // Simple analytics tracking - can be enhanced later
      const track = useCallback(
        (eventName: string, properties: Record<string, unknown>) => {
          // For now, just log to console - can be replaced with real analytics
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.log("Analytics:", eventName, properties);
          }
        },
        []
      );

      // Memoized key extractor - this tells React how to identify each property
      // Using both ID and index ensures uniqueness even if properties have duplicate IDs
      const keyExtractor = useCallback(
        (property: NormalizedProperty, index: number) => `${property.id}-${index}`,
        [] // Empty dependency array since this logic never changes
      );

      // Memoized analytics handler that respects the enableAnalytics flag
      // This abstraction allows us to easily disable analytics in development or for privacy
      const handleAnalyticsTrack = useCallback<AnalyticsTracker>(
        (
          eventName: string,
          eventProperties: PropertyAnalyticsEventProperties
        ) => {
          if (enableAnalytics) {
            track(eventName, eventProperties);
          }
        },
        [track, enableAnalytics]
      );

      // Optimized render function that creates each property row
      // This is where the magic happens - each property gets wrapped in our PropertyRow
      const renderProperty = useCallback(
        (property: NormalizedProperty, index: number, style: React.CSSProperties) => (
          <PropertyRow
            property={property}
            index={index}
            style={style} // Critical: this contains positioning from react-window
            onPropertyClick={onPropertyClick} // Now properly typed to allow undefined
            onAnalyticsTrack={handleAnalyticsTrack}
            viewMode={viewMode}
          />
        ),
        [onPropertyClick, handleAnalyticsTrack, viewMode]
      );

      // Memoized loading component with accessible design
      // This shows while properties are being fetched from the server
      const loadingComponent = useMemo(
        () => (
          <div className="flex items-center justify-center h-full">
            <div
              className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
              aria-label="Loading properties"
            />
            <span className="ml-3 text-sm text-gray-600">
              Loading properties…
            </span>
          </div>
        ),
        [] // Never changes, so empty dependency array is safe
      );

      // Memoized empty state component with helpful messaging
      // This shows when no properties match the current filters/search
      const emptyComponent = useMemo(
        () => (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <img
              src="/empty-state/properties.svg"
              alt="No properties available"
              className="w-24 h-24 mb-4"
              loading="lazy" // Optimize image loading
            />
            <p className="font-medium text-base">No properties found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ),
        []
      );

      // Enhanced end reached handler that includes analytics tracking
      // This is called when the user scrolls near the bottom - perfect for infinite scroll
      const handleEndReached = useCallback(() => {
        // Call the parent's handler (likely to load more properties) if it exists
        if (onEndReached) {
          onEndReached();
        }

        // Track this event for understanding user engagement patterns
        if (enableAnalytics) {
          track("property_list_end_reached", {
            totalProperties: properties.length,
            timestamp: Date.now(),
          });
        }
      }, [onEndReached, enableAnalytics, track, properties.length]);

      // The main render - this is where we connect our property-specific logic
      // to the generic virtualized list component
      const listProps = {
        ref,
        items: properties,
        itemHeight,
        containerHeight: height,
        containerWidth: width ?? "100%",
        renderItem: renderProperty,
        keyExtractor,
        overscanCount,
        onEndReached: handleEndReached,
        loading,
        loadingComponent,
        emptyComponent,
        className: className ?? "",
        debounceMs: 100,
        ...(scrollToIndex != undefined && { scrollToIndex }),
        ...(scrollToAlignment != undefined && { scrollToAlignment }),
      };

      return <EnterpriseVirtualizedList<NormalizedProperty> {...listProps} />;
    }
  )
);

EnterprisePropertyList.displayName = "EnterprisePropertyList";
