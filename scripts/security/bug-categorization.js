#!/usr/bin/env tsx
"use strict";
/**
 * Bug Categorization and Prioritization System
 * Analyzes ESLint, Snyk security scan, and npm audit results into a unified, prioritized report.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BugCategorizer = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var path_1 = require("path");
// ---------------------------------------------------------------------------
// Priority weight constants
// ---------------------------------------------------------------------------
var SEVERITY_WEIGHT = {
    critical: 10,
    high: 7,
    medium: 4,
    low: 1,
};
var TYPE_WEIGHT = {
    security: 10,
    dependency: 8,
    accessibility: 6,
    performance: 5,
    'code-quality': 3,
};
var EFFORT_WEIGHT = {
    low: 3,
    medium: 2,
    high: 1,
};
// Weight fractions must sum to 1.0
var W_SEVERITY = 0.4;
var W_TYPE = 0.3;
var W_EFFORT = 0.2;
var W_FIXABLE = 0.1;
// ---------------------------------------------------------------------------
// ESLint rule helpers
// ---------------------------------------------------------------------------
var LOW_EFFORT_RULES = ['prefer-const', 'no-var', 'prefer-template', 'no-console'];
var HIGH_EFFORT_RULES = ['sonarjs/cognitive-complexity', 'jsx-a11y/click-events-have-key-events'];
function categorizeESLintRule(ruleId) {
    if (!ruleId)
        return 'code-quality';
    if (ruleId.startsWith('security/') || ruleId.includes('security'))
        return 'security';
    if (ruleId.startsWith('jsx-a11y/') || ruleId.includes('a11y'))
        return 'accessibility';
    if (ruleId.includes('performance') || ruleId.includes('optimize'))
        return 'performance';
    return 'code-quality';
}
function eslintEffort(ruleId) {
    if (!ruleId)
        return 'medium';
    if (LOW_EFFORT_RULES.some(function (r) { return ruleId.includes(r); }))
        return 'low';
    if (HIGH_EFFORT_RULES.some(function (r) { return ruleId.includes(r); }))
        return 'high';
    return 'medium';
}
function eslintImpact(ruleId) {
    if (!ruleId)
        return 'Code quality impact';
    if (ruleId.startsWith('security/'))
        return 'Potential security vulnerability';
    if (ruleId.startsWith('jsx-a11y/'))
        return 'Accessibility barrier for users';
    if (ruleId.includes('performance'))
        return 'Performance degradation';
    return 'Code maintainability impact';
}
// ---------------------------------------------------------------------------
// Severity / impact helpers
// ---------------------------------------------------------------------------
var SECURITY_IMPACT = {
    critical: 'Critical security vulnerability — immediate exploitation possible',
    high: 'High security risk — exploitation likely',
    medium: 'Medium security risk — exploitation possible under certain conditions',
    low: 'Low security risk — limited exploitation potential',
};
var DEPENDENCY_IMPACT = {
    critical: 'Critical dependency vulnerability — update immediately',
    high: 'High-risk dependency — update as soon as possible',
    moderate: 'Moderate dependency risk — plan update',
    low: 'Low-risk dependency — update when convenient',
};
var SNYK_SEVERITY_MAP = {
    critical: 'critical', high: 'high', medium: 'medium', low: 'low',
};
var AUDIT_SEVERITY_MAP = {
    critical: 'critical', high: 'high', moderate: 'medium', low: 'low',
};
// ---------------------------------------------------------------------------
// BugCategorizer
// ---------------------------------------------------------------------------
var BugCategorizer = /** @class */ (function () {
    function BugCategorizer() {
        this.bugs = [];
        this.idCounter = 1;
    }
    /** Run all analyses and return the consolidated report. */
    BugCategorizer.prototype.analyze = function () {
        console.log('🔍 Running comprehensive bug analysis...');
        this.analyzeESLint();
        this.analyzeSecurity();
        this.analyzeDependencies();
        this.applyPriorities();
        return this.buildReport();
    };
    // -------------------------------------------------------------------------
    BugCategorizer.prototype.runJSON = function (cmd) {
        try {
            var raw = (0, child_process_1.execSync)(cmd, {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore'],
                maxBuffer: 10 * 1024 * 1024,
            });
            return JSON.parse(raw);
        }
        catch (err) {
            // execSync throws on non-zero exit (normal for lint/audit tools);
            // try to parse stdout from the error object before giving up.
            var execErr = err;
            if (execErr.stdout) {
                try {
                    return JSON.parse(execErr.stdout);
                }
                catch ( /* fall through */_a) { /* fall through */ }
            }
            console.warn("\u26A0\uFE0F  Could not run: ".concat(cmd, "\n   ").concat(err.message));
            return null;
        }
    };
    BugCategorizer.prototype.nextId = function (prefix) {
        return "".concat(prefix, "-").concat(this.idCounter++);
    };
    // -------------------------------------------------------------------------
    BugCategorizer.prototype.analyzeESLint = function () {
        var _a, _b;
        console.log('📋 Analyzing ESLint results...');
        var results = this.runJSON('npx eslint . --format json');
        if (!results)
            return;
        for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
            var file = results_1[_i];
            for (var _c = 0, _d = file.messages; _c < _d.length; _c++) {
                var msg = _d[_c];
                this.bugs.push({
                    id: this.nextId('eslint'),
                    type: categorizeESLintRule(msg.ruleId),
                    severity: msg.severity === 2 ? 'high' : 'medium',
                    title: "".concat((_a = msg.ruleId) !== null && _a !== void 0 ? _a : 'unknown', ": ").concat(msg.message),
                    description: msg.message,
                    file: file.filePath,
                    line: msg.line,
                    column: msg.column,
                    rule: (_b = msg.ruleId) !== null && _b !== void 0 ? _b : undefined,
                    fixable: msg.fix !== undefined,
                    impact: eslintImpact(msg.ruleId),
                    effort: eslintEffort(msg.ruleId),
                    priority: 0,
                });
            }
        }
    };
    // -------------------------------------------------------------------------
    BugCategorizer.prototype.analyzeSecurity = function () {
        var _a, _b, _c, _d, _e, _f;
        console.log('🔒 Analyzing Snyk security scan results...');
        var result = this.runJSON('npx snyk test --json');
        if (!(result === null || result === void 0 ? void 0 : result.vulnerabilities))
            return;
        for (var _i = 0, _g = result.vulnerabilities; _i < _g.length; _i++) {
            var v = _g[_i];
            var cve = (_c = (_b = (_a = v.identifiers) === null || _a === void 0 ? void 0 : _a.CVE) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : 'N/A';
            this.bugs.push({
                id: this.nextId('security'),
                type: 'security',
                severity: (_d = SNYK_SEVERITY_MAP[v.severity]) !== null && _d !== void 0 ? _d : 'medium',
                title: v.title,
                description: "".concat(v.description, "\nCVE: ").concat(cve),
                file: (_e = v.from) === null || _e === void 0 ? void 0 : _e[0],
                rule: v.id,
                fixable: Boolean(v.isUpgradable || v.isPatchable),
                impact: (_f = SECURITY_IMPACT[v.severity]) !== null && _f !== void 0 ? _f : 'Security vulnerability',
                effort: v.isUpgradable ? 'low' : v.isPatchable ? 'medium' : 'high',
                priority: 0,
            });
        }
    };
    // -------------------------------------------------------------------------
    BugCategorizer.prototype.analyzeDependencies = function () {
        var _a, _b, _c, _d;
        console.log('📦 Analyzing npm audit results...');
        var result = this.runJSON('npm audit --json');
        if (!(result === null || result === void 0 ? void 0 : result.vulnerabilities))
            return;
        for (var _i = 0, _e = Object.entries(result.vulnerabilities); _i < _e.length; _i++) {
            var _f = _e[_i], name_1 = _f[0], v = _f[1];
            var viaEntry = typeof v.via[0] === 'object' ? v.via[0] : undefined;
            this.bugs.push({
                id: this.nextId('dependency'),
                type: 'dependency',
                severity: (_a = AUDIT_SEVERITY_MAP[v.severity]) !== null && _a !== void 0 ? _a : 'medium',
                title: "Dependency vulnerability in ".concat(name_1),
                description: "".concat((_b = viaEntry === null || viaEntry === void 0 ? void 0 : viaEntry.title) !== null && _b !== void 0 ? _b : 'Dependency vulnerability', "\nRange: ").concat(v.range),
                file: name_1,
                rule: (_c = viaEntry === null || viaEntry === void 0 ? void 0 : viaEntry.cwe) === null || _c === void 0 ? void 0 : _c[0],
                fixable: v.fixAvailable !== false,
                impact: (_d = DEPENDENCY_IMPACT[v.severity]) !== null && _d !== void 0 ? _d : 'Dependency vulnerability',
                effort: v.fixAvailable === true ? 'low' : 'medium',
                priority: 0,
            });
        }
    };
    // -------------------------------------------------------------------------
    BugCategorizer.prototype.applyPriorities = function () {
        for (var _i = 0, _a = this.bugs; _i < _a.length; _i++) {
            var bug = _a[_i];
            var score = SEVERITY_WEIGHT[bug.severity] * W_SEVERITY +
                TYPE_WEIGHT[bug.type] * W_TYPE +
                EFFORT_WEIGHT[bug.effort] * W_EFFORT +
                (bug.fixable ? 10 : 0) * W_FIXABLE;
            bug.priority = Math.round(score * 10) / 10;
        }
        this.bugs.sort(function (a, b) { return b.priority - a.priority; });
    };
    // -------------------------------------------------------------------------
    BugCategorizer.prototype.buildReport = function () {
        var _this = this;
        var count = function (pred) { return _this.bugs.filter(pred).length; };
        var summary = {
            total: this.bugs.length,
            critical: count(function (b) { return b.severity === 'critical'; }),
            high: count(function (b) { return b.severity === 'high'; }),
            medium: count(function (b) { return b.severity === 'medium'; }),
            low: count(function (b) { return b.severity === 'low'; }),
            byType: {
                security: count(function (b) { return b.type === 'security'; }),
                accessibility: count(function (b) { return b.type === 'accessibility'; }),
                performance: count(function (b) { return b.type === 'performance'; }),
                'code-quality': count(function (b) { return b.type === 'code-quality'; }),
                dependency: count(function (b) { return b.type === 'dependency'; }),
            },
        };
        return { summary: summary, bugs: this.bugs, recommendations: this.buildRecommendations(summary) };
    };
    BugCategorizer.prototype.buildRecommendations = function (summary) {
        var recs = [];
        var critical = summary.critical, byType = summary.byType, total = summary.total;
        var fixable = this.bugs.filter(function (b) { return b.fixable; }).length;
        if (critical > 0)
            recs.push("\uD83D\uDEA8 URGENT: Address ".concat(critical, " critical issue(s) immediately"));
        if (byType.security > 0)
            recs.push("\uD83D\uDD12 Security: Fix ".concat(byType.security, " security vulnerability/vulnerabilities"));
        if (byType.dependency > 0)
            recs.push("\uD83D\uDCE6 Dependencies: Update ".concat(byType.dependency, " vulnerable package(s)"));
        if (byType.accessibility > 0)
            recs.push("\u267F Accessibility: Resolve ".concat(byType.accessibility, " accessibility issue(s)"));
        if (byType.performance > 0)
            recs.push("\u26A1 Performance: Optimize ".concat(byType.performance, " performance issue(s)"));
        if (total > 50)
            recs.push('📈 Consider automated fixing for high-volume, low-effort issues');
        if (fixable > 0)
            recs.push("\uD83D\uDD27 ".concat(fixable, " issue(s) are auto-fixable"));
        return recs;
    };
    return BugCategorizer;
}());
exports.BugCategorizer = BugCategorizer;
// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var categorizer, report, reportPath, summary, _i, _a, _b, type, count;
        return __generator(this, function (_c) {
            categorizer = new BugCategorizer();
            try {
                report = categorizer.analyze();
                reportPath = path_1.default.join(process.cwd(), 'reports', 'bug-analysis.json');
                fs_1.default.mkdirSync(path_1.default.dirname(reportPath), { recursive: true });
                fs_1.default.writeFileSync(reportPath, JSON.stringify(report, null, 2));
                summary = report.summary;
                console.log('\n📊 Bug Analysis Summary:');
                console.log("  Total   : ".concat(summary.total));
                console.log("  Critical: ".concat(summary.critical));
                console.log("  High    : ".concat(summary.high));
                console.log("  Medium  : ".concat(summary.medium));
                console.log("  Low     : ".concat(summary.low));
                console.log('\n📋 By Type:');
                for (_i = 0, _a = Object.entries(summary.byType); _i < _a.length; _i++) {
                    _b = _a[_i], type = _b[0], count = _b[1];
                    if (count > 0)
                        console.log("  ".concat(type, ": ").concat(count));
                }
                console.log('\n💡 Recommendations:');
                report.recommendations.forEach(function (r) { return console.log("  ".concat(r)); });
                console.log("\n\uD83D\uDCC4 Full report saved to: ".concat(reportPath));
                console.log('\n🔥 Top 10 Priority Bugs:');
                report.bugs.slice(0, 10).forEach(function (bug, i) {
                    console.log("".concat(i + 1, ". [").concat(bug.severity.toUpperCase(), "] ").concat(bug.title));
                    console.log("   Priority: ".concat(bug.priority, " | Type: ").concat(bug.type, " | Fixable: ").concat(bug.fixable ? 'Yes' : 'No'));
                    if (bug.file)
                        console.log("   File: ".concat(bug.file).concat(bug.line ? ":".concat(bug.line) : ''));
                    console.log('');
                });
            }
            catch (err) {
                console.error('❌ Error during bug analysis:', err);
                process.exit(1);
            }
            return [2 /*return*/];
        });
    });
}
// Guard so importing the module doesn't auto-execute main()
if (import.meta.url === "file://".concat(process.argv[1])) {
    main();
}
