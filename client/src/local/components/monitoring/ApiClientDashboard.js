"use strict";
/**
 * API Client Monitoring Dashboard
 *
 * Real-time dashboard for monitoring unified API client performance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClientDashboard = void 0;
var react_1 = require("react");
var unified_api_client_1 = require("../../../local/services/unified-api-client");
var ApiClientDashboard = function (_a) {
    var _b = _a.refreshInterval, refreshInterval = _b === void 0 ? 30 : _b;
    var _c = (0, react_1.useState)(null), metrics = _c[0], setMetrics = _c[1];
    var _d = (0, react_1.useState)([]), endpointMetrics = _d[0], setEndpointMetrics = _d[1];
    var _e = (0, react_1.useState)('healthy'), healthStatus = _e[0], setHealthStatus = _e[1];
    var _f = (0, react_1.useState)([]), alerts = _f[0], setAlerts = _f[1];
    var _g = (0, react_1.useState)(new Date()), lastUpdated = _g[0], setLastUpdated = _g[1];
    (0, react_1.useEffect)(function () {
        var updateMetrics = function () {
            try {
                var currentMetrics = unified_api_client_1.apiMonitor.getCurrentMetrics();
                var currentEndpoints = unified_api_client_1.apiMonitor.getEndpointMetrics();
                var healthCheck = unified_api_client_1.monitoringUtils.getHealthCheck();
                var comparison = unified_api_client_1.apiMonitor.compareToBaseline();
                setMetrics(currentMetrics);
                setEndpointMetrics(currentEndpoints.slice(0, 10)); // Top 10 endpoints
                setHealthStatus(healthCheck.status);
                setAlerts(comparison.alerts);
                setLastUpdated(new Date());
            }
            catch (error) {
                console.error('Error updating API client metrics:', error);
            }
        };
        // Initial load
        updateMetrics();
        // Set up refresh interval
        var interval = setInterval(updateMetrics, refreshInterval * 1000);
        return function () { return clearInterval(interval); };
    }, [refreshInterval]);
    if (!metrics) {
        return (<div className="api-dashboard loading">
        <div className="loading-spinner">Loading API metrics...</div>
      </div>);
    }
    var successRate = metrics.requestCount > 0
        ? ((metrics.successCount / metrics.requestCount) * 100).toFixed(1)
        : '100';
    var errorRate = metrics.requestCount > 0
        ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(1)
        : '0';
    return (<div className="api-dashboard">
      <div className="dashboard-header">
        <h2>🔍 API Client Monitor</h2>
        <div className={"health-status ".concat(healthStatus)}>
          <span className="status-indicator"></span>
          {healthStatus.toUpperCase()}
        </div>
        <div className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (<div className="alerts-section">
          <h3>⚠️ Active Alerts</h3>
          <div className="alerts-list">
            {alerts.map(function (alert, index) { return (<div key={index} className="alert-item">
                {alert}
              </div>); })}
          </div>
        </div>)}

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Requests</div>
          <div className="metric-value">{metrics.requestCount.toLocaleString()}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Success Rate</div>
          <div className={"metric-value ".concat(parseFloat(successRate) >= 95 ? 'good' : 'warning')}>
            {successRate}%
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Error Rate</div>
          <div className={"metric-value ".concat(parseFloat(errorRate) <= 5 ? 'good' : 'error')}>
            {errorRate}%
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Avg Response Time</div>
          <div className={"metric-value ".concat(metrics.averageResponseTime <= 2000 ? 'good' : 'warning')}>
            {metrics.averageResponseTime.toFixed(0)}ms
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">P95 Response Time</div>
          <div className={"metric-value ".concat(metrics.p95ResponseTime <= 5000 ? 'good' : 'warning')}>
            {metrics.p95ResponseTime.toFixed(0)}ms
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Cache Hit Rate</div>
          <div className={"metric-value ".concat(metrics.cacheHitRate >= 30 ? 'good' : 'warning')}>
            {metrics.cacheHitRate.toFixed(1)}%
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Circuit Breaker Trips</div>
          <div className={"metric-value ".concat(metrics.circuitBreakerTrips === 0 ? 'good' : 'error')}>
            {metrics.circuitBreakerTrips}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Rate Limit Hits</div>
          <div className={"metric-value ".concat(metrics.rateLimitHits <= 10 ? 'good' : 'warning')}>
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
          {endpointMetrics.map(function (endpoint, index) { return (<div key={index} className="table-row">
              <div className="endpoint-path">{endpoint.endpoint}</div>
              <div className={"method ".concat(endpoint.method.toLowerCase())}>
                {endpoint.method}
              </div>
              <div>{endpoint.requestCount}</div>
              <div className={"success-rate ".concat(endpoint.successRate >= 95 ? 'good' : 'warning')}>
                {endpoint.successRate.toFixed(1)}%
              </div>
              <div className={"response-time ".concat(endpoint.averageResponseTime <= 2000 ? 'good' : 'warning')}>
                {endpoint.averageResponseTime.toFixed(0)}ms
              </div>
              <div className="last-error">
                {endpoint.lastError ? (<span title={endpoint.lastError.message}>
                    {endpoint.lastError.timestamp.toLocaleTimeString()}
                  </span>) : (<span className="no-error">None</span>)}
              </div>
            </div>); })}
        </div>
      </div>

      {/* Actions */}
      <div className="dashboard-actions">
        <button onClick={function () { return unified_api_client_1.monitoringUtils.logPerformanceSummary(); }} className="action-button">
          📋 Log Summary
        </button>
        <button onClick={function () { return unified_api_client_1.apiMonitor.resetMetrics(); }} className="action-button warning">
          🔄 Reset Metrics
        </button>
        <button onClick={function () { return window.open('/api-client-docs', '_blank'); }} className="action-button">
          📚 Documentation
        </button>
      </div>

      <style jsx>{"\n        .api-dashboard {\n          padding: 20px;\n          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n          background: #f8f9fa;\n          border-radius: 8px;\n          box-shadow: 0 2px 8px rgba(0,0,0,0.1);\n        }\n\n        .dashboard-header {\n          display: flex;\n          align-items: center;\n          justify-content: space-between;\n          margin-bottom: 20px;\n          padding-bottom: 15px;\n          border-bottom: 2px solid #e9ecef;\n        }\n\n        .dashboard-header h2 {\n          margin: 0;\n          color: #2c3e50;\n        }\n\n        .health-status {\n          display: flex;\n          align-items: center;\n          gap: 8px;\n          padding: 8px 16px;\n          border-radius: 20px;\n          font-weight: 600;\n          font-size: 14px;\n        }\n\n        .health-status.healthy {\n          background: #d4edda;\n          color: #155724;\n        }\n\n        .health-status.degraded {\n          background: #fff3cd;\n          color: #856404;\n        }\n\n        .health-status.critical {\n          background: #f8d7da;\n          color: #721c24;\n        }\n\n        .status-indicator {\n          width: 8px;\n          height: 8px;\n          border-radius: 50%;\n          background: currentColor;\n        }\n\n        .last-updated {\n          font-size: 12px;\n          color: #6c757d;\n        }\n\n        .alerts-section {\n          margin-bottom: 20px;\n          padding: 15px;\n          background: #fff3cd;\n          border: 1px solid #ffeaa7;\n          border-radius: 6px;\n        }\n\n        .alerts-section h3 {\n          margin: 0 0 10px 0;\n          color: #856404;\n        }\n\n        .alert-item {\n          padding: 5px 0;\n          color: #856404;\n          font-size: 14px;\n        }\n\n        .metrics-grid {\n          display: grid;\n          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n          gap: 15px;\n          margin-bottom: 30px;\n        }\n\n        .metric-card {\n          background: white;\n          padding: 20px;\n          border-radius: 8px;\n          box-shadow: 0 1px 3px rgba(0,0,0,0.1);\n          text-align: center;\n        }\n\n        .metric-label {\n          font-size: 12px;\n          color: #6c757d;\n          text-transform: uppercase;\n          letter-spacing: 0.5px;\n          margin-bottom: 8px;\n        }\n\n        .metric-value {\n          font-size: 24px;\n          font-weight: 700;\n          color: #2c3e50;\n        }\n\n        .metric-value.good {\n          color: #28a745;\n        }\n\n        .metric-value.warning {\n          color: #ffc107;\n        }\n\n        .metric-value.error {\n          color: #dc3545;\n        }\n\n        .endpoints-section {\n          margin-bottom: 20px;\n        }\n\n        .endpoints-section h3 {\n          margin-bottom: 15px;\n          color: #2c3e50;\n        }\n\n        .endpoints-table {\n          background: white;\n          border-radius: 8px;\n          overflow: hidden;\n          box-shadow: 0 1px 3px rgba(0,0,0,0.1);\n        }\n\n        .table-header {\n          display: grid;\n          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;\n          gap: 15px;\n          padding: 15px;\n          background: #f8f9fa;\n          font-weight: 600;\n          font-size: 12px;\n          text-transform: uppercase;\n          color: #6c757d;\n        }\n\n        .table-row {\n          display: grid;\n          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;\n          gap: 15px;\n          padding: 15px;\n          border-top: 1px solid #e9ecef;\n          font-size: 14px;\n        }\n\n        .endpoint-path {\n          font-family: 'Monaco', 'Menlo', monospace;\n          font-size: 12px;\n        }\n\n        .method {\n          font-weight: 600;\n          font-size: 12px;\n          text-align: center;\n          padding: 2px 8px;\n          border-radius: 4px;\n        }\n\n        .method.get { background: #d4edda; color: #155724; }\n        .method.post { background: #cce5ff; color: #004085; }\n        .method.put { background: #fff3cd; color: #856404; }\n        .method.delete { background: #f8d7da; color: #721c24; }\n\n        .success-rate.good { color: #28a745; }\n        .success-rate.warning { color: #ffc107; }\n\n        .response-time.good { color: #28a745; }\n        .response-time.warning { color: #ffc107; }\n\n        .no-error {\n          color: #28a745;\n          font-style: italic;\n        }\n\n        .dashboard-actions {\n          display: flex;\n          gap: 10px;\n          justify-content: center;\n          margin-top: 20px;\n        }\n\n        .action-button {\n          padding: 10px 20px;\n          border: none;\n          border-radius: 6px;\n          background: #007bff;\n          color: white;\n          cursor: pointer;\n          font-size: 14px;\n          transition: background-color 0.2s;\n        }\n\n        .action-button:hover {\n          background: #0056b3;\n        }\n\n        .action-button.warning {\n          background: #ffc107;\n          color: #212529;\n        }\n\n        .action-button.warning:hover {\n          background: #e0a800;\n        }\n\n        .loading {\n          display: flex;\n          justify-content: center;\n          align-items: center;\n          height: 200px;\n        }\n\n        .loading-spinner {\n          color: #6c757d;\n        }\n      "}</style>
    </div>);
};
exports.ApiClientDashboard = ApiClientDashboard;
exports.default = exports.ApiClientDashboard;
