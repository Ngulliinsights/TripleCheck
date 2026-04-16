"use strict";
/**
 * Audit Log Service
 * Security event logging and audit trail management
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.auditLogService = void 0;
var AuditLogService = /** @class */ (function () {
    function AuditLogService() {
        this.auditEvents = [];
        this.maxEvents = 10000; // Keep last 10k events in memory
        this.sessionId = this.generateSessionId();
        this.setupEventListeners();
    }
    AuditLogService.getInstance = function () {
        if (!AuditLogService.instance) {
            AuditLogService.instance = new AuditLogService();
        }
        return AuditLogService.instance;
    };
    /**
     * Log an audit event
     */
    AuditLogService.prototype.logEvent = function (eventType, action, details, options) {
        if (details === void 0) { details = {}; }
        if (options === void 0) { options = {}; }
        var event = {
            id: this.generateEventId(),
            timestamp: new Date(),
            userId: options.userId || this.getCurrentUserId(),
            sessionId: this.sessionId,
            eventType: eventType,
            action: action,
            resource: options.resource,
            resourceId: options.resourceId,
            details: __assign(__assign({}, details), { url: window.location.href, referrer: document.referrer }),
            ipAddress: this.getClientIP(),
            userAgent: navigator.userAgent,
            success: options.success !== false,
            riskLevel: options.riskLevel || this.calculateRiskLevel(eventType, action, details)
        };
        this.auditEvents.push(event);
        // Keep only the most recent events
        if (this.auditEvents.length > this.maxEvents) {
            this.auditEvents = this.auditEvents.slice(-this.maxEvents);
        }
        // Send to server in production
        if (process.env.NODE_ENV === 'production') {
            this.sendToServer(event);
        }
        // Log high-risk events to console
        if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
            console.warn('[AUDIT] High-risk event:', event);
        }
        return event.id;
    };
    /**
     * Log authentication events
     */
    AuditLogService.prototype.logAuthentication = function (action, success, details) {
        if (details === void 0) { details = {}; }
        return this.logEvent('authentication', action, details, {
            success: success,
            riskLevel: success ? 'low' : 'medium'
        });
    };
    /**
     * Log authorization events
     */
    AuditLogService.prototype.logAuthorization = function (action, resource, success, details) {
        if (details === void 0) { details = {}; }
        return this.logEvent('authorization', action, details, {
            resource: resource,
            success: success,
            riskLevel: success ? 'low' : 'high'
        });
    };
    /**
     * Log data access events
     */
    AuditLogService.prototype.logDataAccess = function (resource, resourceId, action, details) {
        if (action === void 0) { action = 'read'; }
        if (details === void 0) { details = {}; }
        return this.logEvent('data_access', action, details, {
            resource: resource,
            resourceId: resourceId,
            riskLevel: 'low'
        });
    };
    /**
     * Log data modification events
     */
    AuditLogService.prototype.logDataModification = function (resource, resourceId, action, details) {
        if (details === void 0) { details = {}; }
        return this.logEvent('data_modification', action, details, {
            resource: resource,
            resourceId: resourceId,
            riskLevel: 'medium'
        });
    };
    /**
     * Log security events
     */
    AuditLogService.prototype.logSecurityEvent = function (action, details, riskLevel) {
        if (details === void 0) { details = {}; }
        if (riskLevel === void 0) { riskLevel = 'high'; }
        return this.logEvent('security_event', action, details, {
            riskLevel: riskLevel,
            success: false
        });
    };
    /**
     * Log API requests
     */
    AuditLogService.prototype.logApiRequest = function (endpoint, method, success, details) {
        if (details === void 0) { details = {}; }
        return this.logEvent('api_request', "".concat(method, " ").concat(endpoint), details, {
            resource: 'api',
            resourceId: endpoint,
            success: success,
            riskLevel: 'low'
        });
    };
    /**
     * Log user actions
     */
    AuditLogService.prototype.logUserAction = function (action, details) {
        if (details === void 0) { details = {}; }
        return this.logEvent('user_action', action, details, {
            riskLevel: 'low'
        });
    };
    /**
     * Log errors
     */
    AuditLogService.prototype.logError = function (error, context, details) {
        if (details === void 0) { details = {}; }
        return this.logEvent('error', context, __assign(__assign({}, details), { error: error.message, stack: error.stack }), {
            success: false,
            riskLevel: 'medium'
        });
    };
    /**
     * Get audit events with filtering
     */
    AuditLogService.prototype.getEvents = function (filter) {
        if (filter === void 0) { filter = {}; }
        var events = __spreadArray([], this.auditEvents, true);
        // Apply filters
        if (filter.userId) {
            events = events.filter(function (e) { return e.userId === filter.userId; });
        }
        if (filter.eventType) {
            events = events.filter(function (e) { return e.eventType === filter.eventType; });
        }
        if (filter.action) {
            events = events.filter(function (e) { return e.action.includes(filter.action); });
        }
        if (filter.resource) {
            events = events.filter(function (e) { return e.resource === filter.resource; });
        }
        if (filter.success !== undefined) {
            events = events.filter(function (e) { return e.success === filter.success; });
        }
        if (filter.riskLevel) {
            events = events.filter(function (e) { return e.riskLevel === filter.riskLevel; });
        }
        if (filter.dateFrom) {
            events = events.filter(function (e) { return e.timestamp >= filter.dateFrom; });
        }
        if (filter.dateTo) {
            events = events.filter(function (e) { return e.timestamp <= filter.dateTo; });
        }
        // Sort by timestamp (newest first)
        events.sort(function (a, b) { return b.timestamp.getTime() - a.timestamp.getTime(); });
        // Apply limit
        if (filter.limit) {
            events = events.slice(0, filter.limit);
        }
        return events;
    };
    /**
     * Get security events summary
     */
    AuditLogService.prototype.getSecuritySummary = function () {
        var events = this.auditEvents;
        var last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return {
            totalEvents: events.length,
            failedLogins: events.filter(function (e) {
                return e.eventType === 'authentication' && !e.success;
            }).length,
            unauthorizedAccess: events.filter(function (e) {
                return e.eventType === 'authorization' && !e.success;
            }).length,
            highRiskEvents: events.filter(function (e) {
                return e.riskLevel === 'high' || e.riskLevel === 'critical';
            }).length,
            recentEvents: events.filter(function (e) { return e.timestamp >= last24Hours; }).slice(0, 10)
        };
    };
    /**
     * Export audit log
     */
    AuditLogService.prototype.exportAuditLog = function (filter) {
        if (filter === void 0) { filter = {}; }
        var events = this.getEvents(filter);
        var csvHeader = 'Timestamp,User ID,Event Type,Action,Resource,Success,Risk Level,Details\n';
        var csvRows = events.map(function (event) {
            var details = JSON.stringify(event.details).replace(/"/g, '""');
            return [
                event.timestamp.toISOString(),
                event.userId || '',
                event.eventType,
                event.action,
                event.resource || '',
                event.success,
                event.riskLevel,
                "\"".concat(details, "\"")
            ].join(',');
        });
        return csvHeader + csvRows.join('\n');
    };
    /**
     * Clear audit log
     */
    AuditLogService.prototype.clearAuditLog = function () {
        this.auditEvents = [];
    };
    /**
     * Generate unique event ID
     */
    AuditLogService.prototype.generateEventId = function () {
        return "audit_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    /**
     * Generate session ID
     */
    AuditLogService.prototype.generateSessionId = function () {
        return "session_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    /**
     * Get current user ID
     */
    AuditLogService.prototype.getCurrentUserId = function () {
        // This would typically come from your auth service
        try {
            var token = localStorage.getItem('authToken') || sessionStorage.getItem('accessToken');
            if (token) {
                var payload = JSON.parse(atob(token.split('.')[1]));
                return payload.userId;
            }
        }
        catch (_a) {
            // Ignore errors
        }
        return undefined;
    };
    /**
     * Get client IP (approximation)
     */
    AuditLogService.prototype.getClientIP = function () {
        // In a real application, this would come from the server
        return undefined;
    };
    /**
     * Calculate risk level based on event details
     */
    AuditLogService.prototype.calculateRiskLevel = function (eventType, action, details) {
        // High-risk patterns
        if (eventType === 'security_event')
            return 'critical';
        if (action.includes('delete') && details.permanent)
            return 'high';
        if (action.includes('admin') || action.includes('privilege'))
            return 'high';
        if (eventType === 'authorization' && !details.success)
            return 'high';
        if (eventType === 'authentication' && action.includes('failed'))
            return 'medium';
        return 'low';
    };
    /**
     * Send event to server
     */
    AuditLogService.prototype.sendToServer = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch('/api/audit/events', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(event)
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Failed to send audit event to server:', error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Setup event listeners for automatic logging
     */
    AuditLogService.prototype.setupEventListeners = function () {
        var _this = this;
        // Log page navigation
        window.addEventListener('beforeunload', function () {
            _this.logUserAction('page_unload', {
                url: window.location.href,
                duration: Date.now() - performance.timing.navigationStart
            });
        });
        // Log visibility changes
        document.addEventListener('visibilitychange', function () {
            _this.logUserAction(document.hidden ? 'page_hidden' : 'page_visible');
        });
    };
    return AuditLogService;
}());
exports.auditLogService = AuditLogService.getInstance();
exports.default = exports.auditLogService;
