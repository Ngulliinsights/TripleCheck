// Base configuration
export { baseConfig } from './vitest.base.config'

// Test suite configurations
export { default as unitConfig } from './vitest.unit.config'
export { default as integrationConfig } from './vitest.integration.config'
export { default as serverConfig } from './vitest.server.config'
export { default as performanceConfig } from './vitest.performance.config'
export { default as securityConfig } from './vitest.security.config'
export { default as e2eConfig } from './vitest.e2e.config'

// Domain-specific configurations
export { default as landVerificationConfig } from './vitest.land-verification.config'
export { default as fraudDetectionConfig } from './vitest.fraud-detection.config'
export { default as documentAuthConfig } from './vitest.document-auth.config'

// Configuration utilities
export { 
  createTestSuiteConfig, 
  getAllTestSuites, 
  getTestSuiteConfig,
  type TestSuite,
  type TestEnvironmentConfig 
} from './test-config-manager'

export { 
  createChunkConfig, 
  generateChunkConfigs, 
  createDomainSpecificConfig,
  type ChunkConfig 
} from './chunk-generator'

// Available test suites
export const TEST_SUITES = [
  'unit',
  'integration', 
  'performance',
  'security',
  'e2e',
  'land-verification',
  'fraud-detection',
  'document-auth'
] as const

// Configuration mapping for easy access
export const CONFIG_MAP = {
  unit: () => import('./vitest.unit.config'),
  integration: () => import('./vitest.integration.config'),
  server: () => import('./vitest.server.config'),
  performance: () => import('./vitest.performance.config'),
  security: () => import('./vitest.security.config'),
  e2e: () => import('./vitest.e2e.config'),
  'land-verification': () => import('./vitest.land-verification.config'),
  'fraud-detection': () => import('./vitest.fraud-detection.config'),
  'document-auth': () => import('./vitest.document-auth.config'),
} as const