import { trustApi } from './trust-api';
import { TrustBusinessLogic } from './trust-business-logic';
import { 
  TrustScore, 
  TrustScoreAnalysis, 
  TrustScoreHistory, 
  VerificationCheck, 
  VerificationOverview,
  CommunityTrustOverview,
  FraudAlert
} from '../types/trust.types';
import { ApiResponse } from './fraudDetectionApi';

/**
 * Trust Service Orchestrator
 * 
 * Separates data fetching (API) from business rules (Logic) by coordinating
 * both layers to provide enriched domain data to the application.
 */
export class TrustService {
  /**
   * Fetch user trust score and perform analysis
   */
  static async getTrustScore(userId: string): Promise<ApiResponse<{
    trustScore: TrustScore;
    analysis: TrustScoreAnalysis;
    history: TrustScoreHistory;
  }>> {
    const response = await trustApi.getTrustScore(userId);
    
    if (response.success && response.data) {
      // Enrich with calculated analysis if not already provided or if client-side verification is needed
      response.data.analysis = TrustBusinessLogic.enrichTrustScore(response.data.trustScore.factors);
    }
    
    return response;
  }

  /**
   * Update trust score factors with logic-based gating
   */
  static async updateTrustScore(
    userId: string, 
    factors: Partial<TrustScore['factors']>
  ): Promise<ApiResponse<TrustScore>> {
    // 1. Fetch current score to determine if update is significant/due
    const currentResponse = await trustApi.getTrustScore(userId);
    if (!currentResponse.success || !currentResponse.data) {
      return { success: false, message: 'Failed to retrieve current trust score for update gating' };
    }

    // 2. Apply business logic to decide if update should proceed
    const decision = TrustBusinessLogic.shouldUpdateTrustScore(
      currentResponse.data.trustScore, 
      factors
    );

    if (!decision.shouldUpdate) {
      return { 
        success: true, 
        data: currentResponse.data.trustScore, 
        message: decision.reason 
      };
    }

    // 3. Perform the actual update
    return trustApi.updateTrustScore(userId, factors);
  }

  /**
   * Get detailed verification status with completion metrics and next steps
   */
  static async getVerificationOverview(userId: string): Promise<ApiResponse<VerificationOverview>> {
    const response = await trustApi.getVerificationStatus(userId);
    
    if (response.success && response.data) {
      // Apply enrichment logic to derive percentages and statuses
      const enriched = TrustBusinessLogic.deriveVerificationOverview(response.data.checks);
      return {
        success: true,
        data: enriched
      };
    }
    
    return {
      success: false,
      message: response.message || 'Failed to fetch verification status'
    };
  }

  /**
   * Get community trust data with insights
   */
  static async getCommunityTrust(userId: string): Promise<ApiResponse<CommunityTrustOverview & {
    references: any[];
    reviews: any[];
    communityEngagement: any[];
  }>> {
    const response = await trustApi.getCommunityTrust(userId);

    if (response.success && response.data) {
      const enrichment = TrustBusinessLogic.enrichCommunityTrustData({
        references: response.data.references,
        reviews: response.data.reviews,
        communityEngagement: response.data.communityEngagement,
        reportedIssues: response.data.reportedIssues
      });

      return {
        success: true,
        data: {
          ...enrichment,
          references: response.data.references,
          reviews: response.data.reviews,
          communityEngagement: response.data.communityEngagement
        }
      };
    }

    return response as any;
  }

  /**
   * Wrappers for simple API methods (Passthrough)
   */
  static submitDocumentVerification = trustApi.submitDocumentVerification;
  static reportFraud = trustApi.reportFraud;
  static getFraudAlerts = trustApi.getFraudAlerts;
  static performFraudAssessment = trustApi.performFraudAssessment;
  static addCommunityReference = trustApi.addCommunityReference;
  static recalculateTrustScore = trustApi.recalculateTrustScore;
  static getTrustInsights = trustApi.getTrustInsights;
}

// Export singleton instance
export const trustService = TrustService;
