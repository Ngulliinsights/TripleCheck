import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

/**
 * Enhanced logging function with better formatting and error handling
 * Provides consistent timestamp formatting and source identification
 */
export function log(message: string, source = "express"): void {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  
  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Sets up Vite development server with enhanced error handling and middleware configuration
 * This function integrates Vite's HMR and development features into Express
 */
export async function setupVite(app: Express, server: Server): Promise<void> {
  try {
    // Configure Vite server options with proper middleware mode
    const serverOptions = {
      middlewareMode: true as const,
      hmr: { server },
      allowedHosts: true as const,
    };

    // Create Vite server instance with enhanced error handling
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          log(`Vite error: ${msg}`, "vite");
          viteLogger.error(msg, options);
          // More graceful error handling - don't immediately exit
          // Allow the application to continue running in many cases
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    // Apply Vite middleware to Express app
    app.use(vite.middlewares);
    
    // Enhanced catch-all route handler with better error handling
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      
      try {
        const clientTemplate = path.resolve(
          __dirname,
          "..",
          "client",
          "index.html",
        );

        // Check if template file exists before attempting to read
        if (!fs.existsSync(clientTemplate)) {
          throw new Error(`Template file not found: ${clientTemplate}`);
        }

        // Read and process the HTML template
        // Always reload from disk to catch changes during development
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        
        // Add cache-busting parameter to prevent stale module loading
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        
        // Transform the HTML with Vite's processing pipeline
        const page = await vite.transformIndexHtml(url, template);
        
        // Send the processed HTML with proper headers
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (error) {
        // Enhanced error handling with proper stack trace fixing
        const err = error as Error;
        log(`Error processing request for ${url}: ${err.message}`, "vite");
        
        // Fix stack trace for better debugging in development
        vite.ssrFixStacktrace(err);
        next(err);
      }
    });

    log("Vite development server setup complete", "vite");
  } catch (error) {
    const err = error as Error;
    log(`Failed to setup Vite server: ${err.message}`, "vite");
    throw err; // Re-throw to allow calling code to handle
  }
}

/**
 * Sets up static file serving for production builds
 * Includes comprehensive error checking and fallback handling
 */
export function serveStatic(app: Express): void {
  const distPath = path.resolve(__dirname, "public");
  
  // Enhanced directory existence check with better error messaging
  if (!fs.existsSync(distPath)) {
    const errorMessage = `Could not find the build directory: ${distPath}. Make sure to build the client first using your build command.`;
    log(errorMessage, "static");
    throw new Error(errorMessage);
  }

  // Verify the directory contains the expected index.html file
  const indexPath = path.resolve(distPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    const errorMessage = `Build directory exists but index.html not found at: ${indexPath}. Ensure your build process completed successfully.`;
    log(errorMessage, "static");
    throw new Error(errorMessage);
  }

  // Configure static file serving with enhanced options
  app.use(express.static(distPath, {
    // Add proper caching headers for static assets
    maxAge: process.env.NODE_ENV === "production" ? "1y" : "0",
    // Enable etag for better caching
    etag: true,
    // Set proper index file
    index: "index.html",
  }));

  // Enhanced catch-all route with better error handling
  app.use("*", (req, res) => {
    const requestedPath = req.originalUrl;
    
    try {
      // Log the fallback for debugging purposes
      log(`Serving index.html for route: ${requestedPath}`, "static");
      
      // Send the index.html file for client-side routing
      res.sendFile(indexPath, (err) => {
        if (err) {
          log(`Error serving index.html: ${err.message}`, "static");
          res.status(500).send("Internal Server Error");
        }
      });
    } catch (error) {
      const err = error as Error;
      log(`Error in catch-all route: ${err.message}`, "static");
      res.status(500).send("Internal Server Error");
    }
  });

  log(`Static file serving configured for: ${distPath}`, "static");
}

/**
 * Utility function to determine if we're in development mode
 * Useful for conditional logic throughout the application
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Enhanced setup function that chooses the appropriate serving method
 * This provides a single entry point for server configuration
 */
export async function setupServer(app: Express, server: Server): Promise<void> {
  if (isDevelopment()) {
    log("Setting up development server with Vite", "setup");
    await setupVite(app, server);
  } else {
    log("Setting up production server with static files", "setup");
    serveStatic(app);
  }
}