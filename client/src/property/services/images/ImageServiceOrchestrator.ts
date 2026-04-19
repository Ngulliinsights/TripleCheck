/**
 * Image Service Orchestrator
 *
 * Single entry point that coordinates existing focused services, eliminates
 * workflow duplication, and maintains backward compatibility.
 *
 * Design: composition over inheritance, thin coordination layer.
 */

import { PropertyImageUploadService } from './PropertyImageUploadService'
import { PropertyImageValidationService } from './PropertyImageValidationService'
import { PropertyImageWorkflowManager } from './PropertyImageWorkflowManager'
import { ImageMetadataService } from '../../../local/services/images/ImageMetadataService'
import type {
  PropertyImage,
  DocumentType,
  ValidationResult,
  UploadSession,
  UploadProgress,
  WorkflowStatus,
  PropertyImageMetadata,
  ImageServiceConfig,
} from '../../../local/types/images'

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/** Discriminated union – avoids `null as any` on failed validations. */
export type ValidateAndUploadResult =
  | { ok: true; validation: ValidationResult; upload: UploadSession }
  | { ok: false; validation: ValidationResult }

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface ImageServiceOrchestrator {
  /** Full end-to-end processing pipeline: validate → upload → workflow. */
  processPropertyImage(
    file: File,
    documentType?: DocumentType,
    landVerificationId?: string,
  ): Promise<PropertyImage>

  /** Validate a file and, if valid, initiate an upload session. */
  validateAndUpload(
    file: File,
    documentType?: DocumentType,
  ): Promise<ValidateAndUploadResult>

  /** Process multiple files with bounded concurrency and per-item progress. */
  processBatch(
    files: File[],
    documentType?: DocumentType,
    onProgress?: (completed: number, total: number) => void,
    concurrency?: number,
  ): Promise<PropertyImage[]>

  // Direct service access for callers that need granular control.
  getUploadService(): PropertyImageUploadService
  getValidationService(): PropertyImageValidationService
  getWorkflowService(): PropertyImageWorkflowManager
  getMetadataService(): ImageMetadataService

  // Progress / status helpers.
  getUploadProgress(sessionId: string): UploadProgress | null
  getWorkflowStatus(imageId: string): WorkflowStatus | null
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class DefaultImageServiceOrchestrator implements ImageServiceOrchestrator {
  private readonly uploadService: PropertyImageUploadService
  private readonly validationService: PropertyImageValidationService
  private readonly workflowService: PropertyImageWorkflowManager
  private readonly metadataService: ImageMetadataService

  constructor(config?: ImageServiceConfig) {
    this.uploadService = new PropertyImageUploadService({}, config)
    this.validationService = new PropertyImageValidationService({}, config)
    this.metadataService = new ImageMetadataService(undefined, undefined, undefined, config)

    this.workflowService = new PropertyImageWorkflowManager(
      {
        validationService: {
          validateUrl: (url, options) =>
            this.validationService.validateUrl(url, options as Parameters<PropertyImageValidationService['validateUrl']>[1]),
        },
        metadataService: {
          extractMetadata: (ref: string) => this.metadataService.extractMetadata(ref),
          performVirusScan: (ref: string) => this.metadataService.performVirusScan(ref),
          checkCompliance: (ref: string, metadata: PropertyImageMetadata) =>
            this.metadataService.checkCompliance(ref, metadata),
        },
      },
      config,
    )
  }

  // -------------------------------------------------------------------------
  // High-level workflows
  // -------------------------------------------------------------------------

  async processPropertyImage(
    file: File,
    documentType?: DocumentType,
    landVerificationId?: string,
  ): Promise<PropertyImage> {
    // 1 – Validate
    const validation = await this.validationService.validateFile(file, undefined, documentType)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // 2 – Initiate upload session
    const uploadSession = await this.uploadService.initiateUpload(
      file,
      documentType,
      landVerificationId,
    )

    // 3 – Upload all chunks (sequential within a session; parallelism lives
    //     at the batch level via processBatch).
    for (const chunk of uploadSession.chunks) {
      await this.uploadService.uploadChunk(uploadSession.id, chunk)
    }

    // 4 – Kick off async processing workflow
    await this.workflowService.startProcessingWorkflow(
      uploadSession.imageId,
      `uploaded/${uploadSession.imageId}`,
      documentType,
      landVerificationId,
    )

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
    } as PropertyImage
  }

  async validateAndUpload(
    file: File,
    documentType?: DocumentType,
  ): Promise<ValidateAndUploadResult> {
    const validation = await this.validationService.validateFile(file, undefined, documentType)

    if (!validation.isValid) {
      return { ok: false, validation }
    }

    const upload = await this.uploadService.initiateUpload(file, documentType)
    return { ok: true, validation, upload }
  }

  async processBatch(
    files: File[],
    documentType?: DocumentType,
    onProgress?: (completed: number, total: number) => void,
    concurrency = 3,
  ): Promise<PropertyImage[]> {
    const results: PropertyImage[] = new Array(files.length)
    let completed = 0

    // Process with a sliding concurrency window.
    const queue = files.map((file, index) => ({ file, index }))
    const activeSlots: Promise<void>[] = []

    const processNext = async (entry: { file: File; index: number }): Promise<void> => {
      try {
        results[entry.index] = await this.processPropertyImage(entry.file, documentType)
      } catch (error) {
        results[entry.index] = {
          id: `error_${Date.now()}_${entry.index}`,
          file: entry.file,
          status: 'error',
          approvalStatus: 'pending',
          validationResult: {
            isValid: false,
            errors: [error instanceof Error ? error.message : 'Processing failed'],
            warnings: [],
          },
        } as PropertyImage
      }

      completed++
      onProgress?.(completed, files.length)
    }

    // Chunk the queue into windows of `concurrency` and process in parallel.
    for (let i = 0; i < queue.length; i += concurrency) {
      const window = queue.slice(i, i + concurrency)
      await Promise.all(window.map(entry => processNext(entry)))
    }

    void activeSlots // satisfies linter; window-based approach above replaces slot tracking

    return results
  }

  // -------------------------------------------------------------------------
  // Direct service access
  // -------------------------------------------------------------------------

  getUploadService(): PropertyImageUploadService {
    return this.uploadService
  }

  getValidationService(): PropertyImageValidationService {
    return this.validationService
  }

  getWorkflowService(): PropertyImageWorkflowManager {
    return this.workflowService
  }

  getMetadataService(): ImageMetadataService {
    return this.metadataService
  }

  // -------------------------------------------------------------------------
  // Progress / status helpers
  // -------------------------------------------------------------------------

  getUploadProgress(sessionId: string): UploadProgress | null {
    return this.uploadService.getUploadProgress(sessionId)
  }

  getWorkflowStatus(imageId: string): WorkflowStatus | null {
    return this.workflowService.getWorkflowStatus(imageId)
  }
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

/** Global singleton – reuses the same instance across the application. */
let orchestratorInstance: DefaultImageServiceOrchestrator | null = null

export function getImageServiceOrchestrator(
  config?: ImageServiceConfig,
): DefaultImageServiceOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new DefaultImageServiceOrchestrator(config)
  }
  return orchestratorInstance
}

/**
 * Resets the singleton – useful in tests or when a config change requires a
 * fresh instance.
 */
export function resetImageServiceOrchestrator(): void {
  orchestratorInstance = null
}

/** Always returns a fresh instance – preferred for testing. */
export function createImageServiceOrchestrator(
  config?: ImageServiceConfig,
): DefaultImageServiceOrchestrator {
  return new DefaultImageServiceOrchestrator(config)
}

export default DefaultImageServiceOrchestrator