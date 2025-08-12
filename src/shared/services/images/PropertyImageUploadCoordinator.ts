/**
 * Property Image Upload Coordinator
 * Context-sensitive version aligned with project's property verification domain
 * Integrates with existing API structure and service patterns
 */

import { imageServiceConfig } from '../../config/image-system.config';
import type {
  UploadSession,
  UploadProgress,
  ImageChunk,
  DocumentType,
  ImageServiceConfig,
} from '../../types/images';
import { ImageProcessingError } from '../../types/images';
import { generateUniqueId, calculateHash } from '../../utils/images/unified-utils';

const UNKNOWN_ERROR = 'Unknown error';

// Enhanced type definitions to replace 'any' types
export interface ChunkUploadMetadata {
  documentType?: DocumentType;
  landVerificationId?: string;
  chunkIndex?: number;
  retryAttempt?: number;
}

export interface SessionCreationMetadata {
  sessionId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  documentType?: DocumentType;
  landVerificationId?: string;
  chunkCount: number;
  timestamp: string;
  userAgent: string;
}

export interface BackendSessionResponse {
  sessionId: string;
  uploadUrl?: string;
  expiresAt?: string;
  allowedOperations?: string[];
}

export interface AuditEventMetadata {
  sessionId: string;
  fileName?: string;
  fileSize?: number;
  documentType?: DocumentType;
  landVerificationId?: string;
  chunkIndex?: number;
  chunkSize?: number;
  uploadTime?: number;
  error?: string;
  retryCount?: number;
  progress?: number;
  totalTime?: number;
  totalBytes?: number;
  averageSpeed?: number;
}

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
    uploadChunk: (sessionId: string, chunk: ImageChunk, metadata?: ChunkUploadMetadata) => Promise<void>;
    createUploadSession: (metadata: SessionCreationMetadata) => Promise<BackendSessionResponse>;
    completeUpload: (sessionId: string) => Promise<void>;
  };
  storageService?: {
    uploadChunk: (sessionId: string, chunk: ImageChunk) => Promise<void>;
    createSession: (metadata: SessionCreationMetadata) => Promise<string>;
  };
  auditService?: {
    logUploadEvent: (event: string, metadata: AuditEventMetadata) => Promise<void>;
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
        chunkCount: chunks.length,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ...(documentType && { documentType }),
        ...(landVerificationId && { landVerificationId }),
      };

      // Create session with backend API (following /api/v1/ pattern)
      let finalSessionId = sessionId;
      if (this.dependencies.apiClient) {
        const backendResponse = await this.dependencies.apiClient.createUploadSession(sessionMetadata);

        // Use backend session ID if provided and different from client-generated one
        if (backendResponse.sessionId && backendResponse.sessionId !== sessionId) {
          finalSessionId = backendResponse.sessionId;
          // Update chunks with new session ID
          chunks.forEach(chunk => {
            chunk.id = chunk.id.replace(sessionId, finalSessionId);
          });
        }
      }

      const session: UploadSession = {
        id: finalSessionId,
        imageId: generateUniqueId(),
        chunks,
        status: 'pending',
        progress: 0,
        uploadSpeed: 0,
        startTime: Date.now(),
      };

      this.activeSessions.set(finalSessionId, session);

      // Log audit event with proper typing
      const auditMetadata = {
        sessionId: finalSessionId,
        fileName: file.name,
        fileSize: file.size,
        ...(documentType && { documentType }),
        ...(landVerificationId && { landVerificationId }),
      };
      await this.dependencies.auditService?.logUploadEvent('upload_initiated', auditMetadata);

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
      // Upload chunk using appropriate service with properly typed metadata
      if (this.dependencies.apiClient) {
        const metadata = {
          chunkIndex: chunk.index,
          retryAttempt: chunk.retryCount || 0,
          ...(session.documentType && { documentType: session.documentType }),
          ...(session.landVerificationId && { landVerificationId: session.landVerificationId }),
        };
        await this.dependencies.apiClient.uploadChunk(sessionId, chunk, metadata);
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

      // Log successful chunk upload with proper typing
      await this.dependencies.auditService?.logUploadEvent('chunk_uploaded', {
        sessionId,
        chunkIndex: chunk.index,
        chunkSize: chunk.size,
        uploadTime: chunk.uploadTime,
      });

    } catch (error) {
      chunk.retryCount = (chunk.retryCount || 0) + 1;

      // Log failed chunk upload with proper typing
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

      // Log cancellation with proper typing
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

    const progressResult: UploadProgress = {
      sessionId,
      imageId: session.imageId,
      progress: session.progress,
      uploadSpeed: session.uploadSpeed,
      status: session.status,
      chunksCompleted: completedChunks,
      totalChunks: session.chunks.length,
      bytesUploaded: uploadedBytes,
      totalBytes,
    };

    if (session.estimatedTimeRemaining !== undefined) {
      progressResult.estimatedTimeRemaining = session.estimatedTimeRemaining;
    }

    return progressResult;
  }

  onProgressUpdate(sessionId: string, callback: (progress: UploadProgress) => void): void {
    this.progressCallbacks.set(sessionId, callback);
  }

  /**
   * Dependency injection methods for runtime configuration
   * These allow for flexible testing and different deployment environments
   */
  setApiClient(apiClient: PropertyImageUploadDependencies['apiClient']): void {
    if (apiClient) {
      this.dependencies.apiClient = apiClient;
    }
  }

  setStorageService(storageService: PropertyImageUploadDependencies['storageService']): void {
    if (storageService) {
      this.dependencies.storageService = storageService;
    }
  }

  setAuditService(auditService: PropertyImageUploadDependencies['auditService']): void {
    if (auditService) {
      this.dependencies.auditService = auditService;
    }
  }

  /**
   * Creates file chunks for upload with hash verification
   * This enables reliable resumable uploads and integrity checking
   */
  private async createChunks(file: File, sessionId: string): Promise<ImageChunk[]> {
    const chunks: ImageChunk[] = [];
    const { chunkSize } = this.config.upload;
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

  /**
   * Updates session progress metrics and handles completion
   * Calculates upload speed, progress percentage, and estimated time remaining
   */
  private updateSessionProgress(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const completedChunks = session.chunks.filter(chunk => chunk.uploaded).length;
    const totalChunks = session.chunks.length;
    const progress = (completedChunks / totalChunks) * 100;

    // Calculate upload speed based on actual data transferred
    const currentTime = Date.now();
    const elapsedTime = (currentTime - session.startTime) / 1000; // seconds
    const uploadedBytes = session.chunks
      .filter(chunk => chunk.uploaded)
      .reduce((sum, chunk) => sum + chunk.size, 0);
    const uploadSpeed = elapsedTime > 0 ? uploadedBytes / elapsedTime : 0;

    // Calculate estimated time remaining for user feedback
    const remainingBytes = session.chunks
      .filter(chunk => !chunk.uploaded)
      .reduce((sum, chunk) => sum + chunk.size, 0);
    const estimatedTimeRemaining = uploadSpeed > 0 ? remainingBytes / uploadSpeed : undefined;

    session.progress = progress;
    session.uploadSpeed = uploadSpeed;
    if (estimatedTimeRemaining !== undefined) {
      session.estimatedTimeRemaining = estimatedTimeRemaining;
    }

    if (completedChunks === totalChunks) {
      session.status = 'completed';
      session.endTime = currentTime;

      // Complete upload with backend API
      this.dependencies.apiClient?.completeUpload(sessionId);

      // Log completion with comprehensive metrics
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

  /**
   * Notifies registered callbacks of progress updates
   * Enables real-time UI updates during upload process
   */
  private notifyProgress(sessionId: string): void {
    const callback = this.progressCallbacks.get(sessionId);
    const progress = this.getUploadProgress(sessionId);

    if (callback && progress) {
      callback(progress);
    }
  }

  /**
   * Mock chunk upload for development and testing environments
   * Simulates network conditions and occasional failures for robust testing
   */
  private async mockChunkUpload(chunk: ImageChunk): Promise<void> {
    // Simulate network delay based on chunk size for realistic testing
    const delay = Math.min(chunk.size / 1024, 1000); // Max 1 second delay
    await new Promise(resolve => setTimeout(resolve, delay));

    // Use crypto.getRandomValues for better randomness when available
    const getSecureRandom = (): number => {
      if (window?.crypto?.getRandomValues) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        const [value] = array;
        return value !== undefined ? value / (0xFFFFFFFF + 1) : 0.5;
      }
      // Fallback for non-browser environments or when crypto is unavailable
      return 0.5;
    };

    const randomValue = getSecureRandom();

    // Simulate occasional failures for testing resilience (1% failure rate)
    if (randomValue < 0.01) {
      throw new Error('Simulated network error for testing');
    }
  }
}