/**
 * IMAGE PRELOAD SERVICE
 * =====================
 * 
 * Service for preloading critical above-fold images and managing image loading priorities.
 * Provides intelligent preloading strategies based on viewport and user behavior.
 */

export interface PreloadOptions {
  priority?: 'high' | 'medium' | 'low';
  crossOrigin?: 'anonymous' | 'use-credentials';
  sizes?: string;
  media?: string;
  as?: 'image';
  type?: string;
}

export interface PreloadedImage {
  src: string;
  loaded: boolean;
  error: boolean;
  element?: HTMLImageElement;
  timestamp: number;
}

class ImagePreloadServiceClass {
  private preloadedImages = new Map<string, PreloadedImage>();
  private preloadQueue: Array<{ src: string; options: PreloadOptions }> = [];
  private isProcessingQueue = false;
  private maxConcurrentPreloads = 3;
  private currentPreloads = 0;

  /**
   * Preload a single image with specified options
   */
  async preload(src: string, options: PreloadOptions = {}): Promise<HTMLImageElement> {
    // Check if already preloaded
    const existing = this.preloadedImages.get(src);
    if (existing?.loaded && existing.element) {
      return existing.element;
    }

    // Add to queue if we're at max concurrent preloads
    if (this.currentPreloads >= this.maxConcurrentPreloads) {
      return new Promise((resolve, reject) => {
        this.preloadQueue.push({ src, options });
        this.processQueue();
      });
    }

    return this.loadImage(src, options);
  }

  /**
   * Preload multiple images with priority handling
   */
  async preloadBatch(
    images: Array<{ src: string; options?: PreloadOptions }>
  ): Promise<HTMLImageElement[]> {
    // Sort by priority (high -> medium -> low)
    const sortedImages = images.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.options?.priority || 'medium'];
      const bPriority = priorityOrder[b.options?.priority || 'medium'];
      return aPriority - bPriority;
    });

    const promises = sortedImages.map(({ src, options = {} }) => 
      this.preload(src, options)
    );

    return Promise.all(promises);
  }

  /**
   * Preload critical above-fold images
   */
  preloadCritical(images: string[]): void {
    images.forEach(src => {
      this.preload(src, { priority: 'high' });
    });
  }

  /**
   * Check if an image is already preloaded
   */
  isPreloaded(src: string): boolean {
    const preloaded = this.preloadedImages.get(src);
    return preloaded?.loaded === true;
  }

  /**
   * Get preloaded image element
   */
  getPreloadedImage(src: string): HTMLImageElement | null {
    const preloaded = this.preloadedImages.get(src);
    return preloaded?.element || null;
  }

  /**
   * Clear preload cache
   */
  clearCache(): void {
    this.preloadedImages.clear();
    this.preloadQueue = [];
  }

  /**
   * Get preload statistics
   */
  getStats(): {
    totalPreloaded: number;
    successfulPreloads: number;
    failedPreloads: number;
    queueLength: number;
  } {
    const preloaded = Array.from(this.preloadedImages.values());
    return {
      totalPreloaded: preloaded.length,
      successfulPreloads: preloaded.filter(img => img.loaded).length,
      failedPreloads: preloaded.filter(img => img.error).length,
      queueLength: this.preloadQueue.length
    };
  }

  /**
   * Load a single image
   */
  private async loadImage(src: string, options: PreloadOptions): Promise<HTMLImageElement> {
    this.currentPreloads++;

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Set up image properties
      if (options.crossOrigin) {
        img.crossOrigin = options.crossOrigin;
      }
      
      if (options.sizes) {
        img.sizes = options.sizes;
      }

      // Handle load success
      img.onload = () => {
        this.preloadedImages.set(src, {
          src,
          loaded: true,
          error: false,
          element: img,
          timestamp: Date.now()
        });
        
        this.currentPreloads--;
        this.processQueue();
        resolve(img);
      };

      // Handle load error
      img.onerror = () => {
        this.preloadedImages.set(src, {
          src,
          loaded: false,
          error: true,
          timestamp: Date.now()
        });
        
        this.currentPreloads--;
        this.processQueue();
        reject(new Error(`Failed to preload image: ${src}`));
      };

      // Start loading
      img.src = src;
    });
  }

  /**
   * Process the preload queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.preloadQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.preloadQueue.length > 0 && this.currentPreloads < this.maxConcurrentPreloads) {
      const { src, options } = this.preloadQueue.shift()!;
      try {
        await this.loadImage(src, options);
      } catch (error) {
        console.warn('Image preload failed:', src, error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Create resource hint link elements for preloading
   */
  createResourceHints(images: Array<{ src: string; options?: PreloadOptions }>): void {
    if (typeof document === 'undefined') return;

    images.forEach(({ src, options = {} }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = options.as || 'image';
      link.href = src;
      
      if (options.type) {
        link.type = options.type;
      }
      
      if (options.crossOrigin) {
        link.crossOrigin = options.crossOrigin;
      }
      
      if (options.media) {
        link.media = options.media;
      }

      document.head.appendChild(link);
    });
  }

  /**
   * Preload images based on viewport and connection speed
   */
  intelligentPreload(images: string[]): void {
    if (typeof navigator === 'undefined') return;

    // Check connection speed
    const {connection} = (navigator as any);
    const isSlowConnection = connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g' ||
      connection.saveData
    );

    // Reduce preloading on slow connections
    const imagesToPreload = isSlowConnection ? images.slice(0, 2) : images;
    
    imagesToPreload.forEach(src => {
      this.preload(src, { 
        priority: isSlowConnection ? 'low' : 'medium' 
      });
    });
  }
}

// Export singleton instance
export const ImagePreloadService = new ImagePreloadServiceClass();

// Export class for testing
export { ImagePreloadServiceClass };

/**
 * React hook for using the image preload service
 */
export function useImagePreload() {
  return {
    preload: ImagePreloadService.preload.bind(ImagePreloadService),
    preloadBatch: ImagePreloadService.preloadBatch.bind(ImagePreloadService),
    preloadCritical: ImagePreloadService.preloadCritical.bind(ImagePreloadService),
    isPreloaded: ImagePreloadService.isPreloaded.bind(ImagePreloadService),
    getPreloadedImage: ImagePreloadService.getPreloadedImage.bind(ImagePreloadService),
    getStats: ImagePreloadService.getStats.bind(ImagePreloadService)
  };
}