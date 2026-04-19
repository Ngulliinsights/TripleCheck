/**
 * GlobalPerformanceMonitor
 *
 * A singleton utility for tracking API call frequency and render counts
 * across multiple React components. Detects duplicates, throttle violations,
 * and excessive re-render rates in development builds.
 *
 * Usage (vanilla):
 *   const monitor = GlobalPerformanceMonitor.getInstance();
 *   monitor.trackApiCall("MyComponent", payload);
 *   monitor.trackRender("MyComponent");
 *
 * Usage (React hook):
 *   const { trackApiCall, trackRender, getStats } = useGlobalPerformanceMonitor("MyComponent");
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiCallRecord {
  timestamp: number;
  /** Serialised snapshot of the call payload, used for dedup detection. */
  dataHash: string;
}

interface ComponentStats {
  apiCallCount: number;
  apiCallHistory: ApiCallRecord[];
  renderCount: number;
  lastRenderTimestamp: number;
  lastApiCallTimestamp: number;
}

export interface ComponentSnapshot {
  totalApiCalls: number;
  totalRenders: number;
  /** API calls in the last 10 seconds. */
  recentApiCalls: number;
  /** Mean milliseconds between consecutive recorded calls. 0 if fewer than 2 calls. */
  averageTimeBetweenCalls: number;
  lastRenderTimestamp: number;
  lastApiCallTimestamp: number;
}

export interface PerformanceIssue {
  component: string;
  kind: "rapid-calls" | "high-frequency";
  detail: string;
}

// ─── Thresholds (override via configure()) ────────────────────────────────────

interface MonitorConfig {
  /** Minimum ms between two tracked calls before throttle warning fires. Default 50. */
  throttleMs: number;
  /** Window in ms within which identical payloads are treated as duplicates. Default 200. */
  dedupeWindowMs: number;
  /** Maximum call records retained per component. Default 50. */
  maxHistory: number;
  /** Calls-per-10s threshold that triggers a "high-frequency" issue. Default 10. */
  highFrequencyThreshold: number;
  /** Average ms between calls threshold that triggers a "rapid-calls" issue. Default 300. */
  rapidCallThresholdMs: number;
  /** Minimum total calls before rapid-call issues are reported. Default 5. */
  rapidCallMinSamples: number;
  /** Consecutive render gap in ms that triggers an excessive-render warning. Default 5. */
  excessiveRenderGapMs: number;
}

const DEFAULT_CONFIG: MonitorConfig = {
  throttleMs: 50,
  dedupeWindowMs: 200,
  maxHistory: 50,
  highFrequencyThreshold: 10,
  rapidCallThresholdMs: 300,
  rapidCallMinSamples: 5,
  excessiveRenderGapMs: 5,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Lightweight serialisation that never throws, even for circular refs. */
function safeSerialise(data: unknown): string {
  try {
    return JSON.stringify(data) ?? "";
  } catch {
    return String(data);
  }
}

function isDev(): boolean {
  return (
    typeof process !== "undefined" && process.env?.NODE_ENV === "development"
  );
}

// ─── Core class ───────────────────────────────────────────────────────────────

export class GlobalPerformanceMonitor {
  private static instance: GlobalPerformanceMonitor;

  private readonly stats = new Map<string, ComponentStats>();
  private config: MonitorConfig = { ...DEFAULT_CONFIG };

  // Singleton ──────────────────────────────────────────────────────────────────

  static getInstance(): GlobalPerformanceMonitor {
    if (!GlobalPerformanceMonitor.instance) {
      GlobalPerformanceMonitor.instance = new GlobalPerformanceMonitor();
    }
    return GlobalPerformanceMonitor.instance;
  }

  /** Override individual thresholds without replacing the whole config. */
  configure(overrides: Partial<MonitorConfig>): void {
    this.config = { ...this.config, ...overrides };
  }

  // Internal ───────────────────────────────────────────────────────────────────

  private getOrCreate(component: string): ComponentStats {
    if (!this.stats.has(component)) {
      this.stats.set(component, {
        apiCallCount: 0,
        apiCallHistory: [],
        renderCount: 0,
        lastRenderTimestamp: 0,
        lastApiCallTimestamp: 0,
      });
    }
    return this.stats.get(component)!;
  }

  // Public API ─────────────────────────────────────────────────────────────────

  /**
   * Record an API call for `component`.
   *
   * Calls are silently dropped when:
   * - They arrive within `throttleMs` of the previous call (guards against hot
   *   render-loop spam before React batching can fire).
   * - They are byte-for-byte identical to the previous call within
   *   `dedupeWindowMs` (guards against accidental double-invocation).
   */
  trackApiCall(component: string, data: unknown): void {
    const now = Date.now();
    const s = this.getOrCreate(component);

    // 1. Throttle: drop calls that arrive too quickly (pre-dedup fast path).
    const sinceLast = now - s.lastApiCallTimestamp;
    if (s.lastApiCallTimestamp > 0 && sinceLast < this.config.throttleMs) {
      if (isDev()) {
        console.warn(
          `[${component}] API call throttled — only ${sinceLast}ms since last call`
        );
      }
      return;
    }

    // 2. Dedup: drop calls whose serialised payload matches the previous call
    //    within the dedup window. Serialisation is deferred to here (after the
    //    cheap timestamp check) to avoid paying stringify cost on throttled calls.
    const hash = safeSerialise(data);
    const prev = s.apiCallHistory[s.apiCallHistory.length - 1];
    if (
      prev &&
      prev.dataHash === hash &&
      now - prev.timestamp < this.config.dedupeWindowMs
    ) {
      if (isDev()) {
        console.warn(
          `[${component}] Duplicate API call suppressed (within ${this.config.dedupeWindowMs}ms)`
        );
      }
      return;
    }

    // 3. Record the call.
    s.lastApiCallTimestamp = now;
    s.apiCallCount++;
    s.apiCallHistory.push({ timestamp: now, dataHash: hash });

    // Trim history to the configured cap (splice is O(n) but history is small).
    if (s.apiCallHistory.length > this.config.maxHistory) {
      s.apiCallHistory.splice(0, s.apiCallHistory.length - this.config.maxHistory);
    }
  }

  /**
   * Record a render for `component`.
   * Emits a dev-mode warning when renders fire faster than `excessiveRenderGapMs`.
   */
  trackRender(component: string): void {
    const now = Date.now();
    const s = this.getOrCreate(component);

    s.renderCount++;

    if (
      isDev() &&
      s.lastRenderTimestamp > 0 &&
      now - s.lastRenderTimestamp < this.config.excessiveRenderGapMs
    ) {
      console.warn(
        `[${component}] Possible excessive re-render — ${now - s.lastRenderTimestamp}ms since last render`
      );
    }

    s.lastRenderTimestamp = now;

    if (isDev()) {
      console.log(`[${component}] Render #${s.renderCount}`);
    }
  }

  /** Returns a point-in-time snapshot for the named component. */
  getStats(component: string): ComponentSnapshot {
    const s = this.getOrCreate(component);
    const now = Date.now();

    const recentCalls = s.apiCallHistory.filter(
      (c) => now - c.timestamp < 10_000
    );

    let averageTimeBetweenCalls = 0;
    if (s.apiCallHistory.length >= 2) {
      const first = s.apiCallHistory[0].timestamp;
      const last = s.apiCallHistory[s.apiCallHistory.length - 1].timestamp;
      averageTimeBetweenCalls = (last - first) / (s.apiCallHistory.length - 1);
    }

    return {
      totalApiCalls: s.apiCallCount,
      totalRenders: s.renderCount,
      recentApiCalls: recentCalls.length,
      averageTimeBetweenCalls,
      lastRenderTimestamp: s.lastRenderTimestamp,
      lastApiCallTimestamp: s.lastApiCallTimestamp,
    };
  }

  /** Returns snapshots for every tracked component. */
  getAllStats(): Record<string, ComponentSnapshot> {
    const result: Record<string, ComponentSnapshot> = {};
    for (const component of this.stats.keys()) {
      result[component] = this.getStats(component);
    }
    return result;
  }

  /**
   * Scans all components and returns structured performance issues.
   * Safe to call in production — does not emit console output.
   */
  getPerformanceIssues(): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    for (const [component, snapshot] of Object.entries(this.getAllStats())) {
      if (
        snapshot.averageTimeBetweenCalls < this.config.rapidCallThresholdMs &&
        snapshot.totalApiCalls >= this.config.rapidCallMinSamples
      ) {
        issues.push({
          component,
          kind: "rapid-calls",
          detail: `Avg ${Math.round(snapshot.averageTimeBetweenCalls)}ms between calls`,
        });
      }

      if (snapshot.recentApiCalls > this.config.highFrequencyThreshold) {
        issues.push({
          component,
          kind: "high-frequency",
          detail: `${snapshot.recentApiCalls} calls in the last 10s`,
        });
      }
    }

    return issues;
  }

  /**
   * Clears stats for a single component, or all components when called with
   * no argument.
   */
  reset(component?: string): void {
    if (component !== undefined) {
      this.stats.delete(component);
    } else {
      this.stats.clear();
    }
  }
}

// ─── React hook ───────────────────────────────────────────────────────────────

/**
 * Thin hook wrapper for `GlobalPerformanceMonitor`.
 *
 * @example
 * const { trackApiCall, trackRender, getStats } = useGlobalPerformanceMonitor("SearchBar");
 */
export function useGlobalPerformanceMonitor(component: string) {
  const monitor = GlobalPerformanceMonitor.getInstance();

  return {
    trackApiCall: (data: unknown) => monitor.trackApiCall(component, data),
    trackRender: () => monitor.trackRender(component),
    getStats: () => monitor.getStats(component),
    getIssues: () =>
      monitor.getPerformanceIssues().filter((i) => i.component === component),
    reset: () => monitor.reset(component),
  };
}

export default GlobalPerformanceMonitor;