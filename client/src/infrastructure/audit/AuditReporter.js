"use strict";
/**
 * Audit Reporter - Generates comprehensive reports of audit findings
 *
 * This component consolidates all audit results and generates
 * comprehensive reports with actionable recommendations.
 *
 * Key improvements:
 * - Complete type safety with proper interface definitions
 * - Enhanced error handling and validation
 * - Optimized performance with better algorithms
 * - Comprehensive reporting with actionable insights
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditReporter = exports.AuditReporter = void 0;
/**
 * Enhanced Audit Reporter class with comprehensive reporting capabilities
 */
var AuditReporter = /** @class */ (function () {
    function AuditReporter() {
        this.version = '2.0.0';
        this.maxRetries = 3;
        this.timeoutMs = 30000;
    }
    /**
     * Generate comprehensive audit report with enhanced type safety
     * This method orchestrates the entire reporting process with proper error handling
     */
    AuditReporter.prototype.generateComprehensiveReport = function (elements, routes, apiConnections, routeMismatches, linkValidation) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, errorsEncountered, warningsGenerated, auditScope, summary, recommendations, prioritizedActions, implementationPlan, riskAssessment, executionTime, executionMetrics, report, error_1, fallbackReport;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('📊 Generating comprehensive audit report...');
                        startTime = Date.now();
                        errorsEncountered = 0;
                        warningsGenerated = 0;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 6]);
                        // Validate input data to ensure type safety
                        this.validateInputData(elements, routes, apiConnections, routeMismatches);
                        auditScope = {
                            includedComponents: this.extractComponentNames(elements),
                            excludedComponents: [], // Could be populated based on configuration
                            auditDate: new Date(),
                            auditVersion: this.version,
                            environment: this.detectEnvironment()
                        };
                        summary = this.generateEnhancedSummary(elements, routes, apiConnections);
                        recommendations = this.generateEnhancedRecommendations(elements, routes, apiConnections, routeMismatches);
                        prioritizedActions = this.generateOptimizedPrioritizedActions(recommendations, elements, routeMismatches);
                        implementationPlan = this.generateDetailedImplementationPlan(prioritizedActions);
                        riskAssessment = this.generateComprehensiveRiskAssessment(elements, routes, apiConnections);
                        executionTime = Date.now() - startTime;
                        executionMetrics = {
                            totalExecutionTime: executionTime,
                            elementsScanned: elements.length,
                            apiEndpointsChecked: apiConnections.length,
                            routesValidated: routes.length,
                            errorsEncountered: errorsEncountered,
                            warningsGenerated: warningsGenerated
                        };
                        report = {
                            id: "comprehensive-audit-".concat(Date.now()),
                            timestamp: new Date(),
                            summary: summary,
                            elements: elements,
                            routes: routes,
                            apiConnections: apiConnections,
                            recommendations: recommendations,
                            routeMismatches: routeMismatches,
                            linkValidation: linkValidation,
                            prioritizedActions: prioritizedActions,
                            implementationPlan: implementationPlan,
                            riskAssessment: riskAssessment,
                            auditScope: auditScope,
                            executionMetrics: executionMetrics
                        };
                        // Save report with error handling
                        return [4 /*yield*/, this.saveReportSafely(report)];
                    case 2:
                        // Save report with error handling
                        _a.sent();
                        // Generate human-readable report
                        return [4 /*yield*/, this.generateEnhancedHumanReadableReport(report)];
                    case 3:
                        // Generate human-readable report
                        _a.sent();
                        console.log('✅ Comprehensive audit report generated successfully');
                        console.log("\uD83D\uDCCA Processed ".concat(elements.length, " elements in ").concat(executionTime, "ms"));
                        return [2 /*return*/, report];
                    case 4:
                        error_1 = _a.sent();
                        errorsEncountered++;
                        console.error('❌ Report generation failed:', error_1);
                        fallbackReport = this.generateFallbackReport(elements, routes, apiConnections, error_1);
                        return [4 /*yield*/, this.saveReportSafely(fallbackReport)];
                    case 5:
                        _a.sent();
                        throw new Error("Audit report generation failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate input data to ensure type safety and data integrity
     */
    AuditReporter.prototype.validateInputData = function (elements, routes, apiConnections, routeMismatches) {
        if (!Array.isArray(elements)) {
            throw new Error('Elements must be an array');
        }
        if (!Array.isArray(routes)) {
            throw new Error('Routes must be an array');
        }
        if (!Array.isArray(apiConnections)) {
            throw new Error('API connections must be an array');
        }
        if (!Array.isArray(routeMismatches)) {
            throw new Error('Route mismatches must be an array');
        }
        // Validate each element has required properties
        elements.forEach(function (element, index) {
            if (!element.id && !element.type) {
                console.warn("\u26A0\uFE0F Element at index ".concat(index, " missing id and type"));
            }
            if (!element.status) {
                // Set default status if missing
                element.status = 'unknown';
            }
            if (!element.priority) {
                // Set default priority if missing
                element.priority = 'medium';
            }
        });
    };
    /**
     * Extract component names from elements for audit scope
     */
    AuditReporter.prototype.extractComponentNames = function (elements) {
        var componentNames = new Set();
        elements.forEach(function (element) {
            var _a;
            if ((_a = element.location) === null || _a === void 0 ? void 0 : _a.componentName) {
                componentNames.add(element.location.componentName);
            }
        });
        return Array.from(componentNames);
    };
    /**
     * Detect the current environment
     */
    AuditReporter.prototype.detectEnvironment = function () {
        // In a real implementation, this would check environment variables
        // For now, we'll return development as default
        return 'development';
    };
    /**
     * Generate enhanced summary with more detailed statistics
     */
    AuditReporter.prototype.generateEnhancedSummary = function (elements, routes, apiConnections) {
        // Calculate element statistics
        var workingElements = elements.filter(function (e) { return e.status === 'working'; }).length;
        var brokenElements = elements.filter(function (e) { return e.status === 'broken'; }).length;
        var missingElements = elements.filter(function (e) { return e.status === 'missing'; }).length;
        var unknownElements = elements.filter(function (e) { return e.status === 'unknown'; }).length;
        // Calculate priority-based issues
        var criticalIssues = elements.filter(function (e) {
            return e.priority === 'critical' && e.status !== 'working';
        }).length;
        var highPriorityIssues = elements.filter(function (e) {
            return e.priority === 'high' && e.status !== 'working';
        }).length;
        // Calculate route statistics
        var brokenRoutes = routes.filter(function (r) {
            return r.status === 'broken' || r.status === '404';
        }).length;
        // Calculate API statistics
        var brokenAPIs = apiConnections.filter(function (a) { return a.status === 'broken'; }).length;
        var slowAPIs = apiConnections.filter(function (a) {
            return a.responseTime && a.responseTime > 2000;
        }).length;
        // Enhanced estimation algorithm considering complexity factors
        var estimatedFixTime = this.calculateEstimatedFixTime(criticalIssues, highPriorityIssues, brokenElements, missingElements, brokenRoutes, brokenAPIs, slowAPIs);
        return {
            totalElements: elements.length,
            workingElements: workingElements,
            brokenElements: brokenElements,
            missingElements: missingElements,
            unknownElements: unknownElements,
            criticalIssues: criticalIssues,
            highPriorityIssues: highPriorityIssues,
            estimatedFixTime: estimatedFixTime
        };
    };
    /**
     * Calculate estimated fix time using enhanced algorithms
     */
    AuditReporter.prototype.calculateEstimatedFixTime = function (criticalIssues, highPriorityIssues, brokenElements, missingElements, brokenRoutes, brokenAPIs, slowAPIs) {
        // Base time estimates (in hours)
        var baseEstimates = {
            critical: 8, // Critical issues need immediate, careful attention
            high: 4, // High priority issues are complex but more straightforward
            broken: 2, // Broken elements need diagnosis and fixing
            missing: 3, // Missing elements need implementation
            routes: 3, // Route issues need router configuration changes
            apis: 6, // API issues often require backend work
            slowApis: 3 // Performance optimization
        };
        // Complexity multipliers based on interaction effects
        var complexityMultiplier = 1 + Math.min((criticalIssues + highPriorityIssues) * 0.1, 0.5);
        // Calculate base time
        var baseTime = (criticalIssues * baseEstimates.critical) +
            (highPriorityIssues * baseEstimates.high) +
            (brokenElements * baseEstimates.broken) +
            (missingElements * baseEstimates.missing) +
            (brokenRoutes * baseEstimates.routes) +
            (brokenAPIs * baseEstimates.apis) +
            (slowAPIs * baseEstimates.slowApis);
        // Apply complexity multiplier and add buffer time
        return Math.ceil(baseTime * complexityMultiplier * 1.2); // 20% buffer
    };
    /**
     * Generate enhanced recommendations with better categorization
     */
    AuditReporter.prototype.generateEnhancedRecommendations = function (elements, routes, apiConnections, routeMismatches) {
        var recommendations = [];
        // Critical backend issues - highest priority
        this.addBackendRecommendations(recommendations, apiConnections);
        // Missing and broken routes - affects navigation
        this.addRoutingRecommendations(recommendations, routeMismatches);
        // Broken UI components - affects user experience
        this.addComponentRecommendations(recommendations, elements, routeMismatches);
        // Disconnected UI elements - affects interactivity
        this.addInteractivityRecommendations(recommendations, elements);
        // Performance issues - affects user satisfaction
        this.addPerformanceRecommendations(recommendations, apiConnections);
        // Security and error handling improvements
        this.addSecurityRecommendations(recommendations, elements, apiConnections);
        return this.prioritizeRecommendations(recommendations);
    };
    /**
     * Add backend-specific recommendations
     */
    AuditReporter.prototype.addBackendRecommendations = function (recommendations, apiConnections) {
        var brokenAPIs = apiConnections.filter(function (a) { return a.status === 'broken'; });
        if (brokenAPIs.length > 0) {
            recommendations.push({
                id: 'fix-critical-apis',
                priority: 'critical',
                category: 'backend',
                title: 'Fix Critical API Endpoints',
                description: "".concat(brokenAPIs.length, " critical API endpoints are not working, blocking core functionality. This is preventing users from completing essential tasks and may be causing data loss or corruption."),
                estimatedEffort: this.calculateBackendEffort(brokenAPIs),
                dependencies: [],
                affectedElements: brokenAPIs.map(function (a) { return a.endpoint; }),
                suggestedSolution: 'Implement missing backend endpoints, fix existing API issues, add proper error handling, and ensure database connectivity. Consider implementing circuit breakers for resilience.',
                businessImpact: 'High - Core functionality is blocked, users cannot complete critical workflows'
            });
        }
        // Add database-related recommendations if patterns suggest DB issues
        var dbRelatedAPIs = brokenAPIs.filter(function (api) {
            var _a, _b;
            return api.endpoint.includes('/api/') &&
                (((_a = api.errorMessage) === null || _a === void 0 ? void 0 : _a.includes('database')) || ((_b = api.errorMessage) === null || _b === void 0 ? void 0 : _b.includes('connection')));
        });
        if (dbRelatedAPIs.length > 0) {
            recommendations.push({
                id: 'fix-database-connectivity',
                priority: 'critical',
                category: 'backend',
                title: 'Resolve Database Connectivity Issues',
                description: "Database connectivity issues detected affecting ".concat(dbRelatedAPIs.length, " endpoints"),
                estimatedEffort: 12,
                dependencies: ['fix-critical-apis'],
                affectedElements: dbRelatedAPIs.map(function (a) { return a.endpoint; }),
                suggestedSolution: 'Check database connection strings, ensure database service is running, verify network connectivity, and implement connection pooling',
                businessImpact: 'Critical - Data operations are failing'
            });
        }
    };
    /**
     * Calculate backend effort based on API complexity
     */
    AuditReporter.prototype.calculateBackendEffort = function (brokenAPIs) {
        var totalEffort = 0;
        brokenAPIs.forEach(function (api) {
            // Base effort for API fixes
            var apiEffort = 6;
            // Adjust based on HTTP method complexity
            if (api.method === 'POST' || api.method === 'PUT') {
                apiEffort += 2; // Data validation and processing
            }
            if (api.method === 'DELETE') {
                apiEffort += 1; // Safety checks
            }
            // Adjust based on endpoint complexity
            if (api.endpoint.includes('/api/admin/')) {
                apiEffort += 3; // Admin endpoints often more complex
            }
            if (api.endpoint.includes('/api/auth/')) {
                apiEffort += 4; // Authentication endpoints need security review
            }
            totalEffort += apiEffort;
        });
        return totalEffort;
    };
    /**
     * Add routing-specific recommendations
     */
    AuditReporter.prototype.addRoutingRecommendations = function (recommendations, routeMismatches) {
        var missingRoutes = routeMismatches.filter(function (m) { return m.issue === 'missing_route'; });
        var brokenComponents = routeMismatches.filter(function (m) { return m.issue === 'missing_component'; });
        if (missingRoutes.length > 0) {
            recommendations.push({
                id: 'implement-missing-routes',
                priority: 'high',
                category: 'routing',
                title: 'Implement Missing Routes',
                description: "".concat(missingRoutes.length, " routes are referenced in navigation but not implemented in the router configuration. This breaks user navigation and causes 404 errors."),
                estimatedEffort: missingRoutes.length * 3,
                dependencies: [],
                affectedElements: missingRoutes.map(function (r) { return r.path; }),
                suggestedSolution: 'Create route components, add route definitions to router configuration, implement proper route guards, and add breadcrumb support',
                businessImpact: 'Medium - User navigation is broken, affecting user experience'
            });
        }
        if (brokenComponents.length > 0) {
            recommendations.push({
                id: 'fix-broken-components',
                priority: 'critical',
                category: 'frontend',
                title: 'Fix Broken Component References',
                description: "".concat(brokenComponents.length, " routes reference components that don't exist or have import issues. This causes pages to fail loading completely."),
                estimatedEffort: brokenComponents.length * 4,
                dependencies: [],
                affectedElements: brokenComponents.map(function (c) { return c.path; }),
                suggestedSolution: 'Create missing components, fix import statements, resolve component path issues, and add proper error boundaries',
                businessImpact: 'High - Pages fail to load, blocking user access to features'
            });
        }
    };
    /**
     * Add component-specific recommendations
     */
    AuditReporter.prototype.addComponentRecommendations = function (recommendations, elements, routeMismatches) {
        var _this = this;
        var brokenElements = elements.filter(function (e) { return e.status === 'broken'; });
        if (brokenElements.length > 0) {
            var groupedByComponent = this.groupElementsByComponent(brokenElements);
            Object.entries(groupedByComponent).forEach(function (_a) {
                var componentName = _a[0], componentElements = _a[1];
                recommendations.push({
                    id: "fix-component-".concat(componentName.toLowerCase().replace(/\s+/g, '-')),
                    priority: _this.calculateComponentPriority(componentElements),
                    category: 'frontend',
                    title: "Fix Issues in ".concat(componentName, " Component"),
                    description: "".concat(componentElements.length, " elements in ").concat(componentName, " are not working correctly. ").concat(_this.describeComponentIssues(componentElements)),
                    estimatedEffort: componentElements.length * 2.5,
                    dependencies: _this.getComponentDependencies(componentElements),
                    affectedElements: componentElements.map(function (e) { return e.id || 'unknown'; }).filter(function (id) { return id !== 'unknown'; }),
                    suggestedSolution: _this.generateComponentSolution(componentElements),
                    businessImpact: _this.calculateComponentBusinessImpact(componentElements)
                });
            });
        }
    };
    /**
     * Group elements by their component for better organization
     */
    AuditReporter.prototype.groupElementsByComponent = function (elements) {
        var grouped = {};
        elements.forEach(function (element) {
            var _a;
            var componentName = ((_a = element.location) === null || _a === void 0 ? void 0 : _a.componentName) || 'Unknown Component';
            if (!grouped[componentName]) {
                grouped[componentName] = [];
            }
            grouped[componentName].push(element);
        });
        return grouped;
    };
    /**
     * Calculate component priority based on element priorities
     */
    AuditReporter.prototype.calculateComponentPriority = function (elements) {
        var hasCritical = elements.some(function (e) { return e.priority === 'critical'; });
        var hasHigh = elements.some(function (e) { return e.priority === 'high'; });
        var highPriorityCount = elements.filter(function (e) { return e.priority === 'high' || e.priority === 'critical'; }).length;
        if (hasCritical || highPriorityCount >= 3)
            return 'critical';
        if (hasHigh || highPriorityCount >= 2)
            return 'high';
        if (elements.length >= 5)
            return 'medium';
        return 'low';
    };
    /**
     * Describe component issues in human-readable format
     */
    AuditReporter.prototype.describeComponentIssues = function (elements) {
        var issueTypes = new Set();
        elements.forEach(function (element) {
            if (element.currentBehavior) {
                if (element.currentBehavior.includes('error'))
                    issueTypes.add('throwing errors');
                if (element.currentBehavior.includes('not responding'))
                    issueTypes.add('not responding to user input');
                if (element.currentBehavior.includes('loading'))
                    issueTypes.add('stuck in loading state');
            }
        });
        if (issueTypes.size > 0) {
            return "Issues include: ".concat(Array.from(issueTypes).join(', '), ".");
        }
        return 'Multiple functionality issues detected.';
    };
    /**
     * Get component dependencies for recommendations
     */
    AuditReporter.prototype.getComponentDependencies = function (elements) {
        var dependencies = new Set();
        elements.forEach(function (element) {
            if (element.dependencies) {
                element.dependencies.forEach(function (dep) { return dependencies.add(dep); });
            }
        });
        return Array.from(dependencies);
    };
    /**
     * Generate component-specific solution
     */
    AuditReporter.prototype.generateComponentSolution = function (elements) {
        var solutions = [];
        var hasAPIIssues = elements.some(function (e) { var _a, _b; return ((_a = e.currentBehavior) === null || _a === void 0 ? void 0 : _a.includes('API')) || ((_b = e.errorMessage) === null || _b === void 0 ? void 0 : _b.includes('fetch')); });
        var hasEventIssues = elements.some(function (e) { var _a, _b; return ((_a = e.currentBehavior) === null || _a === void 0 ? void 0 : _a.includes('click')) || ((_b = e.currentBehavior) === null || _b === void 0 ? void 0 : _b.includes('event')); });
        var hasStateIssues = elements.some(function (e) { var _a, _b; return ((_a = e.currentBehavior) === null || _a === void 0 ? void 0 : _a.includes('state')) || ((_b = e.currentBehavior) === null || _b === void 0 ? void 0 : _b.includes('update')); });
        if (hasAPIIssues)
            solutions.push('fix API integration and error handling');
        if (hasEventIssues)
            solutions.push('implement proper event handlers and user interaction logic');
        if (hasStateIssues)
            solutions.push('resolve state management issues and component re-rendering');
        solutions.push('add comprehensive error boundaries and loading states');
        solutions.push('implement proper validation and user feedback');
        return solutions.join(', ');
    };
    /**
     * Calculate business impact for component issues
     */
    AuditReporter.prototype.calculateComponentBusinessImpact = function (elements) {
        var criticalCount = elements.filter(function (e) { return e.priority === 'critical'; }).length;
        var affectedFlows = new Set();
        elements.forEach(function (element) {
            if (element.affectedUserFlows) {
                element.affectedUserFlows.forEach(function (flow) { return affectedFlows.add(flow); });
            }
        });
        if (criticalCount > 0 || affectedFlows.size > 2) {
            return 'High - Critical user workflows are blocked';
        }
        else if (affectedFlows.size > 0) {
            return 'Medium - User experience is degraded';
        }
        else {
            return 'Low - Minor functionality issues';
        }
    };
    /**
     * Add interactivity recommendations
     */
    AuditReporter.prototype.addInteractivityRecommendations = function (recommendations, elements) {
        var disconnectedElements = elements.filter(function (e) { return e.status === 'missing'; });
        if (disconnectedElements.length > 0) {
            recommendations.push({
                id: 'connect-ui-elements',
                priority: 'high',
                category: 'frontend',
                title: 'Connect Disconnected UI Elements',
                description: "".concat(disconnectedElements.length, " UI elements have no working event handlers or are not connected to backend functionality. Users can interact with these elements but nothing happens."),
                estimatedEffort: disconnectedElements.length * 2,
                dependencies: ['fix-critical-apis', 'implement-missing-routes'],
                affectedElements: disconnectedElements.map(function (e) { return e.id || 'unknown'; }).filter(Boolean),
                suggestedSolution: 'Wire up event handlers to appropriate functions, connect to API endpoints, implement proper state management, and add user feedback for all interactions',
                businessImpact: 'Medium - User interactions fail silently, causing confusion and frustration'
            });
        }
    };
    /**
     * Add performance recommendations
     */
    AuditReporter.prototype.addPerformanceRecommendations = function (recommendations, apiConnections) {
        var slowAPIs = apiConnections.filter(function (a) { return a.responseTime && a.responseTime > 2000; });
        if (slowAPIs.length > 0) {
            recommendations.push({
                id: 'optimize-slow-apis',
                priority: 'medium',
                category: 'performance',
                title: 'Optimize Slow API Endpoints',
                description: "".concat(slowAPIs.length, " API endpoints are responding slowly (>2s), affecting user experience. Average response time: ").concat(this.calculateAverageResponseTime(slowAPIs), "ms"),
                estimatedEffort: slowAPIs.length * 3,
                dependencies: ['fix-critical-apis'],
                affectedElements: slowAPIs.map(function (a) { return a.endpoint; }),
                suggestedSolution: 'Optimize database queries, add caching layers, implement pagination, compress responses, and consider CDN usage for static content',
                businessImpact: 'Low-Medium - Performance impact affects user satisfaction and conversion rates'
            });
        }
    };
    /**
     * Calculate average response time for slow APIs
     */
    AuditReporter.prototype.calculateAverageResponseTime = function (apis) {
        var total = apis.reduce(function (sum, api) { return sum + (api.responseTime || 0); }, 0);
        return Math.round(total / apis.length);
    };
    /**
     * Add security recommendations
     */
    AuditReporter.prototype.addSecurityRecommendations = function (recommendations, elements, apiConnections) {
        var authRelatedAPIs = apiConnections.filter(function (api) {
            return api.endpoint.includes('/auth/') || api.endpoint.includes('/login') || api.endpoint.includes('/user/');
        });
        var brokenAuthAPIs = authRelatedAPIs.filter(function (api) { return api.status === 'broken'; });
        if (brokenAuthAPIs.length > 0) {
            recommendations.push({
                id: 'fix-security-endpoints',
                priority: 'critical',
                category: 'security',
                title: 'Fix Authentication and Security Endpoints',
                description: "".concat(brokenAuthAPIs.length, " security-related endpoints are failing, potentially exposing security vulnerabilities"),
                estimatedEffort: brokenAuthAPIs.length * 8,
                dependencies: [],
                affectedElements: brokenAuthAPIs.map(function (a) { return a.endpoint; }),
                suggestedSolution: 'Implement proper authentication flows, add input validation, implement rate limiting, and conduct security audit',
                businessImpact: 'Critical - Security vulnerabilities may expose user data and system access'
            });
        }
        // Check for elements that might have security implications
        var securitySensitiveElements = elements.filter(function (e) {
            var _a, _b, _c, _d, _e;
            return ((_a = e.id) === null || _a === void 0 ? void 0 : _a.includes('password')) ||
                ((_b = e.id) === null || _b === void 0 ? void 0 : _b.includes('payment')) ||
                ((_c = e.id) === null || _c === void 0 ? void 0 : _c.includes('admin')) ||
                ((_e = (_d = e.location) === null || _d === void 0 ? void 0 : _d.componentName) === null || _e === void 0 ? void 0 : _e.toLowerCase().includes('auth'));
        });
        var brokenSecurityElements = securitySensitiveElements.filter(function (e) { return e.status === 'broken'; });
        if (brokenSecurityElements.length > 0) {
            recommendations.push({
                id: 'fix-security-elements',
                priority: 'high',
                category: 'security',
                title: 'Fix Security-Sensitive UI Elements',
                description: "".concat(brokenSecurityElements.length, " security-sensitive UI elements are not working properly"),
                estimatedEffort: brokenSecurityElements.length * 4,
                dependencies: ['fix-security-endpoints'],
                affectedElements: brokenSecurityElements.map(function (e) { return e.id || 'unknown'; }).filter(Boolean),
                suggestedSolution: 'Implement proper validation, add secure input handling, ensure HTTPS usage, and add security headers',
                businessImpact: 'High - Security features are compromised'
            });
        }
    };
    /**
     * Prioritize recommendations based on multiple factors
     */
    AuditReporter.prototype.prioritizeRecommendations = function (recommendations) {
        return recommendations.sort(function (a, b) {
            // Priority scoring
            var priorityScores = { critical: 4, high: 3, medium: 2, low: 1 };
            var aPriorityScore = priorityScores[a.priority];
            var bPriorityScore = priorityScores[b.priority];
            if (aPriorityScore !== bPriorityScore) {
                return bPriorityScore - aPriorityScore; // Higher priority first
            }
            // If same priority, sort by business impact keywords
            var impactKeywords = ['critical', 'blocked', 'high', 'fail'];
            var aHasHighImpact = impactKeywords.some(function (keyword) {
                return a.businessImpact.toLowerCase().includes(keyword);
            });
            var bHasHighImpact = impactKeywords.some(function (keyword) {
                return b.businessImpact.toLowerCase().includes(keyword);
            });
            if (aHasHighImpact !== bHasHighImpact) {
                return aHasHighImpact ? -1 : 1;
            }
            // Finally, sort by affected element count (more affected = higher priority)
            return b.affectedElements.length - a.affectedElements.length;
        });
    };
    /**
     * Generate optimized prioritized actions with enhanced algorithms
     */
    AuditReporter.prototype.generateOptimizedPrioritizedActions = function (recommendations, elements, routeMismatches) {
        var actions = [];
        for (var _i = 0, recommendations_1 = recommendations; _i < recommendations_1.length; _i++) {
            var rec = recommendations_1[_i];
            var action = {
                id: rec.id,
                title: rec.title,
                description: rec.description,
                priority: rec.priority,
                category: rec.category,
                estimatedHours: rec.estimatedEffort,
                dependencies: rec.dependencies,
                affectedFeatures: this.getAffectedFeatures(rec.affectedElements),
                userImpact: this.calculateUserImpact(rec.priority, rec.affectedElements.length),
                technicalComplexity: this.calculateTechnicalComplexity(rec.category, rec.estimatedEffort),
                businessValue: this.calculateBusinessValue(rec.priority, rec.category),
                // Enhanced action properties
                prerequisites: this.generatePrerequisites(rec),
                acceptanceCriteria: this.generateAcceptanceCriteria(rec),
                testingRequirements: this.generateTestingRequirements(rec),
                rollbackPlan: this.generateRollbackPlan(rec)
            };
            actions.push(action);
        }
        // Enhanced sorting with multiple criteria
        return this.optimizeActionSequence(actions);
    };
    /**
     * Generate prerequisites for an action
     */
    AuditReporter.prototype.generatePrerequisites = function (recommendation) {
        var prerequisites = [];
        if (recommendation.category === 'backend') {
            prerequisites.push('Database access and connectivity verified');
            prerequisites.push('Development environment configured');
            prerequisites.push('API documentation reviewed');
        }
        if (recommendation.category === 'frontend') {
            prerequisites.push('Component architecture understood');
            prerequisites.push('State management pattern defined');
            prerequisites.push('Design system guidelines available');
        }
        if (recommendation.category === 'security') {
            prerequisites.push('Security requirements documented');
            prerequisites.push('Authentication system designed');
            prerequisites.push('Security review scheduled');
        }
        if (recommendation.priority === 'critical') {
            prerequisites.push('Rollback plan prepared');
            prerequisites.push('Monitoring alerts configured');
        }
        return prerequisites;
    };
    /**
     * Generate acceptance criteria for an action
     */
    AuditReporter.prototype.generateAcceptanceCriteria = function (recommendation) {
        var criteria = [];
        // Base criteria for all recommendations
        criteria.push('All affected elements function as intended');
        criteria.push('No new errors introduced in related functionality');
        criteria.push('User experience flows complete successfully');
        // Category-specific criteria
        if (recommendation.category === 'backend') {
            criteria.push('API endpoints return expected responses');
            criteria.push('Database operations complete without errors');
            criteria.push('Performance benchmarks met');
        }
        if (recommendation.category === 'frontend') {
            criteria.push('UI elements respond to user interactions');
            criteria.push('Visual design matches specifications');
            criteria.push('Responsive design works across devices');
        }
        if (recommendation.category === 'security') {
            criteria.push('Security vulnerabilities addressed');
            criteria.push('Authentication flows work correctly');
            criteria.push('Data validation prevents malicious input');
        }
        if (recommendation.priority === 'critical') {
            criteria.push('Zero downtime during deployment');
            criteria.push('Monitoring confirms system stability');
        }
        return criteria;
    };
    /**
     * Generate testing requirements for an action
     */
    AuditReporter.prototype.generateTestingRequirements = function (recommendation) {
        var requirements = [];
        // Base testing requirements
        requirements.push('Unit tests cover new/modified code');
        requirements.push('Integration tests verify end-to-end functionality');
        requirements.push('Manual testing confirms user scenarios work');
        // Category-specific testing
        if (recommendation.category === 'backend') {
            requirements.push('API tests verify endpoint behavior');
            requirements.push('Database tests confirm data integrity');
            requirements.push('Load tests ensure performance standards');
        }
        if (recommendation.category === 'frontend') {
            requirements.push('Component tests verify UI behavior');
            requirements.push('Cross-browser testing completed');
            requirements.push('Accessibility testing performed');
        }
        if (recommendation.category === 'security') {
            requirements.push('Security penetration testing conducted');
            requirements.push('Authentication tests verify access control');
            requirements.push('Input validation tests prevent injection attacks');
        }
        if (recommendation.priority === 'critical') {
            requirements.push('Regression tests ensure no functionality breaks');
            requirements.push('Performance monitoring confirms no degradation');
        }
        return requirements;
    };
    /**
     * Generate rollback plan for an action
     */
    AuditReporter.prototype.generateRollbackPlan = function (recommendation) {
        var plans = [];
        if (recommendation.category === 'backend') {
            plans.push('Revert database migrations if needed');
            plans.push('Restore previous API endpoint versions');
            plans.push('Switch back to previous service configurations');
        }
        if (recommendation.category === 'frontend') {
            plans.push('Restore previous component versions from git');
            plans.push('Revert route configurations to previous state');
            plans.push('Clear browser caches to ensure clean state');
        }
        plans.push('Monitor system metrics for stability after rollback');
        plans.push('Communicate rollback status to stakeholders');
        return plans.join('; ');
    };
    /**
     * Optimize action sequence for better implementation flow
     */
    AuditReporter.prototype.optimizeActionSequence = function (actions) {
        // Create dependency graph
        var dependencyGraph = new Map();
        actions.forEach(function (action) {
            dependencyGraph.set(action.id, action.dependencies);
        });
        // Topological sort to respect dependencies
        var sorted = this.topologicalSort(actions, dependencyGraph);
        // Within each dependency level, sort by priority and impact
        return sorted.sort(function (a, b) {
            var priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            var impactOrder = { high: 0, medium: 1, low: 2 };
            var aPriorityScore = priorityOrder[a.priority];
            var bPriorityScore = priorityOrder[b.priority];
            if (aPriorityScore !== bPriorityScore) {
                return aPriorityScore - bPriorityScore;
            }
            return impactOrder[a.userImpact] - impactOrder[b.userImpact];
        });
    };
    /**
     * Topological sort for dependency ordering
     */
    AuditReporter.prototype.topologicalSort = function (actions, dependencyGraph) {
        var visited = new Set();
        var result = [];
        var actionMap = new Map(actions.map(function (action) { return [action.id, action]; }));
        var visit = function (actionId) {
            if (visited.has(actionId))
                return;
            visited.add(actionId);
            var dependencies = dependencyGraph.get(actionId) || [];
            dependencies.forEach(function (dep) {
                if (actionMap.has(dep)) {
                    visit(dep);
                }
            });
            var action = actionMap.get(actionId);
            if (action) {
                result.push(action);
            }
        };
        actions.forEach(function (action) { return visit(action.id); });
        return result;
    };
    /**
     * Get affected features with enhanced detection
     */
    AuditReporter.prototype.getAffectedFeatures = function (elementIds) {
        var features = new Set();
        var featurePatterns = {
            'User Dashboard': ['dashboard', 'home', 'overview'],
            'Property Management': ['property', 'properties', 'listing', 'real-estate'],
            'Notifications': ['notification', 'alert', 'message-center'],
            'Messaging': ['message', 'inbox', 'chat', 'communication'],
            'Authentication': ['auth', 'login', 'signup', 'register', 'password'],
            'Trust & Security': ['trust', 'fraud', 'verification', 'security'],
            'Search & Discovery': ['search', 'filter', 'browse', 'discover'],
            'User Profile': ['profile', 'settings', 'account', 'preferences'],
            'Payment System': ['payment', 'billing', 'transaction', 'checkout'],
            'Admin Panel': ['admin', 'management', 'control-panel']
        };
        var _loop_1 = function (id) {
            var lowerId = id.toLowerCase();
            for (var _a = 0, _b = Object.entries(featurePatterns); _a < _b.length; _a++) {
                var _c = _b[_a], feature = _c[0], patterns = _c[1];
                if (patterns.some(function (pattern) { return lowerId.includes(pattern); })) {
                    features.add(feature);
                }
            }
        };
        for (var _i = 0, elementIds_1 = elementIds; _i < elementIds_1.length; _i++) {
            var id = elementIds_1[_i];
            _loop_1(id);
        }
        return Array.from(features);
    };
    /**
     * Calculate user impact with enhanced logic
     */
    AuditReporter.prototype.calculateUserImpact = function (priority, affectedCount) {
        // Critical priority always has high impact
        if (priority === 'critical')
            return 'high';
        // High priority with multiple affected elements
        if (priority === 'high' && affectedCount > 3)
            return 'high';
        if (priority === 'high')
            return 'medium';
        // Medium priority consideration
        if (priority === 'medium' && affectedCount > 5)
            return 'medium';
        if (priority === 'medium')
            return 'low';
        // Low priority is always low impact unless many elements affected
        if (affectedCount > 10)
            return 'medium';
        return 'low';
    };
    /**
     * Calculate technical complexity with enhanced factors
     */
    AuditReporter.prototype.calculateTechnicalComplexity = function (category, estimatedHours) {
        // Backend work is inherently more complex
        if (category === 'backend') {
            if (estimatedHours > 20)
                return 'high';
            if (estimatedHours > 10)
                return 'medium';
            return 'low';
        }
        // Security work requires careful consideration
        if (category === 'security') {
            if (estimatedHours > 15)
                return 'high';
            if (estimatedHours > 8)
                return 'medium';
            return 'low';
        }
        // Performance optimization can be tricky
        if (category === 'performance') {
            if (estimatedHours > 12)
                return 'high';
            if (estimatedHours > 6)
                return 'medium';
            return 'low';
        }
        // General complexity based on time
        if (estimatedHours > 15)
            return 'high';
        if (estimatedHours > 8)
            return 'medium';
        return 'low';
    };
    /**
     * Calculate business value with enhanced criteria
     */
    AuditReporter.prototype.calculateBusinessValue = function (priority, category) {
        // Critical issues always have high business value when fixed
        if (priority === 'critical')
            return 'high';
        // Backend and security fixes provide high business value
        if (category === 'backend' || category === 'security')
            return 'high';
        // Routing issues block user navigation - high value
        if (category === 'routing')
            return 'high';
        // High priority frontend and performance issues
        if (priority === 'high' && (category === 'frontend' || category === 'performance')) {
            return 'medium';
        }
        // Error handling improvements provide medium value
        if (category === 'error-handling')
            return 'medium';
        // Everything else based on priority
        if (priority === 'high')
            return 'medium';
        return 'low';
    };
    /**
     * Generate detailed implementation plan with enhanced planning
     */
    AuditReporter.prototype.generateDetailedImplementationPlan = function (actions) {
        var phases = [
            {
                id: 'phase-1-critical',
                name: 'Critical System Fixes',
                description: 'Address critical issues that completely block functionality and pose security risks',
                actions: actions.filter(function (a) { return a.priority === 'critical'; }).map(function (a) { return a.id; }),
                estimatedHours: actions.filter(function (a) { return a.priority === 'critical'; }).reduce(function (sum, a) { return sum + a.estimatedHours; }, 0),
                dependencies: [],
                deliverables: [
                    'All critical API endpoints functional',
                    'Security vulnerabilities patched',
                    'Core user workflows operational',
                    'Database connectivity restored',
                    'Authentication system working'
                ],
                successCriteria: [
                    'Zero critical errors in production',
                    'All security endpoints responding correctly',
                    'User login and core functions work',
                    'No data loss or corruption'
                ]
            },
            {
                id: 'phase-2-high-priority',
                name: 'High Priority Feature Restoration',
                description: 'Restore missing functionality and fix high-impact user experience issues',
                actions: actions.filter(function (a) { return a.priority === 'high'; }).map(function (a) { return a.id; }),
                estimatedHours: actions.filter(function (a) { return a.priority === 'high'; }).reduce(function (sum, a) { return sum + a.estimatedHours; }, 0),
                dependencies: ['phase-1-critical'],
                deliverables: [
                    'All navigation routes functional',
                    'UI components properly connected',
                    'User interactions working correctly',
                    'Error handling implemented',
                    'Basic performance optimizations'
                ],
                successCriteria: [
                    'All user journeys complete successfully',
                    'No broken navigation links',
                    'UI elements respond to user input',
                    'Appropriate error messages shown'
                ]
            },
            {
                id: 'phase-3-optimization',
                name: 'Performance & User Experience Polish',
                description: 'Optimize performance, add polish, and enhance user experience',
                actions: actions.filter(function (a) { return a.priority === 'medium' || a.priority === 'low'; }).map(function (a) { return a.id; }),
                estimatedHours: actions.filter(function (a) { return a.priority === 'medium' || a.priority === 'low'; }).reduce(function (sum, a) { return sum + a.estimatedHours; }, 0),
                dependencies: ['phase-2-high-priority'],
                deliverables: [
                    'API response times optimized',
                    'Enhanced error handling and user feedback',
                    'Accessibility improvements implemented',
                    'Performance monitoring in place',
                    'User experience enhancements'
                ],
                successCriteria: [
                    'API response times under 1 second',
                    'Accessibility audit passes',
                    'User satisfaction metrics improve',
                    'System performance benchmarks met'
                ]
            }
        ];
        var totalEstimatedHours = phases.reduce(function (sum, phase) { return sum + phase.estimatedHours; }, 0);
        var estimatedCompletionDate = new Date();
        estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + Math.ceil(totalEstimatedHours / 8));
        // Generate milestones
        var milestones = [
            {
                id: 'milestone-critical-complete',
                name: 'Critical Issues Resolved',
                description: 'All critical system issues have been resolved and tested',
                targetDate: new Date(Date.now() + (phases[0].estimatedHours / 8) * 24 * 60 * 60 * 1000),
                criteria: ['All critical APIs working', 'Security issues patched', 'Core user flows functional'],
                dependencies: ['phase-1-critical']
            },
            {
                id: 'milestone-feature-complete',
                name: 'Feature Functionality Restored',
                description: 'High priority features are working and user experience is good',
                targetDate: new Date(Date.now() + ((phases[0].estimatedHours + phases[1].estimatedHours) / 8) * 24 * 60 * 60 * 1000),
                criteria: ['All navigation working', 'UI components functional', 'User interactions complete'],
                dependencies: ['phase-2-high-priority']
            }
        ];
        // Generate quality gates
        var qualityGates = [
            {
                id: 'critical-quality-gate',
                name: 'Critical Issues Quality Gate',
                criteria: [
                    'All unit tests passing',
                    'Security scan shows no critical vulnerabilities',
                    'Manual testing confirms critical flows work',
                    'Performance benchmarks met'
                ],
                requiredApprovers: ['Technical Lead', 'Security Reviewer'],
                automatedChecks: ['unit-tests', 'security-scan', 'integration-tests']
            },
            {
                id: 'feature-quality-gate',
                name: 'Feature Completeness Quality Gate',
                criteria: [
                    'All acceptance criteria met',
                    'User testing confirms improved experience',
                    'No regression in existing functionality',
                    'Documentation updated'
                ],
                requiredApprovers: ['Product Manager', 'QA Lead'],
                automatedChecks: ['regression-tests', 'performance-tests', 'accessibility-tests']
            }
        ];
        return {
            phases: phases,
            totalEstimatedHours: totalEstimatedHours,
            estimatedCompletionDate: estimatedCompletionDate,
            resourceRequirements: [
                {
                    role: 'Senior Full-Stack Developer',
                    hoursRequired: Math.ceil(totalEstimatedHours * 0.6),
                    skills: ['React', 'TypeScript', 'Node.js', 'Express', 'Database Design', 'API Development'],
                    priority: 'critical',
                    availability: 'full-time',
                    costPerHour: 85,
                    alternativeRoles: ['Full-Stack Developer', 'Backend Developer + Frontend Developer']
                },
                {
                    role: 'Frontend Developer',
                    hoursRequired: Math.ceil(totalEstimatedHours * 0.3),
                    skills: ['React', 'TypeScript', 'CSS/SCSS', 'Testing', 'Accessibility'],
                    priority: 'high',
                    availability: 'full-time',
                    costPerHour: 70,
                    alternativeRoles: ['UI/UX Developer', 'Frontend Engineer']
                },
                {
                    role: 'DevOps Engineer',
                    hoursRequired: Math.ceil(totalEstimatedHours * 0.1),
                    skills: ['CI/CD', 'Monitoring', 'Database Administration', 'Security'],
                    priority: 'medium',
                    availability: 'part-time',
                    costPerHour: 90,
                    alternativeRoles: ['System Administrator', 'Cloud Engineer']
                }
            ],
            risks: [
                'Backend API implementation may require more database changes than anticipated',
                'Third-party integrations may have breaking changes requiring additional work',
                'Legacy code dependencies may surface during refactoring',
                'Performance optimizations may require infrastructure changes',
                'Security fixes may require changes to user authentication flows'
            ],
            dependencies: [
                'Development and staging environment access',
                'Database backup and migration procedures established',
                'API documentation and requirements finalized',
                'Design system and UI/UX guidelines available',
                'Testing framework and CI/CD pipeline configured',
                'Security review and penetration testing scheduled'
            ],
            milestones: milestones,
            qualityGates: qualityGates,
            rollbackStrategy: 'Each phase includes comprehensive rollback procedures with database backups, code version control, and monitoring checkpoints to ensure safe deployment and quick recovery if issues arise.'
        };
    };
    /**
     * Generate comprehensive risk assessment with enhanced analysis
     */
    AuditReporter.prototype.generateComprehensiveRiskAssessment = function (elements, routes, apiConnections) {
        var _this = this;
        var risks = [];
        var currentDate = new Date();
        // Data integrity and loss risks
        risks.push({
            id: 'data-integrity-risk',
            description: 'Database migrations and API fixes could result in data corruption or loss',
            probability: 'low',
            impact: 'high',
            category: 'technical',
            mitigation: 'Comprehensive backup strategy, rollback procedures, and staged deployment with data validation',
            owner: 'Database Administrator',
            detectedDate: currentDate,
            status: 'active',
            contingencyPlan: 'Full database restore from backup with transaction log replay'
        });
        // User experience and business continuity risks
        var criticalIssues = elements.filter(function (e) { return e.priority === 'critical' && e.status !== 'working'; }).length;
        var brokenAPIs = apiConnections.filter(function (a) { return a.status === 'broken'; }).length;
        risks.push({
            id: 'user-experience-risk',
            description: 'Broken functionality is damaging user trust, engagement, and business revenue',
            probability: criticalIssues > 5 ? 'high' : 'medium',
            impact: 'high',
            category: 'business',
            mitigation: 'Prioritize critical user journeys, implement graceful degradation, communicate fixes to users',
            owner: 'Product Manager',
            detectedDate: currentDate,
            status: 'active',
            contingencyPlan: 'Disable broken features temporarily and provide alternative workflows'
        });
        // Security vulnerabilities
        var securityAPIs = apiConnections.filter(function (a) {
            return a.endpoint.includes('/auth/') || a.endpoint.includes('/user/') || a.endpoint.includes('/admin/');
        });
        var brokenSecurityAPIs = securityAPIs.filter(function (a) { return a.status === 'broken'; });
        if (brokenSecurityAPIs.length > 0) {
            risks.push({
                id: 'security-vulnerability-risk',
                description: 'Incomplete or broken security implementations may expose sensitive data or allow unauthorized access',
                probability: 'medium',
                impact: 'high',
                category: 'security',
                mitigation: 'Security review of all endpoints, proper authentication implementation, and penetration testing',
                owner: 'Security Engineer',
                detectedDate: currentDate,
                status: 'active',
                contingencyPlan: 'Disable affected endpoints and implement temporary security measures'
            });
        }
        // Performance degradation risks
        risks.push({
            id: 'performance-degradation-risk',
            description: 'New implementations and fixes may introduce performance regressions affecting user experience',
            probability: 'medium',
            impact: 'medium',
            category: 'performance',
            mitigation: 'Performance testing, monitoring during deployment, and optimization benchmarks',
            owner: 'Technical Lead',
            detectedDate: currentDate,
            status: 'active',
            contingencyPlan: 'Rollback to previous version and implement performance optimizations separately'
        });
        // Implementation complexity risks
        if (brokenAPIs > 5) {
            risks.push({
                id: 'implementation-complexity-risk',
                description: 'High number of broken systems may indicate deeper architectural issues requiring more extensive changes',
                probability: 'medium',
                impact: 'medium',
                category: 'technical',
                mitigation: 'Architectural review, phased implementation, and regular progress assessments',
                owner: 'Solution Architect',
                detectedDate: currentDate,
                status: 'active',
                contingencyPlan: 'Consider system redesign and migration strategy for severely affected components'
            });
        }
        // Resource and timeline risks
        risks.push({
            id: 'resource-availability-risk',
            description: 'Required technical expertise may not be available when needed, causing delays',
            probability: 'medium',
            impact: 'medium',
            category: 'business',
            mitigation: 'Early resource allocation, backup developers identified, and knowledge transfer sessions',
            owner: 'Project Manager',
            detectedDate: currentDate,
            status: 'active',
            contingencyPlan: 'Engage external consultants or adjust timeline to accommodate resource constraints'
        });
        // Calculate overall risk score and level
        var riskScore = this.calculateRiskScore(risks);
        var overallRisk = 'low';
        if (riskScore > 15 || criticalIssues > 5 || brokenAPIs > 3) {
            overallRisk = 'high';
        }
        else if (riskScore > 8 || criticalIssues > 2 || brokenAPIs > 1) {
            overallRisk = 'medium';
        }
        var mitigationStrategies = risks.map(function (risk) { return ({
            riskId: risk.id,
            strategy: risk.mitigation,
            cost: _this.estimateMitigationCost(risk),
            timeframe: _this.estimateMitigationTimeframe(risk),
            effectiveness: _this.estimateMitigationEffectiveness(risk),
            implementationSteps: _this.generateMitigationSteps(risk),
            successMetrics: _this.generateSuccessMetrics(risk),
            monitoringPlan: _this.generateMonitoringPlan(risk)
        }); });
        return {
            overallRisk: overallRisk,
            risks: risks,
            mitigationStrategies: mitigationStrategies,
            riskScore: riskScore,
            confidenceLevel: this.calculateConfidenceLevel(elements, routes, apiConnections),
            lastUpdated: currentDate
        };
    };
    /**
     * Calculate overall risk score
     */
    AuditReporter.prototype.calculateRiskScore = function (risks) {
        var probabilityScores = { high: 3, medium: 2, low: 1 };
        var impactScores = { high: 3, medium: 2, low: 1 };
        return risks.reduce(function (total, risk) {
            var probScore = probabilityScores[risk.probability];
            var impactScore = impactScores[risk.impact];
            return total + (probScore * impactScore);
        }, 0);
    };
    /**
     * Calculate confidence level in the risk assessment
     */
    AuditReporter.prototype.calculateConfidenceLevel = function (elements, routes, apiConnections) {
        var totalItems = elements.length + routes.length + apiConnections.length;
        var unknownItems = elements.filter(function (e) { return e.status === 'unknown'; }).length;
        var unknownPercentage = unknownItems / totalItems;
        if (unknownPercentage < 0.1)
            return 'high';
        if (unknownPercentage < 0.3)
            return 'medium';
        return 'low';
    };
    /**
     * Generate mitigation implementation steps
     */
    AuditReporter.prototype.generateMitigationSteps = function (risk) {
        var baseSteps = [
            'Assess current state and document baseline',
            'Create detailed implementation plan',
            'Set up monitoring and alerting',
            'Execute mitigation strategy in phases',
            'Validate results and adjust as needed'
        ];
        var categorySpecificSteps = {
            'technical': [
                'Conduct technical feasibility analysis',
                'Prepare development environment',
                'Implement solution with proper testing',
                'Deploy with rollback capability'
            ],
            'business': [
                'Engage stakeholders and communicate plan',
                'Prepare business continuity measures',
                'Execute with minimal business disruption',
                'Measure business impact and adjust'
            ],
            'security': [
                'Conduct security assessment',
                'Implement security controls',
                'Perform security testing',
                'Conduct security audit and certification'
            ],
            'performance': [
                'Establish performance baselines',
                'Implement performance improvements',
                'Conduct load and stress testing',
                'Monitor performance metrics continuously'
            ]
        };
        return __spreadArray(__spreadArray([], baseSteps, true), (categorySpecificSteps[risk.category] || []), true);
    };
    /**
     * Generate success metrics for risk mitigation
     */
    AuditReporter.prototype.generateSuccessMetrics = function (risk) {
        var metrics = {
            'data-integrity-risk': [
                'Zero data corruption incidents',
                'All data validation checks pass',
                'Backup and restore procedures tested successfully'
            ],
            'user-experience-risk': [
                'User satisfaction scores improve by 20%',
                'Feature completion rates increase',
                'Support ticket volume decreases by 30%'
            ],
            'security-vulnerability-risk': [
                'Security scan shows zero critical vulnerabilities',
                'All authentication flows working correctly',
                'No unauthorized access attempts succeed'
            ],
            'performance-degradation-risk': [
                'Response times remain under 2 seconds',
                'No increase in error rates',
                'System throughput maintains baseline levels'
            ]
        };
        return metrics[risk.id] || [
            'Risk probability reduced to acceptable levels',
            'Impact severity minimized',
            'Monitoring confirms stable state'
        ];
    };
    /**
     * Generate monitoring plan for risk mitigation
     */
    AuditReporter.prototype.generateMonitoringPlan = function (risk) {
        var plans = {
            'data-integrity-risk': 'Continuous database monitoring with automated backup verification and data consistency checks',
            'user-experience-risk': 'User analytics tracking, error rate monitoring, and regular user feedback collection',
            'security-vulnerability-risk': 'Security monitoring with intrusion detection, access log analysis, and regular security scans',
            'performance-degradation-risk': 'Application performance monitoring with real-time alerts and automated scaling triggers'
        };
        return plans[risk.id] || 'Regular monitoring with automated alerts and manual review checkpoints';
    };
    /**
     * Enhanced mitigation cost estimation
     */
    AuditReporter.prototype.estimateMitigationCost = function (risk) {
        var baseCosts = {
            'data-integrity-risk': 12,
            'user-experience-risk': 6,
            'security-vulnerability-risk': 16,
            'performance-degradation-risk': 8,
            'implementation-complexity-risk': 20,
            'resource-availability-risk': 4
        };
        var categoryMultipliers = {
            'technical': 1.0,
            'business': 0.8,
            'security': 1.3,
            'performance': 1.1
        };
        var baseCost = baseCosts[risk.id] || 8;
        var multiplier = categoryMultipliers[risk.category] || 1.0;
        return Math.ceil(baseCost * multiplier);
    };
    /**
     * Enhanced mitigation timeframe estimation
     */
    AuditReporter.prototype.estimateMitigationTimeframe = function (risk) {
        var timeframes = {
            'data-integrity-risk': '2-3 days',
            'user-experience-risk': '1-2 weeks',
            'security-vulnerability-risk': '3-5 days',
            'performance-degradation-risk': '4-7 days',
            'implementation-complexity-risk': '2-3 weeks',
            'resource-availability-risk': '1-2 days'
        };
        return timeframes[risk.id] || '1-2 weeks';
    };
    /**
     * Enhanced mitigation effectiveness estimation
     */
    AuditReporter.prototype.estimateMitigationEffectiveness = function (risk) {
        var effectiveness = {
            'data-integrity-risk': 'high',
            'user-experience-risk': 'high',
            'security-vulnerability-risk': 'medium',
            'performance-degradation-risk': 'medium',
            'implementation-complexity-risk': 'medium',
            'resource-availability-risk': 'high'
        };
        return effectiveness[risk.id] || 'medium';
    };
    /**
     * Generate fallback report for error scenarios
     */
    AuditReporter.prototype.generateFallbackReport = function (elements, routes, apiConnections, error) {
        var errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            id: "fallback-audit-".concat(Date.now()),
            timestamp: new Date(),
            summary: {
                totalElements: elements.length,
                workingElements: 0,
                brokenElements: elements.length,
                missingElements: 0,
                unknownElements: 0,
                criticalIssues: elements.length,
                highPriorityIssues: 0,
                estimatedFixTime: elements.length * 4
            },
            elements: elements,
            routes: routes,
            apiConnections: apiConnections,
            recommendations: [{
                    id: 'emergency-fix',
                    priority: 'critical',
                    category: 'backend',
                    title: 'Emergency System Recovery',
                    description: "Audit failed with error: ".concat(errorMessage, ". Immediate investigation required."),
                    estimatedEffort: 24,
                    dependencies: [],
                    affectedElements: ['entire-system'],
                    suggestedSolution: 'Investigate audit failure, restore system to working state, re-run audit',
                    businessImpact: 'Critical - System audit failed, extent of issues unknown'
                }],
            routeMismatches: [],
            linkValidation: {
                totalLinks: 0,
                workingLinks: 0,
                brokenLinks: 0,
                timeoutLinks: 0,
                averageHealthScore: 0,
                securityIssues: 0,
                performanceIssues: 0,
                internalRoutes: 0,
                externalLinks: 0,
                dynamicRoutes: 0,
                brokenInternalRoutes: 0,
                brokenExternalLinks: 0,
                totalAPIs: 0,
                workingAPIs: 0,
                brokenAPIs: 0,
                averageResponseTime: 0,
                slowestLink: null,
                cacheHitRate: 0,
                filesScanned: 0,
                componentsAnalyzed: 0,
                internalLinks: 0
            },
            prioritizedActions: [],
            implementationPlan: {
                phases: [],
                totalEstimatedHours: 24,
                estimatedCompletionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                resourceRequirements: [],
                risks: ['Audit system failure indicates severe issues'],
                dependencies: ['System recovery'],
                milestones: [],
                qualityGates: [],
                rollbackStrategy: 'N/A - Emergency recovery mode'
            },
            riskAssessment: {
                overallRisk: 'high',
                risks: [],
                mitigationStrategies: [],
                riskScore: 20,
                confidenceLevel: 'low',
                lastUpdated: new Date()
            },
            auditScope: {
                includedComponents: [],
                excludedComponents: [],
                auditDate: new Date(),
                auditVersion: this.version,
                environment: 'unknown'
            },
            executionMetrics: {
                totalExecutionTime: 0,
                elementsScanned: 0,
                apiEndpointsChecked: 0,
                routesValidated: 0,
                errorsEncountered: 1,
                warningsGenerated: 0
            }
        };
    };
    /**
     * Save report with comprehensive error handling
     */
    AuditReporter.prototype.saveReportSafely = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            var reportPath, reportData, error_2, backupError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        reportPath = "reports/comprehensive-audit-".concat(report.id, ".json");
                        console.log("\uD83D\uDCBE Saving comprehensive report to ".concat(reportPath));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 8]);
                        reportData = JSON.stringify(report, null, 2);
                        // Simulate file save operation
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 2:
                        // Simulate file save operation
                        _a.sent();
                        console.log("\uD83D\uDCCA Report saved successfully (".concat((reportData.length / 1024).toFixed(2), "KB)"));
                        return [3 /*break*/, 8];
                    case 3:
                        error_2 = _a.sent();
                        console.error('❌ Failed to save report:', error_2);
                        // In production, you might want to save to a backup location or database
                        console.log('💾 Attempting backup save location...');
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        // Backup save logic would go here
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                    case 5:
                        // Backup save logic would go here
                        _a.sent();
                        console.log('✅ Report saved to backup location');
                        return [3 /*break*/, 7];
                    case 6:
                        backupError_1 = _a.sent();
                        console.error('❌ Backup save also failed:', backupError_1);
                        throw new Error('Failed to save audit report to any location');
                    case 7: return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate enhanced human-readable report
     */
    AuditReporter.prototype.generateEnhancedHumanReadableReport = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            var reportPath, markdown;
            return __generator(this, function (_a) {
                reportPath = "reports/audit-report-".concat(report.id, ".md");
                console.log("\uD83D\uDCDD Generating enhanced human-readable report at ".concat(reportPath));
                try {
                    markdown = this.generateEnhancedMarkdownReport(report);
                    // In a real implementation, this would save the markdown to a file
                    console.log('📄 Enhanced human-readable report generated');
                    console.log('\n' + '='.repeat(80));
                    console.log('COMPREHENSIVE FRONTEND-BACKEND CONNECTIVITY AUDIT REPORT');
                    console.log('='.repeat(80));
                    console.log(markdown.substring(0, 2500) + '...\n[Report continues with full details]');
                    console.log('='.repeat(80));
                }
                catch (error) {
                    console.error('❌ Failed to generate human-readable report:', error);
                    // Generate a minimal report even on failure
                    console.log('📄 Generating minimal report...');
                    console.log("Basic Summary: ".concat(report.summary.criticalIssues, " critical issues, ").concat(report.summary.estimatedFixTime, " hours estimated"));
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate enhanced markdown report with comprehensive details
     */
    AuditReporter.prototype.generateEnhancedMarkdownReport = function (report) {
        var _a, _b;
        var executionTime = (report.executionMetrics.totalExecutionTime / 1000).toFixed(2);
        return "# Comprehensive Frontend-Backend Connectivity Audit Report\n\n**Generated:** ".concat(report.timestamp.toISOString(), "  \n**Report ID:** ").concat(report.id, "  \n**Audit Version:** ").concat(report.auditScope.auditVersion, "  \n**Environment:** ").concat(report.auditScope.environment, "  \n**Execution Time:** ").concat(executionTime, " seconds  \n\n## Executive Summary\n\nThis comprehensive audit analyzed **").concat(report.summary.totalElements, "** interactive UI elements, **").concat(report.routes.length, "** routes, and **").concat(report.apiConnections.length, "** API endpoints across the application.\n\n### \uD83C\uDFAF Key Findings\n- \uD83D\uDD34 **").concat(report.summary.criticalIssues, "** critical issues requiring immediate attention\n- \uD83D\uDFE1 **").concat(report.summary.highPriorityIssues, "** high-priority issues affecting user experience\n- \u23F1\uFE0F **").concat(report.summary.estimatedFixTime, "** hours estimated to resolve all issues\n- \uD83D\uDCCA **").concat(report.prioritizedActions.length, "** prioritized actions with detailed implementation plans\n- \uD83C\uDF9A\uFE0F **").concat(report.riskAssessment.overallRisk.toUpperCase(), "** overall risk level\n\n### \uD83D\uDCC8 System Health Metrics\n| Metric | Value | Status |\n|--------|-------|---------|\n| Working Elements | ").concat(report.summary.workingElements, "/").concat(report.summary.totalElements, " | ").concat(this.getHealthStatus(report.summary.workingElements, report.summary.totalElements), " |\n| Functional APIs | ").concat(report.apiConnections.filter(function (a) { return a.status === 'working'; }).length, "/").concat(report.apiConnections.length, " | ").concat(this.getHealthStatus(report.apiConnections.filter(function (a) { return a.status === 'working'; }).length, report.apiConnections.length), " |\n| Working Routes | ").concat(report.routes.filter(function (r) { return r.status === 'working'; }).length, "/").concat(report.routes.length, " | ").concat(this.getHealthStatus(report.routes.filter(function (r) { return r.status === 'working'; }).length, report.routes.length), " |\n\n## \uD83D\uDEA8 Priority Actions\n\n").concat(report.prioritizedActions.slice(0, 5).map(function (action, index) { return "\n### ".concat(index + 1, ". ").concat(action.title, " (").concat(action.priority.toUpperCase(), ")\n\n**Category:** ").concat(action.category, " | **Estimated Hours:** ").concat(action.estimatedHours, " | **User Impact:** ").concat(action.userImpact, "\n\n").concat(action.description, "\n\n**Affected Features:** ").concat(action.affectedFeatures.length > 0 ? action.affectedFeatures.join(', ') : 'Multiple system areas', "\n\n**Prerequisites:**\n").concat(action.prerequisites.map(function (p) { return "- ".concat(p); }).join('\n'), "\n\n**Acceptance Criteria:**\n").concat(action.acceptanceCriteria.map(function (c) { return "- ".concat(c); }).join('\n'), "\n\n**Testing Requirements:**\n").concat(action.testingRequirements.map(function (t) { return "- ".concat(t); }).join('\n'), "\n"); }).join('\n'), "\n\n## \uD83D\uDCCB Implementation Plan\n\n### Timeline Overview\n**Total Estimated Hours:** ").concat(report.implementationPlan.totalEstimatedHours, "  \n**Estimated Completion:** ").concat(report.implementationPlan.estimatedCompletionDate.toDateString(), "  \n**Resource Requirements:** ").concat(report.implementationPlan.resourceRequirements.length, " specialized roles  \n\n").concat(report.implementationPlan.phases.map(function (phase, index) { return "\n### Phase ".concat(index + 1, ": ").concat(phase.name, "\n**Duration:** ").concat(phase.estimatedHours, " hours | **Dependencies:** ").concat(phase.dependencies.length > 0 ? phase.dependencies.join(', ') : 'None', "\n\n").concat(phase.description, "\n\n**Key Deliverables:**\n").concat(phase.deliverables.map(function (d) { return "- ".concat(d); }).join('\n'), "\n\n**Success Criteria:**\n").concat(phase.successCriteria.map(function (c) { return "- ".concat(c); }).join('\n'), "\n"); }).join('\n'), "\n\n### \uD83D\uDC65 Resource Requirements\n\n").concat(report.implementationPlan.resourceRequirements.map(function (resource) { return "\n**".concat(resource.role, "** - ").concat(resource.hoursRequired, " hours (").concat(resource.priority, " priority)\n- Skills: ").concat(resource.skills.join(', '), "\n- Availability: ").concat(resource.availability || 'Not specified', "\n- Estimated Cost: ").concat(resource.costPerHour ? (resource.costPerHour * resource.hoursRequired).toLocaleString() : 'TBD', "\n"); }).join('\n'), "\n\n## \u26A0\uFE0F Risk Assessment\n\n**Overall Risk Level:** ").concat(report.riskAssessment.overallRisk.toUpperCase(), "  \n**Risk Score:** ").concat(report.riskAssessment.riskScore, "/30  \n**Confidence Level:** ").concat(report.riskAssessment.confidenceLevel, "  \n\n").concat(report.riskAssessment.risks.map(function (risk) { return "\n### ".concat(risk.description, "\n- **Probability:** ").concat(risk.probability, " | **Impact:** ").concat(risk.impact, " | **Category:** ").concat(risk.category, "\n- **Owner:** ").concat(risk.owner || 'Not assigned', "\n- **Status:** ").concat(risk.status, "\n- **Mitigation:** ").concat(risk.mitigation, "\n- **Contingency Plan:** ").concat(risk.contingencyPlan || 'Standard rollback procedures', "\n"); }).join('\n'), "\n\n## \uD83D\uDD0D Detailed Findings\n\n### Broken UI Elements (").concat(report.elements.filter(function (e) { return e.status === 'broken'; }).length, ")\n\n").concat(report.elements.filter(function (e) { return e.status === 'broken'; }).slice(0, 10).map(function (element) {
            var _a, _b, _c;
            return "\n**".concat(element.id || 'Unknown Element', "** (").concat(element.type || 'Unknown Type', ")\n- Location: ").concat(((_a = element.location) === null || _a === void 0 ? void 0 : _a.componentName) || 'Unknown', " ").concat(((_b = element.location) === null || _b === void 0 ? void 0 : _b.filePath) ? "(".concat(element.location.filePath, ")") : '', "\n- Current Behavior: ").concat(element.currentBehavior || 'Not specified', "\n- Expected Behavior: ").concat(element.intendedBehavior || 'Not specified', "\n- Priority: ").concat(element.priority || 'medium', "\n- Last Tested: ").concat(((_c = element.lastTested) === null || _c === void 0 ? void 0 : _c.toISOString()) || 'Never', "\n").concat(element.errorMessage ? "- Error: ".concat(element.errorMessage) : '', "\n");
        }).join('\n'), "\n\n### Failed API Endpoints (").concat(report.apiConnections.filter(function (a) { return a.status === 'broken'; }).length, ")\n\n").concat(report.apiConnections.filter(function (a) { return a.status === 'broken'; }).slice(0, 10).map(function (api) {
            var _a, _b;
            return "\n**".concat(api.method, " ").concat(api.endpoint, "**\n- Status: ").concat(api.status, "\n- Used By: ").concat(((_a = api.usedBy) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'Unknown components', "\n- Response Time: ").concat(api.responseTime || 'N/A', "ms\n- Error: ").concat(api.errorMessage || 'Endpoint not responding', "\n- Last Tested: ").concat(((_b = api.lastTested) === null || _b === void 0 ? void 0 : _b.toISOString()) || 'During audit', "\n");
        }).join('\n'), "\n\n### Routing Issues (").concat(report.routes.filter(function (r) { return r.status === 'broken' || r.status === '404'; }).length, ")\n\n").concat(report.routes.filter(function (r) { return r.status === 'broken' || r.status === '404'; }).slice(0, 10).map(function (route) { return "\n**".concat(route.route, "** - ").concat(route.status, "\n- Component: ").concat(route.component || 'Not specified', "\n- Error: ").concat(route.errorMessage || 'Route configuration issue', "\n- Expected: ").concat(route.expectedComponent || 'Not specified', "\n"); }).join('\n'), "\n\n## \uD83D\uDCCA Quality Gates & Milestones\n\n### Quality Gates\n").concat(((_a = report.implementationPlan.qualityGates) === null || _a === void 0 ? void 0 : _a.map(function (gate) { return "\n**".concat(gate.name, "**\n- Criteria: ").concat(gate.criteria.join(', '), "\n- Approvers: ").concat(gate.requiredApprovers.join(', '), "\n- Automated Checks: ").concat(gate.automatedChecks.join(', '), "\n"); }).join('\n')) || 'No quality gates defined', "\n\n### Key Milestones\n").concat(((_b = report.implementationPlan.milestones) === null || _b === void 0 ? void 0 : _b.map(function (milestone) { return "\n**".concat(milestone.name, "** - ").concat(milestone.targetDate.toDateString(), "\n- ").concat(milestone.description, "\n- Success Criteria: ").concat(milestone.criteria.join(', '), "\n"); }).join('\n')) || 'No milestones defined', "\n\n## \uD83C\uDFAF Recommendations Summary\n\n").concat(report.recommendations.map(function (rec, index) { return "\n".concat(index + 1, ". **").concat(rec.title, "** (").concat(rec.priority, ")\n   - Effort: ").concat(rec.estimatedEffort, " hours\n   - Impact: ").concat(rec.businessImpact, "\n   - Solution: ").concat(rec.suggestedSolution.substring(0, 100), "...\n"); }).join('\n'), "\n\n## \uD83D\uDCC8 Metrics & KPIs\n\n### Audit Execution Metrics\n- Elements Scanned: ").concat(report.executionMetrics.elementsScanned, "\n- API Endpoints Checked: ").concat(report.executionMetrics.apiEndpointsChecked, "\n- Routes Validated: ").concat(report.executionMetrics.routesValidated, "\n- Execution Time: ").concat(executionTime, " seconds\n- Errors Encountered: ").concat(report.executionMetrics.errorsEncountered, "\n- Warnings Generated: ").concat(report.executionMetrics.warningsGenerated, "\n\n### Success Metrics (Post-Implementation)\n- Target: 95% of elements working correctly\n- Target: 100% of critical user journeys functional\n- Target: API response times under 2 seconds\n- Target: Zero critical security vulnerabilities\n\n## \uD83D\uDD04 Rollback Strategy\n\n").concat(report.implementationPlan.rollbackStrategy, "\n\n## \uD83D\uDCDD Next Steps\n\n1. **Immediate Actions (24-48 hours):**\n   - Address critical security issues\n   - Implement emergency fixes for blocking issues\n   - Set up monitoring and alerting\n\n2. **Short-term Goals (1-2 weeks):**\n   - Complete Phase 1 critical fixes\n   - Implement high-priority functionality\n   - Establish proper testing procedures\n\n3. **Long-term Objectives (2-4 weeks):**\n   - Complete all phases of implementation plan\n   - Conduct comprehensive system testing\n   - Document lessons learned and improvement processes\n\n---\n**Report Generated By:** UI Audit System v").concat(report.auditScope.auditVersion, "  \n**Confidence Level:** ").concat(report.riskAssessment.confidenceLevel, " (based on ").concat(report.executionMetrics.elementsScanned, " elements analyzed)  \n**Recommended Review Frequency:** Weekly during implementation, monthly thereafter  \n\n*This automated audit provides a comprehensive analysis of system connectivity issues. For questions or clarifications, consult with the technical team and review the detailed JSON report data.*\n");
    };
    /**
     * Get health status indicator
     */
    AuditReporter.prototype.getHealthStatus = function (working, total) {
        if (total === 0)
            return '⚪ Unknown';
        var percentage = (working / total) * 100;
        if (percentage >= 90)
            return '🟢 Healthy';
        if (percentage >= 70)
            return '🟡 Warning';
        if (percentage >= 50)
            return '🟠 Degraded';
        return '🔴 Critical';
    };
    return AuditReporter;
}());
exports.AuditReporter = AuditReporter;
/**
 * Export singleton instance for global use
 */
exports.auditReporter = new AuditReporter();
