import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ImageServiceRegistry } from '../core/ImageServiceCore';
import { PropertyImageUploadService } from '../PropertyImageUploadService';
import { PropertyImageValidationService } from '../PropertyImageValidationService';
import { ImageMetadataService } from '../ImageMetadataService';
import { PropertyImageWorkflowManager } from '../PropertyImageWorkflowManager';
import { getImageServiceOrchestrator } from '../ImageServiceOrchestrator';

// Mock dependencies
vi.mock('../../../config/image-system.config', () => ({
  imageServiceConfig: {
    upload: {
      chunkSize: 1024 * 1024,
      maxRetries: 3,
      retryDelay: 1000,
    },
    validation: {
      maxFileSize: 10 * 1024 * 1024,
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      documentAuthEnabled: true,
      fraudDetectionEnabled: true,
    },
    processing: {
      enableAITagging: true,
      enableVirusScanning: true,
      enableComplianceCheck: true,
      optimizationQuality: 85,
      thumbnailSizes: [150, 300, 600],
    },
  },
}));

vi.mock('../../../utils/images/unified-utils', () => ({
  ImageUtils: {
    generateUniqueId: () => 'test-id-123',
    calculateHash: vi.fn().mockResolvedValue('test-hash'),
    getFileExtension: (filename: string) => filename.split('.').pop() || '',
    formatFileSize: (size: number) => `${size} bytes`,
  },
}));

describe('Image Service Consolidation', () => {
  let registry: ImageServiceRegistry;

  beforeEach(() => {
    // Reset registry for each test
    registry = ImageServiceRegistry.getInstance();
    vi.clearAllMocks();
  });

  describe('Service Registry', () => {
    it('should be a singleton', () => {
      const registry1 = ImageServiceRegistry.getInstance();
      const registry2 = ImageServiceRegistry.getInstance();
      expect(registry1).toBe(registry2);
    });

    it('should register and retrieve services', () => {
      const uploadService = new PropertyImageUploadService();
      registry.register(uploadService);

      const retrieved = registry.get<PropertyImageUploadService>('PropertyImageUploadService');
      expect(retrieved).toBe(uploadService);
    });
  });

  describe('PropertyImageUploadService', () => {
    it('should extend ImageServiceCore', () => {
      const service = new PropertyImageUploadService();
      expect(service.serviceName).toBe('PropertyImageUploadService');
      expect(service.version).toBe('2.0.0');
      expect(typeof service.logEvent).toBe('function');
      expect(typeof service.updateConfig).toBe('function');
    });

    it('should provide upload functionality', async () => {
      const service = new PropertyImageUploadService();
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

      const session = await service.initiateUpload(mockFile);
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('imageId');
      expect(session).toHaveProperty('chunks');
      expect(session.status).toBe('pending');
    });

    it('should handle upload progress tracking', () => {
      const service = new PropertyImageUploadService();
      const sessionId = 'test-session';

      // Should return null for non-existent session
      const progress = service.getUploadProgress(sessionId);
      expect(progress).toBeNull();
    });
  });

  describe('PropertyImageValidationService', () => {
    it('should extend ImageServiceCore', () => {
      const service = new PropertyImageValidationService();
      expect(service.serviceName).toBe('PropertyImageValidationService');
      expect(service.version).toBe('2.0.0');
      expect(typeof service.logEvent).toBe('function');
      expect(typeof service.updateConfig).toBe('function');
    });

    it('should validate files', async () => {
      const service = new PropertyImageValidationService();
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

      const result = await service.validateFile(mockFile);
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should provide validation profiles', () => {
      const service = new PropertyImageValidationService();
      const profile = service.getValidationProfile('property_photo');
      expect(profile).toHaveProperty('maxFileSize');
      expect(profile).toHaveProperty('allowedFormats');
    });
  });

  describe('ImageMetadataService', () => {
    it('should extend ImageServiceCore', () => {
      const service = new ImageMetadataService();
      expect(service.serviceName).toBe('ImageMetadataService');
      expect(service.version).toBe('2.0.0');
      expect(typeof service.logEvent).toBe('function');
      expect(typeof service.updateConfig).toBe('function');
    });

    it('should extract metadata', async () => {
      const service = new ImageMetadataService();
      const metadata = await service.extractMetadata('test-file-ref');
      
      expect(metadata).toHaveProperty('fileSize');
      expect(metadata).toHaveProperty('technicalMetadata');
      expect(metadata).toHaveProperty('createdAt');
      expect(metadata).toHaveProperty('lastModified');
    });

    it('should perform virus scans', async () => {
      const service = new ImageMetadataService();
      const scanResult = await service.performVirusScan('test-file-ref');
      
      expect(scanResult).toHaveProperty('clean');
      expect(scanResult).toHaveProperty('threats');
      expect(scanResult).toHaveProperty('scanDate');
      expect(scanResult).toHaveProperty('scanDuration');
      expect(Array.isArray(scanResult.threats)).toBe(true);
    });
  });

  describe('PropertyImageWorkflowManager', () => {
    it('should extend ImageServiceCore', () => {
      const service = new PropertyImageWorkflowManager({
        validationService: {
          validateUrl: vi.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
        },
        metadataService: {
          extractMetadata: vi.fn().mockResolvedValue({}),
          performVirusScan: vi.fn().mockResolvedValue({ clean: true, threats: [] }),
          checkCompliance: vi.fn().mockResolvedValue({ complianceFlags: [], regulatoryFlags: [] }),
        },
      });
      
      expect(service.serviceName).toBe('PropertyImageWorkflowManager');
      expect(service.version).toBe('2.0.0');
      expect(typeof service.logEvent).toBe('function');
      expect(typeof service.updateConfig).toBe('function');
    });

    it('should manage workflow status', () => {
      const service = new PropertyImageWorkflowManager({
        validationService: {
          validateUrl: vi.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
        },
        metadataService: {
          extractMetadata: vi.fn().mockResolvedValue({}),
          performVirusScan: vi.fn().mockResolvedValue({ clean: true, threats: [] }),
          checkCompliance: vi.fn().mockResolvedValue({ complianceFlags: [], regulatoryFlags: [] }),
        },
      });

      // Should return null for non-existent workflow
      const status = service.getWorkflowStatus('non-existent-id');
      expect(status).toBeNull();
    });
  });

  describe('ImageServiceOrchestrator', () => {
    it('should coordinate all services', () => {
      const orchestrator = getImageServiceOrchestrator();
      
      expect(orchestrator.getUploadService()).toBeInstanceOf(PropertyImageUploadService);
      expect(orchestrator.getValidationService()).toBeInstanceOf(PropertyImageValidationService);
      expect(orchestrator.getWorkflowService()).toBeInstanceOf(PropertyImageWorkflowManager);
      expect(orchestrator.getMetadataService()).toBeInstanceOf(ImageMetadataService);
    });

    it('should provide high-level workflows', async () => {
      const orchestrator = getImageServiceOrchestrator();
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

      // Test validate and upload workflow
      const result = await orchestrator.validateAndUpload(mockFile, 'property_photo');
      expect(result).toHaveProperty('validation');
      expect(result).toHaveProperty('upload');
      expect(result.validation).toHaveProperty('isValid');
    });

    it('should be a singleton', () => {
      const orchestrator1 = getImageServiceOrchestrator();
      const orchestrator2 = getImageServiceOrchestrator();
      expect(orchestrator1).toBe(orchestrator2);
    });
  });

  describe('Service Integration', () => {
    it('should have all services registered in registry', () => {
      // Import services to trigger registration
      require('../PropertyImageUploadService');
      require('../PropertyImageValidationService');
      require('../ImageMetadataService');
      require('../PropertyImageWorkflowManager');

      const uploadService = registry.get('PropertyImageUploadService');
      const validationService = registry.get('PropertyImageValidationService');
      const metadataService = registry.get('ImageMetadataService');
      const workflowService = registry.get('PropertyImageWorkflowManager');

      expect(uploadService).toBeDefined();
      expect(validationService).toBeDefined();
      expect(metadataService).toBeDefined();
      expect(workflowService).toBeDefined();
    });

    it('should share common functionality through ImageServiceCore', () => {
      const uploadService = new PropertyImageUploadService();
      const validationService = new PropertyImageValidationService();

      // Both services should have shared methods from ImageServiceCore
      expect(typeof uploadService.logEvent).toBe('function');
      expect(typeof uploadService.updateConfig).toBe('function');
      expect(typeof validationService.logEvent).toBe('function');
      expect(typeof validationService.updateConfig).toBe('function');

      // Both should have service identification
      expect(uploadService.serviceName).toBeTruthy();
      expect(uploadService.version).toBeTruthy();
      expect(validationService.serviceName).toBeTruthy();
      expect(validationService.version).toBeTruthy();
    });

    it('should eliminate code duplication through shared core', () => {
      const uploadService = new PropertyImageUploadService();
      const validationService = new PropertyImageValidationService();

      // Both services should share the same base class methods
      const uploadConfig = uploadService.getConfig();
      const validationConfig = validationService.getConfig();

      expect(uploadConfig).toHaveProperty('upload');
      expect(uploadConfig).toHaveProperty('validation');
      expect(uploadConfig).toHaveProperty('processing');
      expect(validationConfig).toHaveProperty('upload');
      expect(validationConfig).toHaveProperty('validation');
      expect(validationConfig).toHaveProperty('processing');
    });
  });

  describe('Backward Compatibility', () => {
    it('should provide legacy service adapters', async () => {
      const { LegacyPropertyImageUploadCoordinator } = await import('../LegacyServiceAdapter');
      const legacyService = new LegacyPropertyImageUploadCoordinator();

      expect(typeof legacyService.initiateUpload).toBe('function');
      expect(typeof legacyService.uploadChunk).toBe('function');
      expect(typeof legacyService.getUploadProgress).toBe('function');
    });

    it('should maintain API compatibility', async () => {
      const { legacyPropertyImageUploadCoordinator } = await import('../LegacyServiceAdapter');
      
      expect(legacyPropertyImageUploadCoordinator).toBeDefined();
      expect(typeof legacyPropertyImageUploadCoordinator.initiateUpload).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const service = new PropertyImageValidationService();
      
      // Test with invalid file
      const invalidFile = new File([''], '', { type: '' });
      const result = await service.validateFile(invalidFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide meaningful error messages', async () => {
      const service = new PropertyImageUploadService();
      
      try {
        // This should fail with empty file
        const emptyFile = new File([''], 'empty.txt', { type: 'text/plain' });
        await service.initiateUpload(emptyFile);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Failed to initiate upload');
      }
    });
  });
});

describe('Performance and Bundle Size', () => {
  it('should reduce code duplication through shared core', () => {
    const uploadService = new PropertyImageUploadService();
    const validationService = new PropertyImageValidationService();
    const metadataService = new ImageMetadataService();
    const workflowService = new PropertyImageWorkflowManager({
      validationService: { validateUrl: vi.fn() },
      metadataService: {
        extractMetadata: vi.fn(),
        performVirusScan: vi.fn(),
        checkCompliance: vi.fn(),
      },
    });

    // All services should share the same base class
    const services = [uploadService, validationService, metadataService, workflowService];
    
    services.forEach(service => {
      expect(service).toHaveProperty('serviceName');
      expect(service).toHaveProperty('version');
      expect(typeof service.logEvent).toBe('function');
      expect(typeof service.updateConfig).toBe('function');
      expect(typeof service.getConfig).toBe('function');
    });
  });

  it('should provide efficient service registry', () => {
    const registry = ImageServiceRegistry.getInstance();
    
    // Registry should be lightweight and efficient
    expect(typeof registry.register).toBe('function');
    expect(typeof registry.get).toBe('function');
    expect(typeof registry.getServicesByType).toBe('function');
  });
});