"use strict";
/**
 * Security Monitoring Service - Fixed Implementation
 *
 * Provides real-time security monitoring, threat detection, and automated
 * response capabilities for the African Property Trust platform.
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
exports.securityMonitor = exports.securityMonitoringService = exports.SecurityMonitoringService = exports.SessionSecurityMonitor = exports.IPReputationService = exports.FrequencyAnalyzer = exports.ResponseAction = exports.ThreatStatus = exports.ThreatSeverity = exports.ThreatType = void 0;
var events_1 = require("events");
var audit_trail_service_1 = require("./audit-trail-service");
var ThreatType;
(function (ThreatType) {
    ThreatType["BRUTE_FORCE"] = "BRUTE_FORCE";
    ThreatType["SQL_INJECTION"] = "SQL_INJECTION";
    ThreatType["XSS_ATTACK"] = "XSS_ATTACK";
    ThreatType["CSRF_ATTACK"] = "CSRF_ATTACK";
    ThreatType["DDoS"] = "DDoS";
    ThreatType["MALICIOUS_IP"] = "MALICIOUS_IP";
    ThreatType["SUSPICIOUS_BEHAVIOR"] = "SUSPICIOUS_BEHAVIOR";
    ThreatType["DATA_EXFILTRATION"] = "DATA_EXFILTRATION";
    ThreatType["PRIVILEGE_ESCALATION"] = "PRIVILEGE_ESCALATION";
    ThreatType["ACCOUNT_TAKEOVER"] = "ACCOUNT_TAKEOVER";
    ThreatType["BOT_ACTIVITY"] = "BOT_ACTIVITY";
    ThreatType["ANOMALOUS_ACCESS"] = "ANOMALOUS_ACCESS";
})(ThreatType || (exports.ThreatType = ThreatType = {}));
var ThreatSeverity;
(function (ThreatSeverity) {
    ThreatSeverity["LOW"] = "LOW";
    ThreatSeverity["MEDIUM"] = "MEDIUM";
    ThreatSeverity["HIGH"] = "HIGH";
    ThreatSeverity["CRITICAL"] = "CRITICAL";
})(ThreatSeverity || (exports.ThreatSeverity = ThreatSeverity = {}));
var ThreatStatus;
(function (ThreatStatus) {
    ThreatStatus["DETECTED"] = "DETECTED";
    ThreatStatus["INVESTIGATING"] = "INVESTIGATING";
    ThreatStatus["CONFIRMED"] = "CONFIRMED";
    ThreatStatus["MITIGATED"] = "MITIGATED";
    ThreatStatus["RESOLVED"] = "RESOLVED";
    ThreatStatus["FALSE_POSITIVE"] = "FALSE_POSITIVE";
})(ThreatStatus || (exports.ThreatStatus = ThreatStatus = {}));
var ResponseAction;
(function (ResponseAction) {
    ResponseAction["BLOCK_IP"] = "BLOCK_IP";
    ResponseAction["RATE_LIMIT"] = "RATE_LIMIT";
    ResponseAction["REQUIRE_2FA"] = "REQUIRE_2FA";
    ResponseAction["LOCK_ACCOUNT"] = "LOCK_ACCOUNT";
    ResponseAction["ALERT_ADMIN"] = "ALERT_ADMIN";
    ResponseAction["LOG_ONLY"] = "LOG_ONLY";
    ResponseAction["CAPTCHA_CHALLENGE"] = "CAPTCHA_CHALLENGE";
    ResponseAction["TEMPORARY_BLOCK"] = "TEMPORARY_BLOCK";
})(ResponseAction || (exports.ResponseAction = ResponseAction = {}));
// Rate Limiting and Frequency Analysis
var FrequencyAnalyzer = /** @class */ (function () {
    function FrequencyAnalyzer() {
        this.requestCounts = new Map();
        this.windowSize = 60000; // 1 minute
        this.maxRequests = 100;
    }
    FrequencyAnalyzer.prototype.analyzeFrequency = function (identifier, endpoint, timestamp) {
        if (timestamp === void 0) { timestamp = Date.now(); }
        var key = "".concat(identifier, ":").concat(endpoint);
        if (!this.requestCounts.has(key)) {
            this.requestCounts.set(key, []);
        }
        var requests = this.requestCounts.get(key);
        // Add current request
        requests.push({ timestamp: timestamp, endpoint: endpoint });
        // Remove old requests outside the window
        var windowStart = timestamp - this.windowSize;
        var recentRequests = requests.filter(function (req) { return req.timestamp >= windowStart; });
        this.requestCounts.set(key, recentRequests);
        var requestCount = recentRequests.length;
        var riskScore = Math.min((requestCount / this.maxRequests) * 10, 10);
        return {
            isAnomalous: requestCount > this.maxRequests,
            requestCount: requestCount,
            riskScore: riskScore
        };
    };
    FrequencyAnalyzer.prototype.getTopRequesters = function (limit) {
        if (limit === void 0) { limit = 10; }
        var counts = new Map();
        for (var _i = 0, _a = this.requestCounts.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], requests = _b[1];
            var identifier = key.split(':')[0] || 'unknown';
            var currentCount = counts.get(identifier) || 0;
            counts.set(identifier, currentCount + requests.length);
        }
        return Array.from(counts.entries())
            .map(function (_a) {
            var identifier = _a[0], count = _a[1];
            return ({ identifier: identifier, count: count });
        })
            .sort(function (a, b) { return b.count - a.count; })
            .slice(0, limit);
    };
    return FrequencyAnalyzer;
}());
exports.FrequencyAnalyzer = FrequencyAnalyzer;
// IP Reputation Service
var IPReputationService = /** @class */ (function () {
    function IPReputationService() {
        this.reputationCache = new Map();
        this.cacheTimeout = 3600000; // 1 hour
    }
    IPReputationService.prototype.checkReputation = function (ip) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, reputation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cached = this.reputationCache.get(ip);
                        if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheTimeout) {
                            return [2 /*return*/, cached];
                        }
                        return [4 /*yield*/, this.queryReputationAPIs(ip)];
                    case 1:
                        reputation = _a.sent();
                        this.reputationCache.set(ip, reputation);
                        return [2 /*return*/, reputation];
                }
            });
        });
    };
    IPReputationService.prototype.queryReputationAPIs = function (ip) {
        return __awaiter(this, void 0, void 0, function () {
            var isPrivateIP, isKnownMalicious, reputation, confidence, sources, categories;
            return __generator(this, function (_a) {
                isPrivateIP = this.isPrivateIP(ip);
                isKnownMalicious = this.checkKnownMaliciousIPs(ip);
                reputation = 'good';
                confidence = 0.8;
                sources = ['internal'];
                categories = [];
                if (isPrivateIP) {
                    reputation = 'good';
                    confidence = 0.9;
                }
                else if (isKnownMalicious) {
                    reputation = 'malicious';
                    confidence = 0.95;
                    categories.push('known_malicious');
                }
                else if (this.isSuspiciousPattern(ip)) {
                    reputation = 'suspicious';
                    confidence = 0.7;
                    categories.push('suspicious_pattern');
                }
                return [2 /*return*/, {
                        ip: ip,
                        reputation: reputation,
                        confidence: confidence,
                        sources: sources,
                        lastUpdated: new Date(),
                        categories: categories
                    }];
            });
        });
    };
    IPReputationService.prototype.isPrivateIP = function (ip) {
        var privateRanges = [
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[01])\./,
            /^192\.168\./,
            /^127\./,
            /^::1$/,
            /^fc00:/,
            /^fe80:/
        ];
        return privateRanges.some(function (range) { return range.test(ip); });
    };
    IPReputationService.prototype.checkKnownMaliciousIPs = function (ip) {
        var knownMaliciousIPs = [
            '192.0.2.1',
            '198.51.100.1'
        ];
        return knownMaliciousIPs.includes(ip);
    };
    IPReputationService.prototype.isSuspiciousPattern = function (ip) {
        var suspiciousPatterns = [
            /^185\./,
            /^46\./,
        ];
        return suspiciousPatterns.some(function (pattern) { return pattern.test(ip); });
    };
    return IPReputationService;
}());
exports.IPReputationService = IPReputationService;
// Session Security Monitor
var SessionSecurityMonitor = /** @class */ (function () {
    function SessionSecurityMonitor() {
        this.activeSessions = new Map();
        this.suspiciousSessions = new Set();
    }
    SessionSecurityMonitor.prototype.monitorSession = function (sessionId, context) {
        var session = this.getOrCreateSession(sessionId, context);
        var analysis = this.analyzeSession(session, context);
        // Update session tracking information
        session.lastActivity = new Date();
        session.requestCount++;
        // Track IP address changes within session
        if (context.ipAddress && !session.ipAddresses.includes(context.ipAddress)) {
            session.ipAddresses.push(context.ipAddress);
        }
        // Monitor user agent consistency
        if (context.userAgent && session.userAgent !== context.userAgent) {
            session.userAgentChanges++;
        }
        // Flag high-risk sessions for enhanced monitoring
        if (analysis.riskScore >= 7) {
            this.suspiciousSessions.add(sessionId);
        }
        return analysis;
    };
    SessionSecurityMonitor.prototype.getOrCreateSession = function (sessionId, context) {
        if (!this.activeSessions.has(sessionId)) {
            this.activeSessions.set(sessionId, {
                sessionId: sessionId,
                userId: context.userId,
                startTime: new Date(),
                lastActivity: new Date(),
                ipAddresses: context.ipAddress ? [context.ipAddress] : [],
                userAgent: context.userAgent,
                userAgentChanges: 0,
                requestCount: 0,
                locations: [],
                riskEvents: []
            });
        }
        return this.activeSessions.get(sessionId);
    };
    SessionSecurityMonitor.prototype.analyzeSession = function (session, context) {
        var risks = [];
        var riskScore = 0;
        // Multiple IP addresses within session
        if (session.ipAddresses.length > 3) {
            risks.push('Multiple IP addresses used in session');
            riskScore += 3;
        }
        // Frequent user agent changes
        if (session.userAgentChanges > 2) {
            risks.push('User agent changed multiple times');
            riskScore += 2;
        }
        // Unusually long session duration
        var duration = Date.now() - session.startTime.getTime();
        if (duration > 24 * 60 * 60 * 1000) {
            risks.push('Unusually long session duration');
            riskScore += 1;
        }
        // High request frequency
        var sessionDurationMinutes = duration / (60 * 1000);
        var requestsPerMinute = session.requestCount / Math.max(sessionDurationMinutes, 1);
        if (requestsPerMinute > 10) {
            risks.push('High request frequency');
            riskScore += 2;
        }
        // Geographic anomalies
        if (session.ipAddresses.length > 1) {
            risks.push('Potential geographic anomaly detected');
            riskScore += 1;
        }
        return {
            sessionId: session.sessionId,
            riskScore: Math.min(riskScore, 10),
            risks: risks,
            isAnomalous: riskScore >= 5,
            recommendations: this.generateRecommendations(riskScore, risks)
        };
    };
    SessionSecurityMonitor.prototype.generateRecommendations = function (riskScore, risks) {
        var recommendations = [];
        if (riskScore >= 8) {
            recommendations.push('Immediately terminate session and require re-authentication');
        }
        else if (riskScore >= 6) {
            recommendations.push('Require additional authentication factors (2FA, security questions)');
        }
        else if (riskScore >= 4) {
            recommendations.push('Enhanced monitoring and logging of all session activities');
        }
        if (risks.some(function (r) { return r.includes('IP addresses'); })) {
            recommendations.push('Verify user identity through alternative communication channels');
        }
        if (risks.some(function (r) { return r.includes('User agent'); })) {
            recommendations.push('Investigate potential session hijacking or automated tool usage');
        }
        return recommendations;
    };
    SessionSecurityMonitor.prototype.getSuspiciousSessions = function () {
        return Array.from(this.suspiciousSessions);
    };
    SessionSecurityMonitor.prototype.terminateSession = function (sessionId) {
        this.activeSessions.delete(sessionId);
        this.suspiciousSessions.delete(sessionId);
    };
    return SessionSecurityMonitor;
}());
exports.SessionSecurityMonitor = SessionSecurityMonitor;
// Main Security Monitoring Service
var SecurityMonitoringService = /** @class */ (function (_super) {
    __extends(SecurityMonitoringService, _super);
    function SecurityMonitoringService() {
        var _this = _super.call(this) || this;
        _this.threats = [];
        _this.blockedIPs = new Set();
        _this.rateLimitedIPs = new Map();
        _this.maxThreats = 10000;
        _this.frequencyAnalyzer = new FrequencyAnalyzer();
        _this.ipReputationService = new IPReputationService();
        _this.sessionMonitor = new SessionSecurityMonitor();
        setInterval(function () { return _this.cleanup(); }, 300000);
        return _this;
    }
    SecurityMonitoringService.prototype.analyzeRequest = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var threat, context, threats, overallRiskScore, frequencyAnalysis, threat, reputation, threat, sessionAnalysis, threat, sqlInjectionRisk, threat, xssRisk, threat, botRisk, threat, actions, _i, actions_1, action;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.blockedIPs.has(request.ip)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.createThreat(ThreatType.MALICIOUS_IP, ThreatSeverity.HIGH, request.ip, 'Request from previously blocked IP address', [{ type: 'ip', value: request.ip, confidence: 1.0, description: 'Previously blocked IP address' }], this.buildThreatMetadata({ ipAddress: request.ip }))];
                    case 1:
                        threat = _a.sent();
                        this.threats.push(threat);
                        this.emit('threatDetected', threat);
                        return [2 /*return*/, {
                                riskScore: 10,
                                threats: [threat],
                                actions: [ResponseAction.BLOCK_IP],
                                blocked: true,
                                rateLimited: false
                            }];
                    case 2:
                        context = {
                            userId: request.userId,
                            sessionId: request.sessionId,
                            ipAddress: request.ip,
                            userAgent: request.userAgent,
                            roles: [],
                            permissions: [],
                            isAuthenticated: !!request.userId
                        };
                        threats = [];
                        overallRiskScore = 0;
                        frequencyAnalysis = this.frequencyAnalyzer.analyzeFrequency(request.ip, request.endpoint);
                        if (!frequencyAnalysis.isAnomalous) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.createThreat(ThreatType.DDoS, ThreatSeverity.MEDIUM, request.ip, "Abnormal request frequency: ".concat(frequencyAnalysis.requestCount, " requests in 60 seconds"), [{
                                    type: 'frequency',
                                    value: frequencyAnalysis.requestCount.toString(),
                                    confidence: 0.8,
                                    description: 'Request frequency exceeds normal thresholds'
                                }], this.buildThreatMetadata({
                                ipAddress: request.ip,
                                requestCount: frequencyAnalysis.requestCount,
                                timeWindow: 60000
                            }))];
                    case 3:
                        threat = _a.sent();
                        threats.push(threat);
                        overallRiskScore = Math.max(overallRiskScore, frequencyAnalysis.riskScore);
                        _a.label = 4;
                    case 4: return [4 /*yield*/, this.ipReputationService.checkReputation(request.ip)];
                    case 5:
                        reputation = _a.sent();
                        if (!(reputation.reputation === 'malicious')) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.createThreat(ThreatType.MALICIOUS_IP, ThreatSeverity.HIGH, request.ip, 'Request from IP with malicious reputation', [{
                                    type: 'ip',
                                    value: request.ip,
                                    confidence: reputation.confidence,
                                    description: "Malicious IP identified by: ".concat(reputation.categories.join(', '))
                                }], this.buildThreatMetadata({ ipAddress: request.ip }))];
                    case 6:
                        threat = _a.sent();
                        threats.push(threat);
                        overallRiskScore = Math.max(overallRiskScore, 9);
                        return [3 /*break*/, 8];
                    case 7:
                        if (reputation.reputation === 'suspicious') {
                            overallRiskScore = Math.max(overallRiskScore, 4);
                        }
                        _a.label = 8;
                    case 8:
                        if (!request.sessionId) return [3 /*break*/, 10];
                        sessionAnalysis = this.sessionMonitor.monitorSession(request.sessionId, context);
                        if (!sessionAnalysis.isAnomalous) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.createThreat(ThreatType.SUSPICIOUS_BEHAVIOR, ThreatSeverity.MEDIUM, request.ip, 'Suspicious session behavior patterns detected', [{
                                    type: 'behavior',
                                    value: sessionAnalysis.riskScore.toString(),
                                    confidence: 0.7,
                                    description: "Session anomalies: ".concat(sessionAnalysis.risks.join(', '))
                                }], this.buildThreatMetadata({
                                sessionId: request.sessionId,
                                ipAddress: request.ip,
                                userId: request.userId
                            }))];
                    case 9:
                        threat = _a.sent();
                        threats.push(threat);
                        overallRiskScore = Math.max(overallRiskScore, sessionAnalysis.riskScore);
                        _a.label = 10;
                    case 10:
                        sqlInjectionRisk = this.detectSQLInjection(request.body, request.headers);
                        if (!sqlInjectionRisk.detected) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.createThreat(ThreatType.SQL_INJECTION, ThreatSeverity.CRITICAL, request.ip, 'SQL injection attack pattern detected in request', [{
                                    type: 'pattern',
                                    value: sqlInjectionRisk.pattern,
                                    confidence: sqlInjectionRisk.confidence,
                                    description: 'Malicious SQL injection pattern identified'
                                }], this.buildThreatMetadata({
                                ipAddress: request.ip,
                                userId: request.userId
                            }))];
                    case 11:
                        threat = _a.sent();
                        threats.push(threat);
                        overallRiskScore = 10;
                        _a.label = 12;
                    case 12:
                        xssRisk = this.detectXSS(request.body, request.headers);
                        if (!xssRisk.detected) return [3 /*break*/, 14];
                        return [4 /*yield*/, this.createThreat(ThreatType.XSS_ATTACK, ThreatSeverity.HIGH, request.ip, 'Cross-site scripting attack attempt detected', [{
                                    type: 'pattern',
                                    value: xssRisk.pattern,
                                    confidence: xssRisk.confidence,
                                    description: 'Malicious XSS pattern identified in request'
                                }], this.buildThreatMetadata({
                                ipAddress: request.ip,
                                userId: request.userId
                            }))];
                    case 13:
                        threat = _a.sent();
                        threats.push(threat);
                        overallRiskScore = Math.max(overallRiskScore, 8);
                        _a.label = 14;
                    case 14:
                        botRisk = this.detectBot(request.userAgent, request.headers);
                        if (!botRisk.detected) return [3 /*break*/, 16];
                        return [4 /*yield*/, this.createThreat(ThreatType.BOT_ACTIVITY, ThreatSeverity.LOW, request.ip, 'Automated bot or scraping tool detected', [{
                                    type: 'user_agent',
                                    value: request.userAgent || 'missing',
                                    confidence: botRisk.confidence,
                                    description: 'Request patterns consistent with automated tools'
                                }], this.buildThreatMetadata({
                                ipAddress: request.ip,
                                userAgent: request.userAgent
                            }))];
                    case 15:
                        threat = _a.sent();
                        threats.push(threat);
                        overallRiskScore = Math.max(overallRiskScore, 3);
                        _a.label = 16;
                    case 16:
                        threats.forEach(function (threat) {
                            _this.threats.push(threat);
                            _this.emit('threatDetected', threat);
                        });
                        return [4 /*yield*/, this.determineActions(overallRiskScore, threats, request.ip)];
                    case 17:
                        actions = _a.sent();
                        _i = 0, actions_1 = actions;
                        _a.label = 18;
                    case 18:
                        if (!(_i < actions_1.length)) return [3 /*break*/, 21];
                        action = actions_1[_i];
                        return [4 /*yield*/, this.executeAction(action, request.ip, context)];
                    case 19:
                        _a.sent();
                        _a.label = 20;
                    case 20:
                        _i++;
                        return [3 /*break*/, 18];
                    case 21: return [2 /*return*/, {
                            riskScore: overallRiskScore,
                            threats: threats,
                            actions: actions,
                            blocked: actions.includes(ResponseAction.BLOCK_IP),
                            rateLimited: actions.includes(ResponseAction.RATE_LIMIT)
                        }];
                }
            });
        });
    };
    SecurityMonitoringService.prototype.buildThreatMetadata = function (partial) {
        if (partial === void 0) { partial = {}; }
        return {
            requestId: partial.requestId || "req_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
            sessionId: partial.sessionId,
            userId: partial.userId,
            ipAddress: partial.ipAddress,
            userAgent: partial.userAgent,
            geolocation: partial.geolocation,
            requestCount: partial.requestCount,
            timeWindow: partial.timeWindow
        };
    };
    SecurityMonitoringService.prototype.createThreat = function (type, severity, source, description, indicators, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var threat;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        threat = {
                            id: "threat_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
                            timestamp: new Date(),
                            type: type,
                            severity: severity,
                            source: source,
                            description: description,
                            indicators: indicators,
                            riskScore: this.calculateThreatRiskScore(type, severity, indicators),
                            status: ThreatStatus.DETECTED,
                            metadata: metadata
                        };
                        return [4 /*yield*/, audit_trail_service_1.auditTrailService.logEvent(audit_trail_service_1.AuditEventType.SUSPICIOUS_ACTIVITY, 'threat_detected', {
                                threatId: threat.id,
                                threatType: type,
                                severity: severity,
                                riskScore: threat.riskScore,
                                indicators: indicators.length
                            }, {
                                userId: metadata.userId,
                                sessionId: metadata.sessionId,
                                ipAddress: metadata.ipAddress,
                                userAgent: metadata.userAgent,
                                roles: [],
                                permissions: [],
                                isAuthenticated: !!metadata.userId
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, threat];
                }
            });
        });
    };
    SecurityMonitoringService.prototype.calculateThreatRiskScore = function (type, severity, indicators) {
        var _a, _b;
        var typeScores = (_a = {},
            _a[ThreatType.SQL_INJECTION] = 10,
            _a[ThreatType.XSS_ATTACK] = 8,
            _a[ThreatType.ACCOUNT_TAKEOVER] = 10,
            _a[ThreatType.DATA_EXFILTRATION] = 9,
            _a[ThreatType.PRIVILEGE_ESCALATION] = 9,
            _a[ThreatType.MALICIOUS_IP] = 8,
            _a[ThreatType.BRUTE_FORCE] = 7,
            _a[ThreatType.CSRF_ATTACK] = 7,
            _a[ThreatType.DDoS] = 6,
            _a[ThreatType.ANOMALOUS_ACCESS] = 5,
            _a[ThreatType.SUSPICIOUS_BEHAVIOR] = 4,
            _a[ThreatType.BOT_ACTIVITY] = 2,
            _a);
        var baseScore = typeScores[type] || 1;
        var severityMultipliers = (_b = {},
            _b[ThreatSeverity.CRITICAL] = 1.2,
            _b[ThreatSeverity.HIGH] = 1.0,
            _b[ThreatSeverity.MEDIUM] = 0.8,
            _b[ThreatSeverity.LOW] = 0.5,
            _b);
        baseScore *= severityMultipliers[severity];
        if (indicators.length > 0) {
            var avgConfidence = indicators.reduce(function (sum, ind) { return sum + ind.confidence; }, 0) / indicators.length;
            baseScore *= avgConfidence;
        }
        return Math.min(Math.round(baseScore), 10);
    };
    SecurityMonitoringService.prototype.detectSQLInjection = function (body, headers) {
        var sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
            /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
            /(\'|\"|;|--|\*|\|)/,
            /(\bUNION\b.*\bSELECT\b)/i,
            /(\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b)/i,
            /(\bWAITFOR\s+DELAY\b)/i,
            /(\b(CAST|CONVERT|SUBSTRING|ASCII|CHAR)\s*\()/i
        ];
        var testStrings = [
            JSON.stringify(body || {}),
            Object.values(headers).join(' ')
        ];
        for (var _i = 0, testStrings_1 = testStrings; _i < testStrings_1.length; _i++) {
            var testString = testStrings_1[_i];
            for (var _a = 0, sqlPatterns_1 = sqlPatterns; _a < sqlPatterns_1.length; _a++) {
                var pattern = sqlPatterns_1[_a];
                if (pattern.test(testString)) {
                    return {
                        detected: true,
                        pattern: pattern.source,
                        confidence: 0.8
                    };
                }
            }
        }
        return { detected: false, pattern: '', confidence: 0 };
    };
    SecurityMonitoringService.prototype.detectXSS = function (body, headers) {
        var xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe\b/i,
            /<object\b/i,
            /<embed\b/i,
            /eval\s*\(/i,
            /expression\s*\(/i,
            /data:.*javascript/i
        ];
        var testStrings = [
            JSON.stringify(body || {}),
            Object.values(headers).join(' ')
        ];
        for (var _i = 0, testStrings_2 = testStrings; _i < testStrings_2.length; _i++) {
            var testString = testStrings_2[_i];
            for (var _a = 0, xssPatterns_1 = xssPatterns; _a < xssPatterns_1.length; _a++) {
                var pattern = xssPatterns_1[_a];
                if (pattern.test(testString)) {
                    return {
                        detected: true,
                        pattern: pattern.source,
                        confidence: 0.8
                    };
                }
            }
        }
        return { detected: false, pattern: '', confidence: 0 };
    };
    SecurityMonitoringService.prototype.detectBot = function (userAgent, headers) {
        if (headers === void 0) { headers = {}; }
        if (!userAgent) {
            return { detected: true, confidence: 0.7 };
        }
        var botPatterns = [
            /bot/i,
            /crawler/i,
            /spider/i,
            /scraper/i,
            /curl/i,
            /wget/i,
            /python/i,
            /java/i,
            /go-http-client/i,
            /headlesschrome/i,
            /phantomjs/i,
            /selenium/i
        ];
        for (var _i = 0, botPatterns_1 = botPatterns; _i < botPatterns_1.length; _i++) {
            var pattern = botPatterns_1[_i];
            if (pattern.test(userAgent)) {
                return { detected: true, confidence: 0.8 };
            }
        }
        var commonHeaders = ['accept', 'accept-language', 'accept-encoding'];
        var missingHeaders = commonHeaders.filter(function (header) { return !headers[header]; });
        if (missingHeaders.length >= 2) {
            return { detected: true, confidence: 0.6 };
        }
        var suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];
        var hasSuspiciousHeaders = suspiciousHeaders.some(function (header) { return headers[header]; });
        if (hasSuspiciousHeaders && userAgent.length < 20) {
            return { detected: true, confidence: 0.5 };
        }
        return { detected: false, confidence: 0 };
    };
    SecurityMonitoringService.prototype.determineActions = function (riskScore, threats, ip) {
        return __awaiter(this, void 0, void 0, function () {
            var actions;
            return __generator(this, function (_a) {
                actions = [];
                if (riskScore >= 9 || threats.some(function (t) {
                    return t.type === ThreatType.SQL_INJECTION ||
                        t.type === ThreatType.ACCOUNT_TAKEOVER ||
                        t.type === ThreatType.DATA_EXFILTRATION;
                })) {
                    actions.push(ResponseAction.BLOCK_IP);
                    actions.push(ResponseAction.ALERT_ADMIN);
                }
                else if (riskScore >= 7 || threats.some(function (t) {
                    return t.type === ThreatType.BRUTE_FORCE ||
                        t.type === ThreatType.MALICIOUS_IP;
                })) {
                    actions.push(ResponseAction.RATE_LIMIT);
                    actions.push(ResponseAction.ALERT_ADMIN);
                }
                else if (riskScore >= 5) {
                    actions.push(ResponseAction.CAPTCHA_CHALLENGE);
                    actions.push(ResponseAction.LOG_ONLY);
                }
                else if (riskScore >= 3) {
                    actions.push(ResponseAction.LOG_ONLY);
                }
                if (threats.some(function (t) { return t.type === ThreatType.BRUTE_FORCE; })) {
                    actions.push(ResponseAction.TEMPORARY_BLOCK);
                }
                if (threats.some(function (t) { return t.type === ThreatType.SUSPICIOUS_BEHAVIOR; })) {
                    actions.push(ResponseAction.REQUIRE_2FA);
                }
                if (threats.some(function (t) { return t.type === ThreatType.PRIVILEGE_ESCALATION; })) {
                    actions.push(ResponseAction.LOCK_ACCOUNT);
                }
                return [2 /*return*/, __spreadArray([], new Set(actions), true)];
            });
        });
    };
    SecurityMonitoringService.prototype.executeAction = function (action, ip, context) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        response = {
                            action: action,
                            timestamp: new Date(),
                            automated: true,
                            details: "Automated security response for IP ".concat(ip)
                        };
                        switch (action) {
                            case ResponseAction.BLOCK_IP:
                                this.blockedIPs.add(ip);
                                response.details = "IP ".concat(ip, " permanently blocked due to critical security threat");
                                break;
                            case ResponseAction.RATE_LIMIT:
                                this.rateLimitedIPs.set(ip, Date.now() + 3600000);
                                response.details = "Rate limiting applied to IP ".concat(ip, " for 1 hour");
                                break;
                            case ResponseAction.TEMPORARY_BLOCK:
                                this.rateLimitedIPs.set(ip, Date.now() + 900000);
                                response.details = "Temporary 15-minute block applied to IP ".concat(ip);
                                break;
                            case ResponseAction.ALERT_ADMIN:
                                this.emit('adminAlert', {
                                    ip: ip,
                                    context: context,
                                    timestamp: new Date(),
                                    message: "Security threat detected from IP ".concat(ip)
                                });
                                response.details = "Administrator alert sent for security threat from IP ".concat(ip);
                                break;
                            case ResponseAction.LOCK_ACCOUNT:
                                if (context.userId) {
                                    this.emit('lockAccount', {
                                        userId: context.userId,
                                        reason: 'Account locked due to detected security threat',
                                        timestamp: new Date()
                                    });
                                    response.details = "User account ".concat(context.userId, " locked due to security threat");
                                }
                                break;
                            case ResponseAction.REQUIRE_2FA:
                                this.emit('require2FA', {
                                    userId: context.userId,
                                    sessionId: context.sessionId,
                                    reason: 'Additional authentication required due to suspicious activity'
                                });
                                response.details = "Two-factor authentication requirement triggered for suspicious activity";
                                break;
                            case ResponseAction.CAPTCHA_CHALLENGE:
                                response.details = "CAPTCHA challenge required for requests from IP ".concat(ip);
                                break;
                            case ResponseAction.LOG_ONLY:
                                response.details = "Security event logged for monitoring purposes";
                                break;
                        }
                        return [4 /*yield*/, audit_trail_service_1.auditTrailService.logEvent(audit_trail_service_1.AuditEventType.SUSPICIOUS_ACTIVITY, 'security_response_executed', {
                                action: action,
                                ip: ip,
                                automated: true,
                                details: response.details
                            }, context)];
                    case 1:
                        _a.sent();
                        this.emit('securityResponse', response);
                        return [2 /*return*/];
                }
            });
        });
    };
    SecurityMonitoringService.prototype.isBlocked = function (ip) {
        return this.blockedIPs.has(ip);
    };
    SecurityMonitoringService.prototype.isRateLimited = function (ip) {
        var limitExpiry = this.rateLimitedIPs.get(ip);
        if (!limitExpiry)
            return false;
        if (Date.now() > limitExpiry) {
            this.rateLimitedIPs.delete(ip);
            return false;
        }
        return true;
    };
    SecurityMonitoringService.prototype.getSecurityMetrics = function () {
        var _a;
        var now = Date.now();
        var last24Hours = now - 24 * 60 * 60 * 1000;
        var recentThreats = this.threats.filter(function (t) { return t.timestamp.getTime() > last24Hours; });
        var threatCounts = new Map();
        var ipCounts = new Map();
        var totalResponseTime = 0;
        var blockedCount = 0;
        var falsePositiveCount = 0;
        for (var _i = 0, recentThreats_1 = recentThreats; _i < recentThreats_1.length; _i++) {
            var threat = recentThreats_1[_i];
            threatCounts.set(threat.type, (threatCounts.get(threat.type) || 0) + 1);
            if (threat.source) {
                ipCounts.set(threat.source, (ipCounts.get(threat.source) || 0) + 1);
            }
            totalResponseTime += 150;
            if (((_a = threat.response) === null || _a === void 0 ? void 0 : _a.action) === ResponseAction.BLOCK_IP) {
                blockedCount++;
            }
            if (threat.status === ThreatStatus.FALSE_POSITIVE) {
                falsePositiveCount++;
            }
        }
        var topThreatTypes = Array.from(threatCounts.entries())
            .map(function (_a) {
            var type = _a[0], count = _a[1];
            return ({ type: type, count: count });
        })
            .sort(function (a, b) { return b.count - a.count; })
            .slice(0, 5);
        var topSourceIPs = Array.from(ipCounts.entries())
            .map(function (_a) {
            var ip = _a[0], count = _a[1];
            return ({ ip: ip, count: count });
        })
            .sort(function (a, b) { return b.count - a.count; })
            .slice(0, 10);
        var threatDensity = recentThreats.length / 24;
        var blockRate = recentThreats.length > 0 ? (blockedCount / recentThreats.length) : 1;
        var falsePositiveRate = recentThreats.length > 0 ? (falsePositiveCount / recentThreats.length) : 0;
        var securityScore = 100 - (threatDensity * 3) + (blockRate * 5) - (falsePositiveRate * 10);
        securityScore = Math.max(0, Math.min(100, securityScore));
        return {
            threatsDetected: recentThreats.length,
            threatsBlocked: blockedCount,
            falsePositives: falsePositiveCount,
            averageResponseTime: recentThreats.length > 0 ? totalResponseTime / recentThreats.length : 0,
            topThreatTypes: topThreatTypes,
            topSourceIPs: topSourceIPs,
            securityScore: Math.round(securityScore)
        };
    };
    SecurityMonitoringService.prototype.unblockIP = function (ip) {
        this.blockedIPs.delete(ip);
        this.rateLimitedIPs.delete(ip);
        audit_trail_service_1.auditTrailService.logEvent(audit_trail_service_1.AuditEventType.CONFIGURATION_CHANGE, 'ip_unblocked', { ip: ip, timestamp: new Date() }, {
            userId: undefined,
            sessionId: undefined,
            ipAddress: ip,
            userAgent: undefined,
            roles: ['admin'],
            permissions: ['security_management'],
            isAuthenticated: true
        });
    };
    SecurityMonitoringService.prototype.getThreats = function (filter) {
        var filteredThreats = __spreadArray([], this.threats, true);
        if (filter === null || filter === void 0 ? void 0 : filter.severity) {
            filteredThreats = filteredThreats.filter(function (t) { return t.severity === filter.severity; });
        }
        if (filter === null || filter === void 0 ? void 0 : filter.type) {
            filteredThreats = filteredThreats.filter(function (t) { return t.type === filter.type; });
        }
        if (filter === null || filter === void 0 ? void 0 : filter.status) {
            filteredThreats = filteredThreats.filter(function (t) { return t.status === filter.status; });
        }
        if (filter === null || filter === void 0 ? void 0 : filter.since) {
            filteredThreats = filteredThreats.filter(function (t) { return t.timestamp >= filter.since; });
        }
        filteredThreats.sort(function (a, b) { return b.timestamp.getTime() - a.timestamp.getTime(); });
        if (filter === null || filter === void 0 ? void 0 : filter.limit) {
            filteredThreats = filteredThreats.slice(0, filter.limit);
        }
        return filteredThreats;
    };
    SecurityMonitoringService.prototype.updateThreatStatus = function (threatId, status, notes) {
        var threat = this.threats.find(function (t) { return t.id === threatId; });
        if (!threat)
            return false;
        var oldStatus = threat.status;
        threat.status = status;
        audit_trail_service_1.auditTrailService.logEvent(audit_trail_service_1.AuditEventType.SUSPICIOUS_ACTIVITY, 'threat_status_updated', {
            threatId: threatId,
            oldStatus: oldStatus,
            newStatus: status,
            notes: notes || 'No notes provided'
        }, {
            userId: undefined,
            sessionId: undefined,
            ipAddress: undefined,
            userAgent: undefined,
            roles: ['security_analyst'],
            permissions: ['threat_management'],
            isAuthenticated: true
        });
        return true;
    };
    SecurityMonitoringService.prototype.getSecurityStatus = function () {
        var rateLimitedList = Array.from(this.rateLimitedIPs.entries())
            .map(function (_a) {
            var ip = _a[0], expiry = _a[1];
            return ({ ip: ip, expiresAt: new Date(expiry) });
        })
            .filter(function (item) { return item.expiresAt.getTime() > Date.now(); });
        return {
            blockedIPs: Array.from(this.blockedIPs),
            rateLimitedIPs: rateLimitedList,
            activeSessions: this.sessionMonitor.getSuspiciousSessions().length,
            suspiciousSessions: this.sessionMonitor.getSuspiciousSessions().length
        };
    };
    SecurityMonitoringService.prototype.cleanup = function () {
        var now = Date.now();
        var thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        var originalLength = this.threats.length;
        this.threats = this.threats.filter(function (t) { return t.timestamp.getTime() > thirtyDaysAgo; });
        for (var _i = 0, _a = this.rateLimitedIPs.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], ip = _b[0], expiry = _b[1];
            if (now > expiry) {
                this.rateLimitedIPs.delete(ip);
            }
        }
        if (this.threats.length > this.maxThreats) {
            this.threats = this.threats
                .sort(function (a, b) { return b.timestamp.getTime() - a.timestamp.getTime(); })
                .slice(0, this.maxThreats);
        }
        if (originalLength > this.threats.length) {
            console.log("Security cleanup: Removed ".concat(originalLength - this.threats.length, " old threat records"));
        }
    };
    SecurityMonitoringService.prototype.exportSecurityData = function (options) {
        var exportData = {
            metadata: {
                exportDate: new Date(),
                version: '1.0.0'
            }
        };
        if ((options === null || options === void 0 ? void 0 : options.includeThreats) !== false) {
            exportData.threats = this.getThreats({
                since: (options === null || options === void 0 ? void 0 : options.since) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                limit: 1000
            });
        }
        if ((options === null || options === void 0 ? void 0 : options.includeBinaryData) !== false) {
            exportData.blockedIPs = Array.from(this.blockedIPs);
            exportData.metrics = this.getSecurityMetrics();
        }
        return exportData;
    };
    return SecurityMonitoringService;
}(events_1.EventEmitter));
exports.SecurityMonitoringService = SecurityMonitoringService;
// Singleton instance for application-wide use
exports.securityMonitoringService = new SecurityMonitoringService();
// Convenience interface for common operations
exports.securityMonitor = {
    analyzeRequest: function (request) {
        return exports.securityMonitoringService.analyzeRequest(request);
    },
    isBlocked: function (ip) {
        return exports.securityMonitoringService.isBlocked(ip);
    },
    isRateLimited: function (ip) {
        return exports.securityMonitoringService.isRateLimited(ip);
    },
    getMetrics: function () {
        return exports.securityMonitoringService.getSecurityMetrics();
    },
    getThreats: function (filter) {
        return exports.securityMonitoringService.getThreats(filter);
    },
    getStatus: function () {
        return exports.securityMonitoringService.getSecurityStatus();
    },
    unblockIP: function (ip) {
        return exports.securityMonitoringService.unblockIP(ip);
    },
    updateThreatStatus: function (threatId, status, notes) {
        return exports.securityMonitoringService.updateThreatStatus(threatId, status, notes);
    },
    exportData: function (options) {
        return exports.securityMonitoringService.exportSecurityData(options);
    },
    onThreatDetected: function (callback) {
        exports.securityMonitoringService.on('threatDetected', callback);
    },
    onSecurityResponse: function (callback) {
        exports.securityMonitoringService.on('securityResponse', callback);
    },
    onAdminAlert: function (callback) {
        exports.securityMonitoringService.on('adminAlert', callback);
    }
};
