/**
 * Image Service Core – Shared Foundation Layer
 *
 * Provides a single base class with shared config management, audit logging,
 * file-processing utilities, and retry logic. All image services extend this
 * class instead of re-implementing these concerns themselves.
 *
 * Dependency graph (nothing here imports from a sibling service):
 *   config/image-system.config  →  ImageServiceCore
 *   types/images                →  ImageServiceCore
 *   utils/images/unified-utils  →  ImageServiceCore
 */

import { imageServiceConfig } from '../../../config/image-system.config'
import type {
  ImageServiceConfig,
  PropertyImageMetadata,
  DocumentType,       // exported for convenience – consumers import from here
  ImageChunk,
  ProcessingStep,
} from '../../../types/images'
import { ImageProcessingError } from '../../../types/images'
import { ImageUtils } from '../../../utils/images/unified-utils'

// =============================================================================
// Narrow service interfaces
// =============================================================================

/** Minimum contract every image service must satisfy. */
export interface BaseImageService {
  readonly serviceName: string
  readonly version: string
}

/**
 * External audit-sink interface.
 * Kept separate from `BaseImageService` so services that don't need auditing
 * aren't forced to implement it.
 */
export interface AuditService {
  log(
    serviceName: string,
    event: string,
    metadata: Record<string, unknown>,
  ): Promise<void>
}

/** Allows runtime configuration overrides on a per-service basis. */
export interface ConfigurableService {
  updateConfig(patch: Partial<ImageServiceConfig>): void
  getConfig(): Readonly<ImageServiceConfig>
}

// =============================================================================
// Abstract base class
// =============================================================================

/**
 * `ImageServiceCore`
 *
 * Extend this class to inherit:
 *  - Config management  (`this.config`, `updateConfig`, `getConfig`)
 *  - Structured audit logging  (`logEvent`)
 *  - File chunking  (`createFileChunks`)
 *  - Metadata helpers  (`extractBasicMetadata`)
 *  - Validation guards  (`validateFileSize`, `validateFileFormat`)
 *  - Exponential-backoff retry  (`withRetry`)
 *  - Progress / speed maths  (`calculateProgress`, `calculateSpeed`, `calculateETA`)
 *  - Typed error factory  (`createError`)
 */
export abstract class ImageServiceCore
  implements BaseImageService, ConfigurableService
{
  abstract readonly serviceName: string
  abstract readonly version: string

  // `config` is protected-mutable so `updateConfig` can patch it, but the
  // public surface (`getConfig`) returns a frozen copy.
  protected config: ImageServiceConfig

  // Optional — supplied via the registry so subclasses never touch it directly.
  private readonly auditService?: AuditService

  constructor(
    config?: Partial<ImageServiceConfig>,
    auditService?: AuditService,
  ) {
    // Deep-merge the supplied partial over the project-wide defaults.
    this.config = config ? this.mergeConfig(imageServiceConfig, config) : imageServiceConfig
    this.auditService = auditService
  }

  // ---------------------------------------------------------------------------
  // ConfigurableService
  // ---------------------------------------------------------------------------

  /** Shallow-merges `patch` into the current config. */
  updateConfig(patch: Partial<ImageServiceConfig>): void {
    this.config = this.mergeConfig(this.config, patch)
  }

  /** Returns a shallow copy so callers cannot mutate internal state. */
  getConfig(): Readonly<ImageServiceConfig> {
    return { ...this.config }
  }

  // ---------------------------------------------------------------------------
  // Audit logging
  // ---------------------------------------------------------------------------

  /** Forwards a structured event to the injected `AuditService`, if present. */
  async logEvent(event: string, metadata: Record<string, unknown>): Promise<void> {
    await this.auditService?.log(this.serviceName, event, metadata)
  }

  // ---------------------------------------------------------------------------
  // Error factory
  // ---------------------------------------------------------------------------

  protected createError(
    message: string,
    code: string,
    imageId?: string,
    step?: ProcessingStep,
    retryable = false,
  ): ImageProcessingError {
    return new ImageProcessingError(message, code, imageId, step, retryable)
  }

  // ---------------------------------------------------------------------------
  // File processing
  // ---------------------------------------------------------------------------

  /** Splits a `File` into upload chunks and hashes each one. */
  protected async createFileChunks(
    file: File,
    sessionId: string,
  ): Promise<ImageChunk[]> {
    const { chunkSize } = this.config.upload
    const totalChunks = Math.ceil(file.size / chunkSize)
    const chunks: ImageChunk[] = []

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunkData = file.slice(start, end)

      chunks.push({
        id: `${sessionId}-chunk-${i}`,
        index: i,
        data: chunkData,
        size: chunkData.size,
        hash: await ImageUtils.calculateHash(chunkData),
        uploaded: false,
        retryCount: 0,
      })
    }

    return chunks
  }

  // ---------------------------------------------------------------------------
  // Metadata helpers
  // ---------------------------------------------------------------------------

  /** Derives lightweight metadata from a `File` object without reading its bytes. */
  protected async extractBasicMetadata(
    file: File,
  ): Promise<Partial<PropertyImageMetadata>> {
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
    }
  }

  // ---------------------------------------------------------------------------
  // Validation guards
  // ---------------------------------------------------------------------------

  protected validateFileSize(fileSize: number): boolean {
    return fileSize > 0 && fileSize <= this.config.validation.maxFileSize
  }

  protected validateFileFormat(fileName: string): boolean {
    const ext = ImageUtils.getFileExtension(fileName)
    return this.config.validation.allowedFormats.includes(ext)
  }

  // ---------------------------------------------------------------------------
  // Retry logic
  // ---------------------------------------------------------------------------

  /**
   * Runs `operation`, retrying up to `maxRetries` times with exponential back-off.
   *
   * @param operation  - Async work to attempt.
   * @param maxRetries - Maximum number of *additional* attempts after the first.
   * @param delayMs    - Base delay in milliseconds (doubles on each retry).
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1_000,
  ): Promise<T> {
    let lastError: Error = new Error('Operation failed after retries')

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))

        if (attempt < maxRetries) {
          await this.delay(delayMs * 2 ** attempt)
        }
      }
    }

    throw lastError
  }

  // ---------------------------------------------------------------------------
  // Progress / bandwidth helpers
  // ---------------------------------------------------------------------------

  /** Returns a value clamped to [0, 100]. */
  protected calculateProgress(completed: number, total: number): number {
    if (total <= 0) return 0
    return Math.min(100, Math.round((completed / total) * 100))
  }

  /** Returns bytes per second, or `0` if `timeInSeconds` is not positive. */
  protected calculateSpeed(bytes: number, timeInSeconds: number): number {
    return timeInSeconds > 0 ? bytes / timeInSeconds : 0
  }

  /**
   * Returns the estimated seconds remaining, or `undefined` when speed is
   * unknown (avoids showing "∞" in the UI).
   */
  protected calculateETA(remainingBytes: number, speed: number): number | undefined {
    return speed > 0 ? remainingBytes / speed : undefined
  }

  // ---------------------------------------------------------------------------
  // Private utilities
  // ---------------------------------------------------------------------------

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Merges `patch` shallowly at the top level and deep-merges one level of
   * nested objects (matching the two-level shape of `ImageServiceConfig`).
   */
  private mergeConfig(
    base: ImageServiceConfig,
    patch: Partial<ImageServiceConfig>,
  ): ImageServiceConfig {
    const merged = { ...base }

    for (const key of Object.keys(patch) as Array<keyof ImageServiceConfig>) {
      const baseVal = base[key]
      const patchVal = patch[key]

      if (
        typeof baseVal === 'object' &&
        baseVal !== null &&
        typeof patchVal === 'object' &&
        patchVal !== null
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(merged as any)[key] = { ...baseVal, ...patchVal }
      } else if (patchVal !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(merged as any)[key] = patchVal
      }
    }

    return merged
  }
}

// =============================================================================
// Default audit service
// =============================================================================

/**
 * Ships a console implementation in development and a no-op in production.
 * Replace via `ImageServiceRegistry.setAuditService(yourService)`.
 */
export class DefaultAuditService implements AuditService {
  async log(
    serviceName: string,
    event: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${serviceName}] ${event}`, metadata)
    }
    // Production: forward to your observability pipeline here.
    //   e.g. await datadogLogs.logger.info(event, { serviceName, ...metadata })
  }
}

// =============================================================================
// Service registry
// =============================================================================

/**
 * Lightweight IoC container for image services.
 *
 * Usage:
 * ```ts
 * const registry = ImageServiceRegistry.getInstance()
 * registry.register(new MyImageService())
 * const svc = registry.get<MyImageService>('MyImageService')
 * ```
 */
export class ImageServiceRegistry {
  private static instance: ImageServiceRegistry

  private readonly services = new Map<string, BaseImageService>()
  private auditService: AuditService = new DefaultAuditService()

  // Singleton — no public constructor.
  private constructor() {}

  static getInstance(): ImageServiceRegistry {
    if (!ImageServiceRegistry.instance) {
      ImageServiceRegistry.instance = new ImageServiceRegistry()
    }
    return ImageServiceRegistry.instance
  }

  /** Registers `service` and returns it, enabling fluent chaining. */
  register<T extends BaseImageService>(service: T): T {
    this.services.set(service.serviceName, service)
    return service
  }

  /** Returns the registered service, or `undefined` if not found. */
  get<T extends BaseImageService>(serviceName: string): T | undefined {
    return this.services.get(serviceName) as T | undefined
  }

  /** Returns `true` if a service with `serviceName` has been registered. */
  has(serviceName: string): boolean {
    return this.services.has(serviceName)
  }

  /** Lists all currently registered service names. */
  getRegisteredServiceNames(): string[] {
    return Array.from(this.services.keys())
  }

  /** Filters registered services by a type-predicate. */
  getServicesByType<T extends BaseImageService>(
    predicate: (service: BaseImageService) => service is T,
  ): T[] {
    return Array.from(this.services.values()).filter(predicate)
  }

  getAuditService(): AuditService {
    return this.auditService
  }

  /** Swaps in a custom audit service (e.g. Datadog, Sentry). */
  setAuditService(auditService: AuditService): void {
    this.auditService = auditService
  }
}

export default ImageServiceCore