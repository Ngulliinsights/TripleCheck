import 'dotenv/config';
import { Server } from 'http';
import app from './app';
import { initializeDatabase } from './infrastructure/database/connection';
import { logger } from './infrastructure/monitoring/logging.service';
import { setupServer } from './vite';
import { cleanupManager } from './utils/cleanup-manager';

// Type declaration for global server reference
// This tells TypeScript that we're extending the global object safely
declare global {
  var server: Server | undefined;
}

// Environment configuration with validation
const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate port number is within acceptable range
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  logger.error(`Invalid port number: ${process.env.PORT}. Using default port 3000.`);
  process.exit(1);
}

/**
 * Type guard function to safely check if an error is an Error object
 * This helps us handle the 'unknown' type that TypeScript gives us in catch blocks
 */
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Graceful shutdown handler to ensure clean resource cleanup
 * This prevents database connections from hanging and ensures logs are flushed
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Give ongoing requests time to complete (30 second timeout)
    const shutdownTimer = setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);

    // Close server and cleanup resources
    if (global.server) {
      await new Promise<void>((resolve) => {
        global.server!.close(() => resolve());
      });
    }

    // Clear the forced shutdown timer since we're shutting down cleanly
    clearTimeout(shutdownTimer);
    
    logger.info('Server shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    // Use type guard to safely handle the unknown error type
    const errorMessage = isError(error) ? error.message : 'Unknown error occurred';
    logger.error(`Error during graceful shutdown: ${errorMessage}`);
    process.exit(1);
  }
}

/**
 * Initialize and start the server with comprehensive error handling
 * This function handles the complete startup sequence with proper logging
 */
async function startServer(): Promise<void> {
  try {
    // Log startup information for debugging and monitoring
    // Note: We use template literals for structured information that logger can handle
    logger.info(`Starting server initialization... Port: ${PORT}, Environment: ${NODE_ENV}, Node: ${process.version}, Platform: ${process.platform}`);

    // Initialize database connection
    logger.info('Initializing database connection...');
    const dbResult = await initializeDatabase();
    if (!dbResult.success) {
      throw new Error(`Database initialization failed: ${dbResult.error}`);
    }
    logger.info('Database initialized successfully');

    // Start the HTTP server
    logger.info(`Starting HTTP server on port ${PORT}...`);
    const server = app.listen(PORT, () => {
      // Use structured logging for better monitoring integration
      logger.info(`Server started successfully - Port: ${PORT}, Environment: ${NODE_ENV}, PID: ${process.pid}`);
      
      // Console output for development convenience
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      
      if (NODE_ENV === 'development') {
        console.log(`🔧 Environment: ${NODE_ENV}`);
      }
    });

    // Register server cleanup
    cleanupManager.register('http-server', () => {
      server.close();
    });

    // Configure server timeout settings for better reliability
    server.keepAliveTimeout = 65000; // Slightly higher than load balancer timeout
    server.headersTimeout = 66000;   // Must be higher than keepAliveTimeout

    // Setup Vite integration for frontend serving
    logger.info('Setting up Vite integration...');
    await setupServer(app, server);
    logger.info('Vite integration configured successfully');

    // Cleanup manager handles all shutdown scenarios automatically
    process.on('unhandledRejection', (reason) => {
      const reasonMessage = isError(reason) ? reason.message : String(reason);
      logger.error(`Unhandled Rejection: ${reasonMessage}`);
      gracefulShutdown('unhandledRejection');
    });

    logger.info('Server startup completed successfully');

  } catch (error) {
    // Enhanced error logging with context using type-safe error handling
    const errorMessage = isError(error) ? error.message : 'Unknown error occurred';
    const errorStack = isError(error) ? error.stack : 'No stack trace available';
    
    logger.error(`Failed to start server: ${errorMessage} | Port: ${PORT} | Environment: ${NODE_ENV} | Stack: ${errorStack}`);
    
    // Ensure we exit with proper error code for process managers
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();