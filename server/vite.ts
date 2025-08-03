import fsSync from "fs";
import fs from "fs/promises";
import { type Server } from "http";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import express, { type Express } from "express";
import { nanoid } from "nanoid";
import vite from "vite";
// import viteConfig from "../vite.config"; // Removed to fix import issues

// Calculate __dirname once at module level for better performance
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Vite logger removed due to import issues

/**
 * Enhanced logging function with consistent formatting and source identification
 * Uses more efficient date formatting and provides better visual separation
 */
export function log(message: string, source = "express"): void {
  // Use toISOString for better performance and ISO standard formatting
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${timestamp}] ${source.toUpperCase()} | ${message}`);
}

/**
 * Validates that a file exists and is readable
 * Centralizes file existence checking with proper error context
 */
async function validateFileExists(filePath: string, description: string): Promise<void> {
  try {
    await fs.access(filePath, fsSync.constants.F_OK | fsSync.constants.R_OK);
  } catch (error) {
    const errorMessage = `${description} not found or not readable: ${filePath}`;
    log(errorMessage, "validation");
    throw new Error(errorMessage);
  }
}

/**
 * Sets up Vite development server with comprehensive error handling and optimization
 * Integrates Vite's HMR capabilities while providing graceful error recovery
 */
export async function setupVite(app: Express, server: Server): Promise<void> {
  log("Initializing Vite development server", "vite");
  
  try {
    // Validate template file exists before setting up Vite server
    const templatePath = path.resolve(__dirname, "..", "index.html");
    await validateFileExists(templatePath, "HTML template file");

    // Configure Vite server with optimized settings for development
    const viteServerOptions = {
      middlewareMode: true as const,
      hmr: { 
        server,
        // Add overlay configuration for better error visibility
        overlay: true,
      },
      allowedHosts: true as const,
      // Optimize dependency pre-bundling for faster startup
      optimizeDeps: {
        force: false, // Allow caching of dependencies
      },
    };

    // Create Vite server with enhanced error handling and logging
    const viteServer = await vite.createServer({
      configFile: false,
      customLogger: {
        // Simplified logger without viteLogger dependency
        error: (msg) => {
          log(`Error occurred: ${msg}`, "vite");
        },
        warn: (msg) => {
          log(`Warning: ${msg}`, "vite");
        },
        info: (msg) => {
          log(`Info: ${msg}`, "vite");
        },
      },
      server: viteServerOptions,
      appType: "custom",
    });

    // Apply Vite middleware to Express application
    app.use(viteServer.middlewares);
    
    // Enhanced catch-all route handler with robust error recovery
    app.use("*", async (req, res, next) => {
      const requestUrl = req.originalUrl;
      
      try {
        // Read template with proper error handling
        let template: string;
        try {
          template = await fs.readFile(templatePath, "utf-8");
        } catch (readError) {
          log(`Failed to read template file: ${(readError as Error).message}`, "vite");
          throw new Error(`Template file read error: ${templatePath}`);
        }
        
        // Add cache-busting with more efficient timestamp approach
        const cacheBuster = Date.now().toString(36); // More compact than nanoid for this use case
        template = template.replace(
          'src="/src/main.tsx"',
          `src="/src/main.tsx?v=${cacheBuster}"`
        );
        
        // Process HTML through Vite transformation pipeline
        const transformedPage = await viteServer.transformIndexHtml(requestUrl, template);
        
        // Send response with proper headers and caching directives
        res
          .status(200)
          .set({
            "Content-Type": "text/html",
            "Cache-Control": "no-cache, no-store, must-revalidate", // Prevent caching in development
            "Pragma": "no-cache",
            "Expires": "0"
          })
          .end(transformedPage);
          
      } catch (error) {
        const err = error as Error;
        log(`Request processing failed for ${requestUrl}: ${err.message}`, "vite");
        
        // Apply Vite's stack trace enhancement for better debugging
        viteServer.ssrFixStacktrace(err);
        next(err);
      }
    });

    log("Vite development server configuration completed successfully", "vite");
  } catch (error) {
    const err = error as Error;
    log(`Vite server setup failed: ${err.message}`, "vite");
    throw err; // Propagate error to caller for appropriate handling
  }
}

/**
 * Configures static file serving for production environments
 * Includes comprehensive validation and platform-specific optimizations
 */
export function serveStatic(app: Express): void {
  log("Configuring static file serving for production", "static");
  
  // Check for Vercel deployment environment
  const isVercelEnvironment = !!(process.env.VERCEL || process.env.VERCEL_ENV);
  
  if (isVercelEnvironment) {
    log("Detected Vercel environment - delegating static file serving to platform", "static");
    return; // Vercel handles static files automatically
  }
  
  // Use dist/public directory to match build output and deployment configurations
  const staticDirectory = path.resolve(__dirname, "..", "dist", "public");
  const indexFilePath = path.resolve(staticDirectory, "index.html");
  
  // Validate build directory and required files exist
  if (!fsSync.existsSync(staticDirectory)) {
    const errorMessage = `Build directory missing: ${staticDirectory}. Execute build command before starting production server.`;
    log(errorMessage, "static");
    throw new Error(errorMessage);
  }

  if (!fsSync.existsSync(indexFilePath)) {
    const errorMessage = `Index file missing: ${indexFilePath}. Verify build process completed successfully.`;
    log(errorMessage, "static");
    throw new Error(errorMessage);
  }

  // Configure Express static middleware with production optimizations
  const staticOptions = {
    // Aggressive caching for production assets
    maxAge: process.env.NODE_ENV === "production" ? "365d" : "0",
    etag: true, // Enable ETag for conditional requests
    index: "index.html",
    // Add compression support indicators
    immutable: process.env.NODE_ENV === "production",
    // Set proper fallthrough behavior
    fallthrough: false,
  };

  app.use(express.static(staticDirectory, staticOptions));

  // SPA fallback route with comprehensive error handling
  app.use("*", (req, res) => {
    const requestedRoute = req.originalUrl;
    
    log(`Serving SPA fallback for route: ${requestedRoute}`, "static");
    
    // Send index.html with proper error handling
    res.sendFile(indexFilePath, {
      // Add headers for SPA routing
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      }
    }, (sendError) => {
      if (sendError) {
        log(`Failed to serve index.html: ${sendError.message}`, "static");
        
        // Attempt graceful degradation
        if (!res.headersSent) {
          res.status(500).json({
            error: "Application temporarily unavailable",
            timestamp: new Date().toISOString(),
          });
        }
      }
    });
  });

  log(`Static file serving configured successfully: ${staticDirectory}`, "static");
}

/**
 * Environment detection utility with caching for performance
 * Determines runtime environment for conditional application behavior
 */
let cachedEnvironmentCheck: boolean | null = null;

export function isDevelopment(): boolean {
  // Cache the environment check since NODE_ENV doesn't change during runtime
  if (cachedEnvironmentCheck === null) {
    cachedEnvironmentCheck = process.env.NODE_ENV !== "production";
  }
  return cachedEnvironmentCheck;
}

/**
 * Main server setup orchestrator that selects appropriate configuration
 * Provides unified entry point with comprehensive error handling and logging
 */
export async function setupServer(app: Express, server: Server): Promise<void> {
  const environment = isDevelopment() ? "development" : "production";
  log(`Initializing ${environment} server configuration`, "setup");
  
  try {
    if (isDevelopment()) {
      await setupVite(app, server);
      log("Development server with Vite HMR ready", "setup");
    } else {
      serveStatic(app);
      log("Production server with static file serving ready", "setup");
    }
  } catch (error) {
    const err = error as Error;
    log(`Server setup failed: ${err.message}`, "setup");
    
    // In production, this should probably exit the process
    // In development, we might want to continue with degraded functionality
    throw err;
  }
}