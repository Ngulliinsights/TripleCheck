import { useEffect, useRef } from 'react';
import { useGlobalPerformanceMonitor } from '../utils/globalPerformanceMonitor';

/**
 * Hook to easily add performance monitoring to any component
 * @param componentName - Name of the component for tracking
 * @param trackRenders - Whether to automatically track renders (default: true)
 * @returns Performance monitoring functions
 */
export const useComponentPerformance = (
  componentName: string,
  trackRenders: boolean = true
) => {
  const performanceMonitor = useGlobalPerformanceMonitor(componentName);
  const renderCountRef = useRef(0);

  // Auto-track renders if enabled
  useEffect(() => {
    if (trackRenders) {
      renderCountRef.current += 1;
      performanceMonitor.trackRender();
    }
  });

  return {
    // Track API calls with data
    trackApiCall: (data: any) => performanceMonitor.trackApiCall(data),
    
    // Manually track renders
    trackRender: () => performanceMonitor.trackRender(),
    
    // Get current stats
    getStats: () => performanceMonitor.getStats(),
    
    // Reset stats for this component
    reset: () => performanceMonitor.reset(),
    
    // Current render count
    renderCount: renderCountRef.current,
  };
};

export default useComponentPerformance;