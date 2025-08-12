# Design Document

## Overview

The property grid image overlapping issue stems from missing CSS containment and positioning styles that were previously handled by inline styles. The problem occurs specifically in the grid view where property images break out of their container boundaries and overlap adjacent images. The solution involves implementing proper CSS containment, aspect ratio handling, and responsive grid layout styles.

## Architecture

### Current State Analysis

The current system has:
- **VirtualizedPropertyList**: Handles virtualized rendering with proper positioning via `style` prop from react-window
- **ListingCard**: Contains property image and content with basic CSS classes
- **PropertyDataGrid**: Missing component that should handle grid-specific layout
- **Design System CSS**: Contains comprehensive styling but lacks property-specific grid containment

### Root Cause

The issue occurs because:
1. Inline styles that provided image containment were removed during CSS migration
2. The `aspect-video` class alone doesn't provide sufficient containment in grid layouts
3. Missing CSS rules for proper image positioning within virtualized grid items
4. No explicit width/height constraints on property card containers in grid mode

## Components and Interfaces

### 1. Enhanced CSS Grid Containment

```css
/* Property Grid Specific Styles */
.property-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.property-grid-item {
  contain: layout style paint;
  width: 100%;
  max-width: 400px;
  height: fit-content;
}

.property-card-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  contain: layout paint;
}

.property-card-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
```

### 2. PropertyDataGrid Component

```typescript
interface PropertyDataGridProps {
  items: Property[];
  loading: boolean;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  renderItem: (property: Property, style: React.CSSProperties) => React.ReactNode;
  itemHeight: number;
  gridItemSize: { width: number; height: number };
  containerHeight: number;
  containerWidth: number;
  emptyState?: React.ReactNode;
}
```

### 3. Enhanced ListingCard Grid Mode

The ListingCard component needs conditional styling based on grid vs list mode:

```typescript
interface ListingCardProps {
  property: Property;
  className?: string;
  onClick?: (() => void) | ((property: Property) => void);
  viewMode?: 'grid' | 'list'; // New prop for layout-specific styling
}
```

## Data Models

### Property Image Structure

```typescript
interface PropertyImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

interface Property {
  id: string | number;
  title: string;
  images: string[] | PropertyImage[];
  // ... other properties
}
```

## Error Handling

### Image Loading Failures

1. **Fallback Images**: Implement proper placeholder images for different property types
2. **Loading States**: Show skeleton loaders while images are loading
3. **Error Boundaries**: Catch and handle image loading errors gracefully

### Layout Breakage Prevention

1. **CSS Containment**: Use `contain: layout paint` to prevent layout thrashing
2. **Aspect Ratio Preservation**: Ensure images maintain proper aspect ratios
3. **Overflow Control**: Prevent images from breaking container boundaries

## Testing Strategy

### Visual Regression Testing

1. **Grid Layout Tests**: Verify property cards maintain proper spacing and alignment
2. **Image Containment Tests**: Ensure images don't overlap in various screen sizes
3. **Responsive Tests**: Test grid behavior across different viewport sizes

### Unit Tests

1. **PropertyDataGrid Component**: Test grid rendering and view mode switching
2. **ListingCard Grid Mode**: Test conditional styling based on view mode
3. **CSS Class Application**: Verify correct CSS classes are applied

### Integration Tests

1. **VirtualizedPropertyList**: Test integration with PropertyDataGrid
2. **PropertiesResidential Page**: Test complete grid functionality
3. **Performance Tests**: Ensure virtualization works correctly with new styles

## Implementation Approach

### Phase 1: CSS Foundation
- Add property grid containment styles to design-system.css
- Implement proper image container classes
- Add responsive grid layout utilities

### Phase 2: Component Updates
- Create PropertyDataGrid component
- Update ListingCard with grid mode support
- Enhance VirtualizedPropertyList integration

### Phase 3: Integration
- Update PropertiesResidential to use new components
- Fix TypeScript errors and missing imports
- Test across different screen sizes

### Phase 4: Optimization
- Implement performance optimizations
- Add proper loading states
- Enhance accessibility features

## CSS Architecture

### Grid Container Styles

```css
.property-grid-virtualized {
  contain: strict;
  height: 100%;
  width: 100%;
}

.property-grid-virtualized .property-row-container {
  contain: layout style;
  padding: 0.5rem;
}

.property-grid-virtualized .property-card {
  width: 100%;
  height: 100%;
  max-width: none;
  contain: layout paint;
}
```

### Image Containment Fixes

```css
.property-card .aspect-video {
  position: relative;
  contain: layout paint;
  isolation: isolate;
}

.property-card .aspect-video img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  will-change: transform;
}
```

### Responsive Grid Behavior

```css
@media (max-width: 640px) {
  .property-grid-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .property-grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) {
  .property-grid-container {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}
```

## Performance Considerations

### CSS Containment
- Use `contain: layout paint` to isolate property cards
- Implement `will-change: transform` for hover effects
- Use `isolation: isolate` to create new stacking contexts

### Image Optimization
- Implement lazy loading for images
- Use proper aspect ratios to prevent layout shifts
- Add image preloading for critical above-the-fold content

### Virtualization Compatibility
- Ensure CSS doesn't interfere with react-window positioning
- Maintain proper height calculations for virtualized items
- Use relative positioning within absolute positioned containers