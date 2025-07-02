
/**
 * TripleCheck Quality Gates
 * 
 * Implements automated quality checks based on the analysis framework
 */

import fs from 'fs';
import { CodeAnalyzer } from './code-analysis.js';

interface QualityGate {
  name: string;
  threshold: number;
  dimension?: string;
  critical: boolean;
}

class QualityGateChecker {
  private gates: QualityGate[] = [
    {
      name: 'Overall Code Quality',
      threshold: 75,
      critical: true
    },
    {
      name: 'Security Score',
      threshold: 80,
      dimension: 'Security',
      critical: true
    },
    {
      name: 'Maintainability Score',
      threshold: 70,
      dimension: 'Maintainability',
      critical: false
    },
    {
      name: 'Performance Score',
      threshold: 75,
      dimension: 'Performance',
      critical: false
    },
    {
      name: 'Architecture Score',
      threshold: 70,
      dimension: 'Architecture',
      critical: false
    }
  ];

  async checkQualityGates(): Promise<boolean> {
    console.log('🚦 Running Quality Gates...\n');

    // Read the latest analysis report
    const reportPath = 'code-analysis-report.json';
    
    if (!fs.existsSync(reportPath)) {
      console.log('No analysis report found. Running analysis first...');
      const analyzer = new CodeAnalyzer();
      await analyzer.analyzeCodebase();
    }

    const analyses = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    
    // Calculate metrics
    const totalFiles = analyses.length;
    const avgOverallScore = analyses.reduce((sum: number, a: any) => sum + a.overallScore, 0) / totalFiles;
    
    const dimensionScores: Record<string, number> = {};
    analyses.forEach((analysis: any) => {
      analysis.results.forEach((result: any) => {
        if (!dimensionScores[result.dimension]) {
          dimensionScores[result.dimension] = 0;
        }
        dimensionScores[result.dimension] += result.score;
      });
    });

    // Average dimension scores
    Object.keys(dimensionScores).forEach(dimension => {
      dimensionScores[dimension] = dimensionScores[dimension] / totalFiles;
    });

    // Check each gate
    let allPassed = true;
    let criticalFailed = false;

    for (const gate of this.gates) {
      const score = gate.dimension ? dimensionScores[gate.dimension] : avgOverallScore;
      const passed = score >= gate.threshold;
      
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const criticalFlag = gate.critical ? ' (CRITICAL)' : '';
      
      console.log(`${status} ${gate.name}: ${score.toFixed(1)}/${gate.threshold}${criticalFlag}`);
      
      if (!passed) {
        allPassed = false;
        if (gate.critical) {
          criticalFailed = true;
        }
      }
    }

    console.log('\n' + '='.repeat(40));
    
    if (criticalFailed) {
      console.log('🚨 CRITICAL QUALITY GATES FAILED');
      console.log('Build should be blocked until issues are resolved.');
      return false;
    } else if (!allPassed) {
      console.log('⚠️  Some quality gates failed, but no critical issues detected.');
      console.log('Consider addressing these issues in the next iteration.');
      return true;
    } else {
      console.log('🎉 All quality gates passed!');
      return true;
    }
  }
}

// Export for use as module
export { QualityGateChecker };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new QualityGateChecker();
  checker.checkQualityGates()
    .then(passed => {
      process.exit(passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Quality gate check failed:', error);
      process.exit(1);
    });
}
