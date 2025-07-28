import React, { memo, useMemo, useCallback } from "react";
import { FixedSizeList as List } from "react-window";

import ListingCard from "../../property/components/ListingCard";
import { Property } from "../types/property";

interface VirtualizedPropertyListProps {
  properties: Property[];
  height: number;
  width?: number | string;
  itemHeight: number;
  onPropertyClick: (property: Property) => void;
  className?: string;
  overscanCount?: number;
}

interface PropertyItemData {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
}

interface PropertyItemProps {
  index: number;
  style: React.CSSProperties;
  data: PropertyItemData;
}

// CSS classes to replace inline styles where possible
const itemStyles = {
  container: "px-2 py-2",
  notFound: "text-gray-500",
  emptyState: "flex items-center justify-center w-full",
  emptyStateText: "text-gray-500 text-center",
};

// Memoized PropertyItem component to prevent unnecessary re-renders
const PropertyItem = memo<PropertyItemProps>(({ index, style, data }) => {
  const { properties, onPropertyClick } = data;

  // Bounds checking prevents potential crashes
  if (index < 0 || index >= properties.length) {
    return (
      <div style={style} className={itemStyles.container}>
        <div className={itemStyles.notFound}>Property not found</div>
      </div>
    );
  }

  // eslint-disable-next-line security/detect-object-injection
  const property = properties[index];

  // Additional safety check for property existence
  if (!property) {
    return (
      <div style={style} className={itemStyles.container}>
        <div className={itemStyles.notFound}>Property not found</div>
      </div>
    );
  }

  return (
    <div style={style} className={itemStyles.container}>
      <ListingCard
        property={property}
        onClick={() => onPropertyClick(property)}
      />
    </div>
  );
});

PropertyItem.displayName = "PropertyItem";

export const VirtualizedPropertyList: React.FC<
  VirtualizedPropertyListProps
> = ({
  properties,
  height,
  width = "100%",
  itemHeight,
  onPropertyClick,
  className = "",
  overscanCount = 5,
}) => {
  // Memoize the item data to prevent unnecessary re-renders
  const itemData = useMemo<PropertyItemData>(
    () => ({
      properties,
      onPropertyClick,
    }),
    [properties, onPropertyClick]
  );

  // Memoize the key extractor for better performance with large lists
  const getItemKey = useCallback(
    (index: number) => {
      // Bounds checking for security and stability
      if (index < 0 || index >= properties.length) {
        return `property-fallback-${index}`;
      }

      // eslint-disable-next-line security/detect-object-injection
      const property = properties[index];
      return property && typeof property.id === "string" ?
          property.id
        : `property-${index}`;
    },
    [properties]
  );

  // Early return for empty state
  if (!properties || properties.length === 0) {
    return (
      <div
        className={`${itemStyles.emptyState} ${className}`}
        style={{ height }}
      >
        <div className={itemStyles.emptyStateText}>
          <p>No properties found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <List
        height={height}
        width={width}
        itemCount={properties.length}
        itemSize={itemHeight}
        itemData={itemData}
        itemKey={getItemKey}
        overscanCount={overscanCount}
        useIsScrolling={false}
      >
        {PropertyItem}
      </List>
    </div>
  );
};
