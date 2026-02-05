import React, { useEffect, useState } from 'react'

import { B2BCommunityInsightsPrompt } from './B2BCommunityInsightsPrompt'
import { B2BContextualPrompt } from './B2BContextualPrompt'
import { B2BFraudReportPrompt } from './B2BFraudReportPrompt'
import { B2BLeadCapture } from './B2BLeadCapture'

interface EntryPointData {
  source: 'fraud_report' | 'community_insights' | 'property_verification' | 'search_results';
  context?: Record<string, any>;
  userBehavior?: {
    timeOnPage: number;
    scrollDepth: number;
    interactionCount: number;
  };
}

interface B2BEntryPointManagerProps {
  entryPoint: EntryPointData;
  className?: string;
}

export function B2BEntryPointManager({ entryPoint, className }: B2BEntryPointManagerProps) {
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [engagementScore, setEngagementScore] = useState(0);

  // Calculate engagement score based on user behavior
  useEffect(() => {
    const calculateEngagement = () => {
      if (!entryPoint.userBehavior) return 0;
      
      const { timeOnPage, scrollDepth, interactionCount } = entryPoint.userBehavior;
      
      // Scoring algorithm
      let score = 0;
      
      // Time on page (max 40 points)
      if (timeOnPage > 120) score += 40; // 2+ minutes
      else if (timeOnPage > 60) score += 25; // 1+ minute
      else if (timeOnPage > 30) score += 15; // 30+ seconds
      
      // Scroll depth (max 30 points)
      if (scrollDepth > 80) score += 30; // 80%+ scroll
      else if (scrollDepth > 50) score += 20; // 50%+ scroll
      else if (scrollDepth > 25) score += 10; // 25%+ scroll
      
      // Interaction count (max 30 points)
      if (interactionCount > 5) score += 30; // 5+ interactions
      else if (interactionCount > 3) score += 20; // 3+ interactions
      else if (interactionCount > 1) score += 10; // 1+ interactions
      
      return score;
    };

    const score = calculateEngagement();
    setEngagementScore(score);

    // Show lead capture for highly engaged users
    if (score > 60) {
      const timer = setTimeout(() => {
        setShowLeadCapture(true);
      }, 3000); // 3 second delay
      
      return () => clearTimeout(timer);
    }
  }, [entryPoint.userBehavior]);

  // Track entry point analytics
  useEffect(() => {
    if (window?.gtag) {
      window.gtag('event', 'b2b_entry_point', {
        event_category: 'B2B',
        event_label: entryPoint.source,
        custom_parameters: {
          engagement_score: engagementScore,
          context: JSON.stringify(entryPoint.context)
        }
      });
    }
  }, [entryPoint.source, engagementScore, entryPoint.context]);

  const renderEntryPointPrompt = () => {
    switch (entryPoint.source) {
      case 'fraud_report':
        return (
          <B2BFraudReportPrompt
            className={className}
            fraudData={entryPoint.context?.fraudData}
            variant="inline"
          />
        );

      case 'community_insights':
        return (
          <B2BCommunityInsightsPrompt
            className={className}
            insightsData={entryPoint.context?.insightsData}
            variant="inline"
            context="insights_report"
          />
        );

      case 'property_verification':
        return (
          <B2BContextualPrompt
            className={className}
            context="verification_complete"
            propertyValue={entryPoint.context?.propertyValue}
            riskScore={entryPoint.context?.riskScore}
          />
        );

      case 'search_results':
        // Show different prompts based on search context
        if (entryPoint.context?.highValueResults) {
          return (
            <B2BContextualPrompt
              className={className}
              context="high_value_property"
              propertyValue={entryPoint.context.averageValue}
            />
          );
        }
        return null;

      default:
        return null;
    }
  };

  const getLeadCaptureTrigger = () => {
    switch (entryPoint.source) {
      case 'fraud_report':
        return 'fraud_detected';
      case 'community_insights':
        return 'high_usage';
      case 'property_verification':
        return 'verification_complete';
      default:
        return 'manual';
    }
  };

  return (
    <div className="space-y-4">
      {renderEntryPointPrompt()}
      
      {showLeadCapture && (
        <B2BLeadCapture
          trigger={getLeadCaptureTrigger()}
          userMetrics={{
            verificationsThisMonth: entryPoint.context?.verificationsCount || 0,
            averagePropertyValue: entryPoint.context?.averagePropertyValue || 0,
            businessIndicators: [`${entryPoint.source}_user`, 'high_engagement'],
            totalVerifications: entryPoint.context?.totalVerifications || 0
          }}
        />
      )}
    </div>
  );
}