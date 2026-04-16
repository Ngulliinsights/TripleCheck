/**
 * Property Image Upload Service - Refactored
 * 
 * Focused service that handles only upload operations.
 * Uses shared core to eliminate duplication while maintaining clear boundaries.
 */

import { ImageServiceCore, ImageServiceRegistry } from './core/ImageServiceCore'
import type {
  UploadSession,
  UploadProgress,
  ImageChunk,
  DocumentType,
  ImageServiceConfig,
} from '../../types/images'
import { ImageUtils } from '../../utils/images/unified-utils'

export interface IPropertyImageUploadService {
  initiateUpload(file: File, documentType?: DocumentType, landVerificationId?: string): Promise<UploadSession>;
  uploadChunk(sessionId: string, chunk: ImageChunk): Promise<void>;
  pauseUpload(sessionId: string): void;
  resumeUpload(sessionId: string): void;
  cancelUpload(sessionId: string): void;
  getUploadProgress(sessionId: string): UploadProgress | null;
  onProgressUpdate(sessionId: string, callback: (progress: UploadProgress) => void): void;
}

export interface UploadDependencies {
  apiClient?: {
    uploadChunk: (sessionId: string, chunk: ImageChunk, metadata?: any) => Promise<void>;
    createUploadSession: (metadata: any) => Promise<any>;
    completeUpload: (sessionId: string) => Promise<void>;
  };
  storageService?: {
    uploadChunk: (sessionId: string, chunk: ImageChunk) => Promise<void>;
    createSession: (metadata: any) => Promise<string>;
  };
}

export class PropertyImageUploadService extends ImageServiceCore implements IPropertyImageUploadService {
  readonly serviceName = 'PropertyImageUploadService';
  readonly version = '2.0.0';

  private activeSessions = new Map<string, UploadSession>();
  private progressCallbacks = new Map<string, (progress: UploadProgress) => void>();
  private pausedSessions = new Set<string>();

  constructor(
    private dependencies: UploadDependencies = {},
    config?: ImageServiceConfig
  ) {
    super(config, ImageServiceRegistry.getInstance().getAuditService());
  }

  async initiateUpload(
    file: File,
    documentType?: DocumentType,
    landVerificationId?: string
  ): Promise<UploadSession> {
    const sessionId = ImageUtils.generateUniqueId();

    try {
      // Use shared core functionality
      const chunks = await this.createFileChunks(file, sessionId);
      
      const sessionMetadata = {
        sessionId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        chunkCount: chunks.length,
        timestamp: new Date().toISOString(),
        ...(documentType && { documentType }),
        ...(landVerificationId && { landVerificationId }),
      };

      // Handle backend session creation
      let finalSessionId = sessionId;
      if (this.dependencies.apiClient) {
        const backendResponse = await this.dependencies.apiClient.createUploadSession(sessionMetadata);
        if (backendResponse.sessionId && backendResponse.sessionId !== sessionId) {
          finalSessionId = backendResponse.sessionId;
          chunks.forEach(chunk => {
            chunk.id = chunk.id.replace(sessionId, finalSessionId);
          });
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
      };

      this.activeSessions.set(finalSessionId, session);

      // Use shared audit logging
      await this.logEvent('upload_initiated', {
        sessionId: finalSessionId,
        fileName: file.name,
        fileSize: file.size,
        documentType,
        landVerificationId,
      });

      return session;
    } catch (error) {
      throw this.createError(
        `Failed to initiate upload: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPLOAD_INITIATION_FAILED',
        undefined,
        undefined,
        true
      );
    }
  }

  async uploadChunk(sessionId: string, chunk: ImageChunk): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw this.createError(`Upload session ${sessionId} not found`, 'SESSION_NOT_FOUND');
    }

    if (this.pausedSessions.has(sessionId)) {
      return;
    }

    const startTime = Date.now();

    try {
      // Use shared retry logic
      await this.withRetry(async () => {
        if (this.dependencies.apiClient) {
          await this.dependencies.apiClient.uploadChunk(sessionId, chunk);
        } else if (this.dependencies.storageService) {
          await this.dependencies.storageService.uploadChunk(sessionId, chunk);
        } else {
          await this.mockChunkUpload(chunk);
        }
      }, this.config.upload.maxRetries, this.config.upload.retryDelay);

      chunk.uploaded = true;
      chunk.uploadTime = Date.now() - startTime;
      this.updateSessionProgress(sessionId);

      await this.logEvent('chunk_uploaded', {
        sessionId,
        chunkIndex: chunk.index,
        chunkSize: chunk.size,
        uploadTime: chunk.uploadTime,
      });

    } catch (error) {
      chunk.retryCount = (chunk.retryCount || 0) + 1;
      
      await this.logEvent('chunk_upload_failed', {
        sessionId,
        chunkIndex: chunk.index,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: chunk.retryCount,
      });

      throw this.createError(
        `Chunk upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CHUNK_UPLOAD_FAILED',
        session.imageId,
        undefined,
        false
      );
    }
  }

  pauseUpload(sessionId: string): void {
    this.pausedSessions.add(sessionId);
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'paused';
      this.notifyProgress(sessionId);
    }
  }

  resumeUpload(sessionId: string): void {
    this.pausedSessions.delete(sessionId);
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'uploading';
      this.notifyProgress(sessionId);
    }
  }

  cancelUpload(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'cancelled';
      this.activeSessions.delete(sessionId);
      this.progressCallbacks.delete(sessionId);
      this.pausedSessions.delete(sessionId);

      this.logEvent('upload_cancelled', {
        sessionId,
        progress: session.progress,
      });
    }
  }

  getUploadProgress(sessionId: string): UploadProgress | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const completedChunks = session.chunks.filter(chunk => chunk.uploaded).length;
    const totalBytes = session.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const uploadedBytes = session.chunks
      .filter(chunk => chunk.uploaded)
      .reduce((sum, chunk) => sum + chunk.size, 0);

    return {
      sessionId,
      imageId: session.imageId,
      progress: session.progress,
      uploadSpeed: session.uploadSpeed,
      status: session.status,
      chunksCompleted: completedChunks,
      totalChunks: session.chunks.length,
      bytesUploaded: uploadedBytes,
      totalBytes,
      ...(session.estimatedTimeRemaining !== undefined && { estimatedTimeRemaining: session.estimatedTimeRemaining }),
    };
  }

  onProgressUpdate(sessionId: string, callback: (progress: UploadProgress) => void): void {
    this.progressCallbacks.set(sessionId, callback);
  }

  // Private methods
  private updateSessionProgress(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const completedChunks = session.chunks.filter(chunk => chunk.uploaded).length;
    const totalChunks = session.chunks.length;
    
    // Use shared progress calculation
    session.progress = this.calculateProgress(completedChunks, totalChunks);

    const currentTime = Date.now();
    const elapsedTime = (currentTime - session.startTime) / 1000;
    const uploadedBytes = session.chunks
      .filter(chunk => chunk.uploaded)
      .reduce((sum, chunk) => sum + chunk.size, 0);
    
    // Use shared speed calculation
    session.uploadSpeed = this.calculateSpeed(uploadedBytes, elapsedTime);

    const remainingBytes = session.chunks
      .filter(chunk => !chunk.uploaded)
      .reduce((sum, chunk) => sum + chunk.size, 0);
    
    // Use shared ETA calculation
    session.estimatedTimeRemaining = this.calculateETA(remainingBytes, session.uploadSpeed);

    if (completedChunks === totalChunks) {
      session.status = 'completed';
      session.endTime = currentTime;
      this.dependencies.apiClient?.completeUpload(sessionId);
    } else {
      session.status = 'uploading';
    }

    this.notifyProgress(sessionId);
  }

  private notifyProgress(sessionId: string): void {
    const callback = this.progressCallbacks.get(sessionId);
    const progress = this.getUploadProgress(sessionId);
    if (callback && progress) {
      callback(progress);
    }
  }

  private async mockChunkUpload(chunk: ImageChunk): Promise<void> {
    const delay = Math.min(chunk.size / 1024, 1000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (Math.random() < 0.01) {
      throw new Error('Simulated network error for testing');
    }
  }
}

// Register service in the registry
export const propertyImageUploadService = ImageServiceRegistry.getInstance().register(
  new PropertyImageUploadService()
);

export default PropertyImageUploadService;