/**
 * CacheService
 *
 * Production-ready cache with Redis primary and in-memory fallback.
 * Uses ioredis for connectivity with automatic reconnection and a
 * circuit-breaker so a flaky Redis does not permanently disable itself.
 *
 * Features
 * --------
 * - Transparent Redis ↔ memory fallback with circuit-breaker recovery
 * - Namespace/prefix isolation to prevent key collisions across domains
 * - Batch mget / mset for efficient multi-key operations
 * - SCAN-based pattern deletion (never KEYS — safe in production)
 * - increment / expire / ttl introspection
 * - getOrSet (cache-aside) helper
 * - Periodic cleanup of expired in-memory entries
 * - Accurate getStats() for both backends
 */

import Redis from "ioredis";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CacheOptions {
  /** Time-to-live in seconds. Defaults to 300 (5 min). */
  ttl?: number;
}

interface MemoryEntry<T> {
  value: T;
  expiresAt: number; // epoch ms
}

export interface CacheStats {
  backend: "redis" | "memory";
  totalKeys: number;
  expiredKeys: number;
  /** Approximate serialised byte size of the in-memory cache. */
  memoryBytes: number;
}

// ---------------------------------------------------------------------------
// Circuit-breaker config — controls how aggressively we fall back and recover
// ---------------------------------------------------------------------------
const CIRCUIT = {
  /** Consecutive failures before Redis is marked unavailable. */
  FAILURE_THRESHOLD: 3,
  /** How often (ms) to probe whether Redis has recovered. */
  PROBE_INTERVAL_MS: 30_000,
} as const;

// ---------------------------------------------------------------------------
// CacheService
// ---------------------------------------------------------------------------

export class CacheService {
  private readonly prefix: string;
  private redis: Redis | null = null;
  private memoryCache = new Map<string, MemoryEntry<unknown>>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private probeTimer: ReturnType<typeof setInterval> | null = null;

  // Circuit-breaker state
  private redisAvailable = false;
  private consecutiveFailures = 0;

  constructor(options: { prefix?: string } = {}) {
    this.prefix = options.prefix ? `${options.prefix}:` : "";
    this.initRedis();
    this.startMemoryCleanup();
  }

  // -------------------------------------------------------------------------
  // Initialisation
  // -------------------------------------------------------------------------

  private initRedis(): void {
    const url = process.env.REDIS_URL;
    if (!url) {
      console.log("[Cache] No REDIS_URL — using in-memory cache only");
      return;
    }

    try {
      this.redis = new Redis(url, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy: (attempts: number) => Math.min(attempts * 50, 2_000),
        reconnectOnError: (err: Error) => err.message.includes("READONLY"),
      });

      this.redis.on("ready", () => {
        console.log("[Cache] Redis ready");
        this.redisAvailable = true;
        this.consecutiveFailures = 0;
        this.clearProbeTimer();
      });

      this.redis.on("error", (err: Error) => {
        console.warn("[Cache] Redis error:", err.message);
        this.recordFailure();
      });

      this.redis.on("close", () => {
        console.log("[Cache] Redis connection closed — falling back to memory");
        this.markUnavailable();
      });

      this.redis.on("reconnecting", () => {
        console.log("[Cache] Redis reconnecting…");
      });
    } catch (err) {
      console.warn("[Cache] Failed to initialise Redis:", err);
      this.redis = null;
    }
  }

  // -------------------------------------------------------------------------
  // Circuit-breaker helpers
  // -------------------------------------------------------------------------

  private recordFailure(): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= CIRCUIT.FAILURE_THRESHOLD) {
      this.markUnavailable();
    }
  }

  private markUnavailable(): void {
    if (this.redisAvailable) {
      console.warn("[Cache] Redis circuit open — switching to memory cache");
    }
    this.redisAvailable = false;
    this.startProbe();
  }

  private startProbe(): void {
    if (this.probeTimer) return;
    this.probeTimer = setInterval(async () => {
      if (!this.redis) {
        this.clearProbeTimer();
        return;
      }
      try {
        await this.redis.ping();
        console.log("[Cache] Redis probe succeeded — circuit closed");
        this.redisAvailable = true;
        this.consecutiveFailures = 0;
        this.clearProbeTimer();
      } catch {
        // still unreachable
      }
    }, CIRCUIT.PROBE_INTERVAL_MS);

    this.probeTimer?.unref?.();
  }

  private clearProbeTimer(): void {
    if (this.probeTimer) {
      clearInterval(this.probeTimer);
      this.probeTimer = null;
    }
  }

  private get useRedis(): boolean {
    return this.redisAvailable && this.redis !== null;
  }

  // -------------------------------------------------------------------------
  // Key helpers
  // -------------------------------------------------------------------------

  private k(key: string): string {
    return `${this.prefix}${key}`;
  }

  // -------------------------------------------------------------------------
  // Core: set
  // -------------------------------------------------------------------------

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl ?? 300;
    const prefixed = this.k(key);

    if (this.useRedis) {
      try {
        await this.redis!.setex(prefixed, ttl, JSON.stringify(value));
        this.consecutiveFailures = 0;
        return;
      } catch (err) {
        console.warn("[Cache] Redis set failed — falling back to memory:", (err as Error).message);
        this.recordFailure();
      }
    }

    this.memoryCache.set(prefixed, {
      value,
      expiresAt: Date.now() + ttl * 1_000,
    });
  }

  // -------------------------------------------------------------------------
  // Core: get
  // -------------------------------------------------------------------------

  async get<T>(key: string): Promise<T | null> {
    const prefixed = this.k(key);

    if (this.useRedis) {
      try {
        const raw: string | null = await this.redis!.get(prefixed);
        this.consecutiveFailures = 0;
        return raw ? (JSON.parse(raw) as T) : null;
      } catch (err) {
        console.warn("[Cache] Redis get failed — falling back to memory:", (err as Error).message);
        this.recordFailure();
      }
    }

    return this.memGet<T>(prefixed);
  }

  // -------------------------------------------------------------------------
  // Batch: mset
  // -------------------------------------------------------------------------

  async mset<T>(
    entries: Array<{ key: string; value: T }>,
    options: CacheOptions = {}
  ): Promise<void> {
    const ttl = options.ttl ?? 300;

    if (this.useRedis) {
      try {
        const pipeline = this.redis!.pipeline();
        for (const { key, value } of entries) {
          pipeline.setex(this.k(key), ttl, JSON.stringify(value));
        }
        await pipeline.exec();
        this.consecutiveFailures = 0;
        return;
      } catch (err) {
        console.warn("[Cache] Redis mset failed — falling back to memory:", (err as Error).message);
        this.recordFailure();
      }
    }

    const expiresAt = Date.now() + ttl * 1_000;
    for (const { key, value } of entries) {
      this.memoryCache.set(this.k(key), { value, expiresAt });
    }
  }

  // -------------------------------------------------------------------------
  // Batch: mget
  // -------------------------------------------------------------------------

  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    if (keys.length === 0) return [];

    const prefixed = keys.map((k) => this.k(k));

    if (this.useRedis) {
      try {
        const raws = await this.redis!.mget(...prefixed);
        this.consecutiveFailures = 0;
        return raws.map((raw) => (raw ? (JSON.parse(raw) as T) : null));
      } catch (err) {
        console.warn("[Cache] Redis mget failed — falling back to memory:", (err as Error).message);
        this.recordFailure();
      }
    }

    return prefixed.map((pk) => this.memGet<T>(pk));
  }

  // -------------------------------------------------------------------------
  // Core: delete
  // -------------------------------------------------------------------------

  async delete(key: string): Promise<boolean> {
    const prefixed = this.k(key);

    if (this.useRedis) {
      try {
        const n = await this.redis!.del(prefixed);
        this.consecutiveFailures = 0;
        return n > 0;
      } catch (err) {
        console.warn("[Cache] Redis delete failed — falling back to memory:", (err as Error).message);
        this.recordFailure();
      }
    }

    return this.memoryCache.delete(prefixed);
  }

  // -------------------------------------------------------------------------
  // Pattern deletion — uses SCAN, never KEYS
  // -------------------------------------------------------------------------

  async deletePattern(pattern: string): Promise<number> {
    const prefixedPattern = this.k(pattern);

    if (this.useRedis) {
      try {
        let deleted = 0;
        let cursor = "0";

        do {
          const [nextCursor, keys] = await this.redis!.scan(
            cursor,
            "MATCH",
            prefixedPattern,
            "COUNT",
            100
          );
          cursor = nextCursor;

          if (keys.length > 0) {
            deleted += await this.redis!.del(...keys);
          }
        } while (cursor !== "0");

        this.consecutiveFailures = 0;
        return deleted;
      } catch (err) {
        console.warn("[Cache] Redis deletePattern failed — falling back to memory:", (err as Error).message);
        this.recordFailure();
      }
    }

    // In-memory pattern match (glob * only)
    const regex = new RegExp(`^${prefixedPattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
    let count = 0;
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        count++;
      }
    }
    return count;
  }

  // -------------------------------------------------------------------------
  // has
  // -------------------------------------------------------------------------

  async has(key: string): Promise<boolean> {
    const prefixed = this.k(key);

    if (this.useRedis) {
      try {
        const n = await this.redis!.exists(prefixed);
        this.consecutiveFailures = 0;
        return n === 1;
      } catch (err) {
        console.warn("[Cache] Redis has failed — falling back to memory:", (err as Error).message);
        this.recordFailure();
      }
    }

    const entry = this.memoryCache.get(prefixed);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(prefixed);
      return false;
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // increment — atomic counter (Redis native; emulated in memory)
  // -------------------------------------------------------------------------

  async increment(key: string, by = 1, options: CacheOptions = {}): Promise<number> {
    const prefixed = this.k(key);
    const ttl = options.ttl ?? 300;

    if (this.useRedis) {
      try {
        const pipeline = this.redis!.pipeline();
        pipeline.incrby(prefixed, by);
        pipeline.expire(prefixed, ttl);
        const [[, next]] = (await pipeline.exec()) as [[null, number], [null, number]];
        this.consecutiveFailures = 0;
        return next;
      } catch (err) {
        console.warn("[Cache] Redis increment failed — falling back to memory:", (err as Error).message);
        this.recordFailure();
      }
    }

    const entry = this.memoryCache.get(prefixed);
    const current = entry && Date.now() <= entry.expiresAt ? (entry.value as number) : 0;
    const next = current + by;
    this.memoryCache.set(prefixed, { value: next, expiresAt: Date.now() + ttl * 1_000 });
    return next;
  }

  // -------------------------------------------------------------------------
  // ttl — remaining seconds (-1 = no expiry, -2 = not found)
  // -------------------------------------------------------------------------

  async ttl(key: string): Promise<number> {
    const prefixed = this.k(key);

    if (this.useRedis) {
      try {
        const result = await this.redis!.ttl(prefixed);
        this.consecutiveFailures = 0;
        return result;
      } catch (err) {
        console.warn("[Cache] Redis ttl failed — falling back to memory:", (err as Error).message);
        this.recordFailure();
      }
    }

    const entry = this.memoryCache.get(prefixed);
    if (!entry) return -2;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1_000);
    if (remaining <= 0) {
      this.memoryCache.delete(prefixed);
      return -2;
    }
    return remaining;
  }

  // -------------------------------------------------------------------------
  // expire — reset TTL on an existing key
  // -------------------------------------------------------------------------

  async expire(key: string, ttl: number): Promise<boolean> {
    const prefixed = this.k(key);

    if (this.useRedis) {
      try {
        const n = await this.redis!.expire(prefixed, ttl);
        this.consecutiveFailures = 0;
        return n === 1;
      } catch (err) {
        console.warn("[Cache] Redis expire failed — falling back to memory:", (err as Error).message);
        this.recordFailure();
      }
    }

    const entry = this.memoryCache.get(prefixed);
    if (!entry || Date.now() > entry.expiresAt) return false;
    entry.expiresAt = Date.now() + ttl * 1_000;
    return true;
  }

  // -------------------------------------------------------------------------
  // clear — scoped to this instance's prefix only
  // -------------------------------------------------------------------------

  async clear(): Promise<void> {
    if (this.useRedis) {
      try {
        if (this.prefix) {
          // Scope the clear to our prefix via SCAN
          await this.deletePattern("*");
        } else {
          await this.redis!.flushdb();
        }
        this.consecutiveFailures = 0;
      } catch (err) {
        console.warn("[Cache] Redis clear failed:", (err as Error).message);
        this.recordFailure();
      }
    }

    // Always clear the in-memory layer
    if (this.prefix) {
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(this.prefix)) this.memoryCache.delete(key);
      }
    } else {
      this.memoryCache.clear();
    }
  }

  // -------------------------------------------------------------------------
  // getOrSet — cache-aside pattern
  // -------------------------------------------------------------------------

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  // -------------------------------------------------------------------------
  // wrap — memoize decorator for a function
  // -------------------------------------------------------------------------

  wrap<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    keyFn: (...args: TArgs) => string,
    options: CacheOptions = {}
  ): (...args: TArgs) => Promise<TReturn> {
    return (...args: TArgs) =>
      this.getOrSet(keyFn(...args), () => fn(...args), options);
  }

  // -------------------------------------------------------------------------
  // getStats
  // -------------------------------------------------------------------------

  async getStats(): Promise<CacheStats> {
    if (this.useRedis) {
      try {
        const info = await this.redis!.info("keyspace");
        // Parse "db0:keys=42,expires=10,avg_ttl=…"
        const match = info.match(/keys=(\d+)/);
        const expiresMatch = info.match(/expires=(\d+)/);
        return {
          backend: "redis",
          totalKeys: match ? Number(match[1]) : 0,
          expiredKeys: expiresMatch ? Number(expiresMatch[1]) : 0,
          memoryBytes: 0,
        };
      } catch {
        // fall through to memory stats
      }
    }

    const now = Date.now();
    let expiredKeys = 0;
    for (const entry of this.memoryCache.values()) {
      if (now > entry.expiresAt) expiredKeys++;
    }

    return {
      backend: "memory",
      totalKeys: this.memoryCache.size,
      expiredKeys,
      memoryBytes: JSON.stringify([...this.memoryCache.entries()]).length,
    };
  }

  // -------------------------------------------------------------------------
  // Status
  // -------------------------------------------------------------------------

  isRedisConnected(): boolean {
    return this.useRedis;
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clearProbeTimer();

    if (this.redis) {
      this.redis.disconnect();
      this.redis = null;
    }

    this.memoryCache.clear();
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private memGet<T>(prefixed: string): T | null {
    const entry = this.memoryCache.get(prefixed);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(prefixed);
      return null;
    }
    return entry.value as T;
  }

  private startMemoryCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const stale: string[] = [];
      for (const [key, entry] of this.memoryCache) {
        if (now > entry.expiresAt) stale.push(key);
      }
      for (const key of stale) this.memoryCache.delete(key);
      if (stale.length) {
        console.log(`[Cache] Evicted ${stale.length} expired in-memory entries`);
      }
    }, 60_000);

    this.cleanupTimer?.unref?.();
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const cacheService = new CacheService();
export default CacheService;