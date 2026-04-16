/**
 * API Client Monitoring Dashboard
 * 
 * Real-time dashboard for monitoring unified API client performance
 */

import React, { useState, useEffect } from 'react'
import { apiMonitor, monitoringUtils, type ApiMetrics, type EndpointMetrics } from "../../../local/services/unified-api-client"

interface DashboardProps {
  refreshInterval?: number; // in seconds
}

export const ApiClientDashboard: React.FC<DashboardProps> = ({ 
  refreshInterval = 30 
}) => {
  const [metrics, setMetrics] = useState<ApiMetrics | null>(null);
  const [endpointMetrics, setEndpointMetrics] = useState<EndpointMetrics[]>([]);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'critical'>('healthy');
  const [alerts, setAlerts] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const updateMetrics = () => {
      try {
        const currentMetrics = apiMonitor.getCurrentMetrics();
        const currentEndpoints = apiMonitor.getEndpointMetrics();
        const healthCheck = monitoringUtils.getHealthCheck();
        const comparison = apiMonitor.compareToBaseline();

        setMetrics(currentMetrics);
        setEndpointMetrics(currentEndpoints.slice(0, 10)); // Top 10 endpoints
        setHealthStatus(healthCheck.status);
        setAlerts(comparison.alerts);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error updating API client metrics:', error);
      }
    };

    // Initial load
    updateMetrics();

    // Set up refresh interval
    const interval = setInterval(updateMetrics, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (!metrics) {
    return (
      <div className="api-dashboard loading">
        <div className="loading-spinner">Loading API metrics...</div>
      </div>
    );
  }

  const successRate = metrics.requestCount > 0 
    ? ((metrics.successCount / metrics.requestCount) * 100).toFixed(1)
    : '100';

  const errorRate = metrics.requestCount > 0 
    ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(1)
    : '0';

  return (
    <div className="api-dashboard">
      <div className="dashboard-header">
        <h2>🔍 API Client Monitor</h2>
        <div className={`health-status ${healthStatus}`}>
          <span className="status-indicator"></span>
          {healthStatus.toUpperCase()}
        </div>
        <div className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h3>⚠️ Active Alerts</h3>
          <div className="alerts-list">
            {alerts.map((alert, index) => (
              <div key={index} className="alert-item">
                {alert}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Requests</div>
          <div className="metric-value">{metrics.requestCount.toLocaleString()}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Success Rate</div>
          <div className={`metric-value ${parseFloat(successRate) >= 95 ? 'good' : 'warning'}`}>
            {successRate}%
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Error Rate</div>
          <div className={`metric-value ${parseFloat(errorRate) <= 5 ? 'good' : 'error'}`}>
            {errorRate}%
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Avg Response Time</div>
          <div className={`metric-value ${metrics.averageResponseTime <= 2000 ? 'good' : 'warning'}`}>
            {metrics.averageResponseTime.toFixed(0)}ms
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">P95 Response Time</div>
          <div className={`metric-value ${metrics.p95ResponseTime <= 5000 ? 'good' : 'warning'}`}>
            {metrics.p95ResponseTime.toFixed(0)}ms
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Cache Hit Rate</div>
          <div className={`metric-value ${metrics.cacheHitRate >= 30 ? 'good' : 'warning'}`}>
            {metrics.cacheHitRate.toFixed(1)}%
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Circuit Breaker Trips</div>
          <div className={`metric-value ${metrics.circuitBreakerTrips === 0 ? 'good' : 'error'}`}>
            {metrics.circuitBreakerTrips}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Rate Limit Hits</div>
          <div className={`metric-value ${metrics.rateLimitHits <= 10 ? 'good' : 'warning'}`}>
            {metrics.rateLimitHits}
          </div>
        </div>
      </div>

      {/* Endpoint Performance Table */}
      <div className="endpoints-section">
        <h3>📊 Top Endpoints</h3>
        <div className="endpoints-table">
          <div className="table-header">
            <div>Endpoint</div>
            <div>Method</div>
            <div>Requests</div>
            <div>Success Rate</div>
            <div>Avg Response</div>
            <div>Last Error</div>
          </div>
          {endpointMetrics.map((endpoint, index) => (
            <div key={index} className="table-row">
              <div className="endpoint-path">{endpoint.endpoint}</div>
              <div className={`method ${endpoint.method.toLowerCase()}`}>
                {endpoint.method}
              </div>
              <div>{endpoint.requestCount}</div>
              <div className={`success-rate ${endpoint.successRate >= 95 ? 'good' : 'warning'}`}>
                {endpoint.successRate.toFixed(1)}%
              </div>
              <div className={`response-time ${endpoint.averageResponseTime <= 2000 ? 'good' : 'warning'}`}>
                {endpoint.averageResponseTime.toFixed(0)}ms
              </div>
              <div className="last-error">
                {endpoint.lastError ? (
                  <span title={endpoint.lastError.message}>
                    {endpoint.lastError.timestamp.toLocaleTimeString()}
                  </span>
                ) : (
                  <span className="no-error">None</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="dashboard-actions">
        <button 
          onClick={() => monitoringUtils.logPerformanceSummary()}
          className="action-button"
        >
          📋 Log Summary
        </button>
        <button 
          onClick={() => apiMonitor.resetMetrics()}
          className="action-button warning"
        >
          🔄 Reset Metrics
        </button>
        <button 
          onClick={() => window.open('/api-client-docs', '_blank')}
          className="action-button"
        >
          📚 Documentation
        </button>
      </div>

      <style jsx>{`
        .api-dashboard {
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e9ecef;
        }

        .dashboard-header h2 {
          margin: 0;
          color: #2c3e50;
        }

        .health-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }

        .health-status.healthy {
          background: #d4edda;
          color: #155724;
        }

        .health-status.degraded {
          background: #fff3cd;
          color: #856404;
        }

        .health-status.critical {
          background: #f8d7da;
          color: #721c24;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .last-updated {
          font-size: 12px;
          color: #6c757d;
        }

        .alerts-section {
          margin-bottom: 20px;
          padding: 15px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
        }

        .alerts-section h3 {
          margin: 0 0 10px 0;
          color: #856404;
        }

        .alert-item {
          padding: 5px 0;
          color: #856404;
          font-size: 14px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .metric-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          text-align: center;
        }

        .metric-label {
          font-size: 12px;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
        }

        .metric-value.good {
          color: #28a745;
        }

        .metric-value.warning {
          color: #ffc107;
        }

        .metric-value.error {
          color: #dc3545;
        }

        .endpoints-section {
          margin-bottom: 20px;
        }

        .endpoints-section h3 {
          margin-bottom: 15px;
          color: #2c3e50;
        }

        .endpoints-table {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          gap: 15px;
          padding: 15px;
          background: #f8f9fa;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          color: #6c757d;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          gap: 15px;
          padding: 15px;
          border-top: 1px solid #e9ecef;
          font-size: 14px;
        }

        .endpoint-path {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
        }

        .method {
          font-weight: 600;
          font-size: 12px;
          text-align: center;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .method.get { background: #d4edda; color: #155724; }
        .method.post { background: #cce5ff; color: #004085; }
        .method.put { background: #fff3cd; color: #856404; }
        .method.delete { background: #f8d7da; color: #721c24; }

        .success-rate.good { color: #28a745; }
        .success-rate.warning { color: #ffc107; }

        .response-time.good { color: #28a745; }
        .response-time.warning { color: #ffc107; }

        .no-error {
          color: #28a745;
          font-style: italic;
        }

        .dashboard-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 20px;
        }

        .action-button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          background: #007bff;
          color: white;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .action-button:hover {
          background: #0056b3;
        }

        .action-button.warning {
          background: #ffc107;
          color: #212529;
        }

        .action-button.warning:hover {
          background: #e0a800;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
        }

        .loading-spinner {
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default ApiClientDashboard;