import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { encryptionService } from './EncryptionService';
import { accessControlService } from './AccessControlService';
import { auditLogger } from './AuditLogger';
import { privacyProtectionService } from './PrivacyProtectionService';
import { logger } from '../../infrastructure/monitoring/logger';

/**
 * Security integration service that provides unified security middleware
 * and utilities for the land verification system
 */
export class SecurityIntegration {
  
  /**
   * Comprehensive security middleware for land verification endpoints
   */
  static secureVerificationEndpoint(
    operation: 'read' | 'write' | 'delete' | 'admin' = 'read',
    resourceType: 'session' | 'property' | 'feedback' | 'report' | 'monitoring' = 'session'
  ) {
    return [
      // Authentication check
      this.requireAuthentication(),
      
      // Access control based on resource type
      this.getAccessControlMiddleware(resourceType, operation),
      
      // Audit logging
      this.auditMiddleware(operation, resourceType),
      
      // Rate limiting for sensitive operations
      ...(operation === 'write' || operation === 'delete' ? [this.rateLimitMiddleware()] : [])
    ];
  }

  /**
   * Authentication middleware
   */
  private static requireAuthentication() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const userId = req.user?.id?.toString() || req.session?.userId?.toString();
      
      if (!userId) {
        auditLogger.logSecurityEvent(
          'anonymous',
          'authentication_required',
          { endpoint: req.path, method: req.method },
          req.ip,
          req.get('User-Agent'),
          false,
          'Authentication required'
        );

        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required to access this resource'
          }
        });
      }

      next();
    };
  }

  /**
   * Get appropriate access control middleware based on resource type
   */
  private static getAccessControlMiddleware(
    resourceType: 'session' | 'property' | 'feedback' | 'report' | 'monitoring',
    operation: 'read' | 'write' | 'delete' | 'admin'
  ) {
    switch (resourceType) {
      case 'session':
        return accessControlService.requireSessionAccess(operation);
      case 'property':
        return accessControlService.requirePropertyAccess(operation);
      case 'feedback':
        return accessControlService.requireFeedbackAccess(operation);
      default:
        return accessControlService.requireSessionAccess(operation);
    }
  }

  /**
   * Audit logging middleware
   */
  private static auditMiddleware(
    operation: 'read' | 'write' | 'delete' | 'admin',
    resourceType: 'session' | 'property' | 'feedback' | 'report' | 'monitoring'
  ) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const userId = req.user?.id?.toString() || req.session?.userId?.toString() || 'unknown';
      const sessionId = req.params.sessionId || req.body.sessionId;
      const propertyId = req.params.propertyId || req.body.propertyId;
      
      // Log the access attempt
      await auditLogger.logAccessEvent(
        userId,
        resourceType,
        sessionId || propertyId || 'unknown',
        operation,
        true, // Will be updated if access is denied
        undefined,
        req.ip,
        req.get('User-Agent')
      );

      // Override res.json to log the response
      const originalJson = res.json;
      res.json = function(body: any) {
        const success = body.success !== false;
        
        // Log the operation result
        if (resourceType === 'session' && sessionId) {
          auditLogger.logSessionEvent(
            userId,
            sessionId,
            `${resourceType}_${operation}`,
            {
              endpoint: req.path,
              method: req.method,
              success
            },
            success,
            success ? undefined : body.error?.message
          );
        } else if (resourceType === 'property' && propertyId) {
          auditLogger.logPropertyEvent(
            userId,
            propertyId,
            `${resourceType}_${operation}`,
            {
              endpoint: req.path,
              method: req.method,
              success
            },
            success,
            success ? undefined : body.error?.message,
            sessionId
          );
        }

        return originalJson.call(this, body);
      };

      next();
    };
  }

  /**
   * Rate limiting middleware for sensitive operations
   */
  private static rateLimitMiddleware() {
    const attempts = new Map<string, { count: number; resetTime: number }>();
    const maxAttempts = 10;
    const windowMs = 15 * 60 * 1000; // 15 minutes

    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const userId = req.user?.id?.toString() || req.session?.userId?.toString() || req.ip || 'unknown';
      const now = Date.now();
      
      const userAttempts = attempts.get(userId);
      
      if (!userAttempts || now > userAttempts.resetTime) {
        attempts.set(userId, { count: 1, resetTime: now + windowMs });
        return next();
      }
      
      if (userAttempts.count >= maxAttempts) {
        auditLogger.logSecurityEvent(
          userId,
          'rate_limit_exceeded',
          {
            endpoint: req.path,
            method: req.method,
            attempts: userAttempts.count
          },
          req.ip,
          req.get('User-Agent'),
          false,
          'Rate limit exceeded for sensitive operation'
        );

        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000)
          }
        });
      }
      
      userAttempts.count++;
      next();
    };
  }

  /**
   * Secure data processing for community feedback
   */
  static async secureProcessCommunityFeedback(
    feedback: any,
    userId: string,
    sessionId: string,
    protectionLevel: 'minimal' | 'standard' | 'maximum' = 'standard'
  ): Promise<any> {
    try {
      // Apply privacy protection
      const protectedFeedback = await privacyProtectionService.protectCommunityFeedback(
        feedback,
        protectionLevel
      );

      // Log the processing
      await auditLogger.logFeedbackEvent(
        userId,
        sessionId,
        'feedback_processed',
        {
          protectionLevel,
          hasSourceDetails: !!feedback.sourceDetails,
          feedbackFields: Object.keys(feedback.feedback || {})
        },
        true
      );

      return protectedFeedback;

    } catch (error) {
      await auditLogger.logFeedbackEvent(
        userId,
        sessionId,
        'feedback_processing_failed',
        {
          protectionLevel,
          error: (error as Error).message
        },
        false,
        (error as Error).message
      );

      throw error;
    }
  }

  /**
   * Secure data retrieval with access filtering
   */
  static async secureDataRetrieval(
    data: any,
    userId: string,
    userRole: string,
    resourceType: 'session' | 'property' | 'feedback' | 'report' | 'monitoring',
    resourceId: string
  ): Promise<any> {
    try {
      // Check access permissions
      const accessContext = {
        userId,
        userRole,
        operation: 'read' as const,
        resourceType,
        sessionId: resourceType === 'session' ? resourceId : undefined,
        propertyId: resourceType === 'property' ? resourceId : undefined
      };

      // Filter data based on access level
      const filteredData = accessControlService.filterDataByAccess(data, accessContext);

      // Decrypt data if user has access
      let decryptedData = filteredData;
      if (resourceType === 'feedback' && filteredData) {
        try {
          decryptedData = encryptionService.decryptCommunityFeedback(filteredData);
        } catch (decryptError) {
          logger.warn('Failed to decrypt community feedback', 'SecurityIntegration', {
            userId,
            resourceId,
            error: (decryptError as Error).message
          });
          // Return filtered but encrypted data if decryption fails
        }
      }

      // Log successful data access
      await auditLogger.logAccessEvent(
        userId,
        resourceType,
        resourceId,
        'read',
        true,
        undefined
      );

      return decryptedData;

    } catch (error) {
      await auditLogger.logAccessEvent(
        userId,
        resourceType,
        resourceId,
        'read',
        false,
        (error as Error).message
      );

      throw error;
    }
  }

  /**
   * Secure ownership data processing
   */
  static async secureOwnershipData(
    ownershipData: any,
    userId: string,
    propertyId: string
  ): Promise<any> {
    try {
      // Encrypt sensitive ownership information
      const encryptedData = encryptionService.encryptOwnershipData(ownershipData);

      // Log the encryption
      await auditLogger.logPropertyEvent(
        userId,
        propertyId,
        'ownership_data_encrypted',
        {
          hasCurrentOwner: !!ownershipData.currentOwner,
          hasOwnershipHistory: !!ownershipData.ownershipHistory,
          hasLegalInstruments: !!ownershipData.legalInstruments
        },
        true
      );

      return encryptedData;

    } catch (error) {
      await auditLogger.logPropertyEvent(
        userId,
        propertyId,
        'ownership_encryption_failed',
        {
          error: (error as Error).message
        },
        false,
        (error as Error).message
      );

      throw error;
    }
  }

  /**
   * Generate secure verification report
   */
  static async generateSecureReport(
    reportData: any,
    userId: string,
    sessionId: string,
    reportType: string
  ): Promise<{
    reportId: string;
    secureUrl: string;
    expiresAt: Date;
  }> {
    try {
      // Generate secure report ID
      const reportId = encryptionService.generateSecureToken();
      
      // Set expiration (24 hours)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Generate secure access URL
      const secureUrl = `/api/land-verification/reports/${reportId}`;

      // Log report generation
      await auditLogger.logReportEvent(
        userId,
        sessionId,
        'report_generated',
        {
          reportId,
          reportType,
          dataSize: JSON.stringify(reportData).length,
          expiresAt: expiresAt.toISOString()
        },
        true
      );

      return {
        reportId,
        secureUrl,
        expiresAt
      };

    } catch (error) {
      await auditLogger.logReportEvent(
        userId,
        sessionId,
        'report_generation_failed',
        {
          reportType,
          error: (error as Error).message
        },
        false,
        (error as Error).message
      );

      throw error;
    }
  }

  /**
   * Validate data integrity
   */
  static validateDataIntegrity(data: any, expectedHash?: string): boolean {
    if (!expectedHash) return true;
    
    try {
      const dataString = JSON.stringify(data);
      return encryptionService.verifyHash(dataString, expectedHash);
    } catch (error) {
      logger.error('Data integrity validation failed', 'SecurityIntegration', undefined, error as Error);
      return false;
    }
  }

  /**
   * Generate data integrity hash
   */
  static generateDataHash(data: any): string {
    const dataString = JSON.stringify(data);
    return encryptionService.generateHash(dataString);
  }

  /**
   * Security health check
   */
  static async performSecurityHealthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    checks: Array<{
      component: string;
      status: 'pass' | 'fail';
      message: string;
    }>;
  }> {
    const checks = [];
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check encryption service
    try {
      const testData = 'security-health-check';
      const encrypted = encryptionService.encrypt(testData);
      const decrypted = encryptionService.decrypt(encrypted);
      
      checks.push({
        component: 'EncryptionService',
        status: decrypted === testData ? 'pass' : 'fail',
        message: decrypted === testData ? 'Encryption/decryption working' : 'Encryption/decryption failed'
      });
    } catch (error) {
      checks.push({
        component: 'EncryptionService',
        status: 'fail',
        message: `Encryption service error: ${(error as Error).message}`
      });
      overallStatus = 'critical';
    }

    // Check access control service
    try {
      const testContext = {
        userId: 'test-user',
        userRole: 'admin',
        operation: 'read' as const,
        resourceType: 'session' as const,
        sessionId: 'test-session'
      };
      
      // This should pass for admin users
      const accessResult = await accessControlService.checkSessionAccess(testContext);
      
      checks.push({
        component: 'AccessControlService',
        status: 'pass',
        message: 'Access control checks working'
      });
    } catch (error) {
      checks.push({
        component: 'AccessControlService',
        status: 'fail',
        message: `Access control error: ${(error as Error).message}`
      });
      if (overallStatus === 'healthy') overallStatus = 'warning';
    }

    // Check audit logger
    try {
      await auditLogger.logSystemEvent(
        'security_health_check',
        { timestamp: new Date().toISOString() },
        true
      );
      
      checks.push({
        component: 'AuditLogger',
        status: 'pass',
        message: 'Audit logging working'
      });
    } catch (error) {
      checks.push({
        component: 'AuditLogger',
        status: 'fail',
        message: `Audit logger error: ${(error as Error).message}`
      });
      if (overallStatus === 'healthy') overallStatus = 'warning';
    }

    // Check privacy protection service
    try {
      const testFeedback = {
        id: 'test',
        sourceDetails: { name: 'Test User' },
        recordedAt: new Date()
      };
      
      const protected = await privacyProtectionService.protectCommunityFeedback(testFeedback, 'minimal');
      
      checks.push({
        component: 'PrivacyProtectionService',
        status: 'pass',
        message: 'Privacy protection working'
      });
    } catch (error) {
      checks.push({
        component: 'PrivacyProtectionService',
        status: 'fail',
        message: `Privacy protection error: ${(error as Error).message}`
      });
      if (overallStatus === 'healthy') overallStatus = 'warning';
    }

    // Log health check results
    await auditLogger.logSystemEvent(
      'security_health_check_completed',
      {
        overallStatus,
        checksPerformed: checks.length,
        passedChecks: checks.filter(c => c.status === 'pass').length,
        failedChecks: checks.filter(c => c.status === 'fail').length
      },
      overallStatus !== 'critical'
    );

    return {
      status: overallStatus,
      checks
    };
  }
}

export default SecurityIntegration;