import { Router } from 'express';

import { healthCheckService } from './HealthCheckService';

const router = Router();

// Health check endpoint - detailed health information
router.get('/health', healthCheckService.healthCheckHandler);

// Readiness check endpoint - simple ready/not ready
router.get('/ready', healthCheckService.readinessHandler);

// Liveness check endpoint - basic service availability
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export { router as healthRoutes };