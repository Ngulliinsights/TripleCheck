import { Express } from 'express';
import { AuthRoutes } from './AuthRoutes';
import { PropertyRoutes } from './PropertyRoutes';
import { ReviewRoutes } from './reviews.routes';
import { UserRoutes } from './users.routes';
import { VerificationRoutes } from './verification.routes';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { PropertyService } from '../services/PropertyService';
import { VerificationService } from '../services/VerificationService';
import { ReviewService } from '../services/ReviewService';
import { storage } from '../infrastructure/storage/storage';

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
      // Register authentication routes (no auth required for these endpoints)
      this.app.use('/api/auth', this.authRoutes.getRouter());

      // Register property routes (mixed auth requirements)
      this.app.use('/api/properties', this.propertyRoutes.getRouter());

      // Register review routes (mixed auth requirements)
      this.app.use('/api/reviews', this.reviewRoutes.getRouter());

      // Register user routes (auth required for most endpoints)
      this.app.use('/api/users', this.userRoutes.getRouter());

      // Register verification routes (mixed auth requirements)
      this.app.use('/api/verification', this.verificationRoutes.getRouter());

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
      console.log('Initializing route modules...');

      // Initialize route modules in dependency order
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

      console.log('All route modules initialized successfully');
    } catch (error) {
      console.error('Failed to initialize route modules:', error);
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
      
      // Perform any cleanup operations here
      // For example, closing database connections, clearing caches, etc.
      
      console.log('Routes coordinator shutdown complete');
    } catch (error) {
      console.error('Error during routes coordinator shutdown:', error);
      throw error;
    }
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