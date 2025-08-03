import { Router } from 'express';

import { alertingService } from './AlertingService';

const router = Router();

// Get all active alerts
router.get('/alerts', (req, res) => {
  const activeAlerts = alertingService.getActiveAlerts();
  res.json({
    timestamp: new Date().toISOString(),
    count: activeAlerts.length,
    alerts: activeAlerts
  });
});

// Get all alerts (including resolved)
router.get('/alerts/all', (req, res) => {
  const allAlerts = alertingService.getAllAlerts();
  res.json({
    timestamp: new Date().toISOString(),
    count: allAlerts.length,
    alerts: allAlerts
  });
});

// Resolve an alert
router.post('/alerts/:alertId/resolve', (req, res) => {
  const { alertId } = req.params;
  const resolved = alertingService.resolveAlert(alertId);
  
  if (resolved) {
    res.json({
      success: true,
      message: `Alert ${alertId} resolved`,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      message: `Alert ${alertId} not found or already resolved`,
      timestamp: new Date().toISOString()
    });
  }
});

// Test alert (for testing notification channels)
router.post('/alerts/test', (req, res) => {
  const { severity = 'low', title = 'Test Alert', description = 'This is a test alert' } = req.body;
  
  // Trigger a test alert
  alertingService.emit('alert', {
    id: `test_${Date.now()}`,
    severity,
    title,
    description,
    timestamp: new Date(),
    source: 'manual-test',
    resolved: false,
    metadata: { test: true }
  });
  
  res.json({
    success: true,
    message: 'Test alert triggered',
    timestamp: new Date().toISOString()
  });
});

export { router as alertingRoutes };