import type { Priority, ElementStatus, ComponentLocation, AuditConfiguration, AuditRule, AuditRuleResult, UIElement } from './audit.types'

// Re-export base types
export type {
  Priority,
  ElementStatus,
  ComponentLocation,
  AuditConfiguration,
  AuditRule,
  AuditRuleResult,
  UIElement,
};

// Audit system specific types
export interface AuditReport {
  id: string;
  timestamp: Date;
  summary: AuditSummary;
  elements: UIElement[];
  routes: RouteValidationResult[];
  apiConnections: APIConnectionResult[];
  recommendations: Recommendation[];
}

export interface AuditSummary {
  totalElements: number;
  workingElements: number;
  brokenElements: number;
  missingElements: number;
  unknownElements: number;
  criticalIssues: number;
  highPriorityIssues: number;
  estimatedFixTime: number;
}

export interface Recommendation {
  id: string;
  priority: Priority;
  category: 'backend' | 'frontend' | 'routing' | 'error-handling' | 'performance' | 'accessibility' | 'security';
  title: string;
  description: string;
  estimatedEffort: number;
  dependencies: string[];
  affectedElements: string[];
  suggestedSolution: string;
  autoFixAvailable?: boolean;
  businessImpact: string;
}

export interface RouteValidationResult {
  route: string;
  status: 'working' | 'broken' | '404' | 'redirect' | 'timeout';
  component?: string;
  errorMessage?: string;
  responseTime?: number;
  statusCode?: number;
  redirectTarget?: string;
  expectedComponent?: string; // Added missing property
}

export interface APIConnectionResult {
  endpoint: string;
  method: string;
  status: 'working' | 'broken' | 'timeout' | 'unauthorized' | 'rate-limited';
  responseTime?: number;
  errorCode?: number;
  errorMessage?: string;
  usedBy: string[];
  lastTested: Date;
  healthScore: number;
}

// Link validation types
export interface LinkValidationResult {
  url: string;
  type: 'internal_route' | 'external_link' | 'api_endpoint' | 'dynamic_route';
  status: 'working' | 'broken' | 'timeout' | 'redirect' | 'unauthorized' | '404' | 'rate_limited' | 'ssl_error';
  responseTime?: number;
  statusCode?: number;
  errorMessage?: string;
  redirectUrl?: string;
  redirectChain?: string[];
  foundIn: LinkLocation[];
  lastTested: Date;
  retryCount: number;
  healthScore: number;
  securityIssues?: SecurityIssue[];
  performance?: LinkPerformanceMetrics;
  suggestions?: string[];
}

export interface LinkLocation {
  filePath: string;
  componentName: string;
  lineNumber: number;
  columnNumber: number;
  elementType: 'Link' | 'button' | 'a' | 'form' | 'navigate' | 'fetch' | 'axios' | 'dynamic_import';
  context: string;
  isConditional: boolean;
  framework?: 'react-router' | 'next-router' | 'vanilla' | 'vue-router';
}

export interface SecurityIssue {
  type: 'mixed_content' | 'insecure_protocol' | 'suspicious_domain' | 'cors_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface LinkPerformanceMetrics {
  firstByteTime: number;
  totalLoadTime: number;
  contentSize: number;
  compressionRatio?: number;
  cacheHeaders?: { [key: string]: string };
}

export interface ValidationSummary {
  totalLinks: number;
  workingLinks: number;
  brokenLinks: number;
  timeoutLinks: number;
  averageHealthScore: number;
  securityIssues: number;
  performanceIssues: number;
  internalRoutes: number;
  externalLinks: number;
  dynamicRoutes: number;
  brokenInternalRoutes: number;
  brokenExternalLinks: number;
  totalAPIs: number;
  workingAPIs: number;
  brokenAPIs: number;
  averageResponseTime: number;
  slowestLink: { url: string; responseTime: number } | null;
  cacheHitRate: number;
  filesScanned: number;
  componentsAnalyzed: number;
  internalLinks: number; // Added missing property
}

// Route analyzer types
export interface RouteDefinition {
  path: string;
  component?: string;
  lazy?: boolean;
  exact?: boolean;
  children?: RouteDefinition[];
}

export interface RouteReference {
  path: string;
  referencedIn: string[];
  lineNumbers: number[];
  isNavigationTarget: boolean;
  isLinkTarget: boolean;
}

export interface RouteMismatch {
  path: string;
  issue: 'missing_route' | 'missing_component' | 'broken_lazy_load' | 'invalid_params';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestedFix: string;
}

// Enhanced audit report types
export interface PrioritizedAction {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'backend' | 'frontend' | 'routing' | 'error-handling' | 'performance' | 'accessibility' | 'security';
  estimatedHours: number;
  dependencies: string[];
  affectedFeatures: string[];
  userImpact: 'high' | 'medium' | 'low';
  technicalComplexity: 'high' | 'medium' | 'low';
  businessValue: 'high' | 'medium' | 'low';
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  totalEstimatedHours: number;
  estimatedCompletionDate: Date;
  resourceRequirements: ResourceRequirement[];
  risks: string[];
  dependencies: string[];
}

export interface ImplementationPhase {
  id: string;
  name: string;
  description: string;
  actions: string[];
  estimatedHours: number;
  dependencies: string[];
  deliverables: string[];
}

export interface ResourceRequirement {
  role: string;
  hoursRequired: number;
  skills: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface RiskAssessment {
  overallRisk: 'high' | 'medium' | 'low';
  risks: Risk[];
  mitigationStrategies: MitigationStrategy[];
}

export interface Risk {
  id: string;
  description: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  category: 'technical' | 'business' | 'user-experience' | 'security';
  mitigation: string;
}

export interface MitigationStrategy {
  riskId: string;
  strategy: string;
  cost: number;
  timeframe: string;
  effectiveness: 'high' | 'medium' | 'low';
}

export interface ComprehensiveAuditReport extends AuditReport {
  routeMismatches: RouteMismatch[];
  linkValidation: ValidationSummary;
  prioritizedActions: PrioritizedAction[];
  implementationPlan: ImplementationPlan;
  riskAssessment: RiskAssessment;
}

// Route analyzer types
export interface RouteDefinition {
  path: string;
  component?: string;
  lazy?: boolean;
  exact?: boolean;
  children?: RouteDefinition[];
}

export interface RouteReference {
  path: string;
  referencedIn: string[];
  lineNumbers: number[];
  isNavigationTarget: boolean;
  isLinkTarget: boolean;
}

export interface RouteMismatch {
  path: string;
  issue: 'missing_route' | 'missing_component' | 'broken_lazy_load' | 'invalid_params';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestedFix: string;
}