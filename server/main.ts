import "dotenv/config";

import { Server } from "http";

import app from "./app";
import { initializeDatabase } from "./infrastructure/database/connection";
import { logger } from "./infrastructure/monitoring/logging.service";
import { cleanupManager } from "./utils/cleanup-manager";
import { setupServer } from "./vite";

// Enhanced type declaration with better documentation
declare global {
  // Using 'var' for global scope as required by TypeScript global declarations
  // eslint-disable-next-line no-var -- Global declarations require 'var' syntax
  var server: Server | undefined;
}

// Environment configuration with validation
const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

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

// Comprehensive port validation with early exit pattern
function validatePort(port: number): void {
  if (
    isNaN(port) ||
    port < SERVER_CONFIG.MIN_PORT ||
    port > SERVER_CONFIG.MAX_PORT
  ) {
    logger.error(
      `Invalid port configuration: "${process.env.PORT}". Port must be a number between ${SERVER_CONFIG.MIN_PORT} and ${SERVER_CONFIG.MAX_PORT}.`
    );
    process.exit(1);
  }
}

// Validate port immediately after parsing
validatePort(PORT);

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
      "Error during graceful shutdown",
      "SHUTDOWN",
      {
        message: errorMessage,
        stack: isError(error) ? error.stack : undefined,
      },
      isError(error) ? error : undefined
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
  logger.info("Server configuration applied", "SERVER", {
    keepAliveTimeout: server.keepAliveTimeout,
    headersTimeout: server.headersTimeout,
    timeout: server.timeout,
    maxHeadersCount: server.maxHeadersCount,
  });
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
      "Unhandled Promise Rejection detected",
      "PROCESS",
      {
        reason: reasonMessage,
        promise: String(promise),
        stack: isError(reason) ? reason.stack : undefined,
      },
      isError(reason) ? reason : undefined
    );

    // Graceful shutdown for unhandled rejections
    void gracefulShutdown("unhandledRejection");
  });

  // Handle uncaught exceptions (more critical)
  process.on("uncaughtException", (error: Error) => {
    // Properly structure the logger call with message and metadata
    logger.error(
      "Uncaught Exception detected",
      "PROCESS",
      {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      error
    );

    // Uncaught exceptions require immediate exit
    process.exit(1);
  });

  // Register graceful shutdown signal handlers
  process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
}

/**
 * Initialize database with enhanced error context
 */
async function initializeDatabaseConnection(): Promise<void> {
  logger.info("Initializing database connection...");

  const dbResult = await initializeDatabase();

  if (!dbResult.success) {
    throw new Error(
      `Database initialization failed: ${dbResult.error || "Unknown database error"}`
    );
  }

  logger.info("Database connection established successfully");
}

/**
 * Create and configure HTTP server
 */
async function createHttpServer(): Promise<Server> {
  // eslint-disable-next-line no-console -- Console output is intentional for server startup
  console.log(`🚀 Starting server on port ${PORT}...`);

  const server = app.listen(PORT, () => {
    // Properly structure the logger call with message and metadata
    logger.info("HTTP server started successfully", "SERVER", {
      port: PORT,
      environment: NODE_ENV,
      pid: process.pid,
      keepAliveTimeout: SERVER_CONFIG.KEEP_ALIVE_TIMEOUT,
      headersTimeout: SERVER_CONFIG.HEADERS_TIMEOUT,
    });

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
    logger.info("Server initialization starting", "STARTUP", {
      port: PORT,
      environment: NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
      timestamp: new Date().toISOString(),
    });

    // Initialize database connection
    await initializeDatabaseConnection();

    // Create and configure HTTP server
    const server = await createHttpServer();
    configureServer(server);

    // Setup Vite integration
    logger.info("Configuring Vite integration...");
    await setupServer(app, server);
    logger.info("Vite integration configured successfully");

    // Setup process event handlers
    setupProcessHandlers();

    // Log successful startup with timing
    const startupTime = Date.now() - startTime;

    // Properly structure the logger call with message and metadata
    logger.info("Server startup sequence completed successfully", "STARTUP", {
      port: PORT,
      environment: NODE_ENV,
      startupTime: `${startupTime}ms`,
      uptime: process.uptime(),
    });
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
      "Server startup failed",
      "STARTUP",
      errorContext,
      isError(error) ? error : undefined
    );

    // Attempt cleanup before exit
    try {
      await cleanupManager.cleanup();
    } catch (cleanupError) {
      // Properly structure the logger call with message and metadata
      logger.error(
        "Error during startup failure cleanup",
        "CLEANUP",
        {
          error: getErrorMessage(cleanupError),
        },
        isError(cleanupError) ? cleanupError : undefined
      );
    }

    process.exit(1);
  }
}

// Initialize server with top-level error handling
startServer().catch((error) => {
  // Properly structure the logger call with message and metadata
  logger.error(
    "Fatal error in server startup",
    "STARTUP",
    {
      error: getErrorMessage(error),
      stack: isError(error) ? error.stack : undefined,
    },
    isError(error) ? error : undefined
  );
  process.exit(1);
});
