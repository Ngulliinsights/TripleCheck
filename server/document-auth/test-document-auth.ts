import * as fs from './authentication-business.service';
import * as path from './authentication-business.service';

import { logger } from '../infrastructure/observability/telemetry';

import { DocumentAuthService, DocumentVerificationRequest } from './DocumentAuthService';

async function testDocumentAuth() {
  logger.info('Starting Document Authentication Service test...');

  try {
    // Initialize the service
    const documentAuthService = new DocumentAuthService();
    await documentAuthService.initialize();
    
    logger.info('Document Authentication Service initialized successfully');

    // Create a test document (simple text file for testing)
    const testContent = Buffer.from('This is a test document for authentication testing.');
    
    const testRequest: DocumentVerificationRequest = {
      id: 'test_doc_001',
      file: testContent,
      filename: 'test-document.txt',
      mimeType: 'text/plain',
      size: testContent.length,
      uploadedAt: new Date(),
      userId: 'test_user',
      propertyId: 'test_property'
    };

    logger.info('Starting document verification...');

    // Verify the test document
    const result = await documentAuthService.verifyDocument(testRequest);
    
    logger.info('Document verification completed', 'DocumentAuthTest', {
      documentId: result.documentId,
      status: result.status,
      overallScore: result.overallScore,
      confidence: result.confidence,
      processingTime: result.processingTime,
      checksCount: result.checks.length,
      riskFactorsCount: result.riskFactors.length,
      recommendationsCount: result.recommendations.length
    });

    // Test getting verification result
    const retrievedResult = await documentAuthService.getVerificationResult(testRequest.id);
    if (retrievedResult) {
      logger.info('Successfully retrieved verification result');
    } else {
      logger.error('Failed to retrieve verification result');
    }

    // Test processing status
    const status = await documentAuthService.getProcessingStatus(testRequest.id);
    logger.info('Processing status: ${status}');

    // Test system stats
    const stats = await documentAuthService.getSystemStats();
    logger.info('System statistics retrieved', 'DocumentAuthTest', stats);

    // Shutdown the service
    await documentAuthService.shutdown();
    logger.info('Document Authentication Service test completed successfully');

    return true;

  } catch (error) {
    logger.error({ error: (error as Error).message, stack: (error as Error).stack }, 'Document Authentication Service test failed');
    return false;
  }
}

// Run the test automatically
testDocumentAuth()
  .then((success) => {
    console.log(`Test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    logger.error('Test execution failed', 'DocumentAuthTest', undefined, error);
    console.error('Test FAILED with error:', error);
    process.exit(1);
  });

export { testDocumentAuth };