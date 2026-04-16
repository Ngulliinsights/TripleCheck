/**
 * Monitoring Module Index
 * Exports all monitoring-related components and services
 */

// Components
export { HealthDashboard } from './components/HealthDashboard'

// Pages
export { MonitoringPage } from './pages/MonitoringPage'

// Services
export { default as healthCheckService } from '../shared/services/HealthCheckService'

// Hooks
export {
  useSystemHealth,
  useEndpointHealth,
  usePerformanceMetrics,
  useConnectionMonitoring,
  useApiResponseTimeMonitoring
} from '../shared/hooks/useHealthMonitoring'

// Types
export type {
  HealthCheckResult,
  SystemHealth,
  PerformanceMetrics
} from '../shared/services/HealthCheckService'