import { Router } from 'express';

import { metricsService } from './MetricsService';

const router = Router();

// JSON metrics endpoint
router.get('/metrics', metricsService.metricsHandler);

// Prometheus format metrics endpoint
router.get('/metrics/prometheus', metricsService.prometheusHandler);

// Specific verification metrics
router.get('/metrics/verification', (req, res) => {
  const metrics = metricsService.getVerificationMetrics();
  res.json({
    timestamp: new Date().toISOString(),
    verification_metrics: metrics
  });
});

export { router as metricsRoutes };