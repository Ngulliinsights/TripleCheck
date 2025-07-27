import express, { Request, Response, NextFunction } from 'express';
import { FraudDetectionEngine, FraudAlert } from '../core/FraudDetectionEngine';
import { Logger } from '../utils/Logger';

export class FraudDetectionAPI {
  private app: express.Application;
  private logger: Logger;
  private fraudEngine: FraudDetectionEngine;
  private port: number;

  constructor(fraudEngine: FraudDetectionEngine, port: number = 3001) {
    this.app = express();
    this.logger = new Logger('FraudDetectionAPI');
    this.fraudEngine = fraudEngine;
    this.port = port;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, { 
        ip: req.ip, 
        userAgent: req.get('User-Agent') 
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // System status
    this.app.get('/api/status', async (req, res) => {
      try {
        const status = await this.fraudEngine.getSystemStatus();
        res.json(status);
      } catch (error) {
        this.logger.error('Failed to get system status', error);
        res.status(500).json({ error: 'Failed to get system status' });
      }
    });

    // Process transaction for fraud detection
    this.app.post('/api/analyze/transaction', async (req, res) => {
      try {
        const transactionData = req.body;
        
        // Validate required fields
        if (!transactionData.id) {
          return res.status(400).json({ error: 'Transaction ID is required' });
        }

        const alerts = await this.fraudEngine.processTransaction(transactionData);
        
        res.json({
          transactionId: transactionData.id,
          alertsGenerated: alerts.length,
          alerts: alerts.map(alert => this.sanitizeAlert(alert)),
          processedAt: new Date().toISOString()
        });
      } catch (error) {
        this.logger.error('Transaction analysis failed', error);
        res.status(500).json({ error: 'Transaction analysis failed' });
      }
    });

    // Batch transaction analysis
    this.app.post('/api/analyze/batch', async (req, res) => {
      try {
        const { transactions } = req.body;
        
        if (!Array.isArray(transactions)) {
          return res.status(400).json({ error: 'Transactions array is required' });
        }

        const results = [];
        for (const transaction of transactions) {
          try {
            const alerts = await this.fraudEngine.processTransaction(transaction);
            results.push({
              transactionId: transaction.id,
              success: true,
              alertsGenerated: alerts.length,
              alerts: alerts.map(alert => this.sanitizeAlert(alert))
            });
          } catch (error) {
            results.push({
              transactionId: transaction.id,
              success: false,
              error: error.message
            });
          }
        }

        res.json({
          totalTransactions: transactions.length,
          successfulAnalyses: results.filter(r => r.success).length,
          results,
          processedAt: new Date().toISOString()
        });
      } catch (error) {
        this.logger.error('Batch analysis failed', error);
        res.status(500).json({ error: 'Batch analysis failed' });
      }
    });

    // Get fraud detection metrics
    this.app.get('/api/metrics', async (req, res) => {
      try {
        // This would fetch metrics from the fraud engine
        const metrics = {
          totalTransactionsProcessed: 12547,
          alertsGenerated: 234,
          criticalAlerts: 12,
          averageProcessingTime: 1.2,
          detectionRate: 99.7,
          falsePositiveRate: 2.1,
          lastUpdated: new Date().toISOString()
        };

        res.json(metrics);
      } catch (error) {
        this.logger.error('Failed to get metrics', error);
        res.status(500).json({ error: 'Failed to get metrics' });
      }
    });

    // Get fraud categories and their descriptions
    this.app.get('/api/fraud-categories', (req, res) => {
      const categories = {
        'property_flipping_artificial_inflation': {
          name: 'Property Flipping with Artificial Inflation',
          description: 'Coordinated scheme involving artificial value inflation through staged sales',
          severity: 'high',
          indicators: ['Rapid resales', 'Unusual price increases', 'Staged transactions']
        },
        'mortgage_fraud_income_misrepresentation': {
          name: 'Mortgage Fraud - Income Misrepresentation',
          description: 'Falsification of income or employment information for mortgage approval',
          severity: 'high',
          indicators: ['Unverifiable income', 'Employment discrepancies', 'Document anomalies']
        },
        'cash_money_laundering': {
          name: 'Cash Money Laundering',
          description: 'Use of real estate transactions to launder illicit cash proceeds',
          severity: 'critical',
          indicators: ['Large cash payments', 'Unverified sources', 'Structured transactions']
        },
        'synthetic_identity_creation': {
          name: 'Synthetic Identity Fraud',
          description: 'Use of fabricated identities for real estate transactions',
          severity: 'high',
          indicators: ['Identity inconsistencies', 'Shallow credit history', 'Verification failures']
        }
      };

      res.json(categories);
    });

    // Webhook for real-time alerts
    this.app.post('/api/webhooks/alerts', (req, res) => {
      try {
        const { url, events } = req.body;
        
        if (!url || !Array.isArray(events)) {
          return res.status(400).json({ error: 'URL and events array are required' });
        }

        // Register webhook (placeholder implementation)
        const webhookId = `webhook_${Date.now()}`;
        
        res.json({
          webhookId,
          url,
          events,
          status: 'registered',
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        this.logger.error('Webhook registration failed', error);
        res.status(500).json({ error: 'Webhook registration failed' });
      }
    });

    // Configuration endpoints
    this.app.get('/api/config/thresholds', (req, res) => {
      const thresholds = {
        cashTransactionThreshold: 10000,
        suspiciousActivityThreshold: 0.7,
        criticalAlertThreshold: 0.9,
        autoEscalationThreshold: 1000000,
        lastUpdated: new Date().toISOString()
      };

      res.json(thresholds);
    });

    this.app.put('/api/config/thresholds', (req, res) => {
      try {
        const thresholds = req.body;
        
        // Validate thresholds
        if (typeof thresholds.cashTransactionThreshold !== 'number' ||
            typeof thresholds.suspiciousActivityThreshold !== 'number') {
          return res.status(400).json({ error: 'Invalid threshold values' });
        }

        // Update thresholds (placeholder implementation)
        this.logger.info('Thresholds updated', thresholds);
        
        res.json({
          ...thresholds,
          updatedAt: new Date().toISOString(),
          status: 'updated'
        });
      } catch (error) {
        this.logger.error('Threshold update failed', error);
        res.status(500).json({ error: 'Threshold update failed' });
      }
    });

    // Testing endpoints (development only)
    if (process.env.NODE_ENV === 'development') {
      this.app.post('/api/test/generate-alert', async (req, res) => {
        try {
          const testTransaction = {
            id: `TEST_${Date.now()}`,
            amount: 500000,
            paymentMethod: 'cash',
            propertyId: 'TEST_PROP_001',
            buyer: { id: 'TEST_BUYER_001', name: 'Test Buyer' },
            seller: { id: 'TEST_SELLER_001', name: 'Test Seller' },
            suspiciousPatterns: [
              { type: 'cash_structuring', riskScore: 0.9 }
            ]
          };

          const alerts = await this.fraudEngine.processTransaction(testTransaction);
          
          res.json({
            message: 'Test alert generated',
            transaction: testTransaction,
            alerts: alerts.map(alert => this.sanitizeAlert(alert))
          });
        } catch (error) {
          this.logger.error('Test alert generation failed', error);
          res.status(500).json({ error: 'Test alert generation failed' });
        }
      });
    }
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ 
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
      });
    });

    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      this.logger.error('Unhandled error', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
        timestamp: new Date().toISOString()
      });
    });
  }

  private sanitizeAlert(alert: FraudAlert): any {
    // Remove sensitive information from alerts before sending to client
    return {
      id: alert.id,
      severity: alert.severity,
      category: alert.category,
      confidence: alert.confidence,
      estimatedLoss: alert.estimatedLoss,
      jurisdiction: alert.jurisdiction,
      timeframe: alert.timeframe,
      investigationPriority: alert.investigationPriority,
      // Exclude detailed evidence and participant information for security
      evidenceCount: alert.evidence.length,
      participantCount: alert.participants.length,
      riskFactorCount: alert.riskFactors.length
    };
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        this.logger.info(`Fraud Detection API server started on port ${this.port}`);
        resolve();
      });
    });
  }

  getApp(): express.Application {
    return this.app;
  }
}