import { useState, useEffect, useCallback } from 'react'

// Extend Window so TypeScript stops complaining about gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

interface UserMetrics {
  verificationsThisMonth: number;
  averagePropertyValue: number;
  businessIndicators: string[];
  lastVerificationDate?: Date;
  totalVerifications: number;
}

interface B2BMessagingState {
  showBanner: boolean;
  showLeadCapture: boolean;
  bannerVariant: 'default' | 'compact' | 'prominent';
  leadCaptureTrigger: 'high_usage' | 'high_value' | 'business_hours' | 'manual';
  userMetrics: UserMetrics;
}

const BANNER_DISMISSAL_KEY = 'b2b-banner-dismissed';
const BANNER_COOLDOWN_DAYS = 7;

function safeLSGet(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeLSSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(key, value);
  } catch {
    // Silently ignore quota / private-mode errors
  }
}

export function useB2BMessaging() {
  const [state, setState] = useState<B2BMessagingState>({
    showBanner: false,
    showLeadCapture: false,
    bannerVariant: 'default',
    leadCaptureTrigger: 'manual',
    userMetrics: {
      verificationsThisMonth: 0,
      averagePropertyValue: 0,
      businessIndicators: [],
      totalVerifications: 0,
    },
  });

  const isBannerDismissed = useCallback((): boolean => {
    const raw = safeLSGet(BANNER_DISMISSAL_KEY);
    if (!raw) return false;
    const daysSince =
      (Date.now() - parseInt(raw, 10)) / (1_000 * 60 * 60 * 24);
    return daysSince < BANNER_COOLDOWN_DAYS;
  }, []);

  // Track B2B interactions
  const trackB2BInteraction = useCallback(
    (action: string, context?: Record<string, unknown>) => {
      try {
        window.gtag?.('event', 'b2b_interaction', {
          event_category: 'B2B',
          event_label: action,
          custom_parameters: context,
        });
      } catch (err) {
        console.warn('Failed to track B2B interaction:', err);
      }
    },
    []
  );

  // Analyze user behavior and derive messaging strategy
  const analyzeUserBehavior = useCallback(async () => {
    try {
      // TODO: replace with real analytics API call
      const metrics: UserMetrics = {
        verificationsThisMonth: Math.floor(Math.random() * 20) + 1,
        averagePropertyValue: Math.floor(Math.random() * 10_000_000) + 1_000_000,
        businessIndicators: [],
        totalVerifications: Math.floor(Math.random() * 100) + 1,
      };

      if (metrics.verificationsThisMonth > 10)
        metrics.businessIndicators.push('high_usage');
      if (metrics.averagePropertyValue > 5_000_000)
        metrics.businessIndicators.push('high_value');
      if (metrics.totalVerifications > 50)
        metrics.businessIndicators.push('power_user');

      const showBanner = !isBannerDismissed();
      let showLeadCapture = false;
      let bannerVariant: B2BMessagingState['bannerVariant'] = 'default';
      let leadCaptureTrigger: B2BMessagingState['leadCaptureTrigger'] = 'manual';

      if (metrics.verificationsThisMonth > 15) {
        bannerVariant = 'prominent';
        showLeadCapture = true;
        leadCaptureTrigger = 'high_usage';
      } else if (metrics.averagePropertyValue > 8_000_000) {
        bannerVariant = 'default';
        showLeadCapture = true;
        leadCaptureTrigger = 'high_value';
      } else {
        const hour = new Date().getHours();
        if (hour >= 9 && hour <= 17) {
          bannerVariant = 'compact';
          leadCaptureTrigger = 'business_hours';
        }
      }

      setState({ showBanner, showLeadCapture, bannerVariant, leadCaptureTrigger, userMetrics: metrics });
    } catch (err) {
      console.warn('Failed to analyze user behavior:', err);
      setState(prev => ({
        ...prev,
        showBanner: !isBannerDismissed(),
        bannerVariant: 'compact',
      }));
    }
  }, [isBannerDismissed]);

  useEffect(() => {
    analyzeUserBehavior();
  }, [analyzeUserBehavior]);

  const updateMessaging = useCallback(
    (updates: Partial<B2BMessagingState>) =>
      setState(prev => ({ ...prev, ...updates })),
    []
  );

  const hideBanner = useCallback(() => {
    safeLSSet(BANNER_DISMISSAL_KEY, String(Date.now()));
    setState(prev => ({ ...prev, showBanner: false }));
    trackB2BInteraction('banner_dismissed');
  }, [trackB2BInteraction]);

  const hideLeadCapture = useCallback(() => {
    setState(prev => ({ ...prev, showLeadCapture: false }));
    trackB2BInteraction('lead_capture_dismissed');
  }, [trackB2BInteraction]);

  /** Manually trigger the lead-capture form. Renamed from `showLeadCapture` to avoid collision with state field. */
  const openLeadCapture = useCallback(() => {
    setState(prev => ({
      ...prev,
      showLeadCapture: true,
      leadCaptureTrigger: 'manual',
    }));
    trackB2BInteraction('lead_capture_manual_trigger');
  }, [trackB2BInteraction]);

  return {
    ...state,
    updateMessaging,
    hideBanner,
    hideLeadCapture,
    openLeadCapture,
    trackB2BInteraction,
    analyzeUserBehavior,
  };
}