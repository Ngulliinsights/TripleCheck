/**
 * Express Application Setup v2
 * Uses new library-based implementations
 */

import express from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import passport from './auth/passport-config';
import { initializeTelemetry, logger, tracingMiddleware } from './infrastructure/observability/telemetry';
import { socketService } from './communication/websocket.service';
import { apiLimiter, authLimiter } from './middleware/rate-limit';

// Initialize telemetry first
initializeTelemetry();

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request tracing middleware
app.use(tracingMiddleware());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }, 'HTTP Request');
  });
  
  next();
});

// CORS middleware
app.use((req, res, next) => {
  const origin = req.get('origin');
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:3000',
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Session configuration with Redis
async function setupSession() {
  if (process.env.REDIS_URL) {
    try {
      const redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      redisClient.on('error', (err) => {
        logger.error('Redis client error', { error: err.message });
      });

      redisClient.on('connect', () => {
        logger.info('Redis client connected');
      });

      await redisClient.connect();

      app.use(
        session({
          store: new RedisStore({ client: redisClient }),
          secret: process.env.SESSION_SECRET || 'your-session-secret',
          resave: false,
          saveUninitialized: false,
          cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'strict',
          },
        })
      );

      logger.info('Session middleware configured with Redis');
    } catch (error: any) {
      logger.error('Failed to setup Redis session store', { error: error.message });
      // Fallback to memory store
      setupMemorySession();
    }
  } else {
    setupMemorySession();
  }
}

function setupMemorySession() {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'strict',
      },
    })
  );
  logger.warn('Using memory session store (not recommended for production)');
}

// Initialize session
setupSession().catch((error) => {
  logger.error('Failed to setup session', { error: error.message });
});

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Prometheus metrics endpoint
app.get('/metrics', (req, res) => {
  // Metrics are exposed by OpenTelemetry on separate port
  res.json({
    message: 'Metrics available at http://localhost:9464/metrics',
  });
});

// API routes will be added here
// Example:
// import propertyRoutes from './routes/property.routes';
// app.use('/api/properties', propertyRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.url,
  });
});

export default app;

// Server initialization
export async function startServer(port: number = 3000) {
  const server = app.listen(port, () => {
    logger.info(`Server started on port ${port}`, {
      environment: process.env.NODE_ENV,
      port,
    });
  });

  // Initialize Socket.IO
  await socketService.initialize(server);

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down server...');

    server.close(async () => {
      logger.info('HTTP server closed');

      // Shutdown Socket.IO
      await socketService.shutdown();

      // Shutdown OpenTelemetry
      // SDK shutdown is handled by SIGTERM handler in telemetry.ts

      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
}

// Start server if this file is run directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000');
  startServer(port).catch((error) => {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  });
}
