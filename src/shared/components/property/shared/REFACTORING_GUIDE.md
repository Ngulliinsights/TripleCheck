# Property Card Refactoring Guide

This guide shows how to refactor `PropertyCard` and `EnhancedLandCard` to use the new shared hooks and components.

## Shared Hooks Available

### 1. `useImageGallery`
Manages image gallery state and navigation.

```typescript
import { useImageGallery } from '../../../hooks/useImageGallery';

const gallery = useImageGallery({
  property,
  images: property.images || [],
  enableNavigation: true,
  enableFullscreen: true,
});
```

### 2. `usePropertyCardActions`
Handles all property card actions (save, share, view details, verify).

```typescript
import { usePropertyCardActions } from '../../../hooks/usePropertyCardActions';

const actions = usePropertyCardActions(property, {
  onSave,
  onShare,
  onViewDetails,
  onVerify,
  onClick,
});
```

### 3. `usePropertyFormatting`
Formats property data consistently.

```typescript
import { usePropertyFormatting } from '../../../hooks/usePropertyFormatting';

const { formattedPrice, locationString, displayTitle, displayDescription } = 
  usePropertyFormatting(property, {
    originalPrice: (property as ExtendedLandProperty).originalPrice,
    showUSDConversion: true,
    exchangeRate: 130,
  });
```

### 4. `usePropertyCompareActions`
Manages comparison functionality.

```typescript
import { usePropertyCompareActions } from '../../../hooks/usePropertyCompareActions';

const compareActions = usePropertyCompareActions({
  property,
  isInCompare,
  canAddMore,
  addToCompare,
  removeFromCompare,
  locationString,
});
```

### 5. `usePropertyCardState`
Manages UI state (hover, keyboard interactions).

```typescript
import { usePropertyCardState } from '../../../hooks/usePropertyCardState';

const { isHovered, handleMouseEnter, handleMouseLeave, handleKeyDown } = 
  usePropertyCardState();
```

## Shared Components Available

### 1. `PropertyImageSection`
Unified image section with badges, overlays, and actions.

```typescript
import { PropertyImageSection } from '../shared/PropertyImageSection';

<PropertyImageSection
  property={property}
  gallery={gallery}
  actions={actions}
  isHovered={isHovered}
  showQuickActions={showQuickActions}
  isInWishlist={isInWishlist}
  priority={priority}
  isInCompare={isInCompare}
  canAddMore={canAddMore}
  onCompareClick={compareActions.handleCompareClick}
  showVerificationBadge={true}
  showTrustScore={true}
  showImageCount={true}
/>
```

### 2. `QuickActionsOverlay`
Action buttons overlay for property cards.

```typescript
import { QuickActionsOverlay } from '../shared/QuickActionsOverlay';

<QuickActionsOverlay
  actions={actions}
  isInWishlist={isInWishlist}
  gallery={gallery}
  isInCompare={isInCompare}
  canAddMore={canAddMore}
  onCompareClick={compareActions.handleCompareClick}
/>
```

### 3. `PropertyFeatures`
Consistent feature display with multiple variants.

```typescript
import { PropertyFeatures } from '../shared/PropertyFeatures';

<PropertyFeatures
  property={property}
  locationString={locationString}
  variant="land" // or "standard" or "compact"
/>
```

## Example Refactored Component

```typescript
import React, { memo } from "react";
import { Card, CardContent } from "../../ui/card";
import { ImageGallery } from "../../images";
import { cn } from "../../../lib/utils";
import type { NormalizedProperty } from "../../../types/property";
import { usePropertyCompare, usePropertyCompareActions } from "../../../../property/contexts";
import {
  useImageGallery,
  usePropertyCardActions,
  usePropertyFormatting,
  usePropertyCompareActions,
  usePropertyCardState,
} from "../../../hooks";
import {
  PropertyImageSection,
  PropertyFeatures,
} from "../shared";

interface RefactoredPropertyCardProps {
  property: NormalizedProperty;
  className?: string;
  onClick?: (property: NormalizedProperty) => void;
  showQuickActions?: boolean;
  isInWishlist?: boolean;
  onSave?: (id: string) => void;
  onShare?: (id: string) => void;
  priority?: boolean;
}

export const RefactoredPropertyCard = memo<RefactoredPropertyCardProps>(
  ({
    property,
    className,
    onClick,
    showQuickActions = true,
    isInWishlist = false,
    onSave,
    onShare,
    priority = false,
  }) => {
    // Shared hooks
    const gallery = useImageGallery({
      property,
      images: property.images || [],
    });

    const actions = usePropertyCardActions(property, {
      onSave,
      onShare,
      onViewDetails: (id) => onClick?.(property),
    });

    const { formattedPrice, locationString, displayTitle, displayDescription } = 
      usePropertyFormatting(property);

    const { isHovered, handleMouseEnter, handleMouseLeave, handleKeyDown } = 
      usePropertyCardState();

    // Compare functionality
    const { selectedProperties, canAddMore } = usePropertyCompare();
    const { addToCompare, removeFromCompare } = usePropertyCompareActions();
    const isInCompare = selectedProperties.some(p => p.id === property.id);

    const compareActions = usePropertyCompareActions({
      property,
      isInCompare,
      canAddMore,
      addToCompare,
      removeFromCompare,
      locationString,
    });

    return (
      <>
        <Card
          className={cn(
            "group overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1",
            className
          )}
          onClick={actions.handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onKeyDown={(e) => handleKeyDown(e, () => onClick?.(property))}
          tabIndex={0}
        >
          <PropertyImageSection
            property={property}
            gallery={gallery}
            actions={actions}
            isHovered={isHovered}
            showQuickActions={showQuickActions}
            isInWishlist={isInWishlist}
            priority={priority}
            isInCompare={isInCompare}
            canAddMore={canAddMore}
            onCompareClick={compareActions.handleCompareClick}
          />

          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {displayTitle}
            </h3>

            <PropertyFeatures
              property={property}
              locationString={locationString}
              variant="compact"
            />

            {displayDescription && (
              <p className="text-gray-600 text-sm line-clamp-2">
                {displayDescription}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <p className="text-xl font-bold text-primary">
                {formattedPrice.primary}
              </p>
              {formattedPrice.secondary && (
                <span className="text-sm text-gray-500">
                  {formattedPrice.secondary}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {gallery.showGallery && (
          <ImageGallery
            images={gallery.galleryImages}
            onClose={gallery.closeGallery}
          />
        )}
      </>
    );
  }
);

RefactoredPropertyCard.displayName = "RefactoredPropertyCard";
```

## Migration Steps

1. **Install shared hooks**: Import the new hooks from `../../../hooks`
2. **Replace custom implementations**: Remove inline hook definitions
3. **Use shared components**: Replace custom image sections with `PropertyImageSection`
4. **Update prop interfaces**: Ensure compatibility with shared hook interfaces
5. **Test functionality**: Verify all features work with shared implementations
6. **Remove duplicate code**: Clean up redundant implementations

## Benefits

- **Reduced code duplication**: ~60% less code in each component
- **Consistent behavior**: Same logic across all property cards
- **Easier maintenance**: Single source of truth for common functionality
- **Better testing**: Shared hooks can be tested independently
- **Type safety**: Consistent interfaces across components