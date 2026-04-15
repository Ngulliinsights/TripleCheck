import crypto from './SecurityIntegration';

import { logger } from '../../infrastructure/observability/telemetry';

import { encryptionService } from './EncryptionService';

export interface PrivacyConfig {
  enableDataMinimization: boolean;
  enableAnonymization: boolean;
  enablePseudonymization: boolean;
  dataRetentionDays: number;
  anonymizationThreshold: number;
}

export interface AnonymizationResult {
  anonymizedData: any;
  anonymizationMap: Map<string, string>;
  fieldsAnonymized: string[];
}

export interface PseudonymizationResult {
  pseudonymizedData: any;
  pseudonymMap: Map<string, string>;
  fieldsPseudonymized: string[];
}

export interface DataMinimizationResult {
  minimizedData: any;
  removedFields: string[];
  retainedFields: string[];
}

/**
 * Service for privacy protection of community intelligence sources
 * Implements data minimization, anonymization, and pseudonymization
 */
export class PrivacyProtectionService {
  private config: PrivacyConfig;
  private pseudonymCache: Map<string, string> = new Map();

  constructor(config?: Partial<PrivacyConfig>) {
    this.config = {
      enableDataMinimization: true,
      enableAnonymization: true,
      enablePseudonymization: true,
      dataRetentionDays: 365,
      anonymizationThreshold: 30, // days after which data is anonymized
      ...config
    };
  }

  /**
   * Protect community feedback data with comprehensive privacy measures
   */
  async protectCommunityFeedback(feedback: any, protectionLevel: 'minimal' | 'standard' | 'maximum' = 'standard'): Promise<any> {
    try {
      let protectedData = { ...feedback };

      // Apply data minimization
      if (this.config.enableDataMinimization) {
        const minimizationResult = this.minimizeCommunityData(protectedData, protectionLevel);
        protectedData = minimizationResult.minimizedData;
      }

      // Apply pseudonymization for identifiable information
      if (this.config.enablePseudonymization && protectionLevel !== 'minimal') {
        const pseudonymResult = this.pseudonymizeCommunityData(protectedData);
        protectedData = pseudonymResult.pseudonymizedData;
      }

      // Apply anonymization for old data
      if (this.config.enableAnonymization && feedback && this.shouldAnonymize(feedback.recordedAt)) {
        const anonymizationResult = this.anonymizeCommunityData(protectedData);
        protectedData = anonymizationResult.anonymizedData;
      }

      // Encrypt sensitive remaining data
      protectedData = encryptionService.encryptCommunityFeedback(protectedData);

      logger.info('Community feedback privacy protection applied', 'PrivacyProtectionService', {
        feedbackId: feedback.id,
        protectionLevel,
        hasSourceDetails: !!protectedData.sourceDetails
      });

      return protectedData;

    } catch (error) {
      logger.error({ error: (error as Error).message, stack: (error as Error).stack }, 'Failed to protect community feedback privacy');
      throw error;
    }
  }

  /**
   * Minimize community data by removing unnecessary fields
   */
  minimizeCommunityData(data: any, level: 'minimal' | 'standard' | 'maximum'): DataMinimizationResult {
    const minimizedData = { ...data };
    const removedFields: string[] = [];
    const retainedFields: string[] = [];

    // Define field retention rules based on protection level
    const fieldRules = {
      minimal: {
        retain: ['id', 'sessionId', 'feedback', 'recordedAt', 'reliability'],
        remove: ['sourceDetails.name', 'sourceDetails.contactInfo', 'sourceDetails.position']
      },
      standard: {
        retain: ['id', 'sessionId', 'source', 'feedback', 'recordedAt', 'reliability', 'sourceDetails.yearsInArea'],
        remove: ['sourceDetails.name', 'sourceDetails.contactInfo']
      },
      maximum: {
        retain: ['id', 'sessionId', 'source', 'feedback', 'recordedAt', 'reliability', 'sourceDetails'],
        remove: []
      }
    };

    const rules = fieldRules[level];

    // Remove specified fields
    for (const fieldPath of rules.remove) {
      if (this.removeNestedField(minimizedData, fieldPath)) {
        removedFields.push(fieldPath);
      }
    }

    // Track retained fields
    retainedFields.push(...rules.retain);

    return {
      minimizedData,
      removedFields,
      retainedFields
    };
  }

  /**
   * Pseudonymize identifiable information in community data
   */
  pseudonymizeCommunityData(data: any): PseudonymizationResult {
    const pseudonymizedData = { ...data };
    const pseudonymMap = new Map<string, string>();
    const fieldsPseudonymized: string[] = [];

    // Pseudonymize source name if present
    if (data.sourceDetails?.name) {
      const pseudonym = this.generatePseudonym(data.sourceDetails.name);
      pseudonymizedData.sourceDetails.name = pseudonym;
      pseudonymMap.set('sourceDetails.name', pseudonym);
      fieldsPseudonymized.push('sourceDetails.name');
    }

    // Pseudonymize position if present
    if (data.sourceDetails?.position) {
      const pseudonym = this.generatePositionPseudonym(data.sourceDetails.position);
      pseudonymizedData.sourceDetails.position = pseudonym;
      pseudonymMap.set('sourceDetails.position', pseudonym);
      fieldsPseudonymized.push('sourceDetails.position');
    }

    // Pseudonymize specific names in feedback content
    if (data.feedback) {
      const pseudonymizedFeedback = this.pseudonymizeFeedbackContent(data.feedback);
      pseudonymizedData.feedback = pseudonymizedFeedback.feedback;
      pseudonymizedFeedback.pseudonyms.forEach((value, key) => {
        pseudonymMap.set(`feedback.${key}`, value);
      });
      fieldsPseudonymized.push(...pseudonymizedFeedback.fields);
    }

    return {
      pseudonymizedData,
      pseudonymMap,
      fieldsPseudonymized
    };
  }

  /**
   * Anonymize community data by removing all identifiable information
   */
  anonymizeCommunityData(data: any): AnonymizationResult {
    const anonymizedData = { ...data };
    const anonymizationMap = new Map<string, string>();
    const fieldsAnonymized: string[] = [];

    // Remove all identifying source details
    if (anonymizedData.sourceDetails) {
      const originalName = anonymizedData.sourceDetails.name;
      const originalPosition = anonymizedData.sourceDetails.position;
      const originalContact = anonymizedData.sourceDetails.contactInfo;

      // Replace with generic identifiers
      anonymizedData.sourceDetails = {
        ...anonymizedData.sourceDetails,
        name: undefined,
        position: this.generalizePosition(originalPosition),
        contactInfo: undefined
      };

      if (originalName) {
        anonymizationMap.set('sourceDetails.name', '[ANONYMIZED]');
        fieldsAnonymized.push('sourceDetails.name');
      }
      if (originalContact) {
        anonymizationMap.set('sourceDetails.contactInfo', '[ANONYMIZED]');
        fieldsAnonymized.push('sourceDetails.contactInfo');
      }
    }

    // Anonymize feedback content
    if (anonymizedData.feedback) {
      const anonymizedFeedback = this.anonymizeFeedbackContent(anonymizedData.feedback);
      anonymizedData.feedback = anonymizedFeedback.feedback;
      anonymizedFeedback.anonymizations.forEach((value, key) => {
        anonymizationMap.set(`feedback.${key}`, value);
      });
      fieldsAnonymized.push(...anonymizedFeedback.fields);
    }

    // Add anonymization timestamp
    anonymizedData.anonymizedAt = new Date();

    return {
      anonymizedData,
      anonymizationMap,
      fieldsAnonymized
    };
  }

  /**
   * Check if data should be anonymized based on age
   */
  shouldAnonymize(recordedAt: Date): boolean {
    if (!recordedAt) return false;
    
    const ageInDays = (Date.now() - recordedAt.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays > this.config.anonymizationThreshold;
  }

  /**
   * Generate consistent pseudonym for a name
   */
  generatePseudonym(originalName: string): string {
    // Check cache first for consistency
    if (this.pseudonymCache.has(originalName)) {
      return this.pseudonymCache.get(originalName)!;
    }

    // Generate deterministic pseudonym based on hash
    const hash = crypto.createHash('sha256').update(originalName).digest('hex');
    const pseudonym = `Source_${hash.substring(0, 8)}`;
    
    this.pseudonymCache.set(originalName, pseudonym);
    return pseudonym;
  }

  /**
   * Generate pseudonym for position/role
   */
  generatePositionPseudonym(position: string): string {
    const generalizedPositions = {
      'chief': 'Community Leader',
      'elder': 'Community Elder',
      'chairman': 'Community Leader',
      'secretary': 'Community Official',
      'treasurer': 'Community Official',
      'councillor': 'Local Official',
      'administrator': 'Local Official',
      'neighbor': 'Community Member',
      'resident': 'Community Member',
      'business': 'Local Business',
      'shop': 'Local Business'
    };

    const lowerPosition = position.toLowerCase();
    for (const [key, generalized] of Object.entries(generalizedPositions)) {
      if (lowerPosition.includes(key)) {
        return generalized;
      }
    }

    return 'Community Member';
  }

  /**
   * Pseudonymize names and identifiers in feedback content
   */
  pseudonymizeFeedbackContent(feedback: any): {
    feedback: any;
    pseudonyms: Map<string, string>;
    fields: string[];
  } {
    const pseudonymizedFeedback = { ...feedback };
    const pseudonyms = new Map<string, string>();
    const fields: string[] = [];

    // Pseudonymize names in text fields
    const textFields = ['ownershipHistory', 'knownDisputes', 'concerns'];
    
    for (const field of textFields) {
      if (pseudonymizedFeedback[field]) {
        if (Array.isArray(pseudonymizedFeedback[field])) {
          pseudonymizedFeedback[field] = pseudonymizedFeedback[field].map((item: string) => 
            this.pseudonymizeTextContent(item, pseudonyms)
          );
        } else if (typeof pseudonymizedFeedback[field] === 'string') {
          pseudonymizedFeedback[field] = this.pseudonymizeTextContent(pseudonymizedFeedback[field], pseudonyms);
        }
        fields.push(field);
      }
    }

    return {
      feedback: pseudonymizedFeedback,
      pseudonyms,
      fields
    };
  }

  /**
   * Anonymize feedback content by removing specific identifiers
   */
  anonymizeFeedbackContent(feedback: any): {
    feedback: any;
    anonymizations: Map<string, string>;
    fields: string[];
  } {
    const anonymizedFeedback = { ...feedback };
    const anonymizations = new Map<string, string>();
    const fields: string[] = [];

    // Anonymize text fields
    const textFields = ['ownershipHistory', 'knownDisputes', 'concerns'];
    
    for (const field of textFields) {
      if (anonymizedFeedback[field]) {
        if (Array.isArray(anonymizedFeedback[field])) {
          anonymizedFeedback[field] = anonymizedFeedback[field].map((item: string) => 
            this.anonymizeTextContent(item)
          );
        } else if (typeof anonymizedFeedback[field] === 'string') {
          anonymizedFeedback[field] = this.anonymizeTextContent(anonymizedFeedback[field]);
        }
        anonymizations.set(field, '[ANONYMIZED]');
        fields.push(field);
      }
    }

    return {
      feedback: anonymizedFeedback,
      anonymizations,
      fields
    };
  }

  /**
   * Pseudonymize names and identifiers in text content
   */
  private pseudonymizeTextContent(text: string, pseudonymMap: Map<string, string>): string {
    // Simple name pattern matching (this could be enhanced with NLP)
    const namePatterns = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // First Last
      /\bMr\.?\s+[A-Z][a-z]+/g,        // Mr. Name
      /\bMrs\.?\s+[A-Z][a-z]+/g,       // Mrs. Name
      /\bMs\.?\s+[A-Z][a-z]+/g         // Ms. Name
    ];

    let pseudonymizedText = text;
    
    for (const pattern of namePatterns) {
      pseudonymizedText = pseudonymizedText.replace(pattern, (match) => {
        if (!pseudonymMap.has(match)) {
          pseudonymMap.set(match, this.generatePseudonym(match));
        }
        return pseudonymMap.get(match)!;
      });
    }

    return pseudonymizedText;
  }

  /**
   * Anonymize text content by removing specific identifiers
   */
  private anonymizeTextContent(text: string): string {
    // Remove names, phone numbers, and other identifiers
    return text
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]')
      .replace(/\b\d{10,}\b/g, '[PHONE]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\bP\.?O\.?\s*Box\s+\d+/gi, '[ADDRESS]')
      .replace(/\bID\s*:?\s*\d+/gi, '[ID]');
  }

  /**
   * Generalize position to broader category
   */
  private generalizePosition(position?: string): string {
    if (!position) return 'Community Member';
    
    const lowerPosition = position.toLowerCase();
    
    if (lowerPosition.includes('chief') || lowerPosition.includes('leader')) {
      return 'Community Leadership';
    }
    if (lowerPosition.includes('official') || lowerPosition.includes('admin')) {
      return 'Local Official';
    }
    if (lowerPosition.includes('business') || lowerPosition.includes('shop')) {
      return 'Local Business';
    }
    
    return 'Community Member';
  }

  /**
   * Remove nested field from object
   */
  private removeNestedField(obj: any, fieldPath: string): boolean {
    const keys = fieldPath.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        return false;
      }
      current = current[keys[i]];
    }
    
    const lastKey = keys[keys.length - 1];
    if (current[lastKey] !== undefined) {
      delete current[lastKey];
      return true;
    }
    
    return false;
  }

  /**
   * Get privacy protection summary
   */
  getProtectionSummary(): {
    config: PrivacyConfig;
    cacheSize: number;
    protectionMethods: string[];
  } {
    return {
      config: this.config,
      cacheSize: this.pseudonymCache.size,
      protectionMethods: [
        this.config.enableDataMinimization ? 'Data Minimization' : null,
        this.config.enablePseudonymization ? 'Pseudonymization' : null,
        this.config.enableAnonymization ? 'Anonymization' : null,
        'Encryption'
      ].filter(Boolean) as string[]
    };
  }

  /**
   * Clear pseudonym cache
   */
  clearCache(): void {
    this.pseudonymCache.clear();
    logger.info('Privacy protection cache cleared');
  }
}

// Create singleton instance
export const privacyProtectionService = new PrivacyProtectionService();