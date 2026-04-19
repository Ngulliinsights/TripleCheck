/**
 * Property Image Upload Service
 *
 * Focused service that handles only upload operations.
 * Uses the shared core to eliminate duplication while maintaining clear boundaries.
 */

import { ImageServiceCore, ImageServiceRegistry } from '../../../local/services/images/core/ImageServiceCore'
import type {
  UploadSession,
  UploadProgress,
  ImageChunk,
  DocumentType,
  ImageServiceConfig,
} from '../../../local/types/images'
import { ImageUtils } from '../../../local/utils/images/unified-utils'

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface IPropertyImageUploadService {
  initiateUpload(
    file: File,
    documentType?: DocumentType,
    landVerificationId?: string,
  ): Promise<UploadSession>
  uploadChunk(sessionId: string, chunk: ImageChunk): Promise<void>
  pauseUpload(sessionId: string): void
  resumeUpload(sessionId: string): void
  cancelUpload(sessionId: string): void
  getUploadProgress(sessionId: string): UploadProgress | null
  onProgressUpdate(sessionId: string, callback: (progress: UploadProgress) => void): void
}

export interface UploadDependencies {
  apiClient?: {
    uploadChunk(sessionId: string, chunk: ImageChunk, metadata?: unknown): Promise<void>
    createUploadSession(metadata: unknown): Promise<{ sessionId?: string }>
    completeUpload(sessionId: string): Promise<void>
  }
  storageService?: {
    uploadChunk(sessionId: string, chunk: ImageChunk): Promise<void>
    createSession(metadata: unknown): Promise<string>
  }
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

export class PropertyImageUploadService
  extends ImageServiceCore
  implements IPropertyImageUploadService
{
  readonly serviceName = 'PropertyImageUploadService'
  readonly version = '2.0.0'

  private readonly activeSessions = new Map<string, UploadSession>()
  private readonly progressCallbacks = new Map<string, (progress: UploadProgress) => void>()
  private readonly pausedSessions = new Set<string>()

  constructor(
    private readonly dependencies: UploadDependencies = {},
    config?: ImageServiceConfig,
  ) {
    super(config, ImageServiceRegistry.getInstance().getAuditService())
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  async initiateUpload(
    file: File,
    documentType?: DocumentType,
    landVerificationId?: string,
  ): Promise<UploadSession> {
    const sessionId = ImageUtils.generateUniqueId()

    try {
      const chunks = await this.createFileChunks(file, sessionId)

      const sessionMetadata = {
        sessionId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        chunkCount: chunks.length,
        timestamp: new Date().toISOString(),
        ...(documentType && { documentType }),
        ...(landVerificationId && { landVerificationId }),
      }

      // Optionally resolve a backend-assigned session ID.
      let finalSessionId = sessionId
      if (this.dependencies.apiClient) {
        const backendResponse =
          await this.dependencies.apiClient.createUploadSession(sessionMetadata)
        if (backendResponse.sessionId && backendResponse.sessionId !== sessionId) {
          finalSessionId = backendResponse.sessionId
          for (const chunk of chunks) {
            chunk.id = chunk.id.replace(sessionId, finalSessionId)
          }
        }
      }

      const session: UploadSession = {
        id: finalSessionId,
        imageId: ImageUtils.generateUniqueId(),
        chunks,
        status: 'pending',
        progress: 0,
        uploadSpeed: 0,
        startTime: Date.now(),
      }

      this.activeSessions.set(finalSessionId, session)

      await this.logEvent('upload_initiated', {
        sessionId: finalSessionId,
        fileName: file.name,
        fileSize: file.size,
        documentType,
        landVerificationId,
      })

      return session
    } catch (error) {
      throw this.createError(
        `Failed to initiate upload: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPLOAD_INITIATION_FAILED',
        undefined,
        undefined,
        true,
      )
    }
  }

  async uploadChunk(sessionId: string, chunk: ImageChunk): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw this.createError(
        `Upload session ${sessionId} not found`,
        'SESSION_NOT_FOUND',
      )
    }

    if (this.pausedSessions.has(sessionId)) {
      return // Silently skip – caller can resume later.
    }

    const startTime = Date.now()

    try {
      await this.withRetry(
        () => this.sendChunk(sessionId, chunk),
        this.config.upload.maxRetries,
        this.config.upload.retryDelay,
      )

      chunk.uploaded = true
      chunk.uploadTime = Date.now() - startTime
      this.updateSessionProgress(sessionId)

      await this.logEvent('chunk_uploaded', {
        sessionId,
        chunkIndex: chunk.index,
        chunkSize: chunk.size,
        uploadTime: chunk.uploadTime,
      })
    } catch (error) {
      chunk.retryCount = (chunk.retryCount ?? 0) + 1

      await this.logEvent('chunk_upload_failed', {
        sessionId,
        chunkIndex: chunk.index,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: chunk.retryCount,
      })

      throw this.createError(
        `Chunk upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CHUNK_UPLOAD_FAILED',
        session.imageId,
        undefined,
        false,
      )
    }
  }

  pauseUpload(sessionId: string): void {
    this.pausedSessions.add(sessionId)
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.status = 'paused'
      this.notifyProgress(sessionId)
    }
  }

  resumeUpload(sessionId: string): void {
    this.pausedSessions.delete(sessionId)
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.status = 'uploading'
      this.notifyProgress(sessionId)
    }
  }

  cancelUpload(sessionId: string): void {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    session.status = 'cancelled'
    this.activeSessions.delete(sessionId)
    this.progressCallbacks.delete(sessionId)
    this.pausedSessions.delete(sessionId)

    // Fire-and-forget – cancellation audit log is best-effort.
    void this.logEvent('upload_cancelled', { sessionId, progress: session.progress })
  }

  getUploadProgress(sessionId: string): UploadProgress | null {
    const session = this.activeSessions.get(sessionId)
    if (!session) return null

    const completedChunks = session.chunks.filter((c: ImageChunk) => c.uploaded)
    const uploadedBytes = completedChunks.reduce((sum: number, c: ImageChunk) => sum + c.size, 0)
    const totalBytes = session.chunks.reduce((sum: number, c: ImageChunk) => sum + c.size, 0)

    return {
      sessionId,
      imageId: session.imageId,
      progress: session.progress,
      uploadSpeed: session.uploadSpeed,
      status: session.status,
      chunksCompleted: completedChunks.length,
      totalChunks: session.chunks.length,
      bytesUploaded: uploadedBytes,
      totalBytes,
      ...(session.estimatedTimeRemaining !== undefined && {
        estimatedTimeRemaining: session.estimatedTimeRemaining,
      }),
    }
  }

  onProgressUpdate(
    sessionId: string,
    callback: (progress: UploadProgress) => void,
  ): void {
    this.progressCallbacks.set(sessionId, callback)
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /** Routes a chunk to the appropriate transport layer. */
  private async sendChunk(sessionId: string, chunk: ImageChunk): Promise<void> {
    if (this.dependencies.apiClient) {
      await this.dependencies.apiClient.uploadChunk(sessionId, chunk)
    } else if (this.dependencies.storageService) {
      await this.dependencies.storageService.uploadChunk(sessionId, chunk)
    } else {
      await this.mockChunkUpload(chunk)
    }
  }

  private updateSessionProgress(sessionId: string): void {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    const completed = session.chunks.filter((c: ImageChunk) => c.uploaded)
    const totalChunks = session.chunks.length

    session.progress = this.calculateProgress(completed.length, totalChunks)

    const elapsedSec = (Date.now() - session.startTime) / 1000
    const uploadedBytes = completed.reduce((sum: number, c: ImageChunk) => sum + c.size, 0)
    session.uploadSpeed = this.calculateSpeed(uploadedBytes, elapsedSec)

    const remainingBytes = session.chunks
      .filter((c: ImageChunk) => !c.uploaded)
      .reduce((sum: number, c: ImageChunk) => sum + c.size, 0)
    session.estimatedTimeRemaining = this.calculateETA(remainingBytes, session.uploadSpeed)

    if (completed.length === totalChunks) {
      session.status = 'completed'
      session.endTime = Date.now()
      // Best-effort server-side completion – do not block progress updates.
      void this.dependencies.apiClient?.completeUpload(sessionId)
    } else {
      session.status = 'uploading'
    }

    this.notifyProgress(sessionId)
  }

  private notifyProgress(sessionId: string): void {
    const callback = this.progressCallbacks.get(sessionId)
    const progress = this.getUploadProgress(sessionId)
    if (callback && progress) {
      callback(progress)
    }
  }

  /**
   * Simulates a network upload with proportional delay.
   * Introduces a tiny random failure rate to exercise retry logic.
   */
  private async mockChunkUpload(chunk: ImageChunk): Promise<void> {
    const delayMs = Math.min(chunk.size / 1024, 1000)
    await new Promise<void>(resolve => setTimeout(resolve, delayMs))

    // ~1 % failure rate – use a non-cryptographic check here since this is
    // purely a development simulation, not a security-sensitive path.
    if (Math.random() < 0.01) {
      throw new Error('Simulated network error for testing')
    }
  }
}

// ---------------------------------------------------------------------------
// Module-level singleton
// ---------------------------------------------------------------------------

export const propertyImageUploadService = ImageServiceRegistry.getInstance().register(
  new PropertyImageUploadService(),
)

export default PropertyImageUploadService
