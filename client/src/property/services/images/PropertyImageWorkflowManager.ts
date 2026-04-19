import { ImageServiceCore, ImageServiceRegistry } from '../../../local/services/images/core/ImageServiceCore'
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
} from '../../../local/types/images'
import { ImageProcessingError, PROCESSING_STEPS_ORDER } from '../../../local/types/images'
import { ImageUtils } from '../../../local/utils/images/unified-utils'

// =============================================================================
// Public interfaces
// =============================================================================

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

// =============================================================================
// Internal state type
// =============================================================================

/**
 * Runtime workflow state.  Extends the public `WorkflowStatus` snapshot with
 * fields that are only meaningful inside this module.
 */
interface ActiveWorkflow extends WorkflowStatus {
  workflowId: string
  fileReference: string
  documentType?: DocumentType
  landVerificationId?: string
  /** Cached metadata populated after `metadata_extraction` so later steps can reuse it. */
  cachedMetadata?: PropertyImageMetadata
}

// =============================================================================
// Service implementation
// =============================================================================

const UNKNOWN_ERROR = 'Unknown error'

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
    config?: Partial<ImageServiceConfig>,
  ) {
    // Note: ImageServiceCore in local branch expects a full config. 
    // We cast or merge here if needed, but since we are mirroring the orchestration 
    // pattern, we'll pass the config and let the base handle its own defaults 
    // if it were more flexible, but since it's not, we'll cast to satisfy the compiler.
    super(config as ImageServiceConfig, ImageServiceRegistry.getInstance().getAuditService())
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async startProcessingWorkflow(
    imageId: string,
    fileReference: string,
    documentType?: DocumentType,
    landVerificationId?: string,
  ): Promise<void> {
    const workflowId = ImageUtils.generateUniqueId()
    const steps = this.determineProcessingSteps(documentType)

    const workflow: ActiveWorkflow = {
      imageId,
      workflowId,
      fileReference,
      documentType,
      landVerificationId,
      currentStep: steps[0] || 'validation',
      completedSteps: [],
      failedSteps: [],
      status: 'running',
      progress: 0,
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

      workflow.completedSteps.push(step)
      const failedIdx = workflow.failedSteps.indexOf(step)
      if (failedIdx > -1) workflow.failedSteps.splice(failedIdx, 1)

      workflow.progress =
        Math.round((workflow.completedSteps.length / PROCESSING_STEPS_ORDER.length) * 100)

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
        `Failed step '${step}' for image ${imageId}: ${
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

    void this.continueWorkflow(imageId)
  }

  cancelWorkflow(imageId: string): void {
    const workflow = this.activeWorkflows.get(imageId)
    if (!workflow) return

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
    if (failedIdx > -1) workflow.failedSteps.splice(failedIdx, 1)

    await this.dependencies.auditService?.logWorkflowEvent('step_retry', { imageId, step })
    await this.processImage(imageId, step)
  }

  onStatusUpdate(imageId: string, callback: (status: WorkflowStatus) => void): void {
    this.workflowCallbacks.set(imageId, callback)
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

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
        return this.executeValidation(imageId, fileReference)
      case 'virus_scan':
        return this.executeVirusScan(imageId, fileReference)
      case 'document_auth':
        return this.executeDocumentAuth(imageId, fileReference)
      case 'fraud_detection':
        return this.executeFraudDetection(imageId, fileReference)
      case 'metadata_extraction':
        return this.executeMetadataExtraction(imageId, fileReference)
      case 'compliance_check':
        return this.executeComplianceCheck(imageId, fileReference)
      case 'image_optimization':
        return this.executeImageOptimization(imageId, fileReference)
      case 'thumbnail_generation':
        return this.executeThumbnailGeneration(imageId, fileReference)
      default: {
        // Exhaustiveness guard – `step` is `never` here if all cases are covered.
        const exhaustive: never = step
        throw new ImageProcessingError(
          `Unknown processing step: ${exhaustive}`,
          'UNKNOWN_STEP',
          imageId,
        )
      }
    }
  }

  private async executeValidation(imageId: string, fileReference: string): Promise<void> {
    const result = await this.dependencies.validationService.validateUrl(fileReference)

    await this.updateImageMetadata(imageId, {
      validationResult: result,
      status: result.isValid ? 'processing' : 'error',
    })

    if (!result.isValid) {
      throw new ImageProcessingError(
        `Validation failed: ${result.errors.join(', ')}`,
        'VALIDATION_FAILED',
        imageId,
        'validation',
      )
    }
  }

  private async executeVirusScan(imageId: string, fileReference: string): Promise<void> {
    const result = await this.dependencies.metadataService.performVirusScan(fileReference)

    await this.updateImageMetadata(imageId, {
      virusScanResult: result,
      status: result.clean ? 'processing' : 'error',
    })

    if (!result.clean) {
      throw new ImageProcessingError(
        `Virus scan failed – threats: ${result.threats.join(', ')}`,
        'VIRUS_DETECTED',
        imageId,
        'virus_scan',
      )
    }
  }

  private async executeDocumentAuth(imageId: string, fileReference: string): Promise<void> {
    if (!this.dependencies.documentAuthService) return

    const workflow = this.activeWorkflows.get(imageId)
    const documentType = workflow?.documentType ?? 'other_document'

    const result = await this.dependencies.documentAuthService.authenticateDocument(
      fileReference,
      documentType,
    )

    await this.updateImageMetadata(imageId, { documentAuthResult: result, status: 'processing' })

    if (!result.isAuthentic) {
      throw new ImageProcessingError(
        `Document authentication failed: ${result.anomalies.join(', ')}`,
        'DOCUMENT_AUTH_FAILED',
        imageId,
        'document_auth',
      )
    }
  }

  private async executeFraudDetection(imageId: string, fileReference: string): Promise<void> {
    if (!this.dependencies.fraudDetectionService) return

    const cachedMeta = this.activeWorkflows.get(imageId)?.cachedMetadata
    if (!cachedMeta) {
      throw new ImageProcessingError(
        'Metadata unavailable for fraud detection – run metadata_extraction first',
        'METADATA_MISSING',
        imageId,
        'fraud_detection',
      )
    }

    const score = await this.dependencies.fraudDetectionService.analyzeImage(
      fileReference,
      cachedMeta,
    )

    await this.updateImageMetadata(imageId, { fraudDetectionScore: score, status: 'processing' })

    if (score > 0.8) {
      throw new ImageProcessingError(
        `High fraud risk detected (score: ${Math.round(score * 100)}%)`,
        'HIGH_FRAUD_RISK',
        imageId,
        'fraud_detection',
      )
    }
  }

  private async executeMetadataExtraction(imageId: string, fileReference: string): Promise<void> {
    const metadata = await this.dependencies.metadataService.extractMetadata(fileReference)

    const workflow = this.activeWorkflows.get(imageId)
    if (workflow) workflow.cachedMetadata = metadata

    await this.updateImageMetadata(imageId, { metadata, status: 'processing' })
  }

  private async executeComplianceCheck(imageId: string, fileReference: string): Promise<void> {
    const cachedMeta = this.activeWorkflows.get(imageId)?.cachedMetadata
    if (!cachedMeta) {
      throw new ImageProcessingError(
        'Metadata unavailable for compliance check – run metadata_extraction first',
        'METADATA_MISSING',
        imageId,
        'compliance_check',
      )
    }

    const result = await this.dependencies.metadataService.checkCompliance(
      fileReference,
      cachedMeta,
    )

    await this.updateImageMetadata(imageId, {
      complianceFlags: result.complianceFlags,
      regulatoryFlags: result.regulatoryFlags,
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
      durationMs: workflow.endTime.getTime() - workflow.startTime.getTime(),
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

    // Retain state for 60 s so late-arriving status queries still resolve.
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

// =============================================================================
// Module-level singleton
//
// Stub dependencies make the registry entry safe to instantiate without any
// real services wired up (useful in tests and dev environments).
// =============================================================================

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