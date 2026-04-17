/**
 * Resource hints system for preload, prefetch, and preconnect optimization
 * Implements intelligent resource loading strategies for critical assets
 */

export interface ResourceHint {
  href: string;
  as?: string;
  type?: string;
  crossorigin?: 'anonymous' | 'use-credentials';
  media?: string;
  priority?: 'high' | 'low';
}

export interface PreloadConfig {
  fonts: string[];
  images: string[];
  scripts: string[];
  styles: string[];
  critical: string[];
}

export interface PrefetchConfig {
  routes: string[];
  assets: string[];
  data: string[];
}

export interface PreconnectConfig {
  origins: string[];
  dns: string[];
}

export interface ResourceHintMetrics {
  preloaded: number;
  prefetched: number;
  preconnected: number;
  hitRate: number;
  loadTimeImprovement: number;
  timestamp: number;
}

class ResourceHintsManager {
  private preloadedResources = new Set<string>();
  private prefetchedResources = new Set<string>();
  private preconnectedOrigins = new Set<string>();
  private resourceLoadTimes = new Map<string, number>();
  private hintMetrics: ResourceHintMetrics = {
    preloaded: 0,
    prefetched: 0,
    preconnected: 0,
    hitRate: 0,
    loadTimeImprovement: 0,
    timestamp: Date.now(),
  };

  constructor() {
    this.initializeTracking();
  }

  private initializeTracking(): void {
    if (typeof window === 'undefined') return;

    // Track resource loading performance
    this.trackResourcePerformance();
    
    // Auto-detect and preload critical resources
    this.autoDetectCriticalResources();
  }

  private trackResourcePerformance(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.resourceLoadTimes.set(entry.name, entry.duration || 0);
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Failed to track resource performance:', error);
    }
  }

  private autoDetectCriticalResources(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.detectCriticalImages();
        this.detectCriticalFonts();
      });
    } else {
      this.detectCriticalImages();
      this.detectCriticalFonts();
    }
  }

  private detectCriticalImages(): void {
    // Detect above-the-fold images
    const images = Array.from(document.querySelectorAll('img'));
    const viewportHeight = window.innerHeight;

    images.forEach((img) => {
      const rect = img.getBoundingClientRect();
      if (rect.top < viewportHeight && img.src && !this.preloadedResources.has(img.src)) {
        this.preloadResource({
          href: img.src,
          as: 'image',
          priority: 'high',
        });
      }
    });
  }

  private detectCriticalFonts(): void {
    // Detect fonts used in critical CSS
    const stylesheets = Array.from(document.styleSheets);
    const fontUrls = new Set<string>();

    try {
      stylesheets.forEach((stylesheet) => {
        if (stylesheet.cssRules) {
          Array.from(stylesheet.cssRules).forEach((rule) => {
            if (rule instanceof CSSFontFaceRule) {
              const src = rule.style.getPropertyValue('src');
              const urlMatch = src.match(/url\(['"]?([^'"]+)['"]?\)/);
              if (urlMatch) {
                fontUrls.add(urlMatch[1]);
              }
            }
          });
        }
      });

      fontUrls.forEach((url) => {
        if (!this.preloadedResources.has(url)) {
          this.preloadResource({
            href: url,
            as: 'font',
            type: 'font/woff2',
            crossorigin: 'anonymous',
            priority: 'high',
          });
        }
      });
    } catch (error) {
      console.warn('Failed to detect critical fonts:', error);
    }
  }

  public preloadResource(hint: ResourceHint): void {
    if (this.preloadedResources.has(hint.href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = hint.href;
    
    if (hint.as) link.as = hint.as;
    if (hint.type) link.type = hint.type;
    if (hint.crossorigin) link.crossOrigin = hint.crossorigin;
    if (hint.media) link.media = hint.media;

    // Set fetchpriority if supported
    if ('fetchPriority' in link && hint.priority) {
      (link as any).fetchpriority = hint.priority;
    }

    document.head.appendChild(link);
    this.preloadedResources.add(hint.href);
    this.hintMetrics.preloaded++;

    console.log(`Preloaded resource: ${hint.href}`);
  }

  public prefetchResource(href: string, as?: string): void {
    if (this.prefetchedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    
    if (as) link.as = as;

    document.head.appendChild(link);
    this.prefetchedResources.add(href);
    this.hintMetrics.prefetched++;

    console.log(`Prefetched resource: ${href}`);
  }

  public preconnectOrigin(origin: string, crossorigin?: boolean): void {
    if (this.preconnectedOrigins.has(origin)) return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    
    if (crossorigin) link.crossOrigin = 'anonymous';

    document.head.appendChild(link);
    this.preconnectedOrigins.add(origin);
    this.hintMetrics.preconnected++;

    console.log(`Preconnected to origin: ${origin}`);
  }

  public dnsPrefetch(hostname: string): void {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = hostname;

    document.head.appendChild(link);
    console.log(`DNS prefetched: ${hostname}`);
  }

  public preloadCriticalAssets(config: PreloadConfig): void {
    // Preload fonts
    config.fonts.forEach((font) => {
      this.preloadResource({
        href: font,
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
        priority: 'high',
      });
    });

    // Preload critical images
    config.images.forEach((image) => {
      this.preloadResource({
        href: image,
        as: 'image',
        priority: 'high',
      });
    });

    // Preload critical scripts
    config.scripts.forEach((script) => {
      this.preloadResource({
        href: script,
        as: 'script',
        priority: 'high',
      });
    });

    // Preload critical styles
    config.styles.forEach((style) => {
      this.preloadResource({
        href: style,
        as: 'style',
        priority: 'high',
      });
    });

    // Preload other critical resources
    config.critical.forEach((resource) => {
      this.preloadResource({
        href: resource,
        priority: 'high',
      });
    });
  }

  public prefetchNextPageAssets(config: PrefetchConfig): void {
    // Prefetch route assets
    config.routes.forEach((route) => {
      this.prefetchResource(route, 'document');
    });

    // Prefetch assets
    config.assets.forEach((asset) => {
      this.prefetchResource(asset);
    });

    // Prefetch data
    config.data.forEach((dataUrl) => {
      this.prefetchResource(dataUrl, 'fetch');
    });
  }

  public setupPreconnections(config: PreconnectConfig): void {
    // Preconnect to origins
    config.origins.forEach((origin) => {
      this.preconnectOrigin(origin, true);
    });

    // DNS prefetch
    config.dns.forEach((hostname) => {
      this.dnsPrefetch(hostname);
    });
  }

  public preloadRouteAssets(route: string): void {
    // Intelligent route-based preloading
    const routeAssets = this.getRouteAssets(route);
    
    routeAssets.forEach((asset) => {
      this.preloadResource({
        href: asset.href,
        as: asset.as,
        priority: 'low',
      });
    });
  }

  private getRouteAssets(route: string): Array<{ href: string; as: string }> {
    // This would be configured based on your routing structure
    const routeAssetMap: Record<string, Array<{ href: string; as: string }>> = {
      '/property': [
        { href: '/api/properties', as: 'fetch' },
        { href: '/images/property-placeholder.webp', as: 'image' },
      ],
      '/search': [
        { href: '/api/search', as: 'fetch' },
        { href: '/js/search-worker.js', as: 'script' },
      ],
      '/trust': [
        { href: '/api/trust-scores', as: 'fetch' },
        { href: '/images/trust-badges.webp', as: 'image' },
      ],
    };

    return routeAssetMap[route] || [];
  }

  public optimizeForUserBehavior(): void {
    // Track user interactions to predict next actions
    this.trackUserInteractions();
    
    // Preload based on hover intentions
    this.setupHoverPreloading();
    
    // Preload based on scroll behavior
    this.setupScrollPreloading();
  }

  private trackUserInteractions(): void {
    // Track link hovers for predictive preloading
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !this.prefetchedResources.has(link.href)) {
        // Debounce to avoid excessive prefetching
        setTimeout(() => {
          if (link.matches(':hover')) {
            this.prefetchResource(link.href, 'document');
          }
        }, 100);
      }
    });
  }

  private setupHoverPreloading(): void {
    // Preload on hover with delay to avoid false positives
    let hoverTimeout: number;

    document.addEventListener('mouseenter', (event) => {
      const {target} = event;
      if (!target || !(target instanceof HTMLElement)) return;
      
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href.startsWith(window.location.origin)) {
        hoverTimeout = window.setTimeout(() => {
          this.prefetchResource(link.href, 'document');
        }, 200);
      }
    }, true);

    document.addEventListener('mouseleave', () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    }, true);
  }

  private setupScrollPreloading(): void {
    // Preload resources as they come into viewport
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const preloadHref = element.dataset.preload;
            
            if (preloadHref && !this.preloadedResources.has(preloadHref)) {
              this.preloadResource({
                href: preloadHref,
                as: element.dataset.preloadAs || 'image',
              });
            }
          }
        });
      }, {
        rootMargin: '50px',
      });

      // Observe elements with data-preload attribute
      document.querySelectorAll('[data-preload]').forEach((element) => {
        observer.observe(element);
      });
    }
  }

  public calculateHitRate(): number {
    const totalHints = this.hintMetrics.preloaded + this.hintMetrics.prefetched;
    if (totalHints === 0) return 0;

    let hits = 0;
    
    // Check how many preloaded/prefetched resources were actually used
    this.preloadedResources.forEach((resource) => {
      if (this.resourceLoadTimes.has(resource)) {
        hits++;
      }
    });

    this.prefetchedResources.forEach((resource) => {
      if (this.resourceLoadTimes.has(resource)) {
        hits++;
      }
    });

    const hitRate = (hits / totalHints) * 100;
    this.hintMetrics.hitRate = hitRate;
    
    return hitRate;
  }

  public getMetrics(): ResourceHintMetrics {
    this.hintMetrics.hitRate = this.calculateHitRate();
    this.hintMetrics.timestamp = Date.now();
    
    return { ...this.hintMetrics };
  }

  public generateReport(): {
    summary: {
      preloadedCount: number;
      prefetchedCount: number;
      preconnectedCount: number;
      hitRate: string;
      recommendations: string[];
    };
    details: {
      preloadedResources: string[];
      prefetchedResources: string[];
      preconnectedOrigins: string[];
    };
  } {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    if (metrics.hitRate < 50) {
      recommendations.push('Hit rate is low. Review preloading strategy to focus on actually used resources.');
    }

    if (metrics.preloaded === 0) {
      recommendations.push('No resources are being preloaded. Consider preloading critical fonts and images.');
    }

    if (metrics.preconnected === 0) {
      recommendations.push('No origins are preconnected. Consider preconnecting to external domains.');
    }

    if (this.preloadedResources.size > 10) {
      recommendations.push('Many resources are preloaded. Ensure only critical resources are preloaded.');
    }

    return {
      summary: {
        preloadedCount: metrics.preloaded,
        prefetchedCount: metrics.prefetched,
        preconnectedCount: metrics.preconnected,
        hitRate: `${metrics.hitRate.toFixed(1)}%`,
        recommendations,
      },
      details: {
        preloadedResources: Array.from(this.preloadedResources),
        prefetchedResources: Array.from(this.prefetchedResources),
        preconnectedOrigins: Array.from(this.preconnectedOrigins),
      },
    };
  }

  public sendMetricsToAnalytics(): void {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return;
    }

    const metrics = this.getMetrics();

    fetch('/api/analytics/resource-hints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...metrics,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(error => {
      console.warn('Failed to send resource hints metrics:', error);
    });
  }
}

// Singleton instance
export const resourceHintsManager = new ResourceHintsManager();

// Auto-optimize for user behavior
if (typeof window !== 'undefined') {
  resourceHintsManager.optimizeForUserBehavior();
  
  // Send metrics periodically
  setInterval(() => {
    resourceHintsManager.sendMetricsToAnalytics();
  }, 60000); // Every minute
}

// Development helper
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__resourceHints = resourceHintsManager;
}