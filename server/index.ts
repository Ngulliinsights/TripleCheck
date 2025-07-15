import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import session from "express-session";
import { registerRoutes } from "./routes";
import { registerAIRoutes } from "./ai-routes";
import { registerMLRoutes } from "./ml-routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'triplecheck-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Enhanced logging middleware with proper typing
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Store original json method with proper typing
  // We need to preserve the original method's signature exactly
  const originalResJson = res.json;
  
  // Override the json method while maintaining proper typing
  // The Express Response.json method has a specific signature we need to match
  res.json = function (this: Response, body?: any): Response {
    capturedJsonResponse = body;
    // Call the original method with the correct context and arguments
    return originalResJson.call(this, body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Safely parse port from environment variable or return default
 * This handles the string-to-number conversion that TypeScript requires
 */
function getPortNumber(envPort: string | undefined, defaultPort: number): number {
  if (!envPort) {
    return defaultPort;
  }
  
  const parsedPort = parseInt(envPort, 10);
  
  // Validate that the port is a valid number and within reasonable range
  if (isNaN(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
    console.warn(`Invalid PORT value "${envPort}", using default port ${defaultPort}`);
    return defaultPort;
  }
  
  return parsedPort;
}

/**
 * Validate required environment variables
 * This centralizes env validation and provides clear error messages
 */
function validateEnvironment(): void {
  if (!process.env.GOOGLE_API_KEY) {
    console.warn('Warning: GOOGLE_API_KEY not set. AI features may not work properly.');
  }
  
  // Add other environment variable validations as needed
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    console.warn('Warning: SESSION_SECRET not set in production. Using default secret is insecure.');
  }
}

// Main server startup function
(async () => {
  try {
    // Validate environment before starting
    validateEnvironment();

    // Register API routes
    registerRoutes(app);
    registerAIRoutes(app);
    registerMLRoutes(app);

    // Enhanced error handler with proper typing
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status: number = err.status || err.statusCode || 500;
      const message: string = err.message || "Internal Server Error";
      
      console.error('Server error:', {
        message: err.message,
        stack: err.stack,
        status,
        timestamp: new Date().toISOString()
      });
      
      res.status(status).json({ message });
    });

    // Create HTTP server
    const httpServer = createServer(app);

    // Environment detection with proper typing
    const isProduction: boolean = process.env.NODE_ENV === "production";
    const isVercel: boolean = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

    if (isProduction) {
      log('Starting in production mode');
      if (isVercel) {
        log('Vercel environment detected - static files handled by platform');
      }
      serveStatic(app);
    } else {
      log('Starting in development mode with Vite dev server');
      await setupVite(app, httpServer);
    }

    // Properly handle port conversion - this fixes the TypeScript error
    const port: number = getPortNumber(process.env.PORT, 5000);
    const host: string = process.env.HOST || "0.0.0.0";

    // Now we can safely pass the numeric port to listen()
    httpServer.listen(port, host, () => {
      log(`serving on port ${port} in ${isProduction ? 'production' : 'development'} mode`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();