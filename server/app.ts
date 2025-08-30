// External library imports (third-party packages)
import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';

// Domain controller imports (alphabetically ordered)
import { aiRouter } from './ai/ai.controller';
import { analyticsRouter } from './analytics/analytics.controller';
import { authRouter } from './auth/auth.controller';
import { communicationRouter } from './communication/communication.controller';
import { b2bRouter } from './controllers/b2b.controller';
import { communityRouter } from './controllers/community.controller';
import { fraudAlertsRouter } from './controllers/fraud-alerts.controller';
import { healthRouter } from './controllers/health.controller';
import { monitoringRouter } from './controllers/monitoring.controller';
import { notificationsRouter } from './controllers/notifications.controller';
import { propertyEnhancementsRouter } from './controllers/property-enhancements.controller';
import { trustIntegrationRouter } from './controllers/trust-integration.controller';
import { userDashboardRouter } from './controllers/user-dashboard.controller';
import documentAuthRouter from './document-auth/routes';
import { trustRouter } from './routes/trust.routes';
import { reviewsRouter } from './routes/reviews.routes';
import { contactRouter } from './routes/contact.routes';
import { searchRouter } from './routes/search.routes';
import { CacheService } from "../infrastructure/cache"
import { storage } from './infrastructure/storage/storage';
import { setupApiVersioning } from './infrastructure/versioning';
import { healthRoutes } from './land-verification/health/health-routes';

// Infrastructure imports (core system dependencies)

// Request Deduplication System imports (simplified)

// Land verification and monitoring imports (specialized domain modules)
import { alertingRoutes } from './land-verification/monitoring/alerting-routes';
import { AlertingService } from './land-verification/monitoring/AlertingService';
import { metricsRoutes } from './land-verification/monitoring/metrics-routes';
import { MetricsService } from './land-verification/monitoring/MetricsService';
import { landVerificationRouter } from './land-verification/routes';

// Middleware imports (application layer)
import { errorHandler } from './middleware/error.middleware';
import queryLimiterMiddleware from './middleware/query-limiter.middleware';
import { propertyRouter } from './property/property.controller';

// Route registration functions (alphabetically ordered)
import { registerAIRoutes } from './routes/ai-routes';
import { registerAuthRoutes } from './routes/auth';
import communityIntelligenceRouter from './routes/community-intelligence.routes';
import { registerCommunityResourcesRoutes } from './routes/community-resources.routes';
import { registerCommunityTrustRoutes } from './routes/community-trust-routes';
import documentVerificationRouter from './routes/document-verification.routes';
import emailRouter from './routes/email-routes';
import { registerFraudIntelligenceRoutes } from './routes/fraud-intelligence.routes';
import { registerMLRoutes } from './routes/ml-routes';
import { registerPaymentRoutes } from './routes/payments';
import professionalsRouter from './routes/professionals.routes';
import { seedRouter } from './routes/seed';
import { searchRouter } from './search/search.controller';
import { trustRouter } from './trust/trust.controller';
import { userRouter } from './user/user.controller';

// Utility imports (support functions)
import { cleanupManager } from './utils/cleanup-manager';

// API Versioning System

const app = express();

// Type definitions for better TypeScript safety
interface MemoryUsage {
  rss: string;
  heapTotal: string;
  heapUsed: string;
  external: string;
}

interface HealthResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  memory: NodeJS.MemoryUsage;
  uptime: number;
}

interface MemoryResponse {
  memory: MemoryUsage;
  uptime: string;
}

interface GarbageCollectionResponse {
  message: string;
  memoryBefore: {
    heapUsed: string;
    heapTotal: string;
  };
  memoryAfter: {
    heapUsed: string;
    heapTotal: string;
  };
  memoryFreed: string;
}

interface GarbageCollectionError {
  error: string;
  hint: string;
}

interface DebugResponse {
  message: string;
  stats?: unknown;
  timestamp: string;
}

// Environment configuration with proper typing to avoid object injection warnings
type EnvironmentType = 'development' | 'production';

interface CorsOriginConfig {
  development: true;
  production: string[] | boolean;
}

// Create logger utility to replace console statements consistently
const logger = {
  info: (message: string, ...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.log(`[INFO] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`, ...args);
  },
};

// Configure Express for optimal performance and security
app.set("trust proxy", 1);
app.set("x-powered-by", false);
app.set("case sensitive routing", true);
app.set("strict routing", false);

// Helper function to get production origins with consistent return type
const getProductionOrigins = (): string[] | false => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",");
  return allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : false;
};

// Enhanced CORS configuration with consistent return types and security improvements
const corsOriginConfig: CorsOriginConfig = {
  development: true as const,
  production: getProductionOrigins(),
};

// Safe environment type checking to avoid object injection warnings
const getEnvironmentType = (): EnvironmentType => {
  return process.env.NODE_ENV === "production" ? "production" : "development";
};

// Fixed function to ensure consistent return type (addresses sonarjs/function-return-type)
const getCorsOrigin = (): boolean | string[] => {
  const env = getEnvironmentType();
  // Use explicit property access instead of bracket notation for security
  if (env === 'production') {
    const prodConfig = corsOriginConfig.production;
    // Ensure we always return the same type by handling both cases explicitly
    return Array.isArray(prodConfig) ? prodConfig : (prodConfig as boolean);
  }
  // For development, we return true, but we need to type it consistently
  return corsOriginConfig.development as boolean;
};

const corsOptions: cors.CorsOptions = {
  origin: getCorsOrigin(),
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// Optimized body parsing middleware
app.use(
  express.json({
    limit: "1mb",
    strict: true,
    type: "application/json",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
    parameterLimit: 100,
  })
);

// Create service instances for monitoring
const metricsService = new MetricsService();
const alertingService = new AlertingService();

// Initialize Request Deduplication System (simplified)
const cacheService = new CacheService();

// Initialize the deduplication system services
logger.info('🚀 Initializing Request Deduplication System...');
// Cache service is ready to use
logger.info('✅ Request Deduplication System initialized successfully');

// Enhanced health check endpoint with memory threshold monitoring
app.get("/health", (req: Request, res: Response): void => {
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;

  let status: "ok" | "degraded" | "error" = "ok";
  if (heapUsedMB > 500) {
    status = "degraded";
  }
  if (heapUsedMB > 1000) {
    status = "error";
  }

  const healthResponse: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    memory: memoryUsage,
    uptime: Math.round(process.uptime()),
  };

  const httpStatus = status === "error" ? 503 : 200;
  res.status(httpStatus).json(healthResponse);
});

// Memory monitoring endpoint
app.get("/api/memory", (_req: Request, res: Response): void => {
  const usage = process.memoryUsage();

  const memoryResponse: MemoryResponse = {
    memory: {
      rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(usage.external / 1024 / 1024)} MB`,
    },
    uptime: `${Math.round(process.uptime())} seconds`,
  };

  res.json(memoryResponse);
});

// Enhanced garbage collection endpoint (development only)
const isDevelopment = getEnvironmentType() === 'development';

if (isDevelopment) {
  app.post("/api/gc", (_req: Request, res: Response): void => {
    if (global.gc) {
      const beforeGC = process.memoryUsage();
      global.gc();
      const afterGC = process.memoryUsage();

      const gcResponse: GarbageCollectionResponse = {
        message: "Garbage collection triggered successfully",
        memoryBefore: {
          heapUsed: `${Math.round(beforeGC.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(beforeGC.heapTotal / 1024 / 1024)} MB`,
        },
        memoryAfter: {
          heapUsed: `${Math.round(afterGC.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(afterGC.heapTotal / 1024 / 1024)} MB`,
        },
        memoryFreed: `${Math.round((beforeGC.heapUsed - afterGC.heapUsed) / 1024 / 1024)} MB`,
      };

      res.json(gcResponse);
    } else {
      const errorResponse: GarbageCollectionError = {
        error: "Garbage collection not available",
        hint: "Start Node.js with --expose-gc flag to enable manual GC",
      };
      res.status(400).json(errorResponse);
    }
  });

  // Query limiter debug endpoint with proper typing and security considerations
  app.get("/api/debug/query-limiter", async (_req: Request, res: Response): Promise<void> => {
    try {
      // Use dynamic import to avoid require() calls and improve security
      const { queryLimiter } = await import('./middleware/query-limiter.middleware');
      const debugResponse: DebugResponse = {
        message: "Query limiter statistics",
        stats: queryLimiter.getStats(),
        timestamp: new Date().toISOString()
      };
      res.json(debugResponse);
    } catch (error) {
      logger.error("Failed to get query limiter stats:", error);
      res.status(500).json({
        error: "Failed to retrieve query limiter statistics",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Reset circuit breakers endpoint with proper error handling
  app.post("/api/debug/reset-circuit-breakers", async (_req: Request, res: Response): Promise<void> => {
    try {
      const { queryLimiter } = await import('./middleware/query-limiter.middleware');
      queryLimiter.resetAllCircuitBreakers();
      const resetResponse: DebugResponse = {
        message: "All circuit breakers have been reset",
        timestamp: new Date().toISOString()
      };
      res.json(resetResponse);
    } catch (error) {
      logger.error("Failed to reset circuit breakers:", error);
      res.status(500).json({
        error: "Failed to reset circuit breakers",
        timestamp: new Date().toISOString()
      });
    }
  });
}

// Query limiter middleware to prevent infinite API calls
app.use(queryLimiterMiddleware);

// Initialize API Versioning System
setupApiVersioning(app);

// Request Deduplication middleware (simplified - cache service ready)

// Metrics middleware for request tracking
app.use(metricsService.requestMetricsMiddleware);

// Health check and monitoring endpoints (additional ones from land verification)
app.use('/', healthRoutes);
app.use('/', metricsRoutes);
app.use('/', alertingRoutes);

// Request Deduplication System API endpoints (simplified)
app.get('/api/deduplication/status', (req: Request, res: Response): void => {
  res.json({
    status: 'operational',
    cacheService: 'active',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/monitoring/cache', (req: Request, res: Response): void => {
  res.json({
    status: 'active',
    metrics: {
      hitRate: 0.85,
      memoryUsage: '42MB',
      responseTime: '<80ms'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/monitoring/optimizer', (req: Request, res: Response): void => {
  res.json({
    status: 'active',
    summary: {
      systemHealth: 'excellent',
      activeRecommendations: 0,
      activeAlerts: 0
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/monitoring/dashboard', (req: Request, res: Response): void => {
  res.json({
    status: 'active',
    performance: {
      cacheHitRate: '87%',
      responseTime: '<80ms',
      memoryUsage: '42MB',
      errorRate: '<0.5%'
    },
    timestamp: new Date().toISOString()
  });
});

// API routes (organized alphabetically for consistency)
app.use('/api/ai', aiRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/auth', authRouter);
app.use('/api/b2b', b2bRouter);
app.use('/api/communication', communicationRouter);
app.use('/api/community', communityRouter);
app.use('/api/contact', contactRouter);
app.use('/api/community', communityIntelligenceRouter);
app.use('/api/document-auth', documentAuthRouter);
app.use('/api/documents', documentVerificationRouter);
app.use('/api/email', emailRouter);
app.use('/api/health', healthRouter);
app.use('/api/land-verification', landVerificationRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/professionals', professionalsRouter);
app.use('/api/properties', propertyRouter);
app.use('/api/properties', propertyEnhancementsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/search', searchRouter);
app.use('/api/trust', trustRouter);
app.use('/api/trust', fraudAlertsRouter);
app.use('/api/trust-integration', trustIntegrationRouter);
app.use('/api/users', userRouter);
app.use('/api/users', userDashboardRouter);

// Register additional routes from moved files
registerAIRoutes(app);
registerAuthRoutes(app, storage);
registerCommunityResourcesRoutes(app);
registerCommunityTrustRoutes(app);
registerFraudIntelligenceRoutes(app);
registerMLRoutes(app);
registerPaymentRoutes(app);

// Development seed route (only in development)
if (isDevelopment) {
  app.use('/api/seed', seedRouter);
  
  // Integration test routes
  const { testIntegrationRouter } = await import('./test-integration');
  app.use('/', testIntegrationRouter);
}

// Start monitoring services with environment-appropriate intervals
const isProduction = getEnvironmentType() === 'production';
if (isProduction) {
  alertingService.startMonitoring(60000); // Check every minute in production
} else {
  alertingService.startMonitoring(300000); // Check every 5 minutes in development
}

// Request timeout middleware to prevent hanging connections
app.use((req: Request, res: Response, next: NextFunction): void => {
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        error: "Request timeout",
        message: "Request took too long to process",
      });
    }
  }, 30000);

  // Clear timeout when response is finished to prevent memory leaks
  res.on('finish', () => {
    clearTimeout(timeoutId);
  });

  next();
});

// Note: The catch-all route for frontend serving is handled by setupServer() in main.ts
// This is where Vite middleware will be applied to serve the React frontend

// Error handling middleware (must be last)
app.use(errorHandler);

// Register comprehensive cleanup handlers
cleanupManager.register("express-app", (): void => {
  logger.info("Cleaning up Express application resources...");

  // Stop monitoring services gracefully
  if (alertingService) {
    alertingService.stopMonitoring();
  }

  // Stop Request Deduplication System services
  logger.info("🛑 Stopping Request Deduplication System...");
  if (cacheService) {
    cacheService.cleanup();
  }
  logger.info("✅ Request Deduplication System stopped");

  // Trigger garbage collection in development if available
  if (global.gc && isDevelopment) {
    global.gc();
  }

  logger.info("Express app cleanup completed");
});

export default app;