import "dotenv/config";

import { Server } from "http";
import app from "./app";
import { getPortConfig, validatePort, displayPortConfig } from "./config/ports";
import { initializeDatabase } from "./infrastructure/database/init";
import { logger } from "./infrastructure/observability/telemetry";
import { cleanupManager } from "./utils/cleanup-manager";

// Enhanced type declaration with better documentation
declare global {
  // Using 'var' for global scope as required by TypeScript global declarations
  // eslint-disable-next-line no-var -- Global declarations require 'var' syntax
  var server: Server | undefined;
}


// Environment configuration with validation
const portConfig = getPortConfig();
const PORT = portConfig.server;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Server configuration constants - using numeric separators for clarity
const SERVER_CONFIG = {
  SHUTDOWN_TIMEOUT: 30_000, // 30 seconds
  KEEP_ALIVE_TIMEOUT: 65_000, // Slightly higher than typical load balancer timeout
  HEADERS_TIMEOUT: 66_000, // Must exceed keepAliveTimeout to prevent race conditions
  REQUEST_TIMEOUT: 120_000, // 2-minute timeout for long-running requests
  MAX_HEADERS_COUNT: 1_000, // Prevent header-based DoS attacks
  MIN_PORT: 1,
  MAX_PORT: 65_535,
} as const;

// Port validation is now handled by the ports config module

// Validate port immediately after parsing
if (!validatePort(PORT)) {
  logger.error(
    `Invalid port configuration: "${PORT}". Port must be a number between 1 and 65535.`
  );
  process.exit(1);
}

// Display port configuration
displayPortConfig(portConfig);

/**
 * Type guard for Error objects with comprehensive checking
 * This function provides safer type narrowing for error handling
 */
function isError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    typeof error.message === "string" &&
    typeof error.name === "string"
  );
}

/**
 * Extract meaningful error messages with comprehensive fallback handling
 * This utility ensures we always get a useful error description
 */
function getErrorMessage(error: unknown): string {
  // Handle proper Error instances
  if (isError(error)) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Handle objects with message property (like some API errors)
  // Using object destructuring as preferred by ESLint
  if (error && typeof error === "object" && "message" in error) {
    const { message } = error as Record<string, unknown>;
    if (typeof message === "string") {
      return message;
    }
  }

  // Handle null/undefined gracefully
  if (error === null) return "Null error";
  if (error === undefined) return "Undefined error";

  // Final fallback with safer string conversion
  try {
    return `Unknown error: ${String(error)}`;
  } catch {
    return "Unknown error: [Unable to stringify error object]";
  }
}

/**
 * Enhanced graceful shutdown with better resource management and timeout handling
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Graceful shutdown initiated by signal: ${signal}`);

  // Create abort controller for better timeout management
  const abortController = new AbortController();

  const shutdownTimer = setTimeout(() => {
    logger.error(
      `Forced shutdown after ${SERVER_CONFIG.SHUTDOWN_TIMEOUT}ms timeout`
    );
    abortController.abort();
    process.exit(1);
  }, SERVER_CONFIG.SHUTDOWN_TIMEOUT);

  try {
    // Close HTTP server with proper error handling
    if (global.server) {
      logger.info("Closing HTTP server connections...");

      await new Promise<void>((resolve, reject) => {
        if (abortController.signal.aborted) {
          reject(new Error("Shutdown aborted due to timeout"));
          return;
        }

        // Safely access global.server without non-null assertion
        const currentServer = global.server;
        if (currentServer) {
          currentServer.close((error: Error | undefined) => {
            if (error) {
              reject(error);
            } else {
              logger.info("HTTP server closed successfully");
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    }

    // Execute cleanup procedures
    logger.info("Executing cleanup procedures...");
    await cleanupManager.cleanup();
    logger.info("Cleanup procedures completed");

    // Clear timeout since we completed successfully
    clearTimeout(shutdownTimer);

    logger.info("Graceful shutdown completed successfully");
    process.exit(0);
  } catch (error) {
    clearTimeout(shutdownTimer);

    const errorMessage = getErrorMessage(error);
    logger.error(
      {
        category: "SHUTDOWN",
        message: errorMessage,
        stack: isError(error) ? error.stack : undefined,
        error: isError(error) ? error : undefined,
      },
      "Error during graceful shutdown"
    );

    process.exit(1);
  }
}

/**
 * Configure server timeouts and security settings
 */
function configureServer(server: Server): void {
  server.keepAliveTimeout = SERVER_CONFIG.KEEP_ALIVE_TIMEOUT;
  server.headersTimeout = SERVER_CONFIG.HEADERS_TIMEOUT;
  server.timeout = SERVER_CONFIG.REQUEST_TIMEOUT;
  server.maxHeadersCount = SERVER_CONFIG.MAX_HEADERS_COUNT;

  // Properly structure the logger call with message and metadata
  logger.info({
    category: "SERVER",
    keepAliveTimeout: server.keepAliveTimeout,
    headersTimeout: server.headersTimeout,
    timeout: server.timeout,
    maxHeadersCount: server.maxHeadersCount,
  }, "Server configuration applied");
}

/**
 * Setup process event handlers for better error management
 */
function setupProcessHandlers(): void {
  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    const reasonMessage = getErrorMessage(reason);

    // Properly structure the logger call with message and metadata
    logger.error(
      {
        category: "PROCESS",
        reason: reasonMessage,
        promise: String(promise),
        stack: isError(reason) ? reason.stack : undefined,
        error: isError(reason) ? reason : undefined,
      },
      "Unhandled Promise Rejection detected"
    );

    // Graceful shutdown for unhandled rejections
    void gracefulShutdown("unhandledRejection");
  });

  // Handle uncaught exceptions (more critical)
  process.on("uncaughtException", (error: Error) => {
    // Properly structure the logger call with message and metadata
    logger.error(
      {
        category: "PROCESS",
        message: error.message,
        stack: error.stack,
        name: error.name,
        error,
      },
      "Uncaught Exception detected"
    );

    // Uncaught exceptions require immediate exit
    process.exit(1);
  });

  // Register graceful shutdown signal handlers
  process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
}

/**
 * Initialize database with enhanced error context (non-blocking)
 */
async function initializeDatabaseConnection(): Promise<void> {
  logger.info("Initializing database connection...");

  try {
    await initializeDatabase();
    logger.info("Database initialized successfully");
  } catch (error) {
    logger.warn({
      category: "DATABASE",
      error: error instanceof Error ? error.message : String(error)
    }, "Database initialization failed, continuing with mock data");
    
    // Don't throw error - let server continue with mock data
    console.log("⚠️  Server will continue with mock data for development");
    return;
  }

  logger.info("Database connection established successfully");
}

/**
 * Create and configure HTTP server
 */
async function createHttpServer(): Promise<Server> {
  // eslint-disable-next-line no-console -- Console output is intentional for server startup
  console.log(`🚀 Starting server on port ${PORT}...`);

  const server = app.listen(PORT, '0.0.0.0', () => {
    // Properly structure the logger call with message and metadata
    logger.info({
      category: "SERVER",
      port: PORT,
      environment: NODE_ENV,
      pid: process.pid,
      keepAliveTimeout: SERVER_CONFIG.KEEP_ALIVE_TIMEOUT,
      headersTimeout: SERVER_CONFIG.HEADERS_TIMEOUT,
    }, "HTTP server started successfully");

    // Development-friendly console output with ESLint override comments
    // eslint-disable-next-line no-console -- Intentional startup feedback to user
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    // eslint-disable-next-line no-console -- Intentional startup feedback to user
    console.log(`🌐 Frontend: http://localhost:${PORT}`);

    if (NODE_ENV === "development") {
      // eslint-disable-next-line no-console -- Development environment feedback
      console.log(`🔧 Environment: ${NODE_ENV}`);
      // eslint-disable-next-line no-console -- Development environment feedback
      console.log(`🐛 Debug mode enabled`);
    }
  });

  // Add error handling for the server
  server.on('error', (error: Error) => {
    logger.error({ error: error.message, stack: error.stack }, 'Server error occurred');
    console.error('❌ Server error:', error);
  });

  server.on('close', () => {
    logger.info('Server closed');
    console.log('🔴 Server closed');
  });

  // Store server reference globally for shutdown handling
  global.server = server;

  // Register server cleanup
  cleanupManager.register("http-server", async () => {
    logger.info("Executing HTTP server cleanup...");
    return new Promise<void>((resolve) => {
      server.close(() => {
        logger.info("HTTP server cleanup completed");
        resolve();
      });
    });
  });

  return server;
}

/**
 * Main server initialization function with comprehensive startup sequence
 */
async function startServer(): Promise<void> {
  const startTime = Date.now();

  try {
    // Properly structure the logger call with message and metadata
    logger.info({
      category: "STARTUP",
      port: PORT,
      environment: NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
      timestamp: new Date().toISOString(),
    }, "Server initialization starting");

    // Initialize database connection
    await initializeDatabaseConnection();

    // Create and configure HTTP server
    const server = await createHttpServer();
    configureServer(server);

    // Add health check and test routes before Vite setup
    app.get('/health', (_req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        port: PORT,
        environment: NODE_ENV
      });
    });
    
    app.get('/test', (_req, res) => {
      res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
    });

    // Setup server configuration based on environment
    logger.info("Setting up server configuration...");
    
    if (NODE_ENV === 'production') {
      // In production, serve static files
      const { serveStatic } = await import("./vite");
      serveStatic(app);
      logger.info("Production static file serving configured");
    } else {
      // In development, just serve API routes (frontend runs separately on Vite)
      logger.info("Development mode: API server only (frontend runs on Vite)");
      
      // Add a simple route to confirm API is working
      app.get('/api/status', (_req, res) => {
        res.json({ 
          status: 'API server running',
          environment: NODE_ENV,
          port: PORT,
          timestamp: new Date().toISOString()
        });
      });
    }
    
    logger.info("Server configuration completed successfully");

    // Setup process event handlers
    setupProcessHandlers();

    // Log successful startup with timing
    const startupTime = Date.now() - startTime;

    // Properly structure the logger call with message and metadata
    logger.info({
      category: "STARTUP",
      port: PORT,
      environment: NODE_ENV,
      startupTime: `${startupTime}ms`,
      uptime: process.uptime(),
    }, "Server startup sequence completed successfully");
  } catch (error) {
    // Enhanced error logging with comprehensive context
    const errorMessage = getErrorMessage(error);
    const startupTime = Date.now() - startTime;

    const errorContext = {
      message: errorMessage,
      port: PORT,
      environment: NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      startupTime: `${startupTime}ms`,
      timestamp: new Date().toISOString(),
      stack: isError(error) ? error.stack : undefined,
    };

    // Pass errorContext as the data parameter
    logger.error(
      {
        category: "STARTUP",
        ...errorContext,
        error: isError(error) ? error : undefined,
      },
      "Server startup failed"
    );

    // Attempt cleanup before exit
    try {
      await cleanupManager.cleanup();
    } catch (cleanupError) {
      // Properly structure the logger call with message and metadata
      logger.error(
        {
          category: "CLEANUP",
          error: getErrorMessage(cleanupError),
          errorObj: isError(cleanupError) ? cleanupError : undefined,
        },
        "Error during startup failure cleanup"
      );
    }

    process.exit(1);
  }
}

// Initialize server with top-level error handling
startServer().catch((error) => {
  // Properly structure the logger call with message and metadata
  logger.error(
    {
      category: "STARTUP",
      error: getErrorMessage(error),
      stack: isError(error) ? error.stack : undefined,
      errorObj: isError(error) ? error : undefined,
    },
    "Fatal error in server startup"
  );
  process.exit(1);
});
