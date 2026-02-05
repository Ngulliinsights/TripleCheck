/**
 * Navigation Utilities for User Journey Tracking and Conversion Optimization
 */

import { USER_JOURNEYS, PAGE_CONVERSION_CONFIG, JOURNEY_TRACKING } from '../config/user-journeys'

export interface NavigationEvent {
  from: string;
  to: string;
  timestamp: number;
  userType?: string | undefined;
  conversionGoal?: string | undefined;
  sessionId: string;
}

export class NavigationTracker {
  private static instance: NavigationTracker;
  private navigationHistory: NavigationEvent[] = [];
  private sessionId: string;
  private currentUserType?: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  public static getInstance(): NavigationTracker {
    if (!NavigationTracker.instance) {
      NavigationTracker.instance = new NavigationTracker();
    }
    return NavigationTracker.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking() {
    // Track page navigation
    if (typeof window !== 'undefined') {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = (...args) => {
        this.trackNavigation(window.location.pathname, args[2] as string);
        return originalPushState.apply(history, args);
      };

      history.replaceState = (...args) => {
        this.trackNavigation(window.location.pathname, args[2] as string);
        return originalReplaceState.apply(history, args);
      };

      window.addEventListener('popstate', () => {
        this.trackNavigation(this.getLastPage(), window.location.pathname);
      });
    }
  }

  public trackNavigation(from: string, to: string, conversionGoal?: string) {
    const event: NavigationEvent = {
      from,
      to,
      timestamp: Date.now(),
      userType: this.currentUserType ?? undefined,
      conversionGoal: conversionGoal ?? undefined,
      sessionId: this.sessionId
    };

    this.navigationHistory.push(event);
    this.analyzeUserJourney(event);
    
    // Send to analytics if available
    this.sendToAnalytics(event);
  }

  public setUserType(userType: string) {
    this.currentUserType = userType;
  }

  private getLastPage(): string {
    const lastEvent = this.navigationHistory[this.navigationHistory.length - 1];
    return lastEvent ? lastEvent.to : '/';
  }

  private analyzeUserJourney(event: NavigationEvent) {
    // Find matching user journey
    const matchingJourney = USER_JOURNEYS.find(journey => 
      journey.entryPoints.some(entry => this.matchesPattern(entry, event.from)) ||
      journey.keyPages.some(page => this.matchesPattern(page.page, event.to))
    );

    if (matchingJourney) {
      this.optimizeForJourney(matchingJourney, event);
    }
  }

  private matchesPattern(pattern: string, path: string): boolean {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(path);
    }
    return pattern === path;
  }

  private optimizeForJourney(journey: any, event: NavigationEvent) {
    // Get page-specific conversion config
    const pageConfig = PAGE_CONVERSION_CONFIG[event.to];
    
    if (pageConfig) {
      // Trigger conversion optimizations
      this.triggerConversionOptimizations(pageConfig, journey);
    }
  }

  private triggerConversionOptimizations(pageConfig: any, journey: any) {
    // This would integrate with your conversion optimization system
    console.log('Optimizing for conversion:', {
      page: pageConfig,
      journey: journey.name,
      primaryCTA: pageConfig.primaryCTA
    });
  }

  private sendToAnalytics(event: NavigationEvent) {
    // Integration with analytics platforms
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: event.to,
        page_referrer: event.from,
        user_type: event.userType,
        session_id: event.sessionId
      });
    }
  }

  public getNavigationHistory(): NavigationEvent[] {
    return [...this.navigationHistory];
  }

  public getCurrentJourney(): any {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    return USER_JOURNEYS.find(journey =>
      journey.keyPages.some(page => this.matchesPattern(page.page, currentPath))
    );
  }

  public getConversionPath(): string[] {
    return this.navigationHistory.map(event => event.to);
  }

  public isDropOffPoint(path: string): boolean {
    return JOURNEY_TRACKING.dropOffPoints.includes(path);
  }
}

// Navigation helper functions
export const navigationUtils = {
  // Get optimal next page based on current journey
  getNextRecommendedPage: (currentPage: string, userType?: string): string | null => {
    const journey = USER_JOURNEYS.find(j => 
      j.userType === userType && 
      j.keyPages.some(p => p.page === currentPage)
    );

    if (journey) {
      const currentStep = journey.keyPages.find(p => p.page === currentPage);
      return currentStep?.nextSteps[0] || null;
    }

    return null;
  },

  // Get conversion-optimized CTA text
  getOptimalCTA: (page: string, position: 'primary' | 'secondary' = 'primary'): string => {
    const config = PAGE_CONVERSION_CONFIG[page];
    return config ? config[`${position}CTA`] : 'Get Started';
  },

  // Check if user is in a conversion funnel
  isInConversionFunnel: (path: string): boolean => {
    return Object.values(JOURNEY_TRACKING.conversionPaths)
      .some(pathArray => pathArray.includes(path));
  },

  // Get exit intent offer for current page
  getExitIntentOffer: (page: string): string | null => {
    const config = PAGE_CONVERSION_CONFIG[page];
    return config?.exitIntentOffer || null;
  },

  // Generate breadcrumb navigation
  generateBreadcrumbs: (currentPath: string): Array<{label: string, href: string}> => {
    const pathSegments = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', href: '/' }];

    let currentHref = '';
    pathSegments.forEach((segment, index) => {
      currentHref += `/${segment}`;
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: currentHref
      });
    });

    return breadcrumbs;
  }
};

// React hook for navigation tracking
export const useNavigationTracking = () => {
  const tracker = NavigationTracker.getInstance();

  return {
    trackNavigation: tracker.trackNavigation.bind(tracker),
    setUserType: tracker.setUserType.bind(tracker),
    getCurrentJourney: tracker.getCurrentJourney.bind(tracker),
    getNavigationHistory: tracker.getNavigationHistory.bind(tracker),
    isDropOffPoint: tracker.isDropOffPoint.bind(tracker)
  };
};

export default NavigationTracker;