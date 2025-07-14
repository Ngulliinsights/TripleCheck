/**
 * Centralized image management system with WebP optimization support
 * Images are located in client/public/assets/
 */

// Base path for all images - can be easily modified for different environments
const BASE_PATH = '/assets' as const;

// Helper function to generate image paths with proper fallback structure
const createImagePath = (filename: string): string => `${BASE_PATH}/${filename}`;

// Helper function to create WebP/fallback image objects
const createResponsiveImage = (baseName: string, extension: string = 'jpg') => ({
  webp: createImagePath(`${baseName}.webp`),
  [extension]: createImagePath(`${baseName}.${extension}`),
  // Default fallback for browsers that don't support WebP
  fallback: createImagePath(`${baseName}.${extension}`)
});

// Type definitions for better TypeScript support
export type ImageFormat = 'webp' | 'jpg' | 'png' | 'svg';
export type ResponsiveImage = {
  webp: string;
  jpg?: string;
  png?: string;
  fallback: string;
};

// Main images configuration object
export const images = {
  hero: createResponsiveImage('hero-bg', 'jpg'),
  
  blog: {
    1: createResponsiveImage('blog1', 'jpg'),
    2: createResponsiveImage('blog2', 'jpg'),
    3: createResponsiveImage('blog3', 'jpg'),
  },
  
  customers: {
    // PNG images typically don't need WebP conversion due to transparency
    1: createImagePath('confident-entrepreneur-looking-camera-with-arms-folded-smiling.jpg'),
    2: createImagePath('elizeu-dias-2EGNqazbAMk-unsplash.jpg'),
    3: createImagePath('etty-fidele-YYfzJhfNU14-unsplash.jpg'),
  },
  
  // SVG logos don't need WebP conversion
  logo: createImagePath('Artmark.svg'),
} as const;

// Utility function to get the best image format for a given browser
export const getBestImageFormat = (imageObj: ResponsiveImage): string => {
  // Check if browser supports WebP
  if (typeof window !== 'undefined') {
    const canvas = document.createElement('canvas');
    const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    if (supportsWebP && imageObj.webp) {
      return imageObj.webp;
    }
  }
  
  // Return fallback image
  return imageObj.fallback || imageObj.jpg || imageObj.png || '';
};

// Utility function for lazy loading images with intersection observer
export const createLazyImageLoader = (imageSrc: string, placeholder?: string) => {
  return {
    src: placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmNWY1ZjUiLz48L3N2Zz4=',
    'data-src': imageSrc,
    loading: 'lazy' as const,
  };
};

// Preload critical images for better performance
export const preloadCriticalImages = () => {
  if (typeof window !== 'undefined') {
    const criticalImages = [
      getBestImageFormat(images.hero),
      images.logo,
    ];
    
    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }
};

// Generate srcset for responsive images
export const generateSrcSet = (baseName: string, sizes: number[] = [400, 800, 1200]): string => {
  return sizes
    .map(size => `${BASE_PATH}/${baseName}-${size}w.webp ${size}w`)
    .join(', ');
};

// Export individual image categories for easier imports
export const heroImages = images.hero;
export const blogImages = images.blog;
export const customerImages = images.customers;
export const logoImage = images.logo;

// Backward compatibility - ensure existing code continues to work
export default images;