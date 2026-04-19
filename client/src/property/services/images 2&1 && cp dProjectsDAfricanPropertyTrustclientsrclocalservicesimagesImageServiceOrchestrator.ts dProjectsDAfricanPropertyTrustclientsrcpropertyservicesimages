/**
 * Property Image Workflow Manager
 *
 * Context-sensitive workflow orchestration for the property verification domain.
 * Integrates with existing API services and follows project patterns.
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

const UNKNOWN_ERROR = 'Unknown error'

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface IPropertyImageWorkflowManager {
  startProcessingWorkflow(
    imageId: string,
    fileReference: string,
    documentType?: DocumentType,
    landVerificationId?: string,
  ): Promise<void>
  processImage(imageId: string, step: ProcessingStep): Promise<void>
  getWorkflowStatus(imageId: string): WorkflowStatus | null
  pauseWorkflow(imageId: string): void
  resumeWorkflow(imageId: string): void
  cancelWorkflow(imageId: string): void
  retryFailedStep(imageId: string, step: ProcessingStep): Promise<void>
  onStatusUpdate(imageId: string, callback: (status: WorkflowStatus) => void): void
}

export interface PropertyWorkflowDependencies {
  validationService: {
    validateUrl(url: string, options?: Record<string, unknown>): Promise<ValidationResult>
  }
  metadataService: {
    extractMetadata(fileReference: string): Promise<PropertyImageMetadata>
    performVirusScan(fileReference: string): Promise<ScanResult>
    checkCompliance(
      fileReference: string,
      metadata: PropertyImageMetadata,
    ): Promise<ComplianceResult>
  }
  documentAuthService?: {
    authenticateDocument(
      fileReference: string,
      documentType: DocumentType,
    ): Promise<DocumentAuthResult>
  }
  fraudDetectionService?: {
    analyzeImage(fileReference: string, metadata: PropertyImageMetadata): Promise<number>
  }
  landVerificationService?: {
    linkImageToVerification(
      imageId: string,
      landVerificationId: string,
      metadata: PropertyImageMetadata,
    ): Promise<void>
  }
  storageService?: {
    getFileReference(imageId: string): Promise<string>
    updateImageMetadata(imageId: string, metadata: Partial<PropertyImage>): Promise<void>
    optimizeImage(fileReference: string, quality: number): Promise<string>
    generateThumbnails(fileReference: string, sizes: number[]): Promise<string[]>
  }
  notificationService?: {
    notifyWorkflowComplete(
      imageId: string,
      status: 'success' | 'failed',
      metadata?: Record<string, unknown>,
    ): Promise<void>
    notifyStepComplete(
      imageId: string,
      step: ProcessingStep,
      success: boolean,
      metadata?: Record<string, unknown>,
    ): Promise<void>
  }
  auditService?: {
    logWorkflowEvent(event: string, metadata: Record<string, unknown>): Promise<void>
  }
}

// ---------------------------------------------------------------------------
// Internal state type
// ---------------------------------------------------------------------------

/** Extends the public WorkflowStatus with runtime-only context. */
interface ActiveWorkflow extends WorkflowStatus {
  workflowId: string
  fileReference: string
  documentType?: DocumentType
  landVerificationId?: string
  /** Resolved image metadata cache – populated after metadata_extraction step. */
  cachedMetadata?: PropertyImageMetadata
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

export class PropertyImageWorkflowManager
  extends ImageServiceCore
  implements IPropertyImageWorkflowManager
{
  readonly serviceName = 'PropertyImageWorkflowManager'
  readonly version = '2.0.0'

  private readonly activeWorkflows = new Map<string, ActiveWorkflow>()
  private readonly workflowCallbacks = new Map<string, (status: WorkflowStatus) => void>()

  constructor(
    private readonly dependencies: PropertyWorkflowDependencies,
    config?: ImageServiceConfig,
  ) {
    super(config, ImageServiceRegistry.getInstance().getAuditService())
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  async startProcessingWorkflow(
    imageId: string,
    fileReference: string,
    documentType?: DocumentType,
    landVerificationId?: string,
  ): Promise<void> {
    const workflowId = ImageUtils.generateUniqueId()

    const workflow: ActiveWorkflow = {
      imageId,
      workflowId,
      fileReference,
      documentType,
      landVerificationId,
      currentStep: 'validation',
      completedSteps: [],
      failedSteps: [],
      status: 'running',
      startTime: new Date(),
    }

    this.activeWorkflows.set(imageId, workflow)
    this.notifyStatusUpdate(imageId)

    await this.dependencies.auditService?.logWorkflowEvent('workflow_started', {
      imageId,
      workflowId,
      documentType,
      landVerificationId,
      fileReference,
    })

    try {
      const steps = this.determineProcessingSteps(documentType)

      for (const step of steps) {
        if (!this.isRunning(imageId)) return
        await this.processImage(imageId, step)
      }

      // Link to land verification record if requested.
      if (landVerificationId && this.dependencies.landVerificationService) {
        const cachedMeta = this.activeWorkflows.get(imageId)?.cachedMetadata
        if (cachedMeta) {
          try {
            await this.dependencies.landVerificationService.linkImageToVerification(
              imageId,
              landVerificationId,
              cachedMeta,
            )
          } catch (err) {
            await this.dependencies.auditService?.logWorkflowEvent(
              'land_verification_link_failed',
              {
                imageId,
                landVerificationId,
                error: err instanceof Error ? err.message : UNKNOWN_ERROR,
              },
            )
          }
        }
      }

      this.completeWorkflow(imageId, 'completed')
    } catch (error) {
      this.completeWorkflow(
        imageId,
        'failed',
        error instanceof Error ? error.message : UNKNOWN_ERROR,
      )
    }
  }

  async processImage(imageId: string, step: ProcessingStep): Promise<void> {
    const workflow = this.activeWorkflows.get(imageId)
    if (!workflow) {
      throw new ImageProcessingError(
        `Workflow for image ${imageId} not found`,
        'WORKFLOW_NOT_FOUND',
        imageId,
      )
    }

    if (workflow.status === 'paused') return

    workflow.currentStep = step
    this.notifyStatusUpdate(imageId)

    await this.dependencies.auditService?.logWorkflowEvent('step_started', { imageId, step })

    try {
      await this.executeProcessingStep(imageId, step, workflow.fileReference)

      // Record completion and remove from any prior failed list.
      workflow.completedSteps.push(step)
      const failedIdx = workflow.failedSteps.indexOf(step)
      if (failedIdx > -1) workflow.failedSteps.splice(failedIdx, 1)

      workflow.progress =
        (workflow.completedSteps.length / PROCESSING_STEPS_ORDER.length) * 100

      await this.dependencies.notificationService?.notifyStepComplete(imageId, step, true, {
        progress: workflow.progress,
      })

      await this.dependencies.auditService?.logWorkflowEvent('step_completed', {
        imageId,
        step,
        progress: workflow.progress,
      })
    } catch (error) {
      if (!workflow.failedSteps.includes(step)) {
        workflow.failedSteps.push(step)
      }

      await this.dependencies.notificationService?.notifyStepComplete(imageId, step, false, {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      })

      await this.dependencies.auditService?.logWorkflowEvent('step_failed', {
        imageId,
        step,
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      })

      throw new ImageProcessingError(
        `Failed to process step '${step}' for image ${imageId}: ${
          error instanceof Error ? error.message : UNKNOWN_ERROR
        }`,
        'PROCESSING_STEP_FAILED',
        imageId,
        step,
      )
    }

    this.notifyStatusUpdate(imageId)
  }

  getWorkflowStatus(imageId: string): WorkflowStatus | null {
    return this.activeWorkflows.get(imageId) ?? null
  }

  pauseWorkflow(imageId: string): void {
    const workflow = this.activeWorkflows.get(imageId)
    if (!workflow) return

    workflow.status = 'paused'
    this.notifyStatusUpdate(imageId)

    void this.dependencies.auditService?.logWorkflowEvent('workflow_paused', {
      imageId,
      currentStep: workflow.currentStep,
      progress: workflow.progress,
    })
  }

  resumeWorkflow(imageId: string): void {
    const workflow = this.activeWorkflows.get(imageId)
    if (!workflow || workflow.status !== 'paused') return

    workflow.status = 'running'
    this.notifyStatusUpdate(imageId)

    void this.dependencies.auditService?.logWorkflowEvent('workflow_resumed', {
      imageId,
      currentStep: workflow.currentStep,
      progress: workflow.progress,
    })

    // Continue asynchronously; surface errors through completeWorkflow.
    void this.continueWorkflow(imageId)
  }

  cancelWorkflow(imageId: string): void {
    const workflow = this.activeWorkflows.get(imageId)
    if (!workflow) return

    // Emit the cancellation notification before removing state.
    void this.dependencies.auditService?.logWorkflowEvent('workflow_cancelled', {
      imageId,
      currentStep: workflow.currentStep,
      progress: workflow.progress,
    })

    void this.dependencies.notificationService?.notifyWorkflowComplete(imageId, 'failed', {
      reason: 'cancelled',
    })

    this.activeWorkflows.delete(imageId)
    this.workflowCallbacks.delete(imageId)
  }

  async retryFailedStep(imageId: string, step: ProcessingStep): Promise<void> {
    const workflow = this.activeWorkflows.get(imageId)
    if (!workflow) {
      throw new ImageProcessingError(
        `Workflow for image ${imageId} not found`,
        'WORKFLOW_NOT_FOUND',
        imageId,
      )
    }

    const failedIdx = workflow.failedSteps.indexOf(step)
    if (failedIdx > -1) {
      workflow.failedSteps.splice(failedIdx, 1)
    }

    await this.dependencies.auditService?.logWorkflowEvent('step_retry', { imageId, step })
    await this.processImage(imageId, step)
  }

  onStatusUpdate(imageId: string, callback: (status: WorkflowStatus) => void): void {
    this.workflowCallbacks.set(imageId, callback)
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private isRunning(imageId: string): boolean {
    const wf = this.activeWorkflows.get(imageId)
    return !!wf && wf.status === 'running'
  }

  private determineProcessingSteps(documentType?: DocumentType): ProcessingStep[] {
    let steps = [...PROCESSING_STEPS_ORDER]

    if (documentType === 'property_photo' || !this.config.validation.documentAuthEnabled) {
      steps = steps.filter(s => s !== 'document_auth')
    }
    if (!this.config.validation.fraudDetectionEnabled) {
      steps = steps.filter(s => s !== 'fraud_detection')
    }
    if (!this.config.processing.enableVirusScanning) {
      steps = steps.filter(s => s !== 'virus_scan')
    }
    if (!this.config.processing.enableComplianceCheck) {
      steps = steps.filter(s => s !== 'compliance_check')
    }

    return steps
  }

  private async executeProcessingStep(
    imageId: string,
    step: ProcessingStep,
    fileReference: string,
  ): Promise<void> {
    switch (step) {
      case 'validation':
        await this.executeValidation(imageId, fileReference)
        break
      case 'virus_scan':
        await this.executeVirusScan(imageId, fileReference)
        break
      case 'document_auth':
        await this.executeDocumentAuth(imageId, fileReference)
        break
      case 'fraud_detection':
        await this.executeFraudDetection(imageId, fileReference)
        break
      case 'metadata_extraction':
        await this.executeMetadataExtraction(imageId, fileReference)
        break
      case 'compliance_check':
        await this.executeComplianceCheck(imageId, fileReference)
        break
      case 'image_optimization':
        await this.executeImageOptimization(imageId, fileReference)
        break
      case 'thumbnail_generation':
        await this.executeThumbnailGeneration(imageId, fileReference)
        break
      default:
        throw new ImageProcessingError(
          `Unknown processing step: ${step}`,
          'UNKNOWN_STEP',
          imageId,
          step,
        )
    }
  }

  private async executeValidation(imageId: string, fileReference: string): Promise<void> {
    const validationResult = await this.dependencies.validationService.validateUrl(fileReference)

    await this.updateImageMetadata(imageId, {
      validationResult,
      status: validationResult.isValid ? 'processing' : 'error',
    })

    if (!validationResult.isValid) {
      throw new ImageProcessingError(
        `Image validation failed: ${validationResult.errors.join(', ')}`,
        'VALIDATION_FAILED',
        imageId,
      )
    }
  }

  private async executeVirusScan(imageId: string, fileReference: string): Promise<void> {
    const scanResult = await this.dependencies.metadataService.performVirusScan(fileReference)

    await this.updateImageMetadata(imageId, {
      virusScanResult: scanResult,
      status: scanResult.clean ? 'processing' : 'error',
    })

    if (!scanResult.clean) {
      throw new ImageProcessingError(
        `Virus scan failed – threats detected: ${scanResult.threats.join(', ')}`,
        'VIRUS_DETECTED',
        imageId,
      )
    }
  }

  private async executeDocumentAuth(imageId: string, fileReference: string): Promise<void> {
    if (!this.dependencies.documentAuthService) return

    const workflow = this.activeWorkflows.get(imageId)
    const documentType = workflow?.documentType ?? 'other_document'

    const authResult = await this.dependencies.documentAuthService.authenticateDocument(
      fileReference,
      documentType,
    )

    await this.updateImageMetadata(imageId, { documentAuthResult: authResult, status: 'processing' })

    if (!authResult.isAuthentic) {
      throw new ImageProcessingError(
        `Document authentication failed: ${authResult.anomalies.join(', ')}`,
        'DOCUMENT_AUTH_FAILED',
        imageId,
      )
    }
  }

  private async executeFraudDetection(imageId: string, fileReference: string): Promise<void> {
    if (!this.dependencies.fraudDetectionService) return

    const cachedMeta = this.activeWorkflows.get(imageId)?.cachedMetadata
    if (!cachedMeta) {
      throw new ImageProcessingError(
        'Image metadata not available for fraud detection – run metadata_extraction first',
        'METADATA_MISSING',
        imageId,
      )
    }

    const fraudScore = await this.dependencies.fraudDetectionService.analyzeImage(
      fileReference,
      cachedMeta,
    )

    await this.updateImageMetadata(imageId, { fraudDetectionScore: fraudScore, status: 'processing' })

    if (fraudScore > 0.8) {
      throw new ImageProcessingError(
        `High fraud risk detected (score: ${Math.round(fraudScore * 100)} %)`,
        'HIGH_FRAUD_RISK',
        imageId,
      )
    }
  }

  private async executeMetadataExtraction(imageId: string, fileReference: string): Promise<void> {
    const metadata = await this.dependencies.metadataService.extractMetadata(fileReference)

    // Cache so later steps (fraud detection, compliance) can reuse it.
    const workflow = this.activeWorkflows.get(imageId)
    if (workflow) {
      workflow.cachedMetadata = metadata
    }

    await this.updateImageMetadata(imageId, { metadata, status: 'processing' })
  }

  private async executeComplianceCheck(imageId: string, fileReference: string): Promise<void> {
    const cachedMeta = this.activeWorkflows.get(imageId)?.cachedMetadata
    if (!cachedMeta) {
      throw new ImageProcessingError(
        'Image metadata not available for compliance check – run metadata_extraction first',
        'METADATA_MISSING',
        imageId,
      )
    }

    const complianceResult = await this.dependencies.metadataService.checkCompliance(
      fileReference,
      cachedMeta,
    )

    await this.updateImageMetadata(imageId, {
      complianceFlags: complianceResult.complianceFlags,
      regulatoryFlags: complianceResult.regulatoryFlags,
      status: 'processing',
    })
  }

  private async executeImageOptimization(imageId: string, fileReference: string): Promise<void> {
    if (!this.dependencies.storageService) return

    const optimizedReference = await this.dependencies.storageService.optimizeImage(
      fileReference,
      this.config.processing.optimizationQuality,
    )

    await this.updateImageMetadata(imageId, { optimizedReference, status: 'processing' })
  }

  private async executeThumbnailGeneration(imageId: string, fileReference: string): Promise<void> {
    if (this.dependencies.storageService) {
      const thumbnailReferences = await this.dependencies.storageService.generateThumbnails(
        fileReference,
        this.config.processing.thumbnailSizes,
      )
      await this.updateImageMetadata(imageId, { thumbnailReferences, status: 'uploaded' })
    } else {
      await this.updateImageMetadata(imageId, { status: 'uploaded' })
    }
  }

  private async continueWorkflow(imageId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(imageId)
    if (!workflow) return

    try {
      const steps = this.determineProcessingSteps(workflow.documentType)
      const remaining = steps.filter(s => !workflow.completedSteps.includes(s))

      for (const step of remaining) {
        if (!this.isRunning(imageId)) return
        await this.processImage(imageId, step)
      }

      if (this.isRunning(imageId)) {
        this.completeWorkflow(imageId, 'completed')
      }
    } catch (error) {
      this.completeWorkflow(
        imageId,
        'failed',
        error instanceof Error ? error.message : UNKNOWN_ERROR,
      )
    }
  }

  private completeWorkflow(
    imageId: string,
    status: 'completed' | 'failed',
    error?: string,
  ): void {
    const workflow = this.activeWorkflows.get(imageId)
    if (!workflow) return

    workflow.status = status
    workflow.endTime = new Date()
    if (error) workflow.error = error

    this.notifyStatusUpdate(imageId)

    const summary = {
      totalSteps: workflow.completedSteps.length + workflow.failedSteps.length,
      completedSteps: workflow.completedSteps.length,
      failedSteps: workflow.failedSteps.length,
      duration: workflow.endTime.getTime() - workflow.startTime.getTime(),
    }

    void this.dependencies.notificationService?.notifyWorkflowComplete(
      imageId,
      status === 'completed' ? 'success' : 'failed',
      summary,
    )

    void this.dependencies.auditService?.logWorkflowEvent('workflow_completed', {
      imageId,
      status,
      error,
      ...summary,
    })

    // Retain status for one minute so late-arriving status queries still resolve.
    setTimeout(() => {
      this.activeWorkflows.delete(imageId)
      this.workflowCallbacks.delete(imageId)
    }, 60_000)
  }

  private notifyStatusUpdate(imageId: string): void {
    const callback = this.workflowCallbacks.get(imageId)
    const status = this.activeWorkflows.get(imageId)
    if (callback && status) callback(status)
  }

  private async getFileReference(imageId: string): Promise<string> {
    if (this.dependencies.storageService) {
      return this.dependencies.storageService.getFileReference(imageId)
    }
    // Development / test fallback.
    return `mock://storage/${imageId}`
  }

  private async updateImageMetadata(
    imageId: string,
    metadata: Partial<PropertyImage>,
  ): Promise<void> {
    if (this.dependencies.storageService) {
      await this.dependencies.storageService.updateImageMetadata(imageId, metadata)
    }
    // No-op when running without a real storage backend.
  }
}

// ---------------------------------------------------------------------------
// Module-level singleton
//
// Provide minimal stub dependencies so the registry entry is safe to
// instantiate without external services being wired up.
// ---------------------------------------------------------------------------

const STUB_DEPENDENCIES: PropertyWorkflowDependencies = {
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
}

export const propertyImageWorkflowManager = ImageServiceRegistry.getInstance().register(
  new PropertyImageWorkflowManager(STUB_DEPENDENCIES),
)

export default PropertyImageWorkflowManager