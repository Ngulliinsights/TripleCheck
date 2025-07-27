# Global CSS Integration Guide

## 🎨 **CSS Classes Reference**

### **Logo Classes**
```css
.logo-small     /* 24px height */
.logo-primary   /* 32px height */
.logo-large     /* 48px height */
.logo-xl        /* 64px height */
```

### **Background Image Classes**
```css
/* Hero Backgrounds */
.hero-bg                /* WebP hero background */
.hero-bg-fallback       /* JPG fallback */

/* Property Images */
.property-placeholder   /* Default property image */
.property-sample-1      /* Sample property 1 */
.property-sample-2      /* Sample property 2 */
.property-sample-3      /* Sample property 3 */
.property-sample-4      /* Sample property 4 */
.property-sample-5      /* Sample property 5 */

/* Customer Avatars */
.customer-1             /* Customer avatar 1 */
.customer-2             /* Customer avatar 2 */
.customer-3             /* Customer avatar 3 */

/* Blog Images */
.blog-1-webp           /* Blog post 1 (WebP) */
.blog-1-fallback       /* Blog post 1 (JPG) */
.blog-2-webp           /* Blog post 2 (WebP) */
.blog-2-fallback       /* Blog post 2 (JPG) */
.blog-3-webp           /* Blog post 3 (WebP) */
.blog-3-fallback       /* Blog post 3 (JPG) */
```

### **Brand Color Classes**
```css
/* Background Colors */
.bg-brand-primary      /* Deep blue */
.bg-brand-secondary    /* Coral */
.bg-brand-accent       /* Gold */

/* Text Colors */
.text-brand-primary    /* Deep blue text */
.text-brand-secondary  /* Coral text */
.text-brand-accent     /* Gold text */

/* Gradients */
.bg-gradient-brand     /* Primary to secondary */
.bg-gradient-premium   /* Secondary to accent */
.bg-gradient-luxury    /* Accent to luxury purple */
```

### **Property Type Classes**
```css
/* Property Type Colors */
.text-property-residential
.text-property-commercial
.text-property-featured
.text-property-luxury

/* Property Type Backgrounds */
.bg-property-residential
.bg-property-commercial
.bg-property-featured
.bg-property-luxury

/* Property Type Borders */
.border-property-residential
.border-property-commercial
.border-property-featured
.border-property-luxury
```

### **Trust Status Classes**
```css
/* Trust Status Colors */
.text-trust-verified   /* Green */
.text-trust-pending    /* Amber */
.text-trust-warning    /* Orange */
.text-trust-danger     /* Red */

/* Trust Status Backgrounds */
.bg-trust-verified
.bg-trust-pending
.bg-trust-warning
.bg-trust-danger
```

### **Component Classes**
```css
/* Button Components */
.btn-primary           /* Primary button style */
.btn-secondary         /* Secondary button style */
.btn-accent            /* Accent button style */
.btn-destructive       /* Destructive action button */

/* Property Cards */
.property-card         /* Standard property card */
.property-card--featured /* Featured property card */

/* Trust Badges */
.trust-badge--verified
.trust-badge--pending
.trust-badge--warning
.trust-badge--danger

/* Property Badges */
.property-badge--residential
.property-badge--commercial
.property-badge--featured
.property-badge--luxury
```

### **Loading States**
```css
.image-loading         /* General image loading */
.logo-loading          /* Logo loading state */
.property-image-loading /* Property image loading */
.avatar-loading        /* Avatar loading state */
.loading-skeleton      /* General skeleton loader */
.shimmer              /* Shimmer animation */
```

## 🚀 **React Components Usage**

### **Logo Component**
```tsx
import { Logo } from '@/shared/components/ui/optimized-image';

<Logo size="large" variant="white" className="custom-class" />
```

### **HeroImage Component**
```tsx
import { HeroImage } from '@/shared/components/ui/optimized-image';

<HeroImage
  webpSrc="/assets/hero-bg.webp"
  fallbackSrc="/assets/hero-bg.jpg"
  alt="Hero background"
  overlay={true}
  overlayOpacity={0.4}
>
  <div className="hero-content">
    <h1>Welcome</h1>
  </div>
</HeroImage>
```

### **PropertyImage Component**
```tsx
import { PropertyImage } from '@/shared/components/ui/optimized-image';

<PropertyImage
  webpSrc="/assets/property.webp"
  fallbackSrc="/assets/property.jpg"
  alt="Modern apartment"
  variant="wide"
  propertyType="featured"
/>
```

### **Avatar Component**
```tsx
import { Avatar } from '@/shared/components/ui/optimized-image';

<Avatar
  fallbackSrc="/assets/customer1.png"
  alt="User name"
  size="lg"
  showBorder={true}
/>
```

### **OptimizedImage Component**
```tsx
import { OptimizedImage } from '@/shared/components/ui/optimized-image';

<OptimizedImage
  webpSrc="/assets/image.webp"
  fallbackSrc="/assets/image.jpg"
  alt="Description"
  loadingStrategy="belowFold"
  aspectRatio="16/9"
  objectFit="cover"
/>
```

## 📁 **Image Configuration**

### **Using the Images Config**
```tsx
import { images } from '@/shared/config/images';

// Access hero images
const heroImage = images.hero.primary;

// Access property samples
const propertyImage = images.properties.sample1;

// Access customer avatars
const customerAvatar = images.customers.customer1;

// Access blog images
const blogImage = images.blog.post1;
```

### **Utility Functions**
```tsx
import { 
  getBestImageSrc, 
  getFallbackImageSrc,
  getLogoSrc,
  getCustomerAvatar,
  getBlogImage 
} from '@/shared/config/images';

// Get best image format
const bestSrc = getBestImageSrc(imageAsset);

// Get fallback image
const fallbackSrc = getFallbackImageSrc(imageAsset);

// Get logo for specific size
const logoSrc = getLogoSrc('large');

// Get customer avatar
const avatarSrc = getCustomerAvatar('customer1');

// Get blog image with WebP support
const { webp, fallback, alt } = getBlogImage('post1');
```

## 🎯 **Best Practices**

### **Performance**
1. Use `HeroImage` for above-fold images with `priority={true}`
2. Use `loadingStrategy="belowFold"` for images below the fold
3. Always provide WebP and fallback sources
4. Use appropriate `aspectRatio` for consistent layouts

### **Accessibility**
1. Always provide meaningful `alt` text
2. Use semantic HTML structure
3. Ensure proper color contrast ratios
4. Test with screen readers

### **Responsive Design**
1. Use CSS classes for consistent spacing
2. Leverage aspect ratio utilities
3. Test on multiple screen sizes
4. Use fluid typography classes

### **Brand Consistency**
1. Use brand color classes instead of hardcoded colors
2. Follow the established color hierarchy
3. Use consistent button and component styles
4. Maintain proper logo sizing and placement

## 🔧 **Troubleshooting**

### **Images Not Loading**
1. Check file paths in `/public/assets/`
2. Verify WebP support detection
3. Ensure fallback images are provided
4. Check browser console for errors

### **CSS Classes Not Working**
1. Verify Tailwind CSS is properly configured
2. Check if global CSS is imported in `main.tsx`
3. Ensure CSS variables are defined
4. Check for CSS specificity conflicts

### **Performance Issues**
1. Optimize image file sizes
2. Use appropriate loading strategies
3. Implement proper caching headers
4. Monitor Core Web Vitals

## 📊 **Browser Support**

- **WebP Support**: Chrome 23+, Firefox 65+, Safari 14+
- **CSS Variables**: All modern browsers
- **Aspect Ratio**: Chrome 88+, Firefox 89+, Safari 15+
- **Lazy Loading**: Chrome 76+, Firefox 75+, Safari 15.4+

## 🚀 **Next Steps**

1. **Testing**: Test all components across different browsers and devices
2. **Optimization**: Monitor performance metrics and optimize as needed
3. **Documentation**: Keep this guide updated as new features are added
4. **Training**: Share this guide with team members

---

**TripleCheck Global CSS Integration** - Revolutionizing real estate verification through consistent, performant, and accessible design.