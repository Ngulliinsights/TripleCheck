/**
 * Example integration of error handling with Government API service
 * Demonstrates retry policies, fallback mechanisms, and graceful degradation
 */

import { errorHandlingService } from '../ErrorHandlingService';
import { fallbackManager } from '../FallbackManager';
import { retryPolicyManager } from '../RetryPolicyManager';
import { auditLogger, AuditSeverity } from '../AuditLogger';
import { logger } from '../../../logger';
import { 
  ExternalServiceError, 
  ErrorCode, 
  HttpStatusCode 
} from '../../../../src/shared/utils/errors';

// Mock government API responses
interface RegistrySearchResult {
  titleNumber: string;
  owner: string;
  registrationDate: string;
  status: 'active' | 'inactive' | 'disputed';
  encumbrances: string[];
}

interface CourtRecordResult {
  caseNumber: string;
  parties: string[];
  status: string;
  filingDate: string;
  summary: string;
}

export class GovernmentApiService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.setupErrorHandling();
  }

  /**
   * Setup error handling for government API service
   */
  private setupErrorHandling(): void {
    // Register fallback providers
    this.registerFallbackProviders();
    
    // Configure custom retry policy for government APIs
    retryPolicyManager.registerConfig('government-registry', {
      maxAttempts: 5,
      baseDelay: 3000,
      maxDelay: 60000,
      backoffStrategy: 'exponential',
      jitter: true,
      retryableErrors: [
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'EAI_AGAIN',
        'EXTERNAL_SERVICE_TIMEOUT',
        'EXTERNAL_SERVICE_UNAVAILABLE'
      ],
      retryableStatusCodes: [408, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524]
    });

    logger.info('Government API error handling configured', 'GOV_API_SERVICE');
  }

  /**
   * Register fallback providers for government services
   */
  private registerFallbackProviders(): void {
    // Cached registry data fallback
    fallbackManager.registerFallback('government-registry', {
      name: 'cached-registry-data',
      execute: async () => {
        return this.getCachedRegistryData();
      },
      healthCheck: async () => {
        return this.checkCacheHealth();
      },
      config: {
        enabled: true,
        priority: 1,
        timeout: 2000,
        healthCheckInterval: 60000,
        maxFailures: 2,
        recoveryTime: 300000
      }
    });

    // Alternative registry endpoint fallback
    fallbackManager.registerFallback('government-registry', {
      name: 'alternative-registry-endpoint',
      execute: async () => {
        return this.queryAlternativeRegistryEndpoint();
      },
      healthCheck: async () => {
        return this.checkAlternativeEndpointHealth();
      },
      config: {
        enabled: true,
        priority: 2,
        timeout: 10000,
        healthCheckInterval: 120000,
        maxFailures: 3,
        recoveryTime: 600000
      }
    });

    // Manual verification escalation fallback
    fallbackManager.registerFallback('government-registry', {
      name: 'manual-verification-escalation',
      execute: async () => {
        return this.escalateToManualVerification();
      },
      healthCheck: async () => {
        return true; // Manual escalation is always available
      },
      config: {
        enabled: true,
        priority: 3,
        timeout: 5000,
        healthCheckInterval: 0, // No health checks needed
        maxFailures: 1,
        recoveryTime: 0
      }
    });

    logger.info('Government API fallback providers registered', 'GOV_API_SERVICE');
  }

  /**
   * Search land registry with comprehensive error handling
   */
  async searchLandRegistry(
    titleNumber: string,
    sessionId?: string,
    propertyId?: string,
    userId?: string
  ): Promise<RegistrySearchResult> {
    const context = {
      service: 'government-registry',
      operation: 'search_land_registry',
      sessionId,
      propertyId,
      userId,
      metadata: { titleNumber }
    };

    const degradationContext = {
      availableServices: ['government-api', 'cached-data'],
      failedServices: [],
      partialData: { titleNumber },
      userRequirements: ['ownership-verification'],
      criticalityLevel: 'high' as const
    };

    const result = await errorHandlingService.executeWithErrorHandling(
      () => this.performRegistrySearch(titleNumber),
      context,
      degradationContext
    );

    if (result.success) {
      // Log successful search
      await auditLogger.logEvent({
        eventType: 'government_api_call' as any,
        category: 'integration' as any,
        severity: AuditSeverity.LOW,
        userId,
        sessionId,
        propertyId,
        service: 'government-registry',
        operation: 'search_land_registry',
        status: 'completed',
        details: {
          titleNumber,
          handlingStrategy: result.handlingStrategy,
          warnings: result.warnings
        },
        metadata: { correlationId: result.correlationId }
      });

      return result.data!;
    } else {
      // Log failed search
      await auditLogger.logGovernmentApiCall(
        'government-registry',
        'search_land_registry',
        'failed',
        0,
        sessionId,
        result.error,
        { titleNumber, correlationId: result.correlationId }
      );

      throw result.error!;
    }
  }

  /**
   * Search court records with error handling
   */
  async searchCourtRecords(
    propertyId: string,
    ownerNames: string[],
    sessionId?: string,
    userId?: string
  ): Promise<CourtRecordResult[]> {
    const context = {
      service: 'court-records',
      operation: 'search_court_records',
      sessionId,
      propertyId,
      userId,
      metadata: { ownerNames }
    };

    const degradationContext = {
      availableServices: ['court-records-api'],
      failedServices: [],
      partialData: { propertyId, ownerNames },
      userRequirements: ['legal-history-check'],
      criticalityLevel: 'medium' as const
    };

    const result = await errorHandlingService.executeWithErrorHandling(
      () => this.performCourtRecordsSearch(propertyId, ownerNames),
      context,
      degradationContext
    );

    if (result.success) {
      return result.data!;
    } else {
      throw result.error!;
    }
  }

  /**
   * Perform actual registry search (primary operation)
   */
  private async performRegistrySearch(titleNumber: string): Promise<RegistrySearchResult> {
    try {
      logger.info(
        `Searching land registry for title: ${titleNumber}`,
        'GOV_API_SERVICE',
        { titleNumber }
      );

      // Simulate API call
      const response = await this.makeApiCall(`/registry/search/${titleNumber}`);
      
      if (!response.success) {
        throw new ExternalServiceError(
          `Registry search failed: ${response.error}`,
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          HttpStatusCode.BAD_GATEWAY,
          { titleNumber, response }
        );
      }

      return response.data;

    } catch (error) {
      logger.error(
        `Registry search failed for title: ${titleNumber}`,
        'GOV_API_SERVICE',
        { titleNumber, error: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Perform court records search (primary operation)
   */
  private async performCourtRecordsSearch(
    propertyId: string,
    ownerNames: string[]
  ): Promise<CourtRecordResult[]> {
    try {
      logger.info(
        `Searching court records for property: ${propertyId}`,
        'GOV_API_SERVICE',
        { propertyId, ownerNames }
      );

      const response = await this.makeApiCall('/court-records/search', {
        method: 'POST',
        body: { propertyId, ownerNames }
      });

      if (!response.success) {
        throw new ExternalServiceError(
          `Court records search failed: ${response.error}`,
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          HttpStatusCode.BAD_GATEWAY,
          { propertyId, ownerNames, response }
        );
      }

      return response.data;

    } catch (error) {
      logger.error(
        `Court records search failed for property: ${propertyId}`,
        'GOV_API_SERVICE',
        { propertyId, error: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Fallback: Get cached registry data
   */
  private async getCachedRegistryData(): Promise<RegistrySearchResult> {
    logger.info('Using cached registry data fallback', 'GOV_API_SERVICE');
    
    // Simulate cached data retrieval
    return {
      titleNumber: 'CACHED-001',
      owner: 'Cached Owner Data',
      registrationDate: '2023-01-01',
      status: 'active',
      encumbrances: ['Data from cache - may be outdated']
    };
  }

  /**
   * Fallback: Query alternative registry endpoint
   */
  private async queryAlternativeRegistryEndpoint(): Promise<RegistrySearchResult> {
    logger.info('Using alternative registry endpoint fallback', 'GOV_API_SERVICE');
    
    // Simulate alternative endpoint call
    return {
      titleNumber: 'ALT-001',
      owner: 'Alternative Endpoint Data',
      registrationDate: '2023-01-01',
      status: 'active',
      encumbrances: ['Data from alternative source']
    };
  }

  /**
   * Fallback: Escalate to manual verification
   */
  private async escalateToManualVerification(): Promise<RegistrySearchResult> {
    logger.warn('Escalating to manual verification', 'GOV_API_SERVICE');
    
    // Create manual verification task
    return {
      titleNumber: 'MANUAL-001',
      owner: 'MANUAL VERIFICATION REQUIRED',
      registrationDate: 'PENDING',
      status: 'active',
      encumbrances: ['Manual verification escalated - expert review required']
    };
  }

  /**
   * Check cache health
   */
  private async checkCacheHealth(): Promise<boolean> {
    try {
      // Simulate cache health check
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check alternative endpoint health
   */
  private async checkAlternativeEndpointHealth(): Promise<boolean> {
    try {
      // Simulate alternative endpoint health check
      const response = await this.makeApiCall('/health', { timeout: 5000 });
      return response.success;
    } catch {
      return false;
    }
  }

  /**
   * Make API call with timeout and error handling
   */
  private async makeApiCall(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      timeout?: number;
    } = {}
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const { method = 'GET', body, timeout = 30000 } = options;

    // Simulate API call with potential failures
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      // Simulate various response scenarios
      const random = Math.random();
      
      setTimeout(() => {
        clearTimeout(timer);
        
        if (random < 0.1) {
          // 10% chance of connection error
          reject(new Error('ECONNRESET'));
        } else if (random < 0.2) {
          // 10% chance of timeout
          reject(new Error('ETIMEDOUT'));
        } else if (random < 0.3) {
          // 10% chance of service unavailable
          const error = new Error('Service Unavailable');
          (error as any).statusCode = 503;
          reject(error);
        } else {
          // 70% chance of success
          resolve({
            success: true,
            data: this.generateMockData(endpoint, body)
          });
        }
      }, Math.random() * 2000); // Random delay up to 2 seconds
    });
  }

  /**
   * Generate mock data for testing
   */
  private generateMockData(endpoint: string, body?: any): any {
    if (endpoint.includes('/registry/search/')) {
      return {
        titleNumber: 'LR-123456',
        owner: 'John Doe',
        registrationDate: '2020-01-15',
        status: 'active',
        encumbrances: []
      };
    }

    if (endpoint.includes('/court-records/search')) {
      return [
        {
          caseNumber: 'HC-2023-001',
          parties: ['John Doe', 'Jane Smith'],
          status: 'Settled',
          filingDate: '2023-03-15',
          summary: 'Property boundary dispute resolved'
        }
      ];
    }

    return { message: 'Mock response' };
  }

  /**
   * Create error-handled wrapper functions for common operations
   */
  createErrorHandledWrappers() {
    return {
      searchLandRegistry: errorHandlingService.createErrorHandledFunction(
        (titleNumber: string) => this.performRegistrySearch(titleNumber),
        { service: 'government-registry', operation: 'search_land_registry' },
        (titleNumber: string) => ({
          availableServices: ['government-api'],
          failedServices: [],
          partialData: { titleNumber },
          userRequirements: ['ownership-verification'],
          criticalityLevel: 'high' as const
        })
      ),

      searchCourtRecords: errorHandlingService.createErrorHandledFunction(
        (propertyId: string, ownerNames: string[]) => 
          this.performCourtRecordsSearch(propertyId, ownerNames),
        { service: 'court-records', operation: 'search_court_records' },
        (propertyId: string, ownerNames: string[]) => ({
          availableServices: ['court-records-api'],
          failedServices: [],
          partialData: { propertyId, ownerNames },
          userRequirements: ['legal-history-check'],
          criticalityLevel: 'medium' as const
        })
      )
    };
  }
}

// Example usage
export async function demonstrateGovernmentApiErrorHandling() {
  const govApiService = new GovernmentApiService(
    'https://api.government.ke',
    'your-api-key'
  );

  try {
    // Search with full error handling
    const registryResult = await govApiService.searchLandRegistry(
      'LR-123456',
      'session-123',
      'property-456',
      'user-789'
    );

    console.log('Registry search result:', registryResult);

    // Search court records
    const courtRecords = await govApiService.searchCourtRecords(
      'property-456',
      ['John Doe', 'Jane Smith'],
      'session-123',
      'user-789'
    );

    console.log('Court records:', courtRecords);

    // Use error-handled wrapper functions
    const wrappers = govApiService.createErrorHandledWrappers();
    const wrappedResult = await wrappers.searchLandRegistry('LR-789012');
    
    console.log('Wrapped function result:', wrappedResult);

  } catch (error) {
    console.error('Government API operation failed:', error);
  }
}