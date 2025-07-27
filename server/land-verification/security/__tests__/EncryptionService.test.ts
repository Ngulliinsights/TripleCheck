import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EncryptionService } from '../EncryptionService';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  const testMasterKey = 'test-master-key-for-encryption-service-testing';

  beforeEach(() => {
    encryptionService = new EncryptionService(testMasterKey);
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt data successfully', () => {
      const originalData = 'sensitive land ownership information';
      
      const encrypted = encryptionService.encrypt(originalData);
      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      expect(encrypted.encryptedData).not.toBe(originalData);

      const decrypted = encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(originalData);
    });

    it('should encrypt with additional authenticated data', () => {
      const originalData = 'community feedback content';
      const additionalData = 'session-123';
      
      const encrypted = encryptionService.encrypt(originalData, additionalData);
      const decrypted = encryptionService.decrypt(encrypted, additionalData);
      
      expect(decrypted).toBe(originalData);
    });

    it('should fail decryption with wrong additional data', () => {
      const originalData = 'community feedback content';
      const correctAAD = 'session-123';
      const wrongAAD = 'session-456';
      
      const encrypted = encryptionService.encrypt(originalData, correctAAD);
      
      expect(() => {
        encryptionService.decrypt(encrypted, wrongAAD);
      }).toThrow('Decryption failed');
    });

    it('should fail decryption with tampered data', () => {
      const originalData = 'sensitive information';
      const encrypted = encryptionService.encrypt(originalData);
      
      // Tamper with encrypted data
      encrypted.encryptedData = encrypted.encryptedData.slice(0, -2) + '00';
      
      expect(() => {
        encryptionService.decrypt(encrypted);
      }).toThrow('Decryption failed');
    });
  });

  describe('Field Encryption', () => {
    it('should encrypt specific fields in an object', () => {
      const data = {
        id: '123',
        publicInfo: 'public data',
        sensitiveInfo: 'sensitive data',
        nested: {
          publicField: 'public',
          sensitiveField: 'sensitive'
        }
      };

      const fieldsToEncrypt = ['sensitiveInfo', 'nested.sensitiveField'];
      const encrypted = encryptionService.encryptFields(data, fieldsToEncrypt, 'session-123');

      expect(encrypted.id).toBe('123');
      expect(encrypted.publicInfo).toBe('public data');
      expect(encrypted.sensitiveInfo).toHaveProperty('encryptedData');
      expect(encrypted.nested.publicField).toBe('public');
      expect(encrypted.nested.sensitiveField).toHaveProperty('encryptedData');
    });

    it('should decrypt specific fields in an object', () => {
      const data = {
        id: '123',
        sensitiveInfo: 'sensitive data',
        nested: {
          sensitiveField: 'sensitive nested data'
        }
      };

      const fieldsToEncrypt = ['sensitiveInfo', 'nested.sensitiveField'];
      const encrypted = encryptionService.encryptFields(data, fieldsToEncrypt, 'session-123');
      const decrypted = encryptionService.decryptFields(encrypted, fieldsToEncrypt, 'session-123');

      expect(decrypted.id).toBe('123');
      expect(decrypted.sensitiveInfo).toBe('sensitive data');
      expect(decrypted.nested.sensitiveField).toBe('sensitive nested data');
    });

    it('should handle non-existent fields gracefully', () => {
      const data = { id: '123', publicInfo: 'public' };
      const fieldsToEncrypt = ['nonExistentField'];
      
      const result = encryptionService.encryptFields(data, fieldsToEncrypt);
      expect(result).toEqual(data);
    });
  });

  describe('Community Feedback Encryption', () => {
    it('should encrypt community feedback sensitive fields', () => {
      const feedback = {
        id: 'feedback-123',
        sessionId: 'session-456',
        sourceDetails: {
          name: 'John Doe',
          contactInfo: 'john@example.com',
          yearsInArea: 5
        },
        feedback: {
          ownershipHistory: 'Property owned by Smith family',
          knownDisputes: ['Boundary dispute with neighbor'],
          concerns: ['Potential land grabbing']
        }
      };

      const encrypted = encryptionService.encryptCommunityFeedback(feedback);

      expect(encrypted.id).toBe('feedback-123');
      expect(encrypted.sessionId).toBe('session-456');
      expect(encrypted.sourceDetails.yearsInArea).toBe(5);
      expect(encrypted.sourceDetails.name).toHaveProperty('encryptedData');
      expect(encrypted.sourceDetails.contactInfo).toHaveProperty('encryptedData');
      expect(encrypted.feedback.ownershipHistory).toHaveProperty('encryptedData');
    });

    it('should decrypt community feedback', () => {
      const feedback = {
        id: 'feedback-123',
        sessionId: 'session-456',
        sourceDetails: {
          name: 'John Doe',
          contactInfo: 'john@example.com'
        },
        feedback: {
          ownershipHistory: 'Property owned by Smith family'
        }
      };

      const encrypted = encryptionService.encryptCommunityFeedback(feedback);
      const decrypted = encryptionService.decryptCommunityFeedback(encrypted);

      expect(decrypted.sourceDetails.name).toBe('John Doe');
      expect(decrypted.sourceDetails.contactInfo).toBe('john@example.com');
      expect(decrypted.feedback.ownershipHistory).toBe('Property owned by Smith family');
    });
  });

  describe('Ownership Data Encryption', () => {
    it('should encrypt ownership data sensitive fields', () => {
      const ownershipData = {
        titleNumber: 'TITLE-123',
        currentOwner: {
          name: 'Jane Smith',
          idNumber: 'ID123456789',
          contactInfo: 'jane@example.com'
        },
        ownershipHistory: [
          {
            ownerName: 'Previous Owner',
            idNumber: 'ID987654321'
          }
        ]
      };

      const encrypted = encryptionService.encryptOwnershipData(ownershipData);

      expect(encrypted.titleNumber).toBe('TITLE-123');
      expect(encrypted.currentOwner.name).toHaveProperty('encryptedData');
      expect(encrypted.currentOwner.idNumber).toHaveProperty('encryptedData');
      expect(encrypted.currentOwner.contactInfo).toHaveProperty('encryptedData');
    });

    it('should decrypt ownership data', () => {
      const ownershipData = {
        titleNumber: 'TITLE-123',
        currentOwner: {
          name: 'Jane Smith',
          idNumber: 'ID123456789'
        }
      };

      const encrypted = encryptionService.encryptOwnershipData(ownershipData);
      const decrypted = encryptionService.decryptOwnershipData(encrypted);

      expect(decrypted.currentOwner.name).toBe('Jane Smith');
      expect(decrypted.currentOwner.idNumber).toBe('ID123456789');
    });
  });

  describe('Hash Generation and Verification', () => {
    it('should generate consistent hashes', () => {
      const data = 'test data for hashing';
      const hash1 = encryptionService.generateHash(data);
      const hash2 = encryptionService.generateHash(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex length
    });

    it('should verify hash correctly', () => {
      const data = 'test data for verification';
      const hash = encryptionService.generateHash(data);
      
      expect(encryptionService.verifyHash(data, hash)).toBe(true);
      expect(encryptionService.verifyHash('different data', hash)).toBe(false);
    });
  });

  describe('Secure Token Generation', () => {
    it('should generate unique secure tokens', () => {
      const token1 = encryptionService.generateSecureToken();
      const token2 = encryptionService.generateSecureToken();
      
      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64); // 32 bytes in hex
      expect(token2).toHaveLength(64);
    });
  });

  describe('Error Handling', () => {
    it('should handle encryption errors gracefully', () => {
      expect(() => {
        new EncryptionService('');
      }).toThrow('Master encryption key not provided');
    });

    it('should handle decryption of invalid data', () => {
      const invalidEncryptedData = {
        encryptedData: 'invalid',
        iv: 'invalid',
        tag: 'invalid'
      };
      
      expect(() => {
        encryptionService.decrypt(invalidEncryptedData);
      }).toThrow('Decryption failed');
    });

    it('should handle non-string data in field encryption', () => {
      const data = {
        numberField: 123,
        booleanField: true,
        nullField: null
      };
      
      const result = encryptionService.encryptFields(data, ['numberField', 'booleanField', 'nullField']);
      expect(result.numberField).toBe(123);
      expect(result.booleanField).toBe(true);
      expect(result.nullField).toBe(null);
    });
  });

  describe('Master Key Validation', () => {
    it('should throw error when no master key is provided', () => {
      // Mock environment variable to be undefined
      const originalEnv = process.env.LAND_VERIFICATION_MASTER_KEY;
      delete process.env.LAND_VERIFICATION_MASTER_KEY;
      
      expect(() => {
        new EncryptionService(''); // Pass empty string to trigger error
      }).toThrow('Master encryption key not provided');
      
      // Restore environment variable
      if (originalEnv) {
        process.env.LAND_VERIFICATION_MASTER_KEY = originalEnv;
      }
    });
  });
});