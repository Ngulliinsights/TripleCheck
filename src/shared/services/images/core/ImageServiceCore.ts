/**
 * Image Service Core - Shared Foundation Layer
 * 
 * This core layer eliminates duplication by providing shared functionality
 * that all image services can use, while maintaining separation of concerns.
 * 
 * Strategic Benefits:
 * - Eliminates duplicate code across services
 * - Provides consistent error handling and logging
 * - Centralizes common operations like file processing
 * - Maintains service boundaries for better maintainability
 */

import { imageServiceConfig } from '../../../config/image-system.config';
import type {
  ImageServiceConfig,
  PropertyImageMetadata,
  DocumentType,
  ImageChunk,
} from '../../../types/images';
import { ImageProcessingError } from '../../../types/images';
import { ImageUtils } from '../../../utils/images/unified-utils';

// Shared interfaces that all services can implement
export interface BaseImageService {
  readonly serviceName: string;
  readonly version: string;
}

export interface AuditableService {
  logEvent(event: string, metadata: Record<string, unknown>): Promise<void>;
}

export interface ConfigurableService {
  updateConfig(config: Partial<ImageServiceConfig>): void;
  getConfig(): ImageServiceConfig;
}

// Core shared functionality
export abstract class ImageServiceCore implements BaseImageService, AuditableService, ConfigurableService {
  protected config: ImageServiceConfig;
  protected auditService?: AuditService;

  abstract readonly serviceName: string;
  abstract readonly version: string;

  constructor(config?: ImageServiceConfig, auditService?: AuditService) {
    this.config = config || imageServiceConfig;
    this.auditService = auditService;
  }

  // Shared configuration management
  updateConfig(config: Partial<ImageServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ImageServiceConfig {
    return { ...this.config };
  }

  // Shared audit logging
  async logEvent(event: string, metadata: Record<string, unknown>): Promise<void> {
    if (this.auditService) {
      await this.auditService.log(this.serviceName, event, metadata);
    }
  }

  // Shared error handling
  protected createError(
    message: string,
    code: string,
    imageId?: string,
    step?: string,
    retryable: boolean = false
  ): ImageProcessingError {
    return new ImageProcessingError(message, code, imageId, step, retryable);
  }

  // Shared file processing utilities
  protected async createFileChunks(file: File, sessionId: string): Promise<ImageChunk[]> {
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
        hash: await ImageUtils.calculateHash(chunkData),
        uploaded: false,
        retryCount: 0,
      };

      chunks.push(chunk);
    }

    return chunks;
  }

  // Shared metadata extraction helpers
  protected async extractBasicMetadata(file: File): Promise<Partial<PropertyImageMetadata>> {
    return {
      fileSize: file.size,
      technicalMetadata: {
        format: ImageUtils.getFileExtension(file.name),
        colorSpace: 'sRGB',
        bitDepth: 24,
        compression: 'JPEG',
        orientation: 1,
      },
      createdAt: Date.now(),
      lastModified: file.lastModified,
    };
  }

  // Shared validation helpers
  protected validateFileSize(fileSize: number): boolean {
    return fileSize > 0 && fileSize <= this.config.validation.maxFileSize;
  }

  protected validateFileFormat(fileName: string): boolean {
    const extension = ImageUtils.getFileExtension(fileName);
    return this.config.validation.allowedFormats.includes(extension);
  }

  // Shared retry logic
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }

    throw lastError!;
  }

  // Shared progress tracking
  protected calculateProgress(completed: number, total: number): number {
    return total > 0 ? (completed / total) * 100 : 0;
  }

  protected calculateSpeed(bytes: number, timeInSeconds: number): number {
    return timeInSeconds > 0 ? bytes / timeInSeconds : 0;
  }

  protected calculateETA(remainingBytes: number, speed: number): number | undefined {
    return speed > 0 ? remainingBytes / speed : undefined;
  }
}

// Shared audit service interface
export interface AuditService {
  log(serviceName: string, event: string, metadata: Record<string, unknown>): Promise<void>;
}

// Default audit service implementation
export class DefaultAuditService implements AuditService {
  async log(serviceName: string, event: string, metadata: Record<string, unknown>): Promise<void> {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${serviceName}] ${event}:`, metadata);
    }
    
    // In production, this would send to your logging service
    // await sendToLoggingService({ serviceName, event, metadata, timestamp: new Date() });
  }
}

// Service registry for dependency injection
export class ImageServiceRegistry {
  private static instance: ImageServiceRegistry;
  private services = new Map<string, BaseImageService>();
  private auditService: AuditService;

  private constructor() {
    this.auditService = new DefaultAuditService();
  }

  static getInstance(): ImageServiceRegistry {
    if (!ImageServiceRegistry.instance) {
      ImageServiceRegistry.instance = new ImageServiceRegistry();
    }
    return ImageServiceRegistry.instance;
  }

  register<T extends BaseImageService>(service: T): T {
    this.services.set(service.serviceName, service);
    return service;
  }

  get<T extends BaseImageService>(serviceName: string): T | undefined {
    return this.services.get(serviceName) as T;
  }

  getAuditService(): AuditService {
    return this.auditService;
  }

  setAuditService(auditService: AuditService): void {
    this.auditService = auditService;
  }

  // Get all services of a specific type
  getServicesByType<T extends BaseImageService>(predicate: (service: BaseImageService) => service is T): T[] {
    return Array.from(this.services.values()).filter(predicate);
  }

  // Check if a service is registered
  has(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  // Get all registered service names
  getRegisteredServiceNames(): string[] {
    return Array.from(this.services.keys());
  }
}

export default ImageServiceCore;