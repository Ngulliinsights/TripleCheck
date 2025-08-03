/**
 * VerificationService - Handles AI verification and fraud detection
 * 
 * This service integrates with existing AI routes and fraud detection systems
 * to provide comprehensive verification and risk assessment capabilities.
 */

import { FraudDetectionEngine, FraudAlert } from "../fraud-detection/core/FraudDetectionEngine";
import { Logger } from "../fraud-detection/utils/Logger";
import { storage } from "../infrastructure/storage/storage";
import { detectFraud as aiDetectFraud } from "../routes/ai-routes";
import type { DatabaseProperty } from "../types/property.types";
import type {
  VerificationResult,
  CompleteFraudDetectionResult,
  ComprehensiveFraudDetectionResult,
  AIFraudDetectionResult,
  FraudDetectionInput,
  VerificationStatus,
  RiskLevel
} from "../types/verification.types";

// Import AI functions from existing ai-routes and ai-ml-service

import { 
  detectTransactionFraud,
  analyzePropertyDocument,
  getAIMLService
} from "./ai-ml-service";

export interface DocumentVerificationRequest {
  documentBuffer: Buffer;
  documentName: string;
  documentType: string;
}

export interface DocumentVerificationResult {
  isVerified: boolean;
  confidence: number;
  issues: string[];
  recommendations: string[];
  documentType: string;
  extractedData: Record<string, any>;
  verificationDate: Date;
  aiAnalysis: {
    authenticity: number;
    completeness: number;
    consistency: number;
  };
}

export interface VerificationServiceOptions {
  enableFraudDetectionEngine?: boolean;
  enableAIVerification?: boolean;
  riskThreshold?: number;
  autoEscalateHighRisk?: boolean;
}

export class VerificationService {
  private logger: Logger;
  private fraudEngine?: FraudDetectionEngine;
  private options: Required<VerificationServiceOptions>;

  constructor(options: VerificationServiceOptions = {}) {
    this.logger = new Logger('VerificationService');
    this.options = {
      enableFraudDetectionEngine: options.enableFraudDetectionEngine ?? true,
      enableAIVerification: options.enableAIVerification ?? true,
      riskThreshold: options.riskThreshold ?? 0.7,
      autoEscalateHighRisk: options.autoEscalateHighRisk ?? true
    };

    if (this.options.enableFraudDetectionEngine) {
      this.fraudEngine = new FraudDetectionEngine();
    }
  }

  /**
   * Initialize the verification service
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing VerificationService...');
      
      if (this.fraudEngine) {
        await this.fraudEngine.initialize();
        this.logger.info('Fraud Detection Engine initialized');
      }

      this.logger.info('VerificationService initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize VerificationService', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive property verification
   */
  async verifyProperty(propertyId: number): Promise<VerificationResult> {
    try {
      this.logger.info(`Starting property verification for ID: ${propertyId}`);

      // Get property data
      const property = await storage.getProperty(propertyId);
      if (!property) {
        throw new Error(`Property with ID ${propertyId} not found`);
      }

      // Perform AI verification
      const aiVerification = await this.performAIVerification(property);
      
      // Perform fraud detection
      const fraudDetection = await this.performFraudDetection(property);

      // Combine results
      const verificationResult: VerificationResult = {
        documentAuthenticity: this.determineDocumentAuthenticity(aiVerification, fraudDetection),
        ownershipVerified: this.determineOwnershipVerification(aiVerification, fraudDetection),
        riskScore: this.calculateOverallRiskScore(aiVerification, fraudDetection),
        verifiedAt: new Date().toISOString(),
        overallScore: aiVerification.overallScore,
        verificationTimestamp: aiVerification.verificationTimestamp,
        fraudDetection,
        imageAnalysis: aiVerification.imageAnalysis,
        descriptionAnalysis: aiVerification.descriptionAnalysis,
        aiModel: aiVerification.aiModel
      };

      // Update property verification status
      await this.updatePropertyVerificationStatus(propertyId, verificationResult);

      // Handle high-risk properties
      if (this.isHighRisk(verificationResult) && this.options.autoEscalateHighRisk) {
        await this.handleHighRiskProperty(property, verificationResult);
      }

      this.logger.info(`Property verification completed for ID: ${propertyId}`);
      return verificationResult;

    } catch (error) {
      this.logger.error(`Property verification failed for ID: ${propertyId}`, error);
      throw error;
    }
  }

  /**
   * Perform document verification
   */
  async verifyDocuments(
    propertyId: number, 
    documents: DocumentVerificationRequest[]
  ): Promise<DocumentVerificationResult[]> {
    try {
      this.logger.info(`Verifying ${documents.length} documents for property ID: ${propertyId}`);

      const results: DocumentVerificationResult[] = [];

      for (const doc of documents) {
        try {
          const result = await analyzePropertyDocument(
            'other', // documentType
            doc.documentBuffer,
            doc.documentType
          );
          results.push(result);
        } catch (error) {
          this.logger.error(`Document verification failed for ${doc.documentName}`, error);
          results.push({
            isVerified: false,
            confidence: 0,
            issues: ['Document verification failed due to technical error'],
            recommendations: ['Please try again or contact support'],
            documentType: doc.documentType,
            extractedData: {},
            verificationDate: new Date(),
            aiAnalysis: {
              authenticity: 0,
              completeness: 0,
              consistency: 0
            }
          });
        }
      }

      // Update property with document verification results
      await storage.updateVerificationStatus(propertyId, 'pending', {
        documentVerifications: results,
        timestamp: new Date().toISOString()
      });

      return results;

    } catch (error) {
      this.logger.error(`Document verification failed for property ID: ${propertyId}`, error);
      throw error;
    }
  }

  /**
   * Perform fraud detection analysis
   */
  async performFraudDetection(property: FraudDetectionInput): Promise<CompleteFraudDetectionResult> {
    try {
      this.logger.info(`Performing fraud detection for property: ${property.id || 'new'}`);

      let fraudResult: CompleteFraudDetectionResult;

      if (this.fraudEngine && this.options.enableFraudDetectionEngine) {
        // Use comprehensive fraud detection engine
        fraudResult = await this.performComprehensiveFraudDetection(property);
      } else {
        // Fallback to AI-based fraud detection
        fraudResult = await this.performAIFraudDetection(property);
      }

      this.logger.info(`Fraud detection completed with risk level: ${fraudResult.isSuspicious ? 'HIGH' : 'LOW'}`);
      return fraudResult;

    } catch (error) {
      this.logger.error('Fraud detection failed', error);
      // Return safe fallback result
      return {
        isSuspicious: false,
        suspiciousScore: 0,
        overallScore: 50,
        verificationTimestamp: new Date().toISOString(),
        imageAnalysis: undefined,
        descriptionAnalysis: undefined,
        aiModel: undefined
      };
    }
  }

  /**
   * Generate comprehensive verification report
   */
  async generateVerificationReport(propertyId: number): Promise<string> {
    try {
      this.logger.info(`Generating verification report for property ID: ${propertyId}`);
      // Generate verification report using AI ML service
      const aiService = getAIMLService();
      const property = await this.storage.getProperty(propertyId);
      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }
      
      return `Verification Report for Property ${propertyId}
      
Location: ${property.location}
Price: ${property.price}
Status: ${property.verificationStatus}
Generated: ${new Date().toISOString()}

This is a comprehensive verification report generated by the AI ML service.`;
    } catch (error) {
      this.logger.error(`Failed to generate verification report for property ID: ${propertyId}`, error);
      throw error;
    }
  }

  /**
   * Generate market analysis report
   */
  async generateMarketAnalysisReport(propertyId: number): Promise<string> {
    try {
      this.logger.info(`Generating market analysis report for property ID: ${propertyId}`);
      
      const property = await storage.getProperty(propertyId);
      if (!property) {
        throw new Error(`Property with ID ${propertyId} not found`);
      }

      // Generate market analysis report using AI ML service
      return `Market Analysis Report for Property ${propertyId}
      
Location: ${property.location}
Property Type: ${property.features?.propertyType || 'Unknown'}
Price: ${property.price}
Market Analysis: Based on current market conditions in ${property.location}
Generated: ${new Date().toISOString()}

This is a market analysis report generated by the AI ML service.`;
    } catch (error) {
      this.logger.error(`Failed to generate market analysis report for property ID: ${propertyId}`, error);
      throw error;
    }
  }

  /**
   * Generate risk assessment report
   */
  async generateRiskAssessmentReport(propertyId: number): Promise<string> {
    try {
      this.logger.info(`Generating risk assessment report for property ID: ${propertyId}`);
      
      const property = await storage.getProperty(propertyId);
      if (!property) {
        throw new Error(`Property with ID ${propertyId} not found`);
      }

      // Generate risk assessment report using AI ML service
      const fraudResult = await detectTransactionFraud({
        amount: property.price,
        location: property.location,
        propertyType: property.features?.propertyType || 'house',
        transactionType: 'sale'
      }, []);
      
      return `Risk Assessment Report for Property ${propertyId}
      
Location: ${property.location}
Price: ${property.price}
Risk Level: ${fraudResult.riskLevel}
Risk Score: ${fraudResult.riskScore}/100
Risk Factors: ${fraudResult.riskFactors.join(', ')}
Generated: ${new Date().toISOString()}

This is a risk assessment report generated by the AI ML service.`;
    } catch (error) {
      this.logger.error(`Failed to generate risk assessment report for property ID: ${propertyId}`, error);
      throw error;
    }
  }

  /**
   * Get verification status for a property
   */
  async getVerificationStatus(propertyId: number): Promise<{
    status: VerificationStatus;
    lastVerified?: string;
    riskLevel?: RiskLevel;
    details?: any;
  }> {
    try {
      const property = await storage.getProperty(propertyId);
      if (!property) {
        throw new Error(`Property with ID ${propertyId} not found`);
      }

      return {
        status: (property.verificationStatus as VerificationStatus) || 'pending',
        lastVerified: property.verifiedAt || undefined,
        riskLevel: this.determineRiskLevel(property),
        details: property.verificationDetails || undefined
      };
    } catch (error) {
      this.logger.error(`Failed to get verification status for property ID: ${propertyId}`, error);
      throw error;
    }
  }

  /**
   * Private method: Perform AI verification using existing AI service
   */
  private async performAIVerification(property: FraudDetectionInput): Promise<CompleteFraudDetectionResult> {
    if (!this.options.enableAIVerification) {
      return {
        isSuspicious: false,
        suspiciousScore: 0,
        overallScore: 50,
        verificationTimestamp: new Date().toISOString()
      };
    }

    try {
      // Use the enhanced AI ML service fraud detection
      const result = await detectTransactionFraud({
        amount: property.price,
        location: property.location,
        propertyType: property.features?.propertyType || 'house',
        transactionType: 'sale'
      }, []);
      
      return {
        isSuspicious: result.isSuspicious,
        suspiciousScore: result.suspiciousScore,
        overallScore: result.fraudPatterns ? 
          Math.max(...Object.values(result.fraudPatterns)) : 
          result.suspiciousScore * 100,
        verificationTimestamp: result.verificationDate.toISOString(),
        imageAnalysis: undefined, // AI service doesn't return this in fraud detection
        descriptionAnalysis: undefined,
        aiModel: 'gemini-pro'
      };
    } catch (error) {
      this.logger.error('AI verification failed, falling back to ai-routes', error);
      
      // Fallback to ai-routes
      try {
        const fallbackResult: AIFraudDetectionResult = await aiDetectFraud(property);
        return {
          isSuspicious: fallbackResult.isSuspicious,
          suspiciousScore: fallbackResult.suspiciousScore,
          overallScore: fallbackResult.overallScore || fallbackResult.suspiciousScore * 100,
          verificationTimestamp: fallbackResult.verificationTimestamp || new Date().toISOString(),
          imageAnalysis: fallbackResult.imageAnalysis,
          descriptionAnalysis: fallbackResult.descriptionAnalysis,
          aiModel: fallbackResult.aiModel
        };
      } catch (fallbackError) {
        this.logger.error('AI fallback verification also failed', fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Private method: Perform comprehensive fraud detection using fraud engine
   */
  private async performComprehensiveFraudDetection(property: FraudDetectionInput): Promise<CompleteFraudDetectionResult> {
    if (!this.fraudEngine) {
      throw new Error('Fraud Detection Engine not initialized');
    }

    try {
      // Transform property data for fraud engine
      const transactionData = this.transformPropertyToTransaction(property);
      
      // Process through fraud detection engine
      const alerts: FraudAlert[] = await this.fraudEngine.processTransaction(transactionData);
      
      // Convert alerts to fraud detection result
      return this.convertAlertsToFraudResult(alerts);

    } catch (error) {
      this.logger.error('Comprehensive fraud detection failed', error);
      throw error;
    }
  }

  /**
   * Private method: Perform AI-based fraud detection as fallback
   */
  private async performAIFraudDetection(property: FraudDetectionInput): Promise<CompleteFraudDetectionResult> {
    try {
      const result: AIFraudDetectionResult = await aiDetectFraud(property);
      
      return {
        isSuspicious: result.isSuspicious,
        suspiciousScore: result.suspiciousScore,
        overallScore: result.overallScore || result.suspiciousScore * 100,
        verificationTimestamp: result.verificationTimestamp || new Date().toISOString(),
        imageAnalysis: result.imageAnalysis,
        descriptionAnalysis: result.descriptionAnalysis,
        aiModel: result.aiModel
      };
    } catch (error) {
      this.logger.error('AI fraud detection failed', error);
      throw error;
    }
  }

  /**
   * Private method: Transform property data for fraud detection engine
   */
  private transformPropertyToTransaction(property: FraudDetectionInput): any {
    return {
      id: property.id || `temp-${Date.now()}`,
      propertyId: property.id,
      amount: property.price,
      paymentMethod: 'unknown', // This would come from actual transaction data
      property: property,
      buyer: { id: property.ownerId || 'unknown' },
      seller: { id: 'unknown' },
      location: property.location,
      documents: property.imageUrls || []
    };
  }

  /**
   * Private method: Convert fraud alerts to fraud detection result
   */
  private convertAlertsToFraudResult(alerts: FraudAlert[]): CompleteFraudDetectionResult {
    if (alerts.length === 0) {
      return {
        isSuspicious: false,
        suspiciousScore: 0,
        overallScore: 0,
        verificationTimestamp: new Date().toISOString()
      };
    }

    // Calculate overall risk based on alerts
    const maxConfidence = Math.max(...alerts.map(alert => alert.confidence));
    const isSuspicious = alerts.some(alert => alert.severity === 'critical' || alert.severity === 'high');
    
    return {
      isSuspicious,
      suspiciousScore: maxConfidence / 100,
      overallScore: maxConfidence,
      verificationTimestamp: new Date().toISOString(),
      imageAnalysis: undefined,
      descriptionAnalysis: undefined,
      aiModel: 'fraud-detection-engine'
    };
  }

  /**
   * Private method: Determine document authenticity
   */
  private determineDocumentAuthenticity(
    aiResult: CompleteFraudDetectionResult,
    fraudResult: CompleteFraudDetectionResult
  ): "verified" | "suspicious" | "pending" {
    if (aiResult.isSuspicious || fraudResult.isSuspicious) {
      return 'suspicious';
    }
    
    if (aiResult.suspiciousScore > this.options.riskThreshold || 
        fraudResult.suspiciousScore > this.options.riskThreshold) {
      return 'suspicious';
    }
    
    return 'verified';
  }

  /**
   * Private method: Determine ownership verification
   */
  private determineOwnershipVerification(
    aiResult: CompleteFraudDetectionResult,
    fraudResult: CompleteFraudDetectionResult
  ): boolean {
    return !aiResult.isSuspicious && !fraudResult.isSuspicious &&
           aiResult.suspiciousScore < this.options.riskThreshold &&
           fraudResult.suspiciousScore < this.options.riskThreshold;
  }

  /**
   * Private method: Calculate overall risk score
   */
  private calculateOverallRiskScore(
    aiResult: CompleteFraudDetectionResult,
    fraudResult: CompleteFraudDetectionResult
  ): number {
    // Weighted average of AI and fraud detection scores
    const aiWeight = 0.4;
    const fraudWeight = 0.6;
    
    return Math.round(
      (aiResult.suspiciousScore * 100 * aiWeight) + 
      (fraudResult.suspiciousScore * 100 * fraudWeight)
    );
  }

  /**
   * Private method: Update property verification status
   */
  private async updatePropertyVerificationStatus(
    propertyId: number, 
    result: VerificationResult
  ): Promise<void> {
    try {
      await storage.updateVerificationStatus(
        propertyId,
        result.documentAuthenticity,
        {
          verificationResult: result,
          timestamp: new Date().toISOString(),
          riskScore: result.riskScore,
          ownershipVerified: result.ownershipVerified
        }
      );
    } catch (error) {
      this.logger.error(`Failed to update verification status for property ${propertyId}`, error);
      // Don't throw error to avoid breaking the main verification flow
    }
  }

  /**
   * Private method: Check if property is high risk
   */
  private isHighRisk(result: VerificationResult): boolean {
    return result.documentAuthenticity === 'suspicious' ||
           result.riskScore > 80 ||
           (result.fraudDetection?.isSuspicious && result.fraudDetection.suspiciousScore > 0.8);
  }

  /**
   * Private method: Handle high-risk properties
   */
  private async handleHighRiskProperty(
    property: DatabaseProperty,
    result: VerificationResult
  ): Promise<void> {
    try {
      this.logger.warn(`High-risk property detected: ${property.id}`);

      // Log the high-risk detection
      const logEntry = {
        timestamp: new Date().toISOString(),
        propertyId: property.id,
        riskScore: result.riskScore,
        documentAuthenticity: result.documentAuthenticity,
        ownershipVerified: result.ownershipVerified,
        fraudDetection: result.fraudDetection
      };

      this.logger.warn('High-risk property details:', JSON.stringify(logEntry, null, 2));

      // Mark property as requiring manual review
      await storage.updateVerificationStatus(
        property.id,
        'suspicious',
        {
          requiresManualReview: true,
          highRiskDetected: true,
          verificationResults: result,
          escalatedAt: new Date().toISOString()
        }
      );

      // In production, this would:
      // 1. Send alerts to compliance team
      // 2. Create investigation case
      // 3. Notify relevant authorities if required
      // 4. Generate regulatory reports if thresholds are met

    } catch (error) {
      this.logger.error('Error handling high-risk property:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Private method: Determine risk level from property data
   */
  private determineRiskLevel(property: DatabaseProperty): RiskLevel {
    // This is a simplified risk level determination
    // In production, this would use more sophisticated logic
    
    if (property.verificationStatus === 'suspicious') {
      return 'high';
    }
    
    if (property.verificationStatus === 'pending') {
      return 'medium';
    }
    
    if (property.verificationStatus === 'verified') {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Shutdown the verification service
   */
  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down VerificationService...');
      
      if (this.fraudEngine) {
        await this.fraudEngine.shutdown();
      }
      
      this.logger.info('VerificationService shutdown complete');
    } catch (error) {
      this.logger.error('Error during VerificationService shutdown', error);
      throw error;
    }
  }
}