/**
 * Security Audit Plugin
 * 
 * Analyzes security vulnerabilities in UI components and interactions
 */

import { AuditPlugin, PluginResult, UIElement, AuditRuleResult } from '../UIAuditSystem'
import { AuditConfig } from '../config'

export interface SecurityVulnerability {
  type: 'xss' | 'csrf' | 'injection' | 'data-exposure' | 'auth-bypass' | 'insecure-transport';
  severity: 'critical' | 'high' | 'medium' | 'low';
  cwe: string; // Common Weakness Enumeration ID
  description: string;
  impact: string;
  remediation: string;
  references: string[];
}

export interface SecurityContext {
  hasAuthentication: boolean;
  handlesUserInput: boolean;
  makesAPIRequests: boolean;
  storesData: boolean;
  hasFileUpload: boolean;
  usesThirdPartyLibraries: boolean;
}

export class SecurityPlugin implements AuditPlugin {
  name = 'security-audit';
  version = '1.0.0';
  description = 'Security vulnerability analysis for UI components';
  
  private config!: AuditConfig;
  private knownVulnerablePackages: Set<string> = new Set();
  
  async initialize(config: any): Promise<void> {
    this.config = config;
    console.log('🔒 Initializing Security Plugin...');
    
    // Load known vulnerable packages (would fetch from security databases)
    this.knownVulnerablePackages = new Set([
      'lodash@4.17.20', // Example vulnerable version
      'moment@2.29.1',  // Example vulnerable version
      'axios@0.21.0'    // Example vulnerable version
    ]);
    
    console.log('✅ Security vulnerability database loaded');
  }
  
  async scan(elements: UIElement[]): Promise<PluginResult[]> {
    console.log(`🔒 Running security analysis on ${elements.length} elements...`);
    
    const results: PluginResult[] = [];
    
    for (const element of elements) {
      const findings = await this.analyzeElementSecurity(element);
      
      if (findings.length > 0) {
        const securityContext = this.analyzeSecurityContext(element);
        const riskScore = this.calculateRiskScore(findings, securityContext);
        
        results.push({
          pluginName: this.name,
          elementId: element.id,
          findings,
          metadata: {
            riskScore,
            securityContext,
            vulnerabilities: this.extractVulnerabilities(findings),
            recommendations: this.generateSecurityRecommendations(element, findings)
          }
        });
      }
    }
    
    console.log(`✅ Security analysis complete. Found issues in ${results.length} elements`);
    return results;
  }
  
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Security Plugin...');
    // Cleanup resources if needed
  }
  
  private async analyzeElementSecurity(element: UIElement): Promise<AuditRuleResult[]> {
    const findings: AuditRuleResult[] = [];
    
    // Check for XSS vulnerabilities
    findings.push(await this.checkXSSVulnerabilities(element));
    
    // Check for CSRF protection
    findings.push(await this.checkCSRFProtection(element));
    
    // Check for injection vulnerabilities
    findings.push(await this.checkInjectionVulnerabilities(element));
    
    // Check for data exposure
    findings.push(await this.checkDataExposure(element));
    
    // Check for authentication bypass
    findings.push(await this.checkAuthenticationBypass(element));
    
    // Check for insecure transport
    findings.push(await this.checkInsecureTransport(element));
    
    // Check for vulnerable dependencies
    findings.push(await this.checkVulnerableDependencies(element));
    
    // Check for insecure file uploads
    if (element.type === 'input' && element.props.type === 'file') {
      findings.push(await this.checkFileUploadSecurity(element));
    }
    
    return findings.filter(f => f !== null) as AuditRuleResult[];
  }
  
  private async checkXSSVulnerabilities(element: UIElement): Promise<AuditRuleResult> {
    // Check for dangerous innerHTML usage
    if (element.props.dangerouslySetInnerHTML) {
      return {
        passed: false,
        message: 'Critical: Component uses dangerouslySetInnerHTML without sanitization',
        suggestion: 'Sanitize HTML content or use safe alternatives like textContent',
        autoFixAvailable: false
      };
    }
    
    // Check for user input rendering without sanitization
    const handlesUserInput = element.type === 'input' || 
                            element.type === 'textarea' ||
                            element.props.contentEditable;
    
    const rendersUserContent = element.props.children?.toString().includes('user') ||
                              element.props.value?.toString().includes('user');
    
    if (handlesUserInput && rendersUserContent) {
      return {
        passed: false,
        message: 'High: Potential XSS vulnerability - user input rendered without sanitization',
        suggestion: 'Implement proper input sanitization and output encoding',
        autoFixAvailable: false
      };
    }
    
    // Check for eval() usage (should never be used)
    const hasEval = element.handlers.some((h: any) => 
      h.handlerName.includes('eval') || 
      h.targetEndpoint?.includes('eval')
    );
    
    if (hasEval) {
      return {
        passed: false,
        message: 'Critical: Use of eval() detected - major XSS risk',
        suggestion: 'Remove eval() usage and use safe alternatives',
        autoFixAvailable: false
      };
    }
    
    return {
      passed: true,
      message: 'No XSS vulnerabilities detected'
    };
  }
  
  private async checkCSRFProtection(element: UIElement): Promise<AuditRuleResult> {
    // Check forms for CSRF protection
    if (element.type === 'form') {
      const hasCSRFToken = element.props.children?.toString().includes('csrf') ||
                          element.props.children?.toString().includes('_token') ||
                          element.handlers.some((h: any) => h.handlerName.includes('csrf'));
      
      const isStateChangingForm = element.apiCalls.some(api => 
        api.method === 'POST' || api.method === 'PUT' || api.method === 'DELETE'
      );
      
      if (isStateChangingForm && !hasCSRFToken) {
        return {
          passed: false,
          message: 'High: Form performs state-changing operations without CSRF protection',
          suggestion: 'Implement CSRF tokens for all state-changing forms',
          autoFixAvailable: false
        };
      }
    }
    
    // Check API calls for CSRF protection
    const stateChangingAPIs = element.apiCalls.filter((api: any) => 
      api.method === 'POST' || api.method === 'PUT' || api.method === 'DELETE'
    );
    
    if (stateChangingAPIs.length > 0) {
      const hasCSRFHeader = stateChangingAPIs.some(api => 
        api.requestBody?.headers?.['X-CSRF-Token'] ||
        api.requestBody?.headers?.['X-Requested-With']
      );
      
      if (!hasCSRFHeader) {
        return {
          passed: false,
          message: 'Medium: State-changing API calls may lack CSRF protection',
          suggestion: 'Add CSRF tokens or SameSite cookie attributes',
          autoFixAvailable: false
        };
      }
    }
    
    return {
      passed: true,
      message: 'CSRF protection appears adequate'
    };
  }
  
  private async checkInjectionVulnerabilities(element: UIElement): Promise<AuditRuleResult> {
    // Check for SQL injection in API calls
    const hasUserInput = element.type === 'input' || element.type === 'textarea';
    const makesAPIRequests = element.apiCalls.length > 0;
    
    if (hasUserInput && makesAPIRequests) {
      // Check if user input is directly concatenated in API calls
      const hasDirectConcatenation = element.apiCalls.some(api => 
        api.endpoint.includes('${') || api.endpoint.includes('+')
      );
      
      if (hasDirectConcatenation) {
        return {
          passed: false,
          message: 'High: Potential injection vulnerability - user input in API endpoints',
          suggestion: 'Use parameterized queries and proper input validation',
          autoFixAvailable: false
        };
      }
    }
    
    // Check for command injection
    const hasSystemCalls = element.handlers.some((h: any) => 
      h.handlerName.includes('exec') || 
      h.handlerName.includes('system') ||
      h.handlerName.includes('shell')
    );
    
    if (hasSystemCalls) {
      return {
        passed: false,
        message: 'Critical: Potential command injection - system calls detected',
        suggestion: 'Avoid system calls or implement strict input validation',
        autoFixAvailable: false
      };
    }
    
    return {
      passed: true,
      message: 'No injection vulnerabilities detected'
    };
  }
  
  private async checkDataExposure(element: UIElement): Promise<AuditRuleResult> {
    // Check for sensitive data in props
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];
    const hasSensitiveData = Object.keys(element.props).some(key => 
      sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
    );
    
    if (hasSensitiveData) {
      return {
        passed: false,
        message: 'High: Sensitive data detected in component props',
        suggestion: 'Avoid passing sensitive data through props, use secure storage',
        autoFixAvailable: false
      };
    }
    
    // Check for console.log with sensitive data
    const hasConsoleLog = element.handlers.some((h: any) => 
      h.handlerName.includes('console.log') || h.handlerName.includes('console')
    );
    
    if (hasConsoleLog) {
      return {
        passed: false,
        message: 'Medium: Console logging detected - may expose sensitive data',
        suggestion: 'Remove console.log statements in production code',
        autoFixAvailable: true
      };
    }
    
    // Check for localStorage with sensitive data
    const usesLocalStorage = element.handlers.some((h: any) => 
      h.handlerName.includes('localStorage') || h.handlerName.includes('sessionStorage')
    );
    
    if (usesLocalStorage && hasSensitiveData) {
      return {
        passed: false,
        message: 'High: Sensitive data may be stored in browser storage',
        suggestion: 'Use secure storage methods for sensitive data',
        autoFixAvailable: false
      };
    }
    
    return {
      passed: true,
      message: 'No data exposure issues detected'
    };
  }
  
  private async checkAuthenticationBypass(element: UIElement): Promise<AuditRuleResult> {
    // Check for authentication-protected routes
    const isProtectedRoute = element.navigationTarget?.includes('/dashboard') ||
                            element.navigationTarget?.includes('/profile') ||
                            element.navigationTarget?.includes('/admin');
    
    if (isProtectedRoute) {
      const hasAuthCheck = element.handlers.some((h: any) => 
        h.handlerName.includes('auth') || 
        h.handlerName.includes('login') ||
        h.dependencies.includes('auth')
      );
      
      if (!hasAuthCheck) {
        return {
          passed: false,
          message: 'High: Navigation to protected route without authentication check',
          suggestion: 'Implement authentication checks before navigation',
          autoFixAvailable: false
        };
      }
    }
    
    // Check for API calls without authentication
    const protectedAPIs = element.apiCalls.filter((api: any) => 
      api.endpoint.includes('/api/user') ||
      api.endpoint.includes('/api/admin') ||
      api.endpoint.includes('/api/protected')
    );
    
    if (protectedAPIs.length > 0) {
      const hasAuthHeader = protectedAPIs.some(api => 
        api.requestBody?.headers?.Authorization ||
        api.requestBody?.headers?.['X-Auth-Token']
      );
      
      if (!hasAuthHeader) {
        return {
          passed: false,
          message: 'High: Protected API calls without authentication headers',
          suggestion: 'Add authentication headers to protected API requests',
          autoFixAvailable: false
        };
      }
    }
    
    return {
      passed: true,
      message: 'Authentication checks appear adequate'
    };
  }
  
  private async checkInsecureTransport(element: UIElement): Promise<AuditRuleResult> {
    // Check for HTTP URLs in production
    const hasHTTPUrls = element.apiCalls.some(api => 
      api.endpoint.startsWith('http://') && !api.endpoint.includes('localhost')
    );
    
    if (hasHTTPUrls && process.env.NODE_ENV === 'production') {
      return {
        passed: false,
        message: 'High: HTTP URLs detected in production - data transmitted insecurely',
        suggestion: 'Use HTTPS for all external communications',
        autoFixAvailable: true
      };
    }
    
    // Check for mixed content
    const hasMixedContent = element.props.src?.startsWith('http://') ||
                           element.props.href?.startsWith('http://');
    
    if (hasMixedContent) {
      return {
        passed: false,
        message: 'Medium: Mixed content detected - HTTP resources on HTTPS page',
        suggestion: 'Use HTTPS URLs for all resources',
        autoFixAvailable: true
      };
    }
    
    return {
      passed: true,
      message: 'Transport security is adequate'
    };
  }
  
  private async checkVulnerableDependencies(element: UIElement): Promise<AuditRuleResult> {
    const vulnerableDeps = element.dependencies.filter(dep => 
      this.knownVulnerablePackages.has(dep)
    );
    
    if (vulnerableDeps.length > 0) {
      return {
        passed: false,
        message: `High: ${vulnerableDeps.length} vulnerable dependencies detected: ${vulnerableDeps.join(', ')}`,
        suggestion: 'Update vulnerable dependencies to secure versions',
        autoFixAvailable: true
      };
    }
    
    return {
      passed: true,
      message: 'No known vulnerable dependencies detected'
    };
  }
  
  private async checkFileUploadSecurity(element: UIElement): Promise<AuditRuleResult> {
    // Check file upload restrictions
    const hasFileTypeRestriction = element.props.accept;
    const hasSizeLimit = element.props.maxSize || element.handlers.some((h: any) => 
      h.handlerName.includes('size') || h.handlerName.includes('limit')
    );
    
    if (!hasFileTypeRestriction) {
      return {
        passed: false,
        message: 'High: File upload without type restrictions',
        suggestion: 'Implement file type validation using accept attribute',
        autoFixAvailable: true
      };
    }
    
    if (!hasSizeLimit) {
      return {
        passed: false,
        message: 'Medium: File upload without size limits',
        suggestion: 'Implement file size validation to prevent DoS attacks',
        autoFixAvailable: false
      };
    }
    
    // Check for executable file types
    const allowsExecutables = element.props.accept?.includes('.exe') ||
                             element.props.accept?.includes('.bat') ||
                             element.props.accept?.includes('.sh');
    
    if (allowsExecutables) {
      return {
        passed: false,
        message: 'Critical: File upload allows executable files',
        suggestion: 'Restrict file uploads to safe file types only',
        autoFixAvailable: true
      };
    }
    
    return {
      passed: true,
      message: 'File upload security is adequate'
    };
  }
  
  private analyzeSecurityContext(element: UIElement): SecurityContext {
    return {
      hasAuthentication: element.handlers.some((h: any) => h.dependencies.includes('auth')),
      handlesUserInput: ['input', 'textarea', 'form'].includes(element.type),
      makesAPIRequests: element.apiCalls.length > 0,
      storesData: element.handlers.some((h: any) => 
        h.handlerName.includes('localStorage') || h.handlerName.includes('sessionStorage')
      ),
      hasFileUpload: element.type === 'input' && element.props.type === 'file',
      usesThirdPartyLibraries: element.dependencies.length > 0
    };
  }
  
  private calculateRiskScore(findings: AuditRuleResult[], context: SecurityContext): number {
    let score = 100;
    
    findings.forEach(finding => {
      if (!finding.passed) {
        if (finding.message.includes('Critical')) score -= 30;
        else if (finding.message.includes('High')) score -= 20;
        else if (finding.message.includes('Medium')) score -= 10;
        else score -= 5;
      }
    });
    
    // Adjust based on context
    if (context.hasAuthentication) score -= 5; // Higher risk for auth components
    if (context.handlesUserInput) score -= 5;  // Higher risk for input handling
    if (context.makesAPIRequests) score -= 3;  // Higher risk for API interactions
    
    return Math.max(0, score);
  }
  
  private extractVulnerabilities(findings: AuditRuleResult[]): SecurityVulnerability[] {
    return findings
      .filter(f => !f.passed)
      .map(finding => ({
        type: this.categorizeVulnerability(finding.message),
        severity: this.extractSeverity(finding.message),
        cwe: this.getCWEId(finding.message),
        description: finding.message,
        impact: this.assessImpact(finding.message),
        remediation: finding.suggestion || 'No specific remediation provided',
        references: this.getSecurityReferences(finding.message)
      }));
  }
  
  private categorizeVulnerability(message: string): SecurityVulnerability['type'] {
    if (message.includes('XSS') || message.includes('innerHTML')) return 'xss';
    if (message.includes('CSRF')) return 'csrf';
    if (message.includes('injection')) return 'injection';
    if (message.includes('data') || message.includes('exposure')) return 'data-exposure';
    if (message.includes('auth')) return 'auth-bypass';
    if (message.includes('HTTP') || message.includes('transport')) return 'insecure-transport';
    return 'data-exposure';
  }
  
  private extractSeverity(message: string): SecurityVulnerability['severity'] {
    if (message.includes('Critical')) return 'critical';
    if (message.includes('High')) return 'high';
    if (message.includes('Medium')) return 'medium';
    return 'low';
  }
  
  private getCWEId(message: string): string {
    // Map common vulnerabilities to CWE IDs
    if (message.includes('XSS')) return 'CWE-79';
    if (message.includes('CSRF')) return 'CWE-352';
    if (message.includes('injection')) return 'CWE-89';
    if (message.includes('auth')) return 'CWE-287';
    if (message.includes('transport')) return 'CWE-319';
    return 'CWE-200'; // Information Exposure
  }
  
  private assessImpact(message: string): string {
    if (message.includes('Critical')) return 'Complete system compromise possible';
    if (message.includes('High')) return 'Significant security risk';
    if (message.includes('Medium')) return 'Moderate security risk';
    return 'Low security risk';
  }
  
  private getSecurityReferences(message: string): string[] {
    const references = ['https://owasp.org/'];
    
    if (message.includes('XSS')) {
      references.push('https://owasp.org/www-community/attacks/xss/');
    }
    if (message.includes('CSRF')) {
      references.push('https://owasp.org/www-community/attacks/csrf');
    }
    if (message.includes('injection')) {
      references.push('https://owasp.org/www-community/Injection_Flaws');
    }
    
    return references;
  }
  
  private generateSecurityRecommendations(
    element: UIElement, 
    findings: AuditRuleResult[]
  ): string[] {
    const recommendations: string[] = [];
    
    const criticalFindings = findings.filter(f => !f.passed && f.message.includes('Critical'));
    const highFindings = findings.filter(f => !f.passed && f.message.includes('High'));
    
    if (criticalFindings.length > 0) {
      recommendations.push('Address critical security vulnerabilities immediately');
      recommendations.push('Conduct security code review');
      recommendations.push('Implement security testing in CI/CD pipeline');
    }
    
    if (highFindings.length > 0) {
      recommendations.push('Implement input validation and sanitization');
      recommendations.push('Add authentication and authorization checks');
      recommendations.push('Use HTTPS for all communications');
    }
    
    recommendations.push('Regular security audits and dependency updates');
    recommendations.push('Implement Content Security Policy (CSP)');
    
    return recommendations;
  }
}