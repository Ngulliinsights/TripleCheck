/**
 * Security Module Index
 * 
 * Exports all security and compliance components for the TripleCheck system.
 */

// Core security components
export { ComplianceManager } from './ComplianceManager';
export { SecurityMonitor } from './SecurityMonitor';
export { VulnerabilityScanner } from './VulnerabilityScanner';

// Types and interfaces
export type {
  DataClassification,
  GDPRRequest,
  ComplianceReport,
  DataRetentionPolicy
} from './ComplianceManager';

export type {
  SecurityEvent,
  ThreatPattern,
  SecurityAlert,
  VulnerabilityAssessment
} from './SecurityMonitor';

export type {
  VulnerabilityReport,
  Vulnerability,
  ScanConfig
} from './VulnerabilityScanner';

// Core system integration
export { SecuritySystem, createSecuritySystem } from './SecuritySystem';
export { SecurityReporting, generateSecurityReport } from './SecurityReporting';

// Additional types
export type {
  SecuritySystemConfig
} from './SecuritySystem';

export type {
  SecurityReportConfig,
  SecurityReport
} from './SecurityReporting';