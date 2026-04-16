import { useState, useEffect, useCallback } from 'react'

interface EntryPointConfig {
  source: 'fraud_report' | 'community_insights' | 'property_verification' | 'search_results' | 'homepage';
  priority: 'high' | 'medium' | 'low';
  triggers: string[];
  context?: Record<string, any>;
}

interface UserBehavior {
  timeOnPage: number;
  scrollDepth: number;
  interactionCount: number;
  pageViews: number;
  sessionDuration: number;
}

export function useB2BEntryPoints() {
  const [activeEntryPoints, setActiveEntryPoints] = useState<EntryPointConfig[]>([]);
  const [userBehavior, setUserBehavior] = useState<UserBehavior>({
    timeOnPage: 0,
    scrollDepth: 0,
    interactionCount: 0,
    pageViews: 0,
    sessionDuration: 0
  });
  const [sessionStartTime] = useState(Date.now());

  // Track user behavior
  useEffect(() => {
    let timeInterval: NodeJS.Timeout;
    let scrollListener: () => void;
    let clickListener: () => void;

    const startTracking = () => {
      // Track time on page
      timeInterval = setInterval(() => {
        setUserBehavior(prev => ({
          ...prev,
          timeOnPage: Math.floor((Date.now() - sessionStartTime) / 1000),
          sessionDuration: Math.floor((Date.now() - sessionStartTime) / 1000)
        }));
      }, 1000);

      // Track scroll depth
      scrollListener = () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.floor((scrollTop / docHeight) * 100);
        
        setUserBehavior(prev => ({
          ...prev,
          scrollDepth: Math.max(prev.scrollDepth, scrollPercent)
        }));
      };

      // Track interactions
      clickListener = () => {
        setUserBehavior(prev => ({
          ...prev,
          interactionCount: prev.interactionCount + 1
        }));
      };

      window.addEventListener('scroll', scrollListener, { passive: true });
      document.addEventListener('click', clickListener, { passive: true });
    };

    startTracking();

    return () => {
      if (timeInterval) clearInterval(timeInterval);
      if (scrollListener) window.removeEventListener('scroll', scrollListener);
      if (clickListener) document.removeEventListener('click', clickListener);
    };
  }, [sessionStartTime]);

  // Detect entry point based on current page and context
  const detectEntryPoint = useCallback((pathname: string, context?: Record<string, any>) => {
    const entryPoints: EntryPointConfig[] = [];

    // Fraud report entry point
    if (pathname.includes('fraud') || context?.fraudDetected) {
      entryPoints.push({
        source: 'fraud_report',
        priority: 'high',
        triggers: ['fraud_detected', 'high_risk_score'],
        context: {
          fraudData: context?.fraudData,
          riskScore: context?.riskScore
        }
      });
    }

    // Community insights entry point
    if (pathname.includes('community') || context?.communityData) {
      entryPoints.push({
        source: 'community_insights',
        priority: 'medium',
        triggers: ['community_engagement', 'insights_viewed'],
        context: {
          insightsData: context?.insightsData,
          communityScore: context?.communityScore
        }
      });
    }

    // Property verification entry point
    if (pathname.includes('verification') || context?.verificationComplete) {
      entryPoints.push({
        source: 'property_verification',
        priority: 'high',
        triggers: ['verification_complete', 'high_value_property'],
        context: {
          propertyValue: context?.propertyValue,
          verificationResult: context?.verificationResult
        }
      });
    }

    // Search results entry point
    if (pathname.includes('search') || pathname.includes('properties')) {
      entryPoints.push({
        source: 'search_results',
        priority: 'low',
        triggers: ['multiple_searches', 'high_value_results'],
        context: {
          searchResults: context?.searchResults,
          averageValue: context?.averageValue
        }
      });
    }

    // Homepage entry point (fallback)
    if (pathname === '/' || entryPoints.length === 0) {
      entryPoints.push({
        source: 'homepage',
        priority: 'low',
        triggers: ['time_on_site', 'multiple_page_views'],
        context: context || {}
      });
    }

    return entryPoints;
  }, []);

  // Update active entry points
  const updateEntryPoints = useCallback((pathname: string, context?: Record<string, any>) => {
    const detectedEntryPoints = detectEntryPoint(pathname, context);
    
    // Sort by priority and filter duplicates
    const sortedEntryPoints = detectedEntryPoints
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .filter((point, index, arr) => 
        arr.findIndex(p => p.source === point.source) === index
      );

    setActiveEntryPoints(sortedEntryPoints);
  }, [detectEntryPoint]);

  // Check if triggers are met for showing B2B messaging
  const shouldShowB2BMessaging = useCallback((entryPoint: EntryPointConfig) => {
    const { triggers, priority } = entryPoint;
    const { timeOnPage, scrollDepth, interactionCount } = userBehavior;

    // High priority entry points (fraud, verification)
    if (priority === 'high') {
      return timeOnPage > 30 || scrollDepth > 50 || interactionCount > 2;
    }

    // Medium priority entry points (community insights)
    if (priority === 'medium') {
      return timeOnPage > 60 || scrollDepth > 70 || interactionCount > 3;
    }

    // Low priority entry points (search, homepage)
    if (priority === 'low') {
      return timeOnPage > 120 || scrollDepth > 80 || interactionCount > 5;
    }

    return false;
  }, [userBehavior]);

  // Get the best entry point for B2B messaging
  const getBestEntryPoint = useCallback(() => {
    const qualifiedEntryPoints = activeEntryPoints.filter(shouldShowB2BMessaging);
    
    if (qualifiedEntryPoints.length === 0) return null;
    
    // Return highest priority entry point
    return qualifiedEntryPoints[0];
  }, [activeEntryPoints, shouldShowB2BMessaging]);

  // Track entry point analytics
  const trackEntryPointEngagement = useCallback((entryPoint: EntryPointConfig, action: string) => {
    if (window?.gtag) {
      window.gtag('event', 'b2b_entry_point_engagement', {
        event_category: 'B2B',
        event_label: `${entryPoint.source}_${action}`,
        custom_parameters: {
          priority: entryPoint.priority,
          time_on_page: userBehavior.timeOnPage,
          scroll_depth: userBehavior.scrollDepth,
          interaction_count: userBehavior.interactionCount,
          triggers: entryPoint.triggers.join(',')
        }
      });
    }
  }, [userBehavior]);

  // Calculate engagement score
  const getEngagementScore = useCallback(() => {
    const { timeOnPage, scrollDepth, interactionCount } = userBehavior;
    
    let score = 0;
    
    // Time scoring (0-40 points)
    if (timeOnPage > 180) score += 40;
    else if (timeOnPage > 120) score += 30;
    else if (timeOnPage > 60) score += 20;
    else if (timeOnPage > 30) score += 10;
    
    // Scroll scoring (0-30 points)
    if (scrollDepth > 90) score += 30;
    else if (scrollDepth > 70) score += 25;
    else if (scrollDepth > 50) score += 20;
    else if (scrollDepth > 25) score += 10;
    
    // Interaction scoring (0-30 points)
    if (interactionCount > 10) score += 30;
    else if (interactionCount > 7) score += 25;
    else if (interactionCount > 5) score += 20;
    else if (interactionCount > 3) score += 15;
    else if (interactionCount > 1) score += 10;
    
    return Math.min(score, 100); // Cap at 100
  }, [userBehavior]);

  return {
    activeEntryPoints,
    userBehavior,
    updateEntryPoints,
    shouldShowB2BMessaging,
    getBestEntryPoint,
    trackEntryPointEngagement,
    getEngagementScore
  };
}