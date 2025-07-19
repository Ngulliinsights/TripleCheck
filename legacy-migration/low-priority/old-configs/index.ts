import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import session from "express-session";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { registerRoutes } from "./routes";
import { registerAIRoutes } from "./ai-routes";
import { registerMLRoutes } from "./ml-routes";
import { setupVite, serveStatic, log as viteLog } from "./vite";
import { logger } from "./logger";
import { errorHandler, notFoundHandler, corsErrorHandler, timeoutHandler } from "./middleware/error-handler";
import { initializeDatabase, runMigrations, seedDatabase } from "./lib/database";

const app = express();

// Add timeout and CORS error handling
app.use(timeoutHandler(30000)); // 30 second timeout
app.use(corsErrorHandler);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for development
      connectSrc: ["'self'", "https:", "wss:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] // Replace with your actual domain
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api', limiter);

// Authentication rate limiting - more reasonable for development
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 50, // 10 in production, 50 in development
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for successful requests
  skipSuccessfulRequests: true,
});

app.use('/api/auth', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'triplecheck-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'triplecheck.sid', // Custom session name
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Allow cross-site requests for development
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

      logger.apiRequest(req.method, path, res.statusCode, duration);
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
  const requiredEnvVars = [];
  const warnings = [];

  // Critical environment variables
  if (!process.env.DATABASE_URL) {
    requiredEnvVars.push('DATABASE_URL - Required for database connectivity');
  }

  // Important but not critical
  if (!process.env.GOOGLE_API_KEY) {
    warnings.push('GOOGLE_API_KEY not set. AI features may not work properly.');
  }
  
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    warnings.push('SESSION_SECRET not set in production. Using default secret is insecure.');
  }

  // Log warnings
  warnings.forEach(warning => console.warn(`⚠️  Warning: ${warning}`));

  // Exit if critical variables are missing
  if (requiredEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    requiredEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    console.error('Run "npm run db:setup" after setting DATABASE_URL to initialize the database.');
    process.exit(1);
  }

  console.log('✅ Environment validation passed');
}

// Main server startup function
(async () => {
  try {
    // Validate environment before starting
    validateEnvironment();

    // Initialize database with proper error handling
    try {
      console.log('🔄 Initializing database...');
      const dbResult = await initializeDatabase();
      
      if (dbResult.success) {
        console.log('✅ Database connection established');
        
        // Run migrations
        const migrationResult = await runMigrations();
        if (migrationResult.success) {
          console.log('✅ Database migrations completed');
          
          // Seed database in development
          if (process.env.NODE_ENV !== 'production') {
            await seedDatabase();
          }
        } else {
          console.warn('⚠️ Database migrations failed:', migrationResult.error);
        }
      } else {
        console.error('❌ Database initialization failed:', dbResult.error);
        console.log('Please check your DATABASE_URL and ensure the database is accessible');
      }
    } catch (error) {
      console.error('❌ Database setup failed:', error);
      console.log('The server will continue but database features may not work properly');
    }

    // Create HTTP server first
    const httpServer = createServer(app);

    // Environment detection with proper typing
    const isProduction: boolean = process.env.NODE_ENV === "production";
    const isVercel: boolean = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

    // Setup static file serving and Vite BEFORE registering API routes
    if (isProduction) {
      logger.info('Starting in production mode', 'SERVER');
      if (isVercel) {
        logger.info('Vercel environment detected - static files handled by platform', 'SERVER');
      }
      serveStatic(app);
    } else {
      logger.info('Starting in development mode with Vite dev server', 'SERVER');
      await setupVite(app, httpServer);
    }

    // Register API routes
    registerRoutes(app);
    registerAIRoutes(app);
    registerMLRoutes(app);
    
    // Register new community-first verification routes
    const { registerCommunityTrustRoutes } = await import("./community-trust-routes");
    const { registerSecureDocumentRoutes } = await import("./secure-document-routes");
    const { registerPaymentRoutes } = await import("./routes/payments");
    
    registerCommunityTrustRoutes(app);
    registerSecureDocumentRoutes(app);
    registerPaymentRoutes(app);

    // Initialize notification service
    const { NotificationService } = await import("./services/notification-service");
    const notificationService = new NotificationService(httpServer);
    
    // Make notification service available globally
    (global as any).notificationService = notificationService;

    // 404 handler for unmatched API routes (must be after all route registrations)
    app.use('/api/*', notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    // Properly handle port conversion - this fixes the TypeScript error
    const port: number = getPortNumber(process.env.PORT, 5000);
    const host: string = process.env.HOST || "0.0.0.0";

    // Now we can safely pass the numeric port to listen()
    httpServer.listen(port, host, () => {
      logger.info(`Server running on port ${port} in ${isProduction ? 'production' : 'development'} mode`, 'SERVER');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();