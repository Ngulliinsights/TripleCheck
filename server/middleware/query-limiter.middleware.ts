import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface QueryTracker {
  endpoint: string;
  count: number;
  lastCall: number;
  firstCall: number;
  clientId: string;
}

class QueryLimiterMiddleware {
  private queryTrackers = new Map<string, QueryTracker>();
  private readonly RAPID_FIRE_THRESHOLD = 8; // More than 8 calls
  private readonly TIME_WINDOW = 3000; // Within 3 seconds
  private readonly CIRCUIT_BREAKER_DURATION = 15000; // 15 seconds
  private circuitBreakers = new Set<string>();

  constructor() {
    // Clean up old trackers periodically
    setInterval(() => {
      this.cleanup();
    }, 30000);
  }

  private generateQueryKey(req: Request): string {
    const clientId = this.getClientId(req);
    const endpoint = req.path;
    const method = req.method;
    const queryParams = JSON.stringify(req.query);
    return `${clientId}:${method}:${endpoint}:${queryParams}`;
  }

  private getClientId(req: Request): string {
    // Use IP address and user agent as client identifier
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}:${userAgent.substring(0, 50)}`;
  }

  private isRapidFire(tracker: QueryTracker): boolean {
    const timeSpan = tracker.lastCall - tracker.firstCall;
    return tracker.count >= this.RAPID_FIRE_THRESHOLD && timeSpan <= this.TIME_WINDOW;
  }

  private activateCircuitBreaker(queryKey: string): void {
    this.circuitBreakers.add(queryKey);
    console.warn(`🚨 [QueryLimiter] Circuit breaker activated for: ${queryKey.split(':')[2]}`);
    
    // Auto-reset circuit breaker after duration
    setTimeout(() => {
      this.circuitBreakers.delete(queryKey);
      console.log(`✅ [QueryLimiter] Circuit breaker reset for: ${queryKey.split(':')[2]}`);
    }, this.CIRCUIT_BREAKER_DURATION);
  }

  private cleanup(): void {
    const now = performance.now();
    const cutoff = now - (this.TIME_WINDOW * 3); // Keep trackers for 3x the time window

    for (const [key, tracker] of this.queryTrackers.entries()) {
      if (tracker.lastCall < cutoff) {
        this.queryTrackers.delete(key);
      }
    }
  }

  public middleware = (req: Request, res: Response, next: NextFunction): void => {
    // Skip for non-API routes
    if (!req.path.startsWith('/api/')) {
      return next();
    }

    // Skip for certain safe endpoints
    const safeEndpoints = ['/api/health', '/api/auth/logout'];
    if (safeEndpoints.includes(req.path)) {
      return next();
    }

    const queryKey = this.generateQueryKey(req);
    const now = performance.now();

    // Check if circuit breaker is active
    if (this.circuitBreakers.has(queryKey)) {
      console.warn(`⛔ [QueryLimiter] Request blocked by circuit breaker: ${req.method} ${req.path}`);
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait before trying again.',
        retryAfter: Math.ceil(this.CIRCUIT_BREAKER_DURATION / 1000)
      });
    }

    // Get or create tracker
    let tracker = this.queryTrackers.get(queryKey);
    if (!tracker) {
      tracker = {
        endpoint: req.path,
        count: 0,
        lastCall: now,
        firstCall: now,
        clientId: this.getClientId(req)
      };
      this.queryTrackers.set(queryKey, tracker);
    }

    // Update tracker
    tracker.count++;
    tracker.lastCall = now;

    // Check for rapid fire
    if (this.isRapidFire(tracker)) {
      console.error(`🔥 [QueryLimiter] Infinite query detected: ${req.method} ${req.path}`);
      console.error(`   Client: ${tracker.clientId}`);
      console.error(`   Calls: ${tracker.count} in ${(tracker.lastCall - tracker.firstCall).toFixed(2)}ms`);
      console.error(`   Query: ${JSON.stringify(req.query)}`);
      
      this.activateCircuitBreaker(queryKey);
      
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Too many rapid requests detected.',
        retryAfter: Math.ceil(this.CIRCUIT_BREAKER_DURATION / 1000)
      });
    }

    // Add query info to request for debugging
    (req as any).queryInfo = {
      queryKey,
      callCount: tracker.count,
      timeSpan: tracker.lastCall - tracker.firstCall
    };

    next();
  };

  public getStats() {
    return {
      activeTrackers: this.queryTrackers.size,
      activeCircuitBreakers: this.circuitBreakers.size,
      topQueries: Array.from(this.queryTrackers.entries())
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([key, tracker]) => ({
          endpoint: tracker.endpoint,
          count: tracker.count,
          clientId: tracker.clientId.split(':')[0] // Just show IP
        }))
    };
  }

  public resetCircuitBreaker(queryKey: string): boolean {
    if (this.circuitBreakers.has(queryKey)) {
      this.circuitBreakers.delete(queryKey);
      console.log(`🔄 [QueryLimiter] Manually reset circuit breaker for: ${queryKey}`);
      return true;
    }
    return false;
  }

  public resetAllCircuitBreakers(): void {
    const count = this.circuitBreakers.size;
    this.circuitBreakers.clear();
    console.log(`🔄 [QueryLimiter] Reset ${count} circuit breakers`);
  }
}

// Create singleton instance
const queryLimiter = new QueryLimiterMiddleware();

export { queryLimiter };
export default queryLimiter.middleware;