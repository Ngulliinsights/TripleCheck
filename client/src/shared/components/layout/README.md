# Layout Components

## Navbar Overlap Solution

### Problem
The application uses a fixed navbar (`fixed top-0`) which overlaps with page content, especially headings and content that starts immediately after the navbar.

### Solution
We've implemented CSS utility classes to handle navbar spacing:

#### CSS Classes Available

1. **`.navbar-offset`** - For content that starts immediately after the navbar
   - Mobile: `padding-top: 5.5rem` (88px)
   - Desktop: `padding-top: 6rem` (96px)

2. **`.page-container`** - For full page containers
   - Mobile & Desktop: `padding-top: 6rem` (96px) + `padding-bottom: 2rem`

#### Usage Examples

```tsx
// For detail pages (PropertyDetails, LandDetails, etc.)
<div className="container mx-auto px-4 navbar-offset pb-8">
  <h1>Page Title</h1>
  {/* Content won't be hidden behind navbar */}
</div>

// For full page layouts
<div className="container mx-auto px-4 page-container">
  {/* Full page content with proper spacing */}
</div>
```

#### Pages Fixed
- ✅ LandDetails.tsx
- ✅ PropertyDetails.tsx  
- ✅ Dashboard.tsx
- ✅ UserProfile.tsx
- ✅ UserSettings.tsx
- ✅ SearchResults.tsx
- ✅ PropertyCompare.tsx
- ✅ PropertyEdit.tsx
- ✅ Inbox.tsx

#### Navigation Component
The Navigation component sets a CSS custom property `--nav-height` that updates based on scroll state:
- Not scrolled: `88px` (py-4 + content)
- Scrolled: `72px` (py-2 + content)

This ensures consistent spacing across the application.

### Best Practices

1. **For new pages**: Use `.navbar-offset` class instead of manual `pt-24` or similar
2. **For hero sections**: Hero sections typically don't need this fix as they're designed to work with the transparent navbar
3. **For pages with headers**: Always apply the offset to prevent content from being hidden

### Testing
To test if the fix is working:
1. Navigate to a detail page (e.g., `/land/1`)
2. Check that the page title/heading is fully visible
3. Scroll down and back up to ensure consistent spacing
4. Test on both mobile and desktop viewports