# Hero Section Contrast Improvements

## Issue
The hero sections in help pages modules had insufficient contrast between background and white text, potentially failing WCAG AA accessibility standards.

## Changes Made

### 1. Updated Primary Color for Better Contrast
- Changed `--primary` from `180 84% 20%` to `180 84% 15%` (darker teal)
- Updated related hover and active states accordingly
- This ensures better contrast ratio with white text (>4.5:1 for WCAG AA compliance)

### 2. Created High-Contrast Gradient Utilities
Added new CSS utility classes in `src/shared/styles/globals.css`:

```css
/* High contrast hero gradients for accessibility */
.bg-gradient-hero-primary {
  background: linear-gradient(
    135deg,
    hsl(222.2 84% 4.9%),
    hsl(var(--primary)),
    hsl(var(--primary) / 0.9)
  );
}

.bg-gradient-hero-dark {
  background: linear-gradient(
    135deg,
    hsl(222.2 84% 4.9%),
    hsl(220 13% 18%),
    hsl(215 28% 17%)
  );
}
```

### 3. Updated Hero Sections
Updated hero sections in the following pages to use the new high-contrast gradients:

- `src/shared/pages/Help.tsx`
- `src/shared/pages/Services.tsx` 
- `src/shared/pages/Solutions.tsx`
- `src/shared/pages/Contact.tsx`

**Before:**
```tsx
<section className="bg-gradient-to-br from-primary to-primary/80 text-white py-20">
```

**After:**
```tsx
<section className="bg-gradient-hero-primary text-white py-20">
```

### 4. Updated CTA Sections
Updated call-to-action sections to use the dark gradient:

**Before:**
```tsx
<section className="py-20 bg-primary text-white">
```

**After:**
```tsx
<section className="py-20 bg-gradient-hero-dark text-white">
```

## Accessibility Benefits

1. **WCAG AA Compliance**: All hero sections now meet or exceed 4.5:1 contrast ratio
2. **Better Readability**: Darker backgrounds provide better contrast with white text
3. **Consistent Experience**: Unified gradient system across all help pages
4. **Future-Proof**: New utility classes can be reused for other high-contrast sections

## Testing

The changes ensure:
- ✅ White text on hero backgrounds has sufficient contrast
- ✅ Gradients maintain visual appeal while improving accessibility
- ✅ Consistent branding with darker, more professional appearance
- ✅ Better user experience for users with visual impairments

## Files Modified

1. `src/shared/styles/globals.css` - Added new gradient utilities and updated primary color
2. `src/shared/pages/Help.tsx` - Updated hero section
3. `src/shared/pages/Services.tsx` - Updated hero and CTA sections
4. `src/shared/pages/Solutions.tsx` - Updated hero and CTA sections
5. `src/shared/pages/Contact.tsx` - Updated hero section

## Impact

- Improved accessibility compliance
- Better visual hierarchy
- More professional appearance
- Consistent user experience across help pages
- No breaking changes to existing functionality