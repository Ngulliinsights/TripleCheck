import { useState, useEffect, useCallback, useRef } from 'react'

// Extend Window so TypeScript stops complaining about gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface EntryPointConfig {
  source:
    | 'fraud_report'
    | 'community_insights'
    | 'property_verification'
    | 'search_results'
    | 'homepage';
  priority: 'high' | 'medium' | 'low';
  triggers: string[];
  context?: Record<string, unknown>;
}

interface UserBehavior {
  timeOnPage: number;
  scrollDepth: number;
  interactionCount: number;
  pageViews: number;
  sessionDuration: number;
}

const PRIORITY_ORDER: Record<EntryPointConfig['priority'], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function useB2BEntryPoints() {
  const [activeEntryPoints, setActiveEntryPoints] = useState<EntryPointConfig[]>([]);
  const [userBehavior, setUserBehavior] = useState<UserBehavior>({
    timeOnPage: 0,
    scrollDepth: 0,
    interactionCount: 0,
    pageViews: 0,
    sessionDuration: 0,
  });

  // Stable reference for session start so it never changes
  const sessionStartTimeRef = useRef(Date.now());

  // Track time-on-page, scroll depth, and click interactions
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1_000);
      setUserBehavior(prev => ({
        ...prev,
        timeOnPage: elapsed,
        sessionDuration: elapsed,
      }));
    }, 1_000);

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.floor((scrollTop / docHeight) * 100);
      setUserBehavior(prev => ({
        ...prev,
        scrollDepth: Math.max(prev.scrollDepth, pct),
      }));
    };

    const onClick = () => {
      setUserBehavior(prev => ({
        ...prev,
        interactionCount: prev.interactionCount + 1,
      }));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick);
    };
  }, []); // session start is in a ref — no deps needed

  // Detect relevant entry points for the current page / context
  const detectEntryPoint = useCallback(
    (pathname: string, context?: Record<string, unknown>): EntryPointConfig[] => {
      const points: EntryPointConfig[] = [];

      if (pathname.includes('fraud') || context?.fraudDetected) {
        points.push({
          source: 'fraud_report',
          priority: 'high',
          triggers: ['fraud_detected', 'high_risk_score'],
          context: { fraudData: context?.fraudData, riskScore: context?.riskScore },
        });
      }

      if (pathname.includes('community') || context?.communityData) {
        points.push({
          source: 'community_insights',
          priority: 'medium',
          triggers: ['community_engagement', 'insights_viewed'],
          context: {
            insightsData: context?.insightsData,
            communityScore: context?.communityScore,
          },
        });
      }

      if (pathname.includes('verification') || context?.verificationComplete) {
        points.push({
          source: 'property_verification',
          priority: 'high',
          triggers: ['verification_complete', 'high_value_property'],
          context: {
            propertyValue: context?.propertyValue,
            verificationResult: context?.verificationResult,
          },
        });
      }

      if (pathname.includes('search') || pathname.includes('properties')) {
        points.push({
          source: 'search_results',
          priority: 'low',
          triggers: ['multiple_searches', 'high_value_results'],
          context: {
            searchResults: context?.searchResults,
            averageValue: context?.averageValue,
          },
        });
      }

      if (pathname === '/' || points.length === 0) {
        points.push({
          source: 'homepage',
          priority: 'low',
          triggers: ['time_on_site', 'multiple_page_views'],
          context: context ?? {},
        });
      }

      // Sort by priority descending, deduplicate by source
      return points
        .sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority])
        .filter((p, i, arr) => arr.findIndex(x => x.source === p.source) === i);
    },
    []
  );

  const updateEntryPoints = useCallback(
    (pathname: string, context?: Record<string, unknown>) => {
      setActiveEntryPoints(detectEntryPoint(pathname, context));
    },
    [detectEntryPoint]
  );

  // Determine whether an entry point has met its engagement threshold
  const shouldShowB2BMessaging = useCallback(
    (entryPoint: EntryPointConfig): boolean => {
      const { timeOnPage, scrollDepth, interactionCount } = userBehavior;

      switch (entryPoint.priority) {
        case 'high':
          return timeOnPage > 30 || scrollDepth > 50 || interactionCount > 2;
        case 'medium':
          return timeOnPage > 60 || scrollDepth > 70 || interactionCount > 3;
        case 'low':
          return timeOnPage > 120 || scrollDepth > 80 || interactionCount > 5;
        default:
          return false;
      }
    },
    [userBehavior]
  );

  // Return the highest-priority qualified entry point
  const getBestEntryPoint = useCallback((): EntryPointConfig | null => {
    const qualified = activeEntryPoints.filter(shouldShowB2BMessaging);
    return qualified[0] ?? null;
  }, [activeEntryPoints, shouldShowB2BMessaging]);

  const trackEntryPointEngagement = useCallback(
    (entryPoint: EntryPointConfig, action: string) => {
      window.gtag?.('event', 'b2b_entry_point_engagement', {
        event_category: 'B2B',
        event_label: `${entryPoint.source}_${action}`,
        custom_parameters: {
          priority: entryPoint.priority,
          time_on_page: userBehavior.timeOnPage,
          scroll_depth: userBehavior.scrollDepth,
          interaction_count: userBehavior.interactionCount,
          triggers: entryPoint.triggers.join(','),
        },
      });
    },
    [userBehavior]
  );

  // Composite engagement score out of 100
  const getEngagementScore = useCallback((): number => {
    const { timeOnPage, scrollDepth, interactionCount } = userBehavior;

    let score = 0;

    // Time (0 – 40 pts)
    if (timeOnPage > 180) score += 40;
    else if (timeOnPage > 120) score += 30;
    else if (timeOnPage > 60) score += 20;
    else if (timeOnPage > 30) score += 10;

    // Scroll depth (0 – 30 pts)
    if (scrollDepth > 90) score += 30;
    else if (scrollDepth > 70) score += 25;
    else if (scrollDepth > 50) score += 20;
    else if (scrollDepth > 25) score += 10;

    // Interactions (0 – 30 pts)
    if (interactionCount > 10) score += 30;
    else if (interactionCount > 7) score += 25;
    else if (interactionCount > 5) score += 20;
    else if (interactionCount > 3) score += 15;
    else if (interactionCount > 1) score += 10;

    return Math.min(score, 100);
  }, [userBehavior]);

  return {
    activeEntryPoints,
    userBehavior,
    updateEntryPoints,
    shouldShowB2BMessaging,
    getBestEntryPoint,
    trackEntryPointEngagement,
    getEngagementScore,
  };
}