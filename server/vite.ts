import fs from "fs/promises";
import fsSync from "fs";
import { type Server } from "http";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import express, { 
  type Express, 
  type Request, 
  type Response, 
  type NextFunction 
} from "express";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Enhanced logging function with consistent formatting and source identification
 */
export function log(message: string, source = "express"): void {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${timestamp}] ${source.toUpperCase()} | ${message}`);
}

/**
 * Validates that a file exists and is readable
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
 * Sets up Vite development server with comprehensive error handling and HMR
 */
export async function setupVite(app: Express, server: Server): Promise<void> {
  log("Initializing Vite development server", "vite");
  
  try {
    const templatePath = path.resolve(__dirname, "..", "index.html");
    await validateFileExists(templatePath, "HTML template file");

    const viteServer = await createViteServer({
      configFile: false,
      server: {
        middlewareMode: true,
        hmr: { server, overlay: true },
        allowedHosts: true,
      },
      optimizeDeps: {
        force: false, 
      },
      appType: "custom",
      customLogger: {
        error: (msg) => log(`Error: ${msg}`, "vite"),
        warn: (msg) => log(`Warning: ${msg}`, "vite"),
        info: (msg) => log(`Info: ${msg}`, "vite"),
        warnOnce: (msg) => log(`Warning (once): ${msg}`, "vite"),
        clearScreen: () => {},
        hasErrorLogged: () => false,
        hasWarned: false,
      },
    });

    app.use(viteServer.middlewares);
    
    app.use("*", async (req: Request, res: Response, next: NextFunction) => {
      const requestUrl = req.originalUrl;
      
      try {
        let template: string;
        try {
          template = await fs.readFile(templatePath, "utf-8");
        } catch (readError) {
          log(`Failed to read template file: ${(readError as Error).message}`, "vite");
          throw new Error(`Template file read error: ${templatePath}`);
        }
        
        const cacheBuster = Date.now().toString(36);
        template = template.replace(
          'src="/src/main.tsx"',
          `src="/src/main.tsx?v=${cacheBuster}"`
        );
        
        const transformedPage = await viteServer.transformIndexHtml(requestUrl, template);
        
        res
          .status(200)
          .set({
            "Content-Type": "text/html",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          })
          .end(transformedPage);
          
      } catch (error) {
        const err = error as Error;
        log(`Request processing failed for ${requestUrl}: ${err.message}`, "vite");
        viteServer.ssrFixStacktrace(err);
        next(err);
      }
    });

    log("Vite development server configuration completed successfully", "vite");
  } catch (error) {
    const err = error as Error;
    log(`Vite server setup failed: ${err.message}`, "vite");
    throw err;
  }
}

/**
 * Configures static file serving for production environments
 */
export function serveStatic(app: Express): void {
  log("Configuring static file serving for production", "static");
  
  const isVercelEnvironment = !!(process.env.VERCEL || process.env.VERCEL_ENV);
  
  if (isVercelEnvironment) {
    log("Detected Vercel environment - delegating static file serving to platform", "static");
    return; 
  }
  
  const staticDirectory = path.resolve(__dirname, "..", "dist", "public");
  const indexFilePath = path.resolve(staticDirectory, "index.html");
  
  if (!fsSync.existsSync(staticDirectory)) {
    const errorMessage = `Build directory missing: ${staticDirectory}. Execute build command before starting.`;
    log(errorMessage, "static");
    throw new Error(errorMessage);
  }

  if (!fsSync.existsSync(indexFilePath)) {
    const errorMessage = `Index file missing: ${indexFilePath}. Verify build process completed.`;
    log(errorMessage, "static");
    throw new Error(errorMessage);
  }

  // Fallthrough must be true (default) so unhandled paths hit the SPA fallback route below
  app.use(express.static(staticDirectory, {
    maxAge: process.env.NODE_ENV === "production" ? "365d" : "0",
    etag: true,
    index: "index.html",
    immutable: process.env.NODE_ENV === "production",
  }));

  // SPA fallback route
  app.use("*", (req: Request, res: Response) => {
    log(`Serving SPA fallback for route: ${req.originalUrl}`, "static");
    
    res.sendFile(indexFilePath, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" }
    }, (sendError) => {
      if (sendError) {
        log(`Failed to serve index.html: ${sendError.message}`, "static");
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

let cachedEnvironmentCheck: boolean | null = null;

export function isDevelopment(): boolean {
  if (cachedEnvironmentCheck === null) {
    cachedEnvironmentCheck = process.env.NODE_ENV !== "production";
  }
  return cachedEnvironmentCheck;
}

/**
 * Main server setup orchestrator
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
    log(`Server setup failed: ${(error as Error).message}`, "setup");
    throw error; 
  }
}