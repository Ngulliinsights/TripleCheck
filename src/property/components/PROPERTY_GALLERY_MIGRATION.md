# PropertyGallery Migration Guide

## Why Remove PropertyGallery?

The `PropertyGallery` component is redundant because:

1. **No Production Usage**: Only used in tests, not in actual application code
2. **Thin Wrapper**: Just converts `PropertyImage[]` to `GalleryImage[]` and calls `ImageGallery`
3. **Unnecessary Abstraction**: Adds complexity without providing value
4. **Maintenance Overhead**: Requires maintaining tests, types, and exports

## Migration Steps

### 1. Direct ImageGallery Usage

Instead of:
```tsx
import { PropertyGallery } from './components/PropertyGallery';

<PropertyGallery
  images={propertyImages}
  propertyTitle="My Property"
  showThumbnails={true}
  enableVirtualTour={true}
/>
```

Use directly:
```tsx
import { ImageGallery } from '../../shared/components/images/ImageGallery';

// Convert your property images to gallery format
const galleryImages = propertyImages.map(img => ({
  id: img.id,
  src: img.url,
  alt: img.alt,
  category: img.type,
  caption: img.caption,
  is360: img.is360
}));

<ImageGallery
  images={galleryImages}
  categories={['exterior', 'interior', 'amenity', 'floorplan']}
  enableFullscreen={true}
  showThumbnails={true}
  enable360={true}
/>
```

### 2. Enhanced Property Cards Already Handle This

The new property cards (PropertyCard, EnhancedLandCard) already integrate ImageGallery directly:

```tsx
// In PropertyCard.tsx - already implemented
const galleryImages: GalleryImage[] = useMemo(() => 
  images.map((src, index) => ({
    id: `${property.id}-${index}`,
    src,
    alt: `${property.title} - View ${index + 1}`,
    category: property.landType,
    caption: index === 0 ? "Primary view" : `Additional view ${index}`,
  })), [images, property.id, property.title, property.landType]
);
```

### 3. Utility Function for Conversion (if needed)

If you need the conversion logic elsewhere, create a utility:

```tsx
// src/property/utils/imageUtils.ts
import type { GalleryImage } from '../../shared/components/images/ImageGallery';

interface PropertyImage {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly caption?: string;
  readonly type: 'exterior' | 'interior' | 'amenity' | 'floorplan' | 'virtual-tour';
  readonly is360?: boolean;
}

export function convertPropertyImagesToGallery(
  images: PropertyImage[]
): GalleryImage[] {
  return images.map(img => ({
    id: img.id,
    src: img.url,
    alt: img.alt,
    category: img.type,
    caption: img.caption,
    is360: img.is360
  }));
}

export function getImageCategories(images: PropertyImage[]): string[] {
  return [...new Set(images.map(img => img.type))];
}
```

## Files to Remove

1. `src/property/components/PropertyGallery.tsx`
2. `src/property/components/__tests__/PropertyGallery.test.tsx`
3. `src/property/components/__tests__/PropertyGallery.performance.test.tsx`
4. Remove from `src/property/index.ts` exports
5. Update accessibility tests to use ImageGallery directly

## Benefits of Removal

1. **Reduced Bundle Size**: One less component to bundle
2. **Simplified Architecture**: Direct usage of ImageGallery
3. **Better Performance**: No unnecessary wrapper overhead
4. **Easier Maintenance**: Fewer components to maintain
5. **Clearer Intent**: Direct usage shows exactly what's happening

## Backward Compatibility

If you need to maintain backward compatibility temporarily:

```tsx
// src/property/components/PropertyGallery.tsx (deprecated)
import { ImageGallery } from '../../shared/components/images/ImageGallery';

/**
 * @deprecated Use ImageGallery directly from shared/components/images/ImageGallery
 * This component will be removed in the next major version.
 */
export function PropertyGallery(props: PropertyGalleryProps) {
  console.warn('PropertyGallery is deprecated. Use ImageGallery directly.');
  
  // ... existing implementation
}
```

## Recommended Action

**Remove PropertyGallery entirely** since:
- No production code uses it
- Tests can be updated to use ImageGallery directly
- Property cards already handle image galleries properly
- It adds no value over direct ImageGallery usage