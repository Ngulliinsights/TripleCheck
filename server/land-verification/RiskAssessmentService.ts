import { EventEmitter } from 'events';
import { logger } from '../infrastructure/monitoring/logger';
import { db } from '../infrastructure/database/connection';
import { 
  riskFactors,
  landVerificationSessions,
  verificationLayers,
  governmentDesignations,
  communityFeedback
} from '../../src/shared/schema';
import { eq, and, desc } from 'drizzle-orm';

// Core interfaces for risk assessment
export interface RiskProfile {
  overallRiskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  riskFactors: RiskFactor[];
  riskInteractions: RiskInteraction[];
  recommendations: Recommendation[];
  assessmentDate: Date;
  validUntil: Date;
}

export interface RiskFactor {
  id: string;
  category: 'ownership' | 'government' | 'legal' | 'physical' | 'community';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  description: string;
  evidence: string[];
  impact: string;
  likelihood: number; // 0-1
  mitigation?: string[];
  sourceLayer: string;
  weight: number; // Calculated weight for scoring
}

export interface RiskInteraction {
  id: string;
  riskFactorIds: string[];
  interactionType: 'amplifying' | 'mitigating' | 'neutral';
  description: string;
  combinedImpact: number; // 0-1
  confidenceAdjustment: number; // -1 to 1
}

export interface Recommendation {
  id: string;
  priority: 'low' | 'medium' | 'high';
  category: 'risk_mitigation' | 'verification' | 'legal' | 'expert_consultation';
  title: string;
  description: string;
  actionItems: string[];
  estimatedCost?: number;
  estimatedTime?: string;
  riskReduction?: number; // Expected risk score reduction
}

export interface PropertyData {
  id: string;
  location: string;
  price: number;
  features?: Record<string, any>;
  coordinates?: { lat: number; lng: number };
}

export interface VerificationResult {
  layerType: string;
  status: 'pass' | 'fail' | 'warning';
  score: number;
  confidence: number;
  results: any[];
  completedAt: Date;
}

/**
 * Risk Assessment Service for Kenya Land Verification System
 * 
 * Implements comprehensive risk scoring algorithms, risk factor identification,
 * risk interaction analysis, and recommendation generation based on verification results.
 */
export class RiskAssessmentService extends EventEmitter {
  private readonly RISK_WEIGHTS = {
    ownership: 0.25,    // 25% - Core ownership verification
    government: 0.20,   // 20% - Government designation risks
    legal: 0.20,        // 20% - Legal history and disputes
    physical: 0.20,     // 20% - Physical verification results
    community: 0.15     // 15% - Community intelligence
  };

  private readonly SEVERITY_MULTIPLIERS = {
    low: 1.0,
    medium: 2.0,
    high: 3.5,
    critical: 5.0
  };

  private readonly INTERACTION_PATTERNS = [
    {
      categories: ['ownership', 'legal'],
      type: 'amplifying' as const,
      multiplier: 1.5,
      description: 'Ownership disputes combined with legal issues significantly increase risk'
    },
    {
      categories: ['government', 'physical'],
      type: 'amplifying' as const,
      multiplier: 1.3,
      description: 'Government designation conflicts with physical boundaries create compound risks'
    },
    {
      categories: ['community', 'ownership'],
      type: 'amplifying' as const,
      multiplier: 1.4,
      description: 'Community concerns about ownership create credibility issues'
    },
    {
      categories: ['physical', 'legal'],
      type: 'mitigating' as const,
      multiplier: 0.8,
      description: 'Strong physical verification can offset some legal uncertainties'
    }
  ];

  constructor() {
    super();
  }

  /**
   * Calculate overall risk score based on verification results
   * Requirement 7.1: Generate overall risk profile for the property
   * Requirement 7.2: Weight different verification methods appropriately
   */
  async calculateOverallRisk(verificationResults: VerificationResult[]): Promise<RiskProfile> {
    const startTime = Date.now();
    
    try {
      // Step 1: Identify risk factors from verification results
      const riskFactors = await this.identifyRiskFactors({} as PropertyData, verificationResults);
      
      // Step 2: Analyze risk interactions
      const riskInteractions = await this.analyzeRiskInteractions(riskFactors);
      
      // Step 3: Calculate weighted risk score
      const { overallScore, confidence } = this.calculateWeightedRiskScore(riskFactors, riskInteractions);
      
      // Step 4: Determine risk level
      const riskLevel = this.determineRiskLevel(overallScore);
      
      // Step 5: Generate recommendations
      const recommendations = await this.generateRecommendations(riskFactors, riskInteractions, riskLevel);
      
      const riskProfile: RiskProfile = {
        overallRiskScore: Math.round(overallScore * 100) / 100,
        riskLevel,
        confidence: Math.round(confidence * 100) / 100,
        riskFactors,
        riskInteractions,
        recommendations,
        assessmentDate: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      this.emit('riskAssessmentCompleted', {
        riskProfile,
        processingTime: Date.now() - startTime
      });

      logger.info('Risk assessment completed', {
        overallScore: riskProfile.overallRiskScore,
        riskLevel: riskProfile.riskLevel,
        factorCount: riskFactors.length,
        processingTime: Date.now() - startTime
      });

      return riskProfile;
    } catch (error) {
      logger.error('Risk assessment failed', { error: error.message });
      throw new Error(`Risk assessment failed: ${error.message}`);
    }
  }

  /**
   * Identify risk factors from property data and verification results
   * Requirement 7.3: Identify specific risk factors and categorize them
   */
  async identifyRiskFactors(propertyData: PropertyData, verificationResults: VerificationResult[]): Promise<RiskFactor[]> {
    const riskFactors: RiskFactor[] = [];

    for (const result of verificationResults) {
      const layerRiskFactors = await this.extractRiskFactorsFromLayer(result);
      riskFactors.push(...layerRiskFactors);
    }

    // Calculate weights for each risk factor
    riskFactors.forEach(factor => {
      factor.weight = this.calculateRiskFactorWeight(factor);
    });

    return riskFactors;
  }

  /**
   * Analyze interactions between risk factors
   * Requirement 7.4: Analyze how different risks interact and compound
   */
  async analyzeRiskInteractions(riskFactors: RiskFactor[]): Promise<RiskInteraction[]> {
    const interactions: RiskInteraction[] = [];

    // Group risk factors by category for interaction analysis
    const factorsByCategory = riskFactors.reduce((acc, factor) => {
      if (!acc[factor.category]) acc[factor.category] = [];
      acc[factor.category].push(factor);
      return acc;
    }, {} as Record<string, RiskFactor[]>);

    // Check for known interaction patterns
    for (const pattern of this.INTERACTION_PATTERNS) {
      const relevantCategories = pattern.categories.filter(cat => factorsByCategory[cat]?.length > 0);
      
      if (relevantCategories.length === pattern.categories.length) {
        const involvedFactors = pattern.categories.flatMap(cat => factorsByCategory[cat]);
        
        const interaction: RiskInteraction = {
          id: `interaction_${interactions.length + 1}`,
          riskFactorIds: involvedFactors.map(f => f.id),
          interactionType: pattern.type,
          description: pattern.description,
          combinedImpact: this.calculateCombinedImpact(involvedFactors, pattern.multiplier),
          confidenceAdjustment: pattern.type === 'amplifying' ? -0.1 : 0.1
        };

        interactions.push(interaction);
      }
    }

    return interactions;
  }

  /**
   * Generate recommendations based on risk profile
   * Requirement 7.5: Provide actionable recommendations for risk mitigation
   */
  async generateRecommendations(
    riskFactors: RiskFactor[], 
    riskInteractions: RiskInteraction[], 
    riskLevel: string
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // High-priority recommendations for critical risks
    const criticalFactors = riskFactors.filter(f => f.severity === 'critical');
    for (const factor of criticalFactors) {
      recommendations.push(await this.createCriticalRiskRecommendation(factor));
    }

    // Category-specific recommendations
    const ownershipRisks = riskFactors.filter(f => f.category === 'ownership');
    if (ownershipRisks.length > 0) {
      recommendations.push(await this.createOwnershipRecommendation(ownershipRisks));
    }

    const legalRisks = riskFactors.filter(f => f.category === 'legal');
    if (legalRisks.length > 0) {
      recommendations.push(await this.createLegalRecommendation(legalRisks));
    }

    const governmentRisks = riskFactors.filter(f => f.category === 'government');
    if (governmentRisks.length > 0) {
      recommendations.push(await this.createGovernmentRecommendation(governmentRisks));
    }

    // Interaction-based recommendations
    const amplifyingInteractions = riskInteractions.filter(i => i.interactionType === 'amplifying');
    if (amplifyingInteractions.length > 0) {
      recommendations.push(await this.createInteractionRecommendation(amplifyingInteractions));
    }

    // Sort by priority and risk reduction potential
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }  /**

   * Extract risk factors from a specific verification layer
   */
  private async extractRiskFactorsFromLayer(result: VerificationResult): Promise<RiskFactor[]> {
    const riskFactors: RiskFactor[] = [];

    // Handle different layer types
    switch (result.layerType) {
      case 'ownership':
        riskFactors.push(...this.extractOwnershipRisks(result));
        break;
      case 'government':
        riskFactors.push(...this.extractGovernmentRisks(result));
        break;
      case 'legal':
        riskFactors.push(...this.extractLegalRisks(result));
        break;
      case 'physical':
        riskFactors.push(...this.extractPhysicalRisks(result));
        break;
      case 'community':
        riskFactors.push(...this.extractCommunityRisks(result));
        break;
    }

    return riskFactors;
  }

  /**
   * Extract ownership-related risk factors
   */
  private extractOwnershipRisks(result: VerificationResult): RiskFactor[] {
    const risks: RiskFactor[] = [];

    if (result.status === 'fail' || result.score < 0.5) {
      risks.push({
        id: `ownership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category: 'ownership',
        severity: result.score < 0.3 ? 'critical' : result.score < 0.6 ? 'high' : 'medium',
        confidence: result.confidence,
        description: 'Ownership verification failed or returned low confidence results',
        evidence: result.results.map(r => r.description || 'Verification result'),
        impact: 'Property ownership may be disputed or unclear',
        likelihood: 1 - result.score,
        mitigation: [
          'Obtain additional ownership documentation',
          'Conduct legal title search',
          'Verify with multiple government databases'
        ],
        sourceLayer: result.layerType,
        weight: 0
      });
    }

    return risks;
  }

  /**
   * Extract government-related risk factors
   */
  private extractGovernmentRisks(result: VerificationResult): RiskFactor[] {
    const risks: RiskFactor[] = [];

    if (result.status === 'fail' || result.score < 0.7) {
      risks.push({
        id: `government_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category: 'government',
        severity: result.score < 0.4 ? 'critical' : result.score < 0.7 ? 'high' : 'medium',
        confidence: result.confidence,
        description: 'Government designation or registry issues detected',
        evidence: result.results.map(r => r.description || 'Government verification result'),
        impact: 'Property may have government restrictions or designation conflicts',
        likelihood: 1 - result.score,
        mitigation: [
          'Contact relevant government authorities',
          'Obtain official designation certificates',
          'Verify zoning and land use restrictions'
        ],
        sourceLayer: result.layerType,
        weight: 0
      });
    }

    return risks;
  }

  /**
   * Extract legal-related risk factors
   */
  private extractLegalRisks(result: VerificationResult): RiskFactor[] {
    const risks: RiskFactor[] = [];

    if (result.status === 'fail' || result.score < 0.6) {
      risks.push({
        id: `legal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category: 'legal',
        severity: result.score < 0.3 ? 'critical' : result.score < 0.6 ? 'high' : 'medium',
        confidence: result.confidence,
        description: 'Legal issues or disputes identified',
        evidence: result.results.map(r => r.description || 'Legal verification result'),
        impact: 'Property may have legal encumbrances or ongoing disputes',
        likelihood: 1 - result.score,
        mitigation: [
          'Conduct comprehensive legal due diligence',
          'Engage qualified legal counsel',
          'Review court records and legal history'
        ],
        sourceLayer: result.layerType,
        weight: 0
      });
    }

    return risks;
  }

  /**
   * Extract physical verification risk factors
   */
  private extractPhysicalRisks(result: VerificationResult): RiskFactor[] {
    const risks: RiskFactor[] = [];

    if (result.status === 'fail' || result.score < 0.7) {
      risks.push({
        id: `physical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category: 'physical',
        severity: result.score < 0.4 ? 'high' : 'medium',
        confidence: result.confidence,
        description: 'Physical verification discrepancies detected',
        evidence: result.results.map(r => r.description || 'Physical verification result'),
        impact: 'Property boundaries or features may not match documentation',
        likelihood: 1 - result.score,
        mitigation: [
          'Conduct professional land survey',
          'Verify GPS coordinates and boundaries',
          'Compare with satellite imagery'
        ],
        sourceLayer: result.layerType,
        weight: 0
      });
    }

    return risks;
  }

  /**
   * Extract community intelligence risk factors
   */
  private extractCommunityRisks(result: VerificationResult): RiskFactor[] {
    const risks: RiskFactor[] = [];

    if (result.status === 'fail' || result.score < 0.6) {
      risks.push({
        id: `community_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category: 'community',
        severity: result.score < 0.3 ? 'high' : 'medium',
        confidence: result.confidence,
        description: 'Community concerns or negative feedback identified',
        evidence: result.results.map(r => r.description || 'Community feedback'),
        impact: 'Local community may have concerns about property ownership or use',
        likelihood: 1 - result.score,
        mitigation: [
          'Engage with local community leaders',
          'Conduct additional community interviews',
          'Address specific community concerns'
        ],
        sourceLayer: result.layerType,
        weight: 0
      });
    }

    return risks;
  }

  /**
   * Calculate weight for a risk factor based on category and severity
   */
  private calculateRiskFactorWeight(factor: RiskFactor): number {
    const categoryWeight = this.RISK_WEIGHTS[factor.category];
    const severityMultiplier = this.SEVERITY_MULTIPLIERS[factor.severity];
    return categoryWeight * severityMultiplier * factor.confidence;
  }

  /**
   * Calculate weighted risk score considering interactions
   */
  private calculateWeightedRiskScore(
    riskFactors: RiskFactor[], 
    riskInteractions: RiskInteraction[]
  ): { overallScore: number; confidence: number } {
    if (riskFactors.length === 0) {
      return { overallScore: 0, confidence: 1.0 };
    }

    // Calculate base score from individual risk factors
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let totalConfidence = 0;

    for (const factor of riskFactors) {
      const factorScore = factor.likelihood * this.SEVERITY_MULTIPLIERS[factor.severity];
      totalWeightedScore += factorScore * factor.weight;
      totalWeight += factor.weight;
      totalConfidence += factor.confidence;
    }

    let baseScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    let averageConfidence = totalConfidence / riskFactors.length;

    // Apply interaction adjustments
    for (const interaction of riskInteractions) {
      if (interaction.interactionType === 'amplifying') {
        baseScore *= (1 + interaction.combinedImpact * 0.2); // Max 20% increase
      } else if (interaction.interactionType === 'mitigating') {
        baseScore *= (1 - interaction.combinedImpact * 0.15); // Max 15% decrease
      }
      
      averageConfidence += interaction.confidenceAdjustment;
    }

    // Normalize scores
    const overallScore = Math.min(Math.max(baseScore, 0), 10); // 0-10 scale
    const confidence = Math.min(Math.max(averageConfidence, 0), 1); // 0-1 scale

    return { overallScore, confidence };
  }

  /**
   * Calculate combined impact of risk factors in an interaction
   */
  private calculateCombinedImpact(factors: RiskFactor[], multiplier: number): number {
    const averageLikelihood = factors.reduce((sum, f) => sum + f.likelihood, 0) / factors.length;
    const averageConfidence = factors.reduce((sum, f) => sum + f.confidence, 0) / factors.length;
    
    return averageLikelihood * averageConfidence * (multiplier - 1);
  }

  /**
   * Determine risk level based on overall score
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * Create recommendation for critical risk factors
   */
  private async createCriticalRiskRecommendation(factor: RiskFactor): Promise<Recommendation> {
    return {
      id: `critical_rec_${Date.now()}`,
      priority: 'high',
      category: 'risk_mitigation',
      title: `Urgent: Address Critical ${factor.category} Risk`,
      description: `Critical risk identified in ${factor.category}: ${factor.description}`,
      actionItems: [
        'Immediately halt any property transaction processes',
        'Engage qualified experts for detailed assessment',
        ...(factor.mitigation || [])
      ],
      estimatedCost: 50000, // KES
      estimatedTime: '1-2 weeks',
      riskReduction: 60
    };
  }

  /**
   * Create ownership-specific recommendations
   */
  private async createOwnershipRecommendation(factors: RiskFactor[]): Promise<Recommendation> {
    return {
      id: `ownership_rec_${Date.now()}`,
      priority: 'high',
      category: 'verification',
      title: 'Strengthen Ownership Verification',
      description: 'Multiple ownership-related risks require additional verification',
      actionItems: [
        'Obtain certified copies of all ownership documents',
        'Conduct comprehensive title search',
        'Verify ownership chain for past 20 years',
        'Cross-reference with multiple government databases'
      ],
      estimatedCost: 25000, // KES
      estimatedTime: '2-3 weeks',
      riskReduction: 40
    };
  }

  /**
   * Create legal-specific recommendations
   */
  private async createLegalRecommendation(factors: RiskFactor[]): Promise<Recommendation> {
    return {
      id: `legal_rec_${Date.now()}`,
      priority: 'high',
      category: 'legal',
      title: 'Legal Due Diligence Required',
      description: 'Legal risks identified requiring professional legal assessment',
      actionItems: [
        'Engage qualified property lawyer',
        'Conduct comprehensive legal due diligence',
        'Review all legal encumbrances and restrictions',
        'Obtain legal opinion on property status'
      ],
      estimatedCost: 75000, // KES
      estimatedTime: '3-4 weeks',
      riskReduction: 50
    };
  }

  /**
   * Create government-specific recommendations
   */
  private async createGovernmentRecommendation(factors: RiskFactor[]): Promise<Recommendation> {
    return {
      id: `government_rec_${Date.now()}`,
      priority: 'medium',
      category: 'verification',
      title: 'Government Verification Enhancement',
      description: 'Government designation issues require official clarification',
      actionItems: [
        'Contact relevant government departments',
        'Obtain official designation certificates',
        'Verify current zoning and land use status',
        'Check for any pending government actions'
      ],
      estimatedCost: 15000, // KES
      estimatedTime: '2-3 weeks',
      riskReduction: 30
    };
  }

  /**
   * Create interaction-based recommendations
   */
  private async createInteractionRecommendation(interactions: RiskInteraction[]): Promise<Recommendation> {
    return {
      id: `interaction_rec_${Date.now()}`,
      priority: 'high',
      category: 'expert_consultation',
      title: 'Comprehensive Risk Assessment Required',
      description: 'Multiple risk factors are interacting and compounding the overall risk',
      actionItems: [
        'Engage multidisciplinary expert team',
        'Conduct comprehensive risk assessment',
        'Develop integrated risk mitigation strategy',
        'Consider professional property risk insurance'
      ],
      estimatedCost: 100000, // KES
      estimatedTime: '4-6 weeks',
      riskReduction: 70
    };
  }

  /**
   * Save risk assessment to database
   * Requirement 7.6: Store risk assessments for historical tracking
   */
  async saveRiskAssessment(sessionId: number, riskProfile: RiskProfile): Promise<void> {
    try {
      // Save risk factors to database
      for (const factor of riskProfile.riskFactors) {
        await db.insert(riskFactors).values({
          sessionId,
          category: factor.category,
          severity: factor.severity,
          confidence: factor.confidence,
          description: factor.description,
          evidence: factor.evidence,
          impact: factor.impact,
          likelihood: factor.likelihood,
          mitigation: factor.mitigation || [],
          sourceLayer: factor.sourceLayer,
          weight: factor.weight,
          isActive: true
        });
      }

      // Update session with overall risk assessment
      await db.update(landVerificationSessions)
        .set({
          riskLevel: riskProfile.riskLevel,
          overallRiskScore: riskProfile.overallRiskScore,
          riskConfidence: riskProfile.confidence,
          updatedAt: new Date()
        })
        .where(eq(landVerificationSessions.id, sessionId));

      logger.info('Risk assessment saved to database', {
        sessionId,
        riskLevel: riskProfile.riskLevel,
        factorCount: riskProfile.riskFactors.length
      });

    } catch (error) {
      logger.error('Failed to save risk assessment', { error: error.message, sessionId });
      throw new Error(`Failed to save risk assessment: ${error.message}`);
    }
  }

  /**
   * Get historical risk assessments for a property
   */
  async getHistoricalRiskAssessments(propertyId: string): Promise<RiskProfile[]> {
    try {
      const sessions = await db.select()
        .from(landVerificationSessions)
        .where(eq(landVerificationSessions.propertyId, propertyId))
        .orderBy(desc(landVerificationSessions.createdAt));

      const riskProfiles: RiskProfile[] = [];

      for (const session of sessions) {
        if (session.riskLevel && session.overallRiskScore !== null) {
          const sessionRiskFactors = await db.select()
            .from(riskFactors)
            .where(and(
              eq(riskFactors.sessionId, session.id),
              eq(riskFactors.isActive, true)
            ));

          riskProfiles.push({
            overallRiskScore: session.overallRiskScore,
            riskLevel: session.riskLevel as 'low' | 'medium' | 'high' | 'critical',
            confidence: session.riskConfidence || 0,
            riskFactors: sessionRiskFactors.map(rf => ({
              id: rf.id.toString(),
              category: rf.category as any,
              severity: rf.severity as any,
              confidence: rf.confidence,
              description: rf.description,
              evidence: rf.evidence,
              impact: rf.impact,
              likelihood: rf.likelihood,
              mitigation: rf.mitigation,
              sourceLayer: rf.sourceLayer,
              weight: rf.weight
            })),
            riskInteractions: [], // Would need separate table for full implementation
            recommendations: [], // Would need separate table for full implementation
            assessmentDate: session.createdAt,
            validUntil: new Date(session.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
          });
        }
      }

      return riskProfiles;
    } catch (error) {
      logger.error('Failed to get historical risk assessments', { error: error.message, propertyId });
      throw new Error(`Failed to get historical risk assessments: ${error.message}`);
    }
  }
}