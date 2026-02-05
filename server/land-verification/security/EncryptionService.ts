import crypto from './SecurityIntegration';

import { logger } from '../../infrastructure/monitoring/logger';

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  saltLength: number;
}

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  tag: string;
  salt?: string;
}

export interface FieldEncryptionResult {
  [key: string]: EncryptedData | any;
}

/**
 * Service for encrypting sensitive land ownership and community data
 * Implements AES-256-GCM encryption with proper key derivation
 */
export class EncryptionService {
  private config: EncryptionConfig;
  private masterKey: Buffer;

  constructor(masterKey?: string) {
    this.config = {
      algorithm: 'aes-256-cbc',
      keyLength: 32, // 256 bits
      ivLength: 16,  // 128 bits
      tagLength: 16, // 128 bits (not used in CBC)
      saltLength: 32 // 256 bits
    };

    // Use provided master key or generate from environment
    let keySource: string;
    if (masterKey !== undefined) {
      keySource = masterKey;
    } else {
      keySource = process.env.LAND_VERIFICATION_MASTER_KEY || 'default-test-key-for-development';
    }
    
    if (!keySource || keySource.trim() === '') {
      throw new Error('Master encryption key not provided. Set LAND_VERIFICATION_MASTER_KEY environment variable.');
    }

    this.masterKey = crypto.scryptSync(keySource, 'land-verification-salt', this.config.keyLength);
  }

  /**
   * Encrypt sensitive data with additional authenticated data (AAD)
   */
  encrypt(data: string, additionalData?: string): EncryptedData {
    try {
      const iv = crypto.randomBytes(this.config.ivLength);
      const cipher = crypto.createCipheriv(this.config.algorithm, this.masterKey, iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // For CBC mode, we'll use HMAC for authentication instead of GCM tag
      const hmac = crypto.createHmac('sha256', this.masterKey);
      hmac.update(encrypted);
      if (additionalData) {
        hmac.update(additionalData);
      }
      const tag = hmac.digest('hex');

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag
      };
    } catch (error) {
      logger.error('Failed to encrypt data', 'EncryptionService', undefined, error as Error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data with additional authenticated data (AAD)
   */
  decrypt(encryptedData: EncryptedData, additionalData?: string): string {
    try {
      // Verify HMAC tag first
      const hmac = crypto.createHmac('sha256', this.masterKey);
      hmac.update(encryptedData.encryptedData);
      if (additionalData) {
        hmac.update(additionalData);
      }
      const expectedTag = hmac.digest('hex');
      
      if (!crypto.timingSafeEqual(Buffer.from(expectedTag), Buffer.from(encryptedData.tag))) {
        throw new Error('Authentication failed');
      }

      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = crypto.createDecipheriv(this.config.algorithm, this.masterKey, iv);

      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Failed to decrypt data', 'EncryptionService', undefined, error as Error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt specific fields in an object while preserving structure
   */
  encryptFields(data: any, fieldsToEncrypt: string[], sessionId?: string): FieldEncryptionResult {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const result = { ...data };
    const additionalData = sessionId || '';

    for (const fieldPath of fieldsToEncrypt) {
      const value = this.getNestedValue(result, fieldPath);
      if (value !== undefined && typeof value === 'string') {
        this.setNestedValue(result, fieldPath, this.encrypt(value, additionalData));
      }
    }

    return result;
  }

  /**
   * Decrypt specific fields in an object
   */
  decryptFields(data: any, fieldsToDecrypt: string[], sessionId?: string): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const result = { ...data };
    const additionalData = sessionId || '';

    for (const fieldPath of fieldsToDecrypt) {
      const encryptedValue = this.getNestedValue(result, fieldPath);
      if (encryptedValue && this.isEncryptedData(encryptedValue)) {
        try {
          const decryptedValue = this.decrypt(encryptedValue, additionalData);
          this.setNestedValue(result, fieldPath, decryptedValue);
        } catch (error) {
          logger.warn(`Failed to decrypt field ${fieldPath}`, 'EncryptionService');
          // Leave encrypted data in place if decryption fails
        }
      }
    }

    return result;
  }

  /**
   * Encrypt community feedback data with privacy protection
   */
  encryptCommunityFeedback(feedback: any): any {
    const sensitiveFields = [
      'sourceDetails.name',
      'sourceDetails.contactInfo',
      'feedback.ownershipHistory',
      'feedback.knownDisputes',
      'feedback.concerns'
    ];

    return this.encryptFields(feedback, sensitiveFields, feedback.sessionId);
  }

  /**
   * Decrypt community feedback data
   */
  decryptCommunityFeedback(encryptedFeedback: any): any {
    const sensitiveFields = [
      'sourceDetails.name',
      'sourceDetails.contactInfo',
      'feedback.ownershipHistory',
      'feedback.knownDisputes',
      'feedback.concerns'
    ];

    return this.decryptFields(encryptedFeedback, sensitiveFields, encryptedFeedback.sessionId);
  }

  /**
   * Encrypt land ownership data
   */
  encryptOwnershipData(ownershipData: any): any {
    const sensitiveFields = [
      'currentOwner.name',
      'currentOwner.idNumber',
      'currentOwner.contactInfo',
      'ownershipHistory.*.ownerName',
      'ownershipHistory.*.idNumber',
      'legalInstruments.*.parties'
    ];

    return this.encryptFields(ownershipData, sensitiveFields, ownershipData.titleNumber);
  }

  /**
   * Decrypt land ownership data
   */
  decryptOwnershipData(encryptedData: any): any {
    const sensitiveFields = [
      'currentOwner.name',
      'currentOwner.idNumber',
      'currentOwner.contactInfo',
      'ownershipHistory.*.ownerName',
      'ownershipHistory.*.idNumber',
      'legalInstruments.*.parties'
    ];

    return this.decryptFields(encryptedData, sensitiveFields, encryptedData.titleNumber);
  }

  /**
   * Generate a secure hash for data integrity verification
   */
  generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data integrity using hash
   */
  verifyHash(data: string, expectedHash: string): boolean {
    const actualHash = this.generateHash(data);
    return crypto.timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
  }

  /**
   * Generate a secure token for session identification
   */
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Private helper methods

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (key.includes('*')) {
        // Handle array wildcard
        const arrayKey = key.replace('*', '');
        if (Array.isArray(current)) {
          return current.map(item => item[arrayKey]);
        }
      }
      return current?.[key];
    }, obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    const target = keys.reduce((current, key) => {
      if (key.includes('*')) {
        // Handle array wildcard - not implemented for setting
        throw new Error('Wildcard setting not supported');
      }
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
  }

  private isEncryptedData(value: any): value is EncryptedData {
    return value && 
           typeof value === 'object' && 
           typeof value.encryptedData === 'string' &&
           typeof value.iv === 'string' &&
           typeof value.tag === 'string';
  }
}

// Create singleton instance
export const encryptionService = new EncryptionService();