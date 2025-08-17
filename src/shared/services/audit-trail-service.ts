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

import { EventEmitter } from 'events';

// Core Types and Interfaces
export interface AuditEvent {
    id: string;
    timestamp: Date;
    eventType: AuditEventType;
    severity: AuditSeverity;
    category: AuditCategory;
    userId?: string | undefined;
    sessionId?: string | undefined;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
    resource?: string | undefined;
    action: string;
    details: Record<string, any>;
    metadata: AuditMetadata;
    riskScore: number;
    complianceFlags: string[];
}

export enum AuditEventType {
    // Authentication & Authorization
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    LOGIN_FAILURE = 'LOGIN_FAILURE',
    LOGOUT = 'LOGOUT',
    PASSWORD_CHANGE = 'PASSWORD_CHANGE',
    ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    TOKEN_REFRESH = 'TOKEN_REFRESH',

    // Data Access & Modification
    DATA_READ = 'DATA_READ',
    DATA_CREATE = 'DATA_CREATE',
    DATA_UPDATE = 'DATA_UPDATE',
    DATA_DELETE = 'DATA_DELETE',
    BULK_OPERATION = 'BULK_OPERATION',
    EXPORT_DATA = 'EXPORT_DATA',

    // Property Operations
    PROPERTY_VIEW = 'PROPERTY_VIEW',
    PROPERTY_CREATE = 'PROPERTY_CREATE',
    PROPERTY_UPDATE = 'PROPERTY_UPDATE',
    PROPERTY_DELETE = 'PROPERTY_DELETE',
    PROPERTY_VERIFY = 'PROPERTY_VERIFY',
    DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',

    // Security Events
    SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    INVALID_TOKEN = 'INVALID_TOKEN',
    BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
    SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
    XSS_ATTEMPT = 'XSS_ATTEMPT',

    // System Events
    SYSTEM_ERROR = 'SYSTEM_ERROR',
    API_ERROR = 'API_ERROR',
    PERFORMANCE_ISSUE = 'PERFORMANCE_ISSUE',
    CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
    BACKUP_OPERATION = 'BACKUP_OPERATION',

    // Business Events
    TRANSACTION_INITIATED = 'TRANSACTION_INITIATED',
    TRANSACTION_COMPLETED = 'TRANSACTION_COMPLETED',
    VERIFICATION_REQUEST = 'VERIFICATION_REQUEST',
    FRAUD_DETECTED = 'FRAUD_DETECTED',
    COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION'
}

export enum AuditSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export enum AuditCategory {
    AUTHENTICATION = 'AUTHENTICATION',
    AUTHORIZATION = 'AUTHORIZATION',
    DATA_ACCESS = 'DATA_ACCESS',
    SECURITY = 'SECURITY',
    SYSTEM = 'SYSTEM',
    BUSINESS = 'BUSINESS',
    COMPLIANCE = 'COMPLIANCE',
    PERFORMANCE = 'PERFORMANCE'
}

export interface AuditMetadata {
    requestId?: string | undefined;
    correlationId?: string | undefined;
    source: string;
    environment: string;
    version: string;
    geolocation?: {
        country?: string | undefined;
        region?: string | undefined;
        city?: string | undefined;
    } | undefined;
    deviceInfo?: {
        type: string;
        os?: string | undefined;
        browser?: string | undefined;
    } | undefined;
}

export interface SecurityContext {
    userId?: string | undefined;
    sessionId?: string | undefined;
    roles: string[];
    permissions: string[];
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
    isAuthenticated: boolean;
    authMethod?: string | undefined;
}

export interface AuditFilter {
    eventTypes?: AuditEventType[] | undefined;
    severities?: AuditSeverity[] | undefined;
    categories?: AuditCategory[] | undefined;
    userId?: string | undefined;
    dateRange?: {
        start: Date;
        end: Date;
    } | undefined;
    riskScoreRange?: {
        min: number;
        max: number;
    } | undefined;
    complianceFlags?: string[] | undefined;
}

export interface AuditAnalytics {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topUsers: Array<{ userId: string; eventCount: number }>;
    riskTrends: Array<{ date: string; averageRisk: number }>;
    complianceStatus: {
        violations: number;
        criticalIssues: number;
        lastAudit: Date;
    };
}

// Risk Assessment Engine
export class RiskAssessmentEngine {
    private riskRules: Map<string, (event: AuditEvent) => number> = new Map();

    constructor() {
        this.initializeRiskRules();
    }

    private initializeRiskRules(): void {
        // Authentication risks
        this.riskRules.set('LOGIN_FAILURE', (event) => {
            const failureCount = event.details.consecutiveFailures || 1;
            return Math.min(failureCount * 2, 8);
        });

        this.riskRules.set('BRUTE_FORCE_ATTEMPT', () => 9);
        this.riskRules.set('ACCOUNT_LOCKED', () => 7);

        // Data access risks
        this.riskRules.set('BULK_OPERATION', (event) => {
            const recordCount = event.details.recordCount || 0;
            return recordCount > 1000 ? 8 : recordCount > 100 ? 5 : 2;
        });

        this.riskRules.set('EXPORT_DATA', (event) => {
            const sensitive = event.details.containsSensitiveData || false;
            return sensitive ? 7 : 3;
        });

        // Security risks
        this.riskRules.set('SQL_INJECTION_ATTEMPT', () => 10);
        this.riskRules.set('XSS_ATTEMPT', () => 8);
        this.riskRules.set('SUSPICIOUS_ACTIVITY', () => 6);

        // System risks
        this.riskRules.set('SYSTEM_ERROR', (event) => {
            const errorType = event.details.errorType || '';
            return errorType.includes('security') ? 8 : 3;
        });
    }

    assessRisk(event: AuditEvent): number {
        const baseRisk = this.riskRules.get(event.eventType)?.(event) || 1;

        // Apply contextual modifiers
        let riskMultiplier = 1;

        // Time-based risk (off-hours activity)
        const hour = event.timestamp.getHours();
        if (hour < 6 || hour > 22) {
            riskMultiplier += 0.2;
        }

        // Geographic risk (unusual locations)
        if (event.metadata.geolocation?.country &&
            !this.isKnownLocation(event.metadata.geolocation.country)) {
            riskMultiplier += 0.3;
        }

        // Frequency risk (rapid successive events)
        if (event.details.eventFrequency > 10) {
            riskMultiplier += 0.4;
        }

        return Math.min(Math.round(baseRisk * riskMultiplier), 10);
    }

    private isKnownLocation(country: string): boolean {
        // Known safe countries for the platform
        const knownCountries = ['KE', 'UG', 'TZ', 'RW', 'ET', 'US', 'GB', 'CA'];
        return knownCountries.includes(country);
    }
}

// Compliance Monitor
export class ComplianceMonitor {
    private complianceRules: Map<string, (event: AuditEvent) => string[]> = new Map();

    constructor() {
        this.initializeComplianceRules();
    }

    private initializeComplianceRules(): void {
        // GDPR compliance
        this.complianceRules.set('DATA_EXPORT', (event) => {
            const flags: string[] = [];
            if (!event.details.userConsent) {
                flags.push('GDPR_NO_CONSENT');
            }
            if (!event.details.dataMinimization) {
                flags.push('GDPR_DATA_MINIMIZATION');
            }
            return flags;
        });

        // SOX compliance (financial data)
        this.complianceRules.set('FINANCIAL_ACCESS', (event) => {
            const flags: string[] = [];
            if (!event.details.approvalRequired && event.details.amount > 10000) {
                flags.push('SOX_APPROVAL_REQUIRED');
            }
            return flags;
        });

        // Data retention compliance
        this.complianceRules.set('DATA_DELETE', (event) => {
            const flags: string[] = [];
            if (event.details.retentionPeriodActive) {
                flags.push('RETENTION_VIOLATION');
            }
            return flags;
        });
    }

    checkCompliance(event: AuditEvent): string[] {
        const allFlags: string[] = [];

        // Check specific event type rules
        for (const [ruleType, rule] of this.complianceRules.entries()) {
            if (event.eventType.includes(ruleType) || event.category === AuditCategory.COMPLIANCE) {
                allFlags.push(...rule(event));
            }
        }

        // General compliance checks
        if (event.severity === AuditSeverity.CRITICAL && !event.details.incidentResponse) {
            allFlags.push('INCIDENT_RESPONSE_REQUIRED');
        }

        return allFlags;
    }
}

// Behavioral Analysis Engine
export class BehaviorAnalyzer {
    private userProfiles: Map<string, UserBehaviorProfile> = new Map();

    analyzeUserBehavior(event: AuditEvent): BehaviorAnalysis {
        if (!event.userId) {
            return { isAnomalous: false, confidence: 0, reasons: [] };
        }

        const profile = this.getUserProfile(event.userId);
        const analysis = this.detectAnomalies(event, profile);

        // Update profile with new event
        this.updateUserProfile(event.userId, event);

        return analysis;
    }

    private getUserProfile(userId: string): UserBehaviorProfile {
        if (!this.userProfiles.has(userId)) {
            this.userProfiles.set(userId, {
                userId,
                typicalHours: new Set(),
                commonLocations: new Set(),
                averageSessionDuration: 0,
                commonActions: new Map(),
                riskHistory: [],
                lastActivity: new Date()
            });
        }
        return this.userProfiles.get(userId)!;
    }

    private detectAnomalies(event: AuditEvent, profile: UserBehaviorProfile): BehaviorAnalysis {
        const reasons: string[] = [];
        let anomalyScore = 0;

        // Time-based anomaly
        const hour = event.timestamp.getHours();
        if (profile.typicalHours.size > 0 && !profile.typicalHours.has(hour)) {
            reasons.push('Unusual time of activity');
            anomalyScore += 2;
        }

        // Location-based anomaly
        const location = event.metadata.geolocation?.country;
        if (location && profile.commonLocations.size > 0 && !profile.commonLocations.has(location)) {
            reasons.push('Unusual geographic location');
            anomalyScore += 3;
        }

        // Action frequency anomaly
        const actionCount = profile.commonActions.get(event.action) || 0;
        if (actionCount === 0 && profile.commonActions.size > 10) {
            reasons.push('Unusual action for user');
            anomalyScore += 1;
        }

        // Risk pattern anomaly
        const avgRisk = profile.riskHistory.reduce((sum, r) => sum + r, 0) / profile.riskHistory.length;
        if (event.riskScore > avgRisk + 3) {
            reasons.push('Risk score significantly higher than usual');
            anomalyScore += 2;
        }

        return {
            isAnomalous: anomalyScore >= 3,
            confidence: Math.min(anomalyScore / 8, 1),
            reasons,
            anomalyScore
        };
    }

    private updateUserProfile(userId: string, event: AuditEvent): void {
        const profile = this.getUserProfile(userId);

        // Update typical hours
        profile.typicalHours.add(event.timestamp.getHours());

        // Update common locations
        if (event.metadata.geolocation?.country) {
            profile.commonLocations.add(event.metadata.geolocation.country);
        }

        // Update common actions
        const currentCount = profile.commonActions.get(event.action) || 0;
        profile.commonActions.set(event.action, currentCount + 1);

        // Update risk history (keep last 50 events)
        profile.riskHistory.push(event.riskScore);
        if (profile.riskHistory.length > 50) {
            profile.riskHistory.shift();
        }

        profile.lastActivity = event.timestamp;
    }
}

interface UserBehaviorProfile {
    userId: string;
    typicalHours: Set<number>;
    commonLocations: Set<string>;
    averageSessionDuration: number;
    commonActions: Map<string, number>;
    riskHistory: number[];
    lastActivity: Date;
}

interface BehaviorAnalysis {
    isAnomalous: boolean;
    confidence: number;
    reasons: string[];
    anomalyScore?: number | undefined;
}

// Main Audit Trail Service
export class AuditTrailService extends EventEmitter {
    private events: AuditEvent[] = [];
    private riskEngine: RiskAssessmentEngine;
    private complianceMonitor: ComplianceMonitor;
    private behaviorAnalyzer: BehaviorAnalyzer;
    private readonly maxEvents = 10000;
    private persistenceEnabled = true;

    constructor() {
        super();
        this.riskEngine = new RiskAssessmentEngine();
        this.complianceMonitor = new ComplianceMonitor();
        this.behaviorAnalyzer = new BehaviorAnalyzer();

        // Set up periodic cleanup
        setInterval(() => this.cleanup(), 60000); // Every minute
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
    async logEvent(
        eventType: AuditEventType,
        action: string,
        details: Record<string, any> = {},
        context?: SecurityContext
    ): Promise<string> {
        // Build the metadata first to handle potential undefined values
        const metadata = await this.buildMetadata();

        // Create the audit event with explicit handling of optional properties
        const event: AuditEvent = {
            id: this.generateEventId(),
            timestamp: new Date(),
            eventType,
            severity: this.determineSeverity(eventType),
            category: this.determineCategory(eventType),
            // Explicitly handle optional properties to satisfy exactOptionalPropertyTypes
            userId: context?.userId || undefined,
            sessionId: context?.sessionId || undefined,
            ipAddress: context?.ipAddress || undefined,
            userAgent: context?.userAgent || undefined,
            resource: undefined, // Will be set if provided in details
            action,
            details,
            metadata,
            riskScore: 0, // Will be calculated below
            complianceFlags: []
        };

        // Set resource if provided in details
        if (details.resource) {
            event.resource = details.resource as string;
        }

        // Calculate risk score
        event.riskScore = this.riskEngine.assessRisk(event);

        // Check compliance
        event.complianceFlags = this.complianceMonitor.checkCompliance(event);

        // Analyze user behavior
        const behaviorAnalysis = this.behaviorAnalyzer.analyzeUserBehavior(event);
        if (behaviorAnalysis.isAnomalous) {
            event.details.behaviorAnalysis = behaviorAnalysis;
            event.riskScore = Math.min(event.riskScore + 2, 10);
        }

        // Store event
        this.events.push(event);

        // Emit event for real-time processing
        this.emit('auditEvent', event);

        // Handle high-risk events
        if (event.riskScore >= 8 || event.severity === AuditSeverity.CRITICAL) {
            this.emit('highRiskEvent', event);
            await this.handleHighRiskEvent(event);
        }

        // Handle compliance violations
        if (event.complianceFlags.length > 0) {
            this.emit('complianceViolation', event);
        }

        // Persist if enabled
        if (this.persistenceEnabled) {
            await this.persistEvent(event);
        }

        return event.id;
    }

    /**
     * Query audit events with filtering and pagination
     * 
     * This method provides flexible querying capabilities with support for:
     * - Multiple filter criteria (event types, severity, users, date ranges)
     * - Risk score filtering for security analysis
     * - Compliance flag filtering for regulatory reporting
     * - Pagination for handling large result sets
     */
    async queryEvents(
        filter: AuditFilter = {},
        limit = 100,
        offset = 0
    ): Promise<{ events: AuditEvent[]; total: number }> {
        let filteredEvents = [...this.events];

        // Apply filters with null-safe checks
        if (filter.eventTypes?.length) {
            filteredEvents = filteredEvents.filter(e => filter.eventTypes!.includes(e.eventType));
        }

        if (filter.severities?.length) {
            filteredEvents = filteredEvents.filter(e => filter.severities!.includes(e.severity));
        }

        if (filter.categories?.length) {
            filteredEvents = filteredEvents.filter(e => filter.categories!.includes(e.category));
        }

        if (filter.userId) {
            filteredEvents = filteredEvents.filter(e => e.userId === filter.userId);
        }

        if (filter.dateRange) {
            filteredEvents = filteredEvents.filter(e =>
                e.timestamp >= filter.dateRange!.start &&
                e.timestamp <= filter.dateRange!.end
            );
        }

        if (filter.riskScoreRange) {
            filteredEvents = filteredEvents.filter(e =>
                e.riskScore >= filter.riskScoreRange!.min &&
                e.riskScore <= filter.riskScoreRange!.max
            );
        }

        if (filter.complianceFlags?.length) {
            filteredEvents = filteredEvents.filter(e =>
                filter.complianceFlags!.some(flag => e.complianceFlags.includes(flag))
            );
        }

        // Sort by timestamp (newest first)
        filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Apply pagination
        const paginatedEvents = filteredEvents.slice(offset, offset + limit);

        return {
            events: paginatedEvents,
            total: filteredEvents.length
        };
    }

    /**
     * Generate analytics and insights from audit data
     * 
     * This method provides comprehensive analytics including:
     * - Event distribution by type and severity
     * - User activity patterns and top users by activity
     * - Risk trends over time for threat intelligence
     * - Compliance status and violation tracking
     */
    async generateAnalytics(dateRange?: { start: Date; end: Date }): Promise<AuditAnalytics> {
        let events = this.events;

        if (dateRange) {
            events = events.filter(e =>
                e.timestamp >= dateRange.start && e.timestamp <= dateRange.end
            );
        }

        const eventsByType: Record<string, number> = {};
        const eventsBySeverity: Record<string, number> = {};
        const userEventCounts: Map<string, number> = new Map();
        const riskByDate: Map<string, number[]> = new Map();

        for (const event of events) {
            // Count by type
            eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;

            // Count by severity
            eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;

            // Count by user (only if userId exists)
            if (event.userId) {
                userEventCounts.set(event.userId, (userEventCounts.get(event.userId) || 0) + 1);
            }

            // Risk trends
            const dateKey = event.timestamp.toISOString().split('T')[0];
            if (!riskByDate.has(dateKey)) {
                riskByDate.set(dateKey, []);
            }
            riskByDate.get(dateKey)!.push(event.riskScore);
        }

        // Top users by activity
        const topUsers = Array.from(userEventCounts.entries())
            .map(([userId, eventCount]) => ({ userId, eventCount }))
            .sort((a, b) => b.eventCount - a.eventCount)
            .slice(0, 10);

        // Risk trends
        const riskTrends = Array.from(riskByDate.entries())
            .map(([date, risks]) => ({
                date,
                averageRisk: risks.reduce((sum, r) => sum + r, 0) / risks.length
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Compliance status
        const violations = events.filter(e => e.complianceFlags.length > 0).length;
        const criticalIssues = events.filter(e => e.severity === AuditSeverity.CRITICAL).length;

        return {
            totalEvents: events.length,
            eventsByType,
            eventsBySeverity,
            topUsers,
            riskTrends,
            complianceStatus: {
                violations,
                criticalIssues,
                lastAudit: new Date()
            }
        };
    }

    /**
     * Export audit trail for compliance reporting
     * 
     * This method supports multiple export formats for different compliance requirements:
     * - JSON: Machine-readable format for automated processing
     * - CSV: Human-readable format for spreadsheet analysis
     * - XML: Structured format for enterprise systems integration
     */
    async exportAuditTrail(
        format: 'json' | 'csv' | 'xml' = 'json',
        filter?: AuditFilter
    ): Promise<string> {
        const { events } = await this.queryEvents(filter, 10000, 0);

        switch (format) {
            case 'json':
                return JSON.stringify(events, null, 2);

            case 'csv':
                return this.convertToCSV(events);

            case 'xml':
                return this.convertToXML(events);

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    // Private helper methods
    private generateEventId(): string {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private determineSeverity(eventType: AuditEventType): AuditSeverity {
        const criticalEvents = [
            AuditEventType.SQL_INJECTION_ATTEMPT,
            AuditEventType.FRAUD_DETECTED,
            AuditEventType.COMPLIANCE_VIOLATION
        ];

        const highEvents = [
            AuditEventType.BRUTE_FORCE_ATTEMPT,
            AuditEventType.ACCOUNT_LOCKED,
            AuditEventType.XSS_ATTEMPT,
            AuditEventType.SUSPICIOUS_ACTIVITY
        ];

        const mediumEvents = [
            AuditEventType.LOGIN_FAILURE,
            AuditEventType.PERMISSION_DENIED,
            AuditEventType.RATE_LIMIT_EXCEEDED
        ];

        if (criticalEvents.includes(eventType)) return AuditSeverity.CRITICAL;
        if (highEvents.includes(eventType)) return AuditSeverity.HIGH;
        if (mediumEvents.includes(eventType)) return AuditSeverity.MEDIUM;
        return AuditSeverity.LOW;
    }

    private determineCategory(eventType: AuditEventType): AuditCategory {
        const authEvents = [
            AuditEventType.LOGIN_SUCCESS,
            AuditEventType.LOGIN_FAILURE,
            AuditEventType.LOGOUT,
            AuditEventType.PASSWORD_CHANGE
        ];

        const securityEvents = [
            AuditEventType.SUSPICIOUS_ACTIVITY,
            AuditEventType.BRUTE_FORCE_ATTEMPT,
            AuditEventType.SQL_INJECTION_ATTEMPT,
            AuditEventType.XSS_ATTEMPT
        ];

        const dataEvents = [
            AuditEventType.DATA_READ,
            AuditEventType.DATA_CREATE,
            AuditEventType.DATA_UPDATE,
            AuditEventType.DATA_DELETE
        ];

        if (authEvents.includes(eventType)) return AuditCategory.AUTHENTICATION;
        if (securityEvents.includes(eventType)) return AuditCategory.SECURITY;
        if (dataEvents.includes(eventType)) return AuditCategory.DATA_ACCESS;
        return AuditCategory.SYSTEM;
    }

    private async buildMetadata(): Promise<AuditMetadata> {
        // Get geolocation and device info, handling potential undefined values
        const geolocation = await this.getGeolocation();
        const deviceInfo = this.getDeviceInfo();

        return {
            source: 'audit-trail-service',
            environment: process.env.NODE_ENV || 'development',
            version: process.env.APP_VERSION || '1.0.0',
            // Explicitly assign undefined if the values are undefined
            geolocation: geolocation ?? undefined,
            deviceInfo: deviceInfo ?? undefined
        };
    }

    private async getGeolocation(): Promise<AuditMetadata['geolocation']> {
        // In a real implementation, this would use IP geolocation service
        // Return undefined if geolocation is not available
        try {
            return {
                country: 'KE',
                region: 'Nairobi',
                city: 'Nairobi'
            };
        } catch {
            return undefined;
        }
    }

    private getDeviceInfo(): AuditMetadata['deviceInfo'] {
        if (typeof window !== 'undefined' && window.navigator) {
            return {
                type: 'web',
                os: this.detectOS(window.navigator.userAgent) ?? undefined,
                browser: this.detectBrowser(window.navigator.userAgent) ?? undefined
            };
        }
        return {
            type: 'server'
        };
    }

    private detectOS(userAgent: string): string | undefined {
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'macOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iOS')) return 'iOS';
        return undefined;
    }

    private detectBrowser(userAgent: string): string | undefined {
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return undefined;
    }

    private async handleHighRiskEvent(event: AuditEvent): Promise<void> {
        // In a real implementation, this would:
        // 1. Send alerts to security team
        // 2. Trigger automated responses
        // 3. Update threat intelligence
        // 4. Log to external SIEM systems

        console.warn(`High-risk audit event detected:`, {
            id: event.id,
            type: event.eventType,
            riskScore: event.riskScore,
            userId: event.userId
        });
    }

    private async persistEvent(event: AuditEvent): Promise<void> {
        // In a real implementation, this would persist to database
        // For now, we'll just ensure memory limits
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }
    }

    private cleanup(): void {
        // Remove events older than 30 days from memory
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        this.events = this.events.filter(e => e.timestamp > thirtyDaysAgo);
    }

    private convertToCSV(events: AuditEvent[]): string {
        if (events.length === 0) return '';

        const headers = [
            'ID', 'Timestamp', 'Event Type', 'Severity', 'Category',
            'User ID', 'IP Address', 'Action', 'Risk Score', 'Compliance Flags'
        ];

        const rows = events.map(event => [
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
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    private convertToXML(events: AuditEvent[]): string {
        const xmlEvents = events.map(event => `
    <event>
      <id>${event.id}</id>
      <timestamp>${event.timestamp.toISOString()}</timestamp>
      <eventType>${event.eventType}</eventType>
      <severity>${event.severity}</severity>
      <category>${event.category}</category>
      <userId>${event.userId || ''}</userId>
      <ipAddress>${event.ipAddress || ''}</ipAddress>
      <action>${event.action}</action>
      <riskScore>${event.riskScore}</riskScore>
      <complianceFlags>${event.complianceFlags.join(',')}</complianceFlags>
    </event>`).join('');

        return `<?xml version="1.0" encoding="UTF-8"?>
<auditTrail>
  <events>${xmlEvents}
  </events>
</auditTrail>`;
    }
}

// Singleton instance
export const auditTrailService = new AuditTrailService();

// Convenience functions for common audit events
export const auditLogger = {
    // Authentication events
    loginSuccess: (userId: string, context?: SecurityContext) =>
        auditTrailService.logEvent(AuditEventType.LOGIN_SUCCESS, 'user_login', { userId }, context),

    loginFailure: (username: string, reason: string, context?: SecurityContext) =>
        auditTrailService.logEvent(AuditEventType.LOGIN_FAILURE, 'user_login_failed', { username, reason }, context),

    logout: (userId: string, context?: SecurityContext) =>
        auditTrailService.logEvent(AuditEventType.LOGOUT, 'user_logout', { userId }, context),

    // Data access events
    dataRead: (resource: string, recordCount: number, context?: SecurityContext) =>
        auditTrailService.logEvent(AuditEventType.DATA_READ, 'data_access', { resource, recordCount }, context),

    dataCreate: (resource: string, recordId: string, context?: SecurityContext) =>
        auditTrailService.logEvent(AuditEventType.DATA_CREATE, 'data_create', { resource, recordId }, context),

    dataUpdate: (resource: string, recordId: string, changes: any, context?: SecurityContext) =>
        auditTrailService.logEvent(AuditEventType.DATA_UPDATE, 'data_update', { resource, recordId, changes }, context),

    dataDelete: (resource: string, recordId: string, context?: SecurityContext) =>
        auditTrailService.logEvent(AuditEventType.DATA_DELETE, 'data_delete', { resource, recordId }, context),

    // Security events
    suspiciousActivity: (description: string, evidence: any, context?: SecurityContext) =>
        auditTrailService.logEvent(AuditEventType.SUSPICIOUS_ACTIVITY, 'security_alert', { description, evidence }, context),

    rateLimitExceeded: (endpoint: string, attempts: number, context?: SecurityContext) =>
        auditTrailService.logEvent(AuditEventType.RATE_LIMIT_EXCEEDED, 'rate_limit', { endpoint, attempts }, context),

    // Property events
    propertyView: (propertyId: string, context?: SecurityContext) =>
        auditTrailService.logEvent(AuditEventType.PROPERTY_VIEW, 'property_view', { propertyId }, context),

    propertyCreate: (propertyId: string, propertyData: any, context?: SecurityContext) =>
        auditTrailService.logEvent(AuditEventType.PROPERTY_CREATE, 'property_create', { propertyId, propertyData }, context),

    documentUpload: (propertyId: string, documentType: string, fileSize: number, context?: SecurityContext) =>
        auditTrailService.logEvent(AuditEventType.DOCUMENT_UPLOAD, 'document_upload', { propertyId, documentType, fileSize }, context)
};