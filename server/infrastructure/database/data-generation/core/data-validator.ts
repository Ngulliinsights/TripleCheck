/**
 * Data Validator for Generated Data
 * 
 * Validates generated data files for structure, integrity, and quality
 */

import fs from 'fs/promises';
import path from 'path';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  statistics: {
    recordCount: number;
    fileSize: number;
    dataQuality: number;
  };
}

export interface ValidationRule {
  name: string;
  description: string;
  validate: (data: unknown) => ValidationResult;
}

/**
 * Validates generated data for quality and integrity
 */
export class DataValidator {
  private rules: Map<string, ValidationRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Validate a data file
   */
  async validateFile(filePath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      statistics: {
        recordCount: 0,
        fileSize: 0,
        dataQuality: 1.0
      }
    };

    try {
      // Check if file exists
      const stats = await fs.stat(filePath);
      result.statistics.fileSize = stats.size;

      // Read and parse file
      const content = await fs.readFile(filePath, 'utf-8');
      let data: unknown;

      try {
        data = JSON.parse(content);
      } catch (parseError) {
        result.errors.push(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        result.isValid = false;
        return result;
      }

      // Validate data structure
      if (!Array.isArray(data)) {
        result.errors.push('Data must be an array');
        result.isValid = false;
        return result;
      }

      result.statistics.recordCount = data.length;

      // Apply validation rules
      const fileName = path.basename(filePath);
      const applicableRules = this.getApplicableRules(fileName);

      for (const rule of applicableRules) {
        const ruleResult = rule.validate(data);
        result.errors.push(...ruleResult.errors);
        result.warnings.push(...ruleResult.warnings);
        
        if (!ruleResult.isValid) {
          result.isValid = false;
        }
      }

      // Calculate overall data quality
      result.statistics.dataQuality = this.calculateDataQuality(data, result);

    } catch (error) {
      result.errors.push(`File validation failed: ${error instanceof Error ? error.message : String(error)}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate data object directly
   */
  validateData(data: unknown, dataType: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      statistics: {
        recordCount: Array.isArray(data) ? data.length : 0,
        fileSize: JSON.stringify(data).length,
        dataQuality: 1.0
      }
    };

    // Apply validation rules based on data type
    const applicableRules = this.getApplicableRulesByType(dataType);

    for (const rule of applicableRules) {
      const ruleResult = rule.validate(data);
      result.errors.push(...ruleResult.errors);
      result.warnings.push(...ruleResult.warnings);
      
      if (!ruleResult.isValid) {
        result.isValid = false;
      }
    }

    result.statistics.dataQuality = this.calculateDataQuality(data, result);

    return result;
  }

  /**
   * Add custom validation rule
   */
  addRule(name: string, rule: ValidationRule): void {
    this.rules.set(name, rule);
  }

  /**
   * Remove validation rule
   */
  removeRule(name: string): boolean {
    return this.rules.delete(name);
  }

  /**
   * Get all validation rules
   */
  getRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Initialize default validation rules
   */
  private initializeDefaultRules(): void {
    // Basic structure validation
    this.rules.set('array-structure', {
      name: 'Array Structure',
      description: 'Validates that data is a non-empty array',
      validate: (data: unknown) => {
        const result: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          statistics: { recordCount: 0, fileSize: 0, dataQuality: 1.0 }
        };

        if (!Array.isArray(data)) {
          result.errors.push('Data must be an array');
          result.isValid = false;
          return result;
        }

        if (data.length === 0) {
          result.warnings.push('Data array is empty');
        }

        result.statistics.recordCount = data.length;
        return result;
      }
    });

    // User data validation
    this.rules.set('user-data', {
      name: 'User Data Validation',
      description: 'Validates user data structure and content',
      validate: (data: unknown) => {
        const result: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          statistics: { recordCount: 0, fileSize: 0, dataQuality: 1.0 }
        };

        if (!Array.isArray(data)) {
          return result;
        }

        let validRecords = 0;
        const requiredFields = ['id', 'firstName', 'lastName', 'email'];

        for (let i = 0; i < data.length; i++) {
          const record = data[i];
          
          if (!record || typeof record !== 'object') {
            result.errors.push(`Record ${i} is not an object`);
            result.isValid = false;
            continue;
          }

          // Check required fields
          const missingFields = requiredFields.filter(field => !(field in record));
          if (missingFields.length > 0) {
            result.errors.push(`Record ${i} missing fields: ${missingFields.join(', ')}`);
            result.isValid = false;
            continue;
          }

          // Validate email format
          const emailRecord = record as { email: string };
          if (emailRecord.email && !this.isValidEmail(emailRecord.email)) {
            result.warnings.push(`Record ${i} has invalid email format`);
          }

          // Validate phone format (Kenyan)
          const phoneRecord = record as { phone?: string };
          if (phoneRecord.phone && !this.isValidKenyanPhone(phoneRecord.phone)) {
            result.warnings.push(`Record ${i} has invalid phone format`);
          }

          validRecords++;
        }

        result.statistics.recordCount = data.length;
        result.statistics.dataQuality = data.length > 0 ? validRecords / data.length : 0;

        return result;
      }
    });

    // Property data validation
    this.rules.set('property-data', {
      name: 'Property Data Validation',
      description: 'Validates property data structure and content',
      validate: (data: unknown) => {
        const result: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          statistics: { recordCount: 0, fileSize: 0, dataQuality: 1.0 }
        };

        if (!Array.isArray(data)) {
          return result;
        }

        let validRecords = 0;
        const requiredFields = ['id', 'title', 'price', 'location'];

        for (let i = 0; i < data.length; i++) {
          const record = data[i];
          
          if (!record || typeof record !== 'object') {
            result.errors.push(`Record ${i} is not an object`);
            result.isValid = false;
            continue;
          }

          // Check required fields
          const missingFields = requiredFields.filter(field => !(field in record));
          if (missingFields.length > 0) {
            result.errors.push(`Record ${i} missing fields: ${missingFields.join(', ')}`);
            result.isValid = false;
            continue;
          }

          // Validate price
          const priceRecord = record as { price: number };
          if (typeof priceRecord.price !== 'number' || priceRecord.price <= 0) {
            result.errors.push(`Record ${i} has invalid price`);
            result.isValid = false;
            continue;
          }

          // Validate coordinates if present
          const coordRecord = record as { coordinates?: { lat: number; lng: number } };
          if (coordRecord.coordinates) {
            if (!this.isValidCoordinates(coordRecord.coordinates)) {
              result.warnings.push(`Record ${i} has invalid coordinates`);
            }
          }

          validRecords++;
        }

        result.statistics.recordCount = data.length;
        result.statistics.dataQuality = data.length > 0 ? validRecords / data.length : 0;

        return result;
      }
    });

    // Fraud data validation
    this.rules.set('fraud-data', {
      name: 'Fraud Data Validation',
      description: 'Validates fraud pattern data',
      validate: (data: unknown) => {
        const result: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          statistics: { recordCount: 0, fileSize: 0, dataQuality: 1.0 }
        };

        if (!Array.isArray(data)) {
          return result;
        }

        let validRecords = 0;
        const requiredFields = ['id', 'type', 'severity'];

        for (let i = 0; i < data.length; i++) {
          const record = data[i];
          
          if (!record || typeof record !== 'object') {
            result.errors.push(`Record ${i} is not an object`);
            result.isValid = false;
            continue;
          }

          // Check required fields
          const missingFields = requiredFields.filter(field => !(field in record));
          if (missingFields.length > 0) {
            result.errors.push(`Record ${i} missing fields: ${missingFields.join(', ')}`);
            result.isValid = false;
            continue;
          }

          validRecords++;
        }

        result.statistics.recordCount = data.length;
        result.statistics.dataQuality = data.length > 0 ? validRecords / data.length : 0;

        return result;
      }
    });
  }

  /**
   * Get applicable rules based on file name
   */
  private getApplicableRules(fileName: string): ValidationRule[] {
    const rules: ValidationRule[] = [];
    
    // Always apply basic structure validation
    const structureRule = this.rules.get('array-structure');
    if (structureRule) {
      rules.push(structureRule);
    }

    // Apply specific rules based on file name
    if (fileName.includes('user')) {
      const userRule = this.rules.get('user-data');
      if (userRule) rules.push(userRule);
    }

    if (fileName.includes('property')) {
      const propertyRule = this.rules.get('property-data');
      if (propertyRule) rules.push(propertyRule);
    }

    if (fileName.includes('fraud')) {
      const fraudRule = this.rules.get('fraud-data');
      if (fraudRule) rules.push(fraudRule);
    }

    return rules;
  }

  /**
   * Get applicable rules based on data type
   */
  private getApplicableRulesByType(dataType: string): ValidationRule[] {
    const rules: ValidationRule[] = [];
    
    // Always apply basic structure validation
    const structureRule = this.rules.get('array-structure');
    if (structureRule) {
      rules.push(structureRule);
    }

    // Apply specific rules based on data type
    const typeRule = this.rules.get(`${dataType}-data`);
    if (typeRule) {
      rules.push(typeRule);
    }

    return rules;
  }

  /**
   * Calculate overall data quality score
   */
  private calculateDataQuality(data: unknown, result: ValidationResult): number {
    if (!Array.isArray(data) || data.length === 0) {
      return 0;
    }

    const errorWeight = 0.5;
    const warningWeight = 0.1;
    
    const errorPenalty = result.errors.length * errorWeight;
    const warningPenalty = result.warnings.length * warningWeight;
    
    const totalPenalty = errorPenalty + warningPenalty;
    const maxPossiblePenalty = data.length; // Assume worst case
    
    return Math.max(0, 1 - (totalPenalty / maxPossiblePenalty));
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate Kenyan phone number format
   */
  private isValidKenyanPhone(phone: string): boolean {
    const kenyanPhoneRegex = /^\+254[0-9]{9}$/;
    return kenyanPhoneRegex.test(phone);
  }

  /**
   * Validate coordinates
   */
  private isValidCoordinates(coords: { lat: number; lng: number }): boolean {
    return (
      typeof coords.lat === 'number' &&
      typeof coords.lng === 'number' &&
      coords.lat >= -90 && coords.lat <= 90 &&
      coords.lng >= -180 && coords.lng <= 180
    );
  }
}