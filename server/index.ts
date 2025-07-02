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

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
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

(async () => {
  try {
    // Validate environment variables
    if (!process.env.GOOGLE_API_KEY) {
      console.warn('Warning: GOOGLE_API_KEY not set. AI features may not work properly.');
    }

    // Register API routes
    registerRoutes(app);
    registerAIRoutes(app);
    registerMLRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.error('Server error:', err);
      res.status(status).json({ message });
    });

    // Create HTTP server
    const httpServer = createServer(app);

    // Always use development mode in Replit environment
    // This ensures Vite dev server is used instead of trying to serve static files
    const isDevelopment = process.env.NODE_ENV !== "production" || !process.env.NODE_ENV;
    
    if (isDevelopment) {
      log('Starting in development mode with Vite dev server');
      await setupVite(app, httpServer);
    } else {
      log('Starting in production mode with static files');
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client
    const port = 5000;
    httpServer.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port} in ${isDevelopment ? 'development' : 'production'} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();