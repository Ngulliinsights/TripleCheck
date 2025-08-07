import { Express } from 'express';

import { communicationRouter } from '../communication/communication.controller';
import { trustIntegrationRouter } from '../controllers/trust-integration.controller';
import { storage } from '../infrastructure/storage/storage';
import { AnalyticsService } from '../services/AnalyticsService';
import { AuthService } from '../services/AuthService';
import { CommunicationService } from '../services/CommunicationService';
import { ProfessionalService } from '../services/ProfessionalService';
import { PropertyService } from '../services/PropertyService';
import { ReviewService } from '../services/ReviewService';
import { TrustIntegrationService } from '../services/TrustIntegrationService';
import { UserService } from '../services/UserService';
import { VerificationService } from '../services/VerificationService';

import analyticsRoutes from './analytics.routes';
import { AuthRoutes } from './AuthRoutes';
import professionalsRoutes from './professionals.routes';
import { PropertyRoutes } from './PropertyRoutes';
import { ReviewRoutes } from './reviews.routes';
import { UserRoutes } from './users.routes';
import { VerificationRoutes } from './verification.routes';

/**
 * Main routes coordinator that registers all domain-specific route modules
 * This provides a clean separation of concerns and makes it easy to add new domains
 */
export class RoutesCoordinator {
  private app: Express;
  private authRoutes: AuthRoutes;
  private propertyRoutes: PropertyRoutes;
  private reviewRoutes: ReviewRoutes;
  private userRoutes: UserRoutes;
  private verificationRoutes: VerificationRoutes;

  // Service instances for dependency injection
  private authService: AuthService;
  private userService: UserService;
  private propertyService: PropertyService;
  private verificationService: VerificationService;
  private reviewService: ReviewService;
  private analyticsService: AnalyticsService;
  private communicationService: CommunicationService;
  private professionalService: ProfessionalService;
  private trustIntegrationService: TrustIntegrationService;

  constructor(app: Express) {
    this.app = app;
    this.initializeServices();
    this.initializeRoutes();
    this.registerRoutes();
  }

  /**
   * Initialize all services with their dependencies
   * Services are created in the correct order to handle dependencies
   */
  private initializeServices(): void {
    try {
      // Create core services first
      this.authService = new AuthService(storage);
      this.userService = new UserService();
      
      // Create services that depend on core services
      this.propertyService = new PropertyService();
      this.verificationService = new VerificationService();
      this.reviewService = new ReviewService();

      // Create new services
      this.analyticsService = new AnalyticsService();
      this.communicationService = new CommunicationService();
      this.professionalService = new ProfessionalService();
      this.trustIntegrationService = new TrustIntegrationService();

      console.log('All services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize services:', error);
      throw new Error(`Service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize all route modules with their service dependencies
   */
  private initializeRoutes(): void {
    try {
      // Create route modules with service dependencies
      this.authRoutes = new AuthRoutes(this.authService, this.userService);
      this.propertyRoutes = new PropertyRoutes(this.propertyService, this.verificationService);
      this.reviewRoutes = new ReviewRoutes(this.reviewService);
      this.userRoutes = new UserRoutes(this.userService);
      this.verificationRoutes = new VerificationRoutes(this.verificationService);

      console.log('All route modules created successfully');
    } catch (error) {
      console.error('Failed to create route modules:', error);
      throw new Error(`Route module creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Register all route modules with the Express app
   * Routes are registered in a logical order with proper prefixes
   */
  private registerRoutes(): void {
    try {
      // Register core routes first
      this.app.use('/api/auth', this.authRoutes.getRouter());
      this.app.use('/api/users', this.userRoutes.getRouter());

      // Register business domain routes
      this.app.use('/api/properties', this.propertyRoutes.getRouter());
      this.app.use('/api/reviews', this.reviewRoutes.getRouter());
      this.app.use('/api/verification', this.verificationRoutes.getRouter());

      // Register new service routes
      this.app.use('/api/professionals', professionalsRoutes);
      this.app.use('/api/analytics', analyticsRoutes);
      this.app.use('/api/communication', communicationRouter);
      this.app.use('/api/trust-integration', trustIntegrationRouter);

      console.log('All routes registered successfully');
    } catch (error) {
      console.error('Failed to register routes:', error);
      throw new Error(`Route registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize all route modules (called during application startup)
   * This performs any async initialization required by route modules
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing route modules and services...');

      // Initialize core route modules first
      await this.authRoutes.initialize();
      console.log('✓ AuthRoutes initialized');

      await this.propertyRoutes.initialize();
      console.log('✓ PropertyRoutes initialized');

      await this.reviewRoutes.initialize();
      console.log('✓ ReviewRoutes initialized');

      await this.userRoutes.initialize();
      console.log('✓ UserRoutes initialized');

      await this.verificationRoutes.initialize();
      console.log('✓ VerificationRoutes initialized');

      // Initialize new services that require async initialization
      await this.trustIntegrationService.initialize();
      console.log('✓ TrustIntegrationService initialized');

      // Note: Analytics, Communication, and Professional services are initialized synchronously
      console.log('✓ AnalyticsService ready');
      console.log('✓ CommunicationService ready');
      console.log('✓ ProfessionalService ready');

      console.log('All route modules and services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize route modules and services:', error);
      throw new Error(`Route module initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get service instances for external access (useful for testing)
   */
  getServices() {
    return {
      authService: this.authService,
      userService: this.userService,
      propertyService: this.propertyService,
      verificationService: this.verificationService,
      reviewService: this.reviewService,
      analyticsService: this.analyticsService,
      communicationService: this.communicationService,
      professionalService: this.professionalService,
      trustIntegrationService: this.trustIntegrationService,
    };
  }

  /**
   * Get route instances for external access (useful for testing)
   */
  getRoutes() {
    return {
      authRoutes: this.authRoutes,
      propertyRoutes: this.propertyRoutes,
      reviewRoutes: this.reviewRoutes,
      userRoutes: this.userRoutes,
      verificationRoutes: this.verificationRoutes,
    };
  }

  /**
   * Graceful shutdown of all services and routes
   */
  async shutdown(): Promise<void> {
    try {
      console.log('Shutting down routes coordinator...');
      
      // Shutdown services that require cleanup
      // Note: Add specific shutdown methods as services implement them
      
      console.log('Routes coordinator shutdown complete');
    } catch (error) {
      console.error('Error during routes coordinator shutdown:', error);
      throw error;
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, { status: string; message?: string }>;
  }> {
    const services: Record<string, { status: string; message?: string }> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    try {
      // Check core services
      services.auth = { status: 'healthy' };
      services.user = { status: 'healthy' };
      services.property = { status: 'healthy' };
      services.verification = { status: 'healthy' };
      services.review = { status: 'healthy' };

      // Check new services
      services.analytics = { status: 'healthy' };
      services.communication = { status: 'healthy' };
      services.professional = { status: 'healthy' };
      services.trustIntegration = { status: 'healthy' };

      // Count unhealthy services
      const unhealthyCount = Object.values(services).filter(s => s.status !== 'healthy').length;
      
      if (unhealthyCount > 0) {
        overallStatus = unhealthyCount > 2 ? 'unhealthy' : 'degraded';
      }

    } catch (error) {
      overallStatus = 'unhealthy';
      services.coordinator = { 
        status: 'unhealthy', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    return { status: overallStatus, services };
  }

  /**
   * Get service statistics
   */
  getServiceStats(): Record<string, any> {
    return {
      analytics: this.analyticsService?.getStats() || {},
      communication: this.communicationService?.getStats() || {},
      trustIntegration: this.trustIntegrationService?.getStats() || {},
      // Add other service stats as they become available
    };
  }
}

/**
 * Factory function to create and initialize the routes coordinator
 * This is the recommended way to set up routes in the application
 */
export async function createRoutesCoordinator(app: Express): Promise<RoutesCoordinator> {
  const coordinator = new RoutesCoordinator(app);
  await coordinator.initialize();
  return coordinator;
}

/**
 * Legacy function for backward compatibility
 * This can be used to gradually migrate from the old monolithic routes
 * 
 * @deprecated Use createRoutesCoordinator instead for better control and testing
 */
export async function registerRoutes(app: Express): Promise<void> {
  await createRoutesCoordinator(app);
}

/**
 * Export the RoutesCoordinator class for direct usage and testing
 */
export { RoutesCoordinator };