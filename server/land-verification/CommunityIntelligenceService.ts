import { EventEmitter } from 'events';

import { eq, and, desc } from 'drizzle-orm';

import { 
  communityFeedback, 
  landVerificationSessions,
  properties,
  verificationLayers
} from '../../src/shared/schema';
import { db } from '../infrastructure/database/connection';
import { logger } from '../infrastructure/monitoring/logger';


export interface InterviewTemplate {
  id: string;
  propertyType: string;
  location: string;
  sections: InterviewSection[];
  estimatedDuration: number; // in minutes
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
}

export interface InterviewSection {
  id: string;
  title: string;
  description: string;
  questions: InterviewQuestion[];
  isRequired: boolean;
  order: number;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'yes_no' | 'rating' | 'date';
  options?: string[];
  isRequired: boolean;
  followUpQuestions?: InterviewQuestion[];
  riskIndicators?: string[];
}

export interface CommunityFeedback {
  id: string;
  sessionId: string;
  source: 'local_admin' | 'neighbor' | 'community_leader' | 'resident';
  sourceDetails: {
    name?: string;
    position?: string;
    contactInfo?: string;
    yearsInArea: number;
  };
  feedback: {
    ownershipHistory: string;
    knownDisputes: string[];
    landUsePatterns: string[];
    recentChanges: string[];
    concerns: string[];
  };
  reliability: number; // 0-1
  recordedAt: Date;
  verifiedBy?: string;
  isConfidential: boolean;
}

export interface CommunityAnalysis {
  sessionId: string;
  totalFeedbackCount: number;
  sourceDistribution: Record<string, number>;
  reliabilityScore: number; // 0-1
  consensusLevel: number; // 0-1
  keyFindings: KeyFinding[];
  riskIndicators: RiskIndicator[];
  recommendations: string[];
  confidenceLevel: number; // 0-1
  analysisDate: Date;
}

export interface KeyFinding {
  id: string;
  category: 'ownership' | 'disputes' | 'land_use' | 'changes' | 'concerns';
  finding: string;
  supportingEvidence: string[];
  confidence: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskIndicator {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: number; // How many sources mentioned this
  reliability: number; // Average reliability of sources mentioning this
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-1
  discrepancies: Discrepancy[];
  corroborations: Corroboration[];
  recommendations: string[];
}

export interface Discrepancy {
  id: string;
  type: 'ownership_conflict' | 'timeline_mismatch' | 'boundary_dispute' | 'legal_inconsistency';
  description: string;
  communitySource: string;
  officialSource: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresInvestigation: boolean;
}

export interface Corroboration {
  id: string;
  type: 'ownership_confirmation' | 'timeline_match' | 'boundary_agreement' | 'legal_consistency';
  description: string;
  sources: string[];
  confidence: number; // 0-1
}

export class CommunityIntelligenceService extends EventEmitter {
  private templateCache: Map<string, InterviewTemplate[]> = new Map();
  private analysisCache: Map<string, CommunityAnalysis> = new Map();

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Community Intelligence Service...', 'CommunityIntelligenceService');
    
    // Pre-load common templates
    await this.loadCommonTemplates();
    
    logger.info('Community Intelligence Service initialized', 'CommunityIntelligenceService');
  }

  /**
   * Generate interview templates based on property characteristics
   * Requirements: 3.1, 3.2
   */
  async generateInterviewTemplates(propertyType: string, location: string): Promise<InterviewTemplate[]> {
    const startTime = Date.now();
    logger.info(`Generating interview templates for property type: ${propertyType}, location: ${location}`, 'CommunityIntelligenceService');

    try {
      // Check cache first
      const cacheKey = `${propertyType}_${location}`;
      if (this.templateCache.has(cacheKey)) {
        logger.info(`Retrieved interview templates from cache for ${cacheKey}`, 'CommunityIntelligenceService');
        return this.templateCache.get(cacheKey)!;
      }

      const templates: InterviewTemplate[] = [];

      // Generate base template for all property types
      const baseTemplate = this.generateBaseTemplate(propertyType, location);
      templates.push(baseTemplate);

      // Generate property-type specific templates
      if (propertyType === 'land' || propertyType === 'commercial') {
        const landSpecificTemplate = this.generateLandSpecificTemplate(propertyType, location);
        templates.push(landSpecificTemplate);
      }

      // Generate location-specific templates
      const locationTemplate = this.generateLocationSpecificTemplate(propertyType, location);
      templates.push(locationTemplate);

      // Cache the templates
      this.templateCache.set(cacheKey, templates);

      // Emit event
      this.emit('templates_generated', { propertyType, location, templateCount: templates.length });

      const processingTime = Date.now() - startTime;
      logger.info(`Generated ${templates.length} interview templates in ${processingTime}ms`, 'CommunityIntelligenceService');

      return templates;

    } catch (error) {
      logger.error(`Failed to generate interview templates for ${propertyType} in ${location}`, 'CommunityIntelligenceService', undefined, error as Error);
      throw error;
    }
  }

  /**
   * Record community feedback with privacy protection
   * Requirements: 3.3, 3.6
   */
  async recordCommunityFeedback(sessionId: string, feedback: CommunityFeedback): Promise<void> {
    logger.info(`Recording community feedback for session ${sessionId}`, 'CommunityIntelligenceService');

    try {
      // Validate session exists
      const [session] = await db.select()
        .from(landVerificationSessions)
        .where(eq(landVerificationSessions.id, parseInt(sessionId)))
        .limit(1);

      if (!session) {
        throw new Error(`Verification session ${sessionId} not found`);
      }

      // Apply privacy protection
      const protectedFeedback = await this.applyPrivacyProtection(feedback);

      // Calculate reliability score
      const reliabilityScore = this.calculateReliabilityScore(feedback);

      // Insert feedback into database
      await db.insert(communityFeedback).values({
        sessionId: parseInt(sessionId),
        source: feedback.source,
        sourceName: protectedFeedback.sourceDetails.name,
        sourcePosition: protectedFeedback.sourceDetails.position,
        contactInfo: protectedFeedback.sourceDetails.contactInfo, // This will be encrypted
        yearsInArea: feedback.sourceDetails.yearsInArea,
        ownershipHistory: feedback.feedback.ownershipHistory,
        knownDisputes: feedback.feedback.knownDisputes,
        landUsePatterns: feedback.feedback.landUsePatterns,
        recentChanges: feedback.feedback.recentChanges,
        concerns: feedback.feedback.concerns,
        reliability: reliabilityScore.toString(),
        verifiedBy: feedback.verifiedBy,
        isConfidential: feedback.isConfidential,
        recordedAt: feedback.recordedAt
      });

      // Update verification layer progress
      await this.updateCommunityLayerProgress(sessionId);

      // Emit event
      this.emit('feedback_recorded', { sessionId, source: feedback.source, reliability: reliabilityScore });

      logger.info(`Community feedback recorded for session ${sessionId} from ${feedback.source}`, 'CommunityIntelligenceService');

    } catch (error) {
      logger.error(`Failed to record community feedback for session ${sessionId}`, 'CommunityIntelligenceService', undefined, error as Error);
      throw error;
    }
  }

  /**
   * Analyze community intelligence and generate insights
   * Requirements: 3.4, 3.5
   */
  async analyzeCommunityIntelligence(sessionId: string): Promise<CommunityAnalysis> {
    logger.info(`Analyzing community intelligence for session ${sessionId}`, 'CommunityIntelligenceService');

    try {
      // Check cache first
      if (this.analysisCache.has(sessionId)) {
        logger.info(`Retrieved community analysis from cache for session ${sessionId}`, 'CommunityIntelligenceService');
        return this.analysisCache.get(sessionId)!;
      }

      // Get all feedback for the session
      const feedbackData = await db.select()
        .from(communityFeedback)
        .where(eq(communityFeedback.sessionId, parseInt(sessionId)))
        .orderBy(desc(communityFeedback.recordedAt));

      if (feedbackData.length === 0) {
        throw new Error(`No community feedback found for session ${sessionId}`);
      }

      // Calculate source distribution
      const sourceDistribution = this.calculateSourceDistribution(feedbackData);

      // Calculate overall reliability score
      const reliabilityScore = this.calculateOverallReliability(feedbackData);

      // Calculate consensus level
      const consensusLevel = this.calculateConsensusLevel(feedbackData);

      // Extract key findings
      const keyFindings = this.extractKeyFindings(feedbackData);

      // Identify risk indicators
      const riskIndicators = this.identifyRiskIndicators(feedbackData);

      // Generate recommendations
      const recommendations = this.generateRecommendations(keyFindings, riskIndicators);

      // Calculate confidence level
      const confidenceLevel = this.calculateConfidenceLevel(feedbackData, consensusLevel, reliabilityScore);

      const analysis: CommunityAnalysis = {
        sessionId,
        totalFeedbackCount: feedbackData.length,
        sourceDistribution,
        reliabilityScore,
        consensusLevel,
        keyFindings,
        riskIndicators,
        recommendations,
        confidenceLevel,
        analysisDate: new Date()
      };

      // Cache the analysis
      this.analysisCache.set(sessionId, analysis);

      // Emit event
      this.emit('analysis_completed', { sessionId, analysis });

      logger.info(`Community intelligence analysis completed for session ${sessionId} - Confidence: ${confidenceLevel}`, 'CommunityIntelligenceService');

      return analysis;

    } catch (error) {
      logger.error(`Failed to analyze community intelligence for session ${sessionId}`, 'CommunityIntelligenceService', undefined, error as Error);
      throw error;
    }
  }

  /**
   * Validate community information against official records
   * Requirements: 3.4, 3.5
   */
  async validateCommunityInformation(feedback: CommunityFeedback, officialRecords: any[]): Promise<ValidationResult> {
    logger.info(`Validating community information against official records`, 'CommunityIntelligenceService');

    try {
      const discrepancies: Discrepancy[] = [];
      const corroborations: Corroboration[] = [];

      // Validate ownership history
      const ownershipValidation = this.validateOwnershipHistory(feedback.feedback.ownershipHistory, officialRecords);
      discrepancies.push(...ownershipValidation.discrepancies);
      corroborations.push(...ownershipValidation.corroborations);

      // Validate known disputes
      const disputeValidation = this.validateKnownDisputes(feedback.feedback.knownDisputes, officialRecords);
      discrepancies.push(...disputeValidation.discrepancies);
      corroborations.push(...disputeValidation.corroborations);

      // Validate land use patterns
      const landUseValidation = this.validateLandUsePatterns(feedback.feedback.landUsePatterns, officialRecords);
      discrepancies.push(...landUseValidation.discrepancies);
      corroborations.push(...landUseValidation.corroborations);

      // Calculate overall validation confidence
      const confidence = this.calculateValidationConfidence(discrepancies, corroborations, feedback.reliability);

      // Generate validation recommendations
      const recommendations = this.generateValidationRecommendations(discrepancies, corroborations);

      const validationResult: ValidationResult = {
        isValid: discrepancies.filter(d => d.severity === 'high' || d.severity === 'critical').length === 0,
        confidence,
        discrepancies,
        corroborations,
        recommendations
      };

      logger.info(`Community information validation completed - Valid: ${validationResult.isValid}, Confidence: ${confidence}`, 'CommunityIntelligenceService');

      return validationResult;

    } catch (error) {
      logger.error('Failed to validate community information', 'CommunityIntelligenceService', undefined, error as Error);
      throw error;
    }
  }

  // Private helper methods

  private async loadCommonTemplates(): Promise<void> {
    // Pre-load commonly used templates to improve performance
    const commonPropertyTypes = ['land', 'house', 'apartment', 'commercial'];
    const commonLocations = ['nairobi', 'mombasa', 'kisumu', 'nakuru'];

    for (const propertyType of commonPropertyTypes) {
      for (const location of commonLocations) {
        try {
          await this.generateInterviewTemplates(propertyType, location);
        } catch (error) {
          logger.warn(`Failed to pre-load template for ${propertyType} in ${location}`, 'CommunityIntelligenceService');
        }
      }
    }
  }

  private generateBaseTemplate(propertyType: string, location: string): InterviewTemplate {
    return {
      id: `base_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      propertyType,
      location,
      estimatedDuration: 30,
      priority: 'high',
      createdAt: new Date(),
      sections: [
        {
          id: 'basic_info',
          title: 'Basic Information',
          description: 'General information about the community member and their knowledge of the area',
          isRequired: true,
          order: 1,
          questions: [
            {
              id: 'years_in_area',
              question: 'How long have you lived or worked in this area?',
              type: 'text',
              isRequired: true,
              riskIndicators: ['short_tenure']
            },
            {
              id: 'role_in_community',
              question: 'What is your role or position in the community?',
              type: 'multiple_choice',
              options: ['Resident', 'Local Administrator', 'Business Owner', 'Community Leader', 'Other'],
              isRequired: true
            }
          ]
        },
        {
          id: 'property_knowledge',
          title: 'Property Knowledge',
          description: 'Information about the specific property in question',
          isRequired: true,
          order: 2,
          questions: [
            {
              id: 'property_familiarity',
              question: 'How familiar are you with this specific property?',
              type: 'rating',
              isRequired: true,
              riskIndicators: ['low_familiarity']
            },
            {
              id: 'current_owner_knowledge',
              question: 'Do you know who currently owns this property?',
              type: 'yes_no',
              isRequired: true,
              followUpQuestions: [
                {
                  id: 'owner_details',
                  question: 'Can you provide details about the current owner?',
                  type: 'text',
                  isRequired: false
                }
              ]
            }
          ]
        }
      ]
    };
  }

  private generateLandSpecificTemplate(propertyType: string, location: string): InterviewTemplate {
    return {
      id: `land_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      propertyType,
      location,
      estimatedDuration: 45,
      priority: 'high',
      createdAt: new Date(),
      sections: [
        {
          id: 'land_use_history',
          title: 'Land Use History',
          description: 'Historical and current use of the land',
          isRequired: true,
          order: 1,
          questions: [
            {
              id: 'historical_use',
              question: 'What has this land been used for historically?',
              type: 'multiple_choice',
              options: ['Agriculture', 'Residential', 'Commercial', 'Grazing', 'Forest', 'Unused', 'Other'],
              isRequired: true
            },
            {
              id: 'customary_rights',
              question: 'Are there any customary land rights or traditional uses associated with this land?',
              type: 'yes_no',
              isRequired: true,
              riskIndicators: ['customary_conflicts']
            }
          ]
        }
      ]
    };
  }

  private generateLocationSpecificTemplate(propertyType: string, location: string): InterviewTemplate {
    return {
      id: `location_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      propertyType,
      location,
      estimatedDuration: 20,
      priority: 'medium',
      createdAt: new Date(),
      sections: [
        {
          id: 'local_developments',
          title: 'Local Developments',
          description: 'Information about local developments and changes',
          isRequired: false,
          order: 1,
          questions: [
            {
              id: 'recent_developments',
              question: 'Have there been any recent developments or changes in this area?',
              type: 'text',
              isRequired: false,
              riskIndicators: ['rapid_development']
            }
          ]
        }
      ]
    };
  }

  private async applyPrivacyProtection(feedback: CommunityFeedback): Promise<CommunityFeedback> {
    const protectedFeedback = { ...feedback };

    if (feedback.isConfidential) {
      protectedFeedback.sourceDetails = {
        ...feedback.sourceDetails,
        name: feedback.sourceDetails.name ? this.anonymizeName(feedback.sourceDetails.name) : undefined,
        contactInfo: undefined
      };
    }

    if (protectedFeedback.sourceDetails.contactInfo) {
      protectedFeedback.sourceDetails.contactInfo = await this.encryptContactInfo(protectedFeedback.sourceDetails.contactInfo);
    }

    return protectedFeedback;
  }

  private anonymizeName(name: string): string {
    const parts = name.split(' ');
    return parts.map(part => `${part.charAt(0).toUpperCase()  }.`).join(' ');
  }

  private async encryptContactInfo(contactInfo: string): Promise<string> {
    return Buffer.from(contactInfo).toString('base64');
  }

  private calculateReliabilityScore(feedback: CommunityFeedback): number {
    let score = 0.5;

    const sourceReliability = {
      'local_admin': 0.9,
      'community_leader': 0.8,
      'neighbor': 0.6,
      'resident': 0.7
    };
    score = sourceReliability[feedback.source] || 0.5;

    if (feedback.sourceDetails.yearsInArea > 10) {
      score += 0.1;
    } else if (feedback.sourceDetails.yearsInArea < 2) {
      score -= 0.1;
    }

    const completenessScore = this.calculateCompletenessScore(feedback);
    score += (completenessScore - 0.5) * 0.2;

    return Math.max(0, Math.min(1, score));
  }

  private calculateCompletenessScore(feedback: CommunityFeedback): number {
    const totalFields = 9;
    let completedFields = 0;

    if (feedback.sourceDetails.name) completedFields++;
    if (feedback.sourceDetails.position) completedFields++;
    if (feedback.sourceDetails.contactInfo) completedFields++;
    if (feedback.sourceDetails.yearsInArea > 0) completedFields++;
    if (feedback.feedback.ownershipHistory) completedFields++;
    if (feedback.feedback.knownDisputes.length > 0) completedFields++;
    if (feedback.feedback.landUsePatterns.length > 0) completedFields++;
    if (feedback.feedback.recentChanges.length > 0) completedFields++;
    if (feedback.feedback.concerns.length > 0) completedFields++;

    return completedFields / totalFields;
  }

  private async updateCommunityLayerProgress(sessionId: string): Promise<void> {
    try {
      const [layer] = await db.select()
        .from(verificationLayers)
        .where(
          and(
            eq(verificationLayers.sessionId, parseInt(sessionId)),
            eq(verificationLayers.layerType, 'community')
          )
        )
        .limit(1);

      if (layer && layer.status === 'not_started') {
        await db.update(verificationLayers)
          .set({
            status: 'in_progress',
            startedAt: new Date()
          })
          .where(eq(verificationLayers.id, layer.id));
      }
    } catch (error) {
      logger.warn(`Failed to update community layer progress for session ${sessionId}`, 'CommunityIntelligenceService');
    }
  }

  private calculateSourceDistribution(feedbackData: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const feedback of feedbackData) {
      const {source} = feedback;
      distribution[source] = (distribution[source] || 0) + 1;
    }

    return distribution;
  }

  private calculateOverallReliability(feedbackData: any[]): number {
    if (feedbackData.length === 0) return 0;

    const totalReliability = feedbackData.reduce((sum, feedback) => {
      return sum + parseFloat(feedback.reliability || '0.5');
    }, 0);

    return totalReliability / feedbackData.length;
  }

  private calculateConsensusLevel(feedbackData: any[]): number {
    if (feedbackData.length < 2) return 0.5;

    const ownershipConsensus = this.analyzeOwnershipConsensus(feedbackData);
    const disputeConsensus = this.analyzeDisputeConsensus(feedbackData);
    const landUseConsensus = this.analyzeLandUseConsensus(feedbackData);

    return (ownershipConsensus + disputeConsensus + landUseConsensus) / 3;
  }

  private analyzeOwnershipConsensus(feedbackData: any[]): number {
    const ownershipMentions = feedbackData
      .map(f => f.ownershipHistory)
      .filter(h => h && h.length > 0);

    if (ownershipMentions.length < 2) return 0.5;

    const commonKeywords = this.extractCommonKeywords(ownershipMentions);
    return Math.min(1, commonKeywords.length / 5);
  }

  private analyzeDisputeConsensus(feedbackData: any[]): number {
    const disputeMentions = feedbackData
      .flatMap(f => f.knownDisputes || [])
      .filter(d => d && d.length > 0);

    if (disputeMentions.length === 0) return 1;

    const commonDisputes = this.extractCommonKeywords(disputeMentions);
    return Math.max(0.3, 1 - (commonDisputes.length / 10));
  }

  private analyzeLandUseConsensus(feedbackData: any[]): number {
    const landUseMentions = feedbackData
      .flatMap(f => f.landUsePatterns || [])
      .filter(p => p && p.length > 0);

    if (landUseMentions.length < 2) return 0.5;

    const commonPatterns = this.extractCommonKeywords(landUseMentions);
    return Math.min(1, commonPatterns.length / 3);
  }

  private extractCommonKeywords(texts: string[]): string[] {
    const wordCounts: Record<string, number> = {};
    
    for (const text of texts) {
      const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      for (const word of words) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }

    return Object.entries(wordCounts)
      .filter(([_, count]) => count > 1)
      .map(([word, _]) => word);
  }

  private extractKeyFindings(feedbackData: any[]): KeyFinding[] {
    const findings: KeyFinding[] = [];

    const ownershipFindings = this.extractOwnershipFindings(feedbackData);
    findings.push(...ownershipFindings);

    const disputeFindings = this.extractDisputeFindings(feedbackData);
    findings.push(...disputeFindings);

    const landUseFindings = this.extractLandUseFindings(feedbackData);
    findings.push(...landUseFindings);

    return findings;
  }

  private extractOwnershipFindings(feedbackData: any[]): KeyFinding[] {
    const findings: KeyFinding[] = [];
    
    const ownershipHistories = feedbackData
      .map(f => f.ownershipHistory)
      .filter(h => h && h.length > 0);

    if (ownershipHistories.length > 0) {
      findings.push({
        id: `ownership_${Date.now()}`,
        category: 'ownership',
        finding: 'Community members provided ownership history information',
        supportingEvidence: ownershipHistories,
        confidence: this.calculateOverallReliability(feedbackData),
        riskLevel: this.assessOwnershipRisk(ownershipHistories)
      });
    }

    return findings;
  }

  private extractDisputeFindings(feedbackData: any[]): KeyFinding[] {
    const findings: KeyFinding[] = [];
    
    const allDisputes = feedbackData
      .flatMap(f => f.knownDisputes || [])
      .filter(d => d && d.length > 0);

    if (allDisputes.length > 0) {
      findings.push({
        id: `disputes_${Date.now()}`,
        category: 'disputes',
        finding: `${allDisputes.length} dispute(s) mentioned by community members`,
        supportingEvidence: allDisputes,
        confidence: this.calculateOverallReliability(feedbackData),
        riskLevel: allDisputes.length > 2 ? 'high' : allDisputes.length > 0 ? 'medium' : 'low'
      });
    }

    return findings;
  }

  private extractLandUseFindings(feedbackData: any[]): KeyFinding[] {
    const findings: KeyFinding[] = [];
    
    const allPatterns = feedbackData
      .flatMap(f => f.landUsePatterns || [])
      .filter(p => p && p.length > 0);

    if (allPatterns.length > 0) {
      findings.push({
        id: `land_use_${Date.now()}`,
        category: 'land_use',
        finding: 'Community provided land use pattern information',
        supportingEvidence: allPatterns,
        confidence: this.calculateOverallReliability(feedbackData),
        riskLevel: this.assessLandUseRisk(allPatterns)
      });
    }

    return findings;
  }

  private assessOwnershipRisk(histories: string[]): 'low' | 'medium' | 'high' | 'critical' {
    const riskKeywords = ['dispute', 'conflict', 'grabbing', 'illegal', 'forged', 'fake'];
    const riskMentions = histories.filter(h => 
      riskKeywords.some(keyword => h.toLowerCase().includes(keyword))
    );

    if (riskMentions.length > histories.length * 0.5) return 'high';
    if (riskMentions.length > 0) return 'medium';
    return 'low';
  }

  private assessLandUseRisk(patterns: string[]): 'low' | 'medium' | 'high' | 'critical' {
    const riskPatterns = ['encroachment', 'illegal', 'unauthorized', 'disputed'];
    const riskMentions = patterns.filter(p => 
      riskPatterns.some(pattern => p.toLowerCase().includes(pattern))
    );

    if (riskMentions.length > patterns.length * 0.3) return 'high';
    if (riskMentions.length > 0) return 'medium';
    return 'low';
  }

  private identifyRiskIndicators(feedbackData: any[]): RiskIndicator[] {
    const indicators: RiskIndicator[] = [];

    const disputeIndicator = this.analyzeDisputeRisk(feedbackData);
    if (disputeIndicator) indicators.push(disputeIndicator);

    const ownershipIndicator = this.analyzeOwnershipRisk(feedbackData);
    if (ownershipIndicator) indicators.push(ownershipIndicator);

    return indicators;
  }

  private analyzeDisputeRisk(feedbackData: any[]): RiskIndicator | null {
    const allDisputes = feedbackData.flatMap(f => f.knownDisputes || []);
    
    if (allDisputes.length === 0) return null;

    const frequency = allDisputes.length;
    const reliability = this.calculateOverallReliability(feedbackData);

    return {
      id: `dispute_risk_${Date.now()}`,
      type: 'ownership_disputes',
      description: `${frequency} dispute(s) mentioned by community members`,
      severity: frequency > 2 ? 'high' : frequency > 0 ? 'medium' : 'low',
      frequency,
      reliability
    };
  }

  private analyzeOwnershipRisk(feedbackData: any[]): RiskIndicator | null {
    const ownershipHistories = feedbackData
      .map(f => f.ownershipHistory)
      .filter(h => h && h.length > 0);

    if (ownershipHistories.length === 0) return null;

    const riskKeywords = ['frequent', 'rapid', 'suspicious', 'below market'];
    const riskMentions = ownershipHistories.filter(h => 
      riskKeywords.some(keyword => h.toLowerCase().includes(keyword))
    );

    if (riskMentions.length === 0) return null;

    return {
      id: `ownership_risk_${Date.now()}`,
      type: 'suspicious_ownership_patterns',
      description: 'Community members mentioned suspicious ownership patterns',
      severity: riskMentions.length > ownershipHistories.length * 0.5 ? 'high' : 'medium',
      frequency: riskMentions.length,
      reliability: this.calculateOverallReliability(feedbackData)
    };
  }

  private generateRecommendations(keyFindings: KeyFinding[], riskIndicators: RiskIndicator[]): string[] {
    const recommendations: string[] = [];

    const highRiskFindings = keyFindings.filter(f => f.riskLevel === 'high' || f.riskLevel === 'critical');
    if (highRiskFindings.length > 0) {
      recommendations.push('Immediate legal consultation recommended due to high-risk community findings');
      recommendations.push('Consider additional verification through official channels');
    }

    const disputeRisks = riskIndicators.filter(r => r.type.includes('dispute'));
    if (disputeRisks.length > 0) {
      recommendations.push('Conduct thorough court records search to verify dispute claims');
      recommendations.push('Engage local legal counsel familiar with the area');
    }

    if (keyFindings.some(f => f.confidence < 0.6)) {
      recommendations.push('Gather additional community feedback to improve confidence levels');
      recommendations.push('Cross-reference community information with official records');
    }

    return recommendations;
  }

  private calculateConfidenceLevel(feedbackData: any[], consensusLevel: number, reliabilityScore: number): number {
    const sampleSizeScore = Math.min(1, feedbackData.length / 5);
    const diversityScore = this.calculateSourceDiversity(feedbackData);
    
    return (consensusLevel * 0.3 + reliabilityScore * 0.3 + sampleSizeScore * 0.2 + diversityScore * 0.2);
  }

  private calculateSourceDiversity(feedbackData: any[]): number {
    const uniqueSources = new Set(feedbackData.map(f => f.source));
    return Math.min(1, uniqueSources.size / 4);
  }

  private validateOwnershipHistory(ownershipHistory: string, officialRecords: any[]): { discrepancies: Discrepancy[], corroborations: Corroboration[] } {
    const discrepancies: Discrepancy[] = [];
    const corroborations: Corroboration[] = [];

    const registryRecords = officialRecords.filter(r => r.type === 'registry');
    
    if (registryRecords.length > 0 && ownershipHistory) {
      if (ownershipHistory.toLowerCase().includes('recent') && registryRecords.some(r => r.lastTransfer && new Date(r.lastTransfer) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))) {
        discrepancies.push({
          id: `timeline_${Date.now()}`,
          type: 'timeline_mismatch',
          description: 'Community mentions recent ownership change but registry shows older transfer',
          communitySource: ownershipHistory,
          officialSource: 'Registry records',
          severity: 'medium',
          requiresInvestigation: true
        });
      } else {
        corroborations.push({
          id: `timeline_match_${Date.now()}`,
          type: 'timeline_match',
          description: 'Community timeline aligns with registry records',
          sources: ['Community feedback', 'Registry records'],
          confidence: 0.8
        });
      }
    }

    return { discrepancies, corroborations };
  }

  private validateKnownDisputes(knownDisputes: string[], officialRecords: any[]): { discrepancies: Discrepancy[], corroborations: Corroboration[] } {
    const discrepancies: Discrepancy[] = [];
    const corroborations: Corroboration[] = [];

    const courtRecords = officialRecords.filter(r => r.type === 'court');

    if (knownDisputes.length > 0 && courtRecords.length === 0) {
      discrepancies.push({
        id: `dispute_mismatch_${Date.now()}`,
        type: 'legal_inconsistency',
        description: 'Community mentions disputes but no court records found',
        communitySource: knownDisputes.join(', '),
        officialSource: 'Court records search',
        severity: 'medium',
        requiresInvestigation: true
      });
    } else if (knownDisputes.length > 0 && courtRecords.length > 0) {
      corroborations.push({
        id: `dispute_match_${Date.now()}`,
        type: 'legal_consistency',
        description: 'Community dispute mentions align with court records',
        sources: ['Community feedback', 'Court records'],
        confidence: 0.9
      });
    }

    return { discrepancies, corroborations };
  }

  private validateLandUsePatterns(landUsePatterns: string[], officialRecords: any[]): { discrepancies: Discrepancy[], corroborations: Corroboration[] } {
    const discrepancies: Discrepancy[] = [];
    const corroborations: Corroboration[] = [];

    if (landUsePatterns.length > 0) {
      corroborations.push({
        id: `land_use_info_${Date.now()}`,
        type: 'timeline_match',
        description: 'Community provided valuable land use pattern information',
        sources: ['Community feedback'],
        confidence: 0.7
      });
    }

    return { discrepancies, corroborations };
  }

  private calculateValidationConfidence(discrepancies: Discrepancy[], corroborations: Corroboration[], feedbackReliability: number): number {
    const highSeverityDiscrepancies = discrepancies.filter(d => d.severity === 'high' || d.severity === 'critical').length;
    const totalCorroborations = corroborations.length;
    
    let confidence = feedbackReliability;
    
    confidence -= (highSeverityDiscrepancies * 0.2);
    confidence -= (discrepancies.length * 0.1);
    confidence += (totalCorroborations * 0.1);
    
    return Math.max(0, Math.min(1, confidence));
  }

  private generateValidationRecommendations(discrepancies: Discrepancy[], corroborations: Corroboration[]): string[] {
    const recommendations: string[] = [];

    if (discrepancies.length > 0) {
      recommendations.push('Investigate discrepancies between community feedback and official records');
      
      const highSeverityDiscrepancies = discrepancies.filter(d => d.severity === 'high' || d.severity === 'critical');
      if (highSeverityDiscrepancies.length > 0) {
        recommendations.push('High-severity discrepancies require immediate professional investigation');
      }
    }

    if (corroborations.length > 0) {
      recommendations.push('Community feedback corroborates official records, increasing confidence');
    }

    if (discrepancies.length === 0 && corroborations.length > 0) {
      recommendations.push('Strong alignment between community and official information');
    }

    return recommendations;
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Community Intelligence Service...', 'CommunityIntelligenceService');
    
    this.templateCache.clear();
    this.analysisCache.clear();

    logger.info('Community Intelligence Service shutdown complete', 'CommunityIntelligenceService');
  }
}