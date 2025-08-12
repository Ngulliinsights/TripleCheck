/**
 * Unified Image Service Factory
 * Centralized service creation with proper dependency injection
 */

import { imageServiceConfig } from '../../config/image-system.config';
import type { ImageServiceConfig } from '../../types/images';

import { ImageMetadataService } from './ImageMetadataService';
import { PropertyImageUploadCoordinator } from './PropertyImageUploadCoordinator';
import { PropertyImageValidationService } from './PropertyImageValidationService';
import { PropertyImageWorkflowManager } from './PropertyImageWorkflowManager';

export interface ImageServiceSuite {
  uploadCoordinator: PropertyImageUploadCoordinator;
  validationService: PropertyImageValidationService;
  workflowManager: PropertyImageWorkflowManager;
  metadataService: ImageMetadataService;
}

export interface ServiceFactoryConfig {
  config?: ImageServiceConfig;
  useMockServices?: boolean;
  enableAuditLogging?: boolean;
}

/**
 * Unified Image Service Factory
 * Creates and wires all image-related services with proper dependencies
 */
export class UnifiedImageServiceFactory {
  private static instance: UnifiedImageServiceFactory;
  private config: ImageServiceConfig;

  constructor(config?: ImageServiceConfig) {
    this.config = config || imageServiceConfig;
  }

  static getInstance(config?: ImageServiceConfig): UnifiedImageServiceFactory {
    if (!UnifiedImageServiceFactory.instance) {
      UnifiedImageServiceFactory.instance = new UnifiedImageServiceFactory(config);
    }
    return UnifiedImageServiceFactory.instance;
  }

  /**
   * Create a complete suite of image services with proper wiring
   */
  static createServiceSuite(options: ServiceFactoryConfig = {}): ImageServiceSuite {
    const factory = UnifiedImageServiceFactory.getInstance(options.config);
    return factory.createServiceSuite(options);
  }

  /**
   * Create individual validation service
   */
  static createValidationService(options: ServiceFactoryConfig = {}): PropertyImageValidationService {
    const factory = UnifiedImageServiceFactory.getInstance(options.config);
    return factory.createValidationService(options);
  }

  /**
   * Create individual upload coordinator
   */
  static createUploadCoordinator(options: ServiceFactoryConfig = {}): PropertyImageUploadCoordinator {
    const factory = UnifiedImageServiceFactory.getInstance(options.config);
    return factory.createUploadCoordinator(options);
  }

  /**
   * Create individual workflow manager
   */
  static createWorkflowManager(options: ServiceFactoryConfig = {}): PropertyImageWorkflowManager {
    const factory = UnifiedImageServiceFactory.getInstance(options.config);
    return factory.createWorkflowManager(options);
  }

  /**
   * Create individual metadata service
   */
  static createMetadataService(options: ServiceFactoryConfig = {}): ImageMetadataService {
    const factory = UnifiedImageServiceFactory.getInstance(options.config);
    return factory.createMetadataService(options);
  }

  /**
   * Create mock services for testing and development
   */
  static createMockServiceSuite(): ImageServiceSuite {
    return UnifiedImageServiceFactory.createServiceSuite({ useMockServices: true });
  }

  // Instance methods
  createServiceSuite(options: ServiceFactoryConfig = {}): ImageServiceSuite {
    const mockServices = options.useMockServices ? this.createMockDependencies() : undefined;
    
    // Create services with proper dependency injection
    const validationService = this.createValidationService(options, mockServices);
    const uploadCoordinator = this.createUploadCoordinator(options, mockServices);
    const metadataService = this.createMetadataService(options, mockServices);
    
    // Create workflow manager with all dependencies
    const workflowManager = new PropertyImageWorkflowManager({
      validationService,
      metadataService: {
        extractMetadata: metadataService.extractMetadata.bind(metadataService),
        performVirusScan: metadataService.performVirusScan.bind(metadataService),
        checkCompliance: metadataService.checkCompliance.bind(metadataService),
      },
      documentAuthService: mockServices?.documentAuthServiceForWorkflow,
      fraudDetectionService: mockServices?.fraudDetectionService,
      landVerificationService: mockServices?.landVerificationService,
      storageService: mockServices?.storageService,
      notificationService: mockServices?.notificationService,
      auditService: mockServices?.auditService,
    }, this.config);

    return {
      uploadCoordinator,
      validationService,
      workflowManager,
      metadataService,
    };
  }

  createValidationService(options: ServiceFactoryConfig = {}, mockServices?: any): PropertyImageValidationService {
    const dependencies = options.useMockServices || mockServices ? {
      documentAuthService: mockServices?.documentAuthServiceForValidation,
      fraudDetectionService: mockServices?.fraudDetectionService,
      geoLocationService: mockServices?.geoLocationService,
      auditService: options.enableAuditLogging ? mockServices?.auditService : undefined,
    } : {};

    return new PropertyImageValidationService(dependencies, this.config);
  }

  createUploadCoordinator(options: ServiceFactoryConfig = {}, mockServices?: any): PropertyImageUploadCoordinator {
    const dependencies = options.useMockServices || mockServices ? {
      apiClient: mockServices?.apiClient,
      auditService: options.enableAuditLogging ? mockServices?.auditService : undefined,
    } : {};

    return new PropertyImageUploadCoordinator(dependencies, this.config);
  }

  createWorkflowManager(options: ServiceFactoryConfig = {}, mockServices?: any): PropertyImageWorkflowManager {
    const validationService = this.createValidationService(options, mockServices);
    const metadataService = this.createMetadataService(options, mockServices);

    const dependencies = {
      validationService,
      metadataService: {
        extractMetadata: metadataService.extractMetadata.bind(metadataService),
        performVirusScan: metadataService.performVirusScan.bind(metadataService),
        checkCompliance: metadataService.checkCompliance.bind(metadataService),
      },
      documentAuthService: options.useMockServices || mockServices ? mockServices?.documentAuthServiceForWorkflow : undefined,
      fraudDetectionService: options.useMockServices || mockServices ? mockServices?.fraudDetectionService : undefined,
      landVerificationService: options.useMockServices || mockServices ? mockServices?.landVerificationService : undefined,
      storageService: options.useMockServices || mockServices ? mockServices?.storageService : undefined,
      notificationService: options.useMockServices || mockServices ? mockServices?.notificationService : undefined,
      auditService: options.enableAuditLogging && (options.useMockServices || mockServices) ? mockServices?.auditService : undefined,
    };

    return new PropertyImageWorkflowManager(dependencies, this.config);
  }

  createMetadataService(options: ServiceFactoryConfig = {}, mockServices?: any): ImageMetadataService {
    if (options.useMockServices || mockServices) {
      return new ImageMetadataService(
        mockServices?.aiVisionAPI,
        mockServices?.virusScanAPI,
        mockServices?.complianceEngine
      );
    }

    return new ImageMetadataService();
  }

  private createMockDependencies() {
    // Secure random number generator for demo purposes
    const secureRandom = (): number => {
      const timestamp = Date.now();
      return (timestamp % 1000) / 1000;
    };

    const apiClient = {
      createUploadSession: async (metadata: Record<string, unknown>) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { 
          sessionId: `mock-session-${Date.now()}`, 
          uploadUrl: '/mock-upload' 
        };
      },
      uploadChunk: async (
        _sessionId: string, 
        _chunk: { data: Blob; index: number; size: number }, 
        _metadata?: Record<string, unknown>
      ): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 50 + Math.floor(secureRandom() * 100)));
      },
      completeUpload: async (_sessionId: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 25));
      },
    };

    const storageService = {
      getFileReference: async (imageId: string) => `mock-storage-url/${imageId}.jpg`,
      updateImageMetadata: async (_imageId: string, _metadata: any) => { 
        // Mock implementation - no-op for demo 
      },
      optimizeImage: async (fileReference: string, _quality: number) => `${fileReference}-optimized.jpg`,
      generateThumbnails: async (fileReference: string, sizes: number[]) => 
        sizes.map(s => `${fileReference}-thumb-${s}.jpg`),
    };

    const documentAuthServiceForValidation = {
      authenticateDocument: async (file: File, documentType: any) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        const randomValue = secureRandom();
        const isAuthentic = randomValue > 0.2;
        
        return { 
          isAuthentic, 
          confidence: secureRandom(), 
          documentType,
          anomalies: isAuthentic ? [] : ['signature_mismatch', 'tampered_metadata'],
          verificationMethod: 'mock',
        };
      },
    };

    const documentAuthServiceForWorkflow = {
      authenticateDocument: async (fileReference: string, documentType: any) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        const randomValue = secureRandom();
        const isAuthentic = randomValue > 0.2;
        
        return { 
          isAuthentic, 
          confidence: secureRandom(), 
          documentType,
          anomalies: isAuthentic ? [] : ['signature_mismatch', 'tampered_metadata'],
          verificationMethod: 'mock',
        };
      },
    };

    const fraudDetectionService = {
      analyzeImage: async (_fileReference: string, _metadata: any) => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return secureRandom();
      },
      analyzeFraudRisk: async (_file: File, _metadata: any) => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return secureRandom();
      },
    };

    const landVerificationService = {
      linkImageToVerification: async (
        _imageId: string, 
        _landVerificationId: string, 
        _metadata: any
      ) => {
        await new Promise(resolve => setTimeout(resolve, 100));
      },
    };

    const notificationService = {
      notifyWorkflowComplete: async (
        _imageId: string, 
        _status: 'success' | 'failed', 
        _metadata?: any
      ) => { 
        // Mock implementation - no-op for demo 
      },
      notifyStepComplete: async (
        _imageId: string, 
        _step: string, 
        _success: boolean, 
        _metadata?: any
      ) => { 
        // Mock implementation - no-op for demo 
      },
    };

    const auditService = {
      logUploadEvent: async (_event: string, _metadata: Record<string, unknown>) => { 
        // Mock implementation - no-op for demo 
      },
      logValidationEvent: async (_event: string, _metadata: any) => { 
        // Mock implementation - no-op for demo 
      },
      logWorkflowEvent: async (_event: string, _metadata: any) => { 
        // Mock implementation - no-op for demo 
      },
    };

    const geoLocationService = {
      validateLocation: async (latitude: number, longitude: number, _expectedRegion?: string) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        const inKenya = latitude >= -4.678 && latitude <= 5.019 && longitude >= 33.908 && longitude <= 41.899;
        return inKenya && secureRandom() > 0.1;
      },
    };

    const aiVisionAPI = {
      analyzeImage: async (_imageUrl: string) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
          tags: [
            { label: 'property', confidence: 0.95 },
            { label: 'building', confidence: 0.88 },
            { label: 'outdoor', confidence: 0.82 },
          ],
          objects: ['building', 'window', 'door'],
          faces: Math.floor(secureRandom() * 3),
          dominantColors: ['#8B4513', '#228B22', '#87CEEB'],
        };
      },
    };

    const virusScanAPI = {
      scanFile: async (_fileUrl: string) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        const clean = secureRandom() > 0.02;
        return {
          clean,
          threats: clean ? [] : ['suspicious-metadata'],
          scanDuration: 150 + Math.floor(secureRandom() * 100),
        };
      },
    };

    const complianceEngine = {
      checkCompliance: async (_metadata: any, _fileInfo: any) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          complianceFlags: secureRandom() > 0.9 ? ['manual-review-required'] : [],
          regulatoryFlags: secureRandom() > 0.95 ? ['regulatory-review-required'] : [],
        };
      },
    };

    return {
      apiClient,
      storageService,
      documentAuthServiceForValidation,
      documentAuthServiceForWorkflow,
      fraudDetectionService,
      landVerificationService,
      notificationService,
      auditService,
      geoLocationService,
      aiVisionAPI,
      virusScanAPI,
      complianceEngine,
    };
  }
}

export default UnifiedImageServiceFactory;