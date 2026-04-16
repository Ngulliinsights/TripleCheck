"use strict";
/**
 * Query Monitor - Detects and prevents infinite API queries
 *
 * This utility monitors TanStack Query behavior and provides
 * early warning for potential infinite query loops.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryMonitor = void 0;
exports.setupQueryMonitoring = setupQueryMonitoring;
exports.getQueryMonitor = getQueryMonitor;
var QueryMonitor = /** @class */ (function () {
    function QueryMonitor(queryClient) {
        this.queryClient = queryClient;
        this.metrics = new Map();
        this.INFINITE_LOOP_THRESHOLD = 5; // 5 fetches in rapid succession
        this.RAPID_FETCH_WINDOW = 10000; // 10 seconds
        this.MAX_TRACKED_QUERIES = 100;
        this.setupMonitoring();
    }
    QueryMonitor.prototype.setupMonitoring = function () {
        var _this = this;
        if (process.env.NODE_ENV !== 'development')
            return;
        var queryCache = this.queryClient.getQueryCache();
        queryCache.subscribe(function (event) {
            if (event.type === 'updated' && event.query.state.fetchStatus === 'fetching') {
                _this.trackQuery(event.query.queryKey);
            }
        });
        // Cleanup old metrics periodically
        setInterval(function () {
            _this.cleanupOldMetrics();
        }, 60000); // Every minute
    };
    QueryMonitor.prototype.trackQuery = function (queryKey) {
        var keyString = JSON.stringify(queryKey);
        var now = Date.now();
        var existing = this.metrics.get(keyString);
        if (existing) {
            // Update existing metrics
            var timeSinceLastFetch = now - existing.lastFetch;
            var newFetchCount = existing.fetchCount + 1;
            // Calculate average interval
            var newAverageInterval = (existing.averageInterval + timeSinceLastFetch) / 2;
            // Check for infinite loop pattern
            var isInfiniteLoop = this.detectInfiniteLoop(existing, timeSinceLastFetch);
            this.metrics.set(keyString, {
                queryKey: keyString,
                fetchCount: newFetchCount,
                lastFetch: now,
                averageInterval: newAverageInterval,
                isInfiniteLoop: isInfiniteLoop,
            });
            if (isInfiniteLoop) {
                this.handleInfiniteLoop(keyString, newFetchCount);
            }
        }
        else {
            // Create new metrics entry
            if (this.metrics.size >= this.MAX_TRACKED_QUERIES) {
                this.cleanupOldMetrics();
            }
            this.metrics.set(keyString, {
                queryKey: keyString,
                fetchCount: 1,
                lastFetch: now,
                averageInterval: 0,
                isInfiniteLoop: false,
            });
        }
    };
    QueryMonitor.prototype.detectInfiniteLoop = function (metrics, timeSinceLastFetch) {
        // Check if we have rapid successive fetches
        if (metrics.fetchCount >= this.INFINITE_LOOP_THRESHOLD) {
            // If the last few fetches happened very quickly
            if (timeSinceLastFetch < 1000 && metrics.averageInterval < 2000) {
                return true;
            }
        }
        // Check for consistent rapid fetching over time window
        var fetchesInWindow = this.getFetchesInWindow(metrics);
        return fetchesInWindow >= this.INFINITE_LOOP_THRESHOLD;
    };
    QueryMonitor.prototype.getFetchesInWindow = function (metrics) {
        var now = Date.now();
        var windowStart = now - this.RAPID_FETCH_WINDOW;
        // Estimate fetches in window based on average interval
        if (metrics.averageInterval > 0) {
            var estimatedFetches = this.RAPID_FETCH_WINDOW / metrics.averageInterval;
            return Math.min(estimatedFetches, metrics.fetchCount);
        }
        return metrics.fetchCount;
    };
    QueryMonitor.prototype.handleInfiniteLoop = function (queryKey, fetchCount) {
        console.error("\uD83D\uDEA8 [QueryMonitor] Infinite loop detected for query: ".concat(queryKey));
        console.error("   Fetch count: ".concat(fetchCount));
        console.error("   This query has been fetching repeatedly in a short time window.");
        // Try to cancel the problematic query
        try {
            var parsedKey = JSON.parse(queryKey);
            this.queryClient.cancelQueries({ queryKey: parsedKey });
            console.log("   \u2705 Cancelled query: ".concat(queryKey));
        }
        catch (error) {
            console.error("   \u274C Failed to cancel query: ".concat(error));
        }
        // Provide debugging information
        this.logDebuggingInfo(queryKey);
    };
    QueryMonitor.prototype.logDebuggingInfo = function (queryKey) {
        console.group("\uD83D\uDD0D [QueryMonitor] Debugging info for: ".concat(queryKey));
        var metrics = this.metrics.get(queryKey);
        if (metrics) {
            console.log('Metrics:', {
                fetchCount: metrics.fetchCount,
                averageInterval: "".concat(metrics.averageInterval.toFixed(2), "ms"),
                lastFetch: new Date(metrics.lastFetch).toISOString(),
            });
        }
        // Show all active queries
        var activeQueries = this.queryClient.getQueryCache()
            .getAll()
            .filter(function (q) { return q.state.fetchStatus === 'fetching'; });
        console.log('Active queries:', activeQueries.length);
        activeQueries.forEach(function (query) {
            console.log("  - ".concat(JSON.stringify(query.queryKey)));
        });
        // Show query state
        try {
            var parsedKey = JSON.parse(queryKey);
            var queryState = this.queryClient.getQueryState(parsedKey);
            console.log('Query state:', queryState);
        }
        catch (error) {
            console.log('Could not get query state:', error);
        }
        console.groupEnd();
    };
    QueryMonitor.prototype.cleanupOldMetrics = function () {
        var now = Date.now();
        var maxAge = 5 * 60 * 1000; // 5 minutes
        for (var _i = 0, _a = this.metrics.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], metrics = _b[1];
            if (now - metrics.lastFetch > maxAge) {
                this.metrics.delete(key);
            }
        }
    };
    // Public methods for debugging
    QueryMonitor.prototype.getMetrics = function () {
        return new Map(this.metrics);
    };
    QueryMonitor.prototype.getProblematicQueries = function () {
        return Array.from(this.metrics.values())
            .filter(function (m) { return m.isInfiniteLoop || m.fetchCount > 10; });
    };
    QueryMonitor.prototype.resetMetrics = function (queryKey) {
        if (queryKey) {
            this.metrics.delete(queryKey);
        }
        else {
            this.metrics.clear();
        }
    };
    QueryMonitor.prototype.generateReport = function () {
        var allMetrics = Array.from(this.metrics.values());
        var problematicQueries = this.getProblematicQueries();
        return "\n# Query Monitor Report\n\n## Summary\n- Total tracked queries: ".concat(allMetrics.length, "\n- Problematic queries: ").concat(problematicQueries.length, "\n- Generated at: ").concat(new Date().toISOString(), "\n\n## Problematic Queries\n").concat(problematicQueries.map(function (m) { return "\n### ".concat(m.queryKey, "\n- Fetch count: ").concat(m.fetchCount, "\n- Average interval: ").concat(m.averageInterval.toFixed(2), "ms\n- Last fetch: ").concat(new Date(m.lastFetch).toISOString(), "\n- Infinite loop detected: ").concat(m.isInfiniteLoop ? 'YES' : 'NO', "\n"); }).join('\n'), "\n\n## All Queries (Top 10 by fetch count)\n").concat(allMetrics
            .sort(function (a, b) { return b.fetchCount - a.fetchCount; })
            .slice(0, 10)
            .map(function (m) { return "- ".concat(m.queryKey, ": ").concat(m.fetchCount, " fetches"); })
            .join('\n'), "\n");
    };
    return QueryMonitor;
}());
exports.QueryMonitor = QueryMonitor;
// Global instance for development
var globalQueryMonitor = null;
function setupQueryMonitoring(queryClient) {
    if (process.env.NODE_ENV !== 'development')
        return null;
    if (!globalQueryMonitor) {
        globalQueryMonitor = new QueryMonitor(queryClient);
        // Add to window for debugging
        if (typeof window !== 'undefined') {
            window.__queryMonitor = globalQueryMonitor;
        }
    }
    return globalQueryMonitor;
}
function getQueryMonitor() {
    return globalQueryMonitor;
}
