import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MonitoringService } from '../../MonitoringService';
import { LandVerificationServiceFactory } from '../../ServiceFactory';
import { DocumentAuthService } from '../../../document-auth/DocumentAuthService';

// Mock database and logger
vi.mock('../../../lib/database', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('../../../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('MonitoringService Integration', () => {
  let monitoringService: MonitoringService;
  let mockDocumentAuthService: any;

  beforeEach(async () => {
    // Create mock DocumentAuthService
    mockDocumentAuthService = {
      initialize: vi.fn().mockResolvedValue(undefined),
      verifyDocument: vi.fn().mockResolvedValue({
        isValid: true,
        confidence: 0.9,
        issues: []
      }),
      shutdown: vi.fn().mockResolvedValue(undefined)
    };

    // Create services through factory
    const services = await LandVerificationServiceFactory.createService(
      mockDocumentAuthService,
      {
        enableDocumentIntegration: true,
        monitoringDefaults: {
          frequency: 'weekly',
          alertThresholds: {
            government_changes: 0.7,
            legal_disputes: 0.8
          }
        }
      }
    );

    monitoringService = services.monitoringService;
  });

  afterEach(async () => {
    await LandVerificationServiceFactory.shutdownService();
  });

  it('should be properly integrated with ServiceFactory', () => {
    expect(monitoringService).toBeInstanceOf(MonitoringService);
    expect(LandVerificationServiceFactory.getMonitoringService()).toBe(monitoringService);
  });

  it('should initialize successfully', async () => {
    // Service should already be initialized through factory
    expect(monitoringService).toBeDefined();
  });

  it('should emit events that can be listened to', (done) => {
    const testEvent = { propertyId: '1', sessionId: '1', monitoringSessions: [] };
    
    monitoringService.on('monitoring_scheduled', (event) => {
      expect(event).toEqual(testEvent);
      done();
    });

    monitoringService.emit('monitoring_scheduled', testEvent);
  });

  it('should handle service lifecycle properly', async () => {
    // Test that service can be shut down without errors
    await expect(LandVerificationServiceFactory.shutdownService()).resolves.not.toThrow();
    
    // After shutdown, getInstance should return null
    expect(LandVerificationServiceFactory.getMonitoringService()).toBeNull();
  });
});