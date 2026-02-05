import { Router } from 'express';

import { alertingSystem } from '../infrastructure/monitoring/AlertingSystem';
import { logger } from '../infrastructure/monitoring/logger';
import { observabilitySystem } from '../infrastructure/monitoring/ObservabilitySystem';
import { prometheusMetrics } from '../infrastructure/monitoring/PrometheusMetrics';

const router = Router();

/**
 * Prometheus metrics endpoint
 * This endpoint is scraped by Prometheus to collect metrics
 */
router.get('/prometheus', async (req, res) => {
  try {
    const metrics = await prometheusMetrics.getMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    logger.error('Error serving Prometheus metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

/**
 * Health check endpoint for monitoring systems
 */
router.get('/health', async (req, res) => {
  try {
    const [metricsHealth, alertingHealth, observabilityHealth] = await Promise.all([
      prometheusMetrics.healthCheck(),
      alertingSystem.healthCheck(),
      observabilitySystem.healthCheck()
    ]);

    const overallStatus = [metricsHealth, alertingHealth, observabilityHealth]
      .every(health => health.status === 'healthy') ? 'healthy' : 'unhealthy';

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      components: {
        metrics: metricsHealth,
        alerting: alertingHealth,
        observability: observabilityHealth
      }
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Error in health check:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Active alerts endpoint
 */
router.get('/alerts', async (req, res) => {
  try {
    const alerts = alertingSystem.getActiveAlerts();
    res.json({
      count: alerts.length,
      alerts: alerts.map(alert => ({
        id: alert.id,
        name: alert.name,
        severity: alert.severity,
        status: alert.status,
        startsAt: alert.startsAt,
        labels: alert.labels,
        annotations: {
          summary: alert.annotations.summary,
          description: alert.annotations.description
        }
      }))
    });
  } catch (error) {
    logger.error('Error getting active alerts:', error);
    res.status(500).json({ error: 'Failed to retrieve alerts' });
  }
});

/**
 * Active incidents endpoint
 */
router.get('/incidents', async (req, res) => {
  try {
    const incidents = alertingSystem.getActiveIncidents();
    res.json({
      count: incidents.length,
      incidents: incidents.map(incident => ({
        id: incident.id,
        title: incident.title,
        severity: incident.severity,
        status: incident.status,
        team: incident.team,
        assignee: incident.assignee,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt,
        alertCount: incident.alerts.length
      }))
    });
  } catch (error) {
    logger.error('Error getting active incidents:', error);
    res.status(500).json({ error: 'Failed to retrieve incidents' });
  }
});

/**
 * Webhook endpoint for receiving alerts from external systems
 */
router.post('/alerts/webhook', async (req, res) => {
  try {
    const alerts = req.body.alerts || [req.body];
    
    for (const alertData of alerts) {
      const alert = {
        id: alertData.id || `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: alertData.alertname || alertData.name || 'Unknown Alert',
        severity: alertData.severity || 'medium',
        status: alertData.status || 'firing',
        startsAt: new Date(alertData.startsAt || Date.now()),
        endsAt: alertData.endsAt ? new Date(alertData.endsAt) : undefined,
        labels: alertData.labels || {},
        annotations: alertData.annotations || {},
        generatorURL: alertData.generatorURL,
        fingerprint: alertData.fingerprint || `${alertData.alertname}-${JSON.stringify(alertData.labels)}`
      };

      await alertingSystem.processAlert(alert);
    }

    res.json({ message: 'Alerts processed successfully', count: alerts.length });
  } catch (error) {
    logger.error('Error processing webhook alerts:', error);
    res.status(500).json({ error: 'Failed to process alerts' });
  }
});

export default router;