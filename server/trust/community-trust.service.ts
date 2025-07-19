/**
 * Community Trust AI Service
 * 
 * Analyzes behavioral patterns, social connections, and community trust
 * instead of documents. This is the NEW primary verification system.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { 
  BehaviorPattern, 
  CommunityReference, 
  SocialConnection,
  LocationTrust,
  CommunityEndorsement,
  TrustScore,
  TrustLevel
} from '../shared/community-trust-schema';
import { calculateTrustScore, getTrustLevelFromScore, getTrustLevelRequirements } from '../shared/community-trust-schema';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// ============================================================================
// BEHAVIORAL ANALYSIS AI
// ============================================================================

interface BehaviorAnalysisInput {
  userId: number;
  messageHistory: Array<{
    content: string;
    timestamp: Date;
    responseTime: number; // minutes to respond
  }>;
  profileData: {
    completeness: number;
    consistency: Record<string, any>;
    lastUpdated: Date;
  };
  interactionHistory: Array<{
    type: 'inquiry' | 'response' | 'transaction' | 'review';
    quality: number; // 1-10 human or AI rated
    timestamp: Date;
  }>;
}

interface BehaviorAnalysisResult {
  communicationQuality: number; // 1-10
  consistencyScore: number; // 1-10
  reliabilityScore: number; // 1-10
  riskIndicators: string[];
  positiveIndicators: string[];
  recommendedTrustLevel: TrustLevel;
  confidence: number; // 0-1
}

class BehaviorAnalysisAI {
  
  async analyzeBehavior(input: BehaviorAnalysisInput): Promise<BehaviorAnalysisResult> {
    try {
      const prompt = this.buildBehaviorAnalysisPrompt(input);
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      return this.parseBehaviorAnalysis(response, input);
    } catch (error) {
      console.error('Behavior analysis failed:', error);
      return this.getDefaultBehaviorAnalysis();
    }
  }

  private buildBehaviorAnalysisPrompt(input: BehaviorAnalysisInput): string {
    return `
Analyze this user's behavior patterns for a real estate platform in Kenya. Focus on trustworthiness indicators.

USER DATA:
- Profile Completeness: ${input.profileData.completeness}%
- Average Response Time: ${this.calculateAverageResponseTime(input.messageHistory)} minutes
- Total Interactions: ${input.interactionHistory.length}
- Recent Activity: ${input.messageHistory.length} messages in last 30 days

MESSAGE QUALITY ANALYSIS:
${input.messageHistory.slice(-5).map(msg => `
- Message: "${msg.content.substring(0, 100)}..."
- Response Time: ${msg.responseTime} minutes
`).join('')}

INTERACTION PATTERNS:
${input.interactionHistory.slice(-10).map(interaction => `
- Type: ${interaction.type}
- Quality: ${interaction.quality}/10
- Date: ${interaction.timestamp.toISOString().split('T')[0]}
`).join('')}

ANALYZE FOR:
1. Communication Quality (1-10): Grammar, clarity, professionalism, helpfulness
2. Consistency Score (1-10): Information consistency across interactions
3. Reliability Score (1-10): Response times, follow-through, commitment
4. Risk Indicators: Red flags or concerning patterns
5. Positive Indicators: Trust-building behaviors
6. Recommended Trust Level: newcomer, community, verified, premium, or champion

Respond in JSON format:
{
  "communicationQuality": number,
  "consistencyScore": number,
  "reliabilityScore": number,
  "riskIndicators": ["indicator1", "indicator2"],
  "positiveIndicators": ["indicator1", "indicator2"],
  "recommendedTrustLevel": "level",
  "confidence": number,
  "reasoning": "explanation"
}
    `;
  }

  private parseBehaviorAnalysis(response: string, input: BehaviorAnalysisInput): BehaviorAnalysisResult {
    try {
      const parsed = JSON.parse(response);
      return {
        communicationQuality: Math.max(1, Math.min(10, parsed.communicationQuality || 5)),
        consistencyScore: Math.max(1, Math.min(10, parsed.consistencyScore || 5)),
        reliabilityScore: Math.max(1, Math.min(10, parsed.reliabilityScore || 5)),
        riskIndicators: parsed.riskIndicators || [],
        positiveIndicators: parsed.positiveIndicators || [],
        recommendedTrustLevel: parsed.recommendedTrustLevel || 'newcomer',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5))
      };
    } catch (error) {
      return this.getDefaultBehaviorAnalysis();
    }
  }

  private calculateAverageResponseTime(messages: BehaviorAnalysisInput['messageHistory']): number {
    if (messages.length === 0) return 0;
    const total = messages.reduce((sum, msg) => sum + msg.responseTime, 0);
    return Math.round(total / messages.length);
  }

  private getDefaultBehaviorAnalysis(): BehaviorAnalysisResult {
    return {
      communicationQuality: 5,
      consistencyScore: 5,
      reliabilityScore: 5,
      riskIndicators: ['Insufficient data for analysis'],
      positiveIndicators: [],
      recommendedTrustLevel: 'newcomer',
      confidence: 0.3
    };
  }
}

// ============================================================================
// COMMUNITY TRUST ANALYSIS AI
// ============================================================================

interface CommunityTrustInput {
  userId: number;
  references: CommunityReference[];
  endorsements: CommunityEndorsement[];
  socialConnections: SocialConnection[];
  locationTrust: LocationTrust;
}

interface CommunityTrustResult {
  communityScore: number; // 0-100
  socialScore: number; // 0-100
  locationScore: number; // 0-100
  endorsementScore: number; // 0-100
  riskAssessment: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  trustFactors: string[];
  concerns: string[];
  recommendations: string[];
}

class CommunityTrustAI {

  async analyzeCommunityTrust(input: CommunityTrustInput): Promise<CommunityTrustResult> {
    try {
      const prompt = this.buildCommunityTrustPrompt(input);
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      return this.parseCommunityTrustAnalysis(response, input);
    } catch (error) {
      console.error('Community trust analysis failed:', error);
      return this.getDefaultCommunityTrustAnalysis();
    }
  }

  private buildCommunityTrustPrompt(input: CommunityTrustInput): string {
    return `
Analyze community trust for a user on a Kenyan real estate platform. Consider cultural context and local trust networks.

COMMUNITY REFERENCES (${input.references.length}):
${input.references.map(ref => `
- Type: ${ref.referenceType}
- Relationship: ${ref.relationship}
- Years Known: ${ref.yearsKnown}
- Trust Rating: ${ref.trustRating}/10
- Status: ${ref.verificationStatus}
`).join('')}

COMMUNITY ENDORSEMENTS (${input.endorsements.length}):
${input.endorsements.map(end => `
- Endorser: ${end.endorserType} - ${end.endorserTitle}
- Level: ${end.endorsementLevel}/10
- Reason: ${end.endorsementReason}
- Status: ${end.verificationStatus}
`).join('')}

SOCIAL CONNECTIONS (${input.socialConnections.length}):
${input.socialConnections.slice(0, 5).map(conn => `
- Connection Type: ${conn.connectionType}
- Strength: ${conn.connectionStrength}/10
- Mutual Connections: ${conn.mutualConnections}
`).join('')}

LOCATION TRUST:
- Area: ${input.locationTrust.area}, ${input.locationTrust.city}
- Years in Area: ${input.locationTrust.yearsInArea}
- Local Knowledge: ${input.locationTrust.localKnowledge}/10
- Neighborhood Reputation: ${input.locationTrust.neighborhoodReputation}/10
- Physical Presence: ${input.locationTrust.physicalPresence}
- Local Business Owner: ${input.locationTrust.localBusinessOwner}
- Community Involvement: ${input.locationTrust.communityInvolvement}/10

ANALYZE FOR KENYAN CONTEXT:
1. Community Score (0-100): Quality and diversity of references
2. Social Score (0-100): Network strength and connections
3. Location Score (0-100): Area reputation and local presence
4. Endorsement Score (0-100): Community leader validation
5. Risk Assessment: Overall risk level
6. Trust Factors: What builds trust for this user
7. Concerns: Any red flags or areas of concern
8. Recommendations: How to improve trust score

Respond in JSON format:
{
  "communityScore": number,
  "socialScore": number,
  "locationScore": number,
  "endorsementScore": number,
  "riskAssessment": "risk_level",
  "trustFactors": ["factor1", "factor2"],
  "concerns": ["concern1", "concern2"],
  "recommendations": ["rec1", "rec2"]
}
    `;
  }

  private parseCommunityTrustAnalysis(response: string, input: CommunityTrustInput): CommunityTrustResult {
    try {
      const parsed = JSON.parse(response);
      return {
        communityScore: Math.max(0, Math.min(100, parsed.communityScore || 0)),
        socialScore: Math.max(0, Math.min(100, parsed.socialScore || 0)),
        locationScore: Math.max(0, Math.min(100, parsed.locationScore || 0)),
        endorsementScore: Math.max(0, Math.min(100, parsed.endorsementScore || 0)),
        riskAssessment: parsed.riskAssessment || 'medium',
        trustFactors: parsed.trustFactors || [],
        concerns: parsed.concerns || [],
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      return this.getDefaultCommunityTrustAnalysis();
    }
  }

  private getDefaultCommunityTrustAnalysis(): CommunityTrustResult {
    return {
      communityScore: 0,
      socialScore: 0,
      locationScore: 0,
      endorsementScore: 0,
      riskAssessment: 'high',
      trustFactors: [],
      concerns: ['Insufficient community data'],
      recommendations: ['Add community references', 'Complete location information']
    };
  }
}

// ============================================================================
// COMPREHENSIVE TRUST CALCULATOR
// ============================================================================

interface ComprehensiveTrustInput {
  userId: number;
  behaviorPattern: BehaviorPattern;
  communityReferences: CommunityReference[];
  socialConnections: SocialConnection[];
  locationTrust: LocationTrust;
  endorsements: CommunityEndorsement[];
  transactionHistory: {
    successfulTransactions: number;
    totalValue: number;
    averageRating: number;
    cancellationRate: number;
  };
}

interface ComprehensiveTrustResult {
  overallScore: number; // 0-1000
  trustLevel: TrustLevel;
  maxTransactionValue: number;
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  scoreBreakdown: {
    community: number;
    behavior: number;
    social: number;
    location: number;
    endorsement: number;
    transaction: number;
  };
  recommendations: string[];
  nextLevelRequirements: string[];
}

class ComprehensiveTrustCalculator {
  private behaviorAI = new BehaviorAnalysisAI();
  private communityAI = new CommunityTrustAI();

  async calculateComprehensiveTrust(input: ComprehensiveTrustInput): Promise<ComprehensiveTrustResult> {
    // Get AI analysis for community trust
    const communityAnalysis = await this.communityAI.analyzeCommunityTrust({
      userId: input.userId,
      references: input.communityReferences,
      endorsements: input.endorsements,
      socialConnections: input.socialConnections,
      locationTrust: input.locationTrust
    });

    // Calculate individual scores
    const scoreBreakdown = {
      community: communityAnalysis.communityScore,
      behavior: this.calculateBehaviorScore(input.behaviorPattern),
      social: communityAnalysis.socialScore,
      location: communityAnalysis.locationScore,
      endorsement: communityAnalysis.endorsementScore,
      transaction: this.calculateTransactionScore(input.transactionHistory)
    };

    // Calculate overall score using weighted formula
    const overallScore = calculateTrustScore(
      scoreBreakdown.community,
      scoreBreakdown.behavior,
      scoreBreakdown.social,
      scoreBreakdown.location,
      scoreBreakdown.endorsement,
      scoreBreakdown.transaction
    );

    const trustLevel = getTrustLevelFromScore(overallScore);
    const requirements = getTrustLevelRequirements(trustLevel);

    return {
      overallScore,
      trustLevel,
      maxTransactionValue: requirements.maxTransactionValue,
      riskLevel: this.calculateRiskLevel(overallScore, communityAnalysis.riskAssessment),
      scoreBreakdown,
      recommendations: this.generateRecommendations(scoreBreakdown, communityAnalysis),
      nextLevelRequirements: this.getNextLevelRequirements(trustLevel, scoreBreakdown)
    };
  }

  private calculateBehaviorScore(pattern: BehaviorPattern): number {
    // Convert behavior pattern to 0-100 score
    const weights = {
      profileCompleteness: 0.2,
      communicationQuality: 0.3,
      consistencyScore: 0.2,
      activityLevel: 0.15,
      responseTime: 0.15
    };

    const responseTimeScore = Math.max(0, 100 - (pattern.responseTimeAvg / 60) * 10); // Penalize slow responses
    
    return Math.round(
      pattern.profileCompleteness * weights.profileCompleteness +
      (pattern.communicationQuality * 10) * weights.communicationQuality +
      (pattern.consistencyScore * 10) * weights.consistencyScore +
      (pattern.activityLevel * 10) * weights.activityLevel +
      responseTimeScore * weights.responseTime
    );
  }

  private calculateTransactionScore(history: ComprehensiveTrustInput['transactionHistory']): number {
    if (history.successfulTransactions === 0) return 0;

    const baseScore = Math.min(100, history.successfulTransactions * 5); // 5 points per transaction, max 100
    const ratingBonus = (history.averageRating - 3) * 10; // Bonus for ratings above 3
    const cancellationPenalty = history.cancellationRate * 50; // Penalty for cancellations

    return Math.max(0, Math.round(baseScore + ratingBonus - cancellationPenalty));
  }

  private calculateRiskLevel(
    overallScore: number, 
    communityRisk: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  ): 'very_low' | 'low' | 'medium' | 'high' | 'very_high' {
    // Combine score-based risk with community risk assessment
    const scoreRisk = overallScore >= 800 ? 'very_low' :
                     overallScore >= 600 ? 'low' :
                     overallScore >= 400 ? 'medium' :
                     overallScore >= 200 ? 'high' : 'very_high';

    // Take the higher risk level
    const riskLevels = ['very_low', 'low', 'medium', 'high', 'very_high'];
    const scoreRiskIndex = riskLevels.indexOf(scoreRisk);
    const communityRiskIndex = riskLevels.indexOf(communityRisk);

    return riskLevels[Math.max(scoreRiskIndex, communityRiskIndex)] as any;
  }

  private generateRecommendations(
    scores: ComprehensiveTrustResult['scoreBreakdown'],
    communityAnalysis: CommunityTrustResult
  ): string[] {
    const recommendations: string[] = [];

    if (scores.community < 50) {
      recommendations.push('Add more community references from different relationship types');
      recommendations.push('Get verification from local community leaders');
    }

    if (scores.behavior < 60) {
      recommendations.push('Complete your profile with detailed information');
      recommendations.push('Respond more quickly to messages and inquiries');
      recommendations.push('Maintain consistent information across all interactions');
    }

    if (scores.social < 40) {
      recommendations.push('Connect with other verified users on the platform');
      recommendations.push('Build relationships through successful transactions');
    }

    if (scores.location < 50) {
      recommendations.push('Provide more detailed local area knowledge');
      recommendations.push('Increase community involvement in your area');
    }

    if (scores.endorsement < 30) {
      recommendations.push('Seek endorsements from church leaders or local officials');
      recommendations.push('Join local business or community associations');
    }

    if (scores.transaction < 20) {
      recommendations.push('Start with small transactions to build history');
      recommendations.push('Always complete agreed transactions');
      recommendations.push('Maintain high ratings from transaction partners');
    }

    return recommendations.concat(communityAnalysis.recommendations);
  }

  private getNextLevelRequirements(
    currentLevel: TrustLevel, 
    scores: ComprehensiveTrustResult['scoreBreakdown']
  ): string[] {
    const nextLevels = {
      'newcomer': 'community',
      'community': 'verified',
      'verified': 'premium',
      'premium': 'champion',
      'champion': 'champion' // Already at top
    };

    const nextLevel = nextLevels[currentLevel as keyof typeof nextLevels];
    if (nextLevel === currentLevel) return ['You have reached the highest trust level!'];

    const requirements = getTrustLevelRequirements(nextLevel as TrustLevel);
    return requirements.requirements.map(req => {
      switch (req) {
        case 'community_references_2+':
          return 'Get at least 2 verified community references';
        case 'behavior_score_6+':
          return 'Maintain behavior score of 60+ points';
        case 'successful_transactions_5+':
          return 'Complete at least 5 successful transactions';
        case 'social_connections_10+':
          return 'Build connections with 10+ other users';
        case 'community_endorsement':
          return 'Get endorsement from a community leader';
        case 'location_trust_8+':
          return 'Build location trust score to 80+ points';
        case 'behavior_score_8+':
          return 'Maintain behavior score of 80+ points';
        case 'multiple_endorsements':
          return 'Get endorsements from multiple community leaders';
        case 'transaction_history_50+':
          return 'Complete 50+ successful transactions';
        case 'zero_flags':
          return 'Maintain zero flagged interactions';
        default:
          return req.replace(/_/g, ' ');
      }
    });
  }
}

// ============================================================================
// PHYSICAL VERIFICATION AI (SECONDARY)
// ============================================================================

interface PhysicalVerificationInput {
  requestType: 'in_person_meeting' | 'agent_verification' | 'document_check';
  transactionValue: number;
  userTrustLevel: TrustLevel;
  meetingNotes?: string;
  documentsPresented?: string[];
  verifierAssessment?: string;
}

interface PhysicalVerificationResult {
  verificationScore: number; // 0-100
  documentsVerified: boolean;
  identityConfirmed: boolean;
  riskAssessment: 'low' | 'medium' | 'high';
  recommendations: string[];
  trustImpact: number; // +/- points to add to trust score
}

class PhysicalVerificationAI {

  async analyzePhysicalVerification(input: PhysicalVerificationInput): Promise<PhysicalVerificationResult> {
    try {
      const prompt = this.buildPhysicalVerificationPrompt(input);
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      return this.parsePhysicalVerificationAnalysis(response);
    } catch (error) {
      console.error('Physical verification analysis failed:', error);
      return this.getDefaultPhysicalVerificationAnalysis();
    }
  }

  private buildPhysicalVerificationPrompt(input: PhysicalVerificationInput): string {
    return `
Analyze physical verification results for a Kenyan real estate transaction.

VERIFICATION DETAILS:
- Type: ${input.requestType}
- Transaction Value: KES ${input.transactionValue.toLocaleString()}
- User Trust Level: ${input.userTrustLevel}
- Meeting Notes: ${input.meetingNotes || 'Not provided'}
- Documents Presented: ${input.documentsPresented?.join(', ') || 'None specified'}
- Verifier Assessment: ${input.verifierAssessment || 'Not provided'}

ANALYZE FOR:
1. Verification Score (0-100): Overall verification quality
2. Documents Verified: Were documents authentic and complete?
3. Identity Confirmed: Was identity properly verified?
4. Risk Assessment: low/medium/high risk level
5. Recommendations: What additional steps are needed?
6. Trust Impact: How many points (+/-) should be added to trust score?

Consider:
- Kenyan document standards and common fraud patterns
- Appropriate verification level for transaction value
- Cultural context of in-person meetings
- Balance between security and user experience

Respond in JSON format:
{
  "verificationScore": number,
  "documentsVerified": boolean,
  "identityConfirmed": boolean,
  "riskAssessment": "risk_level",
  "recommendations": ["rec1", "rec2"],
  "trustImpact": number,
  "reasoning": "explanation"
}
    `;
  }

  private parsePhysicalVerificationAnalysis(response: string): PhysicalVerificationResult {
    try {
      const parsed = JSON.parse(response);
      return {
        verificationScore: Math.max(0, Math.min(100, parsed.verificationScore || 0)),
        documentsVerified: parsed.documentsVerified || false,
        identityConfirmed: parsed.identityConfirmed || false,
        riskAssessment: parsed.riskAssessment || 'high',
        recommendations: parsed.recommendations || [],
        trustImpact: Math.max(-50, Math.min(100, parsed.trustImpact || 0))
      };
    } catch (error) {
      return this.getDefaultPhysicalVerificationAnalysis();
    }
  }

  private getDefaultPhysicalVerificationAnalysis(): PhysicalVerificationResult {
    return {
      verificationScore: 0,
      documentsVerified: false,
      identityConfirmed: false,
      riskAssessment: 'high',
      recommendations: ['Complete proper verification process'],
      trustImpact: 0
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  BehaviorAnalysisAI,
  CommunityTrustAI,
  ComprehensiveTrustCalculator,
  PhysicalVerificationAI
};

export type {
  BehaviorAnalysisInput,
  BehaviorAnalysisResult,
  CommunityTrustInput,
  CommunityTrustResult,
  ComprehensiveTrustInput,
  ComprehensiveTrustResult,
  PhysicalVerificationInput,
  PhysicalVerificationResult
};