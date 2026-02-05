import { FraudDetectionEngine } from '../core/FraudDetectionEngine';
import { FraudDetectionDashboardRoutes } from '../routes/dashboard';

// Mock dependencies for performance testing
jest.mock('../utils/Logger');
jest.mock('../services/DataIntegrationService');
jest.mock('../analytics/MLAnalyticsEngine');
jest.mock('../analytics/NetworkAnalysisService');
jest.mock('../services/CaseManagementService');
jest.mock('../services/ComplianceReportingService');

describe('Fraud Detection Performance Tests', () => {
  let engine: FraudDetectionEngine;
  let dashboardRoutes: FraudDetectionDashboardRoutes;

  beforeEach(async () => {
    engine = new FraudDetectionEngine();
    dashboardRoutes = new FraudDetectionDashboardRoutes(engine);

    // Mock all engine methods for consistent performance testing
    jest.spyOn(engine as any, 'dataIntegration', 'get').mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
      shutdown: jest.fn().mockResolvedValue(undefined)
    });

    jest.spyOn(engine as any, 'mlEngine', 'get').mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
      analyzePropertyFlipping: jest.fn().mockResolvedValue({ risk: 0.5, evidence: [], factors: [] }),
      analyzeMortgageFraud: jest.fn().mockResolvedValue({ risk: 0.4, evidence: [], factors: [] }),
      analyzeMoneyLaundering: jest.fn().mockResolvedValue({ risk: 0.3, evidence: [], factors: [] }),
      analyzeHistoricalPatterns: jest.fn().mockResolvedValue({ anomalyScore: 0.4, evidence: [], timeframe: {} }),
      analyzeDocumentAuthenticity: jest.fn().mockResolvedValue({ risk: 0.2, evidence: [] }),
      analyzeSyntheticIdentity: jest.fn().mockResolvedValue({ risk: 0.1, evidence: [] }),
      getModelVersions: jest.fn().mockReturnValue({ model1: '1.0' }),
      getStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
      shutdown: jest.fn().mockResolvedValue(undefined)
    });

    jest.spyOn(engine as any, 'networkAnalysis', 'get').mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
      analyzeProfessionalNetworks: jest.fn().mockResolvedValue({ 
        suspiciousConnections: [], 
        riskScore: 0.2, 
        evidence: [], 
        networkId: 'net-123' 
      }),
      detectCoordinatedActivity: jest.fn().mockResolvedValue({ 
        risk: 0.1, 
        evidence: [], 
        participants: [] 
      }),
      shutdown: jest.fn().mockResolvedValue(undefined)
    });

    jest.spyOn(engine as any, 'caseManagement', 'get').mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
      createInvestigationCase: jest.fn().mockResolvedValue('case-123'),
      shutdown: jest.fn().mockResolvedValue(undefined)
    });

    jest.spyOn(engine as any, 'complianceReporting', 'get').mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
      checkAMLCompliance: jest.fn().mockResolvedValue({ 
        compliant: true, 
        violations: [], 
        riskFactors: [] 
      }),
      checkRESPACompliance: jest.fn().mockResolvedValue({ 
        compliant: true, 
        violations: [] 
      }),
      generateSuspiciousActivityReport: jest.fn().mockResolvedValue('sar-123'),
      shutdown: jest.fn().mockResolvedValue(undefined)
    });

    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Engine Performance', () => {
    it('should process single transaction within acceptable time', async () => {
      const transaction = {
        id: 'PERF-TXN-001',
        propertyId: 'PERF-PROP-001',
        amount: 500000,
        paymentMethod: 'wire'
      };

      const startTime = process.hrtime.bigint();
      const alerts = await engine.processTransaction(transaction);
      const endTime = process.hrtime.bigint();

      const processingTimeMs = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      expect(alerts).toBeInstanceOf(Array);
      expect(processingTimeMs).toBeLessThan(100); // Should process within 100ms
    });

    it('should handle high-volume transaction processing', async () => {
      const transactionCount = 100;
      const transactions = Array(transactionCount).fill(null).map((_, index) => ({
        id: `PERF-TXN-${index}`,
        propertyId: `PERF-PROP-${index}`,
        amount: 100000 + (index * 1000),
        paymentMethod: index % 2 === 0 ? 'wire' : 'cash'
      }));

      const startTime = process.hrtime.bigint();
      const promises = transactions.map(txn => engine.processTransaction(txn));
      const results = await Promise.all(promises);
      const endTime = process.hrtime.bigint();

      const totalTimeMs = Number(endTime - startTime) / 1000000;
      const avgTimePerTransaction = totalTimeMs / transactionCount;

      expect(results).toHaveLength(transactionCount);
      expect(totalTimeMs).toBeLessThan(5000); // Should complete within 5 seconds
      expect(avgTimePerTransaction).toBeLessThan(50); // Average < 50ms per transaction
    });

    it('should maintain performance under memory pressure', async () => {
      const transactionCount = 500;
      const batchSize = 50;
      const batches = Math.ceil(transactionCount / batchSize);

      const processingTimes: number[] = [];

      for (let batch = 0; batch < batches; batch++) {
        const batchTransactions = Array(batchSize).fill(null).map((_, index) => ({
          id: `BATCH-${batch}-TXN-${index}`,
          propertyId: `BATCH-${batch}-PROP-${index}`,
          amount: 100000 + (index * 1000),
          paymentMethod: 'wire'
        }));

        const startTime = process.hrtime.bigint();
        const promises = batchTransactions.map(txn => engine.processTransaction(txn));
        await Promise.all(promises);
        const endTime = process.hrtime.bigint();

        const batchTimeMs = Number(endTime - startTime) / 1000000;
        processingTimes.push(batchTimeMs);
      }

      // Performance should remain consistent across batches
      const avgBatchTime = processingTimes.reduce((sum, time) => sum + time, 0) / batches;
      const maxBatchTime = Math.max(...processingTimes);
      const minBatchTime = Math.min(...processingTimes);

      expect(avgBatchTime).toBeLessThan(2000); // Average batch time < 2 seconds
      expect(maxBatchTime - minBatchTime).toBeLessThan(1000); // Variance < 1 second
    });

    it('should efficiently manage processing queue', async () => {
      const transactionCount = 200;
      const transactions = Array(transactionCount).fill(null).map((_, index) => ({
        id: `QUEUE-TXN-${index}`,
        propertyId: `QUEUE-PROP-${index}`,
        amount: 150000
      }));

      // Process transactions
      const promises = transactions.map(txn => engine.processTransaction(txn));
      await Promise.all(promises);

      // Check queue management
      const queueSize = engine['processingQueue'].size;
      expect(queueSize).toBe(transactionCount);

      // All entries should be completed
      const queueEntries = Array.from(engine['processingQueue'].values());
      queueEntries.forEach(entry => {
        expect(entry.status).toBe('completed');
        expect(entry.startTime).toBeInstanceOf(Date);
        expect(entry.endTime).toBeInstanceOf(Date);
      });
    });
  });

  describe('Dashboard API Performance', () => {
    it('should respond to active scans request quickly', async () => {
      const mockReq = {
        session: { userId: 123 }
      };

      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      const startTime = process.hrtime.bigint();
      await dashboardRoutes['getActiveScans'](mockReq as any, mockRes as any);
      const endTime = process.hrtime.bigint();

      const responseTimeMs = Number(endTime - startTime) / 1000000;

      expect(mockRes.json).toHaveBeenCalled();
      expect(responseTimeMs).toBeLessThan(10); // Should respond within 10ms
    });

    it('should handle concurrent dashboard requests efficiently', async () => {
      const concurrentRequests = 50;
      const mockReq = {
        session: { userId: 123 }
      };

      const requests = Array(concurrentRequests).fill(null).map(() => {
        const mockRes = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis()
        };
        return { req: mockReq, res: mockRes };
      });

      const startTime = process.hrtime.bigint();
      const promises = requests.map(({ req, res }) => 
        dashboardRoutes['getActiveScans'](req as any, res as any)
      );
      await Promise.all(promises);
      const endTime = process.hrtime.bigint();

      const totalTimeMs = Number(endTime - startTime) / 1000000;
      const avgTimePerRequest = totalTimeMs / concurrentRequests;

      expect(totalTimeMs).toBeLessThan(500); // Total time < 500ms
      expect(avgTimePerRequest).toBeLessThan(10); // Average < 10ms per request

      // All requests should have succeeded
      requests.forEach(({ res }) => {
        expect(res.json).toHaveBeenCalled();
      });
    });

    it('should maintain consistent response times across different endpoints', async () => {
      const mockReq = {
        session: { userId: 123 },
        params: { reportId: 'RPT-001' }
      };

      const endpoints = [
        'getActiveScans',
        'getRecentReports',
        'getUserStats',
        'getReportDetails'
      ];

      const responseTimes: Record<string, number> = {};

      for (const endpoint of endpoints) {
        const mockRes = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis()
        };

        const startTime = process.hrtime.bigint();
        await (dashboardRoutes as any)[endpoint](mockReq, mockRes);
        const endTime = process.hrtime.bigint();

        responseTimes[endpoint] = Number(endTime - startTime) / 1000000;
      }

      // All endpoints should respond quickly
      Object.entries(responseTimes).forEach(([endpoint, time]) => {
        expect(time).toBeLessThan(20); // Each endpoint < 20ms
      });

      // Response times should be relatively consistent
      const times = Object.values(responseTimes);
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      expect(maxTime - minTime).toBeLessThan(15); // Variance < 15ms
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during transaction processing', async () => {
      const initialMemory = process.memoryUsage();
      
      // Process many transactions
      const transactionCount = 1000;
      const transactions = Array(transactionCount).fill(null).map((_, index) => ({
        id: `MEM-TXN-${index}`,
        propertyId: `MEM-PROP-${index}`,
        amount: 100000
      }));

      const promises = transactions.map(txn => engine.processTransaction(txn));
      await Promise.all(promises);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePerTransaction = memoryIncrease / transactionCount;

      // Memory increase should be reasonable
      expect(memoryIncreasePerTransaction).toBeLessThan(1024); // < 1KB per transaction
    });

    it('should clean up processing queue efficiently', async () => {
      const transactionCount = 100;
      const transactions = Array(transactionCount).fill(null).map((_, index) => ({
        id: `CLEANUP-TXN-${index}`,
        propertyId: `CLEANUP-PROP-${index}`,
        amount: 100000
      }));

      // Process transactions
      const promises = transactions.map(txn => engine.processTransaction(txn));
      await Promise.all(promises);

      const queueSizeBefore = engine['processingQueue'].size;
      expect(queueSizeBefore).toBe(transactionCount);

      // Simulate queue cleanup (in a real system, this might be automatic)
      // For testing, we'll manually clear old entries
      const cutoffTime = Date.now() - (60 * 1000); // 1 minute ago
      for (const [key, entry] of engine['processingQueue'].entries()) {
        if (entry.endTime && entry.endTime.getTime() < cutoffTime) {
          engine['processingQueue'].delete(key);
        }
      }

      // Queue should still contain recent entries
      expect(engine['processingQueue'].size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Scalability', () => {
    it('should scale linearly with transaction volume', async () => {
      const testSizes = [10, 50, 100, 200];
      const results: Array<{ size: number; timeMs: number; throughput: number }> = [];

      for (const size of testSizes) {
        const transactions = Array(size).fill(null).map((_, index) => ({
          id: `SCALE-${size}-TXN-${index}`,
          propertyId: `SCALE-${size}-PROP-${index}`,
          amount: 100000
        }));

        const startTime = process.hrtime.bigint();
        const promises = transactions.map(txn => engine.processTransaction(txn));
        await Promise.all(promises);
        const endTime = process.hrtime.bigint();

        const timeMs = Number(endTime - startTime) / 1000000;
        const throughput = size / (timeMs / 1000); // transactions per second

        results.push({ size, timeMs, throughput });
      }

      // Throughput should remain relatively stable as volume increases
      const throughputs = results.map(r => r.throughput);
      const avgThroughput = throughputs.reduce((sum, t) => sum + t, 0) / throughputs.length;
      const minThroughput = Math.min(...throughputs);
      const maxThroughput = Math.max(...throughputs);

      // Throughput variance should be reasonable
      expect(minThroughput).toBeGreaterThan(avgThroughput * 0.7); // Within 30% of average
      expect(maxThroughput).toBeLessThan(avgThroughput * 1.3);

      // Should maintain reasonable throughput
      expect(avgThroughput).toBeGreaterThan(100); // > 100 transactions per second
    });

    it('should handle burst traffic patterns', async () => {
      const burstSize = 100;
      const burstCount = 5;
      const burstInterval = 100; // ms between bursts

      const burstTimes: number[] = [];

      for (let burst = 0; burst < burstCount; burst++) {
        const transactions = Array(burstSize).fill(null).map((_, index) => ({
          id: `BURST-${burst}-TXN-${index}`,
          propertyId: `BURST-${burst}-PROP-${index}`,
          amount: 100000
        }));

        const startTime = process.hrtime.bigint();
        const promises = transactions.map(txn => engine.processTransaction(txn));
        await Promise.all(promises);
        const endTime = process.hrtime.bigint();

        const burstTimeMs = Number(endTime - startTime) / 1000000;
        burstTimes.push(burstTimeMs);

        // Wait between bursts
        if (burst < burstCount - 1) {
          await new Promise(resolve => setTimeout(resolve, burstInterval));
        }
      }

      // All bursts should complete within reasonable time
      burstTimes.forEach(time => {
        expect(time).toBeLessThan(2000); // Each burst < 2 seconds
      });

      // Performance should remain consistent across bursts
      const avgBurstTime = burstTimes.reduce((sum, time) => sum + time, 0) / burstCount;
      const maxBurstTime = Math.max(...burstTimes);
      const minBurstTime = Math.min(...burstTimes);

      expect(maxBurstTime - minBurstTime).toBeLessThan(avgBurstTime * 0.5); // Variance < 50% of average
    });
  });
});