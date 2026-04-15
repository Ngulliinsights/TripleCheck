/**
 * HuggingFace API Client
 *
 * Features:
 * - Typed, domain-specific error hierarchy
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern for service resilience
 * - Fallback to mock client on service degradation
 * - Request metrics and health reporting
 */

import {
  CircuitBreaker,
  CircuitBreakerState,
} from '../../../server/infrastructure/rate-limiting/CircuitBreaker'
import { BaseError } from '../error-handling/errors/base-error'
import { logger as loggingService } from '../../../server/infrastructure/monitoring/logger'
import { apiClient } from './unified-api-client'
import { mockHuggingFaceClient } from './mock-huggingface-client'
import {
  HuggingFaceConfig,
  DocumentAnalysisResult,
  ImageAnalysisResult,
  TextClassificationResult,
  TranslationResult,
} from './huggingface-api-client'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface HuggingFaceClientConfig extends HuggingFaceConfig {
  // Retry
  maxRetries?: number
  initialRetryDelay?: number
  maxRetryDelay?: number
  retryMultiplier?: number

  // Circuit breaker
  circuitBreakerEnabled?: boolean
  failureThreshold?: number
  successThreshold?: number
  circuitBreakerTimeout?: number

  // Fallback
  enableFallback?: boolean
  fallbackToMock?: boolean

  // Observability
  enableMetrics?: boolean
  enableDetailedLogging?: boolean
}

/** All fields required internally; apiKey remains optional at the type level. */
type ResolvedConfig = Required<Omit<HuggingFaceClientConfig, 'apiKey'>> &
  Pick<HuggingFaceClientConfig, 'apiKey'>

const DEFAULT_CONFIG: ResolvedConfig = {
  baseUrl: 'https://api-inference.huggingface.co',
  maxRetries: 3,
  initialRetryDelay: 1_000,
  maxRetryDelay: 10_000,
  retryMultiplier: 2,
  circuitBreakerEnabled: true,
  failureThreshold: 5,
  successThreshold: 2,
  circuitBreakerTimeout: 60_000,
  enableFallback: true,
  fallbackToMock: true,
  enableMetrics: true,
  enableDetailedLogging: true,
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class AIServiceError extends Error implements BaseError {
  readonly code = 'AI_SERVICE_ERROR';
  readonly details: Record<string, unknown> | undefined;
  readonly timestamp: string;
  readonly correlationId: string | undefined;
  readonly cause?: Error;
  readonly retryable: boolean;

  constructor(
    message: string,
    public readonly service: string,
    public readonly operation: string,
    public readonly statusCode?: number,
    options: {
      cause?: Error
      retryable?: boolean
      details?: Record<string, unknown>
    } = {}
  ) {
    super(message);
    this.name = 'AIServiceError';
    this.timestamp = new Date().toISOString();
    this.correlationId = undefined;
    this.cause = options.cause;
    this.retryable = options.retryable ?? true;
    this.details = { service, operation, statusCode, ...options.details };
    Object.setPrototypeOf(this, AIServiceError.prototype);
  }
}

export class AIServiceTimeoutError extends AIServiceError {
  constructor(service: string, operation: string, timeout: number) {
    super(`AI service timed out after ${timeout}ms`, service, operation, 408, {
      retryable: true,
      details: { timeout },
    })
  }
}

export class AIServiceRateLimitError extends AIServiceError {
  constructor(service: string, operation: string, retryAfter?: number) {
    super('AI service rate limit exceeded', service, operation, 429, {
      retryable: true,
      details: { retryAfter },
    })
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Derives a numeric HTTP status code from a plain error string returned by
 * the unified API client, without relying on brittle substring matching for
 * control flow. Unrecognised strings fall through to 500.
 */
function statusCodeFromMessage(message: string | undefined): number {
  if (!message) return 500
  const match = message.match(/\b(4\d{2}|5\d{2})\b/)
  return match ? parseInt(match[1], 10) : 500
}

function isRetryableStatus(code: number): boolean {
  return code !== 400 && code !== 401 && code !== 403 && code !== 404
}

// ---------------------------------------------------------------------------
// Retry manager
// ---------------------------------------------------------------------------

interface RetryConfig {
  maxRetries: number
  initialRetryDelay: number
  maxRetryDelay: number
  retryMultiplier: number
}

class RetryManager {
  constructor(private readonly cfg: RetryConfig) {}

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context: { service: string; operation: string }
  ): Promise<T> {
    // Initialised to a sentinel so TypeScript is satisfied and we always have
    // a cause to attach to the exhaustion error.
    let lastError: Error = new Error(`${operationName} failed before first attempt`)
    let delay = this.cfg.initialRetryDelay

    for (let attempt = 0; attempt <= this.cfg.maxRetries; attempt++) {
      if (attempt > 0) {
        loggingService.info(
          `Retrying ${operationName}`,
          'HuggingFaceClient',
          { attempt, delayMs: delay, ...context }
        )
        await sleep(delay)
        delay = Math.min(delay * this.cfg.retryMultiplier, this.cfg.maxRetryDelay)
      }

      try {
        return await operation()
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))

        if (err instanceof AIServiceError && !err.retryable) throw err

        if (attempt < this.cfg.maxRetries) {
          loggingService.warn(
            `${operationName} attempt ${attempt + 1} failed`,
            'HuggingFaceClient',
            { error: lastError.message, nextRetryInMs: delay, ...context }
          )
        }
      }
    }

    throw new AIServiceError(
      `${operationName} failed after ${this.cfg.maxRetries + 1} attempt(s)`,
      context.service,
      context.operation,
      undefined,
      {
        cause: lastError,
        retryable: false,
        details: { attempts: this.cfg.maxRetries + 1 },
      }
    )
  }
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

interface ClientMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  fallbackRequests: number
  /** Rolling average over all completed requests (success + failure). */
  averageResponseTime: number
  lastRequestTime?: Date
  lastErrorMessage?: string
}

function createMetrics(): ClientMetrics {
  return {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    fallbackRequests: 0,
    averageResponseTime: 0,
  }
}

// ---------------------------------------------------------------------------
// Main client
// ---------------------------------------------------------------------------

export class HuggingFaceApiClient {
  private readonly config: ResolvedConfig
  private readonly circuitBreaker: CircuitBreaker
  private readonly retryManager: RetryManager
  private readonly metrics: ClientMetrics

  constructor(config: HuggingFaceClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    this.circuitBreaker = new CircuitBreaker(
      'HuggingFaceAPI',
      {
        failureThreshold: this.config.failureThreshold,
        successThreshold: this.config.successThreshold,
        requestTimeout: this.config.circuitBreakerTimeout,
      }
    )

    this.retryManager = new RetryManager({
      maxRetries: this.config.maxRetries,
      initialRetryDelay: this.config.initialRetryDelay,
      maxRetryDelay: this.config.maxRetryDelay,
      retryMultiplier: this.config.retryMultiplier,
    })

    this.metrics = createMetrics()
    this.setupCircuitBreakerListeners()

    loggingService.info(
      'HuggingFace API client initialised',
      'HuggingFaceClient',
      {
        maxRetries: this.config.maxRetries,
        circuitBreakerEnabled: this.config.circuitBreakerEnabled,
        enableFallback: this.config.enableFallback,
      }
    )
  }

  // -------------------------------------------------------------------------
  // Private infrastructure
  // -------------------------------------------------------------------------

  private setupCircuitBreakerListeners(): void {
    // Circuit breaker doesn't have event listeners in this implementation
    // Commenting out for now
    /*
    if (typeof this.circuitBreaker.on !== 'function') return

    this.circuitBreaker.on('open', (data: { metrics: unknown }) => {
      loggingService.error(
        'HuggingFace API circuit breaker opened',
        'HuggingFaceClient',
        { metrics: data.metrics }
      )
    })

    this.circuitBreaker.on('half-open', (data: { metrics: unknown }) => {
      loggingService.info(
        'HuggingFace API circuit breaker half-open',
        'HuggingFaceClient',
        { metrics: data.metrics }
      )
    })

    this.circuitBreaker.on('close', (data: { metrics: unknown }) => {
      loggingService.info(
        'HuggingFace API circuit breaker closed',
        'HuggingFaceClient',
        { metrics: data.metrics }
      )
    })
    */
  }

  private updateMetrics(success: boolean, responseTimeMs: number, errorMessage?: string): void {
    if (!this.config.enableMetrics) return

    this.metrics.lastRequestTime = new Date()

    // Running average over ALL completed requests, not just successful ones.
    const completed = this.metrics.successfulRequests + this.metrics.failedRequests
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * completed + responseTimeMs) / (completed + 1)

    if (success) {
      this.metrics.successfulRequests++
    } else {
      this.metrics.failedRequests++
      this.metrics.lastErrorMessage = errorMessage
    }
  }

  private shouldUseFallback(error: unknown): boolean {
    if (!this.config.enableFallback) return false

    // Check if error has BaseError properties
    if (error && typeof error === 'object' && 'code' in error) {
      const err = error as { code: string }
      if (
        err.code === 'CIRCUIT_BREAKER_OPEN' ||
        err.code === 'CIRCUIT_BREAKER_FAILURE'
      ) return true
    }

    const resolvedStatus =
      error instanceof AIServiceError
        ? error.statusCode
        : error && typeof error === 'object' && 'cause' in error && error.cause instanceof AIServiceError
        ? error.cause.statusCode
        : undefined

    return resolvedStatus === 500 || resolvedStatus === 503
  }

  private async executeFallback<T>(
    endpoint: string,
    data: unknown,
    operationName: string
  ): Promise<T> {
    this.metrics.fallbackRequests++

    loggingService.warn(
      `Using fallback for ${operationName}`,
      'HuggingFaceClient',
      { endpoint, fallbackType: this.config.fallbackToMock ? 'mock' : 'none' }
    )

    if (this.config.fallbackToMock) {
      return this.mapToMockClient<T>(endpoint, data, operationName)
    }

    throw new AIServiceError(
      'Service unavailable and no fallback configured',
      'HuggingFace',
      operationName,
      503,
      { retryable: true }
    )
  }

  private async mapToMockClient<T>(
    endpoint: string,
    data: unknown,
    operationName: string
  ): Promise<T> {
    const payload = data as Record<string, any>

    if (endpoint.includes('trocr-base-printed'))
      return mockHuggingFaceClient.analyzePropertyDocument(payload.inputs) as T

    if (endpoint.includes('vit-base-patch16-224'))
      return mockHuggingFaceClient.analyzeLandImage(payload.inputs) as T

    if (endpoint.includes('legal-bert') || endpoint.includes('bart-large-mnli'))
      return mockHuggingFaceClient.classifyLegalDocument(payload.inputs) as T

    if (endpoint.includes('twitter-roberta-base-sentiment'))
      return mockHuggingFaceClient.analyzePropertyReviewSentiment(payload.inputs) as T

    if (endpoint.includes('opus-mt-') || endpoint.includes('mbart-large'))
      return mockHuggingFaceClient.translateText(payload.inputs, 'en') as T

    if (endpoint.includes('roberta-base-squad2'))
      return mockHuggingFaceClient.extractPropertyInfo(
        payload.inputs.context,
        payload.inputs.question
      ) as T

    if (endpoint.includes('bart-large-cnn'))
      return mockHuggingFaceClient.summarizePropertyDocument(payload.inputs) as T

    throw new AIServiceError(
      `No mock fallback available for ${operationName}`,
      'HuggingFace',
      operationName,
      503,
      { retryable: false }
    )
  }

  private async makeRequest<T>(
    endpoint: string,
    data: unknown,
    options: { timeoutMs?: number; operationName?: string } = {}
  ): Promise<T> {
    const startTime = Date.now()
    const operationName = options.operationName ?? 'APIRequest'
    const context = { service: 'HuggingFace', operation: operationName }

    this.metrics.totalRequests++

    const executeCore = async (): Promise<T> => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (this.config.apiKey) headers.Authorization = `Bearer ${this.config.apiKey}`

      const response = await apiClient.post<T>(
        `${this.config.baseUrl}${endpoint}`,
        data,
        { headers, timeout: options.timeoutMs ?? 30_000, useCache: false }
      )

      if (!response.success) {
        const statusCode = statusCodeFromMessage(response.error)
        throw new AIServiceError(
          response.error ?? 'Unknown API error',
          'HuggingFace',
          operationName,
          statusCode,
          { retryable: isRetryableStatus(statusCode) }
        )
      }

      return response.data as T
    }

    const withRetry = () =>
      this.retryManager.executeWithRetry(executeCore, operationName, context)

    try {
      const result = this.config.circuitBreakerEnabled
        ? await this.circuitBreaker.execute(withRetry)
        : await withRetry()

      const responseTimeMs = Date.now() - startTime
      this.updateMetrics(true, responseTimeMs)

      if (this.config.enableDetailedLogging) {
        loggingService.info(
          `${operationName} completed`,
          'HuggingFaceClient',
          { responseTimeMs, endpoint }
        )
      }

      return result
    } catch (error) {
      const responseTimeMs = Date.now() - startTime
      const message = error instanceof Error ? error.message : String(error)
      this.updateMetrics(false, responseTimeMs, message)

      if (this.shouldUseFallback(error)) {
        return this.executeFallback<T>(endpoint, data, operationName)
      }

      throw error
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  async analyzePropertyDocument(
    imageBase64: string,
    _documentType: 'deed' | 'survey' | 'permit' | 'contract' = 'deed'
  ): Promise<DocumentAnalysisResult> {
    const result = await this.makeRequest<Array<{ generated_text: string }>>(
      '/models/microsoft/trocr-base-printed',
      { inputs: imageBase64 },
      { operationName: 'analyzePropertyDocument', timeoutMs: 45_000 }
    )

    if (!Array.isArray(result) || !result[0]?.generated_text) {
      throw new AIServiceError(
        'Unexpected response shape from document analysis',
        'HuggingFace',
        'analyzePropertyDocument',
        500,
        { retryable: false, details: { received: typeof result } }
      )
    }

    return { text: result[0].generated_text, confidence: 0.85, entities: [] }
  }

  async analyzeLandImage(imageBase64: string): Promise<ImageAnalysisResult> {
    const result = await this.makeRequest<Array<{ label: string; score: number }>>(
      '/models/google/vit-base-patch16-224',
      { inputs: imageBase64 },
      { operationName: 'analyzeLandImage', timeoutMs: 30_000 }
    )

    if (!Array.isArray(result)) {
      throw new AIServiceError(
        'Unexpected response shape from image analysis',
        'HuggingFace',
        'analyzeLandImage',
        500,
        { retryable: false, details: { received: typeof result } }
      )
    }

    const labels = result.map(({ label, score }) => ({ label, confidence: score }))
    return {
      labels,
      description: `Land appears to contain: ${labels
        .slice(0, 3)
        .map((l) => l.label)
        .join(', ')}`,
    }
  }

  async classifyLegalDocument(text: string): Promise<TextClassificationResult> {
    const result = await this.makeRequest<Array<Array<{ label: string; score: number }>>>(
      '/models/nlpaueb/legal-bert-base-uncased',
      { inputs: text },
      { operationName: 'classifyLegalDocument', timeoutMs: 20_000 }
    )

    const top = result?.[0]?.[0]
    if (!top) {
      throw new AIServiceError(
        'Unexpected response shape from document classification',
        'HuggingFace',
        'classifyLegalDocument',
        500,
        { retryable: false }
      )
    }

    return { label: top.label, confidence: top.score }
  }

  async analyzePropertyReviewSentiment(review: string): Promise<TextClassificationResult> {
    // The HuggingFace sentiment endpoint returns Array<Array<{label, score}>>.
    const result = await this.makeRequest<Array<Array<{ label: string; score: number }>>>(
      '/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
      { inputs: review },
      { operationName: 'analyzePropertyReviewSentiment', timeoutMs: 15_000 }
    )

    const top = result?.[0]?.[0]
    if (!top) {
      throw new AIServiceError(
        'Unexpected response shape from sentiment analysis',
        'HuggingFace',
        'analyzePropertyReviewSentiment',
        500,
        { retryable: false }
      )
    }

    return { label: top.label, confidence: top.score }
  }

  async translateText(
    text: string,
    targetLanguage: string = 'en',
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    const model = sourceLanguage
      ? `Helsinki-NLP/opus-mt-${sourceLanguage}-${targetLanguage}`
      : 'facebook/mbart-large-50-many-to-many-mmt'

    return this.makeRequest<TranslationResult>(
      `/models/${model}`,
      { inputs: text },
      { operationName: 'translateText', timeoutMs: 25_000 }
    )
  }

  async extractPropertyInfo(
    propertyDescription: string,
    question: string
  ): Promise<{ answer: string; confidence: number }> {
    return this.makeRequest<{ answer: string; confidence: number }>(
      '/models/deepset/roberta-base-squad2',
      { inputs: { question, context: propertyDescription } },
      { operationName: 'extractPropertyInfo', timeoutMs: 20_000 }
    )
  }

  async summarizePropertyDocument(text: string): Promise<string> {
    const result = await this.makeRequest<Array<{ summary_text: string }>>(
      '/models/facebook/bart-large-cnn',
      { inputs: text, parameters: { max_length: 150, min_length: 50 } },
      { operationName: 'summarizePropertyDocument', timeoutMs: 30_000 }
    )

    const summary = result?.[0]?.summary_text
    if (!summary) {
      throw new AIServiceError(
        'Unexpected response shape from document summarization',
        'HuggingFace',
        'summarizePropertyDocument',
        500,
        { retryable: false }
      )
    }

    return summary
  }

  /**
   * Detects fraud indicators in a document.
   *
   * NOTE: A failed classification is re-thrown as a typed error rather than
   * silently returning a "low-risk" default — callers should decide how to
   * handle degraded fraud-detection, not this method.
   */
  async detectFraudIndicators(documentText: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high'
    indicators: string[]
    confidence: number
  }> {
    const candidateLabels = [
      'fraudulent_document',
      'forged_signature',
      'altered_dates',
      'suspicious_pricing',
      'fake_credentials',
    ]

    const classification = await this.makeRequest<{ labels: string[]; scores: number[] }>(
      '/models/facebook/bart-large-mnli',
      { inputs: documentText, parameters: { candidate_labels: candidateLabels } },
      { operationName: 'detectFraudIndicators', timeoutMs: 25_000 }
    )

    if (!classification?.labels?.length || !classification?.scores?.length) {
      throw new AIServiceError(
        'Unexpected response shape from fraud detection',
        'HuggingFace',
        'detectFraudIndicators',
        500,
        { retryable: false }
      )
    }

    const topLabel = classification.labels[0]
    const confidence = classification.scores[0]
    const riskLevel: 'low' | 'medium' | 'high' =
      confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low'

    return {
      riskLevel,
      indicators: confidence > 0.4 ? [topLabel] : [],
      confidence,
    }
  }

  // -------------------------------------------------------------------------
  // Observability
  // -------------------------------------------------------------------------

  getMetrics(): Readonly<ClientMetrics> {
    return { ...this.metrics }
  }

  getCircuitBreakerState(): CircuitBreakerState {
    return this.circuitBreaker.getStats().state
  }

  getCircuitBreakerMetrics() {
    return this.circuitBreaker.getStats()
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    circuitBreakerState: CircuitBreakerState
    metrics: Readonly<ClientMetrics>
  }> {
    const circuitBreakerState = this.getCircuitBreakerState()
    const metrics = this.getMetrics()

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    if (circuitBreakerState === CircuitBreakerState.OPEN) {
      status = 'unhealthy'
    } else if (
      circuitBreakerState === CircuitBreakerState.HALF_OPEN ||
      (metrics.successfulRequests > 0 &&
        metrics.fallbackRequests > metrics.successfulRequests * 0.1)
    ) {
      status = 'degraded'
    }

    return { status, circuitBreakerState, metrics }
  }
}

// ---------------------------------------------------------------------------
// Singleton + convenience facade
// ---------------------------------------------------------------------------

export const huggingFaceClient = new HuggingFaceApiClient()

export const landVerificationAI = {
  analyzePropertyDocument(
    imageBase64: string,
    documentType?: 'deed' | 'survey' | 'permit' | 'contract'
  ) {
    return huggingFaceClient.analyzePropertyDocument(imageBase64, documentType)
  },

  analyzeLandImage(imageBase64: string) {
    return huggingFaceClient.analyzeLandImage(imageBase64)
  },

  classifyLegalDocument(text: string) {
    return huggingFaceClient.classifyLegalDocument(text)
  },

  analyzePropertyReview(review: string) {
    return huggingFaceClient.analyzePropertyReviewSentiment(review)
  },

  translatePropertyDescription(text: string, targetLanguage: string) {
    return huggingFaceClient.translateText(text, targetLanguage)
  },

  extractPropertyDetails(description: string, question: string) {
    return huggingFaceClient.extractPropertyInfo(description, question)
  },

  summarizeDocument(text: string) {
    return huggingFaceClient.summarizePropertyDocument(text)
  },

  checkDocumentAuthenticity(text: string) {
    return huggingFaceClient.detectFraudIndicators(text)
  },

  getHealthStatus() {
    return huggingFaceClient.healthCheck()
  },

  getMetrics() {
    return huggingFaceClient.getMetrics()
  },
} as const

// Backward compatibility exports
export const enhancedHuggingFaceClient = huggingFaceClient
export const enhancedLandVerificationAI = landVerificationAI
export type EnhancedHuggingFaceConfig = HuggingFaceClientConfig