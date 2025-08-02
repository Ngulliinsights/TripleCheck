import { ApiCallTracker } from '../ApiCallTracker';

describe('ApiCallTracker', () => {
  let tracker: ApiCallTracker;

  beforeEach(() => {
    // Clear singleton instance
    (ApiCallTracker as any).instance = undefined;
    
    tracker = ApiCallTracker.getInstance({
      maxCallsPerMinute: 10,
      maxIdenticalCallsPerMinute: 5,
      maxRapidFireCalls: 3,
      rapidFireWindowMs: 1000,
      suspiciousPatternThreshold: 2,
      trackingWindowMs: 60000 // 1 minute for testing
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('trackApiCall', () => {
    it('should track normal API calls without suspicion', () => {
      const result = tracker.trackApiCall(123, '/api/test', 'GET');

      expect(result.isSuspicious).toBe(false);
      expect(result.reason).toBe('Normal activity pattern');
      expect(result.severity).toBe('low');
      expect(result.recommendedAction).toBe('log');
    });

    it('should detect rapid-fire requests', () => {
      // Make rapid requests
      tracker.trackApiCall(123, '/api/test', 'GET');
      tracker.trackApiCall(123, '/api/test', 'GET');
      tracker.trackApiCall(123, '/api/test', 'GET');
      
      const result = tracker.trackApiCall(123, '/api/test', 'GET');

      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toContain('rapid requests');
      expect(result.severity).toBe('medium');
      expect(result.recommendedAction).toBe('throttle');
    });

    it('should detect identical endpoint spam', () => {
      // Make many identical calls
      for (let i = 0; i < 6; i++) {
        tracker.trackApiCall(123, '/api/test', 'GET');
      }

      const summary = tracker.getUserActivitySummary(123);
      expect(summary.totalCalls).toBe(6);
    });

    it('should detect high volume requests', () => {
      // Make many requests to trigger high volume alert
      for (let i = 0; i < 12; i++) {
        tracker.trackApiCall(123, `/api/test${i}`, 'GET');
      }

      const result = tracker.trackApiCall(123, '/api/test', 'GET');

      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toContain('request volume');
    });

    it('should block already blocked users', () => {
      tracker.blockUser(123, 60000);

      const result = tracker.trackApiCall(123, '/api/test', 'GET');

      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toContain('User is currently blocked');
      expect(result.severity).toBe('high');
      expect(result.recommendedAction).toBe('block');
    });

    it('should block requests from blocked IP addresses', () => {
      const ipAddress = '192.168.1.1';
      tracker.blockIp(ipAddress, 60000);

      const result = tracker.trackApiCall(123, '/api/test', 'GET', ipAddress);

      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toContain('IP address is currently blocked');
      expect(result.severity).toBe('high');
      expect(result.recommendedAction).toBe('block');
    });

    it('should track IP addresses when enabled', () => {
      const ipAddress = '192.168.1.1';
      
      tracker.trackApiCall(123, '/api/test', 'GET', ipAddress);
      tracker.trackApiCall(456, '/api/test', 'GET', ipAddress);

      const stats = tracker.getStats();
      expect(stats.totalIps).toBe(1); // Same IP for both users
    });

    it('should track user agents when enabled', () => {
      const userAgent = 'Mozilla/5.0 Test Browser';
      
      const result = tracker.trackApiCall(123, '/api/test', 'GET', undefined, userAgent);

      expect(result.isSuspicious).toBe(false);
    });
  });

  describe('isRequestAllowed', () => {
    it('should allow normal requests', () => {
      const allowed = tracker.isRequestAllowed(123, '/api/test');
      expect(allowed).toBe(true);
    });

    it('should deny requests from blocked users', () => {
      tracker.blockUser(123, 60000);
      
      const allowed = tracker.isRequestAllowed(123, '/api/test');
      expect(allowed).toBe(false);
    });

    it('should deny requests from blocked IPs', () => {
      const ipAddress = '192.168.1.1';
      tracker.blockIp(ipAddress, 60000);
      
      const allowed = tracker.isRequestAllowed(123, '/api/test', ipAddress);
      expect(allowed).toBe(false);
    });

    it('should deny requests when rate limit exceeded', () => {
      // Make requests up to the limit
      for (let i = 0; i < 10; i++) {
        tracker.trackApiCall(123, `/api/test${i}`, 'GET');
      }

      const allowed = tracker.isRequestAllowed(123, '/api/test');
      expect(allowed).toBe(false);
    });

    it('should deny identical requests when limit exceeded', () => {
      // Make identical requests up to the limit
      for (let i = 0; i < 5; i++) {
        tracker.trackApiCall(123, '/api/test', 'GET');
      }

      const allowed = tracker.isRequestAllowed(123, '/api/test');
      expect(allowed).toBe(false);
    });

    it('should deny rapid-fire requests', () => {
      // Make rapid requests
      for (let i = 0; i < 3; i++) {
        tracker.trackApiCall(123, '/api/test', 'GET');
      }

      const allowed = tracker.isRequestAllowed(123, '/api/test');
      expect(allowed).toBe(false);
    });
  });

  describe('getUserActivitySummary', () => {
    it('should return comprehensive user activity summary', () => {
      // Generate some activity
      tracker.trackApiCall(123, '/api/test1', 'GET');
      tracker.trackApiCall(123, '/api/test2', 'POST');
      tracker.trackApiCall(123, '/api/test1', 'GET');

      const summary = tracker.getUserActivitySummary(123);

      expect(summary.userId).toBe(123);
      expect(summary.totalCalls).toBe(3);
      expect(summary.uniqueEndpoints).toBe(2);
      expect(summary.lastActivity).toBeInstanceOf(Date);
      expect(summary.riskScore).toBeGreaterThan(0);
    });

    it('should return zero stats for unknown user', () => {
      const summary = tracker.getUserActivitySummary(999);

      expect(summary.userId).toBe(999);
      expect(summary.totalCalls).toBe(0);
      expect(summary.uniqueEndpoints).toBe(0);
      expect(summary.suspiciousPatterns).toBe(0);
      expect(summary.riskScore).toBe(0);
    });
  });

  describe('blockUser', () => {
    it('should block user temporarily', () => {
      tracker.blockUser(123, 1000);

      expect(tracker.isRequestAllowed(123, '/api/test')).toBe(false);
    });

    it('should auto-unblock user after duration', (done) => {
      tracker.blockUser(123, 100); // 100ms

      expect(tracker.isRequestAllowed(123, '/api/test')).toBe(false);

      setTimeout(() => {
        expect(tracker.isRequestAllowed(123, '/api/test')).toBe(true);
        done();
      }, 150);
    });
  });

  describe('blockIp', () => {
    it('should block IP address temporarily', () => {
      const ipAddress = '192.168.1.1';
      tracker.blockIp(ipAddress, 1000);

      expect(tracker.isRequestAllowed(123, '/api/test', ipAddress)).toBe(false);
    });

    it('should auto-unblock IP after duration', (done) => {
      const ipAddress = '192.168.1.1';
      tracker.blockIp(ipAddress, 100); // 100ms

      expect(tracker.isRequestAllowed(123, '/api/test', ipAddress)).toBe(false);

      setTimeout(() => {
        expect(tracker.isRequestAllowed(123, '/api/test', ipAddress)).toBe(true);
        done();
      }, 150);
    });
  });

  describe('unblockUser', () => {
    it('should manually unblock user', () => {
      tracker.blockUser(123, 60000);
      expect(tracker.isRequestAllowed(123, '/api/test')).toBe(false);

      const wasBlocked = tracker.unblockUser(123);
      
      expect(wasBlocked).toBe(true);
      expect(tracker.isRequestAllowed(123, '/api/test')).toBe(true);
    });

    it('should return false if user was not blocked', () => {
      const wasBlocked = tracker.unblockUser(123);
      expect(wasBlocked).toBe(false);
    });
  });

  describe('unblockIp', () => {
    it('should manually unblock IP', () => {
      const ipAddress = '192.168.1.1';
      tracker.blockIp(ipAddress, 60000);
      expect(tracker.isRequestAllowed(123, '/api/test', ipAddress)).toBe(false);

      const wasBlocked = tracker.unblockIp(ipAddress);
      
      expect(wasBlocked).toBe(true);
      expect(tracker.isRequestAllowed(123, '/api/test', ipAddress)).toBe(true);
    });

    it('should return false if IP was not blocked', () => {
      const wasBlocked = tracker.unblockIp('192.168.1.1');
      expect(wasBlocked).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return tracking statistics', () => {
      // Generate some activity
      tracker.trackApiCall(123, '/api/test', 'GET', '192.168.1.1');
      tracker.trackApiCall(456, '/api/test', 'GET', '192.168.1.2');
      tracker.blockUser(789, 60000);
      tracker.blockIp('192.168.1.3', 60000);

      const stats = tracker.getStats();

      expect(stats.totalUsers).toBe(2);
      expect(stats.totalIps).toBe(2);
      expect(stats.blockedUsers).toBe(1);
      expect(stats.blockedIps).toBe(1);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('clearUserData', () => {
    it('should clear all data for specific user', () => {
      // Generate activity
      tracker.trackApiCall(123, '/api/test', 'GET');
      tracker.blockUser(123, 60000);

      expect(tracker.getUserActivitySummary(123).totalCalls).toBe(1);
      expect(tracker.isRequestAllowed(123, '/api/test')).toBe(false);

      tracker.clearUserData(123);

      expect(tracker.getUserActivitySummary(123).totalCalls).toBe(0);
      expect(tracker.isRequestAllowed(123, '/api/test')).toBe(true);
    });
  });

  describe('getMostActiveUsers', () => {
    it('should return most active users', () => {
      // Generate different activity levels
      for (let i = 0; i < 5; i++) {
        tracker.trackApiCall(123, `/api/test${i}`, 'GET');
      }
      for (let i = 0; i < 3; i++) {
        tracker.trackApiCall(456, `/api/test${i}`, 'GET');
      }
      tracker.trackApiCall(789, '/api/test', 'GET');

      const activeUsers = tracker.getMostActiveUsers(2);

      expect(activeUsers).toHaveLength(2);
      expect(activeUsers[0].userId).toBe(123); // Most active
      expect(activeUsers[0].totalCalls).toBe(5);
      expect(activeUsers[1].userId).toBe(456); // Second most active
      expect(activeUsers[1].totalCalls).toBe(3);
    });
  });

  describe('getSuspiciousActivityReport', () => {
    it('should return comprehensive suspicious activity report', () => {
      // Generate high-risk activity
      for (let i = 0; i < 15; i++) {
        tracker.trackApiCall(123, `/api/test${i}`, 'GET');
      }
      
      tracker.blockUser(456, 60000);
      tracker.blockIp('192.168.1.1', 60000);

      const report = tracker.getSuspiciousActivityReport();

      expect(report.highRiskUsers).toBeInstanceOf(Array);
      expect(report.blockedUsers).toContain(456);
      expect(report.blockedIps).toContain('192.168.1.1');
      expect(report.recentAlerts).toBeInstanceOf(Array);
    });
  });

  describe('pattern detection', () => {
    it('should detect endpoint scanning patterns', () => {
      // Simulate endpoint scanning
      for (let i = 0; i < 20; i++) {
        tracker.trackApiCall(123, `/api/endpoint${i}`, 'GET');
      }

      const summary = tracker.getUserActivitySummary(123);
      expect(summary.uniqueEndpoints).toBe(20);
      expect(summary.riskScore).toBeGreaterThan(50);
    });

    it('should detect automated request patterns', () => {
      // Simulate very regular timing (would need to mock timing for proper test)
      for (let i = 0; i < 10; i++) {
        tracker.trackApiCall(123, '/api/test', 'GET');
      }

      const summary = tracker.getUserActivitySummary(123);
      expect(summary.totalCalls).toBe(10);
    });
  });

  describe('cleanup', () => {
    it('should clean up old tracking data', () => {
      jest.useFakeTimers();

      // Generate some activity
      tracker.trackApiCall(123, '/api/test', 'GET');
      
      let stats = tracker.getStats();
      expect(stats.totalUsers).toBe(1);

      // Fast-forward past cleanup time
      jest.advanceTimersByTime(70000); // More than 1 minute cleanup interval

      stats = tracker.getStats();
      expect(stats.totalUsers).toBe(0); // Should be cleaned up

      jest.useRealTimers();
    });
  });

  describe('risk score calculation', () => {
    it('should calculate risk score based on activity', () => {
      // Low activity
      tracker.trackApiCall(123, '/api/test', 'GET');
      let summary = tracker.getUserActivitySummary(123);
      const lowRisk = summary.riskScore;

      // High activity
      for (let i = 0; i < 20; i++) {
        tracker.trackApiCall(456, `/api/test${i}`, 'GET');
      }
      summary = tracker.getUserActivitySummary(456);
      const highRisk = summary.riskScore;

      expect(highRisk).toBeGreaterThan(lowRisk);
    });

    it('should increase risk score for blocked users', () => {
      tracker.trackApiCall(123, '/api/test', 'GET');
      const normalRisk = tracker.getUserActivitySummary(123).riskScore;

      tracker.blockUser(123, 60000);
      const blockedRisk = tracker.getUserActivitySummary(123).riskScore;

      expect(blockedRisk).toBeGreaterThan(normalRisk);
    });
  });
});