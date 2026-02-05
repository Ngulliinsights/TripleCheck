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
  apiTimeout: number;
  parallelism: number;
  cacheResults: boolean;
  cacheDuration: number;
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
  
  // Added missing properties
  status: ElementStatus;
  priority?: Priority;
  location?: ComponentLocation;
  currentBehavior?: string;
  intendedBehavior?: string;
  lastTested?: Date;
  errorMessage?: string;
  
  // Additional properties for enhanced functionality
  confidence?: number;
  handlers?: Array<{
    name: string;
    code: string;
    event: string;
  }>;
  apiCalls?: Array<{
    endpoint: string;
    method: string;
  }>;
  navigationTarget?: string;
  accessibility?: {
    hasAriaLabels: boolean;
    hasKeyboardSupport: boolean;
    contrastRatio: number;
    screenReaderFriendly: boolean;
    wcagLevel: string;
    issues: string[];
  };
  performance?: {
    renderTime: number;
    bundleImpact: number;
    memoryUsage: number;
    rerendersPerSecond: number;
    issues: string[];
  };
}