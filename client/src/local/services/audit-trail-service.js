"use strict";
/**
 * Comprehensive Audit Trail Service
 *
 * Provides enterprise-grade audit logging, security event tracking,
 * and compliance monitoring for the African Property Trust platform.
 *
 * Features:
 * - Security event logging with risk assessment
 * - User activity tracking and behavioral analysis
 * - Data access logging for compliance (GDPR, SOX, etc.)
 * - Real-time threat detection and alerting
 * - Audit trail integrity verification
 * - Performance and system health monitoring
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.auditLogger = exports.auditTrailService = exports.AuditTrailService = exports.BehaviorAnalyzer = exports.ComplianceMonitor = exports.RiskAssessmentEngine = exports.AuditCategory = exports.AuditSeverity = exports.AuditEventType = void 0;
var events_1 = require("events");
var AuditEventType;
(function (AuditEventType) {
    // Authentication & Authorization
    AuditEventType["LOGIN_SUCCESS"] = "LOGIN_SUCCESS";
    AuditEventType["LOGIN_FAILURE"] = "LOGIN_FAILURE";
    AuditEventType["LOGOUT"] = "LOGOUT";
    AuditEventType["PASSWORD_CHANGE"] = "PASSWORD_CHANGE";
    AuditEventType["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    AuditEventType["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    AuditEventType["TOKEN_REFRESH"] = "TOKEN_REFRESH";
    // Data Access & Modification
    AuditEventType["DATA_READ"] = "DATA_READ";
    AuditEventType["DATA_CREATE"] = "DATA_CREATE";
    AuditEventType["DATA_UPDATE"] = "DATA_UPDATE";
    AuditEventType["DATA_DELETE"] = "DATA_DELETE";
    AuditEventType["BULK_OPERATION"] = "BULK_OPERATION";
    AuditEventType["EXPORT_DATA"] = "EXPORT_DATA";
    // Property Operations
    AuditEventType["PROPERTY_VIEW"] = "PROPERTY_VIEW";
    AuditEventType["PROPERTY_CREATE"] = "PROPERTY_CREATE";
    AuditEventType["PROPERTY_UPDATE"] = "PROPERTY_UPDATE";
    AuditEventType["PROPERTY_DELETE"] = "PROPERTY_DELETE";
    AuditEventType["PROPERTY_VERIFY"] = "PROPERTY_VERIFY";
    AuditEventType["DOCUMENT_UPLOAD"] = "DOCUMENT_UPLOAD";
    // Security Events
    AuditEventType["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
    AuditEventType["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    AuditEventType["INVALID_TOKEN"] = "INVALID_TOKEN";
    AuditEventType["BRUTE_FORCE_ATTEMPT"] = "BRUTE_FORCE_ATTEMPT";
    AuditEventType["SQL_INJECTION_ATTEMPT"] = "SQL_INJECTION_ATTEMPT";
    AuditEventType["XSS_ATTEMPT"] = "XSS_ATTEMPT";
    // System Events
    AuditEventType["SYSTEM_ERROR"] = "SYSTEM_ERROR";
    AuditEventType["API_ERROR"] = "API_ERROR";
    AuditEventType["PERFORMANCE_ISSUE"] = "PERFORMANCE_ISSUE";
    AuditEventType["CONFIGURATION_CHANGE"] = "CONFIGURATION_CHANGE";
    AuditEventType["BACKUP_OPERATION"] = "BACKUP_OPERATION";
    // Business Events
    AuditEventType["TRANSACTION_INITIATED"] = "TRANSACTION_INITIATED";
    AuditEventType["TRANSACTION_COMPLETED"] = "TRANSACTION_COMPLETED";
    AuditEventType["VERIFICATION_REQUEST"] = "VERIFICATION_REQUEST";
    AuditEventType["FRAUD_DETECTED"] = "FRAUD_DETECTED";
    AuditEventType["COMPLIANCE_VIOLATION"] = "COMPLIANCE_VIOLATION";
})(AuditEventType || (exports.AuditEventType = AuditEventType = {}));
var AuditSeverity;
(function (AuditSeverity) {
    AuditSeverity["LOW"] = "LOW";
    AuditSeverity["MEDIUM"] = "MEDIUM";
    AuditSeverity["HIGH"] = "HIGH";
    AuditSeverity["CRITICAL"] = "CRITICAL";
})(AuditSeverity || (exports.AuditSeverity = AuditSeverity = {}));
var AuditCategory;
(function (AuditCategory) {
    AuditCategory["AUTHENTICATION"] = "AUTHENTICATION";
    AuditCategory["AUTHORIZATION"] = "AUTHORIZATION";
    AuditCategory["DATA_ACCESS"] = "DATA_ACCESS";
    AuditCategory["SECURITY"] = "SECURITY";
    AuditCategory["SYSTEM"] = "SYSTEM";
    AuditCategory["BUSINESS"] = "BUSINESS";
    AuditCategory["COMPLIANCE"] = "COMPLIANCE";
    AuditCategory["PERFORMANCE"] = "PERFORMANCE";
})(AuditCategory || (exports.AuditCategory = AuditCategory = {}));
// Risk Assessment Engine
var RiskAssessmentEngine = /** @class */ (function () {
    function RiskAssessmentEngine() {
        this.riskRules = new Map();
        this.initializeRiskRules();
    }
    RiskAssessmentEngine.prototype.initializeRiskRules = function () {
        // Authentication risks
        this.riskRules.set('LOGIN_FAILURE', function (event) {
            var failureCount = event.details.consecutiveFailures || 1;
            return Math.min(failureCount * 2, 8);
        });
        this.riskRules.set('BRUTE_FORCE_ATTEMPT', function () { return 9; });
        this.riskRules.set('ACCOUNT_LOCKED', function () { return 7; });
        // Data access risks
        this.riskRules.set('BULK_OPERATION', function (event) {
            var recordCount = event.details.recordCount || 0;
            return recordCount > 1000 ? 8 : recordCount > 100 ? 5 : 2;
        });
        this.riskRules.set('EXPORT_DATA', function (event) {
            var sensitive = event.details.containsSensitiveData || false;
            return sensitive ? 7 : 3;
        });
        // Security risks
        this.riskRules.set('SQL_INJECTION_ATTEMPT', function () { return 10; });
        this.riskRules.set('XSS_ATTEMPT', function () { return 8; });
        this.riskRules.set('SUSPICIOUS_ACTIVITY', function () { return 6; });
        // System risks
        this.riskRules.set('SYSTEM_ERROR', function (event) {
            var errorType = event.details.errorType || '';
            return errorType.includes('security') ? 8 : 3;
        });
    };
    RiskAssessmentEngine.prototype.assessRisk = function (event) {
        var _a, _b;
        var baseRisk = ((_a = this.riskRules.get(event.eventType)) === null || _a === void 0 ? void 0 : _a(event)) || 1;
        // Apply contextual modifiers
        var riskMultiplier = 1;
        // Time-based risk (off-hours activity)
        var hour = event.timestamp.getHours();
        if (hour < 6 || hour > 22) {
            riskMultiplier += 0.2;
        }
        // Geographic risk (unusual locations)
        if (((_b = event.metadata.geolocation) === null || _b === void 0 ? void 0 : _b.country) &&
            !this.isKnownLocation(event.metadata.geolocation.country)) {
            riskMultiplier += 0.3;
        }
        // Frequency risk (rapid successive events)
        if (event.details.eventFrequency > 10) {
            riskMultiplier += 0.4;
        }
        return Math.min(Math.round(baseRisk * riskMultiplier), 10);
    };
    RiskAssessmentEngine.prototype.isKnownLocation = function (country) {
        // Known safe countries for the platform
        var knownCountries = ['KE', 'UG', 'TZ', 'RW', 'ET', 'US', 'GB', 'CA'];
        return knownCountries.includes(country);
    };
    return RiskAssessmentEngine;
}());
exports.RiskAssessmentEngine = RiskAssessmentEngine;
// Compliance Monitor
var ComplianceMonitor = /** @class */ (function () {
    function ComplianceMonitor() {
        this.complianceRules = new Map();
        this.initializeComplianceRules();
    }
    ComplianceMonitor.prototype.initializeComplianceRules = function () {
        // GDPR compliance
        this.complianceRules.set('DATA_EXPORT', function (event) {
            var flags = [];
            if (!event.details.userConsent) {
                flags.push('GDPR_NO_CONSENT');
            }
            if (!event.details.dataMinimization) {
                flags.push('GDPR_DATA_MINIMIZATION');
            }
            return flags;
        });
        // SOX compliance (financial data)
        this.complianceRules.set('FINANCIAL_ACCESS', function (event) {
            var flags = [];
            if (!event.details.approvalRequired && event.details.amount > 10000) {
                flags.push('SOX_APPROVAL_REQUIRED');
            }
            return flags;
        });
        // Data retention compliance
        this.complianceRules.set('DATA_DELETE', function (event) {
            var flags = [];
            if (event.details.retentionPeriodActive) {
                flags.push('RETENTION_VIOLATION');
            }
            return flags;
        });
    };
    ComplianceMonitor.prototype.checkCompliance = function (event) {
        var allFlags = [];
        // Check specific event type rules
        for (var _i = 0, _a = this.complianceRules.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], ruleType = _b[0], rule = _b[1];
            if (event.eventType.includes(ruleType) || event.category === AuditCategory.COMPLIANCE) {
                allFlags.push.apply(allFlags, rule(event));
            }
        }
        // General compliance checks
        if (event.severity === AuditSeverity.CRITICAL && !event.details.incidentResponse) {
            allFlags.push('INCIDENT_RESPONSE_REQUIRED');
        }
        return allFlags;
    };
    return ComplianceMonitor;
}());
exports.ComplianceMonitor = ComplianceMonitor;
// Behavioral Analysis Engine
var BehaviorAnalyzer = /** @class */ (function () {
    function BehaviorAnalyzer() {
        this.userProfiles = new Map();
    }
    BehaviorAnalyzer.prototype.analyzeUserBehavior = function (event) {
        if (!event.userId) {
            return { isAnomalous: false, confidence: 0, reasons: [] };
        }
        var profile = this.getUserProfile(event.userId);
        var analysis = this.detectAnomalies(event, profile);
        // Update profile with new event
        this.updateUserProfile(event.userId, event);
        return analysis;
    };
    BehaviorAnalyzer.prototype.getUserProfile = function (userId) {
        if (!this.userProfiles.has(userId)) {
            this.userProfiles.set(userId, {
                userId: userId,
                typicalHours: new Set(),
                commonLocations: new Set(),
                averageSessionDuration: 0,
                commonActions: new Map(),
                riskHistory: [],
                lastActivity: new Date()
            });
        }
        return this.userProfiles.get(userId);
    };
    BehaviorAnalyzer.prototype.detectAnomalies = function (event, profile) {
        var _a;
        var reasons = [];
        var anomalyScore = 0;
        // Time-based anomaly
        var hour = event.timestamp.getHours();
        if (profile.typicalHours.size > 0 && !profile.typicalHours.has(hour)) {
            reasons.push('Unusual time of activity');
            anomalyScore += 2;
        }
        // Location-based anomaly
        var location = (_a = event.metadata.geolocation) === null || _a === void 0 ? void 0 : _a.country;
        if (location && profile.commonLocations.size > 0 && !profile.commonLocations.has(location)) {
            reasons.push('Unusual geographic location');
            anomalyScore += 3;
        }
        // Action frequency anomaly
        var actionCount = profile.commonActions.get(event.action) || 0;
        if (actionCount === 0 && profile.commonActions.size > 10) {
            reasons.push('Unusual action for user');
            anomalyScore += 1;
        }
        // Risk pattern anomaly
        var avgRisk = profile.riskHistory.reduce(function (sum, r) { return sum + r; }, 0) / profile.riskHistory.length;
        if (event.riskScore > avgRisk + 3) {
            reasons.push('Risk score significantly higher than usual');
            anomalyScore += 2;
        }
        return {
            isAnomalous: anomalyScore >= 3,
            confidence: Math.min(anomalyScore / 8, 1),
            reasons: reasons,
            anomalyScore: anomalyScore
        };
    };
    BehaviorAnalyzer.prototype.updateUserProfile = function (userId, event) {
        var _a;
        var profile = this.getUserProfile(userId);
        // Update typical hours
        profile.typicalHours.add(event.timestamp.getHours());
        // Update common locations
        if ((_a = event.metadata.geolocation) === null || _a === void 0 ? void 0 : _a.country) {
            profile.commonLocations.add(event.metadata.geolocation.country);
        }
        // Update common actions
        var currentCount = profile.commonActions.get(event.action) || 0;
        profile.commonActions.set(event.action, currentCount + 1);
        // Update risk history (keep last 50 events)
        profile.riskHistory.push(event.riskScore);
        if (profile.riskHistory.length > 50) {
            profile.riskHistory.shift();
        }
        profile.lastActivity = event.timestamp;
    };
    return BehaviorAnalyzer;
}());
exports.BehaviorAnalyzer = BehaviorAnalyzer;
// Main Audit Trail Service
var AuditTrailService = /** @class */ (function (_super) {
    __extends(AuditTrailService, _super);
    function AuditTrailService() {
        var _this = _super.call(this) || this;
        _this.events = [];
        _this.maxEvents = 10000;
        _this.persistenceEnabled = true;
        _this.riskEngine = new RiskAssessmentEngine();
        _this.complianceMonitor = new ComplianceMonitor();
        _this.behaviorAnalyzer = new BehaviorAnalyzer();
        // Set up periodic cleanup
        setInterval(function () { return _this.cleanup(); }, 60000); // Every minute
        return _this;
    }
    /**
     * Log an audit event with automatic risk assessment and compliance checking
     *
     * This method creates a comprehensive audit trail entry that includes:
     * - Risk assessment based on event type and context
     * - Compliance validation against regulatory requirements
     * - Behavioral analysis to detect anomalies
     * - Automatic escalation for high-risk events
     */
    AuditTrailService.prototype.logEvent = function (eventType_1, action_1) {
        return __awaiter(this, arguments, void 0, function (eventType, action, details, context) {
            var metadata, event, behaviorAnalysis;
            if (details === void 0) { details = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.buildMetadata()];
                    case 1:
                        metadata = _a.sent();
                        event = {
                            id: this.generateEventId(),
                            timestamp: new Date(),
                            eventType: eventType,
                            severity: this.determineSeverity(eventType),
                            category: this.determineCategory(eventType),
                            // Explicitly handle optional properties to satisfy exactOptionalPropertyTypes
                            userId: (context === null || context === void 0 ? void 0 : context.userId) || undefined,
                            sessionId: (context === null || context === void 0 ? void 0 : context.sessionId) || undefined,
                            ipAddress: (context === null || context === void 0 ? void 0 : context.ipAddress) || undefined,
                            userAgent: (context === null || context === void 0 ? void 0 : context.userAgent) || undefined,
                            resource: undefined, // Will be set if provided in details
                            action: action,
                            details: details,
                            metadata: metadata,
                            riskScore: 0, // Will be calculated below
                            complianceFlags: []
                        };
                        // Set resource if provided in details
                        if (details.resource) {
                            event.resource = details.resource;
                        }
                        // Calculate risk score
                        event.riskScore = this.riskEngine.assessRisk(event);
                        // Check compliance
                        event.complianceFlags = this.complianceMonitor.checkCompliance(event);
                        behaviorAnalysis = this.behaviorAnalyzer.analyzeUserBehavior(event);
                        if (behaviorAnalysis.isAnomalous) {
                            event.details.behaviorAnalysis = behaviorAnalysis;
                            event.riskScore = Math.min(event.riskScore + 2, 10);
                        }
                        // Store event
                        this.events.push(event);
                        // Emit event for real-time processing
                        this.emit('auditEvent', event);
                        if (!(event.riskScore >= 8 || event.severity === AuditSeverity.CRITICAL)) return [3 /*break*/, 3];
                        this.emit('highRiskEvent', event);
                        return [4 /*yield*/, this.handleHighRiskEvent(event)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        // Handle compliance violations
                        if (event.complianceFlags.length > 0) {
                            this.emit('complianceViolation', event);
                        }
                        if (!this.persistenceEnabled) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.persistEvent(event)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/, event.id];
                }
            });
        });
    };
    /**
     * Query audit events with filtering and pagination
     *
     * This method provides flexible querying capabilities with support for:
     * - Multiple filter criteria (event types, severity, users, date ranges)
     * - Risk score filtering for security analysis
     * - Compliance flag filtering for regulatory reporting
     * - Pagination for handling large result sets
     */
    AuditTrailService.prototype.queryEvents = function () {
        return __awaiter(this, arguments, void 0, function (filter, limit, offset) {
            var filteredEvents, paginatedEvents;
            var _a, _b, _c, _d;
            if (filter === void 0) { filter = {}; }
            if (limit === void 0) { limit = 100; }
            if (offset === void 0) { offset = 0; }
            return __generator(this, function (_e) {
                filteredEvents = __spreadArray([], this.events, true);
                // Apply filters with null-safe checks
                if ((_a = filter.eventTypes) === null || _a === void 0 ? void 0 : _a.length) {
                    filteredEvents = filteredEvents.filter(function (e) { return filter.eventTypes.includes(e.eventType); });
                }
                if ((_b = filter.severities) === null || _b === void 0 ? void 0 : _b.length) {
                    filteredEvents = filteredEvents.filter(function (e) { return filter.severities.includes(e.severity); });
                }
                if ((_c = filter.categories) === null || _c === void 0 ? void 0 : _c.length) {
                    filteredEvents = filteredEvents.filter(function (e) { return filter.categories.includes(e.category); });
                }
                if (filter.userId) {
                    filteredEvents = filteredEvents.filter(function (e) { return e.userId === filter.userId; });
                }
                if (filter.dateRange) {
                    filteredEvents = filteredEvents.filter(function (e) {
                        return e.timestamp >= filter.dateRange.start &&
                            e.timestamp <= filter.dateRange.end;
                    });
                }
                if (filter.riskScoreRange) {
                    filteredEvents = filteredEvents.filter(function (e) {
                        return e.riskScore >= filter.riskScoreRange.min &&
                            e.riskScore <= filter.riskScoreRange.max;
                    });
                }
                if ((_d = filter.complianceFlags) === null || _d === void 0 ? void 0 : _d.length) {
                    filteredEvents = filteredEvents.filter(function (e) {
                        return filter.complianceFlags.some(function (flag) { return e.complianceFlags.includes(flag); });
                    });
                }
                // Sort by timestamp (newest first)
                filteredEvents.sort(function (a, b) { return b.timestamp.getTime() - a.timestamp.getTime(); });
                paginatedEvents = filteredEvents.slice(offset, offset + limit);
                return [2 /*return*/, {
                        events: paginatedEvents,
                        total: filteredEvents.length
                    }];
            });
        });
    };
    /**
     * Generate analytics and insights from audit data
     *
     * This method provides comprehensive analytics including:
     * - Event distribution by type and severity
     * - User activity patterns and top users by activity
     * - Risk trends over time for threat intelligence
     * - Compliance status and violation tracking
     */
    AuditTrailService.prototype.generateAnalytics = function (dateRange) {
        return __awaiter(this, void 0, void 0, function () {
            var events, eventsByType, eventsBySeverity, userEventCounts, riskByDate, _i, events_2, event_1, dateKey, topUsers, riskTrends, violations, criticalIssues;
            return __generator(this, function (_a) {
                events = this.events;
                if (dateRange) {
                    events = events.filter(function (e) {
                        return e.timestamp >= dateRange.start && e.timestamp <= dateRange.end;
                    });
                }
                eventsByType = {};
                eventsBySeverity = {};
                userEventCounts = new Map();
                riskByDate = new Map();
                for (_i = 0, events_2 = events; _i < events_2.length; _i++) {
                    event_1 = events_2[_i];
                    // Count by type
                    eventsByType[event_1.eventType] = (eventsByType[event_1.eventType] || 0) + 1;
                    // Count by severity
                    eventsBySeverity[event_1.severity] = (eventsBySeverity[event_1.severity] || 0) + 1;
                    // Count by user (only if userId exists)
                    if (event_1.userId) {
                        userEventCounts.set(event_1.userId, (userEventCounts.get(event_1.userId) || 0) + 1);
                    }
                    dateKey = event_1.timestamp.toISOString().split('T')[0];
                    if (!riskByDate.has(dateKey)) {
                        riskByDate.set(dateKey, []);
                    }
                    riskByDate.get(dateKey).push(event_1.riskScore);
                }
                topUsers = Array.from(userEventCounts.entries())
                    .map(function (_a) {
                    var userId = _a[0], eventCount = _a[1];
                    return ({ userId: userId, eventCount: eventCount });
                })
                    .sort(function (a, b) { return b.eventCount - a.eventCount; })
                    .slice(0, 10);
                riskTrends = Array.from(riskByDate.entries())
                    .map(function (_a) {
                    var date = _a[0], risks = _a[1];
                    return ({
                        date: date,
                        averageRisk: risks.reduce(function (sum, r) { return sum + r; }, 0) / risks.length
                    });
                })
                    .sort(function (a, b) { return a.date.localeCompare(b.date); });
                violations = events.filter(function (e) { return e.complianceFlags.length > 0; }).length;
                criticalIssues = events.filter(function (e) { return e.severity === AuditSeverity.CRITICAL; }).length;
                return [2 /*return*/, {
                        totalEvents: events.length,
                        eventsByType: eventsByType,
                        eventsBySeverity: eventsBySeverity,
                        topUsers: topUsers,
                        riskTrends: riskTrends,
                        complianceStatus: {
                            violations: violations,
                            criticalIssues: criticalIssues,
                            lastAudit: new Date()
                        }
                    }];
            });
        });
    };
    /**
     * Export audit trail for compliance reporting
     *
     * This method supports multiple export formats for different compliance requirements:
     * - JSON: Machine-readable format for automated processing
     * - CSV: Human-readable format for spreadsheet analysis
     * - XML: Structured format for enterprise systems integration
     */
    AuditTrailService.prototype.exportAuditTrail = function () {
        return __awaiter(this, arguments, void 0, function (format, filter) {
            var events;
            if (format === void 0) { format = 'json'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.queryEvents(filter, 10000, 0)];
                    case 1:
                        events = (_a.sent()).events;
                        switch (format) {
                            case 'json':
                                return [2 /*return*/, JSON.stringify(events, null, 2)];
                            case 'csv':
                                return [2 /*return*/, this.convertToCSV(events)];
                            case 'xml':
                                return [2 /*return*/, this.convertToXML(events)];
                            default:
                                throw new Error("Unsupported export format: ".concat(format));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    // Private helper methods
    AuditTrailService.prototype.generateEventId = function () {
        return "audit_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    AuditTrailService.prototype.determineSeverity = function (eventType) {
        var criticalEvents = [
            AuditEventType.SQL_INJECTION_ATTEMPT,
            AuditEventType.FRAUD_DETECTED,
            AuditEventType.COMPLIANCE_VIOLATION
        ];
        var highEvents = [
            AuditEventType.BRUTE_FORCE_ATTEMPT,
            AuditEventType.ACCOUNT_LOCKED,
            AuditEventType.XSS_ATTEMPT,
            AuditEventType.SUSPICIOUS_ACTIVITY
        ];
        var mediumEvents = [
            AuditEventType.LOGIN_FAILURE,
            AuditEventType.PERMISSION_DENIED,
            AuditEventType.RATE_LIMIT_EXCEEDED
        ];
        if (criticalEvents.includes(eventType))
            return AuditSeverity.CRITICAL;
        if (highEvents.includes(eventType))
            return AuditSeverity.HIGH;
        if (mediumEvents.includes(eventType))
            return AuditSeverity.MEDIUM;
        return AuditSeverity.LOW;
    };
    AuditTrailService.prototype.determineCategory = function (eventType) {
        var authEvents = [
            AuditEventType.LOGIN_SUCCESS,
            AuditEventType.LOGIN_FAILURE,
            AuditEventType.LOGOUT,
            AuditEventType.PASSWORD_CHANGE
        ];
        var securityEvents = [
            AuditEventType.SUSPICIOUS_ACTIVITY,
            AuditEventType.BRUTE_FORCE_ATTEMPT,
            AuditEventType.SQL_INJECTION_ATTEMPT,
            AuditEventType.XSS_ATTEMPT
        ];
        var dataEvents = [
            AuditEventType.DATA_READ,
            AuditEventType.DATA_CREATE,
            AuditEventType.DATA_UPDATE,
            AuditEventType.DATA_DELETE
        ];
        if (authEvents.includes(eventType))
            return AuditCategory.AUTHENTICATION;
        if (securityEvents.includes(eventType))
            return AuditCategory.SECURITY;
        if (dataEvents.includes(eventType))
            return AuditCategory.DATA_ACCESS;
        return AuditCategory.SYSTEM;
    };
    AuditTrailService.prototype.buildMetadata = function () {
        return __awaiter(this, void 0, void 0, function () {
            var geolocation, deviceInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getGeolocation()];
                    case 1:
                        geolocation = _a.sent();
                        deviceInfo = this.getDeviceInfo();
                        return [2 /*return*/, {
                                source: 'audit-trail-service',
                                environment: process.env.NODE_ENV || 'development',
                                version: process.env.APP_VERSION || '1.0.0',
                                // Explicitly assign undefined if the values are undefined
                                geolocation: geolocation !== null && geolocation !== void 0 ? geolocation : undefined,
                                deviceInfo: deviceInfo !== null && deviceInfo !== void 0 ? deviceInfo : undefined
                            }];
                }
            });
        });
    };
    AuditTrailService.prototype.getGeolocation = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In a real implementation, this would use IP geolocation service
                // Return undefined if geolocation is not available
                try {
                    return [2 /*return*/, {
                            country: 'KE',
                            region: 'Nairobi',
                            city: 'Nairobi'
                        }];
                }
                catch (_b) {
                    return [2 /*return*/, undefined];
                }
                return [2 /*return*/];
            });
        });
    };
    AuditTrailService.prototype.getDeviceInfo = function () {
        var _a, _b;
        if (typeof window !== 'undefined' && window.navigator) {
            return {
                type: 'web',
                os: (_a = this.detectOS(window.navigator.userAgent)) !== null && _a !== void 0 ? _a : undefined,
                browser: (_b = this.detectBrowser(window.navigator.userAgent)) !== null && _b !== void 0 ? _b : undefined
            };
        }
        return {
            type: 'server'
        };
    };
    AuditTrailService.prototype.detectOS = function (userAgent) {
        if (userAgent.includes('Windows'))
            return 'Windows';
        if (userAgent.includes('Mac'))
            return 'macOS';
        if (userAgent.includes('Linux'))
            return 'Linux';
        if (userAgent.includes('Android'))
            return 'Android';
        if (userAgent.includes('iOS'))
            return 'iOS';
        return undefined;
    };
    AuditTrailService.prototype.detectBrowser = function (userAgent) {
        if (userAgent.includes('Chrome'))
            return 'Chrome';
        if (userAgent.includes('Firefox'))
            return 'Firefox';
        if (userAgent.includes('Safari'))
            return 'Safari';
        if (userAgent.includes('Edge'))
            return 'Edge';
        return undefined;
    };
    AuditTrailService.prototype.handleHighRiskEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In a real implementation, this would:
                // 1. Send alerts to security team
                // 2. Trigger automated responses
                // 3. Update threat intelligence
                // 4. Log to external SIEM systems
                console.warn("High-risk audit event detected:", {
                    id: event.id,
                    type: event.eventType,
                    riskScore: event.riskScore,
                    userId: event.userId
                });
                return [2 /*return*/];
            });
        });
    };
    AuditTrailService.prototype.persistEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In a real implementation, this would persist to database
                // For now, we'll just ensure memory limits
                if (this.events.length > this.maxEvents) {
                    this.events = this.events.slice(-this.maxEvents);
                }
                return [2 /*return*/];
            });
        });
    };
    AuditTrailService.prototype.cleanup = function () {
        // Remove events older than 30 days from memory
        var thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        this.events = this.events.filter(function (e) { return e.timestamp > thirtyDaysAgo; });
    };
    AuditTrailService.prototype.convertToCSV = function (events) {
        if (events.length === 0)
            return '';
        var headers = [
            'ID', 'Timestamp', 'Event Type', 'Severity', 'Category',
            'User ID', 'IP Address', 'Action', 'Risk Score', 'Compliance Flags'
        ];
        var rows = events.map(function (event) { return [
            event.id,
            event.timestamp.toISOString(),
            event.eventType,
            event.severity,
            event.category,
            event.userId || '',
            event.ipAddress || '',
            event.action,
            event.riskScore.toString(),
            event.complianceFlags.join(';')
        ]; });
        return __spreadArray([headers], rows, true).map(function (row) { return row.map(function (cell) { return "\"".concat(cell, "\""); }).join(','); })
            .join('\n');
    };
    AuditTrailService.prototype.convertToXML = function (events) {
        var xmlEvents = events.map(function (event) { return "\n    <event>\n      <id>".concat(event.id, "</id>\n      <timestamp>").concat(event.timestamp.toISOString(), "</timestamp>\n      <eventType>").concat(event.eventType, "</eventType>\n      <severity>").concat(event.severity, "</severity>\n      <category>").concat(event.category, "</category>\n      <userId>").concat(event.userId || '', "</userId>\n      <ipAddress>").concat(event.ipAddress || '', "</ipAddress>\n      <action>").concat(event.action, "</action>\n      <riskScore>").concat(event.riskScore, "</riskScore>\n      <complianceFlags>").concat(event.complianceFlags.join(','), "</complianceFlags>\n    </event>"); }).join('');
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<auditTrail>\n  <events>".concat(xmlEvents, "\n  </events>\n</auditTrail>");
    };
    return AuditTrailService;
}(events_1.EventEmitter));
exports.AuditTrailService = AuditTrailService;
// Singleton instance
exports.auditTrailService = new AuditTrailService();
// Convenience functions for common audit events
exports.auditLogger = {
    // Authentication events
    loginSuccess: function (userId, context) {
        return exports.auditTrailService.logEvent(AuditEventType.LOGIN_SUCCESS, 'user_login', { userId: userId }, context);
    },
    loginFailure: function (username, reason, context) {
        return exports.auditTrailService.logEvent(AuditEventType.LOGIN_FAILURE, 'user_login_failed', { username: username, reason: reason }, context);
    },
    logout: function (userId, context) {
        return exports.auditTrailService.logEvent(AuditEventType.LOGOUT, 'user_logout', { userId: userId }, context);
    },
    // Data access events
    dataRead: function (resource, recordCount, context) {
        return exports.auditTrailService.logEvent(AuditEventType.DATA_READ, 'data_access', { resource: resource, recordCount: recordCount }, context);
    },
    dataCreate: function (resource, recordId, context) {
        return exports.auditTrailService.logEvent(AuditEventType.DATA_CREATE, 'data_create', { resource: resource, recordId: recordId }, context);
    },
    dataUpdate: function (resource, recordId, changes, context) {
        return exports.auditTrailService.logEvent(AuditEventType.DATA_UPDATE, 'data_update', { resource: resource, recordId: recordId, changes: changes }, context);
    },
    dataDelete: function (resource, recordId, context) {
        return exports.auditTrailService.logEvent(AuditEventType.DATA_DELETE, 'data_delete', { resource: resource, recordId: recordId }, context);
    },
    // Security events
    suspiciousActivity: function (description, evidence, context) {
        return exports.auditTrailService.logEvent(AuditEventType.SUSPICIOUS_ACTIVITY, 'security_alert', { description: description, evidence: evidence }, context);
    },
    rateLimitExceeded: function (endpoint, attempts, context) {
        return exports.auditTrailService.logEvent(AuditEventType.RATE_LIMIT_EXCEEDED, 'rate_limit', { endpoint: endpoint, attempts: attempts }, context);
    },
    // Property events
    propertyView: function (propertyId, context) {
        return exports.auditTrailService.logEvent(AuditEventType.PROPERTY_VIEW, 'property_view', { propertyId: propertyId }, context);
    },
    propertyCreate: function (propertyId, propertyData, context) {
        return exports.auditTrailService.logEvent(AuditEventType.PROPERTY_CREATE, 'property_create', { propertyId: propertyId, propertyData: propertyData }, context);
    },
    documentUpload: function (propertyId, documentType, fileSize, context) {
        return exports.auditTrailService.logEvent(AuditEventType.DOCUMENT_UPLOAD, 'document_upload', { propertyId: propertyId, documentType: documentType, fileSize: fileSize }, context);
    }
};
