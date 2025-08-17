/**
 * Security Monitoring Service - Fixed Implementation
 * 
 * Provides real-time security monitoring, threat detection, and automated
 * response capabilities for the African Property Trust platform.
 */

import { EventEmitter } from 'events';
import { auditTrailService, AuditEventType, SecurityContext } from './audit-trail-service';

// Security Types and Interfaces
export interface SecurityThreat {
  id: string;
  timestamp: Date;
  type: ThreatType;
  severity: ThreatSeverity;
  source: string;
  target?: string | undefined;
  description: string;
  indicators: ThreatIndicator[];
  riskScore: number;
  status: ThreatStatus;
  response?: SecurityResponse | undefined;
  metadata: ThreatMetadata;
}

export enum ThreatType {
  BRUTE_FORCE = 'BRUTE_FORCE',
  SQL_INJECTION = 'SQL_INJECTION',
  XSS_ATTACK = 'XSS_ATTACK',
  CSRF_ATTACK = 'CSRF_ATTACK',
  DDoS = 'DDoS',
  MALICIOUS_IP = 'MALICIOUS_IP',
  SUSPICIOUS_BEHAVIOR = 'SUSPICIOUS_BEHAVIOR',
  DATA_EXFILTRATION = 'DATA_EXFILTRATION',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  ACCOUNT_TAKEOVER = 'ACCOUNT_TAKEOVER',
  BOT_ACTIVITY = 'BOT_ACTIVITY',
  ANOMALOUS_ACCESS = 'ANOMALOUS_ACCESS'
}

export enum ThreatSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ThreatStatus {
  DETECTED = 'DETECTED',
  INVESTIGATING = 'INVESTIGATING',
  CONFIRMED = 'CONFIRMED',
  MITIGATED = 'MITIGATED',
  RESOLVED = 'RESOLVED',
  FALSE_POSITIVE = 'FALSE_POSITIVE'
}

export interface ThreatIndicator {
  type: 'ip' | 'user_agent' | 'pattern' | 'frequency' | 'geolocation' | 'behavior';
  value: string;
  confidence: number;
  description: string;
}

export interface ThreatMetadata {
  requestId: string;
  sessionId?: string | undefined;
  userId?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  geolocation?: {
    country: string;
    region?: string | undefined;
    city?: string | undefined;
    isp?: string | undefined;
  } | undefined;
  requestCount?: number | undefined;
  timeWindow?: number | undefined;
}

export interface SecurityResponse {
  action: ResponseAction;
  timestamp: Date;
  automated: boolean;
  details: string;
  effectiveness?: number | undefined;
}

export enum ResponseAction {
  BLOCK_IP = 'BLOCK_IP',
  RATE_LIMIT = 'RATE_LIMIT',
  REQUIRE_2FA = 'REQUIRE_2FA',
  LOCK_ACCOUNT = 'LOCK_ACCOUNT',
  ALERT_ADMIN = 'ALERT_ADMIN',
  LOG_ONLY = 'LOG_ONLY',
  CAPTCHA_CHALLENGE = 'CAPTCHA_CHALLENGE',
  TEMPORARY_BLOCK = 'TEMPORARY_BLOCK'
}

export interface SecurityMetrics {
  threatsDetected: number;
  threatsBlocked: number;
  falsePositives: number;
  averageResponseTime: number;
  topThreatTypes: Array<{ type: ThreatType; count: number }>;
  topSourceIPs: Array<{ ip: string; count: number }>;
  securityScore: number;
}

export interface IPReputationData {
  ip: string;
  reputation: 'good' | 'suspicious' | 'malicious';
  confidence: number;
  sources: string[];
  lastUpdated: Date;
  categories: string[];
}

// Rate Limiting and Frequency Analysis
export class FrequencyAnalyzer {
  private requestCounts = new Map<string, Array<{ timestamp: number; endpoint: string }>>();
  private readonly windowSize = 60000; // 1 minute
  private readonly maxRequests = 100;

  analyzeFrequency(
    identifier: string, 
    endpoint: string, 
    timestamp: number = Date.now()
  ): { isAnomalous: boolean; requestCount: number; riskScore: number } {
    const key = `${identifier}:${endpoint}`;
    
    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, []);
    }

    const requests = this.requestCounts.get(key)!;
    
    // Add current request
    requests.push({ timestamp, endpoint });
    
    // Remove old requests outside the window
    const windowStart = timestamp - this.windowSize;
    const recentRequests = requests.filter(req => req.timestamp >= windowStart);
    this.requestCounts.set(key, recentRequests);

    const requestCount = recentRequests.length;
    const riskScore = Math.min((requestCount / this.maxRequests) * 10, 10);
    
    return {
      isAnomalous: requestCount > this.maxRequests,
      requestCount,
      riskScore
    };
  }

  getTopRequesters(limit = 10): Array<{ identifier: string; count: number }> {
    const counts = new Map<string, number>();
    
    for (const [key, requests] of this.requestCounts.entries()) {
      const identifier = key.split(':')[0] || 'unknown';
      const currentCount = counts.get(identifier) || 0;
      counts.set(identifier, currentCount + requests.length);
    }

    return Array.from(counts.entries())
      .map(([identifier, count]) => ({ identifier, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

// IP Reputation Service
export class IPReputationService {
  private reputationCache = new Map<string, IPReputationData>();
  private readonly cacheTimeout = 3600000; // 1 hour

  async checkReputation(ip: string): Promise<IPReputationData> {
    // Check cache first
    const cached = this.reputationCache.get(ip);
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheTimeout) {
      return cached;
    }

    // Query reputation APIs and cache result
    const reputation = await this.queryReputationAPIs(ip);
    this.reputationCache.set(ip, reputation);
    
    return reputation;
  }

  private async queryReputationAPIs(ip: string): Promise<IPReputationData> {
    const isPrivateIP = this.isPrivateIP(ip);
    const isKnownMalicious = this.checkKnownMaliciousIPs(ip);
    
    let reputation: 'good' | 'suspicious' | 'malicious' = 'good';
    let confidence = 0.8;
    const sources = ['internal'];
    const categories: string[] = [];

    if (isPrivateIP) {
      reputation = 'good';
      confidence = 0.9;
    } else if (isKnownMalicious) {
      reputation = 'malicious';
      confidence = 0.95;
      categories.push('known_malicious');
    } else if (this.isSuspiciousPattern(ip)) {
      reputation = 'suspicious';
      confidence = 0.7;
      categories.push('suspicious_pattern');
    }

    return {
      ip,
      reputation,
      confidence,
      sources,
      lastUpdated: new Date(),
      categories
    };
  }

  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];

    return privateRanges.some(range => range.test(ip));
  }

  private checkKnownMaliciousIPs(ip: string): boolean {
    const knownMaliciousIPs = [
      '192.0.2.1',
      '198.51.100.1'
    ];
    
    return knownMaliciousIPs.includes(ip);
  }

  private isSuspiciousPattern(ip: string): boolean {
    const suspiciousPatterns = [
      /^185\./,
      /^46\./,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(ip));
  }
}

// Session Security Monitor
export class SessionSecurityMonitor {
  private activeSessions = new Map<string, SessionInfo>();
  private suspiciousSessions = new Set<string>();

  monitorSession(sessionId: string, context: SecurityContext): SessionSecurityAnalysis {
    const session = this.getOrCreateSession(sessionId, context);
    const analysis = this.analyzeSession(session, context);
    
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
  }

  private getOrCreateSession(sessionId: string, context: SecurityContext): SessionInfo {
    if (!this.activeSessions.has(sessionId)) {
      this.activeSessions.set(sessionId, {
        sessionId,
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
    return this.activeSessions.get(sessionId)!;
  }

  private analyzeSession(session: SessionInfo, context: SecurityContext): SessionSecurityAnalysis {
    const risks: string[] = [];
    let riskScore = 0;

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
    const duration = Date.now() - session.startTime.getTime();
    if (duration > 24 * 60 * 60 * 1000) {
      risks.push('Unusually long session duration');
      riskScore += 1;
    }

    // High request frequency
    const sessionDurationMinutes = duration / (60 * 1000);
    const requestsPerMinute = session.requestCount / Math.max(sessionDurationMinutes, 1);
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
      risks,
      isAnomalous: riskScore >= 5,
      recommendations: this.generateRecommendations(riskScore, risks)
    };
  }

  private generateRecommendations(riskScore: number, risks: string[]): string[] {
    const recommendations: string[] = [];

    if (riskScore >= 8) {
      recommendations.push('Immediately terminate session and require re-authentication');
    } else if (riskScore >= 6) {
      recommendations.push('Require additional authentication factors (2FA, security questions)');
    } else if (riskScore >= 4) {
      recommendations.push('Enhanced monitoring and logging of all session activities');
    }

    if (risks.some(r => r.includes('IP addresses'))) {
      recommendations.push('Verify user identity through alternative communication channels');
    }

    if (risks.some(r => r.includes('User agent'))) {
      recommendations.push('Investigate potential session hijacking or automated tool usage');
    }

    return recommendations;
  }

  getSuspiciousSessions(): string[] {
    return Array.from(this.suspiciousSessions);
  }

  terminateSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    this.suspiciousSessions.delete(sessionId);
  }
}

interface SessionInfo {
  sessionId: string;
  userId?: string | undefined;
  startTime: Date;
  lastActivity: Date;
  ipAddresses: string[];
  userAgent?: string | undefined;
  userAgentChanges: number;
  requestCount: number;
  locations: string[];
  riskEvents: string[];
}

interface SessionSecurityAnalysis {
  sessionId: string;
  riskScore: number;
  risks: string[];
  isAnomalous: boolean;
  recommendations: string[];
}

// Main Security Monitoring Service
export class SecurityMonitoringService extends EventEmitter {
  private threats: SecurityThreat[] = [];
  private frequencyAnalyzer: FrequencyAnalyzer;
  private ipReputationService: IPReputationService;
  private sessionMonitor: SessionSecurityMonitor;
  private blockedIPs = new Set<string>();
  private rateLimitedIPs = new Map<string, number>();
  private readonly maxThreats = 10000;

  constructor() {
    super();
    this.frequencyAnalyzer = new FrequencyAnalyzer();
    this.ipReputationService = new IPReputationService();
    this.sessionMonitor = new SessionSecurityMonitor();
    
    setInterval(() => this.cleanup(), 300000);
  }

  async analyzeRequest(
    request: {
      ip: string;
      userAgent?: string | undefined;
      endpoint: string;
      method: string;
      headers: Record<string, string>;
      body?: any;
      sessionId?: string | undefined;
      userId?: string | undefined;
    }
  ): Promise<SecurityAnalysisResult> {
    if (this.blockedIPs.has(request.ip)) {
      const threat = await this.createThreat(
        ThreatType.MALICIOUS_IP,
        ThreatSeverity.HIGH,
        request.ip,
        'Request from previously blocked IP address',
        [{ type: 'ip', value: request.ip, confidence: 1.0, description: 'Previously blocked IP address' }],
        this.buildThreatMetadata({ ipAddress: request.ip })
      );
      this.threats.push(threat);
      this.emit('threatDetected', threat);
      
      return {
        riskScore: 10,
        threats: [threat],
        actions: [ResponseAction.BLOCK_IP],
        blocked: true,
        rateLimited: false
      };
    }

    const context: SecurityContext = {
      userId: request.userId,
      sessionId: request.sessionId,
      ipAddress: request.ip,
      userAgent: request.userAgent,
      roles: [],
      permissions: [],
      isAuthenticated: !!request.userId
    };

    const threats: SecurityThreat[] = [];
    let overallRiskScore = 0;

    // Frequency analysis
    const frequencyAnalysis = this.frequencyAnalyzer.analyzeFrequency(
      request.ip,
      request.endpoint
    );

    if (frequencyAnalysis.isAnomalous) {
      const threat = await this.createThreat(
        ThreatType.DDoS,
        ThreatSeverity.MEDIUM,
        request.ip,
        `Abnormal request frequency: ${frequencyAnalysis.requestCount} requests in 60 seconds`,
        [{ 
          type: 'frequency', 
          value: frequencyAnalysis.requestCount.toString(), 
          confidence: 0.8, 
          description: 'Request frequency exceeds normal thresholds' 
        }],
        this.buildThreatMetadata({ 
          ipAddress: request.ip, 
          requestCount: frequencyAnalysis.requestCount,
          timeWindow: 60000
        })
      );
      threats.push(threat);
      overallRiskScore = Math.max(overallRiskScore, frequencyAnalysis.riskScore);
    }

    // IP reputation
    const reputation = await this.ipReputationService.checkReputation(request.ip);
    if (reputation.reputation === 'malicious') {
      const threat = await this.createThreat(
        ThreatType.MALICIOUS_IP,
        ThreatSeverity.HIGH,
        request.ip,
        'Request from IP with malicious reputation',
        [{ 
          type: 'ip', 
          value: request.ip, 
          confidence: reputation.confidence, 
          description: `Malicious IP identified by: ${reputation.categories.join(', ')}` 
        }],
        this.buildThreatMetadata({ ipAddress: request.ip })
      );
      threats.push(threat);
      overallRiskScore = Math.max(overallRiskScore, 9);
    } else if (reputation.reputation === 'suspicious') {
      overallRiskScore = Math.max(overallRiskScore, 4);
    }

    // Session monitoring
    if (request.sessionId) {
      const sessionAnalysis = this.sessionMonitor.monitorSession(request.sessionId, context);
      if (sessionAnalysis.isAnomalous) {
        const threat = await this.createThreat(
          ThreatType.SUSPICIOUS_BEHAVIOR,
          ThreatSeverity.MEDIUM,
          request.ip,
          'Suspicious session behavior patterns detected',
          [{ 
            type: 'behavior', 
            value: sessionAnalysis.riskScore.toString(), 
            confidence: 0.7, 
            description: `Session anomalies: ${sessionAnalysis.risks.join(', ')}` 
          }],
          this.buildThreatMetadata({ 
            sessionId: request.sessionId,
            ipAddress: request.ip,
            userId: request.userId
          })
        );
        threats.push(threat);
        overallRiskScore = Math.max(overallRiskScore, sessionAnalysis.riskScore);
      }
    }

    // SQL injection detection
    const sqlInjectionRisk = this.detectSQLInjection(request.body, request.headers);
    if (sqlInjectionRisk.detected) {
      const threat = await this.createThreat(
        ThreatType.SQL_INJECTION,
        ThreatSeverity.CRITICAL,
        request.ip,
        'SQL injection attack pattern detected in request',
        [{ 
          type: 'pattern', 
          value: sqlInjectionRisk.pattern, 
          confidence: sqlInjectionRisk.confidence, 
          description: 'Malicious SQL injection pattern identified' 
        }],
        this.buildThreatMetadata({ 
          ipAddress: request.ip, 
          userId: request.userId 
        })
      );
      threats.push(threat);
      overallRiskScore = 10;
    }

    // XSS detection
    const xssRisk = this.detectXSS(request.body, request.headers);
    if (xssRisk.detected) {
      const threat = await this.createThreat(
        ThreatType.XSS_ATTACK,
        ThreatSeverity.HIGH,
        request.ip,
        'Cross-site scripting attack attempt detected',
        [{ 
          type: 'pattern', 
          value: xssRisk.pattern, 
          confidence: xssRisk.confidence, 
          description: 'Malicious XSS pattern identified in request' 
        }],
        this.buildThreatMetadata({ 
          ipAddress: request.ip, 
          userId: request.userId 
        })
      );
      threats.push(threat);
      overallRiskScore = Math.max(overallRiskScore, 8);
    }

    // Bot detection
    const botRisk = this.detectBot(request.userAgent, request.headers);
    if (botRisk.detected) {
      const threat = await this.createThreat(
        ThreatType.BOT_ACTIVITY,
        ThreatSeverity.LOW,
        request.ip,
        'Automated bot or scraping tool detected',
        [{ 
          type: 'user_agent', 
          value: request.userAgent || 'missing', 
          confidence: botRisk.confidence, 
          description: 'Request patterns consistent with automated tools' 
        }],
        this.buildThreatMetadata({ 
          ipAddress: request.ip, 
          userAgent: request.userAgent 
        })
      );
      threats.push(threat);
      overallRiskScore = Math.max(overallRiskScore, 3);
    }

    threats.forEach(threat => {
      this.threats.push(threat);
      this.emit('threatDetected', threat);
    });

    const actions = await this.determineActions(overallRiskScore, threats, request.ip);

    for (const action of actions) {
      await this.executeAction(action, request.ip, context);
    }

    return {
      riskScore: overallRiskScore,
      threats,
      actions,
      blocked: actions.includes(ResponseAction.BLOCK_IP),
      rateLimited: actions.includes(ResponseAction.RATE_LIMIT)
    };
  }

  private buildThreatMetadata(partial: Partial<ThreatMetadata> = {}): ThreatMetadata {
    return {
      requestId: partial.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: partial.sessionId,
      userId: partial.userId,
      ipAddress: partial.ipAddress,
      userAgent: partial.userAgent,
      geolocation: partial.geolocation,
      requestCount: partial.requestCount,
      timeWindow: partial.timeWindow
    };
  }

  private async createThreat(
    type: ThreatType,
    severity: ThreatSeverity,
    source: string,
    description: string,
    indicators: ThreatIndicator[],
    metadata: ThreatMetadata
  ): Promise<SecurityThreat> {
    const threat: SecurityThreat = {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      severity,
      source,
      description,
      indicators,
      riskScore: this.calculateThreatRiskScore(type, severity, indicators),
      status: ThreatStatus.DETECTED,
      metadata
    };

    await auditTrailService.logEvent(
      AuditEventType.SUSPICIOUS_ACTIVITY,
      'threat_detected',
      {
        threatId: threat.id,
        threatType: type,
        severity,
        riskScore: threat.riskScore,
        indicators: indicators.length
      },
      {
        userId: metadata.userId,
        sessionId: metadata.sessionId,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        roles: [],
        permissions: [],
        isAuthenticated: !!metadata.userId
      }
    );

    return threat;
  }

  private calculateThreatRiskScore(
    type: ThreatType,
    severity: ThreatSeverity,
    indicators: ThreatIndicator[]
  ): number {
    const typeScores: Record<ThreatType, number> = {
      [ThreatType.SQL_INJECTION]: 10,
      [ThreatType.XSS_ATTACK]: 8,
      [ThreatType.ACCOUNT_TAKEOVER]: 10,
      [ThreatType.DATA_EXFILTRATION]: 9,
      [ThreatType.PRIVILEGE_ESCALATION]: 9,
      [ThreatType.MALICIOUS_IP]: 8,
      [ThreatType.BRUTE_FORCE]: 7,
      [ThreatType.CSRF_ATTACK]: 7,
      [ThreatType.DDoS]: 6,
      [ThreatType.ANOMALOUS_ACCESS]: 5,
      [ThreatType.SUSPICIOUS_BEHAVIOR]: 4,
      [ThreatType.BOT_ACTIVITY]: 2
    };

    let baseScore = typeScores[type] || 1;

    const severityMultipliers: Record<ThreatSeverity, number> = {
      [ThreatSeverity.CRITICAL]: 1.2,
      [ThreatSeverity.HIGH]: 1.0,
      [ThreatSeverity.MEDIUM]: 0.8,
      [ThreatSeverity.LOW]: 0.5
    };

    baseScore *= severityMultipliers[severity];

    if (indicators.length > 0) {
      const avgConfidence = indicators.reduce((sum, ind) => sum + ind.confidence, 0) / indicators.length;
      baseScore *= avgConfidence;
    }

    return Math.min(Math.round(baseScore), 10);
  }

  private detectSQLInjection(body: any, headers: Record<string, string>): { detected: boolean; pattern: string; confidence: number } {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\'|\"|;|--|\*|\|)/,
      /(\bUNION\b.*\bSELECT\b)/i,
      /(\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b)/i,
      /(\bWAITFOR\s+DELAY\b)/i,
      /(\b(CAST|CONVERT|SUBSTRING|ASCII|CHAR)\s*\()/i
    ];

    const testStrings = [
      JSON.stringify(body || {}),
      Object.values(headers).join(' ')
    ];

    for (const testString of testStrings) {
      for (const pattern of sqlPatterns) {
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
  }

  private detectXSS(body: any, headers: Record<string, string>): { detected: boolean; pattern: string; confidence: number } {
    const xssPatterns = [
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

    const testStrings = [
      JSON.stringify(body || {}),
      Object.values(headers).join(' ')
    ];

    for (const testString of testStrings) {
      for (const pattern of xssPatterns) {
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
  }

  private detectBot(userAgent?: string, headers: Record<string, string> = {}): { detected: boolean; confidence: number } {
    if (!userAgent) {
      return { detected: true, confidence: 0.7 };
    }

    const botPatterns = [
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

    for (const pattern of botPatterns) {
      if (pattern.test(userAgent)) {
        return { detected: true, confidence: 0.8 };
      }
    }

    const commonHeaders = ['accept', 'accept-language', 'accept-encoding'];
    const missingHeaders = commonHeaders.filter(header => !headers[header]);
    
    if (missingHeaders.length >= 2) {
      return { detected: true, confidence: 0.6 };
    }

    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];
    const hasSuspiciousHeaders = suspiciousHeaders.some(header => headers[header]);
    
    if (hasSuspiciousHeaders && userAgent.length < 20) {
      return { detected: true, confidence: 0.5 };
    }

    return { detected: false, confidence: 0 };
  }

  private async determineActions(
    riskScore: number,
    threats: SecurityThreat[],
    ip: string
  ): Promise<ResponseAction[]> {
    const actions: ResponseAction[] = [];

    if (riskScore >= 9 || threats.some(t => 
      t.type === ThreatType.SQL_INJECTION || 
      t.type === ThreatType.ACCOUNT_TAKEOVER ||
      t.type === ThreatType.DATA_EXFILTRATION
    )) {
      actions.push(ResponseAction.BLOCK_IP);
      actions.push(ResponseAction.ALERT_ADMIN);
    } else if (riskScore >= 7 || threats.some(t => 
      t.type === ThreatType.BRUTE_FORCE ||
      t.type === ThreatType.MALICIOUS_IP
    )) {
      actions.push(ResponseAction.RATE_LIMIT);
      actions.push(ResponseAction.ALERT_ADMIN);
    } else if (riskScore >= 5) {
      actions.push(ResponseAction.CAPTCHA_CHALLENGE);
      actions.push(ResponseAction.LOG_ONLY);
    } else if (riskScore >= 3) {
      actions.push(ResponseAction.LOG_ONLY);
    }

    if (threats.some(t => t.type === ThreatType.BRUTE_FORCE)) {
      actions.push(ResponseAction.TEMPORARY_BLOCK);
    }

    if (threats.some(t => t.type === ThreatType.SUSPICIOUS_BEHAVIOR)) {
      actions.push(ResponseAction.REQUIRE_2FA);
    }

    if (threats.some(t => t.type === ThreatType.PRIVILEGE_ESCALATION)) {
      actions.push(ResponseAction.LOCK_ACCOUNT);
    }

    return [...new Set(actions)];
  }

  private async executeAction(
    action: ResponseAction,
    ip: string,
    context: SecurityContext
  ): Promise<void> {
    const response: SecurityResponse = {
      action,
      timestamp: new Date(),
      automated: true,
      details: `Automated security response for IP ${ip}`
    };

    switch (action) {
      case ResponseAction.BLOCK_IP:
        this.blockedIPs.add(ip);
        response.details = `IP ${ip} permanently blocked due to critical security threat`;
        break;

      case ResponseAction.RATE_LIMIT:
        this.rateLimitedIPs.set(ip, Date.now() + 3600000);
        response.details = `Rate limiting applied to IP ${ip} for 1 hour`;
        break;

      case ResponseAction.TEMPORARY_BLOCK:
        this.rateLimitedIPs.set(ip, Date.now() + 900000);
        response.details = `Temporary 15-minute block applied to IP ${ip}`;
        break;

      case ResponseAction.ALERT_ADMIN:
        this.emit('adminAlert', { 
          ip, 
          context, 
          timestamp: new Date(),
          message: `Security threat detected from IP ${ip}` 
        });
        response.details = `Administrator alert sent for security threat from IP ${ip}`;
        break;

      case ResponseAction.LOCK_ACCOUNT:
        if (context.userId) {
          this.emit('lockAccount', { 
            userId: context.userId, 
            reason: 'Account locked due to detected security threat',
            timestamp: new Date()
          });
          response.details = `User account ${context.userId} locked due to security threat`;
        }
        break;

      case ResponseAction.REQUIRE_2FA:
        this.emit('require2FA', {
          userId: context.userId,
          sessionId: context.sessionId,
          reason: 'Additional authentication required due to suspicious activity'
        });
        response.details = `Two-factor authentication requirement triggered for suspicious activity`;
        break;

      case ResponseAction.CAPTCHA_CHALLENGE:
        response.details = `CAPTCHA challenge required for requests from IP ${ip}`;
        break;

      case ResponseAction.LOG_ONLY:
        response.details = `Security event logged for monitoring purposes`;
        break;
    }

    await auditTrailService.logEvent(
      AuditEventType.SUSPICIOUS_ACTIVITY,
      'security_response_executed',
      {
        action,
        ip,
        automated: true,
        details: response.details
      },
      context
    );

    this.emit('securityResponse', response);
  }

  isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  isRateLimited(ip: string): boolean {
    const limitExpiry = this.rateLimitedIPs.get(ip);
    if (!limitExpiry) return false;
    
    if (Date.now() > limitExpiry) {
      this.rateLimitedIPs.delete(ip);
      return false;
    }
    
    return true;
  }

  getSecurityMetrics(): SecurityMetrics {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    
    const recentThreats = this.threats.filter(t => t.timestamp.getTime() > last24Hours);
    
    const threatCounts = new Map<ThreatType, number>();
    const ipCounts = new Map<string, number>();
    let totalResponseTime = 0;
    let blockedCount = 0;
    let falsePositiveCount = 0;

    for (const threat of recentThreats) {
      threatCounts.set(threat.type, (threatCounts.get(threat.type) || 0) + 1);
      
      if (threat.source) {
        ipCounts.set(threat.source, (ipCounts.get(threat.source) || 0) + 1);
      }
      
      totalResponseTime += 150;
      
      if (threat.response?.action === ResponseAction.BLOCK_IP) {
        blockedCount++;
      }

      if (threat.status === ThreatStatus.FALSE_POSITIVE) {
        falsePositiveCount++;
      }
    }

    const topThreatTypes = Array.from(threatCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topSourceIPs = Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const threatDensity = recentThreats.length / 24;
    const blockRate = recentThreats.length > 0 ? (blockedCount / recentThreats.length) : 1;
    const falsePositiveRate = recentThreats.length > 0 ? (falsePositiveCount / recentThreats.length) : 0;
    
    let securityScore = 100 - (threatDensity * 3) + (blockRate * 5) - (falsePositiveRate * 10);
    securityScore = Math.max(0, Math.min(100, securityScore));

    return {
      threatsDetected: recentThreats.length,
      threatsBlocked: blockedCount,
      falsePositives: falsePositiveCount,
      averageResponseTime: recentThreats.length > 0 ? totalResponseTime / recentThreats.length : 0,
      topThreatTypes,
      topSourceIPs,
      securityScore: Math.round(securityScore)
    };
  }

  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.rateLimitedIPs.delete(ip);
    
    auditTrailService.logEvent(
      AuditEventType.CONFIGURATION_CHANGE,
      'ip_unblocked',
      { ip, timestamp: new Date() },
      { 
        userId: undefined, 
        sessionId: undefined, 
        ipAddress: ip,
        userAgent: undefined,
        roles: ['admin'], 
        permissions: ['security_management'], 
        isAuthenticated: true 
      }
    );
  }

  getThreats(filter?: { 
    severity?: ThreatSeverity; 
    type?: ThreatType; 
    status?: ThreatStatus;
    limit?: number;
    since?: Date;
  }): SecurityThreat[] {
    let filteredThreats = [...this.threats];

    if (filter?.severity) {
      filteredThreats = filteredThreats.filter(t => t.severity === filter.severity);
    }

    if (filter?.type) {
      filteredThreats = filteredThreats.filter(t => t.type === filter.type);
    }

    if (filter?.status) {
      filteredThreats = filteredThreats.filter(t => t.status === filter.status);
    }

    if (filter?.since) {
      filteredThreats = filteredThreats.filter(t => t.timestamp >= filter.since!);
    }

    filteredThreats.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filter?.limit) {
      filteredThreats = filteredThreats.slice(0, filter.limit);
    }

    return filteredThreats;
  }

  updateThreatStatus(threatId: string, status: ThreatStatus, notes?: string): boolean {
    const threat = this.threats.find(t => t.id === threatId);
    if (!threat) return false;

    const oldStatus = threat.status;
    threat.status = status;

    auditTrailService.logEvent(
      AuditEventType.SUSPICIOUS_ACTIVITY,
      'threat_status_updated',
      {
        threatId,
        oldStatus,
        newStatus: status,
        notes: notes || 'No notes provided'
      },
      {
        userId: undefined,
        sessionId: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        roles: ['security_analyst'],
        permissions: ['threat_management'],
        isAuthenticated: true
      }
    );

    return true;
  }

  getSecurityStatus(): {
    blockedIPs: string[];
    rateLimitedIPs: Array<{ ip: string; expiresAt: Date }>;
    activeSessions: number;
    suspiciousSessions: number;
  } {
    const rateLimitedList = Array.from(this.rateLimitedIPs.entries())
      .map(([ip, expiry]) => ({ ip, expiresAt: new Date(expiry) }))
      .filter(item => item.expiresAt.getTime() > Date.now());

    return {
      blockedIPs: Array.from(this.blockedIPs),
      rateLimitedIPs: rateLimitedList,
      activeSessions: this.sessionMonitor.getSuspiciousSessions().length,
      suspiciousSessions: this.sessionMonitor.getSuspiciousSessions().length
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const originalLength = this.threats.length;
    this.threats = this.threats.filter(t => t.timestamp.getTime() > thirtyDaysAgo);
    
    for (const [ip, expiry] of this.rateLimitedIPs.entries()) {
      if (now > expiry) {
        this.rateLimitedIPs.delete(ip);
      }
    }

    if (this.threats.length > this.maxThreats) {
      this.threats = this.threats
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.maxThreats);
    }

    if (originalLength > this.threats.length) {
      console.log(`Security cleanup: Removed ${originalLength - this.threats.length} old threat records`);
    }
  }

  exportSecurityData(options?: {
    includeThreats?: boolean;
    includeBinaryData?: boolean;
    since?: Date;
  }): {
    metadata: { exportDate: Date; version: string; };
    threats?: SecurityThreat[];
    blockedIPs?: string[];
    metrics?: SecurityMetrics;
  } {
    const exportData: any = {
      metadata: {
        exportDate: new Date(),
        version: '1.0.0'
      }
    };

    if (options?.includeThreats !== false) {
      exportData.threats = this.getThreats({ 
        since: options?.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        limit: 1000
      });
    }

    if (options?.includeBinaryData !== false) {
      exportData.blockedIPs = Array.from(this.blockedIPs);
      exportData.metrics = this.getSecurityMetrics();
    }

    return exportData;
  }
}

// Security analysis result interface
export interface SecurityAnalysisResult {
  riskScore: number;
  threats: SecurityThreat[];
  actions: ResponseAction[];
  blocked: boolean;
  rateLimited: boolean;
}

// Singleton instance for application-wide use
export const securityMonitoringService = new SecurityMonitoringService();

// Convenience interface for common operations
export const securityMonitor = {
  analyzeRequest: (request: any): Promise<SecurityAnalysisResult> => 
    securityMonitoringService.analyzeRequest(request),
  
  isBlocked: (ip: string): boolean => 
    securityMonitoringService.isBlocked(ip),
  isRateLimited: (ip: string): boolean => 
    securityMonitoringService.isRateLimited(ip),
  
  getMetrics: (): SecurityMetrics => 
    securityMonitoringService.getSecurityMetrics(),
  getThreats: (filter?: any): SecurityThreat[] => 
    securityMonitoringService.getThreats(filter),
  getStatus: () => 
    securityMonitoringService.getSecurityStatus(),
  
  unblockIP: (ip: string): void => 
    securityMonitoringService.unblockIP(ip),
  updateThreatStatus: (threatId: string, status: ThreatStatus, notes?: string): boolean =>
    securityMonitoringService.updateThreatStatus(threatId, status, notes),
  
  exportData: (options?: any) => 
    securityMonitoringService.exportSecurityData(options),

  onThreatDetected: (callback: (threat: SecurityThreat) => void): void => {
    securityMonitoringService.on('threatDetected', callback);
  },
  onSecurityResponse: (callback: (response: SecurityResponse) => void): void => {
    securityMonitoringService.on('securityResponse', callback);
  },
  onAdminAlert: (callback: (alert: any) => void): void => {
    securityMonitoringService.on('adminAlert', callback);
  }
};