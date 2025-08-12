/**
 * Security System Test Suite
 * 
 * Comprehensive tests for regulatory compliance and security monitoring system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import { SecuritySystem, createSecuritySystem } from '../SecuritySystem';
import { ComplianceManager } from '../ComplianceManager';
import { SecurityMonitor } from '../SecurityMonitor';
import { VulnerabilityScanner } from '../VulnerabilityScanner';

// Mock dependencies
vi.mock('pg');
vi.mock('../ComplianceManager');
vi.mock('../SecurityMonitor');
vi.mock('../VulnerabilityScanner');

describe('SecuritySystem', () => {
  let mockPool: Pool;
  let securitySystem: SecuritySystem;
  let mockConfig: any;

  beforeEach(() => {
    mockPool = {
      connect: vi.fn().mockResolvedValue({
        query: vi.fn().mockResolvedValue({ rows: [] }),
        release: vi.fn()
      }),
      end: vi.fn()
    } as any;

    mockConfig = {
      database: { pool: mockPool },
      compliance: {
        enableGDPR: true,
        enableDataRetention: true,
        retentionCheckInterval: 24
      },
      monitoring: {
        enableRealTimeMonitoring: true,
        enableThreatDetection: true,
        alertThresholds: { critical: 1, high: 5, medium: 10 }
      },
      scanning: {
        enableAutomatedScanning: true,
        scanInterval: 24,
        enableCIIntegration: true,
        failOnCritical: true
      },
      notifications: {
        adminEmail: 'admin@example.com',
        dpoEmail: 'dpo@example.com',
        enableEmailAlerts: true,
        enableSlackAlerts: false
      }
    };

    securitySystem = new SecuritySystem(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize all security components', async () => {
      // Mock the prototype methods before creating the SecuritySystem instance
      const initializeComplianceTablesSpy = vi.fn().mockResolvedValue(undefined);
      const initializeSecurityTablesSpy = vi.fn().mockResolvedValue(undefined);
      const startMonitoringSpy = vi.fn().mockResolvedValue(undefined);
      const runComprehensiveScanSpy = vi.fn().mockResolvedValue({
        summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
      });

      vi.mocked(ComplianceManager).mockImplementation(() => ({
        initializeComplianceTables: initializeComplianceTablesSpy,
        processGDPRRequest: vi.fn(),
      } as any));

      vi.mocked(SecurityMonitor).mockImplementation(() => ({
        initializeSecurityTables: initializeSecurityTablesSpy,
        startMonitoring: startMonitoringSpy,
        stopMonitoring: vi.fn(),
        logSecurityEvent: vi.fn(),
      } as any));

      vi.mocked(VulnerabilityScanner).mockImplementation(() => ({
        runComprehensiveScan: runComprehensiveScanSpy,
      } as any));

      // Create a new SecuritySystem instance with mocked components
      const testSecuritySystem = new SecuritySystem(mockConfig);
      await testSecuritySystem.initialize();

      expect(initializeComplianceTablesSpy).toHaveBeenCalled();
      expect(initializeSecurityTablesSpy).toHaveBeenCalled();
      expect(startMonitoringSpy).toHaveBeenCalled();
      expect(runComprehensiveScanSpy).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      const initializeComplianceTablesSpy = vi.fn().mockRejectedValue(new Error('DB Error'));

      vi.mocked(ComplianceManager).mockImplementation(() => ({
        initializeComplianceTables: initializeComplianceTablesSpy,
        processGDPRRequest: vi.fn(),
      } as any));

      vi.mocked(SecurityMonitor).mockImplementation(() => ({
        initializeSecurityTables: vi.fn(),
        startMonitoring: vi.fn(),
        stopMonitoring: vi.fn(),
        logSecurityEvent: vi.fn(),
      } as any));

      vi.mocked(VulnerabilityScanner).mockImplementation(() => ({
        runComprehensiveScan: vi.fn(),
      } as any));

      const testSecuritySystem = new SecuritySystem(mockConfig);
      await expect(testSecuritySystem.initialize()).rejects.toThrow('DB Error');
    });
  });

  describe('GDPR Compliance', () => {
    it('should process GDPR data access request', async () => {
      const processGDPRRequestSpy = vi.fn().mockResolvedValue('request-123');

      vi.mocked(ComplianceManager).mockImplementation(() => ({
        initializeComplianceTables: vi.fn(),
        processGDPRRequest: processGDPRRequestSpy,
      } as any));

      vi.mocked(SecurityMonitor).mockImplementation(() => ({
        initializeSecurityTables: vi.fn(),
        startMonitoring: vi.fn(),
        stopMonitoring: vi.fn(),
        logSecurityEvent: vi.fn(),
      } as any));

      vi.mocked(VulnerabilityScanner).mockImplementation(() => ({
        runComprehensiveScan: vi.fn(),
      } as any));

      const testSecuritySystem = new SecuritySystem(mockConfig);

      const request = {
        type: 'access' as const,
        userId: '1',
        requestedBy: 'user@example.com'
      };

      const requestId = await testSecuritySystem.processGDPRRequest(request);

      expect(requestId).toBe('request-123');
      expect(processGDPRRequestSpy).toHaveBeenCalledWith(request);
    });

    it('should process GDPR data erasure request', async () => {
      const processGDPRRequestSpy = vi.fn().mockResolvedValue('request-456');

      vi.mocked(ComplianceManager).mockImplementation(() => ({
        initializeComplianceTables: vi.fn(),
        processGDPRRequest: processGDPRRequestSpy,
      } as any));

      vi.mocked(SecurityMonitor).mockImplementation(() => ({
        initializeSecurityTables: vi.fn(),
        startMonitoring: vi.fn(),
        stopMonitoring: vi.fn(),
        logSecurityEvent: vi.fn(),
      } as any));

      vi.mocked(VulnerabilityScanner).mockImplementation(() => ({
        runComprehensiveScan: vi.fn(),
      } as any));

      const testSecuritySystem = new SecuritySystem(mockConfig);

      const request = {
        type: 'erasure' as const,
        userId: '1',
        requestedBy: 'user@example.com'
      };

      const requestId = await testSecuritySystem.processGDPRRequest(request);

      expect(requestId).toBe('request-456');
      expect(processGDPRRequestSpy).toHaveBeenCalledWith(request);
    });
  });

  describe('Security Monitoring', () => {
    it('should log security events', async () => {
      const logSecurityEventSpy = vi.fn().mockResolvedValue('event-123');

      vi.mocked(ComplianceManager).mockImplementation(() => ({
        initializeComplianceTables: vi.fn(),
        processGDPRRequest: vi.fn(),
      } as any));

      vi.mocked(SecurityMonitor).mockImplementation(() => ({
        initializeSecurityTables: vi.fn(),
        startMonitoring: vi.fn(),
        stopMonitoring: vi.fn(),
        logSecurityEvent: logSecurityEventSpy,
      } as any));

      vi.mocked(VulnerabilityScanner).mockImplementation(() => ({
        runComprehensiveScan: vi.fn(),
      } as any));

      const testSecuritySystem = new SecuritySystem(mockConfig);

      const event = {
        type: 'authentication' as const,
        severity: 'high' as const,
        source: 'login_system',
        description: 'Failed login attempt',
        details: { attempts: 5 }
      };

      const eventId = await testSecuritySystem.logSecurityEvent(event);

      expect(eventId).toBe('event-123');
      expect(logSecurityEventSpy).toHaveBeenCalledWith(event);
    });

    it('should handle security alerts', async () => {
      const mockSecurityMonitor = vi.mocked(SecurityMonitor);
      const mockInstance = new mockSecurityMonitor(mockPool);
      
      // Simulate alert emission
      const alertHandler = vi.fn();
      securitySystem.on('security_event', alertHandler);

      const alert = {
        id: 'alert-123',
        severity: 'critical',
        description: 'Multiple failed login attempts detected'
      };

      mockInstance.emit('security_alert', alert);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(alertHandler).toHaveBeenCalledWith({
        type: 'alert',
        data: alert
      });
    });
  });

  describe('Vulnerability Scanning', () => {
    it('should run vulnerability scan', async () => {
      const mockVulnerabilityScanner = vi.mocked(VulnerabilityScanner);
      const mockReport = {
        id: 'scan-123',
        summary: { total: 5, critical: 1, high: 2, medium: 2, low: 0 },
        vulnerabilities: [],
        recommendations: ['Update dependencies']
      };

      mockVulnerabilityScanner.prototype.runComprehensiveScan = vi.fn().mockResolvedValue(mockReport);

      const report = await securitySystem.runVulnerabilityScan();

      expect(report).toEqual(mockReport);
      expect(mockVulnerabilityScanner.prototype.runComprehensiveScan).toHaveBeenCalled();
    });

    it('should handle vulnerability scan failures', async () => {
      const mockVulnerabilityScanner = vi.mocked(VulnerabilityScanner);
      mockVulnerabilityScanner.prototype.runComprehensiveScan = vi.fn().mockRejectedValue(new Error('Scan failed'));

      await expect(securitySystem.runVulnerabilityScan()).rejects.toThrow('Scan failed');
    });
  });

  describe('Security Dashboard', () => {
    it('should generate security dashboard data', async () => {
      const mockSecurityMonitor = vi.mocked(SecurityMonitor);
      const mockVulnerabilityScanner = vi.mocked(VulnerabilityScanner);

      mockSecurityMonitor.prototype.getSecurityDashboard = vi.fn().mockResolvedValue({
        events: [],
        alerts: [],
        vulnerabilities: [],
        blockedIPs: 0
      });

      mockVulnerabilityScanner.prototype.runComprehensiveScan = vi.fn().mockResolvedValue({
        summary: { total: 3, critical: 0, high: 1, medium: 2, low: 0 }
      });

      const dashboard = await securitySystem.getSecurityDashboard();

      expect(dashboard).toHaveProperty('monitoring');
      expect(dashboard).toHaveProperty('vulnerabilities');
      expect(dashboard).toHaveProperty('compliance');
      expect(dashboard).toHaveProperty('lastUpdated');
    });
  });

  describe('System Health', () => {
    it('should return system health status', () => {
      const health = securitySystem.getSystemHealth();

      expect(health).toHaveProperty('compliance');
      expect(health).toHaveProperty('monitoring');
      expect(health).toHaveProperty('scanning');
      expect(health.compliance).toHaveProperty('status');
      expect(health.monitoring).toHaveProperty('status');
      expect(health.scanning).toHaveProperty('status');
    });
  });

  describe('Factory Function', () => {
    it('should create security system with factory function', () => {
      const system = createSecuritySystem(mockConfig);
      expect(system).toBeInstanceOf(SecuritySystem);
    });
  });

  describe('Event Handling', () => {
    it('should emit system events', async () => {
      const eventHandler = vi.fn();
      securitySystem.on('system_initialized', eventHandler);

      // Mock successful initialization
      const mockComplianceManager = vi.mocked(ComplianceManager);
      const mockSecurityMonitor = vi.mocked(SecurityMonitor);
      const mockVulnerabilityScanner = vi.mocked(VulnerabilityScanner);

      mockComplianceManager.prototype.initializeComplianceTables = vi.fn().mockResolvedValue(undefined);
      mockSecurityMonitor.prototype.initializeSecurityTables = vi.fn().mockResolvedValue(undefined);
      mockSecurityMonitor.prototype.startMonitoring = vi.fn().mockResolvedValue(undefined);
      mockVulnerabilityScanner.prototype.runComprehensiveScan = vi.fn().mockResolvedValue({
        summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
      });

      await securitySystem.initialize();

      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully', async () => {
      const mockSecurityMonitor = vi.mocked(SecurityMonitor);
      mockSecurityMonitor.prototype.stopMonitoring = vi.fn();

      const shutdownHandler = vi.fn();
      securitySystem.on('system_shutdown', shutdownHandler);

      await securitySystem.shutdown();

      expect(mockSecurityMonitor.prototype.stopMonitoring).toHaveBeenCalled();
      expect(shutdownHandler).toHaveBeenCalled();
    });
  });
});

describe('Integration Tests', () => {
  let mockPool: Pool;
  let securitySystem: SecuritySystem;

  beforeEach(() => {
    mockPool = {
      connect: vi.fn().mockResolvedValue({
        query: vi.fn().mockResolvedValue({ rows: [] }),
        release: vi.fn()
      }),
      end: vi.fn()
    } as any;

    const config = {
      database: { pool: mockPool },
      compliance: { enableGDPR: true, enableDataRetention: true, retentionCheckInterval: 1 },
      monitoring: { enableRealTimeMonitoring: true, enableThreatDetection: true, alertThresholds: { critical: 1, high: 5, medium: 10 } },
      scanning: { enableAutomatedScanning: false, scanInterval: 24, enableCIIntegration: false, failOnCritical: false },
      notifications: { enableEmailAlerts: false, enableSlackAlerts: false }
    };

    securitySystem = new SecuritySystem(config);
  });

  it('should handle end-to-end security workflow', async () => {
    // This would test the complete workflow from event detection to response
    const eventHandler = vi.fn();
    securitySystem.on('security_event', eventHandler);

    // Mock the components to simulate a security incident
    const mockSecurityMonitor = vi.mocked(SecurityMonitor);
    mockSecurityMonitor.prototype.logSecurityEvent = vi.fn().mockResolvedValue('event-123');

    // Log a security event
    await securitySystem.logSecurityEvent({
      type: 'authentication',
      severity: 'critical',
      source: 'login_system',
      description: 'Brute force attack detected',
      details: { attempts: 10, ip: '192.168.1.100' }
    });

    expect(mockSecurityMonitor.prototype.logSecurityEvent).toHaveBeenCalled();
  });
});

describe('Performance Tests', () => {
  it('should handle high volume of security events', async () => {
    const mockPool = {
      connect: vi.fn().mockResolvedValue({
        query: vi.fn().mockResolvedValue({ rows: [] }),
        release: vi.fn()
      }),
      end: vi.fn()
    } as any;

    const config = {
      database: { pool: mockPool },
      compliance: { enableGDPR: false, enableDataRetention: false, retentionCheckInterval: 24 },
      monitoring: { enableRealTimeMonitoring: true, enableThreatDetection: true, alertThresholds: { critical: 1, high: 5, medium: 10 } },
      scanning: { enableAutomatedScanning: false, scanInterval: 24, enableCIIntegration: false, failOnCritical: false },
      notifications: { enableEmailAlerts: false, enableSlackAlerts: false }
    };

    const securitySystem = new SecuritySystem(config);
    const mockSecurityMonitor = vi.mocked(SecurityMonitor);
    mockSecurityMonitor.prototype.logSecurityEvent = vi.fn().mockResolvedValue('event-123');

    // Simulate high volume of events
    const events = Array.from({ length: 100 }, (_, i) => ({
      type: 'application' as const,
      severity: 'low' as const,
      source: 'test_system',
      description: `Test event ${i}`,
      details: { eventNumber: i }
    }));

    const startTime = Date.now();
    await Promise.all(events.map(event => securitySystem.logSecurityEvent(event)));
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    expect(mockSecurityMonitor.prototype.logSecurityEvent).toHaveBeenCalledTimes(100);
  });
});