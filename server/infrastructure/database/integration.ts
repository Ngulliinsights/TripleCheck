/**
 * Full Backend-Frontend-Database Integration Layer
 * 
 * This module provides a unified integration layer that ensures seamless
 * communication between the frontend, backend API, and database.
 */

import { Express } from "express";
import { DatabaseStorage } from "../infrastructure/storage/storage";
import { initializeDatabase, runMigrations, seedDatabase } from "./connection";
import { registerAuthRoutes } from "../routes/auth";
import { errorHandler, notFoundHandler } from "../middleware/error-handler";
import { validateSession } from "../middleware/auth.middleware";

// Integration configuration
interface IntegrationConfig {
  enableCORS: boolean;
  enableRateLimit: boolean;
  enableSessions: boolean;
  enableFileUploads: boolean;
  enableWebSockets: boolean;
  enableCaching: boolean;
}

// Default configuration
const DEFAULT_CONFIG: IntegrationConfig = {
  enableCORS: true,
  enableRateLimit: true,
  enableSessions: true,
  enableFileUploads: true,
  enableWebSockets: false,
  enableCaching: false
};

export class FullStackIntegration {
  private app: Express;
  private storage: DatabaseStorage;
  private config: IntegrationConfig;

  constructor(app: Express, config: Partial<IntegrationConfig> = {}) {
    this.app = app;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storage = new DatabaseStorage();
  }
  /**
   * Initialize the full integration
   */
  async initialize(): Promise<void> {
    try {
      // Initialize database
      await initializeDatabase();
      await runMigrations();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      console.log('Full stack integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize integration:', error);
      throw error;
    }
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    if (this.config.enableCORS) {
      // CORS middleware would be added here
    }
    
    if (this.config.enableRateLimit) {
      // Rate limiting middleware would be added here
    }
    
    if (this.config.enableSessions) {
      // Session middleware would be added here
    }
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Register authentication routes
    registerAuthRoutes(this.app, this.storage);
    
    // Add other route registrations here
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  /**
   * Get storage instance
   */
  getStorage(): DatabaseStorage {
    return this.storage;
  }
}