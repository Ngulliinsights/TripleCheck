/**
 * Property Image Workflow Manager
 * Context-sensitive workflow orchestration for property verification domain
 * Integrates with existing API services and follows project patterns
 */

import { ImageServiceCore, ImageServiceRegistry } from './core/ImageServiceCore'
import type {
  ProcessingStep,
  WorkflowStatus,
  PropertyImage,
  PropertyImageMetadata,
  DocumentType,
  ImageServiceConfig,
  ValidationResult,
  ScanResult,
  DocumentAuthResult,
  ComplianceResult,
} from '../../types/images'
import { ImageProcessingError, PROCESSING_STEPS_ORDER } from '../../types/images'
import { ImageUtils } from '../../utils/images/unified-utils'

const UNKNOWN_ERROR = 'Unknown error';

export interface IPropertyImageWorkflowManager {
  startProcessingWorkflow(imageId: string, fileReference: string, documentType?: DocumentType, landVerificationId?: string): Promise<void>;
  processImage(imageId: string, step: ProcessingStep): Promise<void>;
  getWorkflowStatus(imageId: string): WorkflowStatus | null;
  pauseWorkflow(imageId: string): void;
  resumeWorkflow(imageId: string): void;
  cancelWorkflow(imageId: string): void;
  retryFailedStep(imageId: string, step: ProcessingStep): Promise<void>;
}

export interface PropertyWorkflowDependencies {
  validationService: {
    validateUrl: (url: string, options?: Record<string, unknown>) => Promise<ValidationResult>;
  };
  metadataService: {
    extractMetadata: (fileReference: string) => Promise<PropertyImageMetadata>;
    performVirusScan: (fileReference: string) => Promise<ScanResult>;
    checkCompliance: (fileReference: string, metadata: PropertyImageMetadata) => Promise<ComplianceResult>;
  };
  documentAuthService?: {
    authenticateDocument: (fileReference: string, documentType: DocumentType) => Promise<DocumentAuthResult>;
  };
  fraudDetectionService?: {
    analyzeImage: (fileReference: string, metadata: PropertyImageMetadata) => Promise<number>;
  };
  landVerificationService?: {
    linkImageToVerification: (imageId: string, landVerificationId: string, metadata: PropertyImageMetadata) => Promise<void>;
  };
  storageService?: {
    getFileReference: (imageId: string) => Promise<string>;
    updateImageMetadata: (imageId: string, metadata: Partial<PropertyImage>) => Promise<void>;
    optimizeImage: (fileReference: string, quality: number) => Promise<string>;
    generateThumbnails: (fileReference: string, sizes: number[]) => Promise<string[]>;
  };
  notificationService?: {
    notifyWorkflowComplete: (imageId: string, status: 'success' | 'failed', metadata?: Record<string, unknown>) => Promise<void>;
    notifyStepComplete: (imageId: string, step: ProcessingStep, success: boolean, metadata?: Record<string, unknown>) => Promise<void>;
  };
  auditService?: {
    logWorkflowEvent: (event: string, metadata: Record<string, unknown>) => Promise<void>;
  };
}

export class PropertyImageWorkflowManager extends ImageServiceCore implements IPropertyImageWorkflowManager {
  readonly serviceName = 'PropertyImageWorkflowManager';
  readonly version = '2.0.0';
  
  private activeWorkflows = new Map<string, WorkflowStatus>();
  private workflowCallbacks = new Map<string, (status: WorkflowStatus) => void>();

  constructor(
    private dependencies: PropertyWorkflowDependencies,
    config?: ImageServiceConfig
  ) {
    super(config, ImageServiceRegistry.getInstance().getAuditService());
  }

  async startProcessingWorkflow(
    imageId: string,
    fileReference: string,
    documentType?: DocumentType,
    landVerificationId?: string
  ): Promise<void> {
    const workflowId = ImageUtils.generateUniqueId();

    const workflow: WorkflowStatus = {
      imageId,
      currentStep: 'validation',
      completedSteps: [],
      failedSteps: [],
      status: 'running',
      startTime: new Date(),
    };

    this.activeWorkflows.set(imageId, workflow);
    this.notifyStatusUpdate(imageId);

    // Log workflow start
    await this.dependencies.auditService?.logWorkflowEvent('workflow_started', {
      imageId,
      workflowId,
      documentType,
      landVerificationId,
      fileReference,
    });

    try {
      // Determine processing steps based on document type and configuration
      const processingSteps = this.determineProcessingSteps(documentType);

      // Process steps in order
      for (const step of processingSteps) {
        await this.processImage(imageId, step);

        // Check if workflow was cancelled or paused
        const currentWorkflow = this.activeWorkflows.get(imageId);
        if (!currentWorkflow || currentWorkflow.status === 'paused') {
          return;
        }
      }

      // Link to land verification if provided
      if (landVerificationId && this.dependencies.landVerificationService) {
        try {
          const metadata = await this.getCurrentImageMetadata(imageId);
          if (metadata.metadata) {
            await this.dependencies.landVerificationService.linkImageToVerification(
              imageId,
              landVerificationId,
              metadata.metadata
            );
          }
        } catch (error) {
          // Log warning without console
          await this.dependencies.auditService?.logWorkflowEvent('land_verification_link_failed', {
            imageId,
            landVerificationId,
            error: error instanceof Error ? error.message : UNKNOWN_ERROR,
          });
        }
      }

      // Mark workflow as completed
      this.completeWorkflow(imageId, 'completed');

    } catch (error) {
      this.completeWorkflow(imageId, 'failed', error instanceof Error ? error.message : UNKNOWN_ERROR);
    }
  }

  async processImage(imageId: string, step: ProcessingStep): Promise<void> {
    const workflow = this.activeWorkflows.get(imageId);
    if (!workflow) {
      throw new ImageProcessingError(
        `Workflow for image ${imageId} not found`,
        'WORKFLOW_NOT_FOUND',
        imageId
      );
    }

    if (workflow.status === 'paused') {
      return; // Skip processing if paused
    }

    workflow.currentStep = step;
    this.notifyStatusUpdate(imageId);

    // Log step start
    await this.dependencies.auditService?.logWorkflowEvent('step_started', {
      imageId,
      step,
    });

    try {
      await this.executeProcessingStep(imageId, step);

      // Mark step as completed
      workflow.completedSteps.push(step);

      // Remove from failed steps if it was previously failed
      const failedIndex = workflow.failedSteps.indexOf(step);
      if (failedIndex > -1) {
        workflow.failedSteps.splice(failedIndex, 1);
      }

      // Update progress
      workflow.progress = (workflow.completedSteps.length / PROCESSING_STEPS_ORDER.length) * 100;

      // Notify step completion
      await this.dependencies.notificationService?.notifyStepComplete(imageId, step, true, {
        progress: workflow.progress,
      });

      // Log step completion
      await this.dependencies.auditService?.logWorkflowEvent('step_completed', {
        imageId,
        step,
        progress: workflow.progress,
      });

    } catch (error) {
      // Mark step as failed
      if (!workflow.failedSteps.includes(step)) {
        workflow.failedSteps.push(step);
      }

      await this.dependencies.notificationService?.notifyStepComplete(imageId, step, false, {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });

      // Log step failure
      await this.dependencies.auditService?.logWorkflowEvent('step_failed', {
        imageId,
        step,
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });

      throw new ImageProcessingError(
        `Failed to process step ${step} for image ${imageId}: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
        'PROCESSING_STEP_FAILED',
        imageId,
        step
      );
    }

    this.notifyStatusUpdate(imageId);
  }

  getWorkflowStatus(imageId: string): WorkflowStatus | null {
    return this.activeWorkflows.get(imageId) || null;
  }

  pauseWorkflow(imageId: string): void {
    const workflow = this.activeWorkflows.get(imageId);
    if (workflow) {
      workflow.status = 'paused';
      this.notifyStatusUpdate(imageId);

      // Log pause
      this.dependencies.auditService?.logWorkflowEvent('workflow_paused', {
        imageId,
        currentStep: workflow.currentStep,
        progress: workflow.progress,
      });
    }
  }

  resumeWorkflow(imageId: string): void {
    const workflow = this.activeWorkflows.get(imageId);
    if (workflow && workflow.status === 'paused') {
      workflow.status = 'running';
      this.notifyStatusUpdate(imageId);

      // Log resume
      this.dependencies.auditService?.logWorkflowEvent('workflow_resumed', {
        imageId,
        currentStep: workflow.currentStep,
        progress: workflow.progress,
      });

      // Continue processing from current step
      this.continueWorkflow(imageId);
    }
  }

  cancelWorkflow(imageId: string): void {
    const workflow = this.activeWorkflows.get(imageId);
    if (workflow) {
      // Log cancellation
      this.dependencies.auditService?.logWorkflowEvent('workflow_cancelled', {
        imageId,
        currentStep: workflow.currentStep,
        progress: workflow.progress,
      });
    }

    this.activeWorkflows.delete(imageId);
    this.workflowCallbacks.delete(imageId);
  }

  async retryFailedStep(imageId: string, step: ProcessingStep): Promise<void> {
    const workflow = this.activeWorkflows.get(imageId);
    if (!workflow) {
      throw new ImageProcessingError(
        `Workflow for image ${imageId} not found`,
        'WORKFLOW_NOT_FOUND',
        imageId
      );
    }

    // Remove from failed steps
    const failedIndex = workflow.failedSteps.indexOf(step);
    if (failedIndex > -1) {
      workflow.failedSteps.splice(failedIndex, 1);
    }

    // Log retry
    await this.dependencies.auditService?.logWorkflowEvent('step_retry', {
      imageId,
      step,
    });

    // Process the step again
    await this.processImage(imageId, step);
  }

  // Subscribe to workflow status updates
  onStatusUpdate(imageId: string, callback: (status: WorkflowStatus) => void): void {
    this.workflowCallbacks.set(imageId, callback);
  }

  private determineProcessingSteps(documentType?: DocumentType): ProcessingStep[] {
    let steps = [...PROCESSING_STEPS_ORDER];

    // Skip document authentication for property photos
    if (documentType === 'property_photo' || !this.config.validation.documentAuthEnabled) {
      steps = steps.filter(step => step !== 'document_auth');
    }

    // Skip fraud detection if disabled
    if (!this.config.validation.fraudDetectionEnabled) {
      steps = steps.filter(step => step !== 'fraud_detection');
    }

    // Skip virus scanning if disabled
    if (!this.config.processing.enableVirusScanning) {
      steps = steps.filter(step => step !== 'virus_scan');
    }

    // Skip compliance check if disabled
    if (!this.config.processing.enableComplianceCheck) {
      steps = steps.filter(step => step !== 'compliance_check');
    }

    return steps;
  }

  private async executeProcessingStep(imageId: string, step: ProcessingStep): Promise<void> {
    const fileReference = await this.getFileReference(imageId);

    switch (step) {
      case 'validation':
        await this.executeValidation(imageId, fileReference);
        break;
      case 'virus_scan':
        await this.executeVirusScan(imageId, fileReference);
        break;
      case 'document_auth':
        await this.executeDocumentAuth(imageId, fileReference);
        break;
      case 'fraud_detection':
        await this.executeFraudDetection(imageId, fileReference);
        break;
      case 'metadata_extraction':
        await this.executeMetadataExtraction(imageId, fileReference);
        break;
      case 'compliance_check':
        await this.executeComplianceCheck(imageId, fileReference);
        break;
      case 'image_optimization':
        await this.executeImageOptimization(imageId, fileReference);
        break;
      case 'thumbnail_generation':
        await this.executeThumbnailGeneration(imageId, fileReference);
        break;
      default:
        throw new ImageProcessingError(
          `Unknown processing step: ${step}`,
          'UNKNOWN_STEP',
          imageId,
          step
        );
    }
  }

  private async executeValidation(imageId: string, fileReference: string): Promise<void> {
    const validationResult = await this.dependencies.validationService.validateUrl(fileReference);

    await this.updateImageMetadata(imageId, {
      validationResult,
      status: validationResult.isValid ? 'processing' : 'error',
    });

    if (!validationResult.isValid) {
      throw new ImageProcessingError(
        `Image validation failed: ${validationResult.errors.join(', ')}`,
        'VALIDATION_FAILED',
        imageId
      );
    }
  }

  private async executeVirusScan(imageId: string, fileReference: string): Promise<void> {
    const scanResult = await this.dependencies.metadataService.performVirusScan(fileReference);

    await this.updateImageMetadata(imageId, {
      virusScanResult: scanResult,
      status: scanResult.clean ? 'processing' : 'error',
    });

    if (!scanResult.clean) {
      throw new ImageProcessingError(
        `Virus scan failed: threats detected - ${scanResult.threats.join(', ')}`,
        'VIRUS_DETECTED',
        imageId
      );
    }
  }

  private async executeDocumentAuth(imageId: string, fileReference: string): Promise<void> {
    if (!this.dependencies.documentAuthService) {
      return; // Skip if service not available
    }

    const currentImage = await this.getCurrentImageMetadata(imageId);
    const documentType = currentImage.documentType || 'other_document';

    const authResult = await this.dependencies.documentAuthService.authenticateDocument(
      fileReference,
      documentType
    );

    await this.updateImageMetadata(imageId, {
      documentAuthResult: authResult,
      status: 'processing',
    });

    if (!authResult.isAuthentic) {
      throw new ImageProcessingError(
        `Document authentication failed: ${authResult.anomalies.join(', ')}`,
        'DOCUMENT_AUTH_FAILED',
        imageId
      );
    }
  }

  private async executeFraudDetection(imageId: string, fileReference: string): Promise<void> {
    if (!this.dependencies.fraudDetectionService) {
      return; // Skip if service not available
    }

    const currentImage = await this.getCurrentImageMetadata(imageId);
    if (!currentImage.metadata) {
      throw new ImageProcessingError(
        'Image metadata not available for fraud detection',
        'METADATA_MISSING',
        imageId
      );
    }

    const fraudScore = await this.dependencies.fraudDetectionService.analyzeImage(
      fileReference,
      currentImage.metadata
    );

    await this.updateImageMetadata(imageId, {
      fraudDetectionScore: fraudScore,
      status: 'processing',
    });

    if (fraudScore > 0.8) {
      throw new ImageProcessingError(
        `High fraud risk detected (score: ${Math.round(fraudScore * 100)}%)`,
        'HIGH_FRAUD_RISK',
        imageId
      );
    }
  }

  private async executeMetadataExtraction(imageId: string, fileReference: string): Promise<void> {
    const metadata = await this.dependencies.metadataService.extractMetadata(fileReference);

    await this.updateImageMetadata(imageId, {
      metadata,
      status: 'processing',
    });
  }

  private async executeComplianceCheck(imageId: string, fileReference: string): Promise<void> {
    const currentImage = await this.getCurrentImageMetadata(imageId);

    if (!currentImage.metadata) {
      throw new ImageProcessingError(
        'Image metadata not available for compliance check',
        'METADATA_MISSING',
        imageId
      );
    }

    const complianceResult = await this.dependencies.metadataService.checkCompliance(
      fileReference,
      currentImage.metadata
    );

    await this.updateImageMetadata(imageId, {
      complianceFlags: complianceResult.complianceFlags,
      regulatoryFlags: complianceResult.regulatoryFlags,
      status: 'processing',
    });
  }

  private async executeImageOptimization(imageId: string, fileReference: string): Promise<void> {
    if (this.dependencies.storageService) {
      const optimizedReference = await this.dependencies.storageService.optimizeImage(
        fileReference,
        this.config.processing.optimizationQuality
      );

      await this.updateImageMetadata(imageId, {
        optimizedReference,
        status: 'processing',
      });
    }
  }

  private async executeThumbnailGeneration(imageId: string, fileReference: string): Promise<void> {
    if (this.dependencies.storageService) {
      const thumbnailReferences = await this.dependencies.storageService.generateThumbnails(
        fileReference,
        this.config.processing.thumbnailSizes
      );

      await this.updateImageMetadata(imageId, {
        thumbnailReferences,
        status: 'uploaded', // Final status
      });
    } else {
      // Mark as completed even without thumbnails
      await this.updateImageMetadata(imageId, {
        status: 'uploaded',
      });
    }
  }

  private async continueWorkflow(imageId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(imageId);
    if (!workflow) return;

    try {
      // Find the next step to process
      const currentImage = await this.getCurrentImageMetadata(imageId);
      const processingSteps = this.determineProcessingSteps(currentImage.documentType);
      const remainingSteps = processingSteps.filter(
        step => !workflow.completedSteps.includes(step)
      );

      for (const step of remainingSteps) {
        if (workflow.status === 'paused') break;
        await this.processImage(imageId, step);
      }

      if (workflow.status === 'running') {
        this.completeWorkflow(imageId, 'completed');
      }
    } catch (error) {
      this.completeWorkflow(imageId, 'failed', error instanceof Error ? error.message : UNKNOWN_ERROR);
    }
  }

  private completeWorkflow(imageId: string, status: 'completed' | 'failed', error?: string): void {
    const workflow = this.activeWorkflows.get(imageId);
    if (workflow) {
      workflow.status = status;
      workflow.endTime = new Date();
      if (error) {
        workflow.error = error;
      }

      this.notifyStatusUpdate(imageId);

      // Notify completion
      this.dependencies.notificationService?.notifyWorkflowComplete(
        imageId,
        status === 'completed' ? 'success' : 'failed',
        {
          totalSteps: workflow.completedSteps.length + workflow.failedSteps.length,
          completedSteps: workflow.completedSteps.length,
          failedSteps: workflow.failedSteps.length,
          duration: workflow.endTime.getTime() - workflow.startTime.getTime(),
        }
      );

      // Log completion
      this.dependencies.auditService?.logWorkflowEvent('workflow_completed', {
        imageId,
        status,
        error,
        totalSteps: workflow.completedSteps.length + workflow.failedSteps.length,
        completedSteps: workflow.completedSteps.length,
        failedSteps: workflow.failedSteps.length,
        duration: workflow.endTime.getTime() - workflow.startTime.getTime(),
      });

      // Clean up after a delay
      setTimeout(() => {
        this.activeWorkflows.delete(imageId);
        this.workflowCallbacks.delete(imageId);
      }, 60000); // Keep for 1 minute for status queries
    }
  }

  private notifyStatusUpdate(imageId: string): void {
    const callback = this.workflowCallbacks.get(imageId);
    const status = this.activeWorkflows.get(imageId);

    if (callback && status) {
      callback(status);
    }
  }

  private async getFileReference(imageId: string): Promise<string> {
    if (this.dependencies.storageService) {
      return await this.dependencies.storageService.getFileReference(imageId);
    }

    // Fallback for testing/development
    return `mock://storage/${imageId}`;
  }

  private async updateImageMetadata(imageId: string, metadata: Partial<PropertyImage>): Promise<void> {
    if (this.dependencies.storageService) {
      await this.dependencies.storageService.updateImageMetadata(imageId, metadata);
    }
    // In development/testing, this would be a no-op
  }

  private async getCurrentImageMetadata(imageId: string): Promise<PropertyImage> {
    // In a real implementation, this would fetch current metadata from storage
    // For now, return a mock object with required fields
    return {
      id: imageId,
      file: new File([], 'mock-file.jpg', { type: 'image/jpeg' }),
      status: 'processing',
      approvalStatus: 'pending',
      metadata: {
        fileSize: 1024 * 1024, // 1MB
        technicalMetadata: {
          format: 'jpeg',
          colorSpace: 'sRGB',
          bitDepth: 24,
          compression: 'JPEG',
          orientation: 1,
        },
        createdAt: Date.now(),
        lastModified: Date.now(),
      },
    } as PropertyImage;
  }
}

// Register service in the registry
export const propertyImageWorkflowManager = ImageServiceRegistry.getInstance().register(
  new PropertyImageWorkflowManager({
    validationService: {
      validateUrl: async () => ({ isValid: true, errors: [], warnings: [] }),
    },
    metadataService: {
      extractMetadata: async () => ({
        fileSize: 1024,
        technicalMetadata: {
          format: 'jpeg',
          colorSpace: 'sRGB',
          bitDepth: 24,
          compression: 'JPEG',
          orientation: 1,
        },
        createdAt: Date.now(),
        lastModified: Date.now(),
      }),
      performVirusScan: async () => ({
        clean: true,
        threats: [],
        scanDate: new Date(),
        scanDuration: 100,
        engine: 'MockAV',
        signatureVersion: '1.0.0',
      }),
      checkCompliance: async () => ({
        complianceFlags: [],
        regulatoryFlags: [],
      }),
    },
  })
);

export default PropertyImageWorkflowManager;