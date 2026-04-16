/**
 * PropertyCacheService
 *
 * Domain-specific cache layer for property data.
 * Wraps CacheService with typed accessors, stable key generation,
 * and correct invalidation for all property-related cache segments.
 *
 * Key design decisions
 * --------------------
 * - All keys are scoped under the "props" namespace so this service never
 *   collides with other services sharing the same Redis instance.
 * - get* methods follow the cache-aside pattern (getOrSet) — callers pass a
 *   factory function and get back the value whether it came from cache or the
 *   database. No separate getCached/setCache pairs to keep in sync.
 * - Key generation always sorts object properties before hashing so the same
 *   logical filter set always maps to the same cache key, regardless of
 *   insertion order.
 * - invalidateProperty now correctly deletes all affected segments using
 *   the deletePattern API exposed by the base service.
 */

import { CacheService } from "./CacheService";

// ---------------------------------------------------------------------------
// Domain types
// Replace these with your actual entity types once they are defined.
// ---------------------------------------------------------------------------

export interface Property {
  id: string;
  [key: string]: unknown;
}

export interface PropertyStats {
  [key: string]: unknown;
}

export interface SimilarPropertiesParams {
  propertyType?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  limit?: string;
}

export interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  backend?: "redis" | "memory";
  details?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Cache key prefixes — unprefixed within the "props:" namespace. */
const SEGMENT = {
  SIMILAR: "similar:",
  DETAILS: "details:",
  STATS:   "stats:",
  OWNER:   "owner:",
} as const;

/** TTLs in seconds. */
const TTL = {
  SIMILAR: 5  * 60,  //  5 min — frequently changing search results
  DETAILS: 10 * 60,  // 10 min — individual property records
  STATS:   15 * 60,  // 15 min — aggregate statistics
  OWNER:   5  * 60,  //  5 min — owner property lists
} as const;

const HEALTH_KEY = "_health";

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class PropertyCacheService {
  /**
   * All keys are namespaced under "props:" so this service never collides
   * with other services sharing the same Redis database.
   */
  private readonly cache = new CacheService({ prefix: "props" });

  // -------------------------------------------------------------------------
  // Similar properties
  // -------------------------------------------------------------------------

  /**
   * Returns similar properties from cache if available, otherwise calls
   * `fetcher`, caches the result, and returns it.
   */
  getSimilarProperties(
    params: SimilarPropertiesParams,
    fetcher: () => Promise<Property[]>
  ): Promise<Property[]> {
    return this.cache.getOrSet(
      this.similarKey(params),
      fetcher,
      { ttl: TTL.SIMILAR }
    );
  }

  // -------------------------------------------------------------------------
  // Property details
  // -------------------------------------------------------------------------

  /**
   * Returns a single property from cache if available, otherwise calls
   * `fetcher`, caches the result, and returns it.
   */
  getPropertyDetails(
    propertyId: string,
    fetcher: () => Promise<Property>
  ): Promise<Property> {
    return this.cache.getOrSet(
      `${SEGMENT.DETAILS}${propertyId}`,
      fetcher,
      { ttl: TTL.DETAILS }
    );
  }

  // -------------------------------------------------------------------------
  // Owner properties
  // -------------------------------------------------------------------------

  /**
   * Returns an owner's property list from cache if available, otherwise
   * calls `fetcher`, caches the result, and returns it.
   */
  getOwnerProperties(
    ownerId: string,
    fetcher: () => Promise<Property[]>
  ): Promise<Property[]> {
    return this.cache.getOrSet(
      `${SEGMENT.OWNER}${ownerId}`,
      fetcher,
      { ttl: TTL.OWNER }
    );
  }

  // -------------------------------------------------------------------------
  // Property statistics
  // -------------------------------------------------------------------------

  /**
   * Returns property statistics from cache if available, otherwise calls
   * `fetcher`, caches the result, and returns it.
   */
  getPropertyStats(
    filters: Record<string, unknown>,
    fetcher: () => Promise<PropertyStats>
  ): Promise<PropertyStats> {
    return this.cache.getOrSet(
      this.statsKey(filters),
      fetcher,
      { ttl: TTL.STATS }
    );
  }

  // -------------------------------------------------------------------------
  // Invalidation
  // -------------------------------------------------------------------------

  /**
   * Invalidates all cache segments touched by a change to a single property:
   *   - its own details entry
   *   - all similar-property result sets (any could include this property)
   *   - all statistics (aggregates are now stale)
   */
  async invalidateProperty(propertyId: string): Promise<void> {
    await Promise.all([
      this.cache.delete(`${SEGMENT.DETAILS}${propertyId}`),
      this.cache.deletePattern(`${SEGMENT.SIMILAR}*`),
      this.cache.deletePattern(`${SEGMENT.STATS}*`),
    ]);
  }

  /**
   * Invalidates the cached property list for a specific owner.
   * Call this whenever a property is created, transferred, or removed.
   */
  invalidateOwner(ownerId: string): Promise<boolean> {
    return this.cache.delete(`${SEGMENT.OWNER}${ownerId}`);
  }

  /**
   * Invalidates multiple properties in a single batch.
   * Detail keys are deleted in parallel; similar/stats patterns are
   * deduplicated — each is deleted at most once regardless of batch size.
   */
  async invalidateProperties(propertyIds: string[]): Promise<void> {
    if (propertyIds.length === 0) return;

    await Promise.all([
      ...propertyIds.map((id) => this.cache.delete(`${SEGMENT.DETAILS}${id}`)),
      // Pattern-wide — only needs to run once even for many IDs
      this.cache.deletePattern(`${SEGMENT.SIMILAR}*`),
      this.cache.deletePattern(`${SEGMENT.STATS}*`),
    ]);
  }

  /**
   * Clears the entire property cache namespace. Use with care — this removes
   * all segments for all properties.
   */
  clearAll(): Promise<void> {
    return this.cache.clear();
  }

  // -------------------------------------------------------------------------
  // Health check
  // -------------------------------------------------------------------------

  async healthCheck(): Promise<HealthCheckResult> {
    const probe = { ts: Date.now() };

    try {
      await this.cache.set(HEALTH_KEY, probe, { ttl: 10 });
      const retrieved = await this.cache.get<typeof probe>(HEALTH_KEY);
      await this.cache.delete(HEALTH_KEY);

      if (retrieved?.ts !== probe.ts) {
        return { status: "unhealthy", details: "Round-trip value mismatch" };
      }

      const stats = await this.cache.getStats();
      return { status: "healthy", backend: stats.backend };
    } catch (err) {
      return {
        status: "unhealthy",
        details: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // -------------------------------------------------------------------------
  // Key generation
  // -------------------------------------------------------------------------

  /**
   * Produces a stable key for a similar-properties query.
   * Parts are joined with ":" so no two distinct parameter sets can collide.
   */
  private similarKey(params: SimilarPropertiesParams): string {
    const {
      propertyType = "",
      city         = "",
      minPrice     = "",
      maxPrice     = "",
      limit        = "10",
    } = params;

    return [
      SEGMENT.SIMILAR,
      propertyType,
      city.toLowerCase().replace(/\s+/g, "_"),
      minPrice,
      maxPrice,
      limit,
    ].join(":");
  }

  /**
   * Produces a stable hash key for an arbitrary filter object.
   *
   * Keys are sorted before serialisation so {a:1, b:2} and {b:2, a:1}
   * always produce the same hash — avoiding guaranteed cache misses
   * for objects built up in different insertion orders.
   */
  private statsKey(filters: Record<string, unknown>): string {
    const stable = JSON.stringify(filters, Object.keys(filters).sort());
    return `${SEGMENT.STATS}${this.hash(stable)}`;
  }

  /**
   * Fast, deterministic 32-bit hash encoded in base-36.
   * Not cryptographic — only used for cache-key deduplication.
   */
  private hash(str: string): string {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i);
      h |= 0; // keep 32-bit
    }
    return (h >>> 0).toString(36); // unsigned, base-36
  }
}