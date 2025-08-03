import { FraudDetectionAPI } from './api/FraudDetectionAPI';
import { FraudDetectionEngine } from './core/FraudDetectionEngine';
import { Logger } from './utils/Logger';

async function startFraudDetectionSystem() {
  const logger = new Logger('FraudDetectionSystem');
  
  try {
    logger.info('Starting Comprehensive Real Estate Fraud Detection System...');
    
    // Initialize the fraud detection engine
    const fraudEngine = new FraudDetectionEngine();
    await fraudEngine.initialize();
    
    // Set up event listeners for monitoring
    fraudEngine.on('alert', (alert) => {
      logger.info(`Fraud alert generated: ${alert.id} - ${alert.category} (${alert.severity})`);
    });
    
    fraudEngine.on('case_created', (caseId) => {
      logger.info(`Investigation case created: ${caseId}`);
    });
    
    fraudEngine.on('regulatory_report', (reportId) => {
      logger.info(`Regulatory report generated: ${reportId}`);
    });
    
    // Start the API server
    const api = new FraudDetectionAPI(fraudEngine, 3001);
    await api.start();
    
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await fraudEngine.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await fraudEngine.shutdown();
      process.exit(0);
    });
    
    logger.info('Fraud Detection System started successfully');
    logger.info('System is now monitoring for fraudulent activity...');
    
  } catch (error) {
    logger.error('Failed to start Fraud Detection System', error);
    process.exit(1);
  }
}

// Start the system if this file is run directly
if (require.main === module) {
  startFraudDetectionSystem();
}

export { FraudDetectionEngine, FraudDetectionAPI };