import express, { Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error.middleware';
import validateRequest from './middleware/validation.middleware';
import { cacheResponse, invalidateCache } from './middleware/cache.middleware';
import { cleanupManager } from './utils/cleanup-manager';

// Domain routers
import { authRouter } from './auth/auth.controller';
import { propertyRouter } from './property/property.controller';
import { trustRouter } from './trust/trust.controller';
import { userRouter } from './user/user.controller';
import { searchRouter } from './search/search.controller';
import { communicationRouter } from './communication/communication.controller';
import { analyticsRouter } from './analytics/analytics.controller';
import { aiRouter } from './ai/ai.controller';
import { seedRouter } from './routes/seed';

// Additional route registration functions
import { registerCommunityTrustRoutes } from './routes/community-trust-routes';
import { registerMLRoutes } from './routes/ml-routes';
import { registerAIRoutes } from './routes/ai-routes';
import { registerAuthRoutes } from './routes/auth';
import { registerPaymentRoutes } from './routes/payments';
import { registerFraudIntelligenceRoutes } from './routes/fraud-intelligence.routes';
import { registerCommunityResourcesRoutes } from './routes/community-resources.routes';
import emailRouter from './routes/email-routes';
import documentVerificationRouter from './routes/document-verification.routes';
import communityIntelligenceRouter from './routes/community-intelligence.routes';
import { storage } from './infrastructure/storage/storage';

// Land verification and monitoring imports
import { healthRoutes } from './land-verification/health/health-routes';
import { metricsRoutes } from './land-verification/monitoring/metrics-routes';
import { alertingRoutes } from './land-verification/monitoring/alerting-routes';
import { metricsService } from './land-verification/monitoring/MetricsService';
import { alertingService } from './land-verification/monitoring/AlertingService';

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

// Enhanced CORS configuration
const corsOriginConfig = {
  development: true as const,
  production: ((): string[] | false => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",");
    return allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : false;
  })(),
};

const getCorsOrigin = (): cors.CorsOptions["origin"] => {
  const env = process.env.NODE_ENV === "production" ? "production" : "development";
  return corsOriginConfig[env];
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

  let httpStatus: number;
  if (status === "ok" || status === "degraded") {
    httpStatus = 200;
  } else {
    httpStatus = 503;
  }
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
if (process.env.NODE_ENV === "development") {
  app.post("/api/gc", (_req: Request, res: Response): void => {
    if (global.gc) {
      const beforeGC = process.memoryUsage();
      global.gc();
      const afterGC = process.memoryUsage();

      res.json({
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
      });
    } else {
      res.status(400).json({
        error: "Garbage collection not available",
        hint: "Start Node.js with --expose-gc flag to enable manual GC",
      });
    }
  });
}

// Metrics middleware for request tracking
app.use(metricsService.requestMetricsMiddleware);

// Health check and monitoring endpoints (additional ones from land verification)
app.use('/', healthRoutes);
app.use('/', metricsRoutes);
app.use('/', alertingRoutes);

// API routes
app.use('/api/auth', authRouter);
app.use('/api/properties', propertyRouter);
app.use('/api/trust', trustRouter);
app.use('/api/users', userRouter);
app.use('/api/search', searchRouter);
app.use('/api/communication', communicationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);

// Register additional routes from moved files
app.use('/api/email', emailRouter);
app.use('/api/documents', documentVerificationRouter);
app.use('/api/community', communityIntelligenceRouter);
registerCommunityTrustRoutes(app);
registerMLRoutes(app);
registerAIRoutes(app);
registerAuthRoutes(app, storage);
registerPaymentRoutes(app);
registerFraudIntelligenceRoutes(app);
registerCommunityResourcesRoutes(app);

// Development seed route (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use('/api/seed', seedRouter);
}

// Start monitoring services
if (process.env.NODE_ENV === 'production') {
  alertingService.startMonitoring(60000); // Check every minute
} else {
  alertingService.startMonitoring(300000); // Check every 5 minutes in dev
}

// Request timeout middleware to prevent hanging connections
app.use((req: Request, res: Response, next: NextFunction): void => {
  req.setTimeout(30000, () => {
    res.status(408).json({
      error: "Request timeout",
      message: "Request took too long to process",
    });
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

  if (global.gc && process.env.NODE_ENV === "development") {
    global.gc();
  }

  logger.info("Express app cleanup completed");
});

export default app;