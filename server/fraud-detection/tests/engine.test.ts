import { FraudDetectionEngine, FraudAlert } from '../core/FraudDetectionEngine';
import { Logger } from '../utils/Logger';

// Mock all dependencies
jest.mock('../utils/Logger');
jest.mock('../services/DataIntegrationService');
jest.mock('../analytics/MLAnalyticsEngine');
jest.mock('../analytics/NetworkAnalysisService');
jest.mock('../services/CaseManagementService');
jest.mock('../services/ComplianceReportingService');

describe('FraudDetectionEngine', () => {
  let engine: FraudDetectionEngine;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    engine = new FraudDetectionEngine();
    mockLogger = new Logger('test') as jest.Mocked<Logger>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      // Mock all service initialization methods
      jest.spyOn(engine as any, 'dataIntegration', 'get').mockReturnValue({
        initialize: jest.fn().mockResolvedValue(undefined)
      });
      jest.spyOn(engine as any, 'mlEngine', 'get').mockReturnValue({
        initialize: jest.fn().mockResolvedValue(undefined)
      });
      jest.spyOn(engine as any, 'networkAnalysis', 'get').mockReturnValue({
        initialize: jest.fn().mockResolvedValue(undefined)
      });
      jest.spyOn(engine as any, 'caseManagement', 'get').mockReturnValue({
        initialize: jest.fn().mockResolvedValue(undefined)
      });
      jest.spyOn(engine as any, 'complianceReporting', 'get').mockReturnValue({
        initialize: jest.fn().mockResolvedValue(undefined)
      });

      await engine.initialize();

      expect(engine['isRunning']).toBe(true);
    });

    it('should handle initialization errors', async () => {
      jest.spyOn(engine as any, 'dataIntegration', 'get').mockReturnValue({
        initialize: jest.fn().mockRejectedValue(new Error('Init failed'))
      });

      await expect(engine.initialize()).rejects.toThrow('Init failed');
    });
  });

  describe('Transaction Processing', () => {
    beforeEach(async () => {
      // Mock successful initialization
      jest.spyOn(engine as any, 'dataIntegration', 'get').mockReturnValue({
        initialize: jest.fn().mockResolvedValue(undefined)
      });
      jest.spyOn(engine as any, 'mlEngine', 'get').mockReturnValue({
        initialize: jest.fn().mockResolvedValue(undefined),
        analyzePropertyFlipping: jest.fn().mockResolvedValue({ risk: 0.8, evidence: [], factors: [] }),
        analyzeMortgageFraud: jest.fn().mockResolvedValue({ risk: 0.7, evidence: [], factors: [] }),
        analyzeMoneyLaundering: jest.fn().mockResolvedValue({ risk: 0.6, evidence: [], factors: [] }),
        analyzeHistoricalPatterns: jest.fn().mockResolvedValue({ anomalyScore: 0.8, evidence: [], timeframe: {} }),
        analyzeDocumentAuthenticity: jest.fn().mockResolvedValue({ risk: 0.8, evidence: [] }),
        analyzeSyntheticIdentity: jest.fn().mockResolvedValue({ risk: 0.9, evidence: [] }),
        getModelVersions: jest.fn().mockReturnValue({ model1: '1.0', model2: '2.0' })
      });
      jest.spyOn(engine as any, 'networkAnalysis', 'get').mockReturnValue({
        initialize: jest.fn().mockResolvedValue(undefined),
        analyzeProfessionalNetworks: jest.fn().mockResolvedValue({ 
          suspiciousConnections: [], 
          riskScore: 0.5, 
          evidence: [], 
          networkId: 'net-123' 
        }),
        detectCoordinatedActivity: jest.fn().mockResolvedValue({ 
          risk: 0.9, 
          evidence: [], 
          participants: [] 
        })
      });
      jest.spyOn(engine as any, 'caseManagement', 'get').mockReturnValue({
        initialize: jest.fn().mockResolvedValue(undefined),
        createInvestigationCase: jest.fn().mockResolvedValue('case-123')
      });
      jest.spyOn(engine as any, 'complianceReporting', 'get').mockReturnValue({
        initialize: jest.fn().mockResolvedValue(undefined),
        checkAMLCompliance: jest.fn().mockResolvedValue({ 
          compliant: false, 
          violations: [], 
          riskFactors: [] 
        }),
        checkRESPACompliance: jest.fn().mockResolvedValue({ 
          compliant: true, 
          violations: [] 
        }),
        generateSuspiciousActivityReport: jest.fn().mockResolvedValue('sar-123')
      });

      await engine.initialize();
    });

    it('should process transaction and generate alerts', async () => {
      const transactionData = {
        id: 'TXN-001',
        propertyId: 'PROP-001',
        amount: 500000,
        paymentMethod: 'cash',
        buyer: { id: 'BUYER-001', name: 'John Doe' },
        seller: { id: 'SELLER-001', name: 'Jane Smith' },
        documents: [{ type: 'deed', content: 'mock-content' }]
      };

      const alerts = await engine.processTransaction(transactionData);

      expect(alerts).toBeInstanceOf(Array);
      expect(alerts.length).toBeGreaterThan(0);
      
      // Verify alert structure
      alerts.forEach(alert => {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('category');
        expect(alert).toHaveProperty('confidence');
        expect(alert).toHaveProperty('propertyId', 'PROP-001');
        expect(alert).toHaveProperty('transactionId', 'TXN-001');
        expect(alert).toHaveProperty('timeframe');
        expect(alert.timeframe).toHaveProperty('detectedAt');
      });
    });

    it('should handle high-risk cash transactions', async () => {
      const transactionData = {
        id: 'TXN-002',
        propertyId: 'PROP-002',
        amount: 1500000, // High amount
        paymentMethod: 'cash',
        buyer: { id: 'BUYER-002', name: 'Suspicious Buyer' }
      };

      const alerts = await engine.processTransaction(transactionData);

      // Should generate money laundering alert
      const mlAlert = alerts.find(alert => alert.category === 'cash_money_laundering');
      expect(mlAlert).toBeDefined();
      expect(mlAlert?.confidence).toBeGreaterThan(50);
    });

    it('should escalate critical alerts', async () => {
      const transactionData = {
        id: 'TXN-003',
        propertyId: 'PROP-003',
        amount: 2000000, // Very high amount
        paymentMethod: 'cash'
      };

      // Mock high-risk analysis results
      jest.spyOn(engine as any, 'mlEngine', 'get').mockReturnValue({
        analyzePropertyFlipping: jest.fn().mockResolvedValue({ risk: 0.95, evidence: [], factors: [] }),
        analyzeMortgageFraud: jest.fn().mockResolvedValue({ risk: 0.9, evidence: [], factors: [] }),
        analyzeMoneyLaundering: jest.fn().mockResolvedValue({ risk: 0.95, evidence: [], factors: [] }),
        analyzeHistoricalPatterns: jest.fn().mockResolvedValue({ anomalyScore: 0.9, evidence: [], timeframe: {} }),
        analyzeDocumentAuthenticity: jest.fn().mockResolvedValue({ risk: 0.9, evidence: [] }),
        analyzeSyntheticIdentity: jest.fn().mockResolvedValue({ risk: 0.95, evidence: [] }),
        getModelVersions: jest.fn().mockReturnValue({ model1: '1.0' })
      });

      const alerts = await engine.processTransaction(transactionData);

      // Should have critical alerts
      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
      expect(criticalAlerts.length).toBeGreaterThan(0);

      // Should have high estimated loss
      const highLossAlerts = alerts.filter(alert => 
        alert.estimatedLoss && alert.estimatedLoss > 1000000
      );
      expect(highLossAlerts.length).toBeGreaterThan(0);
    });

    it('should handle processing errors gracefully', async () => {
      const transactionData = {
        id: 'TXN-ERROR',
        propertyId: 'PROP-ERROR'
      };

      // Mock analysis failure
      jest.spyOn(engine as any, 'mlEngine', 'get').mockReturnValue({
        analyzePropertyFlipping: jest.fn().mockRejectedValue(new Error('Analysis failed')),
        analyzeMortgageFraud: jest.fn().mockResolvedValue({ risk: 0.1, evidence: [], factors: [] }),
        analyzeMoneyLaundering: jest.fn().mockResolvedValue({ risk: 0.1, evidence: [], factors: [] }),
        analyzeHistoricalPatterns: jest.fn().mockResolvedValue({ anomalyScore: 0.1, evidence: [], timeframe: {} }),
        analyzeDocumentAuthenticity: jest.fn().mockResolvedValue({ risk: 0.1, evidence: [] }),
        analyzeSyntheticIdentity: jest.fn().mockResolvedValue({ risk: 0.1, evidence: [] }),
        getModelVersions: jest.fn().mockReturnValue({})
      });

      await expect(engine.processTransaction(transactionData)).rejects.toThrow();
      
      // Verify error is logged in processing queue
      const queueEntry = engine['processingQueue'].get('TXN-ERROR');
      expect(queueEntry?.status).toBe('error');
    });
  });

  describe('Alert Generation', () => {
    it('should generate alerts with correct severity levels', async () => {
      // Test severity calculation
      const testCases = [
        { confidence: 95, category: 'cash_money_laundering', expectedSeverity: 'critical' },
        { confidence: 85, category: 'property_flipping_artificial_inflation', expectedSeverity: 'high' },
        { confidence: 65, category: 'mortgage_fraud_income_misrepresentation', expectedSeverity: 'medium' },
        { confidence: 45, category: 'title_fraud_deed_forgery', expectedSeverity: 'low' }
      ];

      testCases.forEach(testCase => {
        const severity = engine['calculateSeverity'](testCase.confidence, testCase.category as any);
        expect(severity).toBe(testCase.expectedSeverity);
      });
    });

    it('should generate unique alert IDs', () => {
      const id1 = engine['generateAlertId']();
      const id2 = engine['generateAlertId']();
      
      expect(id1).toMatch(/^FD-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^FD-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should calculate estimated loss correctly', () => {
      const testCases = [
        {
          partial: { category: 'investment_ponzi_schemes' as any },
          transactionData: { amount: 1000000 },
          expectedMultiplier: 0.8
        },
        {
          partial: { category: 'cash_money_laundering' as any },
          transactionData: { amount: 500000 },
          expectedMultiplier: 1.0
        },
        {
          partial: { category: 'property_flipping_artificial_inflation' as any },
          transactionData: { amount: 300000 },
          expectedMultiplier: 0.3
        }
      ];

      testCases.forEach(testCase => {
        const estimatedLoss = engine['calculateEstimatedLoss'](
          testCase.partial, 
          testCase.transactionData
        );
        const expectedLoss = testCase.transactionData.amount * testCase.expectedMultiplier;
        expect(estimatedLoss).toBe(expectedLoss);
      });
    });
  });

  describe('System Status', () => {
    it('should return comprehensive system status', async () => {
      // Mock service statuses
      jest.spyOn(engine as any, 'mlEngine', 'get').mockReturnValue({
        getStatus: jest.fn().mockResolvedValue({ status: 'healthy', models: 5 })
      });
      jest.spyOn(engine as any, 'dataIntegration', 'get').mockReturnValue({
        getStatus: jest.fn().mockResolvedValue({ status: 'healthy', connections: 3 })
      });

      const status = await engine.getSystemStatus();

      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('processingQueue');
      expect(status).toHaveProperty('uptime');
      expect(status).toHaveProperty('lastProcessed');
      expect(status).toHaveProperty('mlModelsStatus');
      expect(status).toHaveProperty('dataIntegrationStatus');
    });
  });

  describe('Fraud Categories', () => {
    it('should identify related fraud categories correctly', () => {
      const testCases = [
        {
          category: 'property_flipping_artificial_inflation' as any,
          expectedRelated: ['appraiser_collusion_inflation', 'mortgage_fraud_income_misrepresentation']
        },
        {
          category: 'cash_money_laundering' as any,
          expectedRelated: ['cryptocurrency_money_laundering', 'aml_violations_cash_transactions']
        },
        {
          category: 'synthetic_identity_creation' as any,
          expectedRelated: ['digital_document_forgery', 'mortgage_fraud_straw_buyers']
        }
      ];

      testCases.forEach(testCase => {
        const related = engine['getRelatedCategories'](testCase.category);
        expect(related).toEqual(expect.arrayContaining(testCase.expectedRelated));
      });
    });

    it('should determine regulatory reporting requirements', () => {
      const testCases = [
        {
          alert: { 
            category: 'cash_money_laundering' as any, 
            estimatedLoss: 25000 
          } as FraudAlert,
          shouldReport: true
        },
        {
          alert: { 
            category: 'property_flipping_artificial_inflation' as any, 
            estimatedLoss: 75000 
          } as FraudAlert,
          shouldReport: true
        },
        {
          alert: { 
            category: 'title_fraud_deed_forgery' as any, 
            estimatedLoss: 10000 
          } as FraudAlert,
          shouldReport: false
        }
      ];

      testCases.forEach(testCase => {
        const shouldReport = engine['requiresRegulatoryReporting'](testCase.alert);
        expect(shouldReport).toBe(testCase.shouldReport);
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent transactions', async () => {
      // Mock successful initialization
      await engine.initialize();

      const transactions = Array(10).fill(null).map((_, index) => ({
        id: `TXN-${index}`,
        propertyId: `PROP-${index}`,
        amount: 100000 + (index * 10000),
        paymentMethod: index % 2 === 0 ? 'cash' : 'wire'
      }));

      const startTime = Date.now();
      const promises = transactions.map(txn => engine.processTransaction(txn));
      const results = await Promise.all(promises);
      const endTime = Date.now();

      // All transactions should be processed
      expect(results).toHaveLength(10);
      results.forEach(alerts => {
        expect(alerts).toBeInstanceOf(Array);
      });

      // Should complete within reasonable time (adjust based on your requirements)
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds for 10 transactions

      // Processing queue should track all transactions
      expect(engine['processingQueue'].size).toBe(10);
    });

    it('should manage processing queue correctly', async () => {
      await engine.initialize();

      const transaction = {
        id: 'TXN-QUEUE-TEST',
        propertyId: 'PROP-QUEUE-TEST',
        amount: 200000
      };

      await engine.processTransaction(transaction);

      const queueEntry = engine['processingQueue'].get('TXN-QUEUE-TEST');
      expect(queueEntry).toBeDefined();
      expect(queueEntry?.status).toBe('completed');
      expect(queueEntry?.startTime).toBeInstanceOf(Date);
      expect(queueEntry?.endTime).toBeInstanceOf(Date);
      expect(queueEntry?.alertsGenerated).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Event Handling', () => {
    it('should emit alerts when generated', async () => {
      await engine.initialize();

      const alertListener = jest.fn();
      engine.on('alert', alertListener);

      const transaction = {
        id: 'TXN-EVENT-TEST',
        propertyId: 'PROP-EVENT-TEST',
        amount: 500000,
        paymentMethod: 'cash'
      };

      await engine.processTransaction(transaction);

      expect(alertListener).toHaveBeenCalled();
      const emittedAlert = alertListener.mock.calls[0][0];
      expect(emittedAlert).toHaveProperty('id');
      expect(emittedAlert).toHaveProperty('category');
      expect(emittedAlert).toHaveProperty('severity');
    });

    it('should handle shutdown gracefully', async () => {
      await engine.initialize();
      expect(engine['isRunning']).toBe(true);

      // Mock service shutdown methods
      jest.spyOn(engine as any, 'dataIntegration', 'get').mockReturnValue({
        shutdown: jest.fn().mockResolvedValue(undefined)
      });
      jest.spyOn(engine as any, 'mlEngine', 'get').mockReturnValue({
        shutdown: jest.fn().mockResolvedValue(undefined)
      });
      jest.spyOn(engine as any, 'networkAnalysis', 'get').mockReturnValue({
        shutdown: jest.fn().mockResolvedValue(undefined)
      });
      jest.spyOn(engine as any, 'caseManagement', 'get').mockReturnValue({
        shutdown: jest.fn().mockResolvedValue(undefined)
      });
      jest.spyOn(engine as any, 'complianceReporting', 'get').mockReturnValue({
        shutdown: jest.fn().mockResolvedValue(undefined)
      });

      await engine.shutdown();
      expect(engine['isRunning']).toBe(false);
    });
  });
});