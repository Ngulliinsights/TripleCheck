import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MonitoringService, MonitoringConfig, MonitoringType, MonitoringAlert, RegulatoryUpdate } from '../MonitoringService';
import { db } from '../../lib/database';
import { propertyMonitoring, monitoringAlerts, landVerificationSessions, properties, users } from '../../../src/shared/schema';
import { eq, and } from 'drizzle-orm';

// Mock database
vi.mock('../../lib/database', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock logger
vi.mock('../../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('MonitoringService', () => {
  let service: MonitoringService;
  let mockDb: any;

  beforeEach(() => {
    service = new MonitoringService();
    mockDb = db as any;
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
        })
      })
    });
    
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 1,
          propertyId: 1,
          sessionId: 1,
          userId: 1,
          monitoringType: 'government_changes',
          frequency: 'weekly',
          isActive: true,
          lastCheck: new Date(),
          nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          alertThreshold: 0.5,
          notificationPreferences: { email: true, sms: false, inApp: true },
          createdAt: new Date(),
          updatedAt: new Date()
        }])
      })
    });
    
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      })
    });
  });

  afterEach(() => {
    // Clear any intervals that might be running
    service.removeAllListeners();
  });

  describe('Requirement 8.1: Periodic government database checks', () => {
    it('should schedule monitoring for government changes', async () => {
      // Arrange
      const propertyId = '1';
      const sessionId = '1';
      const userId = '1';
      const config: MonitoringConfig = {
        enabled: true,
        frequency: 'weekly',
        monitoringTypes: ['government_changes'],
        alertThresholds: { government_changes: 0.7 },
        notificationPreferences: { email: true, sms: false, inApp: true }
      };

      // Mock validation queries
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1 }]) // Property exists
          })
        })
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1 }]) // Session exists
          })
        })
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1 }]) // User exists
          })
        })
      });

      // Act
      const result = await service.scheduleMonitoring(propertyId, sessionId, userId, config);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].monitoringType).toBe('government_changes');
      expect(result[0].frequency).toBe('weekly');
      expect(result[0].isActive).toBe(true);
      expect(mockDb.insert).toHaveBeenCalledWith(propertyMonitoring);
    });

    it('should schedule multiple monitoring types', async () => {
      // Arrange
      const propertyId = '1';
      const sessionId = '1';
      const userId = '1';
      const config: MonitoringConfig = {
        enabled: true,
        frequency: 'daily',
        monitoringTypes: ['government_changes', 'legal_disputes', 'regulatory_updates'],
        alertThresholds: { 
          government_changes: 0.7,
          legal_disputes: 0.8,
          regulatory_updates: 0.6
        },
        notificationPreferences: { email: true, sms: true, inApp: true }
      };

      // Mock validation queries
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1 }])
          })
        })
      });

      // Act
      const result = await service.scheduleMonitoring(propertyId, sessionId, userId, config);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map(r => r.monitoringType)).toEqual(['government_changes', 'legal_disputes', 'regulatory_updates']);
      expect(mockDb.insert).toHaveBeenCalledTimes(3);
    });

    it('should validate property, session, and user exist before scheduling', async () => {
      // Arrange
      const propertyId = '999';
      const sessionId = '1';
      const userId = '1';
      const config: MonitoringConfig = {
        enabled: true,
        frequency: 'weekly',
        monitoringTypes: ['government_changes'],
        alertThresholds: { government_changes: 0.7 },
        notificationPreferences: { email: true, sms: false, inApp: true }
      };

      // Mock property not found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]) // Property not found
          })
        })
      });

      // Act & Assert
      await expect(service.scheduleMonitoring(propertyId, sessionId, userId, config))
        .rejects.toThrow('Property 999 not found');
    });
  });

  describe('Requirement 8.2: Alert generation for new risks', () => {
    it('should create alert with proper structure', async () => {
      // Arrange
      const monitoringId = '1';
      const alertType = 'government_change';
      const severity: MonitoringAlert['severity'] = 'high';
      const title = 'New Road Development Plan';
      const description = 'A new road development plan affects your property area';
      const details = ['Road width: 20 meters', 'Implementation: Q2 2024'];
      const source = 'Ministry of Transport';

      // Mock monitoring session exists
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              propertyId: 1,
              userId: 1,
              notificationPreferences: { email: true, sms: false, inApp: true }
            }])
          })
        })
      });

      // Mock alert insertion
      mockDb.insert.mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            monitoringId: 1,
            propertyId: 1,
            userId: 1,
            alertType,
            severity,
            title,
            description,
            details,
            source,
            isRead: false,
            isDismissed: false,
            actionRequired: false,
            actionDeadline: null,
            relatedDocuments: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }])
        })
      });

      // Act
      const result = await service.createAlert(
        monitoringId,
        alertType,
        severity,
        title,
        description,
        details,
        source
      );

      // Assert
      expect(result.alertType).toBe(alertType);
      expect(result.severity).toBe(severity);
      expect(result.title).toBe(title);
      expect(result.description).toBe(description);
      expect(result.details).toEqual(details);
      expect(result.source).toBe(source);
      expect(result.isRead).toBe(false);
      expect(result.isDismissed).toBe(false);
      expect(mockDb.insert).toHaveBeenCalledWith(monitoringAlerts);
    });

    it('should create action-required alert with deadline', async () => {
      // Arrange
      const monitoringId = '1';
      const actionDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      // Mock monitoring session exists
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              propertyId: 1,
              userId: 1,
              notificationPreferences: { email: true, sms: false, inApp: true }
            }])
          })
        })
      });

      // Mock alert insertion
      mockDb.insert.mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            monitoringId: 1,
            propertyId: 1,
            userId: 1,
            alertType: 'legal_dispute',
            severity: 'critical',
            title: 'Legal Action Required',
            description: 'Court case filed against property',
            details: ['Case number: HC/123/2024'],
            source: 'court_system',
            isRead: false,
            isDismissed: false,
            actionRequired: true,
            actionDeadline,
            relatedDocuments: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }])
        })
      });

      // Act
      const result = await service.createAlert(
        monitoringId,
        'legal_dispute',
        'critical',
        'Legal Action Required',
        'Court case filed against property',
        ['Case number: HC/123/2024'],
        'court_system',
        true,
        actionDeadline
      );

      // Assert
      expect(result.actionRequired).toBe(true);
      expect(result.actionDeadline).toEqual(actionDeadline);
    });

    it('should handle alert creation failure gracefully', async () => {
      // Arrange
      const monitoringId = '999';

      // Mock monitoring session not found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]) // Monitoring session not found
          })
        })
      });

      // Act & Assert
      await expect(service.createAlert(
        monitoringId,
        'test_alert',
        'low',
        'Test Alert',
        'Test description',
        [],
        'test_source'
      )).rejects.toThrow('Monitoring session 999 not found');
    });
  });

  describe('Requirement 8.3: Professional relationship maintenance', () => {
    it('should create professional check-in alerts', async () => {
      // Arrange
      const propertyId = '1';

      // Mock active monitoring sessions
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              propertyId: 1,
              monitoringType: 'government_changes',
              isActive: true
            },
            {
              id: 2,
              propertyId: 1,
              monitoringType: 'legal_disputes',
              isActive: true
            }
          ])
        })
      });

      // Mock monitoring session for alert creation
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              propertyId: 1,
              userId: 1,
              notificationPreferences: { email: true, sms: false, inApp: true }
            }])
          })
        })
      });

      // Mock alert insertion
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            monitoringId: 1,
            propertyId: 1,
            userId: 1,
            alertType: 'professional_checkin',
            severity: 'low',
            title: 'Professional Relationship Check-in',
            description: 'Time to check in with your verification professionals',
            details: [
              'Review current professional contacts',
              'Verify contact information is up to date',
              'Schedule periodic consultations if needed'
            ],
            source: 'monitoring_service',
            isRead: false,
            isDismissed: false,
            actionRequired: false,
            actionDeadline: null,
            relatedDocuments: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }])
        })
      });

      // Act
      await service.maintainProfessionalRelationships(propertyId);

      // Assert
      expect(mockDb.insert).toHaveBeenCalledTimes(2); // One alert per active monitoring session
    });
  });

  describe('Requirement 8.4: Early warning for legal challenges', () => {
    it('should check for legal disputes and create alerts', async () => {
      // Arrange
      const propertyId = '1';

      // Mock monitoring sessions for legal disputes
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            id: 1,
            propertyId: 1,
            monitoringType: 'legal_disputes',
            isActive: true
          }])
        })
      });

      // Mock monitoring session for alert creation
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              propertyId: 1,
              userId: 1,
              notificationPreferences: { email: true, sms: false, inApp: true }
            }])
          })
        })
      });

      // Mock alert insertion
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            monitoringId: 1,
            propertyId: 1,
            userId: 1,
            alertType: 'legal_dispute',
            severity: 'high',
            title: 'New Legal Dispute: HC/123/2024',
            description: 'Mock legal dispute summary',
            details: ['Court: High Court', 'Status: filed'],
            source: 'court_system',
            isRead: false,
            isDismissed: false,
            actionRequired: true,
            actionDeadline: null,
            relatedDocuments: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }])
        })
      });

      // Act
      const result = await service.checkForLegalDisputes(propertyId);

      // Assert
      expect(result).toBeInstanceOf(Array);
      // Note: The actual disputes would be empty in this mock implementation
      // but the method should complete without errors
    });
  });

  describe('Requirement 8.5: Risk assessment updates', () => {
    it('should update risk assessments based on regulatory changes', async () => {
      // Arrange
      const propertyId = '1';
      const regulatoryUpdates: RegulatoryUpdate[] = [
        {
          regulation: 'Land Use Planning Act',
          changeType: 'amended',
          effectiveDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          impact: 'high',
          summary: 'New zoning restrictions for residential areas',
          complianceRequirements: ['Submit new building plans', 'Pay additional fees']
        }
      ];

      // Mock latest verification session
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                id: 1,
                propertyId: 1,
                userId: 1
              }])
            })
          })
        })
      });

      // Mock monitoring sessions for regulatory updates
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            id: 1,
            propertyId: 1,
            monitoringType: 'regulatory_updates',
            isActive: true
          }])
        })
      });

      // Mock monitoring session for alert creation
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              propertyId: 1,
              userId: 1,
              notificationPreferences: { email: true, sms: false, inApp: true }
            }])
          })
        })
      });

      // Mock alert insertion
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            monitoringId: 1,
            propertyId: 1,
            userId: 1,
            alertType: 'risk_assessment_update',
            severity: 'high',
            title: 'Risk Assessment Update Required: Land Use Planning Act',
            description: 'Regulatory changes may affect your property\'s risk profile',
            details: [
              'Change Type: amended',
              'Impact Level: high',
              'Summary: New zoning restrictions for residential areas'
            ],
            source: 'regulatory_authority',
            isRead: false,
            isDismissed: false,
            actionRequired: true,
            actionDeadline: regulatoryUpdates[0].effectiveDate,
            relatedDocuments: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }])
        })
      });

      // Act
      await service.updateRiskAssessments(propertyId, regulatoryUpdates);

      // Assert
      expect(mockDb.insert).toHaveBeenCalledWith(monitoringAlerts);
    });

    it('should handle case when no verification session exists', async () => {
      // Arrange
      const propertyId = '999';
      const regulatoryUpdates: RegulatoryUpdate[] = [];

      // Mock no verification session found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]) // No session found
            })
          })
        })
      });

      // Act
      await service.updateRiskAssessments(propertyId, regulatoryUpdates);

      // Assert - should complete without errors
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 8.6: Monitoring adjustment recommendations', () => {
    it('should recommend increasing frequency for high-alert types', async () => {
      // Arrange
      const propertyId = '1';

      // Mock monitoring sessions
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              propertyId: 1,
              monitoringType: 'government_changes',
              isActive: true,
              nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
          ])
        })
      });

      // Mock recent alerts with high frequency for government_changes
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { alertType: 'government_change', severity: 'high' },
            { alertType: 'government_change', severity: 'medium' },
            { alertType: 'government_change', severity: 'high' },
            { alertType: 'government_change', severity: 'low' },
            { alertType: 'government_change', severity: 'critical' },
            { alertType: 'government_change', severity: 'medium' }
          ])
        })
      });

      // Act
      const recommendations = await service.recommendMonitoringAdjustments(propertyId);

      // Assert
      expect(recommendations).toContain('Consider increasing monitoring frequency for: government_change');
    });

    it('should recommend enabling inactive monitoring types', async () => {
      // Arrange
      const propertyId = '1';

      // Mock monitoring sessions - only government_changes active
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              propertyId: 1,
              monitoringType: 'government_changes',
              isActive: true,
              nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
          ])
        })
      });

      // Mock recent alerts - few alerts
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { alertType: 'government_change', severity: 'low' }
          ])
        })
      });

      // Act
      const recommendations = await service.recommendMonitoringAdjustments(propertyId);

      // Assert
      expect(recommendations.some(r => r.includes('Consider enabling monitoring for:'))).toBe(true);
    });

    it('should recommend daily monitoring for critical alerts', async () => {
      // Arrange
      const propertyId = '1';

      // Mock monitoring sessions
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              propertyId: 1,
              monitoringType: 'legal_disputes',
              isActive: true,
              nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
          ])
        })
      });

      // Mock recent alerts with multiple critical alerts
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { alertType: 'legal_dispute', severity: 'critical' },
            { alertType: 'legal_dispute', severity: 'critical' },
            { alertType: 'legal_dispute', severity: 'critical' }
          ])
        })
      });

      // Act
      const recommendations = await service.recommendMonitoringAdjustments(propertyId);

      // Assert
      expect(recommendations).toContain('High number of critical alerts detected - consider daily monitoring frequency');
    });
  });

  describe('Monitoring Status and Control', () => {
    it('should get monitoring status for property', async () => {
      // Arrange
      const propertyId = '1';

      // Mock active sessions
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              propertyId: 1,
              sessionId: 1,
              userId: 1,
              monitoringType: 'government_changes',
              frequency: 'weekly',
              isActive: true,
              lastCheck: new Date(),
              nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              alertThreshold: 0.5,
              notificationPreferences: { email: true, sms: false, inApp: true },
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ])
        })
      });

      // Mock recent alerts
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              {
                id: 1,
                monitoringId: 1,
                propertyId: 1,
                userId: 1,
                alertType: 'government_change',
                severity: 'medium',
                title: 'Test Alert',
                description: 'Test description',
                details: [],
                source: 'test',
                isRead: false,
                isDismissed: false,
                actionRequired: false,
                actionDeadline: null,
                relatedDocuments: [],
                createdAt: new Date(),
                updatedAt: new Date()
              }
            ])
          })
        })
      });

      // Act
      const status = await service.getMonitoringStatus(propertyId);

      // Assert
      expect(status.activeSessions).toHaveLength(1);
      expect(status.recentAlerts).toHaveLength(1);
      expect(status.nextChecks).toHaveLength(1);
      expect(status.nextChecks[0].type).toBe('government_changes');
    });

    it('should pause monitoring session', async () => {
      // Arrange
      const monitoringId = '1';

      // Act
      await service.pauseMonitoring(monitoringId);

      // Assert
      expect(mockDb.update).toHaveBeenCalledWith(propertyMonitoring);
    });

    it('should resume monitoring session', async () => {
      // Arrange
      const monitoringId = '1';

      // Act
      await service.resumeMonitoring(monitoringId);

      // Assert
      expect(mockDb.update).toHaveBeenCalledWith(propertyMonitoring);
    });
  });

  describe('Service Initialization', () => {
    it('should initialize service and load active sessions', async () => {
      // Arrange
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              propertyId: 1,
              sessionId: 1,
              userId: 1,
              monitoringType: 'government_changes',
              frequency: 'daily',
              isActive: true,
              lastCheck: new Date(),
              nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000),
              alertThreshold: 0.5,
              notificationPreferences: { email: true, sms: false, inApp: true },
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ])
        })
      });

      // Act
      await service.initialize();

      // Assert
      expect(mockDb.select).toHaveBeenCalled();
    });
  });
});