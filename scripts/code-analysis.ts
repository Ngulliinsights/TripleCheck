
import fs from 'fs';
import path from 'path';

/**
 * TripleCheck Code Analysis Framework
 * Implements comprehensive code quality analysis based on the provided frameworks
 */

interface AnalysisResult {
  dimension: string;
  score: number;
  issues: string[];
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface FileAnalysis {
  filePath: string;
  results: AnalysisResult[];
  overallScore: number;
}

class CodeAnalyzer {
  private sourceDir: string;
  private excludePatterns: string[] = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'uploads',
    'attached_assets'
  ];

  constructor(sourceDir: string = '.') {
    this.sourceDir = sourceDir;
  }

  /**
   * Strategic prompting for AI-assisted analysis
   */
  private generateAnalysisPrompt(code: string, filePath: string, dimension: string): string {
    const prompts = {
      functional: `
        Analyze this ${path.extname(filePath)} code for functional correctness, but structure your response to address multiple layers:
        
        Code Context: ${filePath}
        
        Examine:
        1. Logic errors and boundary conditions with specific examples
        2. Input validation gaps and their potential impact
        3. Control flow analysis considering edge cases
        4. Exception handling effectiveness
        5. How failures might cascade through the system
        
        For each issue, explain your reasoning and flag assumptions. Rate confidence level (high/medium/low).
        
        Code:
        ${code}
      `,
      
      security: `
        Conduct a security analysis across multiple threat categories for this ${path.extname(filePath)} file:
        
        File: ${filePath}
        
        Analyze:
        1. Input validation and injection attack vectors with specific examples
        2. Authentication and authorization mechanisms and their potential bypasses
        3. Data exposure risks and protection mechanisms
        4. Compliance with relevant security standards
        
        For each vulnerability identified, explain the attack scenario, impact assessment, and specific remediation steps.
        Flag areas where you're making assumptions about the broader system security context.
        
        Code:
        ${code}
      `,
      
      performance: `
        Evaluate performance and scalability considering multiple contexts for this ${path.extname(filePath)} file:
        
        File: ${filePath}
        
        Analyze for current small-scale usage, medium-scale scenarios, and large-scale production loads:
        1. Algorithmic complexity with specific Big O analysis
        2. Memory usage patterns and potential bottlenecks
        3. Resource utilization across CPU, memory, and I/O
        4. Caching opportunities and their architectural implications
        
        If you're uncertain about scaling behavior, explain your assumptions and suggest measurement strategies.
        
        Code:
        ${code}
      `,
      
      architecture: `
        Assess architectural quality across multiple design dimensions for this ${path.extname(filePath)} file:
        
        File: ${filePath}
        
        Evaluate:
        1. SOLID principles compliance with specific examples of violations
        2. Design pattern implementation and appropriateness for the use case
        3. Separation of concerns and modularity assessment
        4. Coupling and cohesion analysis
        5. Architectural consistency across the codebase
        
        For each assessment, provide specific refactoring recommendations and explain trade-offs.
        Consider the impact on existing system components.
        
        Code:
        ${code}
      `,
      
      maintainability: `
        Analyze maintainability characteristics considering both current readability and long-term evolution needs:
        
        File: ${filePath}
        
        Examine:
        1. Code organization and structure clarity
        2. Naming conventions and their consistency
        3. Documentation quality and completeness
        4. Readability and self-documentation effectiveness
        5. Refactoring opportunities and their priority
        
        Consider how changes to this code might affect other system components.
        
        Code:
        ${code}
      `,
      
      testing: `
        Assess testability and suggest comprehensive testing strategies for this ${path.extname(filePath)} file:
        
        File: ${filePath}
        
        Consider multiple testing levels:
        1. Unit testing opportunities and challenges
        2. Integration testing requirements
        3. End-to-end testing scenarios
        4. Test data management needs
        
        Analyze current testability characteristics, dependency injection opportunities, and test coverage gaps.
        Provide specific test case examples for critical functionality.
        
        Code:
        ${code}
      `
    };

    return prompts[dimension as keyof typeof prompts] || prompts.functional;
  }

  /**
   * Analyze functional correctness and logic
   */
  private analyzeFunctionalCorrectness(code: string, filePath: string): AnalysisResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check for common logical issues
    if (code.includes('==') && !code.includes('===')) {
      issues.push('Uses loose equality (==) instead of strict equality (===)');
      recommendations.push('Replace == with === for type-safe comparisons');
      score -= 10;
    }

    if (code.match(/if\s*\([^)]*\)\s*{[^}]*}/g)?.some(block => !block.includes('else'))) {
      const uncommentedIfs = code.match(/(?<!\/\/).*if\s*\(/g);
      if (uncommentedIfs && uncommentedIfs.length > 3) {
        issues.push('Multiple if statements without else clauses may indicate missing error handling');
        recommendations.push('Consider adding else clauses or default error handling');
        score -= 5;
      }
    }

    // Check for potential null/undefined issues
    if (code.includes('.') && !code.includes('?.')) {
      const propertyAccess = code.match(/\w+\.\w+/g);
      if (propertyAccess && propertyAccess.length > 2) {
        issues.push('Property access without null checking detected');
        recommendations.push('Use optional chaining (?.) for safer property access');
        score -= 15;
      }
    }

    // Check for async/await patterns
    if (code.includes('async') && !code.includes('try')) {
      issues.push('Async functions without error handling');
      recommendations.push('Wrap async operations in try-catch blocks');
      score -= 20;
    }

    return {
      dimension: 'Functional Correctness',
      score: Math.max(score, 0),
      issues,
      recommendations,
      confidence: issues.length > 0 ? 'high' : 'medium'
    };
  }

  /**
   * Analyze security vulnerabilities
   */
  private analyzeSecurityVulnerabilities(code: string, filePath: string): AnalysisResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check for SQL injection vulnerabilities
    if (code.includes('SELECT') && code.includes('+')) {
      issues.push('Potential SQL injection through string concatenation');
      recommendations.push('Use parameterized queries or prepared statements');
      score -= 30;
    }

    // Check for XSS vulnerabilities
    if (code.includes('innerHTML') || code.includes('dangerouslySetInnerHTML')) {
      issues.push('Potential XSS vulnerability through innerHTML usage');
      recommendations.push('Use textContent or properly sanitize HTML content');
      score -= 25;
    }

    // Check for hardcoded secrets
    const secretPatterns = [
      /password\s*[=:]\s*['"][^'"]+['"]/i,
      /api[_-]?key\s*[=:]\s*['"][^'"]+['"]/i,
      /secret\s*[=:]\s*['"][^'"]+['"]/i,
      /token\s*[=:]\s*['"][^'"]+['"]/i
    ];

    secretPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        issues.push('Hardcoded credentials detected');
        recommendations.push('Move sensitive data to environment variables');
        score -= 40;
      }
    });

    // Check for insecure HTTP usage
    if (code.includes('http://') && !code.includes('localhost')) {
      issues.push('Insecure HTTP protocol usage');
      recommendations.push('Use HTTPS for external communications');
      score -= 20;
    }

    // Check for missing input validation
    if (filePath.includes('routes') || filePath.includes('api')) {
      if (!code.includes('validate') && !code.includes('sanitize')) {
        issues.push('API endpoint may lack input validation');
        recommendations.push('Implement input validation and sanitization');
        score -= 25;
      }
    }

    return {
      dimension: 'Security',
      score: Math.max(score, 0),
      issues,
      recommendations,
      confidence: 'high'
    };
  }

  /**
   * Analyze performance and efficiency
   */
  private analyzePerformance(code: string, filePath: string): AnalysisResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check for potential memory leaks
    if (code.includes('setInterval') && !code.includes('clearInterval')) {
      issues.push('setInterval without clearInterval may cause memory leaks');
      recommendations.push('Ensure intervals are cleared when components unmount');
      score -= 20;
    }

    // Check for inefficient loops
    const nestedLoops = code.match(/for\s*\([^}]*{[^}]*for\s*\(/g);
    if (nestedLoops && nestedLoops.length > 0) {
      issues.push('Nested loops detected - potential O(n²) complexity');
      recommendations.push('Consider optimizing with maps, sets, or single-pass algorithms');
      score -= 15;
    }

    // Check for database queries in loops
    if (code.includes('await') && code.includes('for')) {
      issues.push('Potential N+1 query problem with await in loops');
      recommendations.push('Consider batching database operations or using Promise.all()');
      score -= 25;
    }

    // Check for large array operations
    if (code.includes('.map(') && code.includes('.filter(')) {
      issues.push('Chained array operations may be inefficient for large datasets');
      recommendations.push('Consider combining operations or using lazy evaluation');
      score -= 10;
    }

    // Check for missing pagination
    if (filePath.includes('api') && code.includes('findMany') && !code.includes('limit')) {
      issues.push('Database query without pagination limits');
      recommendations.push('Implement pagination to prevent large data transfers');
      score -= 20;
    }

    return {
      dimension: 'Performance',
      score: Math.max(score, 0),
      issues,
      recommendations,
      confidence: 'medium'
    };
  }

  /**
   * Analyze code architecture and design
   */
  private analyzeArchitecture(code: string, filePath: string): AnalysisResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check Single Responsibility Principle
    const functionCount = (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
    const classCount = (code.match(/class\s+\w+/g) || []).length;
    
    if (functionCount > 10 && classCount === 0) {
      issues.push('File contains many functions - consider breaking into modules');
      recommendations.push('Split large files into focused modules following SRP');
      score -= 15;
    }

    // Check for tight coupling
    const importCount = (code.match(/import.*from/g) || []).length;
    if (importCount > 15) {
      issues.push('High number of imports suggests tight coupling');
      recommendations.push('Consider dependency injection or facade patterns');
      score -= 10;
    }

    // Check for missing interfaces (TypeScript)
    if (filePath.includes('.ts') && !filePath.includes('.d.ts')) {
      const interfaceCount = (code.match(/interface\s+\w+/g) || []).length;
      const typeCount = (code.match(/type\s+\w+/g) || []).length;
      
      if (functionCount > 5 && interfaceCount + typeCount === 0) {
        issues.push('Missing type definitions for complex module');
        recommendations.push('Define interfaces for better type safety and documentation');
        score -= 20;
      }
    }

    // Check for magic numbers
    const magicNumbers = code.match(/[^a-zA-Z_]\d{2,}/g);
    if (magicNumbers && magicNumbers.length > 3) {
      issues.push('Magic numbers detected');
      recommendations.push('Extract numbers to named constants');
      score -= 10;
    }

    return {
      dimension: 'Architecture',
      score: Math.max(score, 0),
      issues,
      recommendations,
      confidence: 'medium'
    };
  }

  /**
   * Analyze code maintainability
   */
  private analyzeMaintainability(code: string, filePath: string): AnalysisResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check code complexity (rough cyclomatic complexity)
    const complexityIndicators = [
      /if\s*\(/g,
      /else\s*if/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g
    ];

    let complexity = 1;
    complexityIndicators.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) complexity += matches.length;
    });

    if (complexity > 15) {
      issues.push(`High cyclomatic complexity (${complexity})`);
      recommendations.push('Break down complex functions into smaller, focused functions');
      score -= 25;
    }

    // Check for proper commenting
    const commentLines = (code.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || []).length;
    const codeLines = code.split('\n').filter(line => line.trim().length > 0).length;
    const commentRatio = commentLines / codeLines;

    if (commentRatio < 0.1 && codeLines > 50) {
      issues.push('Low comment density for complex file');
      recommendations.push('Add comments explaining complex logic and business rules');
      score -= 15;
    }

    // Check naming conventions
    const poorNames = code.match(/\b[a-z]{1,2}\b|\btemp\b|\bdata\b|\binfo\b/g);
    if (poorNames && poorNames.length > 3) {
      issues.push('Poor variable naming detected');
      recommendations.push('Use descriptive, meaningful variable names');
      score -= 10;
    }

    // Check function length
    const functions = code.match(/function[^{]*{([^{}]*{[^{}]*})*[^{}]*}/g) || [];
    const longFunctions = functions.filter(fn => fn.split('\n').length > 30);
    
    if (longFunctions.length > 0) {
      issues.push(`${longFunctions.length} functions exceed 30 lines`);
      recommendations.push('Break long functions into smaller, focused functions');
      score -= 20;
    }

    return {
      dimension: 'Maintainability',
      score: Math.max(score, 0),
      issues,
      recommendations,
      confidence: 'high'
    };
  }

  /**
   * Analyze testing capabilities
   */
  private analyzeTestability(code: string, filePath: string): AnalysisResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check for test files
    const isTestFile = filePath.includes('.test.') || filePath.includes('.spec.');
    
    if (!isTestFile) {
      // Check if corresponding test file exists
      const testPath1 = filePath.replace(/\.(ts|js)$/, '.test.$1');
      const testPath2 = filePath.replace(/\.(ts|js)$/, '.spec.$1');
      
      if (!fs.existsSync(testPath1) && !fs.existsSync(testPath2)) {
        issues.push('No corresponding test file found');
        recommendations.push('Create unit tests for this module');
        score -= 30;
      }

      // Check for hard dependencies
      if (code.includes('new Date()') || code.includes('Math.random()')) {
        issues.push('Hard dependencies on Date/Random make testing difficult');
        recommendations.push('Inject time/random dependencies for better testability');
        score -= 15;
      }

      // Check for large functions (harder to test)
      const exportedFunctions = code.match(/export\s+(function|const)\s+\w+/g) || [];
      if (exportedFunctions.length === 0 && !filePath.includes('index')) {
        issues.push('No exported functions found - difficult to test');
        recommendations.push('Export functions for individual testing');
        score -= 20;
      }
    }

    return {
      dimension: 'Testability',
      score: Math.max(score, 0),
      issues,
      recommendations,
      confidence: 'medium'
    };
  }

  /**
   * Recursively find all source files
   */
  private findSourceFiles(dir: string): string[] {
    const files: string[] = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!this.excludePatterns.some(pattern => entry.name.includes(pattern))) {
            files.push(...this.findSourceFiles(fullPath));
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${dir}:`, error);
    }
    
    return files;
  }

  /**
   * Analyze a single file
   */
  private analyzeFile(filePath: string): FileAnalysis {
    try {
      const code = fs.readFileSync(filePath, 'utf-8');
      const results: AnalysisResult[] = [];

      // Run all analysis dimensions
      results.push(this.analyzeFunctionalCorrectness(code, filePath));
      results.push(this.analyzeSecurityVulnerabilities(code, filePath));
      results.push(this.analyzePerformance(code, filePath));
      results.push(this.analyzeArchitecture(code, filePath));
      results.push(this.analyzeMaintainability(code, filePath));
      results.push(this.analyzeTestability(code, filePath));

      // Calculate overall score
      const overallScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;

      return {
        filePath,
        results,
        overallScore
      };
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
      return {
        filePath,
        results: [],
        overallScore: 0
      };
    }
  }

  /**
   * Run comprehensive analysis on the codebase
   */
  public async analyzeCodebase(): Promise<void> {
    console.log('🔍 Starting comprehensive code analysis...\n');

    const sourceFiles = this.findSourceFiles(this.sourceDir);
    const analyses: FileAnalysis[] = [];

    for (const file of sourceFiles) {
      console.log(`Analyzing: ${file}`);
      const analysis = this.analyzeFile(file);
      analyses.push(analysis);
    }

    // Generate summary report
    this.generateReport(analyses);
  }

  /**
   * Generate analysis report
   */
  private generateReport(analyses: FileAnalysis[]): void {
    console.log('\n📊 CODE ANALYSIS REPORT\n');
    console.log('='.repeat(50));

    // Overall statistics
    const totalFiles = analyses.length;
    const avgScore = analyses.reduce((sum, a) => sum + a.overallScore, 0) / totalFiles;
    
    console.log(`\n📈 OVERALL STATISTICS`);
    console.log(`Files analyzed: ${totalFiles}`);
    console.log(`Average quality score: ${avgScore.toFixed(1)}/100`);

    // Top issues by dimension
    const issuesByDimension: Record<string, string[]> = {};
    analyses.forEach(analysis => {
      analysis.results.forEach(result => {
        if (!issuesByDimension[result.dimension]) {
          issuesByDimension[result.dimension] = [];
        }
        issuesByDimension[result.dimension].push(...result.issues);
      });
    });

    console.log(`\n🚨 TOP ISSUES BY DIMENSION`);
    Object.entries(issuesByDimension).forEach(([dimension, issues]) => {
      if (issues.length > 0) {
        console.log(`\n${dimension}:`);
        const uniqueIssues = [...new Set(issues)];
        uniqueIssues.slice(0, 3).forEach(issue => {
          const count = issues.filter(i => i === issue).length;
          console.log(`  • ${issue} (${count} files)`);
        });
      }
    });

    // Files needing attention
    const problemFiles = analyses
      .filter(a => a.overallScore < 70)
      .sort((a, b) => a.overallScore - b.overallScore)
      .slice(0, 5);

    if (problemFiles.length > 0) {
      console.log(`\n⚠️  FILES NEEDING ATTENTION`);
      problemFiles.forEach(file => {
        console.log(`\n${file.filePath} (Score: ${file.overallScore.toFixed(1)}/100)`);
        file.results.forEach(result => {
          if (result.issues.length > 0) {
            console.log(`  ${result.dimension}: ${result.score}/100`);
            result.issues.slice(0, 2).forEach(issue => {
              console.log(`    • ${issue}`);
            });
          }
        });
      });
    }

    // High-priority recommendations
    console.log(`\n💡 HIGH-PRIORITY RECOMMENDATIONS`);
    const allRecommendations: string[] = [];
    analyses.forEach(analysis => {
      analysis.results.forEach(result => {
        if (result.score < 80) {
          allRecommendations.push(...result.recommendations);
        }
      });
    });

    const priorityRecs = [...new Set(allRecommendations)]
      .map(rec => ({
        recommendation: rec,
        count: allRecommendations.filter(r => r === rec).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    priorityRecs.forEach(rec => {
      console.log(`  • ${rec.recommendation} (affects ${rec.count} files)`);
    });

    // Save detailed report
    const reportPath = 'code-analysis-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(analyses, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    console.log('\n' + '='.repeat(50));
    console.log('Analysis complete! 🎉');
  }
}

// Export for use as module
export { CodeAnalyzer };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new CodeAnalyzer();
  analyzer.analyzeCodebase().catch(console.error);
}
