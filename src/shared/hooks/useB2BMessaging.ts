import { useState, useEffect, useCallback } from 'react';

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
      totalVerifications: 0
    }
  });

  // Check if user has dismissed banner recently
  const isBannerDismissed = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const dismissed = localStorage.getItem('b2b-banner-dismissed');
    if (!dismissed) return false;
    
    const dismissedTime = parseInt(dismissed);
    const daysSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    // Show again after 7 days
    return daysSinceDismissal < 7;
  }, []);

  // Analyze user behavior to determine B2B messaging strategy
  const analyzeUserBehavior = useCallback(async () => {
    try {
      // In a real app, this would fetch from your analytics API
      // For now, we'll simulate based on localStorage or session data
      
      const mockMetrics: UserMetrics = {
        verificationsThisMonth: Math.floor(Math.random() * 20) + 1,
        averagePropertyValue: Math.floor(Math.random() * 10000000) + 1000000,
        businessIndicators: [],
        totalVerifications: Math.floor(Math.random() * 100) + 1
      };

      // Determine business indicators
      if (mockMetrics.verificationsThisMonth > 10) {
        mockMetrics.businessIndicators.push('high_usage');
      }
      if (mockMetrics.averagePropertyValue > 5000000) {
        mockMetrics.businessIndicators.push('high_value');
      }
      if (mockMetrics.totalVerifications > 50) {
        mockMetrics.businessIndicators.push('power_user');
      }

      // Determine messaging strategy
      let showBanner = !isBannerDismissed();
      let showLeadCapture = false;
      let bannerVariant: 'default' | 'compact' | 'prominent' = 'default';
      let leadCaptureTrigger: 'high_usage' | 'high_value' | 'business_hours' | 'manual' = 'manual';

      // High usage users get prominent messaging
      if (mockMetrics.verificationsThisMonth > 15) {
        bannerVariant = 'prominent';
        showLeadCapture = true;
        leadCaptureTrigger = 'high_usage';
      }
      // High value users get targeted messaging
      else if (mockMetrics.averagePropertyValue > 8000000) {
        bannerVariant = 'default';
        showLeadCapture = true;
        leadCaptureTrigger = 'high_value';
      }
      // Business hours users get subtle messaging
      else {
        const hour = new Date().getHours();
        if (hour >= 9 && hour <= 17) {
          bannerVariant = 'compact';
          leadCaptureTrigger = 'business_hours';
        }
      }

      setState({
        showBanner,
        showLeadCapture,
        bannerVariant,
        leadCaptureTrigger,
        userMetrics: mockMetrics
      });

    } catch (error) {
      console.warn('Failed to analyze user behavior:', error);
      // Fallback to basic messaging
      setState(prev => ({
        ...prev,
        showBanner: !isBannerDismissed(),
        bannerVariant: 'compact'
      }));
    }
  }, [isBannerDismissed]);

  // Track B2B interactions
  const trackB2BInteraction = useCallback((action: string, context?: Record<string, any>) => {
    try {
      // Google Analytics tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'b2b_interaction', {
          event_category: 'B2B',
          event_label: action,
          custom_parameters: context
        });
      }

      // Your internal analytics
      // await fetch('/api/analytics/b2b-interaction', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ action, context, timestamp: Date.now() })
      // });

    } catch (error) {
      console.warn('Failed to track B2B interaction:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    analyzeUserBehavior();
  }, [analyzeUserBehavior]);

  // Update messaging based on user actions
  const updateMessaging = useCallback((updates: Partial<B2BMessagingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Hide banner (user dismissed)
  const hideBanner = useCallback(() => {
    setState(prev => ({ ...prev, showBanner: false }));
    trackB2BInteraction('banner_dismissed');
  }, [trackB2BInteraction]);

  // Hide lead capture
  const hideLeadCapture = useCallback(() => {
    setState(prev => ({ ...prev, showLeadCapture: false }));
    trackB2BInteraction('lead_capture_dismissed');
  }, [trackB2BInteraction]);

  // Show lead capture manually
  const showLeadCapture = useCallback(() => {
    setState(prev => ({ ...prev, showLeadCapture: true, leadCaptureTrigger: 'manual' }));
    trackB2BInteraction('lead_capture_manual_trigger');
  }, [trackB2BInteraction]);

  return {
    ...state,
    updateMessaging,
    hideBanner,
    hideLeadCapture,
    showLeadCapture,
    trackB2BInteraction,
    analyzeUserBehavior
  };
}