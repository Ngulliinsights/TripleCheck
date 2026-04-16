"use strict";
/**
 * Monitoring Page
 * Main page for system monitoring and health checks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringPage = void 0;
var react_1 = require("react");
var HealthDashboard_1 = require("../components/HealthDashboard");
var MonitoringPage = function () {
    return (<div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <HealthDashboard_1.HealthDashboard />
      </div>
    </div>);
};
exports.MonitoringPage = MonitoringPage;
exports.default = exports.MonitoringPage;
