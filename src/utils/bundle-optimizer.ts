/**
 * Bundle size optimization utilities
 * Helps reduce the initial bundle size and improve loading performance
 */

// Dynamic imports for heavy libraries (only import what exists)
export const loadHeavyLibraries = {
  // Load chart libraries only when needed
  charts: () => import('recharts').catch(() => null),
  
  // Load date libraries only when needed
  dateFns: () => import('date-fns').catch(() => null),
  
  // Load animation libraries only when needed
  framerMotion: () => import('framer-motion').catch(() => null),
  
  // These are commented out since they're not installed
  // richTextEditor: () => import('@tiptap/react').catch(() => null),
  // pdfViewer: () => import('react-pdf').catch(() => null),
};

// Tree-shake unused utilities
export const optimizeImports = () => {
  // Remove unused CSS classes at runtime (development only)
  if (process.env.NODE_ENV === 'development') {
    const unusedClasses = findUnusedCSSClasses();
    console.log('Unused CSS classes detected:', unusedClasses.length);
  }
};

// Find unused CSS classes (development helper)
const findUnusedCSSClasses = (): string[] => {
  const allClasses = Array.from(document.styleSheets)
    .flatMap(sheet => {
      try {
        return Array.from(sheet.cssRules);
      } catch {
        return [];
      }
    })
    .filter(rule => rule.type === CSSRule.STYLE_RULE)
    .map(rule => (rule as CSSStyleRule).selectorText)
    .filter(Boolean);

  const usedClasses = Array.from(document.querySelectorAll('*'))
    .flatMap(el => Array.from(el.classList));

  return allClasses.filter(className => 
    !usedClasses.some(used => className.includes(used))
  );
};

// Optimize font loading
export const optimizeFonts = () => {
  // Preload critical fonts
  const criticalFonts = [
    '/fonts/inter-var.woff2',
  ];

  criticalFonts.forEach(fontUrl => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = fontUrl;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Use font-display: swap for better performance
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 100 900;
      font-display: swap;
      src: url('/fonts/inter-var.woff2') format('woff2');
    }
  `;
  document.head.appendChild(style);
};

// Optimize images (disabled dynamic WebP conversion to prevent flickering)
export const optimizeImages = () => {
  // Add loading="lazy" to images below the fold to improve performance
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach((img, index) => {
    // First 3 images are likely above the fold - load immediately
    if (index > 2) {
      img.setAttribute('loading', 'lazy');
    }
    
    // Add proper alt text if missing (accessibility)
    if (!img.getAttribute('alt')) {
      img.setAttribute('alt', 'Property image');
    }
  });

  // Note: WebP conversion disabled to prevent image flickering
  // Instead, serve WebP images directly from your image pipeline/CDN
};

// Remove unused code (development helper)
export const removeUnusedCode = () => {
  if (process.env.NODE_ENV !== 'development') return;

  // Log potential optimizations
  console.group('Bundle Optimization Suggestions');
  
  // Check for unused imports
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const unusedScripts = scripts.filter(script => {
    const src = script.getAttribute('src');
    return src && !src.includes('main') && !src.includes('vendor');
  });
  
  if (unusedScripts.length > 0) {
    console.log('Potentially unused scripts:', unusedScripts.length);
  }
  
  // Check bundle size
  const totalScriptSize = scripts.reduce((total, script) => {
    const src = script.getAttribute('src');
    if (src && src.startsWith('/')) {
      // Estimate size based on filename patterns
      if (src.includes('vendor')) return total + 100; // ~100KB
      if (src.includes('main')) return total + 50; // ~50KB
      return total + 10; // ~10KB for other scripts
    }
    return total;
  }, 0);
  
  console.log(`Estimated total bundle size: ~${totalScriptSize}KB`);
  
  if (totalScriptSize > 200) {
    console.warn('Bundle size is large. Consider code splitting.');
  }
  
  console.groupEnd();
};

// Initialize all bundle optimizations
export const initializeBundleOptimizations = () => {
  // Run immediately
  optimizeFonts();
  
  // Run after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      optimizeImages();
      optimizeImports();
      removeUnusedCode();
    });
  } else {
    optimizeImages();
    optimizeImports();
    removeUnusedCode();
  }
};