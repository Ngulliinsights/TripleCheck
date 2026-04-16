/**
 * Monitoring Page
 * Main page for system monitoring and health checks
 */

import React from 'react'
import { HealthDashboard } from '../components/HealthDashboard'

export const MonitoringPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <HealthDashboard />
      </div>
    </div>
  );
};

export default MonitoringPage;