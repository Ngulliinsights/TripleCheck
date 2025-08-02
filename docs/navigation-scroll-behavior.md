# Navigation Scroll Behavior System

## Overview

The TripleCheck application implements a sophisticated navigation scroll behavior system that provides smooth transitions between transparent and opaque navigation states while ensuring content never overlaps with the fixed navigation bar.

## Key Features

### 1. Dynamic Navigation Transparency
- **Transparent State**: When at the top of the page (scroll position ≤ 20px)
- **Opaque State**: When scrolled down (scroll position > 20px)
- **Smooth Transitions**: 300ms ease-out transitions between states

### 2. Dynamic Height Management
- **Expanded Height**: 88px when not scrolled (py-4 + content)
- **Compact Height**: 72px when scrolled (py-2 + content)
- **CSS Custom Property**: `--nav-height` automatically updated

### 3. Content Overlap Prevention
- **Navigation-Aware Spacing**: Automatic top padding for page content
- **Scroll Margin**: Headings and sections have proper scroll margins
- **Anchor Link Support**: Smooth scrolling with proper offset

## Implementation Components

### Core Navigation Components

#### 1. Navigation.tsx
The main navigation component with scroll behavior:

```typescript
// Enhanced scroll detection with CSS custom property updates
useEffect(() => {
  const handleScroll = () => {
    const shouldBeScrolled = scrollTop > 20;
    setIsScrolled(shouldBeScrolled);
    
    // Update CSS custom property for scroll-aware spacing
    document.documentElement.style.setProperty(
      '--nav-height', 
      shouldBeScrolled ? '72px' : '88px'
    );
  };
  // ... scroll event handling
}, []);
```

#### 2. EnhancedNavigation.tsx
Alternative navigation component with same behavior pattern.

### Utility Hooks

#### useNavigationSpacing.ts
Provides navigation-aware spacing utilities:

```typescript
export function useNavigationSpacing() {
  const [navHeight, setNavHeight] = useState(88);
  const [isScrolled, setIsScrolled] = useState(false);
  
  return {
    navHeight,
    isScrolled,
    getTopSpacing: (additionalSpacing = 0) => navHeight + additionalSpacing,
    getScrollMargin: (additionalMargin = 16) => navHeight + additionalMargin,
    navAwareSpacing: 'nav-aware-spacing',
    scrollMarginNav: 'scroll-margin-nav',
  };
}

export function usePageSpacing() {
  const { navHeight, isScrolled } = useNavigationSpacing();
  
  return {
    navHeight,
    isScrolled,
    pageStyle: { paddingTop: `${navHeight}px` },
    pageClassName: 'nav-aware-spacing',
  };
}
```

### CSS Utilities

#### Global CSS Classes (globals.css)

```css
/* CSS custom property for dynamic navigation height */
:root {
  --nav-height: 88px; /* Default navigation height */
}

/* Utility class for content that needs to account for fixed navigation */
.nav-aware-spacing {
  padding-top: var(--nav-height);
}

/* Scroll margin for headings to prevent navigation overlap */
.scroll-margin-nav {
  scroll-margin-top: calc(var(--nav-height) + 1rem);
}

/* Automatic scroll margins for all headings */
h1, h2, h3, h4, h5, h6 {
  scroll-margin-top: calc(var(--nav-height) + 1rem);
}

/* Special handling for sections with IDs (for anchor links) */
section[id], div[id] {
  scroll-margin-top: calc(var(--nav-height) + 0.5rem);
}
```

## Usage Patterns

### 1. Page Components

#### Method A: CSS Class (Recommended)
```tsx
export default function MyPage() {
  return (
    <div className="min-h-screen bg-background nav-aware-spacing">
      {/* Page content */}
    </div>
  );
}
```

#### Method B: Hook with Dynamic Styles
```tsx
import { usePageSpacing } from '../hooks/useNavigationSpacing';

export default function MyPage() {
  const { pageStyle } = usePageSpacing();
  
  return (
    <div className="min-h-screen bg-background" style={pageStyle}>
      {/* Page content */}
    </div>
  );
}
```

### 2. Hero Components

Remove hardcoded top padding since parent handles spacing:

```tsx
// ❌ Before: Hardcoded padding
<section className="relative min-h-screen pt-20">

// ✅ After: Let parent handle spacing
<section className="relative min-h-screen" style={{ paddingTop: 0 }}>
```

### 3. Headings and Sections

Use scroll-margin classes for proper anchor link behavior:

```tsx
// Automatic (via global CSS)
<h2 id="section-1">Section Title</h2>

// Manual (for custom spacing)
<h2 id="section-1" className="scroll-margin-nav">Section Title</h2>
```

## Performance Optimizations

### 1. Throttled Scroll Handling
- Uses `requestAnimationFrame` for smooth 60fps updates
- Prevents excessive re-renders with state comparison
- Proper cleanup to prevent memory leaks

### 2. CSS Custom Properties
- Single source of truth for navigation height
- Automatic updates across all components
- No JavaScript required for spacing calculations

### 3. Passive Event Listeners
- Scroll events use `{ passive: true }` for better performance
- Non-blocking scroll handling

## Browser Support

### Modern Browsers
- Full support for CSS custom properties
- Smooth scroll behavior
- Backdrop blur effects

### Fallbacks
- Graceful degradation for older browsers
- Reduced motion support via `prefers-reduced-motion`
- High contrast mode support

## Testing

### Manual Testing
Visit `/nav-test` to verify:
- Navigation transparency transitions
- Content spacing correctness
- Anchor link behavior
- Scroll margin effectiveness

### Automated Testing
- Unit tests for hook behavior
- Integration tests for scroll events
- Visual regression tests for navigation states

## Troubleshooting

### Common Issues

#### 1. Content Overlapping Navigation
**Cause**: Page not using navigation-aware spacing
**Solution**: Add `nav-aware-spacing` class or use `usePageSpacing` hook

#### 2. Anchor Links Hidden Behind Navigation
**Cause**: Missing scroll margins on target elements
**Solution**: Ensure headings have proper scroll margins (automatic via global CSS)

#### 3. Navigation Not Transitioning
**Cause**: Scroll event listener not attached
**Solution**: Check console for scroll handler errors

### Debug Information
The NavigationTest page (`/nav-test`) provides real-time debug information:
- Current navigation height
- Scroll state
- CSS custom property values

## Migration Guide

### From Hardcoded Spacing

1. **Remove hardcoded padding**:
   ```tsx
   // ❌ Remove
   <div className="pt-20">
   
   // ✅ Replace with
   <div className="nav-aware-spacing">
   ```

2. **Update hero components**:
   ```tsx
   // ❌ Remove hardcoded padding
   <section className="min-h-screen pt-20">
   
   // ✅ Let parent handle spacing
   <section className="min-h-screen">
   ```

3. **Update scroll margins**:
   ```tsx
   // ❌ Fixed scroll margin
   <h2 className="scroll-mt-20">
   
   // ✅ Dynamic scroll margin
   <h2 className="scroll-margin-nav">
   ```

## Future Enhancements

### Planned Features
- [ ] Navigation height customization per page
- [ ] Scroll progress indicator
- [ ] Smart navigation hiding on scroll down
- [ ] Mobile-specific navigation behavior
- [ ] Intersection Observer for section highlighting

### Performance Improvements
- [ ] Virtual scrolling for long pages
- [ ] Preload critical navigation states
- [ ] Service worker caching for navigation assets