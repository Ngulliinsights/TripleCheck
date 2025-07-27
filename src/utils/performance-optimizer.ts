/**
 * Performance optimization utilities for Core Web Vitals improvement
 */

// Critical resource preloading
export const preloadCriticalResources = () => {
  const resources = [
    { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' },
    { href: '/images/logo.webp', as: 'image' },
  ];

  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) link.type = resource.type;
    if (resource.as === 'font') link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// DNS prefetch for external domains
export const prefetchDNS = () => {
  const domains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://api.example.com', // Replace with your API domain
  ];

  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
};

// Optimize images for better LCP (non-intrusive approach)
export const optimizeImages = () => {
  // Only add loading="lazy" to images that don't already have it set
  // and avoid modifying images that are already loaded to prevent flickering
  const images = document.querySelectorAll('img:not([loading]):not([data-optimized])');
  images.forEach((element, index) => {
    const img = element as HTMLImageElement;
    // Mark as optimized to prevent re-processing
    img.setAttribute('data-optimized', 'true');
    
    // First 3 images are likely above the fold - load immediately
    if (index > 2) {
      // Only set lazy loading if the image hasn't started loading yet
      if (!img.complete && !img.src) {
        img.setAttribute('loading', 'lazy');
      }
    }
  });
};

// Reduce layout shift by setting image dimensions (non-intrusive approach)
export const preventLayoutShift = () => {
  // Only process images that haven't been processed yet and aren't already loaded
  const images = document.querySelectorAll('img:not([width]):not([height]):not([data-layout-optimized])');
  images.forEach(element => {
    const img = element as HTMLImageElement;
    // Mark as processed to prevent re-processing
    img.setAttribute('data-layout-optimized', 'true');
    
    // Only apply aspect ratio if the image hasn't loaded yet to prevent flickering
    if (!img.complete && img.naturalWidth === 0) {
      // Use a more conservative approach - only set min-height to reserve space
      img.style.minHeight = '200px';
      img.style.backgroundColor = '#f3f4f6'; // Light gray placeholder
      
      // Remove placeholder styling once image loads
      img.addEventListener('load', () => {
        img.style.minHeight = '';
        img.style.backgroundColor = '';
      }, { once: true });
    }
  });
};

// Initialize all performance optimizations
export const initializePerformanceOptimizations = () => {
  // Run immediately for critical resources
  preloadCriticalResources();
  prefetchDNS();

  // Run after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      optimizeImages();
      preventLayoutShift();
    });
  } else {
    optimizeImages();
    preventLayoutShift();
  }

  // Run after page is fully loaded
  window.addEventListener('load', () => {
    // Additional optimizations after page load
    requestIdleCallback(() => {
      // Cleanup unused resources
      const unusedLinks = document.querySelectorAll('link[rel="preload"]:not([data-keep])');
      unusedLinks.forEach(link => {
        setTimeout(() => link.remove(), 5000); // Remove after 5 seconds
      });
    });
  });
};

// Web Vitals measurement and reporting (using basic implementation to avoid import issues)
export const measureWebVitals = () => {
  if ('web-vitals' in window) return; // Already loaded

  // Use basic performance measurement to avoid import issues
  console.log('Using basic performance measurement (web-vitals package not required)');
  measureBasicWebVitals();
  
  // Mark as loaded to prevent multiple initializations
  (window as any)['web-vitals'] = true;
};

// Basic Web Vitals measurement without external dependencies
const measureBasicWebVitals = () => {
  if (typeof window === 'undefined' || !window.performance) return;

  // Measure basic performance metrics
  const sendBasicMetric = (name: string, value: number) => {
    console.log(`Basic Web Vital - ${name}:`, value);
    
    // Send to Google Analytics if available
    if ('gtag' in window) {
      (window as any).gtag('event', name, {
        event_category: 'Basic Web Vitals',
        value: Math.round(value),
        non_interaction: true,
      });
    }
  };

  // Measure First Contentful Paint (FCP)
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
  if (fcpEntry) {
    sendBasicMetric('FCP', fcpEntry.startTime);
  }

  // Measure Largest Contentful Paint (LCP) - basic approximation
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          sendBasicMetric('LCP', lastEntry.startTime);
        }
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Stop observing after 10 seconds
      setTimeout(() => observer.disconnect(), 10000);
    } catch (error) {
      console.warn('Could not observe LCP:', error);
    }
  }

  // Measure Time to First Byte (TTFB)
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigationEntry) {
    const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    sendBasicMetric('TTFB', ttfb);
  }

  // Basic layout shift detection (simplified)
  if ('PerformanceObserver' in window) {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      
      // Report CLS after 5 seconds
      setTimeout(() => {
        sendBasicMetric('CLS', clsValue);
        observer.disconnect();
      }, 5000);
    } catch (error) {
      console.warn('Could not observe CLS:', error);
    }
  }
};