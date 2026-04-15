#!/usr/bin/env tsx

/**
 * Bug Categorization and Prioritization System
 * Analyzes ESLint, Snyk security scan, and npm audit results into a unified, prioritized report.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BugType = 'security' | 'accessibility' | 'performance' | 'code-quality' | 'dependency';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Effort = 'low' | 'medium' | 'high';

export interface BugReport {
  id: string;
  type: BugType;
  severity: Severity;
  title: string;
  description: string;
  file?: string;
  line?: number;
  column?: number;
  rule?: string;
  fixable: boolean;
  impact: string;
  effort: Effort;
  /** Weighted priority score. Higher = more urgent. */
  priority: number;
}

export interface BugCategorizationReport {
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    byType: Record<BugType, number>;
  };
  bugs: BugReport[];
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Internal npm audit types (avoid `as any`)
// ---------------------------------------------------------------------------

interface AuditVulnerability {
  severity: string;
  range: string;
  fixAvailable: boolean | { name: string; version: string };
  via: Array<{ title?: string; cwe?: string[] } | string>;
}

interface AuditResults {
  vulnerabilities?: Record<string, AuditVulnerability>;
}

// ---------------------------------------------------------------------------
// Priority weight constants
// ---------------------------------------------------------------------------

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 10,
  high: 7,
  medium: 4,
  low: 1,
};

const TYPE_WEIGHT: Record<BugType, number> = {
  security: 10,
  dependency: 8,
  accessibility: 6,
  performance: 5,
  'code-quality': 3,
};

const EFFORT_WEIGHT: Record<Effort, number> = {
  low: 3,
  medium: 2,
  high: 1,
};

// Weight fractions must sum to 1.0
const W_SEVERITY = 0.4;
const W_TYPE     = 0.3;
const W_EFFORT   = 0.2;
const W_FIXABLE  = 0.1;

// ---------------------------------------------------------------------------
// ESLint rule helpers
// ---------------------------------------------------------------------------

const LOW_EFFORT_RULES  = ['prefer-const', 'no-var', 'prefer-template', 'no-console'];
const HIGH_EFFORT_RULES = ['sonarjs/cognitive-complexity', 'jsx-a11y/click-events-have-key-events'];

function categorizeESLintRule(ruleId: string | null): BugType {
  if (!ruleId) return 'code-quality';
  if (ruleId.startsWith('security/') || ruleId.includes('security')) return 'security';
  if (ruleId.startsWith('jsx-a11y/')  || ruleId.includes('a11y'))     return 'accessibility';
  if (ruleId.includes('performance')  || ruleId.includes('optimize'))  return 'performance';
  return 'code-quality';
}

function eslintEffort(ruleId: string | null): Effort {
  if (!ruleId) return 'medium';
  if (LOW_EFFORT_RULES.some(r  => ruleId.includes(r))) return 'low';
  if (HIGH_EFFORT_RULES.some(r => ruleId.includes(r))) return 'high';
  return 'medium';
}

function eslintImpact(ruleId: string | null): string {
  if (!ruleId)                         return 'Code quality impact';
  if (ruleId.startsWith('security/'))  return 'Potential security vulnerability';
  if (ruleId.startsWith('jsx-a11y/'))  return 'Accessibility barrier for users';
  if (ruleId.includes('performance'))  return 'Performance degradation';
  return 'Code maintainability impact';
}

// ---------------------------------------------------------------------------
// Severity / impact helpers
// ---------------------------------------------------------------------------

const SECURITY_IMPACT: Record<string, string> = {
  critical: 'Critical security vulnerability — immediate exploitation possible',
  high:     'High security risk — exploitation likely',
  medium:   'Medium security risk — exploitation possible under certain conditions',
  low:      'Low security risk — limited exploitation potential',
};

const DEPENDENCY_IMPACT: Record<string, string> = {
  critical: 'Critical dependency vulnerability — update immediately',
  high:     'High-risk dependency — update as soon as possible',
  moderate: 'Moderate dependency risk — plan update',
  low:      'Low-risk dependency — update when convenient',
};

const SNYK_SEVERITY_MAP: Record<string, Severity> = {
  critical: 'critical', high: 'high', medium: 'medium', low: 'low',
};

const AUDIT_SEVERITY_MAP: Record<string, Severity> = {
  critical: 'critical', high: 'high', moderate: 'medium', low: 'low',
};

// ---------------------------------------------------------------------------
// BugCategorizer
// ---------------------------------------------------------------------------

class BugCategorizer {
  private bugs: BugReport[] = [];
  private idCounter = 1;

  /** Run all analyses and return the consolidated report. */
  analyze(): BugCategorizationReport {
    console.log('🔍 Running comprehensive bug analysis...');

    this.analyzeESLint();
    this.analyzeSecurity();
    this.analyzeDependencies();
    this.applyPriorities();

    return this.buildReport();
  }

  // -------------------------------------------------------------------------

  private runJSON(cmd: string): unknown | null {
    try {
      const raw = execSync(cmd, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        maxBuffer: 10 * 1024 * 1024,
      });
      return JSON.parse(raw);
    } catch (err) {
      // execSync throws on non-zero exit (normal for lint/audit tools);
      // try to parse stdout from the error object before giving up.
      const execErr = err as NodeJS.ErrnoException & { stdout?: string };
      if (execErr.stdout) {
        try { return JSON.parse(execErr.stdout); } catch { /* fall through */ }
      }
      console.warn(`⚠️  Could not run: ${cmd}\n   ${(err as Error).message}`);
      return null;
    }
  }

  private nextId(prefix: string): string {
    return `${prefix}-${this.idCounter++}`;
  }

  // -------------------------------------------------------------------------

  private analyzeESLint(): void {
    console.log('📋 Analyzing ESLint results...');

    const results = this.runJSON('npx eslint . --format json') as Array<{
      filePath: string;
      messages: Array<{
        ruleId: string | null;
        severity: number;
        message: string;
        line?: number;
        column?: number;
        fix?: unknown;
      }>;
    }> | null;

    if (!results) return;

    for (const file of results) {
      for (const msg of file.messages) {
        this.bugs.push({
          id:          this.nextId('eslint'),
          type:        categorizeESLintRule(msg.ruleId),
          severity:    msg.severity === 2 ? 'high' : 'medium',
          title:       `${msg.ruleId ?? 'unknown'}: ${msg.message}`,
          description: msg.message,
          file:        file.filePath,
          line:        msg.line,
          column:      msg.column,
          rule:        msg.ruleId ?? undefined,
          fixable:     msg.fix !== undefined,
          impact:      eslintImpact(msg.ruleId),
          effort:      eslintEffort(msg.ruleId),
          priority:    0,
        });
      }
    }
  }

  // -------------------------------------------------------------------------

  private analyzeSecurity(): void {
    console.log('🔒 Analyzing Snyk security scan results...');

    const result = this.runJSON('npx snyk test --json') as {
      vulnerabilities?: Array<{
        title: string;
        description: string;
        severity: string;
        id: string;
        identifiers?: { CVE?: string[] };
        from?: string[];
        isUpgradable?: boolean;
        isPatchable?: boolean;
      }>;
    } | null;

    if (!result?.vulnerabilities) return;

    for (const v of result.vulnerabilities) {
      const cve = v.identifiers?.CVE?.[0] ?? 'N/A';
      this.bugs.push({
        id:          this.nextId('security'),
        type:        'security',
        severity:    SNYK_SEVERITY_MAP[v.severity] ?? 'medium',
        title:       v.title,
        description: `${v.description}\nCVE: ${cve}`,
        file:        v.from?.[0],
        rule:        v.id,
        fixable:     Boolean(v.isUpgradable || v.isPatchable),
        impact:      SECURITY_IMPACT[v.severity] ?? 'Security vulnerability',
        effort:      v.isUpgradable ? 'low' : v.isPatchable ? 'medium' : 'high',
        priority:    0,
      });
    }
  }

  // -------------------------------------------------------------------------

  private analyzeDependencies(): void {
    console.log('📦 Analyzing npm audit results...');

    const result = this.runJSON('npm audit --json') as AuditResults | null;
    if (!result?.vulnerabilities) return;

    for (const [name, v] of Object.entries(result.vulnerabilities)) {
      const viaEntry = typeof v.via[0] === 'object' ? v.via[0] : undefined;
      this.bugs.push({
        id:          this.nextId('dependency'),
        type:        'dependency',
        severity:    AUDIT_SEVERITY_MAP[v.severity] ?? 'medium',
        title:       `Dependency vulnerability in ${name}`,
        description: `${viaEntry?.title ?? 'Dependency vulnerability'}\nRange: ${v.range}`,
        file:        name,
        rule:        viaEntry?.cwe?.[0],
        fixable:     v.fixAvailable !== false,
        impact:      DEPENDENCY_IMPACT[v.severity] ?? 'Dependency vulnerability',
        effort:      v.fixAvailable === true ? 'low' : 'medium',
        priority:    0,
      });
    }
  }

  // -------------------------------------------------------------------------

  private applyPriorities(): void {
    for (const bug of this.bugs) {
      const score =
        SEVERITY_WEIGHT[bug.severity]  * W_SEVERITY +
        TYPE_WEIGHT[bug.type]          * W_TYPE     +
        EFFORT_WEIGHT[bug.effort]      * W_EFFORT   +
        (bug.fixable ? 10 : 0)         * W_FIXABLE;

      bug.priority = Math.round(score * 10) / 10;
    }

    this.bugs.sort((a, b) => b.priority - a.priority);
  }

  // -------------------------------------------------------------------------

  private buildReport(): BugCategorizationReport {
    const count = (pred: (b: BugReport) => boolean) => this.bugs.filter(pred).length;

    const summary = {
      total:    this.bugs.length,
      critical: count(b => b.severity === 'critical'),
      high:     count(b => b.severity === 'high'),
      medium:   count(b => b.severity === 'medium'),
      low:      count(b => b.severity === 'low'),
      byType: {
        security:       count(b => b.type === 'security'),
        accessibility:  count(b => b.type === 'accessibility'),
        performance:    count(b => b.type === 'performance'),
        'code-quality': count(b => b.type === 'code-quality'),
        dependency:     count(b => b.type === 'dependency'),
      },
    };

    return { summary, bugs: this.bugs, recommendations: this.buildRecommendations(summary) };
  }

  private buildRecommendations(summary: BugCategorizationReport['summary']): string[] {
    const recs: string[] = [];
    const { critical, byType, total } = summary;
    const fixable = this.bugs.filter(b => b.fixable).length;

    if (critical > 0)               recs.push(`🚨 URGENT: Address ${critical} critical issue(s) immediately`);
    if (byType.security > 0)        recs.push(`🔒 Security: Fix ${byType.security} security vulnerability/vulnerabilities`);
    if (byType.dependency > 0)      recs.push(`📦 Dependencies: Update ${byType.dependency} vulnerable package(s)`);
    if (byType.accessibility > 0)   recs.push(`♿ Accessibility: Resolve ${byType.accessibility} accessibility issue(s)`);
    if (byType.performance > 0)     recs.push(`⚡ Performance: Optimize ${byType.performance} performance issue(s)`);
    if (total > 50)                 recs.push('📈 Consider automated fixing for high-volume, low-effort issues');
    if (fixable > 0)                recs.push(`🔧 ${fixable} issue(s) are auto-fixable`);

    return recs;
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const categorizer = new BugCategorizer();

  try {
    const report = categorizer.analyze();

    const reportPath = path.join(process.cwd(), 'reports', 'bug-analysis.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    const { summary } = report;
    console.log('\n📊 Bug Analysis Summary:');
    console.log(`  Total   : ${summary.total}`);
    console.log(`  Critical: ${summary.critical}`);
    console.log(`  High    : ${summary.high}`);
    console.log(`  Medium  : ${summary.medium}`);
    console.log(`  Low     : ${summary.low}`);

    console.log('\n📋 By Type:');
    for (const [type, count] of Object.entries(summary.byType)) {
      if (count > 0) console.log(`  ${type}: ${count}`);
    }

    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(r => console.log(`  ${r}`));

    console.log(`\n📄 Full report saved to: ${reportPath}`);

    console.log('\n🔥 Top 10 Priority Bugs:');
    report.bugs.slice(0, 10).forEach((bug, i) => {
      console.log(`${i + 1}. [${bug.severity.toUpperCase()}] ${bug.title}`);
      console.log(`   Priority: ${bug.priority} | Type: ${bug.type} | Fixable: ${bug.fixable ? 'Yes' : 'No'}`);
      if (bug.file) console.log(`   File: ${bug.file}${bug.line ? `:${bug.line}` : ''}`);
      console.log('');
    });

  } catch (err) {
    console.error('❌ Error during bug analysis:', err);
    process.exit(1);
  }
}

// Guard so importing the module doesn't auto-execute main()
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { BugCategorizer };