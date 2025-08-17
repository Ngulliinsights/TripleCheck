export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type ElementStatus = 'working' | 'broken' | 'missing' | 'unknown';

export interface ComponentLocation {
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  contextLines: string[];
  componentName?: string;
  elementPath?: string;
  parentComponents?: string[];
}

export interface AuditConfiguration {
  scanDepth: 'shallow' | 'deep' | 'exhaustive';
  includeTestFiles: boolean;
  excludePaths: string[];
  componentDirectories?: string[];
  apiTimeout: number; // milliseconds
  parallelism: number; // concurrent operations
  cacheResults: boolean;
  cacheDuration: number; // minutes
  includeAccessibility: boolean;
  includePerformance: boolean;
  customRules: AuditRule[];
  excludePatterns?: string[];
}

export interface AuditRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: Priority;
  check: (element: UIElement) => Promise<AuditRuleResult>;
}

export interface AuditRuleResult {
  passed: boolean;
  message: string;
  suggestion?: string;
  autoFixAvailable?: boolean;
}

export interface UIElement {
  id?: string;
  type: string;
  name?: string;
  props: Record<string, any>;
  children?: UIElement[];
  handlers?: { 
    name: string; 
    code: string;
    event?: string;
  }[];
  apiCalls?: { endpoint: string; method: string }[];
  accessibility?: AccessibilityInfo;
  performance?: PerformanceMetrics;
  status?: ElementStatus;
  location?: ComponentLocation;
  navigationTarget?: string;
  confidence?: number;
  priority?: Priority;
  currentBehavior?: string;
  intendedBehavior?: string;
}

export interface AccessibilityInfo {
  hasAriaLabels: boolean;
  hasKeyboardSupport: boolean;
  contrastRatio: number;
  screenReaderFriendly: boolean;
  wcagLevel: 'AA' | 'fail';
  issues: string[];
}

export interface PerformanceMetrics {
  renderTime: number; // milliseconds
  bundleImpact: number; // kilobytes
  memoryUsage: number; // megabytes
  rerendersPerSecond: number;
  issues: string[];
}
