/**
 * Image Service Orchestrator - Practical Implementation
 * 
 * Coordinates existing services to eliminate duplication while maintaining
 * compatibility. Uses composition over inheritance for better reliability.
 * 
 * Strategic Benefits:
 * - Single entry point for complex workflows
 * - Works with existing proven services
 * - Eliminates duplication through smart coordination
 * - Maintains backward compatibility
 */

import { PropertyImageUploadService } from './PropertyImageUploadService';
import { PropertyImageValidationService } from './PropertyImageValidationService';
import { PropertyImageWorkflowManager } from './PropertyImageWorkflowManager';
import { ImageMetadataService } from './ImageMetadataService';
import type {
  PropertyImage,
  DocumentType,
  ValidationResult,
  UploadSession,
  UploadProgress,
  WorkflowStatus,
  PropertyImageMetadata,
  ImageServiceConfig,
} from '../../types/images';
import { ImageUtils } from '../../utils/images/unified-utils';

export interface ImageServiceOrchestrator {
  // High-level workflows that coordinate multiple services
  processPropertyImage(file: File, documentType?: DocumentType, landVerificationId?: string): Promise<PropertyImage>;
  validateAndUpload(file: File, documentType?: DocumentType): Promise<{ validation: ValidationResult; upload: UploadSession }>;
  
  // Direct service access for specific operations
  getUploadService(): PropertyImageUploadService;
  getValidationService(): PropertyImageValidationService;
  getWorkflowService(): PropertyImageWorkflowManager;
  getMetadataService(): ImageMetadataService;
  
  // Progress tracking
  getUploadProgress(sessionId: string): UploadProgress | null;
  getWorkflowStatus(imageId: string): WorkflowStatus | null;
}

export class DefaultImageServiceOrchestrator implements ImageServiceOrchestrator {
  private uploadService: PropertyImageUploadService;
  private validationService: PropertyImageValidationService;
  private workflowService: PropertyImageWorkflowManager;
  private metadataService: ImageMetadataService;

  constructor(config?: ImageServiceConfig) {
    // Initialize new consolidated services with optimized configuration
    this.uploadService = new PropertyImageUploadService({}, config);
    this.validationService = new PropertyImageValidationService({}, config);
    this.metadataService = new ImageMetadataService();
    
    // Initialize workflow service with proper dependencies
    this.workflowService = new PropertyImageWorkflowManager(
      {
        validationService: this.validationService,
        metadataService: {
          extractMetadata: (ref: string) => this.metadataService.extractMetadata(ref),
          performVirusScan: (ref: string) => this.metadataService.performVirusScan(ref),
          checkCompliance: (ref: string, metadata: PropertyImageMetadata) => 
            this.metadataService.checkCompliance(ref, metadata),
        },
      },
      config
    );
  }

  // High-level workflow: Complete property image processing
  async processPropertyImage(
    file: File,
    documentType?: DocumentType,
    landVerificationId?: string
  ): Promise<PropertyImage> {
    // Step 1: Validate the file
    const validation = await this.validationService.validateFile(file, undefined, documentType);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Step 2: Initiate upload
    const uploadSession = await this.uploadService.initiateUpload(file, documentType, landVerificationId);

    // Step 3: Upload chunks
    for (const chunk of uploadSession.chunks) {
      await this.uploadService.uploadChunk(uploadSession.id, chunk);
    }

    // Step 4: Start processing workflow
    await this.workflowService.startProcessingWorkflow(
      uploadSession.imageId,
      `uploaded/${uploadSession.imageId}`,
      documentType,
      landVerificationId
    );

    // Return the property image object
    return {
      id: uploadSession.imageId,
      file,
      status: 'processing',
      approvalStatus: 'pending',
      sessionId: uploadSession.id,
      documentType,
      landVerificationId,
      metadata: validation.metadata,
      validationResult: validation,
    } as PropertyImage;
  }

  // High-level workflow: Validate and upload (without processing)
  async validateAndUpload(
    file: File,
    documentType?: DocumentType
  ): Promise<{ validation: ValidationResult; upload: UploadSession }> {
    const validation = await this.validationService.validateFile(file, undefined, documentType);
    
    if (!validation.isValid) {
      return { validation, upload: null as any };
    }

    const upload = await this.uploadService.initiateUpload(file, documentType);
    
    return { validation, upload };
  }

  // Direct service access
  getUploadService(): PropertyImageUploadService {
    return this.uploadService;
  }

  getValidationService(): PropertyImageValidationService {
    return this.validationService;
  }

  getWorkflowService(): PropertyImageWorkflowManager {
    return this.workflowService;
  }

  getMetadataService(): ImageMetadataService {
    return this.metadataService;
  }

  // Progress tracking methods
  getUploadProgress(sessionId: string): UploadProgress | null {
    return this.uploadService.getUploadProgress(sessionId);
  }

  getWorkflowStatus(imageId: string): WorkflowStatus | null {
    return this.workflowService.getWorkflowStatus(imageId);
  }

  // Utility methods for monitoring across services (removed duplicates)

  // Batch operations that coordinate multiple services
  async processBatch(
    files: File[],
    documentType?: DocumentType,
    onProgress?: (completed: number, total: number) => void
  ): Promise<PropertyImage[]> {
    const results: PropertyImage[] = [];
    let completed = 0;

    for (const file of files) {
      try {
        const result = await this.processPropertyImage(file, documentType);
        results.push(result);
      } catch (error) {
        // Create error result
        results.push({
          id: `error_${Date.now()}`,
          file,
          status: 'error',
          approvalStatus: 'pending',
          validationResult: {
            isValid: false,
            errors: [error instanceof Error ? error.message : 'Processing failed'],
            warnings: [],
          },
        } as PropertyImage);
      }

      completed++;
      onProgress?.(completed, files.length);
    }

    return results;
  }
}

// Singleton instance for global use
let orchestratorInstance: DefaultImageServiceOrchestrator | null = null;

export function getImageServiceOrchestrator(config?: ImageServiceConfig): DefaultImageServiceOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new DefaultImageServiceOrchestrator(config);
  }
  return orchestratorInstance;
}

// Factory function for creating new instances (useful for testing)
export function createImageServiceOrchestrator(config?: ImageServiceConfig): DefaultImageServiceOrchestrator {
  return new DefaultImageServiceOrchestrator(config);
}

export default DefaultImageServiceOrchestrator;