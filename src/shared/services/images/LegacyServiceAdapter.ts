/**
 * Legacy Service Adapter
 * 
 * Provides backward compatibility for components still using old service APIs.
 * This adapter wraps the new orchestrator to provide the old interface.
 * 
 * Usage: Replace old service imports with this adapter during migration.
 */

import { getImageServiceOrchestrator } from './ImageServiceOrchestrator';
import type {
  PropertyImage,
  DocumentType,
  ValidationResult,
  ValidationOptions,
  UploadSession,
  UploadProgress,
  ImageChunk,
  WorkflowStatus,
  ProcessingStep,
  PropertyImageMetadata,
  ScanResult,
  ComplianceResult,
  AITag,
} from '../../types/images';

/**
 * Legacy PropertyImageUploadCoordinator API
 * Wraps the new upload service for backward compatibility
 */
export class LegacyPropertyImageUploadCoordinator {
  private orchestrator = getImageServiceOrchestrator();
  private uploadService = this.orchestrator.getUploadService();

  async initiateUpload(
    file: File,
    documentType?: DocumentType,
    landVerificationId?: string
  ): Promise<UploadSession> {
    return this.uploadService.initiateUpload(file, documentType, landVerificationId);
  }

  async uploadChunk(sessionId: string, chunk: ImageChunk): Promise<void> {
    return this.uploadService.uploadChunk(sessionId, chunk);
  }

  pauseUpload(sessionId: string): void {
    this.uploadService.pauseUpload(sessionId);
  }

  resumeUpload(sessionId: string): void {
    this.uploadService.resumeUpload(sessionId);
  }

  cancelUpload(sessionId: string): void {
    this.uploadService.cancelUpload(sessionId);
  }

  getUploadProgress(sessionId: string): UploadProgress | null {
    return this.uploadService.getUploadProgress(sessionId);
  }

  onProgressUpdate(sessionId: string, callback: (progress: UploadProgress) => void): void {
    this.uploadService.onProgressUpdate(sessionId, callback);
  }
}

/**
 * Legacy PropertyImageValidationService API
 * Wraps the new validation service for backward compatibility
 */
export class LegacyPropertyImageValidationService {
  private orchestrator = getImageServiceOrchestrator();
  private validationService = this.orchestrator.getValidationService();

  async validateFile(
    file: File,
    options?: ValidationOptions,
    documentType?: DocumentType
  ): Promise<ValidationResult> {
    return this.validationService.validateFile(file, options, documentType);
  }

  async validateUrl(url: string, options?: ValidationOptions): Promise<ValidationResult> {
    return this.validationService.validateUrl(url, options);
  }

  async validateBatch(
    files: File[],
    options?: ValidationOptions,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ [fileName: string]: ValidationResult }> {
    return this.validationService.validateBatch(files, options, onProgress);
  }

  getValidationProfile(documentType: DocumentType): ValidationOptions {
    return this.validationService.getValidationProfile(documentType);
  }
}

/**
 * Legacy PropertyImageWorkflowManager API
 * Wraps the new workflow service for backward compatibility
 */
export class LegacyPropertyImageWorkflowManager {
  private orchestrator = getImageServiceOrchestrator();
  private workflowService = this.orchestrator.getWorkflowService();

  async startProcessingWorkflow(
    imageId: string,
    fileReference: string,
    documentType?: DocumentType,
    landVerificationId?: string
  ): Promise<void> {
    return this.workflowService.startProcessingWorkflow(
      imageId,
      fileReference,
      documentType,
      landVerificationId
    );
  }

  async processImage(imageId: string, step: ProcessingStep): Promise<void> {
    return this.workflowService.processImage(imageId, step);
  }

  getWorkflowStatus(imageId: string): WorkflowStatus | null {
    return this.workflowService.getWorkflowStatus(imageId);
  }

  pauseWorkflow(imageId: string): void {
    this.workflowService.pauseWorkflow(imageId);
  }

  resumeWorkflow(imageId: string): void {
    this.workflowService.resumeWorkflow(imageId);
  }

  cancelWorkflow(imageId: string): void {
    this.workflowService.cancelWorkflow(imageId);
  }

  async retryFailedStep(imageId: string, step: ProcessingStep): Promise<void> {
    return this.workflowService.retryFailedStep(imageId, step);
  }

  onStatusUpdate(imageId: string, callback: (status: WorkflowStatus) => void): void {
    // This would need to be implemented in the new workflow service
    // For now, provide a no-op implementation
    console.warn('onStatusUpdate not yet implemented in new architecture');
  }
}

/**
 * Legacy ImageMetadataService API
 * Wraps the new metadata service for backward compatibility
 */
export class LegacyImageMetadataService {
  private orchestrator = getImageServiceOrchestrator();
  private metadataService = this.orchestrator.getMetadataService();

  async extractMetadata(fileReference: string): Promise<PropertyImageMetadata> {
    return this.metadataService.extractMetadata(fileReference);
  }

  async performVirusScan(fileReference: string): Promise<ScanResult> {
    return this.metadataService.performVirusScan(fileReference);
  }

  async checkCompliance(
    fileReference: string,
    metadata: PropertyImageMetadata
  ): Promise<ComplianceResult> {
    return this.metadataService.checkCompliance(fileReference, metadata);
  }

  async extractAITags(fileReference: string): Promise<AITag[]> {
    return this.metadataService.extractAITags(fileReference);
  }
}

/**
 * Legacy UnifiedImageServiceFactory API
 * Provides the old factory interface using the new orchestrator
 */
export class LegacyUnifiedImageServiceFactory {
  static createServiceSuite() {
    const orchestrator = getImageServiceOrchestrator();
    
    return {
      uploadCoordinator: new LegacyPropertyImageUploadCoordinator(),
      validationService: new LegacyPropertyImageValidationService(),
      workflowManager: new LegacyPropertyImageWorkflowManager(),
      metadataService: new LegacyImageMetadataService(),
    };
  }

  static createUploadCoordinator() {
    return new LegacyPropertyImageUploadCoordinator();
  }

  static createValidationService() {
    return new LegacyPropertyImageValidationService();
  }

  static createWorkflowManager() {
    return new LegacyPropertyImageWorkflowManager();
  }

  static createMetadataService() {
    return new LegacyImageMetadataService();
  }

  static createMockServiceSuite() {
    // Return the same as regular services since orchestrator handles mocking
    return this.createServiceSuite();
  }
}

// Export legacy service instances for drop-in replacement
export const legacyPropertyImageUploadCoordinator = new LegacyPropertyImageUploadCoordinator();
export const legacyPropertyImageValidationService = new LegacyPropertyImageValidationService();
export const legacyPropertyImageWorkflowManager = new LegacyPropertyImageWorkflowManager();
export const legacyImageMetadataService = new LegacyImageMetadataService();

export default {
  LegacyPropertyImageUploadCoordinator,
  LegacyPropertyImageValidationService,
  LegacyPropertyImageWorkflowManager,
  LegacyImageMetadataService,
  LegacyUnifiedImageServiceFactory,
};