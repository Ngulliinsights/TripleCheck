/**
 * Browser detection utilities for cross-browser compatibility testing
 */

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  isMobile: boolean;
  supportsFeature: (feature: string) => boolean;
}

export class BrowserDetector {
  /**
   * Detect browser information from user agent
   */
  static detectBrowser(userAgent: string): BrowserInfo {
    const ua = userAgent.toLowerCase();
    
    let name = 'unknown';
    let version = 'unknown';
    let engine = 'unknown';
    
    // Detect browser name and version
    if (ua.includes('chrome') && !ua.includes('edge')) {
      name = 'chrome';
      const match = ua.match(/chrome\/(\d+)/);
      version = match?.[1] ?? 'unknown';
      engine = 'blink';
    } else if (ua.includes('firefox')) {
      name = 'firefox';
      const match = ua.match(/firefox\/(\d+)/);
      version = match?.[1] ?? 'unknown';
      engine = 'gecko';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      name = 'safari';
      const match = ua.match(/version\/(\d+)/);
      version = match?.[1] ?? 'unknown';
      engine = 'webkit';
    } else if (ua.includes('edge')) {
      name = 'edge';
      const match = ua.match(/edge\/(\d+)/);
      version = match?.[1] ?? 'unknown';
      engine = 'blink';
    }
    
    // Detect platform
    let platform = 'unknown';
    if (ua.includes('windows')) platform = 'windows';
    else if (ua.includes('mac')) platform = 'macos';
    else if (ua.includes('linux')) platform = 'linux';
    else if (ua.includes('android')) platform = 'android';
    else if (ua.includes('ios')) platform = 'ios';
    
    // Detect mobile
    const isMobile = /mobile|android|iphone|ipad|tablet/.test(ua);
    
    return {
      name,
      version,
      engine,
      platform,
      isMobile,
      supportsFeature: (feature: string) => BrowserDetector.checkFeatureSupport(feature, name, version)
    };
  }
  
  /**
   * Check if a browser supports a specific feature
   */
  static checkFeatureSupport(feature: string, browserName: string, version: string): boolean {
    const versionNum = parseInt(version);
    
    const featureSupport: Record<string, Record<string, number>> = {
      'css-grid': {
        chrome: 57,
        firefox: 52,
        safari: 10,
        edge: 16
      },
      'css-flexbox': {
        chrome: 29,
        firefox: 28,
        safari: 9,
        edge: 12
      },
      'webp': {
        chrome: 23,
        firefox: 65,
        safari: 14,
        edge: 18
      },
      'intersection-observer': {
        chrome: 51,
        firefox: 55,
        safari: 12,
        edge: 15
      },
      'web-components': {
        chrome: 54,
        firefox: 63,
        safari: 10,
        edge: 79
      },
      'service-worker': {
        chrome: 45,
        firefox: 44,
        safari: 11,
        edge: 17
      }
    };
    
    const minVersion = featureSupport[feature]?.[browserName];
    return minVersion ? versionNum >= minVersion : false;
  }
}

/**
 * Feature detection utilities for runtime checks
 */
export class FeatureDetector {
  /**
   * Check if CSS Grid is supported
   */
  static supportsCSSGrid(): boolean {
    return CSS.supports('display', 'grid');
  }
  
  /**
   * Check if CSS Flexbox is supported
   */
  static supportsCSSFlexbox(): boolean {
    return CSS.supports('display', 'flex');
  }
  
  /**
   * Check if WebP images are supported
   */
  static async supportsWebP(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }
  
  /**
   * Check if Intersection Observer is supported
   */
  static supportsIntersectionObserver(): boolean {
    return 'IntersectionObserver' in window;
  }
  
  /**
   * Check if touch events are supported
   */
  static supportsTouchEvents(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
  
  /**
   * Check if Service Worker is supported
   */
  static supportsServiceWorker(): boolean {
    return 'serviceWorker' in navigator;
  }
  
  /**
   * Check if Web Components are supported
   */
  static supportsWebComponents(): boolean {
    return 'customElements' in window && 'attachShadow' in Element.prototype;
  }
  
  /**
   * Get viewport dimensions
   */
  static getViewportDimensions() {
    return {
      width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
  }
  
  /**
   * Check if device supports hover
   */
  static supportsHover(): boolean {
    return window.matchMedia('(hover: hover)').matches;
  }
  
  /**
   * Check device pixel ratio
   */
  static getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1;
  }
}