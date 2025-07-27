/**
 * COMPREHENSIVE IMAGE ASSET CONFIGURATION
 * ======================================
 * 
 * Centralized configuration for all image assets in the TripleCheck application.
 * This system provides type-safe access to all images with optimized loading strategies,
 * WebP support, and responsive image handling.
 */

export interface ImageAsset {
  webp?: string;
  jpg?: string;
  png?: string;
  svg?: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
}

export interface LogoAsset {
  svg: string;
  ico?: string;
  alt: string;
  sizes: {
    small: { width: number; height: number };
    medium: { width: number; height: number };
    large: { width: number; height: number };
    xl: { width: number; height: number };
  };
}

/**
 * BRAND ASSETS
 * ============
 * Primary brand elements including logos and icons
 */
export const brandAssets = {
  logo: {
    svg: '/assets/Artmark.svg',
    ico: '/assets/TripleCheck.ico',
    alt: 'TripleCheck - Secure Real Estate Verification',
    sizes: {
      small: { width: 24, height: 24 },
      medium: { width: 32, height: 32 },
      large: { width: 48, height: 48 },
      xl: { width: 64, height: 64 }
    }
  } as LogoAsset,
  
  favicon: {
    ico: '/assets/TripleCheck.ico',
    alt: 'TripleCheck Favicon'
  }
} as const;

/**
 * HERO SECTION ASSETS
 * ==================
 * Large format images for hero sections and landing pages
 */
export const heroAssets = {
  primary: {
    webp: '/assets/hero-bg.webp',
    jpg: '/assets/hero-bg.jpg',
    alt: 'African Property Trust - Verified Real Estate Platform',
    aspectRatio: '16/9'
  }
} as const;

/**
 * PROPERTY SAMPLE ASSETS
 * =====================
 * High-quality property images for demonstrations and placeholders
 */
export const propertyAssets = {
  placeholder: {
    jpg: '/assets/alice-pasqual-Olki5QpHxts-unsplash.jpg',
    alt: 'Modern residential property exterior',
    aspectRatio: '4/3'
  },
  
  sample1: {
    jpg: '/assets/diogo-brandao-cUXK9-kQfy4-unsplash.jpg',
    alt: 'Contemporary apartment building',
    aspectRatio: '4/3'
  },
  
  sample2: {
    jpg: '/assets/elizeu-dias-2EGNqazbAMk-unsplash.jpg',
    alt: 'Luxury residential complex',
    aspectRatio: '4/3'
  },
  
  sample3: {
    jpg: '/assets/maria-fernanda-pissioli-6BOGBGy2-sU-unsplash.jpg',
    alt: 'Modern commercial property',
    aspectRatio: '4/3'
  },
  
  sample4: {
    jpg: '/assets/e-fedorzyn-dS3qN-_VWuk-unsplash.jpg',
    alt: 'Urban residential development',
    aspectRatio: '4/3'
  },
  
  sample5: {
    jpg: '/assets/etty-fidele-YYfzJhfNU14-unsplash.jpg',
    alt: 'Premium property exterior',
    aspectRatio: '4/3'
  }
} as const;

/**
 * CUSTOMER & TESTIMONIAL ASSETS
 * =============================
 * Professional portraits for testimonials and user profiles
 */
export const customerAssets = {
  customer1: {
    png: '/assets/customer1.png',
    alt: 'Sarah Johnson - Property Investor',
    aspectRatio: '1/1'
  },
  
  customer2: {
    png: '/assets/customer2.png',
    alt: 'Michael Chen - Real Estate Agent',
    aspectRatio: '1/1'
  },
  
  customer3: {
    png: '/assets/customer3.png',
    alt: 'Grace Wanjiku - First-time Buyer',
    aspectRatio: '1/1'
  },
  
  entrepreneur: {
    jpg: '/assets/confident-entrepreneur-looking-camera-with-arms-folded-smiling.jpg',
    alt: 'Confident business professional',
    aspectRatio: '4/5'
  },
  
  africanPortrait: {
    jpg: '/assets/depositphotos_68088663-stock-photo-portrait-of-a-young-african.jpg',
    alt: 'Young African professional',
    aspectRatio: '4/5'
  }
} as const;

/**
 * BLOG & CONTENT ASSETS
 * =====================
 * Images for blog posts, articles, and content sections
 */
export const blogAssets = {
  post1: {
    webp: '/assets/blog1.webp',
    jpg: '/assets/blog1.jpg',
    alt: 'Real Estate Market Trends in Africa',
    aspectRatio: '16/9'
  },
  
  post2: {
    webp: '/assets/blog2.webp',
    jpg: '/assets/blog2.jpg',
    alt: 'Property Verification Best Practices',
    aspectRatio: '16/9'
  },
  
  post3: {
    webp: '/assets/blog3.webp',
    jpg: '/assets/blog3.jpg',
    alt: 'Investment Opportunities in African Real Estate',
    aspectRatio: '16/9'
  }
} as const;

/**
 * DECORATIVE & UI ASSETS
 * ======================
 * Supporting graphics and decorative elements
 */
export const decorativeAssets = {
  fun: {
    png: '/assets/fun.png',
    alt: 'Decorative element',
    aspectRatio: '1/1'
  }
} as const;

/**
 * CONSOLIDATED IMAGE CONFIGURATION
 * ===============================
 * Main export combining all asset categories
 */
export const images = {
  brand: brandAssets,
  hero: heroAssets,
  properties: propertyAssets,
  customers: customerAssets,
  blog: blogAssets,
  decorative: decorativeAssets
} as const;

/**
 * UTILITY FUNCTIONS
 * ================
 * Helper functions for working with image assets
 */

/**
 * Get the best available image format for a given asset
 * Prioritizes WebP for modern browsers with fallback to JPG/PNG
 */
export function getBestImageSrc(asset: ImageAsset): string {
  if (asset.webp && supportsWebP()) {
    return asset.webp;
  }
  return asset.jpg || asset.png || asset.svg || '';
}

/**
 * Get fallback image source for older browsers
 */
export function getFallbackImageSrc(asset: ImageAsset): string {
  return asset.jpg || asset.png || asset.svg || '';
}

/**
 * Check if browser supports WebP format
 */
function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(basePath: string, sizes: number[] = [400, 800, 1200]): string {
  return sizes
    .map(size => `${basePath}?w=${size} ${size}w`)
    .join(', ');
}

/**
 * Get logo source for specific size
 */
export function getLogoSrc(size: keyof typeof brandAssets.logo.sizes = 'medium'): string {
  return brandAssets.logo.svg;
}

/**
 * Get customer avatar source
 */
export function getCustomerAvatar(customerId: keyof typeof customerAssets): string {
  const customer = customerAssets[customerId];
  return (customer as any).png || (customer as any).jpg || '';
}

/**
 * Get property sample image
 */
export function getPropertySample(sampleId: keyof typeof propertyAssets): string {
  const property = propertyAssets[sampleId];
  return property.jpg || '';
}

/**
 * Get blog post image with WebP support
 */
export function getBlogImage(postId: keyof typeof blogAssets): { webp?: string; fallback: string; alt: string } {
  const post = blogAssets[postId];
  return {
    webp: post.webp,
    fallback: post.jpg || '',
    alt: post.alt
  };
}

/**
 * IMAGE LOADING STRATEGIES
 * ========================
 * Optimized loading configurations for different use cases
 */

export const loadingStrategies = {
  hero: {
    loading: 'eager' as const,
    fetchPriority: 'high' as const,
    decoding: 'sync' as const
  },
  
  aboveFold: {
    loading: 'eager' as const,
    fetchPriority: 'high' as const,
    decoding: 'async' as const
  },
  
  belowFold: {
    loading: 'lazy' as const,
    fetchPriority: 'low' as const,
    decoding: 'async' as const
  },
  
  avatar: {
    loading: 'lazy' as const,
    fetchPriority: 'low' as const,
    decoding: 'async' as const
  }
} as const;

/**
 * CSS CLASS MAPPINGS
 * ==================
 * Map image assets to corresponding CSS classes
 */

export const cssClassMappings = {
  // Logo classes
  'logo-small': brandAssets.logo.svg,
  'logo-primary': brandAssets.logo.svg,
  'logo-large': brandAssets.logo.svg,
  'logo-xl': brandAssets.logo.svg,
  
  // Hero backgrounds
  'hero-bg': heroAssets.primary.webp,
  'hero-bg-fallback': heroAssets.primary.jpg,
  
  // Property samples
  'property-placeholder': propertyAssets.placeholder.jpg,
  'property-sample-1': propertyAssets.sample1.jpg,
  'property-sample-2': propertyAssets.sample2.jpg,
  'property-sample-3': propertyAssets.sample3.jpg,
  'property-sample-4': propertyAssets.sample4.jpg,
  'property-sample-5': propertyAssets.sample5.jpg,
  
  // Customer avatars
  'customer-1': customerAssets.customer1.png,
  'customer-2': customerAssets.customer2.png,
  'customer-3': customerAssets.customer3.png,
  
  // Blog images
  'blog-1-webp': blogAssets.post1.webp,
  'blog-1-fallback': blogAssets.post1.jpg,
  'blog-2-webp': blogAssets.post2.webp,
  'blog-2-fallback': blogAssets.post2.jpg,
  'blog-3-webp': blogAssets.post3.webp,
  'blog-3-fallback': blogAssets.post3.jpg
} as const;

/**
 * TYPE EXPORTS
 * ============
 * Export types for use throughout the application
 */

export type ImageAssetKey = keyof typeof images;
export type LogoSize = keyof typeof brandAssets.logo.sizes;
export type PropertySampleKey = keyof typeof propertyAssets;
export type CustomerKey = keyof typeof customerAssets;
export type BlogPostKey = keyof typeof blogAssets;
export type LoadingStrategy = keyof typeof loadingStrategies;
export type CSSClassName = keyof typeof cssClassMappings;