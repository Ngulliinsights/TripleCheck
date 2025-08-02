import { createHash } from 'crypto';

/**
 * API call pattern for tracking
 */
interface ApiCallPattern {
  endpoint: string;
  timestamp: Date;
  method: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Suspicious activity detection result
 */
interface SuspiciousActivityResult {
  isSuspicious: boolean;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  recommendedAction: 'log' | 'warn' | 'block' | 'throttle';
}

/**
 * User activity summary
 */
interface UserActivitySummary {
  userId: number;
  totalCalls: number;
  uniqueEndpoints: number;
  suspiciousPatterns: number;
  lastActivity: Date;
  riskScore: number;
}

/**
 * Configuration for API call tracking
 */
export interface ApiCallTrackerConfig {
  maxCallsPerMinute: number;
  maxIdenticalCallsPerMinute: number;
  maxRapidFireCalls: number;
  rapidFireWindowMs: number;
  suspiciousPatternThreshold: number;
  trackingWindowMs: number;
  enableIpTracking: boolean;
  enableUserAgentTracking: boolean;
  alertThresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

/**
 * API Call Tracker for infinite call prevention
 * Detects and prevents suspicious API usage patterns
 */
export class ApiCallTracker {
  private static instance: ApiCallTracker;
  private userCallHistory = new Map<number, ApiCallPattern[]>();
  private ipCallHistory = new Map<string, ApiCallPattern[]>();
  private suspiciousPatterns = new Map<number, { count: number; lastAlert: Date; patterns: string[] }>();
  private blockedUsers = new Set<number>();
  private blockedIps = new Set<string>();
  private config: ApiCallTrackerConfig;

  constructor(config: Partial<ApiCallTrackerConfig> = {}) {
    this.config = {
      maxCallsPerMinute: 60,
      maxIdenticalCallsPerMinute: 10,
      maxRapidFireCalls: 5,
      rapidFireWindowMs: 1000, // 1 second
      suspiciousPatternThreshold: 3,
      trackingWindowMs: 300000, // 5 minutes
      enableIpTracking: true,
      enableUserAgentTracking: true,
      alertThresholds: {
        low: 50,
        medium: 100,
        high: 200
      },
      ...config
    };

    // Clean up old tracking data periodically
    setInterval(() => this.cleanupOldData(), 60000); // Every minute
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<ApiCallTrackerConfig>): ApiCallTracker {
    if (!ApiCallTracker.instance) {
      ApiCallTracker.instance = new ApiCallTracker(config);
    }
    return ApiCallTracker.instance;
  }

  /**
   * Track API call and check for suspicious patterns
   */
  trackApiCall(
    userId: number,
    endpoint: string,
    method: string = 'GET',
    ipAddress?: string,
    userAgent?: string
  ): SuspiciousActivityResult {
    const now = new Date();
    const callPattern: ApiCallPattern = {
      endpoint,
      timestamp: now,
      method,
      userAgent: this.config.enableUserAgentTracking ? userAgent : undefined,
      ipAddress: this.config.enableIpTracking ? ipAddress : undefined
    };

    // Check if user is already blocked
    if (this.blockedUsers.has(userId)) {
      return {
        isSuspicious: true,
        reason: 'User is currently blocked due to previous suspicious activity',
        severity: 'high',
        recommendedAction: 'block'
      };
    }

    // Check if IP is blocked
    if (ipAddress && this.blockedIps.has(ipAddress)) {
      return {
        isSuspicious: true,
        reason: 'IP address is currently blocked due to suspicious activity',
        severity: 'high',
        recommendedAction: 'block'
      };
    }

    // Add to user call history
    this.addToUserHistory(userId, callPattern);

    // Add to IP call history if tracking is enabled
    if (ipAddress && this.config.enableIpTracking) {
      this.addToIpHistory(ipAddress, callPattern);
    }

    // Analyze for suspicious patterns
    return this.analyzeSuspiciousActivity(userId, endpoint, method, ipAddress);
  }

  /**
   * Check if user should be allowed to make request
   */
  isRequestAllowed(userId: number, endpoint: string, ipAddress?: string): boolean {
    // Check blocked lists
    if (this.blockedUsers.has(userId)) {
      return false;
    }

    if (ipAddress && this.blockedIps.has(ipAddress)) {
      return false;
    }

    // Check current activity levels
    const userCalls = this.getUserRecentCalls(userId);
    const oneMinuteAgo = new Date(Date.now() - 60000);
    
    // Count calls in the last minute
    const recentCalls = userCalls.filter(call => call.timestamp > oneMinuteAgo);
    
    if (recentCalls.length >= this.config.maxCallsPerMinute) {
      return false;
    }

    // Check for identical calls
    const identicalCalls = recentCalls.filter(call => call.endpoint === endpoint);
    if (identicalCalls.length >= this.config.maxIdenticalCallsPerMinute) {
      return false;
    }

    // Check for rapid-fire requests
    const rapidFireWindow = new Date(Date.now() - this.config.rapidFireWindowMs);
    const rapidFireCalls = recentCalls.filter(call => call.timestamp > rapidFireWindow);
    if (rapidFireCalls.length >= this.config.maxRapidFireCalls) {
      return false;
    }

    return true;
  }

  /**
   * Get user activity summary
   */
  getUserActivitySummary(userId: number): UserActivitySummary {
    const userCalls = this.getUserRecentCalls(userId);
    const uniqueEndpoints = new Set(userCalls.map(call => call.endpoint)).size;
    const suspiciousData = this.suspiciousPatterns.get(userId);
    
    return {
      userId,
      totalCalls: userCalls.length,
      uniqueEndpoints,
      suspiciousPatterns: suspiciousData?.count || 0,
      lastActivity: userCalls.length > 0 ? userCalls[userCalls.length - 1].timestamp : new Date(0),
      riskScore: this.calculateRiskScore(userId)
    };
  }

  /**
   * Block user temporarily
   */
  blockUser(userId: number, durationMs: number = 300000): void {
    this.blockedUsers.add(userId);
    
    // Auto-unblock after duration
    setTimeout(() => {
      this.blockedUsers.delete(userId);
      console.log(`User ${userId} automatically unblocked after ${durationMs}ms`);
    }, durationMs);
    
    console.log(`User ${userId} blocked for ${durationMs}ms due to suspicious activity`);
  }

  /**
   * Block IP address temporarily
   */
  blockIp(ipAddress: string, durationMs: number = 300000): void {
    this.blockedIps.add(ipAddress);
    
    // Auto-unblock after duration
    setTimeout(() => {
      this.blockedIps.delete(ipAddress);
      console.log(`IP ${ipAddress} automatically unblocked after ${durationMs}ms`);
    }, durationMs);
    
    console.log(`IP ${ipAddress} blocked for ${durationMs}ms due to suspicious activity`);
  }

  /**
   * Unblock user manually
   */
  unblockUser(userId: number): boolean {
    const wasBlocked = this.blockedUsers.has(userId);
    this.blockedUsers.delete(userId);
    
    if (wasBlocked) {
      console.log(`User ${userId} manually unblocked`);
    }
    
    return wasBlocked;
  }

  /**
   * Unblock IP address manually
   */
  unblockIp(ipAddress: string): boolean {
    const wasBlocked = this.blockedIps.has(ipAddress);
    this.blockedIps.delete(ipAddress);
    
    if (wasBlocked) {
      console.log(`IP ${ipAddress} manually unblocked`);
    }
    
    return wasBlocked;
  }

  /**
   * Get tracking statistics
   */
  getStats(): {
    totalUsers: number;
    totalIps: number;
    blockedUsers: number;
    blockedIps: number;
    suspiciousUsers: number;
    memoryUsage: number;
  } {
    return {
      totalUsers: this.userCallHistory.size,
      totalIps: this.ipCallHistory.size,
      blockedUsers: this.blockedUsers.size,
      blockedIps: this.blockedIps.size,
      suspiciousUsers: this.suspiciousPatterns.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Clear tracking data for user
   */
  clearUserData(userId: number): void {
    this.userCallHistory.delete(userId);
    this.suspiciousPatterns.delete(userId);
    this.blockedUsers.delete(userId);
  }

  /**
   * Get most active users
   */
  getMostActiveUsers(limit: number = 10): UserActivitySummary[] {
    const summaries: UserActivitySummary[] = [];
    
    for (const userId of this.userCallHistory.keys()) {
      summaries.push(this.getUserActivitySummary(userId));
    }
    
    return summaries
      .sort((a, b) => b.totalCalls - a.totalCalls)
      .slice(0, limit);
  }

  /**
   * Get suspicious activity report
   */
  getSuspiciousActivityReport(): {
    highRiskUsers: UserActivitySummary[];
    blockedUsers: number[];
    blockedIps: string[];
    recentAlerts: Array<{ userId: number; patterns: string[]; timestamp: Date }>;
  } {
    const highRiskUsers = Array.from(this.userCallHistory.keys())
      .map(userId => this.getUserActivitySummary(userId))
      .filter(summary => summary.riskScore > 70)
      .sort((a, b) => b.riskScore - a.riskScore);

    const recentAlerts = Array.from(this.suspiciousPatterns.entries())
      .filter(([_, data]) => Date.now() - data.lastAlert.getTime() < 3600000) // Last hour
      .map(([userId, data]) => ({
        userId,
        patterns: data.patterns,
        timestamp: data.lastAlert
      }));

    return {
      highRiskUsers,
      blockedUsers: Array.from(this.blockedUsers),
      blockedIps: Array.from(this.blockedIps),
      recentAlerts
    };
  }

  // Private methods

  private addToUserHistory(userId: number, callPattern: ApiCallPattern): void {
    if (!this.userCallHistory.has(userId)) {
      this.userCallHistory.set(userId, []);
    }
    
    const userCalls = this.userCallHistory.get(userId)!;
    userCalls.push(callPattern);
    
    // Keep only recent calls
    const cutoff = new Date(Date.now() - this.config.trackingWindowMs);
    this.userCallHistory.set(userId, userCalls.filter(call => call.timestamp > cutoff));
  }

  private addToIpHistory(ipAddress: string, callPattern: ApiCallPattern): void {
    if (!this.ipCallHistory.has(ipAddress)) {
      this.ipCallHistory.set(ipAddress, []);
    }
    
    const ipCalls = this.ipCallHistory.get(ipAddress)!;
    ipCalls.push(callPattern);
    
    // Keep only recent calls
    const cutoff = new Date(Date.now() - this.config.trackingWindowMs);
    this.ipCallHistory.set(ipAddress, ipCalls.filter(call => call.timestamp > cutoff));
  }

  private getUserRecentCalls(userId: number): ApiCallPattern[] {
    return this.userCallHistory.get(userId) || [];
  }

  private analyzeSuspiciousActivity(
    userId: number,
    endpoint: string,
    method: string,
    ipAddress?: string
  ): SuspiciousActivityResult {
    const userCalls = this.getUserRecentCalls(userId);
    const now = Date.now();
    
    // Check for rapid-fire requests
    const rapidFireWindow = now - this.config.rapidFireWindowMs;
    const rapidFireCalls = userCalls.filter(call => call.timestamp.getTime() > rapidFireWindow);
    
    if (rapidFireCalls.length >= this.config.maxRapidFireCalls) {
      this.flagSuspiciousActivity(userId, 'rapid-fire-requests');
      return {
        isSuspicious: true,
        reason: `Too many rapid requests (${rapidFireCalls.length} in ${this.config.rapidFireWindowMs}ms)`,
        severity: 'medium',
        recommendedAction: 'throttle'
      };
    }

    // Check for identical endpoint spam
    const oneMinuteAgo = now - 60000;
    const recentIdenticalCalls = userCalls.filter(
      call => call.timestamp.getTime() > oneMinuteAgo && call.endpoint === endpoint
    );
    
    if (recentIdenticalCalls.length >= this.config.maxIdenticalCallsPerMinute) {
      this.flagSuspiciousActivity(userId, 'identical-endpoint-spam');
      return {
        isSuspicious: true,
        reason: `Too many identical calls to ${endpoint} (${recentIdenticalCalls.length} in 1 minute)`,
        severity: 'high',
        recommendedAction: 'block'
      };
    }

    // Check for unusual patterns
    const unusualPattern = this.detectUnusualPatterns(userCalls);
    if (unusualPattern) {
      this.flagSuspiciousActivity(userId, unusualPattern);
      return {
        isSuspicious: true,
        reason: `Unusual pattern detected: ${unusualPattern}`,
        severity: 'medium',
        recommendedAction: 'warn'
      };
    }

    // Check overall request volume
    const fiveMinutesAgo = now - 300000;
    const recentCalls = userCalls.filter(call => call.timestamp.getTime() > fiveMinutesAgo);
    
    if (recentCalls.length > this.config.alertThresholds.high) {
      this.flagSuspiciousActivity(userId, 'high-volume-requests');
      return {
        isSuspicious: true,
        reason: `Extremely high request volume (${recentCalls.length} in 5 minutes)`,
        severity: 'high',
        recommendedAction: 'block'
      };
    } else if (recentCalls.length > this.config.alertThresholds.medium) {
      return {
        isSuspicious: true,
        reason: `High request volume (${recentCalls.length} in 5 minutes)`,
        severity: 'medium',
        recommendedAction: 'warn'
      };
    } else if (recentCalls.length > this.config.alertThresholds.low) {
      return {
        isSuspicious: true,
        reason: `Elevated request volume (${recentCalls.length} in 5 minutes)`,
        severity: 'low',
        recommendedAction: 'log'
      };
    }

    return {
      isSuspicious: false,
      reason: 'Normal activity pattern',
      severity: 'low',
      recommendedAction: 'log'
    };
  }

  private detectUnusualPatterns(calls: ApiCallPattern[]): string | null {
    if (calls.length < 10) return null;

    // Check for sequential endpoint scanning
    const recentCalls = calls.slice(-20); // Last 20 calls
    const uniqueEndpoints = new Set(recentCalls.map(call => call.endpoint));
    
    if (uniqueEndpoints.size > 15 && recentCalls.length === 20) {
      return 'endpoint-scanning';
    }

    // Check for time-based patterns (e.g., exactly every X seconds)
    const intervals = [];
    for (let i = 1; i < Math.min(calls.length, 10); i++) {
      const interval = calls[i].timestamp.getTime() - calls[i-1].timestamp.getTime();
      intervals.push(interval);
    }
    
    // Check if intervals are suspiciously regular
    if (intervals.length > 5) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      
      if (variance < 100 && avgInterval < 5000) { // Very regular intervals under 5 seconds
        return 'automated-requests';
      }
    }

    return null;
  }

  private flagSuspiciousActivity(userId: number, pattern: string): void {
    const existing = this.suspiciousPatterns.get(userId) || { 
      count: 0, 
      lastAlert: new Date(0), 
      patterns: [] 
    };
    
    existing.count++;
    existing.lastAlert = new Date();
    
    if (!existing.patterns.includes(pattern)) {
      existing.patterns.push(pattern);
    }
    
    this.suspiciousPatterns.set(userId, existing);

    // Auto-block if threshold exceeded
    if (existing.count >= this.config.suspiciousPatternThreshold) {
      this.blockUser(userId, 600000); // Block for 10 minutes
    }

    console.warn(`Suspicious activity flagged for user ${userId}: ${pattern} (count: ${existing.count})`);
  }

  private calculateRiskScore(userId: number): number {
    const userCalls = this.getUserRecentCalls(userId);
    const suspiciousData = this.suspiciousPatterns.get(userId);
    
    let score = 0;
    
    // Base score from call volume
    score += Math.min(userCalls.length / 10, 30); // Max 30 points for volume
    
    // Add points for suspicious patterns
    if (suspiciousData) {
      score += suspiciousData.count * 15; // 15 points per suspicious pattern
      score += suspiciousData.patterns.length * 10; // 10 points per unique pattern type
    }
    
    // Add points for blocked status
    if (this.blockedUsers.has(userId)) {
      score += 50;
    }
    
    return Math.min(score, 100); // Cap at 100
  }

  private cleanupOldData(): void {
    const cutoff = new Date(Date.now() - this.config.trackingWindowMs);
    
    // Clean user call history
    for (const [userId, calls] of this.userCallHistory.entries()) {
      const recentCalls = calls.filter(call => call.timestamp > cutoff);
      if (recentCalls.length === 0) {
        this.userCallHistory.delete(userId);
      } else {
        this.userCallHistory.set(userId, recentCalls);
      }
    }
    
    // Clean IP call history
    for (const [ip, calls] of this.ipCallHistory.entries()) {
      const recentCalls = calls.filter(call => call.timestamp > cutoff);
      if (recentCalls.length === 0) {
        this.ipCallHistory.delete(ip);
      } else {
        this.ipCallHistory.set(ip, recentCalls);
      }
    }
    
    // Clean suspicious patterns (keep for longer)
    const suspiciousCutoff = new Date(Date.now() - (this.config.trackingWindowMs * 2));
    for (const [userId, data] of this.suspiciousPatterns.entries()) {
      if (data.lastAlert < suspiciousCutoff) {
        this.suspiciousPatterns.delete(userId);
      }
    }
  }

  private estimateMemoryUsage(): number {
    let size = 0;
    
    // User call history
    for (const [userId, calls] of this.userCallHistory.entries()) {
      size += userId.toString().length * 2;
      size += calls.length * 200; // Estimate per call object
    }
    
    // IP call history
    for (const [ip, calls] of this.ipCallHistory.entries()) {
      size += ip.length * 2;
      size += calls.length * 200;
    }
    
    // Suspicious patterns
    for (const [userId, data] of this.suspiciousPatterns.entries()) {
      size += userId.toString().length * 2;
      size += data.patterns.join('').length * 2;
      size += 100; // Overhead
    }
    
    return size;
  }
}

/**
 * Default instance for easy access
 */
export const apiCallTracker = ApiCallTracker.getInstance();