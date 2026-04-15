import { DocumentAuthService } from '../document-auth/DocumentAuthService';
import { logger } from '../infrastructure/observability/telemetry';

import { DocumentIntegration } from './DocumentIntegration';
import { ExpertCoordinationService } from './ExpertCoordinationService';
import { LandVerificationService } from './LandVerificationService';
import { MonitoringService } from './MonitoringService';

export interface LandVerificationServiceConfig {
  enableDocumentIntegration?: boolean;
  defaultVerificationLayers?: ('registry' | 'physical' | 'community' | 'government' | 'legal' | 'expert')[];
  riskThresholds?: {
    low: number;
    medium: number;
    high: number;
  };
  monitoringDefaults?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    alertThresholds: Record<string, number>;
  };
}

export class LandVerificationServiceFactory {
  private static instance: LandVerificationService | null = null;
  private static documentIntegration: DocumentIntegration | null = null;
  private static expertCoordinationService: ExpertCoordinationService | null = null;
  private static monitoringService: MonitoringService | null = null;

  static async createService(
    documentAuthService: DocumentAuthService,
    config: LandVerificationServiceConfig = {}
  ): Promise<{
    landVerificationService: LandVerificationService;
    documentIntegration: DocumentIntegration;
    expertCoordinationService: ExpertCoordinationService;
    monitoringService: MonitoringService;
  }> {
    logger.info('Creating Land Verification Service...');

    try {
      // Validate dependencies
      if (!documentAuthService) {
        throw new Error('Document Authentication Service is required');
      }

      // Create Land Verification Service
      const landVerificationService = new LandVerificationService(documentAuthService);

      // Initialize the service
      await landVerificationService.initialize();

      // Create Document Integration if enabled
      let documentIntegration: DocumentIntegration | null = null;
      if (config.enableDocumentIntegration !== false) {
        documentIntegration = new DocumentIntegration(
          documentAuthService,
          landVerificationService
        );
      }

      // Create Expert Coordination Service
      const expertCoordinationService = new ExpertCoordinationService();
      await expertCoordinationService.initialize();

      // Create Monitoring Service
      const monitoringService = new MonitoringService();
      await monitoringService.initialize();

      // Apply configuration
      this.applyConfiguration(landVerificationService, config);

      // Set up event listeners for integration
      if (documentIntegration) {
        this.setupIntegrationEventListeners(landVerificationService, documentIntegration, expertCoordinationService, monitoringService);
      }

      logger.info('Land Verification Service created successfully');

      return {
        landVerificationService,
        documentIntegration: documentIntegration!,
        expertCoordinationService,
        monitoringService
      };

    } catch (error) {
      logger.error({ error: (error as Error).message, stack: (error as Error).stack }, 'Failed to create Land Verification Service');
      throw error;
    }
  }

  static async createSingletonService(
    documentAuthService: DocumentAuthService,
    config: LandVerificationServiceConfig = {}
  ): Promise<{
    landVerificationService: LandVerificationService;
    documentIntegration: DocumentIntegration;
    expertCoordinationService: ExpertCoordinationService;
    monitoringService: MonitoringService;
  }> {
    if (!this.instance) {
      const services = await this.createService(documentAuthService, config);
      this.instance = services.landVerificationService;
      this.documentIntegration = services.documentIntegration;
      this.expertCoordinationService = services.expertCoordinationService;
      this.monitoringService = services.monitoringService;
      
      return services;
    }

    return {
      landVerificationService: this.instance,
      documentIntegration: this.documentIntegration!,
      expertCoordinationService: this.expertCoordinationService!,
      monitoringService: this.monitoringService!
    };
  }

  private static applyConfiguration(
    service: LandVerificationService,
    config: LandVerificationServiceConfig
  ): void {
    // Configuration will be applied through service methods
    // This is a placeholder for future configuration options
    
    if (config.riskThresholds) {
      logger.info('Applied risk thresholds configuration');
    }

    if (config.monitoringDefaults) {
      logger.info('Applied monitoring defaults configuration');
    }

    if (config.defaultVerificationLayers) {
      logger.info(`Applied default verification layers: ${config.defaultVerificationLayers.join(', ')}`, 'LandVerificationServiceFactory');
    }
  }

  private static setupIntegrationEventListeners(
    landService: LandVerificationService,
    documentIntegration: DocumentIntegration,
    expertCoordinationService: ExpertCoordinationService,
    monitoringService?: MonitoringService
  ): void {
    // Set up event listeners for service integration
    
    landService.on('verification_initiated', (event) => {
      logger.info('Land verification initiated: ${event.sessionId}');
    });

    landService.on('layer_completed', (event) => {
      logger.info('Verification layer completed: ${event.layerType} for session ${event.sessionId}');
    });

    landService.on('verification_completed', (event) => {
      logger.info('Land verification completed: ${event.sessionId}');
    });

    landService.on('risk_assessment_generated', (event) => {
      logger.info('Risk assessment generated for session ${event.sessionId} - Score: ${event.riskAssessment.overallRiskScore}');
    });

    landService.on('monitoring_scheduled', (event) => {
      logger.info('Monitoring scheduled for property ${event.propertyId}');
    });

    landService.on('document_verified', (event) => {
      logger.info('Document verified for session ${event.sessionId} - Type: ${event.documentType}');
    });

    // Set up error handling
    landService.on('error', (error) => {
      logger.error('Land Verification Service error', 'LandVerificationServiceFactory', undefined, error);
    });

    // Set up Expert Coordination Service event listeners
    expertCoordinationService.on('expert_assigned', (event) => {
      logger.info('Expert assigned: ${event.expertName} (${event.expertType}) to session ${event.sessionId}');
    });

    expertCoordinationService.on('expert_activities_coordinated', (event) => {
      logger.info('Expert activities coordinated for session ${event.sessionId} - ${event.assignmentCount} assignments');
    });

    expertCoordinationService.on('expert_report_integrated', (event) => {
      logger.info('Expert report integrated for session ${event.sessionId} - Quality score: ${event.qualityScore}');
    });

    expertCoordinationService.on('expert_conflicts_resolved', (event) => {
      logger.info('Expert conflicts resolved for session ${event.sessionId} - ${event.resolutionCount} resolutions');
    });

    // Set up Monitoring Service event listeners
    if (monitoringService) {
      monitoringService.on('monitoring_scheduled', (event) => {
        logger.info('Monitoring scheduled for property ${event.propertyId} with ${event.monitoringSessions.length} monitoring types');
      });

      monitoringService.on('alert_created', (event) => {
        logger.info('Alert created: ${event.alert.title} (${event.alert.severity}) for property ${event.alert.propertyId}');
      });

      monitoringService.on('monitoring_check_completed', (event) => {
        logger.info('Monitoring check completed: ${event.monitoringType} for session ${event.sessionId}');
      });

      monitoringService.on('risk_assessments_updated', (event) => {
        logger.info('Risk assessments updated for property ${event.propertyId} based on ${event.regulatoryUpdates.length} regulatory updates');
      });

      monitoringService.on('monitoring_paused', (event) => {
        logger.info('Monitoring paused for session ${event.monitoringId}');
      });

      monitoringService.on('monitoring_resumed', (event) => {
        logger.info('Monitoring resumed for session ${event.monitoringId}');
      });
    }
  }

  static async shutdownService(): Promise<void> {
    if (this.instance) {
      logger.info('Shutting down Land Verification Service...');
      await this.instance.shutdown();
      this.instance = null;
      this.documentIntegration = null;
      this.expertCoordinationService = null;
      this.monitoringService = null;
      logger.info('Land Verification Service shutdown complete');
    }
  }

  static getInstance(): LandVerificationService | null {
    return this.instance;
  }

  static getDocumentIntegration(): DocumentIntegration | null {
    return this.documentIntegration;
  }

  static getExpertCoordinationService(): ExpertCoordinationService | null {
    return this.expertCoordinationService;
  }

  static getMonitoringService(): MonitoringService | null {
    return this.monitoringService;
  }
}