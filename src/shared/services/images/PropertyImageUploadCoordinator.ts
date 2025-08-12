/**
 * Property Image Upload Coordinator
 * Context-sensitive version aligned with project's property verification domain
 * Integrates with existing API structure and service patterns
 */

import { imageServiceConfig } from '../../config/image-system.config';
import { generateUniqueId, calculateHash } from '../../utils/images/unified-utils';

const UNKNOWN_ERROR = 'Unknown error';

import type {
  PropertyImage,
  UploadSession,
  UploadProgress,
  ImageChunk,
  DocumentType,
  ImageServiceConfig,
} from '../../types/images';
import { ImageProcessingError } from '../../types/images';

export interface IPropertyImageUploadCoordinator {
  initiateUpload(file: File, documentType?: DocumentType, landVerificationId?: string): Promise<UploadSession>;
  uploadChunk(sessionId: string, chunk: ImageChunk): Promise<void>;
  pauseUpload(sessionId: string): void;
  resumeUpload(sessionId: string): void;
  cancelUpload(sessionId: string): void;
  getUploadProgress(sessionId: string): UploadProgress | null;
  onProgressUpdate(sessionId: string, callback: (progress: UploadProgress) => void): void;
}

export interface PropertyImageUploadDependencies {
  apiClient?: {
    uploadChunk: (sessionId: string, chunk: ImageChunk, metadata?: any) => Promise<void>;
    createUploadSession: (metadata: any) => Promise<{ sessionId: string; uploadUrl?: string }>;
    completeUpload: (sessionId: string) => Promise<void>;
  };
  storageService?: {
    uploadChunk: (sessionId: string, chunk: ImageChunk) => Promise<void>;
    createSession: (metadata: any) => Promise<string>;
  };
  auditService?: {
    logUploadEvent: (event: string, metadata: any) => Promise<void>;
  };
}

export class PropertyImageUploadCoordinator implements IPropertyImageUploadCoordinator {
  private activeSessions = new Map<string, UploadSession>();
  private progressCallbacks = new Map<string, (progress: UploadProgress) => void>();
  private pausedSessions = new Set<string>();
  private config: ImageServiceConfig;

  constructor(
    private dependencies: PropertyImageUploadDependencies = {},
    config?: ImageServiceConfig
  ) {
    this.config = config || imageServiceConfig;
  }

  async initiateUpload(
    file: File,
    documentType?: DocumentType,
    landVerificationId?: string
  ): Promise<UploadSession> {
    const sessionId = generateUniqueId();
    
    try {
      // Create chunks for the file
      const chunks = await this.createChunks(file, sessionId);
      
      // Create upload session metadata aligned with project's API structure
      const sessionMetadata = {
        sessionId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        documentType,
        landVerificationId,
        chunkCount: chunks.length,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      // Create session with backend API (following /api/v1/ pattern)
      if (this.dependencies.apiClient) {
        const { sessionId: backendSessionId, uploadUrl } = await this.dependencies.apiClient.createUploadSession(sessionMetadata);
        // Use backend session ID if provided
        if (backendSessionId && backendSessionId !== sessionId) {
          // Update chunks with new session ID
          chunks.forEach(chunk => {
            chunk.id = chunk.id.replace(sessionId, backendSessionId);
          });
        }
      }

      const session: UploadSession = {
        id: sessionId,
        imageId: generateUniqueId(),
        chunks,
        status: 'pending',
        progress: 0,
        uploadSpeed: 0,
        startTime: Date.now(),
      };

      this.activeSessions.set(sessionId, session);

      // Log audit event
      await this.dependencies.auditService?.logUploadEvent('upload_initiated', {
        sessionId,
        fileName: file.name,
        fileSize: file.size,
        documentType,
        landVerificationId,
      });

      return session;

    } catch (error) {
      throw new ImageProcessingError(
        `Failed to initiate upload: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
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
      throw new ImageProcessingError(
        `Upload session ${sessionId} not found`,
        'SESSION_NOT_FOUND',
        undefined
      );
    }

    if (this.pausedSessions.has(sessionId)) {
      return; // Skip if paused
    }

    const startTime = Date.now();

    try {
      // Upload chunk using appropriate service
      if (this.dependencies.apiClient) {
        await this.dependencies.apiClient.uploadChunk(sessionId, chunk, {
          documentType: session.documentType,
          landVerificationId: session.landVerificationId,
        });
      } else if (this.dependencies.storageService) {
        await this.dependencies.storageService.uploadChunk(sessionId, chunk);
      } else {
        // Mock upload for development/testing
        await this.mockChunkUpload(chunk);
      }

      // Update chunk status
      chunk.uploaded = true;
      chunk.uploadTime = Date.now() - startTime;

      // Update session progress
      this.updateSessionProgress(sessionId);

      // Log successful chunk upload
      await this.dependencies.auditService?.logUploadEvent('chunk_uploaded', {
        sessionId,
        chunkIndex: chunk.index,
        chunkSize: chunk.size,
        uploadTime: chunk.uploadTime,
      });

    } catch (error) {
      chunk.retryCount = (chunk.retryCount || 0) + 1;
      
      // Log failed chunk upload
      await this.dependencies.auditService?.logUploadEvent('chunk_upload_failed', {
        sessionId,
        chunkIndex: chunk.index,
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
        retryCount: chunk.retryCount,
      });

      if (chunk.retryCount >= this.config.upload.maxRetries) {
        session.status = 'failed';
        session.error = `Chunk ${chunk.index} failed after ${chunk.retryCount} retries`;
        
        throw new ImageProcessingError(
          `Chunk upload failed: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
          'CHUNK_UPLOAD_FAILED',
          session.imageId,
          undefined,
          false
        );
      }

      // Retry with exponential backoff
      const delay = this.config.upload.retryDelay * Math.pow(2, chunk.retryCount - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.uploadChunk(sessionId, chunk);
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

      // Log cancellation
      this.dependencies.auditService?.logUploadEvent('upload_cancelled', {
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
      estimatedTimeRemaining: session.estimatedTimeRemaining,
      status: session.status,
      chunksCompleted: completedChunks,
      totalChunks: session.chunks.length,
      bytesUploaded: uploadedBytes,
      totalBytes,
    };
  }

  onProgressUpdate(sessionId: string, callback: (progress: UploadProgress) => void): void {
    this.progressCallbacks.set(sessionId, callback);
  }

  // Set dependencies (for dependency injection)
  setApiClient(apiClient: PropertyImageUploadDependencies['apiClient']): void {
    this.dependencies.apiClient = apiClient;
  }

  setStorageService(storageService: PropertyImageUploadDependencies['storageService']): void {
    this.dependencies.storageService = storageService;
  }

  setAuditService(auditService: PropertyImageUploadDependencies['auditService']): void {
    this.dependencies.auditService = auditService;
  }

  private async createChunks(file: File, sessionId: string): Promise<ImageChunk[]> {
    const chunks: ImageChunk[] = [];
    const {chunkSize} = this.config.upload;
    const totalChunks = Math.ceil(file.size / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunkData = file.slice(start, end);
      
      const chunk: ImageChunk = {
        id: `${sessionId}-chunk-${i}`,
        index: i,
        data: chunkData,
        size: chunkData.size,
        hash: await calculateHash(chunkData),
        uploaded: false,
        retryCount: 0,
      };

      chunks.push(chunk);
    }

    return chunks;
  }

  private updateSessionProgress(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const completedChunks = session.chunks.filter(chunk => chunk.uploaded).length;
    const totalChunks = session.chunks.length;
    const progress = (completedChunks / totalChunks) * 100;

    // Calculate upload speed
    const currentTime = Date.now();
    const elapsedTime = (currentTime - session.startTime) / 1000; // seconds
    const uploadedBytes = session.chunks
      .filter(chunk => chunk.uploaded)
      .reduce((sum, chunk) => sum + chunk.size, 0);
    const uploadSpeed = elapsedTime > 0 ? uploadedBytes / elapsedTime : 0;

    // Calculate estimated time remaining
    const remainingBytes = session.chunks
      .filter(chunk => !chunk.uploaded)
      .reduce((sum, chunk) => sum + chunk.size, 0);
    const estimatedTimeRemaining = uploadSpeed > 0 ? remainingBytes / uploadSpeed : undefined;

    session.progress = progress;
    session.uploadSpeed = uploadSpeed;
    session.estimatedTimeRemaining = estimatedTimeRemaining;

    if (completedChunks === totalChunks) {
      session.status = 'completed';
      session.endTime = currentTime;

      // Complete upload with backend
      this.dependencies.apiClient?.completeUpload(sessionId);

      // Log completion
      this.dependencies.auditService?.logUploadEvent('upload_completed', {
        sessionId,
        totalTime: elapsedTime,
        totalBytes: uploadedBytes,
        averageSpeed: uploadSpeed,
      });
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
    // Simulate network delay based on chunk size
    const delay = Math.min(chunk.size / 1024, 1000); // Max 1 second delay
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate occasional failures for testing
    if (Math.random() < 0.02) { // 2% failure rate
      throw new Error('Simulated network error');
    }
  }
}

