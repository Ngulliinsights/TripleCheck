/**
 * IMAGE OPTIMIZATION UTILITIES
 * ============================
 * 
 * Utilities for responsive image srcset generation, blur placeholder creation,
 * format detection, and advanced image optimization techniques.
 */

export interface ResponsiveBreakpoint {
  width: number;
  density?: number;
  condition?: string;
}

export interface SrcSetOptions {
  breakpoints?: ResponsiveBreakpoint[];
  formats?: ('webp' | 'avif' | 'jpg' | 'png')[];
  quality?: number;
  baseUrl?: string;
}

export interface BlurPlaceholderOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
}

export interface FormatSupport {
  webp: boolean;
  avif: boolean;
  heic: boolean;
}

/**
 * Default responsive breakpoints for image optimization
 */
export const DEFAULT_BREAKPOINTS: ResponsiveBreakpoint[] = [
  { width: 320, condition: '(max-width: 320px)' },
  { width: 640, condition: '(max-width: 640px)' },
  { width: 768, condition: '(max-width: 768px)' },
  { width: 1024, condition: '(max-width: 1024px)' },
  { width: 1280, condition: '(max-width: 1280px)' },
  { width: 1536, condition: '(max-width: 1536px)' },
  { width: 1920 }
];

/**
 * Generate responsive srcSet for different screen sizes and densities
 */
export function generateResponsiveSrcSet(
  baseSrc: string,
  options: SrcSetOptions = {}
): {
  srcSet: string;
  sizes: string;
  sources: Array<{ srcSet: string; type?: string; media?: string; sizes?: string }>;
} {
  const {
    breakpoints = DEFAULT_BREAKPOINTS,
    formats = ['webp', 'jpg'],
    quality = 80,
    baseUrl = ''
  } = options;

  const sources: Array<{ srcSet: string; type?: string; media?: string; sizes?: string }> = [];
  
  // Generate sources for each format
  formats.forEach(format => {
    const srcSetEntries: string[] = [];
    const sizesEntries: string[] = [];

    breakpoints.forEach(breakpoint => {
      const { width, density = 1, condition } = breakpoint;
      
      // Generate URL with parameters
      const url = generateOptimizedUrl(baseSrc, {
        width: width * density,
        quality,
        format,
        baseUrl
      });

      srcSetEntries.push(`${url} ${width}w`);
      
      if (condition) {
        sizesEntries.push(`${condition} ${width}px`);
      }
    });

    // Add default size
    sizesEntries.push('100vw');

    sources.push({
      srcSet: srcSetEntries.join(', '),
      type: getMimeType(format),
      sizes: sizesEntries.join(', ')
    });
  });

  // Generate fallback srcSet (usually JPG)
  const fallbackFormat = formats.includes('jpg') ? 'jpg' : formats[formats.length - 1];
  const fallbackSrcSet = breakpoints
    .map(bp => {
      const url = generateOptimizedUrl(baseSrc, {
        width: bp.width,
        quality,
        format: fallbackFormat,
        baseUrl
      });
      return `${url} ${bp.width}w`;
    })
    .join(', ');

  const sizes = breakpoints
    .filter(bp => bp.condition)
    .map(bp => `${bp.condition} ${bp.width}px`)
    .concat(['100vw'])
    .join(', ');

  return {
    srcSet: fallbackSrcSet,
    sizes,
    sources
  };
}

/**
 * Generate optimized image URL with parameters
 */
function generateOptimizedUrl(
  baseSrc: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    baseUrl?: string;
  }
): string {
  const { width, height, quality, format, baseUrl = '' } = options;
  
  // If using a CDN or image service, construct URL with parameters
  if (baseUrl && (baseUrl.includes('cloudinary') || baseUrl.includes('imagekit') || baseUrl.includes('vercel'))) {
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality) params.set('q', quality.toString());
    if (format) params.set('f', format);
    
    return `${baseUrl}${baseSrc}?${params.toString()}`;
  }
  
  // For local images, return as-is (would need server-side processing)
  return baseSrc;
}

/**
 * Generate blur-up placeholder using canvas
 */
export function generateBlurPlaceholder(
  imageSrc: string,
  options: BlurPlaceholderOptions = {}
): Promise<string> {
  const {
    width = 40,
    height = 40,
    quality = 10,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Set small canvas size for blur effect
        canvas.width = width;
        canvas.height = height;

        // Draw image scaled down
        ctx.drawImage(img, 0, 0, width, height);

        // Apply blur filter
        ctx.filter = 'blur(2px)';
        ctx.drawImage(canvas, 0, 0);

        // Convert to base64 data URL
        const mimeType = getMimeType(format);
        const dataUrl = canvas.toDataURL(mimeType, quality / 100);
        
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image for blur placeholder: ${imageSrc}`));
    };

    img.src = imageSrc;
  });
}

/**
 * Detect browser support for modern image formats
 */
export function detectImageFormat(): Promise<FormatSupport> {
  return Promise.all([
    checkWebPSupport(),
    checkAVIFSupport(),
    checkHEICSupport()
  ]).then(([webp, avif, heic]) => ({
    webp,
    avif,
    heic
  }));
}

/**
 * Check WebP support
 */
function checkWebPSupport(): Promise<boolean> {
  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Check AVIF support
 */
function checkAVIFSupport(): Promise<boolean> {
  return new Promise(resolve => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}

/**
 * Check HEIC support (mainly for Safari)
 */
function checkHEICSupport(): Promise<boolean> {
  return new Promise(resolve => {
    // HEIC support is mainly in Safari and requires specific conditions
    const isApple = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    // Simple heuristic - could be enhanced with actual format testing
    resolve(isApple && isSafari);
  });
}

/**
 * Get MIME type for image format
 */
function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    webp: 'image/webp',
    avif: 'image/avif',
    heic: 'image/heic',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml'
  };
  
  return mimeTypes[format.toLowerCase()] || 'image/jpeg';
}

/**
 * Calculate optimal image dimensions based on container and DPR
 */
export function calculateOptimalDimensions(
  containerWidth: number,
  containerHeight: number,
  devicePixelRatio: number = window.devicePixelRatio || 1
): { width: number; height: number } {
  return {
    width: Math.ceil(containerWidth * devicePixelRatio),
    height: Math.ceil(containerHeight * devicePixelRatio)
  };
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizesAttribute(breakpoints: ResponsiveBreakpoint[]): string {
  return breakpoints
    .filter(bp => bp.condition)
    .map(bp => `${bp.condition} ${bp.width}px`)
    .concat(['100vw'])
    .join(', ');
}

/**
 * Preload critical images with resource hints
 */
export function preloadCriticalImages(images: Array<{
  src: string;
  type?: string;
  media?: string;
  crossOrigin?: string;
}>): void {
  if (typeof document === 'undefined') return;

  images.forEach(({ src, type, media, crossOrigin }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    
    if (type) link.type = type;
    if (media) link.media = media;
    if (crossOrigin) link.crossOrigin = crossOrigin;
    
    document.head.appendChild(link);
  });
}

/**
 * Lazy load image with intersection observer
 */
export function createLazyImageLoader(
  threshold: number = 0.1,
  rootMargin: string = '50px'
) {
  if (typeof window === 'undefined' || !window.IntersectionObserver) {
    return null;
  }

  return new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          const srcSet = img.dataset.srcset;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
          
          if (srcSet) {
            img.srcset = srcSet;
            img.removeAttribute('data-srcset');
          }
          
          img.classList.remove('lazy');
          img.classList.add('loaded');
        }
      });
    },
    {
      threshold,
      rootMargin
    }
  );
}